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
  Clock,
  AlertCircle,
} from 'lucide-react';
import { MaintenanceRecord, MotorcycleClientData, ClientProfile } from '../../types/customer';
import { ModalPortal } from '../common/ModalPortal';
import { AbonoTransferenciaModal } from '../common/AbonoTransferenciaModal';
import { ActiveOrderMobile } from './ActiveOrderMobile';
import { buildHistoricalWorkOrder } from '../../utils/historicalOrderUtils';

interface Props {
  history: MaintenanceRecord[];
  motorcycle: MotorcycleClientData;
  profile: ClientProfile;
  onSubmitAbono?: (data: {
    alistamientoId?: string;
    monto: number;
    comprobanteUrl: string;
    bancoOrigen?: string;
    numeroComprobante?: string;
    notas?: string;
  }) => Promise<boolean>;
}

export const EventsMobile: React.FC<Props> = ({
  history,
  motorcycle,
  profile,
  onSubmitAbono,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<MaintenanceRecord | null>(null);
  const [selectedOrderRecord, setSelectedOrderRecord] = useState<MaintenanceRecord | null>(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);

  // Si se selecciona ver la orden en móvil
  if (selectedOrderRecord) {
    const historicalOrder = buildHistoricalWorkOrder(selectedOrderRecord, motorcycle);
    return (
      <ActiveOrderMobile
        activeOrder={historicalOrder}
        motorcycle={motorcycle}
        isHistoryView={true}
        onBack={() => setSelectedOrderRecord(null)}
      />
    );
  }

  // Cálculo de totales
  const totalInvested = history.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalPending = history.reduce((sum, item) => sum + (item.saldoPendiente || 0), 0);
  const completedMaintenances = history.length;
  const hasPendingAbonoReview = history.some(
    (item) => item.solicitudAbonoPendiente?.estado === 'pendiente'
  );

  const nextServiceKm = history.length > 0 && history[0].mileage > 0
    ? history[0].mileage + (motorcycle.oilChangeIntervalKm || 3000)
    : (motorcycle.currentKm + (motorcycle.oilChangeIntervalKm || 3000));
  const kmToNextService = Math.max(0, nextServiceKm - motorcycle.currentKm);

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-zinc-900">
      {/* 1. Encabezado */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900">Eventos y Facturas</h2>
          <p className="text-[11px] text-zinc-500">Historial técnico, pagos y comprobantes electrónicos</p>
        </div>
      </div>

      {/* 2. Todos los Bloques Métricos Visibles en Móvil (Grid 2x2) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Bloque 1: Inversión Total */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Inversión</span>
            <div className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-blue-700 font-mono">
            ${totalInvested.toFixed(2)}
          </h3>
          <p className="text-[9px] text-zinc-500 font-medium">USD Facturado</p>
        </div>

        {/* Bloque 2: Pendientes (Al lado de Inversión Total con icono/botón de Abono) */}
        <div className="bg-gradient-to-br from-purple-50/90 to-white p-3 rounded-2xl border border-purple-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Pendientes</span>
              {hasPendingAbonoReview && (
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" title="Abono en revisión" />
              )}
            </div>
            {/* Pequeño icono de abono para transferencias */}
            <button
              type="button"
              onClick={() => setIsAbonoModalOpen(true)}
              className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-[10px] flex items-center gap-0.5 shadow-2xs cursor-pointer transition"
              title="Abonar por transferencia bancaria con evidencia"
            >
              <DollarSign className="w-3 h-3 stroke-[2.5]" />
              <span>Abonar</span>
            </button>
          </div>
          <h3 className="text-base font-extrabold text-purple-900 font-mono">
            ${totalPending.toFixed(2)}
          </h3>
          <p className="text-[9px] text-zinc-500 font-medium">
            {hasPendingAbonoReview ? 'En revisión taller' : (totalPending > 0.01 ? 'Saldo por pagar' : 'Al día')}
          </p>
        </div>

        {/* Bloque 3: Mantenimientos */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Servicios</span>
            <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-zinc-900 font-mono">
            {completedMaintenances}
          </h3>
          <p className="text-[9px] text-emerald-700 font-medium">Certificados</p>
        </div>

        {/* Bloque 4: Próximo Servicio */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-3 rounded-2xl border border-indigo-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Próx. Servicio</span>
            <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
              <Bike className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-zinc-900 font-mono">
            {nextServiceKm.toLocaleString()} <span className="text-[10px] font-normal text-zinc-500">km</span>
          </h3>
          <p className="text-[9px] text-indigo-700 font-medium">Faltan ~{kmToNextService} km</p>
        </div>
      </div>

      {/* 3. Listado de Mantenimientos y Comprobantes Directo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span>Mantenimientos Realizados ({history.length})</span>
          </h3>
          <span className="text-[10px] text-zinc-400">Red Oficial StarMotos</span>
        </div>

        {history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <Wrench className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Sin mantenimientos registrados</p>
            <p className="text-[11px] text-zinc-500">
              Aún no tienes mantenimientos realizados en la red oficial de talleres StarMotos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const pend = record.saldoPendiente || 0;
              const hasDebt = pend > 0.01;

              return (
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
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-zinc-900 font-mono">
                        ${record.totalPaid.toFixed(2)}
                      </span>
                      {hasDebt ? (
                        <div className="flex flex-col items-end mt-0.5">
                          <span className="block text-[9px] text-rose-600 font-black">
                            Debe: ${pend.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAbonoModalOpen(true)}
                            className="mt-1 px-1.5 py-0.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <DollarSign className="w-2.5 h-2.5" />
                            <span>Abonar</span>
                          </button>
                        </div>
                      ) : (
                        <span className="block text-[9px] text-emerald-700 font-bold">Pagado</span>
                      )}
                    </div>
                  </div>

                  {/* Banner de Estado de Abono en Revisión o Rechazado */}
                  {record.solicitudAbonoPendiente?.estado === 'pendiente' && (
                    <div className="p-2 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-purple-600 animate-spin" />
                        <span>Abono de ${Number(record.solicitudAbonoPendiente.monto).toFixed(2)} en revisión</span>
                      </div>
                      <span className="text-[9px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded-md">
                        Taller
                      </span>
                    </div>
                  )}
                  {record.solicitudAbonoPendiente?.estado === 'rechazado' && (
                    <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span className="truncate max-w-[170px]">Abono negado: {record.solicitudAbonoPendiente.motivoRechazo || 'Revisar datos'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAbonoModalOpen(true)}
                        className="text-[9px] font-bold bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

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

                  {/* Botón ver orden y factura vinculada */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 truncate max-w-[130px]">{record.branchName}</span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderRecord(record)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Orden</span>
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(record)}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Factura</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal Factura Móvil SRI */}
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

      {/* 5. Modal de Abono por Transferencia Directa */}
      <AbonoTransferenciaModal
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        history={history}
        profile={profile}
        motorcycle={motorcycle}
        onSubmitAbono={onSubmitAbono}
      />
    </div>
  );
};
