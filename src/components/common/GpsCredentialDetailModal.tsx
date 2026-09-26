// src/components/common/GpsCredentialDetailModal.tsx
import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  Calendar,
  Bike,
  User,
  Radio,
} from 'lucide-react';
import { GpsRecord } from '../../types/customer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: GpsRecord | null;
}

export const GpsCredentialDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<'celular1' | 'celular2' | 'celular3'>('celular1');

  if (!isOpen || !record) return null;

  const handleCopy = (text: string, type: 'user' | 'pass') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const cleanPhone = (phoneStr: string): string => {
    let clean = (phoneStr || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '593' + clean.slice(1);
    } else if (!clean.startsWith('593') && clean.length === 9) {
      clean = '593' + clean;
    }
    return clean;
  };

  const getTargetPhone = (): string => {
    if (selectedPhone === 'celular2' && record.celular2) return record.celular2;
    if (selectedPhone === 'celular3' && record.celular3) return record.celular3;
    return record.celular1 || '';
  };

  const handleSendWhatsApp = () => {
    const rawPhone = getTargetPhone();
    const phone = cleanPhone(rawPhone);
    const text = encodeURIComponent(
      `¡Hola *${record.nombres}*! Te saludamos de *StarMotos Matriz Central*. 🏍️📡\n\nTus credenciales para el rastreo satelital GPS de tu motocicleta *${record.modeloMarca}* (Placa: *${record.placa || 'EN TRÁMITE'}*) han sido generadas y activadas:\n\n👤 *Usuario:* ${record.gpsUser || 'No asignado'}\n🔑 *Contraseña:* ${record.gpsPassword || 'No asignada'}\n📅 *Vigencia de Servicio:* ${record.fechaInicio} hasta ${record.fechaVencimiento}\n📱 *Serie GPS (IMEI):* ${record.serieGps}\n\nPuedes ingresar a la aplicación móvil con estos accesos. ¡Cualquier duda o soporte estamos a tus órdenes!`
    );

    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shadow-xs">
              <KeyRound className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                StarMotos Matriz • Credenciales GPS
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Accesos de Rastreo Satelital
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

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ficha Resumen de Cliente y Moto */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Propietario</span>
                <span className="text-xs font-black text-zinc-900">
                  {record.nombres} {record.apellidos}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 block">C.I. {record.cedulaRuc}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Ticket GPS</span>
                <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {record.ticketNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Motocicleta</span>
                <span className="font-bold text-zinc-900 truncate block">{record.modeloMarca}</span>
                <span className="text-[11px] font-mono font-bold text-blue-700">Placa: {record.placa || 'EN TRÁMITE'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Vigencia</span>
                <span className="text-[11px] text-zinc-700 block">Desde: <strong>{record.fechaInicio}</strong></span>
                <span className="text-[11px] text-emerald-700 font-bold block">Hasta: {record.fechaVencimiento}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60 text-[11px]">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Serie GPS (IMEI)</span>
                <span className="font-mono font-semibold text-zinc-800 select-all">{record.serieGps}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Serie Chip (SIM)</span>
                <span className="font-mono font-semibold text-zinc-800 select-all">{record.serieChip}</span>
              </div>
            </div>
          </div>

          {/* CAJA DE CREDENCIALES (USUARIO Y CONTRASEÑA) */}
          <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border-2 border-cyan-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-1 border-b border-cyan-200/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <span className="text-xs font-black text-cyan-900 uppercase tracking-wider">
                  Credenciales Asignadas
                </span>
              </div>
              {record.aprobadoPor && (
                <span className="text-[10px] text-cyan-700 font-medium">
                  Por: {record.aprobadoPor}
                </span>
              )}
            </div>

            {/* Usuario */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-900 block">
                Nombre de Usuario
              </span>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-cyan-300 p-2.5 shadow-xs">
                <span className="font-mono font-bold text-sm text-zinc-900 flex-1 select-all px-1">
                  {record.gpsUser || 'Pendiente de asignar'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(record.gpsUser || '', 'user')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Copiar usuario"
                >
                  {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUser ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-900 block">
                Contraseña de Acceso
              </span>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-cyan-300 p-2.5 shadow-xs">
                <span className="font-mono font-bold text-sm text-zinc-900 flex-1 select-all px-1">
                  {showPassword ? record.gpsPassword || '••••••••' : '••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(record.gpsPassword || '', 'pass')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Copiar contraseña"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPass ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selector de número para WhatsApp (si tiene más de 1 número) */}
          {(record.celular2 || record.celular3) && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                Seleccionar número para enviar WhatsApp:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPhone('celular1')}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    selectedPhone === 'celular1'
                      ? 'bg-blue-50 border-blue-500 font-bold text-blue-900'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-bold text-zinc-400">Principal</span>
                  <span className="font-mono text-[11px]">{record.celular1}</span>
                </button>
                {record.celular2 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhone('celular2')}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      selectedPhone === 'celular2'
                        ? 'bg-blue-50 border-blue-500 font-bold text-blue-900'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Celular 2</span>
                    <span className="font-mono text-[11px]">{record.celular2}</span>
                  </button>
                )}
                {record.celular3 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhone('celular3')}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      selectedPhone === 'celular3'
                        ? 'bg-blue-50 border-blue-500 font-bold text-blue-900'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Celular 3</span>
                    <span className="font-mono text-[11px]">{record.celular3}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Botón enviar por WhatsApp */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enviar Credenciales por WhatsApp al Cliente ({getTargetPhone()})</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
