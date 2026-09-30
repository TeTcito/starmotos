// src/components/common/FloatingPendientesModal.tsx
import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  X,
  ExternalLink,
  Package,
  ShoppingCart,
  Wrench,
  Phone,
  FileText,
  AlertTriangle,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminPendiente, PendienteCategory, PendientePriority } from '../../types/customer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendientes: AdminPendiente[];
  onSavePendiente: (pendiente: AdminPendiente) => void;
  onToggleComplete: (id: string) => void;
  onGoToFullModule: () => void;
  workshops?: { id: string; name: string }[];
}

const getCategoryBadge = (category: PendienteCategory) => {
  switch (category) {
    case 'repuesto':
      return { label: 'Repuesto', icon: <Package className="w-3 h-3" />, className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'compra':
      return { label: 'Compra', icon: <ShoppingCart className="w-3 h-3" />, className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'revision':
      return { label: 'Revisión', icon: <Wrench className="w-3 h-3" />, className: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'llamada':
      return { label: 'Llamada', icon: <Phone className="w-3 h-3" />, className: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'gestion':
      return { label: 'Gestión', icon: <FileText className="w-3 h-3" />, className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    default:
      return { label: 'General', icon: <CalendarClock className="w-3 h-3" />, className: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
};

const getPriorityBadge = (priority: PendientePriority) => {
  switch (priority) {
    case 'alta':
      return { label: 'Alta', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'media':
      return { label: 'Media', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    default:
      return { label: 'Baja', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  }
};

export const FloatingPendientesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  pendientes,
  onSavePendiente,
  onToggleComplete,
  onGoToFullModule,
  workshops = [],
}) => {
  const [tab, setTab] = useState<'por_hacer' | 'urgentes' | 'todos' | 'completados'>('por_hacer');
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for quick creation
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<PendienteCategory>('otro');
  const [newPriority, setNewPriority] = useState<PendientePriority>('media');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [newWorkshopId, setNewWorkshopId] = useState('');

  if (!isOpen) return null;

  const uncompleted = pendientes.filter((p) => !p.completed);
  const uncompletedCount = uncompleted.length;

  const filtered = pendientes.filter((p) => {
    if (tab === 'por_hacer' && p.completed) return false;
    if (tab === 'completados' && !p.completed) return false;
    if (tab === 'urgentes' && (p.completed || p.priority !== 'alta')) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      const matchWorkshop = p.workshopName?.toLowerCase().includes(q) || false;
      const matchRelated = p.relatedClientOrBike?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc && !matchWorkshop && !matchRelated) return false;
    }

    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedWs = workshops.find((w) => w.id === newWorkshopId);

    const newRecord: AdminPendiente = {
      id: `pen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      dueTime: newDueTime || undefined,
      workshopId: newWorkshopId || undefined,
      workshopName: matchedWs ? matchedWs.name : undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onSavePendiente(newRecord);
    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setNewDueTime('');
    setNewWorkshopId('');
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera Flotante */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-4 text-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white leading-none">
                  Ventana Flotante de Pendientes
                </h2>
                {uncompletedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                    {uncompletedCount} por hacer
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 mt-1">
                Consulta y gestiona tareas rápidas sin salir de tu pantalla actual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onGoToFullModule();
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Abrir módulo completo de pendientes"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Módulo Completo</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Cerrar ventana flotante"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-3 bg-slate-50 border-b border-zinc-200 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, sucursal o cliente..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Cancelar' : 'Nuevo'}</span>
            </button>
          </div>

          {/* Selector de pestañas rápidas */}
          <div className="flex gap-1.5 text-xs overflow-x-auto pb-0.5">
            {[
              { id: 'por_hacer', label: `Por Hacer (${uncompletedCount})` },
              { id: 'urgentes', label: 'Urgentes' },
              { id: 'todos', label: `Todos (${pendientes.length})` },
              { id: 'completados', label: 'Completados' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario Desplegable para Agregar Nuevo Pendiente Rápido */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-3.5 bg-blue-50/70 border-b border-blue-200 space-y-2.5 animate-in slide-in-from-top-2 duration-150 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Registrar Nuevo Pendiente Rápido
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                Cerrar
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="¿Qué tarea o encargo está pendiente? *"
              required
              className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detalles adicionales, repuesto a comprar, notas (opcional)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
              >
                <option value="otro">General</option>
                <option value="repuesto">Repuesto</option>
                <option value="compra">Compra</option>
                <option value="revision">Revisión Taller</option>
                <option value="llamada">Llamada</option>
                <option value="gestion">Gestión</option>
              </select>

              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
              >
                <option value="media">Prioridad Media</option>
                <option value="alta">Prioridad Alta (Alarma)</option>
                <option value="baja">Prioridad Baja</option>
              </select>

              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
                title="Fecha programada"
              />

              <input
                type="time"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
                className="px-2 py-1.5 bg-white border border-zinc-200 rounded-lg"
                title="Hora programada (Alarma)"
              />
            </div>

            {workshops.length > 0 && (
              <select
                value={newWorkshopId}
                onChange={(e) => setNewWorkshopId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg"
              >
                <option value="">-- Sin sucursal específica (Matriz General) --</option>
                {workshops.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-600 text-xs font-semibold hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Guardar Pendiente
              </button>
            </div>
          </form>
        )}

        {/* Lista de Pendientes con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <CalendarClock className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
              <p className="text-xs font-bold text-zinc-700">No se encontraron tareas pendientes</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {search ? 'Prueba con otro término de búsqueda' : '¡Excelente trabajo! Todo al día.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const cat = getCategoryBadge(item.category);
              const pri = getPriorityBadge(item.priority);

              return (
                <div
                  key={item.id}
                  className={`pt-2.5 first:pt-0 flex items-start gap-3 transition ${
                    item.completed ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id)}
                    className="mt-0.5 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer shrink-0"
                    title={item.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 transition ${
                        item.completed ? 'text-emerald-500 fill-emerald-100' : 'text-zinc-300 hover:text-emerald-500'
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs sm:text-sm font-bold leading-snug ${
                          item.completed ? 'line-through text-zinc-400' : 'text-zinc-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${pri.className}`}>
                        {pri.label}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium border ${cat.className}`}>
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>

                      {item.dueDate && (
                        <span className="inline-flex items-center gap-1 text-zinc-500 font-semibold bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{item.dueDate}</span>
                          {item.dueTime && <span className="text-rose-600 font-bold">• {item.dueTime}</span>}
                        </span>
                      )}

                      {item.estimatedCost !== undefined && item.estimatedCost > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <DollarSign className="w-2.5 h-2.5" />
                          <span>{Number(item.estimatedCost).toFixed(2)}</span>
                        </span>
                      )}

                      {item.workshopName && (
                        <span className="inline-flex items-center gap-1 text-zinc-500 truncate max-w-[140px] ml-auto">
                          <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{item.workshopName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-zinc-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-zinc-500 text-[11px]">
            {uncompletedCount} {uncompletedCount === 1 ? 'pendiente por resolver' : 'pendientes por resolver'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onGoToFullModule();
              }}
              className="px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir Módulo Completo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
