import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. RESTRICCIÓN: Solo mostrar en vista de celular (móvil), NUNCA en escritorio
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
    const isMobileScreen = window.innerWidth < 768;
    const isMobile = isMobileUA || isMobileScreen;

    if (!isMobile) {
      return; // En pantallas de escritorio o laptops no ejecutar ni mostrar
    }

    // 2. Comprobar si ya está corriendo en modo standalone (PWA ya abierta como app independiente)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      try {
        localStorage.setItem('starmotos_pwa_installed', 'true');
      } catch (e) {}
      return;
    }

    // 3. Comprobar si en este dispositivo ya se instaló previamente (marcado en localStorage)
    try {
      if (localStorage.getItem('starmotos_pwa_installed') === 'true') {
        setIsInstalled(true);
        return;
      }
    } catch (e) {}

    // 4. Comprobar si el usuario ya cerró o descartó la notificación recientemente
    try {
      const dismissedUntil = localStorage.getItem('starmotos_pwa_dismissed_until');
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return;
      }
      if (sessionStorage.getItem('starmotos_pwa_dismissed')) {
        return;
      }
    } catch (e) {}

    // 5. Detectar iOS
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 6. Verificar con la API getInstalledRelatedApps() de Chrome/Android si ya está instalada en el dispositivo
    const checkInstalledRelatedApps = async (): Promise<boolean> => {
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            localStorage.setItem('starmotos_pwa_installed', 'true');
            setIsInstalled(true);
            return true;
          }
        } catch (err) {
          console.debug('getInstalledRelatedApps check:', err);
        }
      }
      return false;
    };

    // 7. Escuchar el evento nativo de app instalada para registrarlo permanentemente
    const handleAppInstalled = () => {
      try {
        localStorage.setItem('starmotos_pwa_installed', 'true');
      } catch (e) {}
      setIsInstalled(true);
      setIsVisible(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 8. Escuchar el evento estándar de instalación PWA (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Comprobar estado y mostrar la tarjeta tras unos momentos si realmente NO está instalada
    let appearanceTimer: ReturnType<typeof setTimeout>;
    checkInstalledRelatedApps().then((alreadyInstalled) => {
      if (alreadyInstalled) return;

      appearanceTimer = setTimeout(() => {
        try {
          const installedInStorage = localStorage.getItem('starmotos_pwa_installed') === 'true';
          const dismissedInSession = sessionStorage.getItem('starmotos_pwa_dismissed');
          const dismissedUntilTime = localStorage.getItem('starmotos_pwa_dismissed_until');
          const isSnoozed = dismissedUntilTime && Date.now() < Number(dismissedUntilTime);

          if (!isStandalone && !installedInStorage && !dismissedInSession && !isSnoozed) {
            setIsVisible(true);
          }
        } catch (e) {
          setIsVisible(true);
        }
      }, 2200);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (appearanceTimer) clearTimeout(appearanceTimer);
    };
  }, []);

  // Temporizador para auto-ocultar la tarjeta si no interactúa
  useEffect(() => {
    if (!isVisible) return;

    const autoDismissTimer = setTimeout(() => {
      handleDismiss(false);
    }, 10000);

    return () => clearTimeout(autoDismissTimer);
  }, [isVisible]);

  const handleDismiss = (userAction = false) => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('starmotos_pwa_dismissed', 'true');
      if (userAction) {
        // Si el usuario presiona "X" o "Ahora no", no volver a molestar por 14 días
        localStorage.setItem('starmotos_pwa_dismissed_until', String(Date.now() + 14 * 24 * 60 * 60 * 1000));
      }
    } catch (e) {}
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('starmotos_pwa_installed', 'true');
          } catch (e) {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al solicitar instalación PWA:', err);
      }
      handleDismiss(true);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      alert('Para instalar StarMotos: En el menú de tu navegador (tres puntos ⋮) pulsa "Instalar aplicación" o "Agregar a la pantalla principal".');
      handleDismiss(true);
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <aside 
      aria-label="Instalación de la aplicación"
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 animate-bounce-subtle"
    >
      <div className="bg-white/95 backdrop-blur-md border border-blue-200/90 rounded-2xl shadow-2xl p-4 text-zinc-800 transition-all duration-300 transform">
        {/* Barra superior de progreso de auto-cierre */}
        <div className="w-full bg-blue-100/60 h-1 rounded-full overflow-hidden mb-3">
          <div className="bg-blue-600 h-full w-full animate-shrink" />
        </div>

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
              <Smartphone className="w-3 h-3" />
            </div>
          </div>

          {/* Información */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                  Instalar StarMotos
                </h4>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                  Aplicación Móvil Oficial
                </p>
              </div>
              <button
                onClick={() => handleDismiss(true)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Instala la app en tu celular para seguimiento en tiempo real de tu moto y acceso directo desde tu pantalla de inicio.
            </p>

            {/* Instrucción especial iOS si se solicita */}
            {showIOSInstructions && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-start gap-1.5">
                <span className="font-bold">iOS:</span> Pulsa el botón "Compartir" en Safari y elige "Agregar al inicio".
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar App
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="px-2.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
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
