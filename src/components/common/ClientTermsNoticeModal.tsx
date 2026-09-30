// src/components/common/ClientTermsNoticeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Radio,
  Lock,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { GarantiaPlusRecord, GpsRecord } from '../../types/customer';

interface Props {
  garantiaPlus?: {
    hasGarantiaPlus: boolean;
    record?: GarantiaPlusRecord;
  };
  gpsRecord?: GpsRecord | null;
}

export const ClientTermsNoticeModal: React.FC<Props> = ({
  garantiaPlus,
  gpsRecord,
}) => {
  const [activeModalType, setActiveModalType] = useState<'garantia' | 'gps' | null>(null);

  useEffect(() => {
    // 1. Verificar si tiene Garantía Plus sin aceptar términos
    if (garantiaPlus?.hasGarantiaPlus && garantiaPlus.record) {
      const storageKey = `starmotos_seen_terms_gp_${garantiaPlus.record.id}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setActiveModalType('garantia');
        return;
      }
    }

    // 2. Verificar si tiene GPS sin aceptar términos
    if (gpsRecord && gpsRecord.id) {
      const storageKey = `starmotos_seen_terms_gps_${gpsRecord.id}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        setActiveModalType('gps');
        return;
      }
    }
  }, [garantiaPlus, gpsRecord]);

  if (!activeModalType) return null;

  const handleAcceptGarantia = () => {
    if (garantiaPlus?.record) {
      localStorage.setItem(`starmotos_seen_terms_gp_${garantiaPlus.record.id}`, 'true');
    }
    // Si también tiene GPS pendiente, mostrar GPS a continuación
    if (gpsRecord && gpsRecord.id && !localStorage.getItem(`starmotos_seen_terms_gps_${gpsRecord.id}`)) {
      setActiveModalType('gps');
    } else {
      setActiveModalType(null);
    }
  };

  const handleAcceptGps = () => {
    if (gpsRecord) {
      localStorage.setItem(`starmotos_seen_terms_gps_${gpsRecord.id}`, 'true');
    }
    setActiveModalType(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL GARANTÍA PLUS */}
        {activeModalType === 'garantia' && garantiaPlus?.record && (
          <div>
            <div className="relative bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/25 text-amber-200 text-[10px] font-black uppercase tracking-wider mb-1">
                    👑 Membresía VIP Oficial
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Términos y Políticas: Garantía Plus
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3.5 max-h-96 overflow-y-auto text-xs text-zinc-600 bg-zinc-50/50">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950">
                <p className="font-bold text-[11px] mb-1">
                  ¡Estimado cliente {garantiaPlus.record.nombres}!
                </p>
                <p className="leading-relaxed">
                  Su motocicleta <strong className="font-bold">{garantiaPlus.record.modeloMarca} ({garantiaPlus.record.placa || 'S/P'})</strong> se encuentra amparada bajo el programa oficial <strong className="font-bold">Garantía Plus StarMotos</strong> con vigencia hasta el <strong>{garantiaPlus.record.fechaVencimiento || 'plazo convenido'}</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">1. Cobertura Técnica Nacional</strong>
                    <p className="mt-0.5 leading-relaxed">
                      Mantenimientos preventivos, regulación y lubricación completa 100% cubiertos en cualquier sede autorizada de la red StarMotos a nivel nacional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">2. Atención Prioritaria VIP</strong>
                    <p className="mt-0.5 leading-relaxed">
                      Recepción y diagnóstico prioritario en taller sin filas extensas ni demoras administrativas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">3. Políticas de Privacidad y Manejo de Datos</strong>
                    <p className="mt-0.5 leading-relaxed">
                      La información técnica de su vehículo, odómetro certificado y facturas electrónicas se gestionan bajo estricta confidencialidad entre la Matriz Central y los jefes de taller de cada sucursal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-400">Este aviso solo se mostrará una vez.</span>
              <button
                type="button"
                onClick={handleAcceptGarantia}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        )}

        {/* MODAL GPS */}
        {activeModalType === 'gps' && gpsRecord && (
          <div>
            <div className="relative bg-gradient-to-r from-cyan-900 via-sky-800 to-indigo-900 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
                  <Radio className="w-6 h-6 text-cyan-200 animate-pulse" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/25 text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    📡 Monitoreo & Telemetría
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Términos y Políticas: Rastreo GPS
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3.5 max-h-96 overflow-y-auto text-xs text-zinc-600 bg-zinc-50/50">
              <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl text-cyan-950">
                <p className="font-bold text-[11px] mb-1">
                  ¡Servicio GPS Activo en su Motocicleta!
                </p>
                <p className="leading-relaxed">
                  Dispositivo vinculado: <strong className="font-bold">{gpsRecord.modeloMarca} ({gpsRecord.placa || 'S/P'})</strong>. IMEI/Serie: <span className="font-mono font-bold">{gpsRecord.serieGps}</span>.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <Lock className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">1. Confidencialidad Absoluta de Ubicación</strong>
                    <p className="mt-0.5 leading-relaxed">
                      Las coordenadas, rutas y paradas de su motocicleta son completamente privadas. Solo usted tiene acceso mediante sus credenciales personales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">2. Protocolo de Emergencia y Soporte</strong>
                    <p className="mt-0.5 leading-relaxed">
                      En caso de sustracción o emergencia, comuníquese de inmediato a nuestra línea de soporte Matriz para activar el protocolo de rastreo y corte de corriente remoto asistido.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <Radio className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block font-bold">3. Vigencia y Conectividad</strong>
                    <p className="mt-0.5 leading-relaxed">
                      El chip celular y paquete de datos M2M se mantendrán activos ininterrumpidamente durante la vigencia contratada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-400">Este aviso solo se mostrará una vez.</span>
              <button
                type="button"
                onClick={handleAcceptGps}
                className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 active:scale-98 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
