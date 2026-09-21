// src/components/mobile/taller/InventarioMobile.tsx
import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../../../types/customer';

interface Props {
  inventory: InventoryItem[];
}

export const InventarioMobile: React.FC<Props> = ({ inventory }) => {
  return (
    <div className="space-y-2.5">
      {inventory.map((item) => {
        const isLow = item.stock <= item.minStock;
        return (
          <div key={item.id} className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-700">{item.code}</span>
                <h4 className="text-xs font-bold text-zinc-900">{item.name}</h4>
                <p className="text-[10px] text-zinc-500">{item.brand} • {item.category}</p>
              </div>
              <span className="font-mono text-xs font-bold text-zinc-900">${item.unitPrice.toFixed(2)}</span>
            </div>

            <div className="pt-1.5 border-t border-zinc-100 flex justify-between items-center text-[11px]">
              <span className="font-bold text-zinc-700">Stock: {item.stock} uds.</span>
              {isLow && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3 h-3" />
                  Bajo
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
