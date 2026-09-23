// src/components/mobile/EventsMobile.tsx
import React, { useState } from 'react';
import {
  Receipt,
  Wrench,
  FileText,
  Calendar,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Eye,
  Bike,
  UserCheck,
} from 'lucide-react';
import { MaintenanceRecord, MotorcycleClientData, ClientProfile } from '../../types/customer';
import { ModalPortal } from '../common/ModalPortal';

interface Props {
  history: MaintenanceRecord[];
  motorcycle: MotorcycleClientData;
  profile: ClientProfile;
}

export const EventsMobile: React.FC<Props> = ({ history, motorcycle, profile }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<MaintenanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'mantenimientos' | 'facturas'>('mantenimientos');

  const totalInvested = history.reduce((sum, item) => sum + item.totalPaid, 0);

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-zinc-900">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900">Eventos y Facturas SRI</h2>
          <p className="text-[11px] text-zinc-500">Historial de mantenimientos y comprobantes</p>
        </div>
      </div>

      {/* Tarjeta Resumen Rápido */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-3.5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-zinc-500">Inversión Total en Servicios</p>
          <h3 className="text-lg font-extrabold text-blue-700 font-mono">
            ${totalInvested.toFixed(2)} <span className="text-xs text-zinc-500">USD</span>
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold">{history.length} servicios registrados</p>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Pestañas de selección */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('mantenimientos')}
          className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'mantenimientos'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-zinc-600'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Mantenimientos</span>
        </button>
        <button
          onClick={() => setActiveTab('facturas')}
          className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'facturas'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-zinc-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Facturas SRI</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'mantenimientos' ? (
        history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <Wrench className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Sin mantenimientos registrados</p>
            <p className="text-[11px] text-zinc-500">
              Aún no tienes mantenimientos realizados en la red oficial de talleres StarMotos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {record.otNumber}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 mt-1">
                      {record.workSummary[0]}
                    </h4>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {record.date} • {record.mileage.toLocaleString()} km
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-zinc-900 font-mono">
                      ${record.totalPaid.toFixed(2)}
                    </span>
                    <span className="block text-[9px] text-emerald-700 font-bold">Pagado</span>
                  </div>
                </div>

                {/* Tareas */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Trabajos:</span>
                  <ul className="space-y-1">
                    {record.workSummary.map((task, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón ver factura vinculada */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 truncate max-w-[170px]">{record.branchName}</span>
                  <button
                    onClick={() => setSelectedInvoice(record)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Ver Factura</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Sin facturas emitidas</p>
            <p className="text-[11px] text-zinc-500">
              No registras comprobantes electrónicos SRI de servicios de taller por el momento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={`mob-inv-${record.id}`}
                className="bg-white border border-zinc-200 rounded-2xl p-4.5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2 px-0.5">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {record.invoiceNumber}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-1">Fecha: {record.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-700 font-mono">
                      ${record.totalPaid.toFixed(2)}
                    </span>
                    <span className="block text-[9px] text-emerald-800 font-bold flex items-center gap-0.5 justify-end">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      SRI OK
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-50 px-3.5 py-3 rounded-xl border border-zinc-200/80 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="text-zinc-500">Cliente:</span>
                    <strong className="text-zinc-900">{profile.fullName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="text-zinc-500">Orden:</span>
                    <span className="font-mono text-blue-700 font-bold">{record.otNumber}</span>
                  </div>
                  <div className="pt-1 border-t border-zinc-200/70 flex items-center justify-between text-zinc-600">
                    <span className="text-zinc-500">Subtotal 15%:</span>
                    <span className="font-mono">${(record.totalPaid / 1.15).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="text-zinc-500">IVA 15%:</span>
                    <span className="font-mono">${(record.totalPaid - record.totalPaid / 1.15).toFixed(2)}</span>
                  </div>
                  <div className="pt-1 border-t border-zinc-200 flex items-center justify-between font-bold text-zinc-900 text-xs">
                    <span>Total:</span>
                    <span className="font-mono text-emerald-700 font-extrabold">${record.totalPaid.toFixed(2)} USD</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInvoice(record)}
                  className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver RIDE Oficial SRI</span>
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Factura Móvil */}
      <ModalPortal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="max-w-sm"
      >
        {selectedInvoice && (
          <>
            <div className="p-3.5 bg-blue-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Factura Electrónica SRI</h4>
                <p className="text-[10px] text-blue-200 font-mono">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-white hover:text-zinc-200 font-bold text-sm cursor-pointer p-1"
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-1 text-[11px]">
                <p className="font-bold text-zinc-900">STARMOTOS S.A.</p>
                <p className="text-zinc-600">RUC: 1792489012001</p>
                <p className="text-zinc-600">Cliente: {profile.fullName} (C.I. {profile.idNumber})</p>
                <p className="text-zinc-600">Moto: {motorcycle.brand} {motorcycle.model} ({motorcycle.plate})</p>
                <p className="text-zinc-600">Fecha: {selectedInvoice.date}</p>
              </div>

              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Autorización SRI: 15032026011792489012...</span>
              </div>

              <div className="space-y-1 border-t border-zinc-200 pt-2 text-[11px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal 15%:</span>
                  <span className="font-mono">${(selectedInvoice.totalPaid / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>IVA 15%:</span>
                  <span className="font-mono">${(selectedInvoice.totalPaid - selectedInvoice.totalPaid / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 text-sm pt-1 border-t border-zinc-200">
                  <span>Total Pagado:</span>
                  <span className="font-mono text-emerald-700">${selectedInvoice.totalPaid.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </ModalPortal>
    </div>
  );
};
