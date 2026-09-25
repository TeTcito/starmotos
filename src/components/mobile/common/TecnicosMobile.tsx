import React, { useState } from 'react';
import { Wrench, Plus, Phone, Building2, CheckCircle2, X, Trash2, Star } from 'lucide-react';
import { Technician, Workshop } from '../../../types/customer';
import { getStoredRatings } from '../../../data/mockMultiRoleData';

interface Props {
  technicians: Technician[];
  workshops: Workshop[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onDeleteTechnician?: (id: string) => void;
  currentWorkshopId?: string;
  isMatriz?: boolean;
}

export const TecnicosMobile: React.FC<Props> = ({
  technicians,
  workshops,
  onAddTechnician,
  onDeleteTechnician,
  currentWorkshopId,
  isMatriz = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Mecánica Integral',
    phone: '',
    workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
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
      specialty: 'Mecánica Integral',
      phone: '',
      workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
    });
  };

  return (
    <div className="space-y-3.5">
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Agregar Técnico</span>
      </button>

      {technicians.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Wrench className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-zinc-900">No hay técnicos registrados</h4>
          <p className="text-[10px] text-zinc-500">
            Esta sede aún no cuenta con técnicos o mecánicos en plantilla. Pulsa "Agregar Técnico" para dar de alta al personal.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {technicians.map((tech) => {
            const allRatings = getStoredRatings();
            const techRatings = allRatings.filter(
              (r) =>
                (r.technicianName && tech.name && r.technicianName.toLowerCase().trim() === tech.name.toLowerCase().trim()) ||
                (tech.id && r.technicianId === tech.id)
            );
            const avgScore = techRatings.length > 0
              ? (techRatings.reduce((sum, r) => sum + r.stars, 0) / techRatings.length).toFixed(1)
              : null;

            return (
              <div key={tech.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">{tech.name}</h4>
                    <p className="text-[10px] text-zinc-500">{tech.specialty}</p>
                    {avgScore ? (
                      <div className="flex items-center gap-1 mt-1 text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 w-fit text-[9px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        <span>{avgScore} / 5</span>
                        <span className="text-zinc-400 font-normal">({techRatings.length} op.)</span>
                      </div>
                    ) : null}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </div>

              <div className="text-[11px] text-zinc-600 flex justify-between items-center pt-1 border-t border-zinc-100">
                <span className="truncate max-w-[170px]">{tech.workshopName.replace('StarMotos ', '')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-800">{tech.phone}</span>
                  {onDeleteTechnician && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Está seguro de eliminar al técnico "${tech.name}" de la sede "${tech.workshopName}"?`
                          )
                        ) {
                          onDeleteTechnician(tech.id);
                        }
                      }}
                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition"
                      title={`Eliminar ${tech.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900">Nuevo Técnico</h4>
              <button onClick={() => setShowModal(false)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre Completo"
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                required
              />
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Especialidad"
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Teléfono"
                className="w-full px-3 py-1.5 font-mono bg-zinc-50 border border-zinc-300 rounded-lg"
              />
              {isMatriz ? (
                <select
                  value={formData.workshopId}
                  onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                >
                  {workshops.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-left">
                  <span className="block text-[9px] font-bold uppercase text-zinc-500">Sede Asignada</span>
                  <span className="text-[11px] font-bold text-zinc-800">
                    {workshops.find((w) => w.id === (currentWorkshopId || formData.workshopId))?.name || 'Taller Local'}
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-1.5 border border-zinc-300 text-zinc-700 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
