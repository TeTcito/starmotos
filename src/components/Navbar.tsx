// src/components/Navbar.tsx
import React from 'react';
import { Menu, MapPin, User, LogOut, MessageCircle } from 'lucide-react';
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
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-850 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Lado Izquierdo: Botón Hamburguesa & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Abrir Menú Lateral"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5 text-blue-400" />
          </button>

          {/* Logo StarMotos */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/starmotos-logo.jpg"
                alt="StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black tracking-wider uppercase text-white">
                  STAR<span className="text-red-500">MOTOS</span>
                </span>
                <span className="text-[9px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                  Portal
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:inline-block">
                {activeSectionTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Sucursal, WhatsApp y Perfil */}
        <div className="flex items-center gap-2.5">
          {/* Sucursal asignada */}
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-medium truncate max-w-[150px]">{activeBranch.name.replace('StarMotos ', '')}</span>
          </div>

          {/* WhatsApp Directo */}
          <a
            href={`https://wa.me/${activeBranch.whatsapp}?text=${encodeURIComponent(`Hola StarMotos ${activeBranch.name}, soy el cliente ${profile.fullName}. Tengo una consulta sobre mi motocicleta.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
            title="Chat con el taller"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp Taller</span>
          </a>

          {/* Botón Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
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
