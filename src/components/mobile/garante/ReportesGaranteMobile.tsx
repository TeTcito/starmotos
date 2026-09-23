// src/components/mobile/garante/ReportesGaranteMobile.tsx
import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, ShieldCheck, PieChart, BarChart3 } from 'lucide-react';
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
    name: 'Frenos & Rodamientos',
    keywords: ['freno', 'pastilla', 'disco', 'caliper', 'bomba freno', 'rodamiento', 'direccion', 'dirección', 'cuna', 'cuña'],
  },
  {
    name: 'Motor & Transmisión',
    keywords: ['motor', 'embrague', 'clutch', 'piston', 'pistón', 'cilindro', 'valvula', 'válvula', 'cadena', 'catalina', 'piñon', 'piñón', 'caja', 'aceite', 'fuga'],
  },
];

export const ReportesGaranteMobile: React.FC<Props> = ({ warranties }) => {
  const isAprobada = (status: string) =>
    ['aceptada', 'aprobada', 'completada', 'en_proceso_aceptacion_2'].includes(status);
  const isRechazada = (status: string) =>
    ['denegada', 'rechazada'].includes(status);

  // Garantías en vivo
  const effectiveWarranties = useMemo(() => {
    return warranties && warranties.length > 0 ? warranties : getStoredWarranties();
  }, [warranties]);

  const aprobadas = effectiveWarranties.filter((w) => isAprobada(w.status)).length;
  const rechazadas = effectiveWarranties.filter((w) => isRechazada(w.status)).length;
  const dictaminadas = aprobadas + rechazadas;
  const tasaAprobacion = dictaminadas > 0 ? Math.round((aprobadas / dictaminadas) * 100) : 0;
  const totalLiquidado = effectiveWarranties
    .filter((w) => isAprobada(w.status))
    .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);

  // 1. Métrica dinámica de marcas
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
    const colors = [
      { bar: 'bg-blue-600', text: 'text-blue-600' },
      { bar: 'bg-indigo-600', text: 'text-indigo-600' },
      { bar: 'bg-purple-600', text: 'text-purple-600' },
      { bar: 'bg-emerald-600', text: 'text-emerald-600' },
      { bar: 'bg-amber-500', text: 'text-amber-600' },
      { bar: 'bg-rose-500', text: 'text-rose-600' },
    ];

    return Object.entries(brandCounts)
      .map(([brand, data], idx) => {
        const topModels = Object.entries(data.modelsMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([m]) => m);

        const percentage = totalW > 0 ? Math.round((data.count / totalW) * 100) : 0;
        const color = colors[idx % colors.length];

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

  // 2. Métrica dinámica de causas
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
          : 'General';
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [effectiveWarranties]);

  return (
    <div className="space-y-3">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Aprobación</span>
          <span className="text-xl font-black text-emerald-700">{tasaAprobacion}%</span>
          <span className="text-[9px] text-zinc-400 mt-0.5 block">{aprobadas} de {dictaminadas} dictámenes</span>
        </div>
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Cubierto</span>
          <span className="text-xl font-black text-blue-800 font-mono">${totalLiquidado.toFixed(2)}</span>
          <span className="text-[9px] text-zinc-400 mt-0.5 block">Liquidado oficial</span>
        </div>
      </div>

      {/* Marcas Representadas */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
          <h4 className="font-bold text-zinc-900 uppercase text-[10px] flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-blue-600" />
            <span>Marcas Representadas ({effectiveWarranties.length})</span>
          </h4>
        </div>

        {brandMetrics.length > 0 ? (
          <div className="space-y-2 text-xs">
            {brandMetrics.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-800 truncate pr-1">
                    {item.brand}{' '}
                    {item.topModels.length > 0 && (
                      <span className="font-normal text-zinc-400 text-[10px]">
                        ({item.topModels.join(', ')})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-zinc-400">({item.count})</span>
                    <span className={`font-mono font-bold ${item.color.text}`}>{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color.bar} rounded-full`}
                    style={{ width: `${Math.max(item.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 text-center py-2">Sin solicitudes registradas</p>
        )}
      </div>

      {/* Causas Frecuentes */}
      {causeMetrics.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
            <h4 className="font-bold text-zinc-900 uppercase text-[10px] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Causas Frecuentes</span>
            </h4>
          </div>
          <div className="space-y-1.5 text-xs">
            {causeMetrics.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-700 font-medium truncate pr-2">{item.name}</span>
                <span className="font-mono font-bold text-zinc-900 shrink-0">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
