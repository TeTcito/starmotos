// src/components/desktop/admin/GarantiasAdminDesktop.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Navigation,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileCheck2,
  XCircle,
  Filter,
  Eye,
} from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
  onValidateWarranty: (id: string, notes: string) => void;
  onSendToGarante: (id: string, notes?: string) => void;
  onCompleteRepair: (id: string, invoiceNumber?: string) => void;
}

export const GarantiasAdminDesktop: React.FC<Props> = ({
  warranties,
  onValidateWarranty,
  onSendToGarante,
  onCompleteRepair,
}) => {
  const [activeTab, setActiveTab] = useState<'marca' | 'plus_taller' | 'gps'>('marca');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [validationNote, setValidationNote] = useState('');

  // Filtrar según el tab activo
  const filteredWarranties = warranties.filter((w) => w.warrantyType === activeTab);

  // Status badge helper
  const renderStatusBadge = (status: WarrantyRequest['status']) => {
    switch (status) {
      case 'creada':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">Creada</span>;
      case 'enviada_matriz':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            Pendiente Validación Matriz
          </span>
        );
      case 'validada_matriz':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Validada (Lista para Garante)
          </span>
        );
      case 'enviada_garante':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            En Revisión Garante
          </span>
        );
      case 'aprobada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Aprobada por Garante
          </span>
        );
      case 'rechazada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
            ✕ Rechazada
          </span>
        );
      case 'completada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-white">
            ★ Reparación Completada
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Gestión Centralizada de Garantías & Pólizas</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Flujo de validación: Taller → Matriz Central → Garante Oficial de Marca → Ejecución técnica.
          </p>
        </div>

        {/* Resumen */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
            Total Solicitudes: {warranties.length}
          </span>
        </div>
      </div>

      {/* Selector de Sub-secciones (Tabs solicitados) */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('marca')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
            activeTab === 'marca'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Garantía Oficial de Marca</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
            {warranties.filter((w) => w.warrantyType === 'marca').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plus_taller')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
            activeTab === 'plus_taller'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Garantía Plus del Taller StarMotos</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
            {warranties.filter((w) => w.warrantyType === 'plus_taller').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gps')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
            activeTab === 'gps'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Módulo GPS Satelital & Dispositivos</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
            {warranties.filter((w) => w.warrantyType === 'gps').length}
          </span>
        </button>
      </div>

      {/* Lista de Solicitudes */}
      <div className="space-y-4">
        {filteredWarranties.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl">
            <p className="text-sm font-bold text-zinc-600">No hay solicitudes en esta categoría.</p>
          </div>
        ) : (
          filteredWarranties.map((w) => (
            <div
              key={w.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {w.requestNumber}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {w.clientName} — {w.motorcycleBrand} {w.motorcycleModel} ({w.motorcyclePlate})
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Origen: <strong className="text-zinc-700">{w.tallerOrigin}</strong> • C.I: {w.clientIdNumber} • VIN: {w.motorcycleVin} • Fecha: {w.createdAt}
                  </p>
                </div>

                <div>{renderStatusBadge(w.status)}</div>
              </div>

              {/* Descripción de la falla */}
              <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-700">
                <span className="font-bold text-zinc-900 block mb-0.5">Descripción del Reclamo Técnico:</span>
                {w.issueDescription}
              </div>

              {/* Notas de Matriz o Garante si existen */}
              {w.matrizNotes && (
                <div className="mt-2 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900">
                  <span className="font-bold block">Dictamen Matriz Central:</span>
                  {w.matrizNotes}
                </div>
              )}

              {w.garanteNotes && (
                <div className="mt-2 p-2.5 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-900">
                  <span className="font-bold block">Resolución Oficial del Garante:</span>
                  {w.garanteNotes}
                </div>
              )}

              {w.rejectionReason && (
                <div className="mt-2 p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900">
                  <span className="font-bold block">Causa de Rechazo:</span>
                  {w.rejectionReason}
                </div>
              )}

              {/* Acciones de Matriz según el estado */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {w.estimatedCost && (
                    <span>
                      Costo estimado: <strong className="text-zinc-900 font-mono">${w.estimatedCost.toFixed(2)} USD</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Si está enviada por taller -> Matriz la valida */}
                  {w.status === 'enviada_matriz' && (
                    <button
                      type="button"
                      onClick={() =>
                        onValidateWarranty(
                          w.id,
                          'Inspección y códigos de error verificados por Matriz. Procede a revisión de marca.'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Validar en Matriz</span>
                    </button>
                  )}

                  {/* Si ya está validada -> Matriz la envía al Garante */}
                  {w.status === 'validada_matriz' && (
                    <button
                      type="button"
                      onClick={() => onSendToGarante(w.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Despachar a Garante Oficial</span>
                    </button>
                  )}

                  {/* Si el Garante la aprobó -> Matriz procede a completar reparación */}
                  {w.status === 'aprobada' && (
                    <button
                      type="button"
                      onClick={() => onCompleteRepair(w.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completar Reparación & Liquidar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
