// src/components/desktop/InspectionDesktop.tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Inspection360 } from '../../types/customer';

interface Props {
  inspection: Inspection360;
  onSelectPhoto: (photo: { url: string; title: string }) => void;
}

export const InspectionDesktop: React.FC<Props> = ({ inspection, onSelectPhoto }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Inspección 360° y Acta de Recepción
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Registro fotográfico de ingreso y reporte de daños previos certificado con firma digital
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm">
          Fecha de Ingreso: {inspection.receptionDate}
        </span>
      </div>

      {/* Grid de Fotos Panorámico de 5 Columnas */}
      <div className="grid grid-cols-5 gap-4 w-full">
        {[
          { title: 'Vista Frontal', url: inspection.photos.frontal },
          { title: 'Lateral Izquierda', url: inspection.photos.lateralIzq },
          { title: 'Lateral Derecha', url: inspection.photos.lateralDer },
          { title: 'Vista Trasera', url: inspection.photos.trasera },
          { title: 'Tablero / Odómetro', url: inspection.photos.tablero },
        ].map((p, i) => (
          <div
            key={i}
            onClick={() => onSelectPhoto({ url: p.url, title: p.title })}
            className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square cursor-pointer hover:border-blue-500 transition shadow-sm"
          >
            <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-xs font-bold text-white">{p.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Daños Previos y Firma Digital Lado a Lado */}
      <div className="grid grid-cols-2 gap-6 w-full pt-2">
        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
          <span className="font-bold text-amber-600 uppercase text-xs tracking-wider block">
            Daños y Desgastes Previos al Ingreso
          </span>
          <div className="space-y-2">
            {inspection.damages.map((dmg) => (
              <div key={dmg.id} className="text-zinc-700 border-b border-zinc-200 pb-2.5 last:border-0 text-sm">
                <span className="font-bold text-zinc-900">{dmg.zone}</span>: {dmg.damageType}
                <p className="text-xs text-zinc-500 mt-0.5">{dmg.advisorNotes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-bold text-zinc-700 uppercase text-xs tracking-wider block mb-2">
              Firma Digital de Recepción Conforme
            </span>
            <div className="bg-white rounded-xl p-3 border border-zinc-200 flex items-center justify-center shadow-inner">
              <img src={inspection.signature.signatureUrl} alt="Firma" className="h-16 object-contain" />
            </div>
          </div>
          <p className="text-xs text-zinc-600 text-center font-mono mt-3">
            Firmado por: <strong className="text-zinc-900">{inspection.signature.clientName}</strong> ({inspection.signature.identificationId})
            <br />
            <span className="text-zinc-500 text-[11px]">{inspection.signature.timestamp}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
