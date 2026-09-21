// src/components/mobile/admin/FacturacionMobile.tsx
import React from 'react';
import { Receipt, CheckCircle2 } from 'lucide-react';
import { AdminInvoice } from '../../../types/customer';

interface Props {
  invoices: AdminInvoice[];
}

export const FacturacionMobile: React.FC<Props> = ({ invoices }) => {
  const totalFacturado = invoices.reduce((acc, inv) => acc + inv.total, 0);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
        <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Facturado SRI</span>
        <span className="text-xl font-black text-emerald-700 font-mono">${totalFacturado.toFixed(2)} USD</span>
        <span className="text-[10px] text-zinc-500 block mt-0.5">{invoices.length} facturas emitidas con IVA 15%</span>
      </div>

      <div className="space-y-2.5">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700">{inv.invoiceNumber}</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                SRI OK
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900">{inv.clientName}</span>
              <span className="font-mono font-bold text-zinc-900">${inv.total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 flex justify-between">
              <span>{inv.workshopName}</span>
              <span>{inv.date}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
