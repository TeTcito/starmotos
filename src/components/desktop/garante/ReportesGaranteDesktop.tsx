// src/components/desktop/garante/ReportesGaranteDesktop.tsx
import React from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldCheck, DollarSign, Clock } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
}

export const ReportesGaranteDesktop: React.FC<Props> = ({ warranties }) => {
  const total = warranties.length;
  const aprobadas = warranties.filter((w) => ['aprobada', 'completada'].includes(w.status)).length;
  const rechazadas = warranties.filter((w) => w.status === 'rechazada').length;
  const pendientes = warranties.filter((w) => ['enviada_garante', 'validada_matriz'].includes(w.status)).length;

  const tasaAprobacion = total > 0 ? Math.round((aprobadas / (aprobadas + rechazadas || 1)) * 100) : 0;
  const totalLiquidado = warranties
    .filter((w) => ['aprobada', 'completada'].includes(w.status))
    .reduce((acc, w) => acc + (w.estimatedCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Métricas de Calidad & Tasa de Reclamos</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Indicadores de confiabilidad por modelo, tiempos de respuesta de auditoría y montos absorbidos.
        </p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-500">Tasa de Aprobación</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">{tasaAprobacion}%</span>
          <span className="text-[10px] text-zinc-500 mt-1 block">De garantías dictaminadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-500">Monto Cubierto Marca</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-800 font-mono mt-1 block">${totalLiquidado.toFixed(2)} USD</span>
          <span className="text-[10px] text-blue-600 mt-1 block">Repuestos & Mano de obra</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-500">Tiempo de Respuesta</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-purple-800 font-mono mt-1 block">4.2 horas</span>
          <span className="text-[10px] text-zinc-500 mt-1 block">Promedio de dictamen digital</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-zinc-500">Reclamos Rechazados</span>
            <ShieldCheck className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-black text-red-700 font-mono mt-1 block">{rechazadas}</span>
          <span className="text-[10px] text-red-600 mt-1 block">Por causas no atribuibles</span>
        </div>
      </div>

      {/* Desglose por Marcas Representadas */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Reclamos por Marca Representada
          </h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Benelli (TRK 502X, Leoncino, 180S)</span>
                <span className="font-mono text-blue-600">55%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-[55%] h-full bg-blue-600 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>CFMOTO (450MT, 450NK, 800MT)</span>
                <span className="font-mono text-indigo-600">30%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-[30%] h-full bg-indigo-600 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Royal Enfield & Otras</span>
                <span className="font-mono text-purple-600">15%</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-purple-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Causas Frecuentes de Reclamo
          </h3>
          <ul className="text-xs space-y-2 text-zinc-700">
            <li className="flex justify-between items-center p-2 rounded-xl bg-zinc-50">
              <span>Sensores & Electrónica EFI</span>
              <strong className="font-mono text-zinc-900">38%</strong>
            </li>
            <li className="flex justify-between items-center p-2 rounded-xl bg-zinc-50">
              <span>Retenedores & Suspensión</span>
              <strong className="font-mono text-zinc-900">27%</strong>
            </li>
            <li className="flex justify-between items-center p-2 rounded-xl bg-zinc-50">
              <span>Pantallas TFT & Conectividad CAN</span>
              <strong className="font-mono text-zinc-900">20%</strong>
            </li>
            <li className="flex justify-between items-center p-2 rounded-xl bg-zinc-50">
              <span>Frenos & Rodamientos de Dirección</span>
              <strong className="font-mono text-zinc-900">15%</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
