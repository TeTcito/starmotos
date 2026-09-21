// src/components/desktop/taller/InventarioDesktop.tsx
import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle2, Search, ArrowUpDown } from 'lucide-react';
import { InventoryItem } from '../../../types/customer';

interface Props {
  inventory: InventoryItem[];
}

export const InventarioDesktop: React.FC<Props> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Inventario & Repuestos en Stock</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Control de insumos de alta rotación (lubricantes Motul, filtros OEM, kits de arrastre, GPS).
          </p>
        </div>

        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
          Items Registrados: {inventory.length}
        </span>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar repuesto por nombre, código o marca..."
        className="w-full px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
      />

      {/* Tabla de Inventario */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descripción del Repuesto</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-center">Stock Actual</th>
              <th className="px-4 py-3 text-right">PVP ($ USD)</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
            {filtered.map((item) => {
              const isLowStock = item.stock <= item.minStock;
              return (
                <tr key={item.id} className="hover:bg-zinc-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{item.code}</td>
                  <td className="px-4 py-3 font-bold text-zinc-900">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.brand}</td>
                  <td className="px-4 py-3 text-zinc-500">{item.category}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{item.stock} uds.</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        Stock Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Disponible
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
