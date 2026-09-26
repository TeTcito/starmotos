import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Info,
  Shield,
  Wrench,
  Award,
  Bike,
  Radio,
} from 'lucide-react';
import { UserRole } from '../types/customer';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Tiempo de snooze al descartar la tarjeta manualmente: 24 horas
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000;

// Delay antes de mostrar la tarjeta (ms) para que la página cargue limpiamente
const APPEARANCE_DELAY_MS = 1500;

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

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado / cuota
  }
}

function safeSessionGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

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

/**
 * Actualiza dinámicamente el manifest en el DOM según el rol activo para que la
 * instalación cree el acceso directo y la app correspondiente a ese rol.
 */
export function updateWebManifestForRole(role: UserRole) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  const manifestMap: Record<UserRole, string> = {
    admin: '/manifest-admin.json',
    taller: '/manifest-taller.json',
    garante: '/manifest-garante.json',
    gps: '/manifest-admin.json',
    cliente: '/manifest-cliente.json',
  };

  const targetHref = manifestMap[role] || '/manifest.json';
  if (link.getAttribute('href') !== targetHref) {
    link.setAttribute('href', targetHref);
  }

  // Actualizar meta apple-mobile-web-app-title
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  const titles: Record<UserRole, string> = {
    admin: 'StarMotos Admin',
    taller: 'StarMotos Taller',
    garante: 'StarMotos Garantías',
    gps: 'StarMotos GPS Servicios',
    cliente: 'StarMotos Clientes',
  };
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', titles[role] || 'StarMotos');
  }
}

/**
 * Detecta el rol activo a partir de las props, la URL (pathname, hash, search) o el almacenamiento local.
 */
export function detectActiveRole(propRole?: UserRole): UserRole {
  if (propRole && ['admin', 'taller', 'garante', 'cliente', 'gps'].includes(propRole)) {
    return propRole;
  }
  if (typeof window === 'undefined') return 'cliente';

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  // 1. Detección por Query Params (?portal=admin o ?role=admin)
  if (search.includes('portal=admin') || search.includes('role=admin')) return 'admin';
  if (search.includes('portal=taller') || search.includes('role=taller')) return 'taller';
  if (
    search.includes('portal=marca') ||
    search.includes('portal=garante') ||
    search.includes('portal=garantia') ||
    search.includes('role=garante')
  ) {
    return 'garante';
  }
  if (search.includes('portal=cliente') || search.includes('role=cliente')) return 'cliente';

  // 2. Detección por Hash
  if (hash.includes('admin') || hash.includes('talleres') || hash.includes('alistamiento')) return 'admin';
  if (hash.includes('taller') || hash.includes('perfil_taller') || hash.includes('ordenes')) return 'taller';
  if (hash.includes('marca') || hash.includes('garante') || hash.includes('solicitudes_garante') || hash.includes('garantia')) return 'garante';
  if (hash.includes('cliente') || hash.includes('eventos')) return 'cliente';

  // 3. Detección por Pathname
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/taller')) return 'taller';
  if (path.includes('/marca') || path.includes('/garante') || path.includes('/garantia')) return 'garante';
  if (path.includes('/cliente')) return 'cliente';

  // 4. Último rol guardado
  const savedRole = localStorage.getItem('starmotos_role') as UserRole;
  if (savedRole && ['admin', 'taller', 'garante', 'cliente'].includes(savedRole)) {
    return savedRole;
  }
  const prefRole = localStorage.getItem('starmotos_preferred_login_role') as UserRole;
  if (prefRole && ['admin', 'taller', 'garante', 'cliente'].includes(prefRole)) {
    return prefRole;
  }

  return 'cliente';
}

interface RoleConfig {
  title: string;
  subtitle: string;
  badgeClass: string;
  mobileDesc: string;
  desktopDesc: string;
  buttonText: string;
  themeColor: string;
  icon: React.ReactNode;
}

const ROLE_PWA_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    title: 'Instalar StarMotos Administración',
    subtitle: 'Módulo Matriz Central',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    mobileDesc:
      'Instala la app en tu celular para gestionar sedes, talleres, garantías y alistamientos con acceso directo e independiente.',
    desktopDesc:
      'Instala la app en tu computadora para acceso rápido con ventana independiente y control total de la red StarMotos.',
    buttonText: 'Instalar Módulo Matriz',
    themeColor: '#2563eb',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  taller: {
    title: 'Instalar StarMotos Taller',
    subtitle: 'Módulo Jefe de Taller',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    mobileDesc:
      'Instala la app en tu celular o tablet de taller para gestionar órdenes de trabajo, alistamientos PDI y garantías técnicas.',
    desktopDesc:
      'Instala la app en tu computadora de taller para control ágil de órdenes de trabajo, alistamientos e inventario.',
    buttonText: 'Instalar Módulo Taller',
    themeColor: '#059669',
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  garante: {
    title: 'Instalar StarMotos Garantías',
    subtitle: 'Garante Oficial de Marca',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    mobileDesc:
      'Instala la app en tu celular para auditar reclamos técnicos, emitir dictámenes oficiales y gestionar despachos de repuestos.',
    desktopDesc:
      'Instala la app en tu computadora para auditoría técnica en tiempo real y dictamen oficial de garantías de marca.',
    buttonText: 'Instalar Módulo Garantías',
    themeColor: '#7c3aed',
    icon: <Award className="w-3.5 h-3.5" />,
  },
  cliente: {
    title: 'Instalar StarMotos Clientes',
    subtitle: 'Portal del Propietario',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    mobileDesc:
      'Instala la app en tu celular para seguimiento en tiempo real de tu moto y acceso directo desde tu pantalla de inicio.',
    desktopDesc:
      'Instala la app en tu computadora para acceso rápido con ventana independiente y seguimiento en tiempo real.',
    buttonText: 'Instalar App Clientes',
    themeColor: '#2563eb',
    icon: <Bike className="w-3.5 h-3.5" />,
  },
  gps: {
    title: 'Instalar StarMotos GPS Servicios',
    subtitle: 'Portal de Monitoreo y Credenciales',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    mobileDesc:
      'Instala la app en tu celular para auditar dispositivos GPS y emitir credenciales de acceso satelital.',
    desktopDesc:
      'Instala la app en tu computadora para acceso rápido a las solicitudes satelitales de la red.',
    buttonText: 'Instalar Portal GPS',
    themeColor: '#0891b2',
    icon: <Radio className="w-3.5 h-3.5" />,
  },
};

export interface PWAInstallPromptProps {
  currentRole?: UserRole;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ currentRole }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? (window as any).__pwaInstallPrompt || null : null;
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [manualInstructions, setManualInstructions] = useState<'ios' | 'desktop' | 'android' | null>(null);

  // Rol activo (detectado de props o URL)
  const activeRole = useMemo(() => detectActiveRole(currentRole), [currentRole]);
  const roleConfig = useMemo(() => ROLE_PWA_CONFIGS[activeRole] || ROLE_PWA_CONFIGS.cliente, [activeRole]);

  // Claves de almacenamiento por rol para no interferir entre perfiles
  const roleStorageKeys = useMemo(
    () => ({
      installed: `starmotos_pwa_installed_${activeRole}`,
      dismissedUntil: `starmotos_pwa_dismissed_until_${activeRole}`,
      dismissedSession: `starmotos_pwa_dismissed_${activeRole}`,
    }),
    [activeRole]
  );

  // Marcar la app del rol como instalada y ocultar tarjeta
  const markAsInstalled = useCallback(() => {
    setIsInstalled(true);
    setIsVisible(false);
    safeSetItem(roleStorageKeys.installed, 'true');
  }, [roleStorageKeys.installed]);

  useEffect(() => {
    // Sincronizar manifest correspondiente al rol activo
    updateWebManifestForRole(activeRole);

    // ─── PASO 1: Si ya está abierta como PWA standalone → NO mostrar ───
    if (isRunningStandalone()) {
      markAsInstalled();
      return;
    }

    // ─── PASO 2: Identificar dispositivo ───
    const device = detectDevice();
    setIsIOS(device.isIOS);
    setIsMobile(device.isMobile);

    // ─── PASO 3: Verificar instalación previa para ESTE rol ───
    const storedInstalled = safeGetItem(roleStorageKeys.installed);
    if (storedInstalled === 'true') {
      checkInstalledRelatedApps().then((confirmed) => {
        if (!confirmed) {
          safeSetItem(roleStorageKeys.installed, '');
        } else {
          markAsInstalled();
        }
      });
    }

    // ─── PASO 4: Respetar descartes recientes por el usuario para ESTE rol ───
    const dismissedUntil = safeGetItem(roleStorageKeys.dismissedUntil);
    const isSnoozed = dismissedUntil && Date.now() < Number(dismissedUntil);
    const dismissedInSession = safeSessionGetItem(roleStorageKeys.dismissedSession);

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
      if (alreadyInstalled && storedInstalled === 'true') {
        markAsInstalled();
        return;
      }

      appearanceTimer = setTimeout(() => {
        if (isRunningStandalone()) {
          markAsInstalled();
          return;
        }

        const freshInstalled = safeGetItem(roleStorageKeys.installed);
        if (freshInstalled === 'true') return;

        const freshSessionDismissed = safeSessionGetItem(roleStorageKeys.dismissedSession);
        if (freshSessionDismissed) return;

        const freshDismissedUntil = safeGetItem(roleStorageKeys.dismissedUntil);
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
  }, [activeRole, markAsInstalled, roleStorageKeys]);

  // ─── Descartar / Cerrar tarjeta ───
  const handleDismiss = useCallback(
    (userAction = false) => {
      setIsVisible(false);
      safeSessionSetItem(roleStorageKeys.dismissedSession, 'true');
      if (userAction) {
        safeSetItem(roleStorageKeys.dismissedUntil, String(Date.now() + SNOOZE_DURATION_MS));
      }
    },
    [roleStorageKeys]
  );

  // ─── Acción del botón "Instalar App" ───
  const handleInstallClick = async () => {
    // Asegurar manifest del rol
    updateWebManifestForRole(activeRole);
    safeSetItem('starmotos_preferred_login_role', activeRole);

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
      aria-label={`Instalación de la aplicación ${roleConfig.title}`}
      className={`fixed z-50 animate-slide-up ${
        isMobile ? 'bottom-4 left-4 right-4' : 'bottom-6 right-6 w-[410px]'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-2xl p-4 text-zinc-800 transition-all duration-300">
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
              {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                  {roleConfig.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleConfig.badgeClass}`}
                  >
                    {roleConfig.icon}
                    <span>{roleConfig.subtitle}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {isMobile ? 'Móvil' : 'Escritorio'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(true)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              {isMobile ? roleConfig.mobileDesc : roleConfig.desktopDesc}
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
                      <svg
                        className="w-3.5 h-3.5 inline text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
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
                  Haz clic en el ícono de instalación <strong>(⊕ o pantalla con flecha)</strong> ubicado en la barra de
                  direcciones de tu navegador, o ve al menú (tres puntos ⋮) y selecciona{' '}
                  <strong>"{roleConfig.buttonText}"</strong>.
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
                  Abre el menú de tu navegador (tres puntos ⋮ en la esquina superior) y selecciona{' '}
                  <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
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
                <span>{roleConfig.buttonText}</span>
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
