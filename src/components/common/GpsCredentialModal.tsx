// src/components/common/GpsCredentialModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Bike,
  Smartphone,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { GpsRecord } from '../../types/customer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: GpsRecord | null;
  onAssign: (recordId: string, user: string, pass: string) => void;
}

export const GpsCredentialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  onAssign,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      // Si ya tenía usuario/clave, cargarlos; si no, sugerir uno basado en el cliente
      if (record.gpsUser) {
        setUsername(record.gpsUser);
      } else {
        const cleanName = (record.nombres.split(' ')[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanLast = (record.apellidos.split(' ')[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const suggestedUser = cleanName && cleanLast ? `${cleanName}.${cleanLast}` : (record.placa.toLowerCase() || 'cliente.gps');
        setUsername(suggestedUser);
      }

      if (record.gpsPassword) {
        setPassword(record.gpsPassword);
      } else {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setPassword(`MotoGps${rand}*`);
      }
      setError('');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Debes ingresar un nombre de usuario para el cliente.');
      return;
    }
    if (!password.trim()) {
      setError('Debes ingresar una contraseña de acceso.');
      return;
    }
    onAssign(record.id, username.trim(), password.trim());
  };

  const handleGenerateRandomPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`Star${rand}*2026`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 block">
                GPS Servicios • Aprobación
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Asignar Credenciales de Acceso
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido / Resumen Técnico */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ficha rápida de cliente y vehículo */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
              <span className="text-zinc-500 font-medium">Ticket de Solicitud:</span>
              <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {record.ticketNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Cliente</span>
                <span className="font-bold text-zinc-900 block truncate">
                  {record.nombres} {record.apellidos}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">C.I. {record.cedulaRuc}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Vehículo</span>
                <span className="font-bold text-zinc-900 block truncate">
                  {record.modeloMarca}
                </span>
                <span className="text-[11px] font-mono font-bold text-blue-700">
                  Placa: {record.placa || 'EN TRÁMITE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60">
              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Serie de GPS (IMEI)</span>
                <span className="font-mono font-bold text-zinc-900 text-[11px] select-all truncate block">
                  {record.serieGps || 'No registrado'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Serie de Chip (SIM)</span>
                <span className="font-mono font-bold text-zinc-900 text-[11px] select-all truncate block">
                  {record.serieChip || 'No registrado'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1">
              <span>Inicio: <strong>{record.fechaInicio}</strong></span>
              <span>Vence: <strong className="text-amber-700">{record.fechaVencimiento}</strong></span>
            </div>
          </div>

          {/* Formulario de Usuario y Contraseña */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Usuario de Acceso Plataforma GPS</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: juan.perez o pbx8492"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono text-sm outline-none text-zinc-900 bg-white"
                required
              />
              <p className="text-[10px] text-zinc-500">
                Identificador único con el que el cliente ingresará a la app móvil de rastreo.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Contraseña Asignada</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPass}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generar aleatoria</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ej: MotoGps2026*"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono text-sm outline-none text-zinc-900 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                La contraseña quedará disponible inmediatamente para que Matriz la visualice y entregue al cliente.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-extrabold shadow-md shadow-sky-500/25 flex items-center gap-2 cursor-pointer transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar y Guardar Credenciales</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
