// src/components/desktop/taller/SolicitudesGarantiaTallerDesktop.tsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
  newForm: {
    clientName: string;
    clientIdNumber: string;
    motorcycleBrand: string;
    motorcycleModel: string;
    motorcyclePlate: string;
    motorcycleVin: string;
    warrantyType: 'marca' | 'plus_taller' | 'gps';
    issueDescription: string;
    estimatedCost: number;
  };
  setNewForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateRequest: () => boolean;
}

export const SolicitudesGarantiaTallerDesktop: React.FC<Props> = ({
  warranties,
  newForm,
  setNewForm,
  onCreateRequest,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onCreateRequest();
    if (success) {
      setShowCreateModal(false);
    }
  };

  const getStatusBadge = (status: WarrantyRequest['status']) => {
    switch (status) {
      case 'enviada_matriz':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
            Enviada a Matriz (En Revisión)
          </span>
        );
      case 'validada_matriz':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Validada en Matriz
          </span>
        );
      case 'enviada_garante':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
            Despachada a Garante Oficial
          </span>
        );
      case 'aprobada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            ✓ Aprobada por Garante
          </span>
        );
      case 'rechazada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            ✕ Rechazada
          </span>
        );
      case 'completada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-white">
            Reparación Concluida
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">Creada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span>Generador de Solicitudes de Garantía (Hacia Matriz)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Reporte fallas mecánicas de fábrica o de póliza para su escalamiento y aprobación.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Solicitud de Garantía</span>
        </button>
      </div>

      {/* Modal / Formulario de Creación */}
      {showCreateModal && (
        <div className="bg-white border-2 border-blue-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-slide-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Generar Informe de Reclamo Técnico de Garantía</span>
            </h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={newForm.clientName}
                  onChange={(e) => setNewForm({ ...newForm, clientName: e.target.value })}
                  placeholder="Ej: Fernando Vaca"
                  className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Cédula / RUC</label>
                <input
                  type="text"
                  value={newForm.clientIdNumber}
                  onChange={(e) => setNewForm({ ...newForm, clientIdNumber: e.target.value })}
                  placeholder="1724890123"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Tipo de Póliza</label>
                <select
                  value={newForm.warrantyType}
                  onChange={(e) => setNewForm({ ...newForm, warrantyType: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="marca">Garantía Oficial de Marca (Fábrica)</option>
                  <option value="plus_taller">Garantía Plus StarMotos</option>
                  <option value="gps">Garantía Dispositivo GPS Satelital</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Marca Moto</label>
                <input
                  type="text"
                  value={newForm.motorcycleBrand}
                  onChange={(e) => setNewForm({ ...newForm, motorcycleBrand: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Modelo Moto</label>
                <input
                  type="text"
                  value={newForm.motorcycleModel}
                  onChange={(e) => setNewForm({ ...newForm, motorcycleModel: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Placa / Chasis</label>
                <input
                  type="text"
                  value={newForm.motorcyclePlate}
                  onChange={(e) => setNewForm({ ...newForm, motorcyclePlate: e.target.value.toUpperCase() })}
                  placeholder="PBX-8492"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-xl outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Descripción Técnica del Daño / Evidencia
                </label>
                <textarea
                  rows={2}
                  value={newForm.issueDescription}
                  onChange={(e) => setNewForm({ ...newForm, issueDescription: e.target.value })}
                  placeholder="Describa el fallo, ruidos anormales, fuga de fluidos o código de escáner..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Costo Estimado ($ USD)</label>
                <input
                  type="number"
                  value={newForm.estimatedCost}
                  onChange={(e) => setNewForm({ ...newForm, estimatedCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-600 bg-zinc-50 border border-zinc-300 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar a Matriz Central</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de Solicitudes Enviadas por el Taller */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
          Historial de Solicitudes Enviadas desde este Taller
        </h3>

        {warranties.map((w) => (
          <div
            key={w.id}
            className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {w.requestNumber}
                </span>
                <span className="text-xs font-bold text-zinc-900">
                  {w.clientName} — {w.motorcycleBrand} {w.motorcycleModel}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {w.issueDescription.slice(0, 100)}...
              </p>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              {getStatusBadge(w.status)}
              <span className="text-[10px] text-zinc-400 font-mono">{w.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
