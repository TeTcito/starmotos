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
      className={`sticky top-0 z-30 bg-[#edf9fa]/95 backdrop-blur-md border-b border-[#cdebee] shadow-xs transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Lado Izquierdo: Botón Hamburguesa & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-white hover:bg-cyan-100/60 border border-[#cdebee] text-cyan-900 transition active:scale-95 cursor-pointer shadow-xs"
            aria-label="Abrir Menú"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5 text-blue-600" />
          </button>

          {/* Logo StarMotos */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/starmotos-logo.jpg"
                alt="StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider uppercase">
                <span className="text-blue-600">STAR</span>
                <span className="text-red-600">MOTOS</span>
              </span>
              <span className="text-[10px] text-cyan-800 font-medium border-l border-cyan-300 pl-2 hidden sm:inline">
                {activeSectionTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: WhatsApp, Sucursal y Salir */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-[#cdebee] px-2.5 py-1 rounded-lg text-xs text-cyan-950 font-medium shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate max-w-[140px]">{activeBranch.name.replace('StarMotos ', '')}</span>
          </div>

          <a
            href={`https://wa.me/${activeBranch.whatsapp}?text=${encodeURIComponent(`Hola StarMotos ${activeBranch.name}, soy el cliente ${profile.fullName}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            title="WhatsApp Taller"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-white hover:bg-red-50 hover:text-red-600 border border-[#cdebee] text-zinc-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
