import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Claves de almacenamiento
const STORAGE_KEYS = {
  installed: 'starmotos_pwa_installed',
  dismissedUntil: 'starmotos_pwa_dismissed_until',
  dismissedSession: 'starmotos_pwa_dismissed',
} as const;

// Tiempo de snooze al descartar la tarjeta manualmente: 24 horas
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000;

// Delay antes de mostrar la tarjeta (ms) para que la página cargue limpiamente
const APPEARANCE_DELAY_MS = 1800;

/**
 * 1. Verifica si la PWA ya está corriendo como app instalada (modo standalone / pantalla completa).
 */
function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // Chromium / Edge / Android
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  // iOS Safari
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  // Android TWA (Trusted Web Activity) / WebAPK
  if (document.referrer.includes('android-app://')) return true;
  return false;
}

/**
 * 2. Verifica con la API getInstalledRelatedApps() si el dispositivo ya tiene la PWA instalada
 * (disponible en Chrome / Edge en Android y PC).
 */
async function checkInstalledRelatedApps(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    if ('getInstalledRelatedApps' in navigator) {
      const relatedApps = await (navigator as any).getInstalledRelatedApps();
      if (Array.isArray(relatedApps) && relatedApps.length > 0) {
        return true;
      }
    }
  } catch {
    // Si no es soportada o falla, continuar
  }
  return false;
}

/**
 * Lectura segura de localStorage.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Escritura segura en localStorage.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado / cuota
  }
}

/**
 * Lectura segura de sessionStorage.
 */
function safeSessionGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Escritura segura en sessionStorage.
 */
function safeSessionSetItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Modo privado / cuota
  }
}

/**
 * Detecta tipo de dispositivo (móvil vs escritorio, iOS vs Android/otros).
 */
function detectDevice(): { isMobile: boolean; isIOS: boolean } {
  if (typeof window === 'undefined') return { isMobile: true, isIOS: false };
  const ua = (window.navigator.userAgent || '').toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  const isIOS = /iphone|ipad|ipod/.test(ua);
  return { isMobile: isMobileUA || window.innerWidth < 768, isIOS };
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    // Inicializar si el evento ya fue capturado globalmente en index.html
    return typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt || null : null;
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [manualInstructions, setManualInstructions] = useState<'ios' | 'desktop' | 'android' | null>(null);

  // Marcar la app como instalada y ocultar tarjeta
  const markAsInstalled = useCallback(() => {
    setIsInstalled(true);
    setIsVisible(false);
    safeSetItem(STORAGE_KEYS.installed, 'true');
  }, []);

  useEffect(() => {
    // ─── PASO 1: Si ya está abierta como PWA standalone → NO mostrar nunca ───
    if (isRunningStandalone()) {
      markAsInstalled();
      return;
    }

    // ─── PASO 2: Identificar dispositivo ───
    const device = detectDevice();
    setIsIOS(device.isIOS);
    setIsMobile(device.isMobile);

    // ─── PASO 3: Verificar instalación real en el dispositivo ───
    // Si localStorage decía "installed" pero NO estamos en standalone,
    // comprobar con la API nativa si realmente sigue instalada en el SO.
    // Si el usuario la desinstaló, limpiamos la marca para permitir instalarla de nuevo.
    const storedInstalled = safeGetItem(STORAGE_KEYS.installed);
    if (storedInstalled === 'true') {
      checkInstalledRelatedApps().then((confirmed) => {
        if (!confirmed) {
          // No está instalada en el sistema → limpiar la marca antigua
          safeSetItem(STORAGE_KEYS.installed, '');
        } else {
          // Confirmada instalación nativa por el navegador
          markAsInstalled();
        }
      });
    }

    // ─── PASO 4: Respetar descartes recientes por el usuario ───
    const dismissedUntil = safeGetItem(STORAGE_KEYS.dismissedUntil);
    const isSnoozed = dismissedUntil && Date.now() < Number(dismissedUntil);
    const dismissedInSession = safeSessionGetItem(STORAGE_KEYS.dismissedSession);

    if (isSnoozed || dismissedInSession) {
      return;
    }

    // ─── PASO 5: Escuchar evento nativo "appinstalled" ───
    const handleAppInstalled = () => {
      markAsInstalled();
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // ─── PASO 6: Escuchar eventos de prompt para instalación ───
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReadyCustom = () => {
      if ((window as any).__pwaInstallPrompt) {
        setDeferredPrompt((window as any).__pwaInstallPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('starmotos_pwa_prompt_ready', handlePromptReadyCustom);

    // ─── PASO 7: Comprobar instalación con API y mostrar la tarjeta ───
    let appearanceTimer: ReturnType<typeof setTimeout>;

    checkInstalledRelatedApps().then((alreadyInstalled) => {
      if (alreadyInstalled) {
        markAsInstalled();
        return;
      }

      appearanceTimer = setTimeout(() => {
        // Doble verificación al momento de mostrar
        if (isRunningStandalone()) {
          markAsInstalled();
          return;
        }

        const freshInstalled = safeGetItem(STORAGE_KEYS.installed);
        if (freshInstalled === 'true') return;

        const freshSessionDismissed = safeSessionGetItem(STORAGE_KEYS.dismissedSession);
        if (freshSessionDismissed) return;

        const freshDismissedUntil = safeGetItem(STORAGE_KEYS.dismissedUntil);
        if (freshDismissedUntil && Date.now() < Number(freshDismissedUntil)) return;

        setIsVisible(true);
      }, APPEARANCE_DELAY_MS);
    });

    // ─── PASO 8: Observar si el modo standalone cambia en tiempo real ───
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        markAsInstalled();
      }
    };
    standaloneQuery.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('starmotos_pwa_prompt_ready', handlePromptReadyCustom);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayChange);
      if (appearanceTimer) clearTimeout(appearanceTimer);
    };
  }, [markAsInstalled]);

  // ─── Descartar / Cerrar tarjeta ───
  const handleDismiss = useCallback((userAction = false) => {
    setIsVisible(false);
    safeSessionSetItem(STORAGE_KEYS.dismissedSession, 'true');
    if (userAction) {
      // Snooze por 24 horas si el usuario pulsó "X" o "Ahora no"
      safeSetItem(STORAGE_KEYS.dismissedUntil, String(Date.now() + SNOOZE_DURATION_MS));
    }
  }, []);

  // ─── Acción del botón "Instalar App" ───
  const handleInstallClick = async () => {
    // Si tenemos el prompt nativo (Chromium en Android/Desktop/Edge)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          markAsInstalled();
        }
        setDeferredPrompt(null);
        (window as any).__pwaInstallPrompt = null;
      } catch (err) {
        console.error('Error al invocar instalación PWA:', err);
      }
      handleDismiss(true);
      return;
    }

    // Si es iOS Safari (no soporta beforeinstallprompt nativo)
    if (isIOS) {
      setManualInstructions('ios');
      return;
    }

    // Si es navegador de escritorio sin prompt directo
    if (!isMobile) {
      setManualInstructions('desktop');
      return;
    }

    // Android / móvil sin prompt disponible
    setManualInstructions('android');
  };

  // No renderizar si ya está instalada o no es visible
  if (isInstalled || !isVisible) return null;

  return (
    <aside
      aria-label="Instalación de la aplicación StarMotos"
      className={`fixed z-50 animate-slide-up ${
        isMobile
          ? 'bottom-4 left-4 right-4'
          : 'bottom-6 right-6 w-[400px]'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-blue-200/90 rounded-2xl shadow-2xl p-4 text-zinc-800 transition-all duration-300">
        <div className="flex items-start gap-3">
          {/* Logo / Ícono de la App */}
          <div className="relative shrink-0">
            <img
              src="/starmotos-logo.jpg"
              alt="StarMotos App"
              className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow">
              {isMobile ? (
                <Smartphone className="w-3.5 h-3.5" />
              ) : (
                <Monitor className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                  Instalar StarMotos
                </h4>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  {isMobile ? 'Aplicación Móvil Oficial' : 'Aplicación de Escritorio'}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(true)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              {isMobile
                ? 'Instala la app en tu celular para seguimiento en tiempo real de tu moto y acceso directo desde tu pantalla de inicio.'
                : 'Instala la app en tu computadora para acceso rápido con ventana independiente y seguimiento en tiempo real.'}
            </p>

            {/* Instrucciones visuales paso a paso según dispositivo */}
            {manualInstructions === 'ios' && (
              <div className="mt-2.5 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-700">
                  <Info className="w-3.5 h-3.5" />
                  <span>Cómo instalar en iPhone / iPad:</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 ml-1 text-zinc-700">
                  <li>
                    Pulsa el botón <strong>Compartir</strong>{' '}
                    <span className="inline-block align-middle">
                      <svg className="w-3.5 h-3.5 inline text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </span>{' '}
                    en Safari.
                  </li>
                  <li>
                    Desliza hacia abajo y elige <strong>"Agregar al inicio"</strong>.
                  </li>
                  <li>Pulsa <strong>"Agregar"</strong> en la esquina superior derecha.</li>
                </ol>
              </div>
            )}

            {manualInstructions === 'desktop' && (
              <div className="mt-2.5 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-700">
                  <Info className="w-3.5 h-3.5" />
                  <span>Cómo instalar en tu navegador:</span>
                </div>
                <p className="text-zinc-700">
                  Haz clic en el ícono de instalación <strong>(⊕ o pantalla con flecha)</strong> ubicado en la barra de direcciones de tu navegador, o ve al menú (tres puntos ⋮) y selecciona <strong>"Instalar StarMotos"</strong>.
                </p>
              </div>
            )}

            {manualInstructions === 'android' && (
              <div className="mt-2.5 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-700">
                  <Info className="w-3.5 h-3.5" />
                  <span>Cómo instalar en tu celular:</span>
                </div>
                <p className="text-zinc-700">
                  Abre el menú de tu navegador (tres puntos ⋮ en la esquina superior) y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar App
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="px-3 py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
