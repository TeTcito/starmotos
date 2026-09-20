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
} from 'lucide-react';
import { ClientProfile, Branch } from '../types/customer';

export type ActiveSection =
  | 'perfil'
  | 'mi_moto'
  | 'mantenimientos'
  | 'orden_activa'
  | 'inspeccion'
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

  if (!isOpen) return null;

  const menuItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil',
      label: 'Perfil',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'mi_moto',
      label: 'Mi Moto',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'mantenimientos',
      label: 'Mantenimientos',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'orden_activa',
      label: 'Orden Activa',
      icon: <Clock className="w-4 h-4" />,
      badge: 'Taller',
    },
    {
      id: 'inspeccion',
      label: 'Inspección 360°',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'garantias',
      label: 'Garantías',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop oscuro */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer con altura anclada fija a viewport (h-[100dvh]) sin deformaciones */}
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] h-full h-[100dvh] bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between shadow-2xl z-10 animate-slide-in overflow-hidden">
        {/* Header - Fijo arriba */}
        <div className="shrink-0 p-3.5 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/starmotos-logo.jpg"
                alt="StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <span className="text-xs font-black tracking-wider uppercase">
              <span className="text-blue-500">STAR</span><span className="text-red-500">MOTOS</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta de Perfil Resumido - Fijo */}
        <div className="shrink-0 p-3 border-b border-zinc-850 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-9 h-9 rounded-full object-cover border border-blue-500 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-white truncate">{profile.fullName}</h3>
              <p className="text-[10px] text-zinc-400 font-mono">C.I: {profile.idNumber}</p>
            </div>
          </div>
        </div>

        {/* Lista de Navegación con Scroll Interno Independiente */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 px-2.5 py-1 block">
            Menú
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
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={active ? 'text-white' : 'text-blue-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      active
                        ? 'bg-white text-blue-700'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Drawer - Fijo abajo, no se desplaza ni se corta */}
        <div className="shrink-0 p-3 border-t border-zinc-850 space-y-2 bg-zinc-950">
          <div className="px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-850 text-[10px] text-zinc-400">
            <div className="flex items-center gap-1 font-bold text-zinc-200">
              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate">{activeBranch.name.replace('StarMotos ', '')}</span>
            </div>
            <p className="truncate text-zinc-500 mt-0.5">{activeBranch.address}</p>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold transition active:scale-98 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
