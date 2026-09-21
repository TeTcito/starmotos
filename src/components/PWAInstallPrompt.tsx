import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

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
    // Verificar si ya está corriendo en modo standalone (PWA ya instalada)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar si ya se descartó en esta sesión
    const isDismissed = sessionStorage.getItem('starmotos_pwa_dismissed');
    if (isDismissed) {
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Escuchar el evento estándar de instalación PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Si después de 1.8 segundos no se ha disparado (o en navegadores/móviles compatibles),
    // mostrar la tarjeta flotante para ofrecer la descarga/instalación
    const appearanceTimer = setTimeout(() => {
      if (!isStandalone && !sessionStorage.getItem('starmotos_pwa_dismissed')) {
        setIsVisible(true);
      }
    }, 1800);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(appearanceTimer);
    };
  }, []);

  // Temporizador para que la tarjeta desaparezca automáticamente después de un momento (~9 segundos)
  useEffect(() => {
    if (!isVisible) return;

    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 9500);

    return () => clearTimeout(autoDismissTimer);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('starmotos_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al solicitar instalación PWA:', err);
      }
      handleDismiss();
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // Navegadores de escritorio o móviles sin prompt diferido disponible
      alert('Para instalar StarMotos: En el menú de tu navegador selecciona "Instalar aplicación" o "Agregar a pantalla principal".');
      handleDismiss();
    }
  };

  if (isInstalled || !isVisible) return null;

  return (
    <aside 
      aria-label="Instalación de la aplicación"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce-subtle"
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
                // Fallback visual si no carga la imagen
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
                  Aplicación Web Progresiva
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Descarga e instala la app en tu dispositivo para seguimiento en tiempo real y acceso rápido.
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
                Descargar e Instalar
              </button>
              <button
                onClick={handleDismiss}
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
