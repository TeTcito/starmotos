// src/components/desktop/garante/ReportesGaranteDesktop.tsx
import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldCheck, DollarSign, Clock } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';
import { getStoredWarranties } from '../../../data/mockMultiRoleData';

interface Props {
  warranties: WarrantyRequest[];
}

const CATEGORIES: { name: string; keywords: string[] }[] = [
  {
    name: 'Sensores & Electrónica EFI',
    keywords: ['sensor', 'ecu', 'tps', 'cdi', 'bateria', 'batería', 'bobina', 'arnes', 'arnés', 'relay', 'inyector', 'bujia', 'bujía', 'electronica', 'electrónica', 'cableado'],
  },
  {
    name: 'Retenedores & Suspensión',
    keywords: ['reten', 'retenedor', 'suspension', 'suspensión', 'amortiguador', 'barra', 'horquilla', 'resorte', 'monoshock', 'telescopica', 'telescópica'],
  },
  {
    name: 'Pantallas TFT & Conectividad CAN',
    keywords: ['tft', 'pantalla', 'tablero', 'velocimetro', 'velocímetro', 'can', 'display', 'comando', 'odometro', 'luces', 'faro'],
  },
  {
    name: 'Frenos & Rodamientos de Dirección',
    keywords: ['freno', 'pastilla', 'disco', 'caliper', 'bomba freno', 'rodamiento', 'direccion', 'dirección', 'cuna', 'cuña'],
  },
  {
    name: 'Motor & Sistema de Transmisión',
    keywords: ['motor', 'embrague', 'clutch', 'piston', 'pistón', 'cilindro', 'valvula', 'válvula', 'cadena', 'catalina', 'piñon', 'piñón', 'caja', 'aceite', 'fuga'],
  },
];

export const ReportesGaranteDesktop: React.FC<Props> = ({ warranties }) => {
  const isAprobada = (status: string) =>
    ['aceptada', 'aprobada', 'completada', 'en_proceso_aceptacion_2'].includes(status);
  const isRechazada = (status: string) =>
    ['denegada', 'rechazada'].includes(status);
  const isPendiente = (status: string) =>
    ['en_proceso', 'enviada_garante', 'validada_matriz'].includes(status);

  // Garantías efectivas en vivo desde props o localStorage
  const effectiveWarranties = useMemo(() => {
    return warranties && warranties.length > 0 ? warranties : getStoredWarranties();
  }, [warranties]);

  const total = effectiveWarranties.length;
  const aprobadas = effectiveWarranties.filter((w) => isAprobada(w.status)).length;
  const rechazadas = effectiveWarranties.filter((w) => isRechazada(w.status)).length;
  const pendientes = effectiveWarranties.filter((w) => isPendiente(w.status)).length;

  const dictaminadas = aprobadas + rechazadas;
  const tasaAprobacion = dictaminadas > 0 ? Math.round((aprobadas / dictaminadas) * 100) : 0;
  const totalLiquidado = effectiveWarranties
    .filter((w) => isAprobada(w.status))
    .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);

  // 1. Métrica Dinámica de Reclamos por Marca y Modelos
  const brandMetrics = useMemo(() => {
    if (!effectiveWarranties.length) return [];
    const brandCounts: Record<string, { count: number; modelsMap: Record<string, number> }> = {};

    effectiveWarranties.forEach((w) => {
      const brand = (w.targetBrand || w.motorcycleBrand || w.garanteName || 'Sin Marca').trim();
      if (!brandCounts[brand]) {
        brandCounts[brand] = { count: 0, modelsMap: {} };
      }
      brandCounts[brand].count += 1;
      const model = (w.motorcycleModel || '').trim();
      if (model) {
        brandCounts[brand].modelsMap[model] = (brandCounts[brand].modelsMap[model] || 0) + 1;
      }
    });

    const totalW = effectiveWarranties.length;
    const colorPalette = [
      { bar: 'bg-blue-600', text: 'text-blue-600' },
      { bar: 'bg-indigo-600', text: 'text-indigo-600' },
      { bar: 'bg-purple-600', text: 'text-purple-600' },
      { bar: 'bg-emerald-600', text: 'text-emerald-600' },
      { bar: 'bg-amber-500', text: 'text-amber-600' },
      { bar: 'bg-rose-500', text: 'text-rose-600' },
      { bar: 'bg-cyan-600', text: 'text-cyan-600' },
    ];

    return Object.entries(brandCounts)
      .map(([brand, data], idx) => {
        const topModels = Object.entries(data.modelsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([m]) => m);

        const percentage = totalW > 0 ? Math.round((data.count / totalW) * 100) : 0;
        const color = colorPalette[idx % colorPalette.length];

        return {
          brand,
          count: data.count,
          percentage,
          topModels,
          color,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [effectiveWarranties]);

  // 2. Métrica Dinámica de Causas Frecuentes
  const causeMetrics = useMemo(() => {
    if (!effectiveWarranties.length) return [];
    const causeCounts: Record<string, number> = {};
    let totalCausesCount = 0;

    effectiveWarranties.forEach((w) => {
      const textToScan = `${w.issueDescription || ''} ${(w.partsTags || []).join(' ')} ${w.partsRequired || ''}`.toLowerCase();

      let matched = false;
      CATEGORIES.forEach((cat) => {
        if (cat.keywords.some((kw) => textToScan.includes(kw))) {
          causeCounts[cat.name] = (causeCounts[cat.name] || 0) + 1;
          matched = true;
          totalCausesCount += 1;
        }
      });

      if (!matched) {
        const fallbackCategory = (w.partsTags && w.partsTags.length > 0)
          ? w.partsTags[0]
          : 'Diagnóstico & Desgaste General';
        causeCounts[fallbackCategory] = (causeCounts[fallbackCategory] || 0) + 1;
        totalCausesCount += 1;
      }
    });

    return Object.entries(causeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCausesCount > 0 ? Math.round((count / totalCausesCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [effectiveWarranties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Métricas de Calidad & Tasa de Reclamos</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Indicadores en tiempo real de confiabilidad por modelo, tiempos de respuesta de auditoría y montos absorbidos.
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
          <span className="text-[10px] text-blue-600 mt-1 block">Presupuesto oficial autorizado</span>
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

      {/* Desglose por Marcas Representadas y Causas */}
      <div className="grid grid-cols-2 gap-5">
        {/* RECLAMOS POR MARCA REPRESENTADA */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Reclamos por Marca Representada</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-500 font-mono">
              Total: {effectiveWarranties.length} {effectiveWarranties.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {brandMetrics.length > 0 ? (
            <div className="space-y-3">
              {brandMetrics.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-zinc-800 flex items-center gap-1.5 truncate">
                      <span className="text-zinc-950 font-black">{item.brand}</span>
                      {item.topModels.length > 0 && (
                        <span className="text-zinc-500 font-normal truncate">
                          ({item.topModels.join(', ')})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {item.count} {item.count === 1 ? 'reclamo' : 'reclamos'}
                      </span>
                      <span className={`font-mono font-bold text-xs ${item.color.text}`}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs">
              No hay reclamos de marcas registrados en el sistema.
            </div>
          )}
        </div>

        {/* CAUSAS FRECUENTES DE RECLAMO */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Causas Frecuentes de Reclamo</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-500 font-mono">
              Categorías detectadas
            </span>
          </div>

          {causeMetrics.length > 0 ? (
            <ul className="text-xs space-y-2 text-zinc-700">
              {causeMetrics.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="font-medium text-zinc-800 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="text-[10px] text-zinc-400">({item.count})</span>
                    <strong className="text-zinc-900 font-bold">{item.percentage}%</strong>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs">
              No se han registrado causas o repuestos aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
