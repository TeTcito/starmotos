// src/components/mobile/taller/SolicitudesGarantiaTallerMobile.tsx
import React, { useState } from 'react';
import { ShieldAlert, Plus, Send } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
  newForm: any;
  setNewForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateRequest: () => boolean;
}

export const SolicitudesGarantiaTallerMobile: React.FC<Props> = ({
  warranties,
  newForm,
  setNewForm,
  onCreateRequest,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateRequest()) setShowModal(false);
  };

  return (
    <div className="space-y-3.5">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Crear Solicitud de Garantía</span>
      </button>

      {showModal && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-zinc-900">Nueva Garantía para Matriz</h4>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="text"
              value={newForm.clientName}
              onChange={(e) => setNewForm({ ...newForm, clientName: e.target.value })}
              placeholder="Nombre del Cliente"
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
              required
            />
            <input
              type="text"
              value={newForm.clientIdNumber}
              onChange={(e) => setNewForm({ ...newForm, clientIdNumber: e.target.value })}
              placeholder="Cédula"
              className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg"
              required
            />
            <input
              type="text"
              value={newForm.motorcycleModel}
              onChange={(e) => setNewForm({ ...newForm, motorcycleModel: e.target.value })}
              placeholder="Modelo de la Moto"
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
              required
            />
            <textarea
              rows={2}
              value={newForm.issueDescription}
              onChange={(e) => setNewForm({ ...newForm, issueDescription: e.target.value })}
              placeholder="Descripción del reclamo..."
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg resize-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-1.5 border border-zinc-300 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2.5">
        {warranties.map((w) => (
          <div key={w.id} className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {w.requestNumber}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {w.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-900">{w.clientName} — {w.motorcycleBrand} {w.motorcycleModel}</p>
            <p className="text-[11px] text-zinc-500">{w.issueDescription}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
