// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Menu, MapPin, LogOut, MessageCircle } from 'lucide-react';
import { ClientProfile, Branch } from '../types/customer';

interface Props {
  onToggleSidebar: () => void;
  profile: ClientProfile;
  activeBranch: Branch;
  onLogout: () => void;
  activeSectionTitle: string;
}

export const Navbar: React.FC<Props> = ({
  onToggleSidebar,
  profile,
  activeBranch,
  onLogout,
  activeSectionTitle,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si está arriba del todo, siempre visible
      if (currentScrollY < 15) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 70) {
        // Scroleando hacia abajo -> ocultar
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scroleando hacia arriba -> mostrar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-850 shadow-md transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Lado Izquierdo: Botón Hamburguesa & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Abrir Menú"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5 text-blue-400" />
          </button>

          {/* Logo StarMotos */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/starmotos-logo.jpg"
                alt="StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider uppercase text-white">
                STAR<span className="text-red-500">MOTOS</span>
              </span>
              <span className="text-[10px] text-zinc-400 border-l border-zinc-750 pl-2 hidden sm:inline">
                {activeSectionTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: WhatsApp, Sucursal y Salir */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-medium truncate max-w-[140px]">{activeBranch.name.replace('StarMotos ', '')}</span>
          </div>

          <a
            href={`https://wa.me/${activeBranch.whatsapp}?text=${encodeURIComponent(`Hola StarMotos ${activeBranch.name}, soy el cliente ${profile.fullName}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
            title="WhatsApp Taller"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
