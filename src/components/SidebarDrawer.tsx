// src/components/SidebarDrawer.tsx
import React from 'react';
import {
  X,
  User,
  Wrench,
  Clock,
  ShieldCheck,
  History,
  MapPin,
  Phone,
  LogOut,
  CalendarCheck,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ClientProfile, Branch } from '../types/customer';

export type ActiveSection = 'perfil' | 'orden_activa' | 'inspeccion' | 'historial' | 'garantias';

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
  if (!isOpen) return null;

  const menuItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil',
      label: 'Mi Perfil & Mantenimientos',
      icon: <User className="w-4 h-4" />,
      badge: 'Principal',
    },
    {
      id: 'orden_activa',
      label: 'Orden de Trabajo Activa',
      icon: <Clock className="w-4 h-4" />,
      badge: 'En Taller',
    },
    {
      id: 'inspeccion',
      label: 'Inspección 360° & Firma',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'historial',
      label: 'Historial de Mantenimientos',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'garantias',
      label: 'Garantías y Pólizas',
      icon: <CalendarCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop oscuro */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Desplegable */}
      <aside className="relative w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 h-full flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
        <div>
          {/* Header del Drawer */}
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/starmotos-logo.jpg"
                  alt="StarMotos"
                  className="w-full h-full object-cover rounded-full bg-white"
                />
              </div>
              <div>
                <span className="text-sm font-black tracking-wider uppercase text-white">
                  STAR<span className="text-red-500">MOTOS</span>
                </span>
                <span className="text-[10px] text-zinc-400 block -mt-0.5">Menú del Cliente</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition"
              title="Cerrar Menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta de Perfil Resumido */}
          <div className="p-4 border-b border-zinc-850 bg-gradient-to-br from-zinc-900/90 to-zinc-950">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate">{profile.fullName}</h3>
                <p className="text-[10px] text-zinc-400 font-mono">C.I: {profile.idNumber}</p>
                <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Cliente Registrado
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Navegación */}
          <nav className="p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 px-3 block mb-1">
              Secciones del Portal
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
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-white' : 'text-blue-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        active
                          ? 'bg-white text-blue-700'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Drawer: Sucursal y Botón Cerrar Sesión */}
        <div className="p-4 border-t border-zinc-850 space-y-3 bg-zinc-950">
          <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200 mb-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{activeBranch.name}</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">{activeBranch.address}</p>
            <a
              href={`tel:${activeBranch.phone}`}
              className="mt-1 text-[10px] text-blue-400 font-mono block hover:underline"
            >
              {activeBranch.phone}
            </a>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold transition active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
