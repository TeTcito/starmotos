// src/components/desktop/common/TecnicosDesktop.tsx
import React, { useState } from 'react';
import {
  Wrench,
  Users,
  Plus,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Technician, Workshop } from '../../../types/customer';

interface Props {
  technicians: Technician[];
  workshops: Workshop[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  currentWorkshopId?: string;
  isMatriz?: boolean;
}

export const TecnicosDesktop: React.FC<Props> = ({
  technicians,
  workshops,
  onAddTechnician,
  currentWorkshopId,
  isMatriz = false,
}) => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>(
    isMatriz ? 'all' : currentWorkshopId || 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Diagnóstico Electrónico & PDI',
    phone: '',
    workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
  });

  const filtered = technicians.filter((tech) => {
    const matchesWorkshop =
      selectedWorkshop === 'all' ? true : tech.workshopId === selectedWorkshop;
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.workshopName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWorkshop && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const targetWsId = (!isMatriz && currentWorkshopId) ? currentWorkshopId : formData.workshopId;
    const targetWs = workshops.find((w) => w.id === targetWsId);
    onAddTechnician({
      name: formData.name.toUpperCase(),
      specialty: formData.specialty,
      phone: formData.phone || '0990000000',
      workshopId: targetWsId,
      workshopName: targetWs?.name || 'StarMotos Taller',
      status: 'activo',
    });

    setShowModal(false);
    setFormData({
      name: '',
      specialty: 'Diagnóstico Electrónico & PDI',
      phone: '',
      workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Fichero de Técnicos & Mecánicos Certificados</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Personal técnico calificado asignado por sede para servicios de Alistamiento, Engrasado y Taller.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Técnico</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar técnico por nombre, especialidad o sede..."
            className="w-full px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        {isMatriz && (
          <select
            value={selectedWorkshop}
            onChange={(e) => setSelectedWorkshop(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
          >
            <option value="all">Todas las Sedes ({technicians.length} técnicos)</option>
            {workshops.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name.replace('StarMotos ', '')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grilla de Técnicos o Estado Vacío */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            No hay técnicos registrados en esta sede
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-4">
            Actualmente esta sucursal no tiene mecánicos o técnicos registrados. Haz clic en el botón de abajo para registrar al primer integrante del taller.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Técnico Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tech) => (
            <div
              key={tech.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {tech.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{tech.name}</h3>
                      <p className="text-[11px] text-zinc-500">{tech.specialty}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Activo
                  </span>
                </div>

                <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{tech.workshopName}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{tech.phone}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>Órdenes asignadas:</span>
                <strong className="text-blue-700 font-mono font-bold">
                  {tech.activeOrdersCount} activas
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar Técnico */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Registrar Nuevo Técnico de Taller</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: MARIO ANDRADE"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Especialidad Técnica
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ej: Inyección Delphi, Motores 4T, PDI..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0991234567"
                  className="w-full px-3 py-2 font-mono bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              {isMatriz ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                    Sede Asignada *
                  </label>
                  <select
                    value={formData.workshopId}
                    onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none cursor-pointer"
                  >
                    {workshops.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">
                    Sede Asignada (Taller Actual)
                  </label>
                  <p className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{workshops.find((w) => w.id === (currentWorkshopId || formData.workshopId))?.name || 'Taller Local'}</span>
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
