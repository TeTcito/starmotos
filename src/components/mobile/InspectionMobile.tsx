// src/components/mobile/InspectionMobile.tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Inspection360 } from '../../types/customer';

interface Props {
  inspection: Inspection360;
  onSelectPhoto: (photo: { url: string; title: string }) => void;
}

export const InspectionMobile: React.FC<Props> = ({ inspection, onSelectPhoto }) => {
  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Inspección 360°</h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">{inspection.receptionDate}</span>
      </div>

      {/* Grid de fotos móvil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { title: 'Frontal', url: inspection.photos.frontal },
          { title: 'Lateral Izq.', url: inspection.photos.lateralIzq },
          { title: 'Lateral Der.', url: inspection.photos.lateralDer },
          { title: 'Trasera', url: inspection.photos.trasera },
          { title: 'Tablero', url: inspection.photos.tablero },
        ].map((p, i) => (
          <div
            key={i}
            onClick={() => onSelectPhoto({ url: p.url, title: p.title })}
            className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square cursor-pointer hover:border-blue-500 transition"
          >
            <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
              <span className="text-[10px] font-bold text-white">{p.title}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-1">
        {/* Daños Previos */}
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
          <span className="font-bold text-amber-400 uppercase text-[10px] block">
            Daños Previos al Ingreso
          </span>
          {inspection.damages.map((dmg) => (
            <div key={dmg.id} className="text-zinc-300 border-b border-zinc-850 pb-1.5 last:border-0">
              <span className="font-bold text-white">{dmg.zone}</span>: {dmg.damageType}
            </div>
          ))}
        </div>

        {/* Firma */}
        <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
          <span className="font-bold text-zinc-300 uppercase text-[10px] block">
            Firma de Recepción
          </span>
          <div className="bg-white rounded-lg p-2 flex items-center justify-center">
            <img src={inspection.signature.signatureUrl} alt="Firma" className="h-9 object-contain" />
          </div>
          <p className="text-[9px] text-zinc-500 text-center font-mono">
            {inspection.signature.clientName} ({inspection.signature.identificationId})
          </p>
        </div>
      </div>
    </div>
  );
};
