// src/components/desktop/taller/ClientesTallerDesktop.tsx
import React, { useState } from 'react';
import { Users, Search, Phone, Mail, Bike, Calendar } from 'lucide-react';
import { TallerClient } from '../../../types/customer';

interface Props {
  clients: TallerClient[];
}

export const ClientesTallerDesktop: React.FC<Props> = ({ clients }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.idNumber.includes(searchTerm) ||
      c.motorcyclePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Fichero de Clientes & Flota Local</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro de propietarios atendidos, contactos directos y recurrencia de visitas.
          </p>
        </div>

        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
          Total Clientes: {clients.length}
        </span>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre, cédula o placa de la moto..."
        className="w-full px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
      />

      {/* Grid de Clientes */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{c.fullName}</h3>
                <span className="font-mono text-xs text-zinc-500">C.I: {c.idNumber}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {c.totalVisits} Mantenimientos
              </span>
            </div>

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-800 font-bold">
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                <span>{c.motorcycleBrand} {c.motorcycleModel} ({c.motorcyclePlate})</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono">{c.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 truncate">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{c.email}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Última visita al taller:</span>
              <strong className="text-zinc-800 font-medium">{c.lastVisit}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
