// src/components/desktop/admin/FacturacionDesktop.tsx
import React, { useState } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  Download,
  Filter,
  DollarSign,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { AdminInvoice } from '../../../types/customer';

interface Props {
  invoices: AdminInvoice[];
}

export const FacturacionDesktop: React.FC<Props> = ({ invoices }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientIdNumber.includes(searchTerm) ||
      inv.invoiceNumber.includes(searchTerm)
  );

  const totalFacturado = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalIva = invoices.reduce((acc, inv) => acc + inv.iva, 0);
  const totalSubtotal = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Módulo de Facturación Electrónica SRI</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro consolidado de comprobantes autorizados con desglose de IVA 15% por sucursal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Generando reporte consolidado en formato Excel / XML para el SRI...')}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar ATS / SRI</span>
        </button>
      </div>

      {/* Tarjetas de Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Subtotal Neto</span>
          <span className="text-2xl font-black text-zinc-900 font-mono">${totalSubtotal.toFixed(2)} USD</span>
          <span className="text-[10px] text-zinc-500 block mt-1">Sin impuestos</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">IVA 15% Recaudado</span>
          <span className="text-2xl font-black text-blue-600 font-mono">${totalIva.toFixed(2)} USD</span>
          <span className="text-[10px] text-blue-500 block mt-1">Tarifa vigente Ecuador</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f0f6fc] border border-[#b8d1ea]">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Total Facturado Mes</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">${totalFacturado.toFixed(2)} USD</span>
          <span className="text-[10px] text-emerald-600 block mt-1">{invoices.length} facturas emitidas</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, cédula o número de factura..."
          className="flex-1 px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
        />
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Factura</th>
                <th className="px-4 py-3">Cliente / Razón Social</th>
                <th className="px-4 py-3">Cédula / RUC</th>
                <th className="px-4 py-3">Sucursal</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">IVA 15%</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado SRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold text-zinc-900">{inv.clientName}</td>
                  <td className="px-4 py-3 font-mono text-zinc-500">{inv.clientIdNumber}</td>
                  <td className="px-4 py-3 text-zinc-600">{inv.workshopName}</td>
                  <td className="px-4 py-3 text-right font-mono">${inv.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">${inv.iva.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      AUTORIZADA
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
