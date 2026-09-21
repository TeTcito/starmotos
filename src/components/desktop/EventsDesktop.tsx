// src/components/desktop/EventsDesktop.tsx
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
  Download,
  Building2,
  UserCheck,
  Bike,
  Sparkles,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { MaintenanceRecord, MotorcycleClientData, ClientProfile } from '../../types/customer';
import { ModalPortal } from '../common/ModalPortal';

interface Props {
  history: MaintenanceRecord[];
  motorcycle: MotorcycleClientData;
  profile: ClientProfile;
}

export const EventsDesktop: React.FC<Props> = ({ history, motorcycle, profile }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<MaintenanceRecord | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'maintenances' | 'invoices'>('all');

  // Cálculo de totales
  const totalInvested = history.reduce((sum, item) => sum + item.totalPaid, 0);
  const completedMaintenances = history.length;
  const totalInvoices = history.filter((item) => Boolean(item.invoiceNumber)).length;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* 1. Encabezado de Sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Eventos, Mantenimientos y Facturas SRI
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Resumen consolidado de servicios realizados y comprobantes electrónicos emitidos para tu {motorcycle.brand} {motorcycle.model} ({motorcycle.plate})
              </p>
            </div>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Todos ({history.length * 2})
          </button>
          <button
            onClick={() => setFilterType('maintenances')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'maintenances'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Mantenimientos ({completedMaintenances})
          </button>
          <button
            onClick={() => setFilterType('invoices')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'invoices'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Facturas SRI ({totalInvoices})
          </button>
        </div>
      </div>

      {/* 2. Tarjetas Métricas Superiores Proporcionales (4 columnas simétricas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Invertido */}
        <div className="bg-gradient-to-br from-blue-50/80 to-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Invertido</p>
            <h3 className="text-xl font-extrabold text-zinc-900 font-mono">
              ${totalInvested.toFixed(2)} <span className="text-xs text-zinc-500 font-normal">USD</span>
            </h3>
            <p className="text-[10px] text-emerald-700 font-medium">Facturado electrónicamente</p>
          </div>
        </div>

        {/* Mantenimientos Completados */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Mantenimientos</p>
            <h3 className="text-xl font-extrabold text-zinc-900 font-mono">
              {completedMaintenances}{' '}
              <span className="text-xs text-zinc-500 font-normal">completados</span>
            </h3>
            <p className="text-[10px] text-emerald-700 font-medium">Certificados por StarMotos</p>
          </div>
        </div>

        {/* Facturas Autorizadas SRI */}
        <div className="bg-gradient-to-br from-cyan-50/80 to-white p-4 rounded-2xl border border-cyan-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-cyan-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Facturas SRI</p>
            <h3 className="text-xl font-extrabold text-zinc-900 font-mono">
              {totalInvoices}{' '}
              <span className="text-xs text-zinc-500 font-normal">emitidas</span>
            </h3>
            <p className="text-[10px] text-cyan-800 font-medium">Autorizadas SRI Ecuador</p>
          </div>
        </div>

        {/* Próximo Servicio Recomendado */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Próximo Servicio</p>
            <h3 className="text-base font-extrabold text-zinc-900 font-mono">
              15.000 <span className="text-xs text-zinc-500 font-normal">km</span>
            </h3>
            <p className="text-[10px] text-indigo-700 font-medium">
              Faltan ~{Math.max(0, 15000 - motorcycle.currentKm)} km
            </p>
          </div>
        </div>
      </div>

      {/* 3. Contenedor Principal de Eventos Simétrico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        {/* COLUMNA IZQUIERDA: RESUMEN DE MANTENIMIENTOS */}
        {(filterType === 'all' || filterType === 'maintenances') && (
          <div className={`space-y-4 ${filterType === 'maintenances' ? 'xl:col-span-2' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Mantenimientos Realizados ({history.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">Historial técnico verificado</span>
            </div>

            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="bg-white border border-zinc-200 hover:border-blue-400 rounded-2xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md group space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 px-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {record.otNumber}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {record.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 mt-1.5">
                        {record.workSummary[0]}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-zinc-900 font-mono">
                        ${record.totalPaid.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-emerald-700 font-bold">
                        Pagado
                      </span>
                    </div>
                  </div>

                  {/* Detalles del servicio compactados con espacio interior */}
                  <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-zinc-50/80 rounded-xl border border-zinc-200/60 text-xs text-zinc-600">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Kilometraje</span>
                      <span className="font-mono font-bold text-zinc-800">{record.mileage.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Taller Autorizado</span>
                      <span className="font-medium text-zinc-800 truncate block">{record.branchName}</span>
                    </div>
                  </div>

                  {/* Lista de trabajos con margen seguro */}
                  <div className="px-1 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Trabajos Ejecutados:
                    </span>
                    <ul className="space-y-1">
                      {record.workSummary.map((task, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-zinc-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Repuestos */}
                  {record.partsReplaced && record.partsReplaced.length > 0 && (
                    <div className="px-1 pt-2.5 border-t border-zinc-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Repuestos:</span>
                      {record.partsReplaced.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[10px] bg-zinc-100 text-zinc-700 font-medium px-2 py-0.5 rounded-md border border-zinc-200"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="px-1 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                      Técnico: <strong className="text-zinc-700">{record.technicianName}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedInvoice(record)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Ver Factura
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLUMNA DERECHA: FACTURAS SRI PRESENTADAS */}
        {(filterType === 'all' || filterType === 'invoices') && (
          <div className={`space-y-4 ${filterType === 'invoices' ? 'xl:col-span-2' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Facturas Electrónicas SRI ({history.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">Comprobantes válidos SRI Ecuador</span>
            </div>

            <div className="space-y-4">
              {history.map((record) => {
                const subtotal = record.totalPaid / 1.15;
                const iva = record.totalPaid - subtotal;

                return (
                  <div
                    key={`inv-${record.id}`}
                    className="bg-white border border-zinc-200 hover:border-emerald-400 rounded-2xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md space-y-4"
                  >
                    {/* Cabecera de la Tarjeta con separación interna */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 px-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            {record.invoiceNumber}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            SRI Autorizada
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">
                          Emitida el {record.date} • Razón Social: <strong>StarMotos S.A.</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-emerald-700 font-mono">
                          ${record.totalPaid.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-zinc-400">Total con IVA</span>
                      </div>
                    </div>

                    {/* Desglose Fiscal con padding amplio y espacio interior (no topa los bordes) */}
                    <div className="bg-slate-50/90 rounded-2xl px-5 py-4 border border-zinc-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="text-zinc-500">Cliente Adquiriente:</span>
                        <strong className="text-zinc-900 font-semibold">Fernando Vaca</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="text-zinc-500">Cédula / RUC:</span>
                        <span className="font-mono text-zinc-800">{profile.idNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="text-zinc-500">Orden de Trabajo Vinculada:</span>
                        <span className="font-mono text-blue-700 font-bold">{record.otNumber}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between text-zinc-600">
                        <span className="text-zinc-500">Subtotal (Tarifa 15%):</span>
                        <span className="font-mono text-zinc-800">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="text-zinc-500">IVA 15%:</span>
                        <span className="font-mono text-zinc-800">${iva.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between font-bold text-zinc-900 text-sm">
                        <span>Total Comprobante:</span>
                        <span className="font-mono text-emerald-700 font-extrabold">${record.totalPaid.toFixed(2)} USD</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-between px-1 pt-1">
                      <span className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                        Sucursal: <strong>{record.branchName}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedInvoice(record)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver RIDE Electrónico
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL VISOR DE FACTURA ELECTRÓNICA SRI ECUADOR */}
      <ModalPortal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="max-w-2xl"
      >
        {selectedInvoice && (
          <>
            {/* Cabecera del Comprobante */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                  <img src="/starmotos-logo.jpg" alt="StarMotos" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Comprobante Electrónico SRI (RIDE)
                  </h3>
                  <p className="text-[11px] text-blue-200 font-mono">
                    Nº {selectedInvoice.invoiceNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition"
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo de la Factura */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Emisor y Receptor con espacio y separación limpia */}
              <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Emisor</span>
                  <h4 className="font-bold text-zinc-900 text-sm">STARMOTOS S.A.</h4>
                  <p className="text-zinc-600">RUC: 1792489012001</p>
                  <p className="text-zinc-500 text-[11px]">{selectedInvoice.branchName}</p>
                  <p className="text-zinc-500 text-[11px]">Obligado a llevar contabilidad: SÍ</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cliente (Adquiriente)</span>
                  <h4 className="font-bold text-zinc-900 text-sm">Fernando Vaca</h4>
                  <p className="text-zinc-600 font-mono">Cédula: {profile.idNumber}</p>
                  <p className="text-zinc-500 text-[11px]">Vehículo: {motorcycle.brand} {motorcycle.model} ({motorcycle.plate})</p>
                  <p className="text-zinc-500 text-[11px]">Fecha Emisión: {selectedInvoice.date}</p>
                </div>
              </div>

              {/* Clave de Acceso SRI con padding desahogado */}
              <div className="p-4 bg-zinc-100/90 rounded-xl border border-zinc-200 text-[10px] space-y-1">
                <span className="font-bold text-zinc-500 uppercase block">Clave de Acceso / Autorización SRI:</span>
                <span className="font-mono text-zinc-700 break-all select-all font-semibold block">
                  15032026011792489012001200100200049101234567814
                </span>
                <div className="flex items-center gap-1.5 pt-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ESTADO SRI: AUTORIZADO (Ambiente Producción)</span>
                </div>
              </div>

              {/* Detalle de Rubros con celdas desahogadas */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-100 text-[11px] font-bold text-zinc-700 uppercase border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3">Descripción de Trabajos / Repuestos</th>
                      <th className="px-4 py-3 text-right">Cant.</th>
                      <th className="px-4 py-3 text-right">Precio Unit.</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {selectedInvoice.workSummary.map((item, idx) => (
                      <tr key={`work-${idx}`}>
                        <td className="px-4 py-3 font-medium">{item}</td>
                        <td className="px-4 py-3 text-right font-mono">1</td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${((selectedInvoice.totalPaid / 1.15) / selectedInvoice.workSummary.length).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          ${((selectedInvoice.totalPaid / 1.15) / selectedInvoice.workSummary.length).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de Valores con margen y padding amplio */}
              <div className="flex justify-end pt-1">
                <div className="w-72 space-y-2 bg-zinc-50 px-5 py-4 rounded-2xl border border-zinc-200 text-xs">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Subtotal 15%:</span>
                    <span className="font-mono text-zinc-900">${(selectedInvoice.totalPaid / 1.15).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>IVA 15%:</span>
                    <span className="font-mono text-zinc-900">
                      ${(selectedInvoice.totalPaid - selectedInvoice.totalPaid / 1.15).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-sm font-bold text-zinc-900">
                    <span>Total Pagado:</span>
                    <span className="font-mono text-emerald-700 font-extrabold">${selectedInvoice.totalPaid.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-zinc-500">Documento electrónico generado por StarMotos SRI Core v2.4</span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Cerrar Detalle
              </button>
            </div>
          </>
        )}
      </ModalPortal>
    </div>
  );
};
