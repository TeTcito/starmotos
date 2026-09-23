// src/components/SidebarDrawer.tsx
import React, { useEffect } from 'react';
import {
  X,
  User,
  Wrench,
  Clock,
  ShieldCheck,
  History,
  MapPin,
  LogOut,
  Calendar,
  ChevronRight,
  Sparkles,
  Receipt,
  CalendarPlus,
} from 'lucide-react';
import { ClientProfile, Branch } from '../types/customer';

export type ActiveSection =
  | 'eventos'
  | 'agendar_cita'
  | 'perfil'
  | 'mi_moto'
  | 'mantenimientos'
  | 'orden_activa'
  | 'historial'
  | 'garantias';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  profile: ClientProfile;
  activeBranch: Branch;
  onLogout: () => void;
}

export const SidebarDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  profile,
  activeBranch,
  onLogout,
}) => {
  // Bloquear el scroll del body cuando el drawer esté abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const menuItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil',
      label: 'Perfil del Cliente',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'orden_activa',
      label: 'Orden de Trabajo Activa',
      icon: <Clock className="w-4 h-4" />,
      badge: 'En Taller',
    },
    {
      id: 'agendar_cita',
      label: 'Agendar Cita',
      icon: <CalendarPlus className="w-4 h-4" />,
      badge: 'Turnos',
    },
    {
      id: 'eventos',
      label: 'Evento de Facturas',
      icon: <Receipt className="w-4 h-4" />,
      badge: 'SRI',
    },
    {
      id: 'historial',
      label: 'Historial de Servicios y Garantía de Pólizas',
      icon: <History className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
    >
      {/* Backdrop oscuro con desvanecimiento suave */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer con transición suave de izquierda a derecha */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full h-[100dvh] bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 overflow-hidden transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Fijo arriba */}
        <div className="shrink-0 p-3.5 border-b border-[#b8d1ea] flex items-center justify-between bg-blue-700 text-white">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs flex items-center justify-center">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-6 w-auto object-contain"
            />
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-blue-800 hover:bg-blue-900 border border-blue-600 text-blue-100 hover:text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta de Perfil Resumido - Fijo */}
        <div className="shrink-0 p-3 border-b border-[#b8d1ea] bg-white/50">
          <div className="flex items-center gap-2.5">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-600 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-zinc-900 truncate">{profile.fullName}</h3>
              <p className="text-[10px] text-zinc-600 font-mono">C.I: {profile.idNumber}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-800 font-bold">Cliente Verificado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Navegación con Scroll Interno Independiente */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-950/70 px-2.5 py-1 block">
            Módulos del Sistema
          </span>
          {menuItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-800 hover:bg-white/60 hover:text-blue-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={active ? 'text-white' : 'text-blue-700'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      active
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Drawer - Fijo abajo, no se desplaza ni se corta */}
        <div className="shrink-0 p-3 border-t border-[#b8d1ea] space-y-2 bg-[#dce8f5]">
          <div className="px-2.5 py-1.5 rounded-lg bg-white/70 border border-[#b8d1ea] text-[10px] text-zinc-700 shadow-xs">
            <div className="flex items-center gap-1 font-bold text-zinc-900">
              <MapPin className="w-3 h-3 text-red-600 shrink-0" />
              <span className="truncate">{activeBranch.name.replace('StarMotos ', '')}</span>
            </div>
            <p className="truncate text-zinc-600 mt-0.5">{activeBranch.address}</p>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-red-50 border border-zinc-300 hover:border-red-300 text-zinc-700 hover:text-red-700 text-xs font-bold transition active:scale-98 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
