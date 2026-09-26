// src/components/common/PendientesModule.tsx
import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Package,
  ShoppingCart,
  Wrench,
  Phone,
  FileText,
  DollarSign,
  Building2,
  Trash2,
  Edit2,
  Filter,
  Check,
  X,
  Bike,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  AdminPendiente,
  PendienteCategory,
  PendientePriority,
  Workshop,
} from '../../types/customer';

interface Props {
  pendientes: AdminPendiente[];
  onSavePendiente: (p: AdminPendiente) => void;
  onToggleComplete: (id: string) => void;
  onDeletePendiente: (id: string) => void;
  workshops?: Workshop[];
  isMobile?: boolean;
}

const CATEGORY_CONFIG: Record<
  PendienteCategory,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  repuesto: {
    label: 'Repuesto por Comprar',
    icon: <Package className="w-3.5 h-3.5" />,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  compra: {
    label: 'Compra / Insumos',
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  revision: {
    label: 'Revisión en Taller',
    icon: <Wrench className="w-3.5 h-3.5" />,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  llamada: {
    label: 'Llamada / Contacto',
    icon: <Phone className="w-3.5 h-3.5" />,
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  gestion: {
    label: 'Gestión / Trámite',
    icon: <FileText className="w-3.5 h-3.5" />,
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  otro: {
    label: 'General / Otro',
    icon: <CalendarClock className="w-3.5 h-3.5" />,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

const PRIORITY_CONFIG: Record<
  PendientePriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  alta: {
    label: 'Alta / Urgente',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold',
    dotClass: 'bg-red-500',
  },
  media: {
    label: 'Media',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  baja: {
    label: 'Baja',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-blue-500',
  },
};

export const PendientesModule: React.FC<Props> = ({
  pendientes,
  onSavePendiente,
  onToggleComplete,
  onDeletePendiente,
  workshops = [],
  isMobile = false,
}) => {
  // Estados de filtrado
  const [activeTab, setActiveTab] = useState<'todos' | 'por_hacer' | 'completados' | 'urgentes'>('por_hacer');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados del modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPendiente, setEditingPendiente] = useState<AdminPendiente | null>(null);

  // Formulario temporal
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PendienteCategory>('repuesto');
  const [formPriority, setFormPriority] = useState<PendientePriority>('media');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formWorkshopId, setFormWorkshopId] = useState('');
  const [formRelatedClientOrBike, setFormRelatedClientOrBike] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);

  // Métricas rápidas
  const totalCount = pendientes.length;
  const uncompletedCount = useMemo(() => pendientes.filter((p) => !p.completed).length, [pendientes]);
  const completedCount = useMemo(() => pendientes.filter((p) => p.completed).length, [pendientes]);
  const urgentCount = useMemo(
    () => pendientes.filter((p) => !p.completed && p.priority === 'alta').length,
    [pendientes]
  );
  const pendingBudgetSum = useMemo(() => {
    return pendientes
      .filter((p) => !p.completed && p.estimatedCost && p.estimatedCost > 0)
      .reduce((sum, p) => sum + (Number(p.estimatedCost) || 0), 0);
  }, [pendientes]);

  // Apertura del modal para crear
  const handleOpenCreateModal = () => {
    setEditingPendiente(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('repuesto');
    setFormPriority('media');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('10:00');
    setFormEstimatedCost('');
    setFormWorkshopId(workshops[0]?.id || 'matriz-la-mana');
    setFormRelatedClientOrBike('');
    setFormCompleted(false);
    setIsModalOpen(true);
  };

  // Apertura del modal para editar
  const handleOpenEditModal = (item: AdminPendiente) => {
    setEditingPendiente(item);
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    setFormCategory(item.category || 'repuesto');
    setFormPriority(item.priority || 'media');
    setFormDueDate(item.dueDate || '');
    setFormDueTime(item.dueTime || '');
    setFormEstimatedCost(item.estimatedCost !== undefined ? String(item.estimatedCost) : '');
    setFormWorkshopId(item.workshopId || '');
    setFormRelatedClientOrBike(item.relatedClientOrBike || '');
    setFormCompleted(item.completed || false);
    setIsModalOpen(true);
  };

  // Guardar formulario
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const matchedWorkshop = workshops.find((w) => w.id === formWorkshopId);
    const workshopName = matchedWorkshop ? matchedWorkshop.name : 'StarMotos Matriz La Maná';

    const p: AdminPendiente = {
      id: editingPendiente ? editingPendiente.id : `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      priority: formPriority,
      dueDate: formDueDate || undefined,
      dueTime: formDueTime || undefined,
      estimatedCost: formEstimatedCost ? Number(parseFloat(formEstimatedCost).toFixed(2)) : undefined,
      workshopId: formWorkshopId || undefined,
      workshopName,
      relatedClientOrBike: formRelatedClientOrBike.trim() || undefined,
      completed: formCompleted,
      completedAt: formCompleted
        ? editingPendiente?.completedAt || new Date().toISOString()
        : undefined,
      createdAt: editingPendiente ? editingPendiente.createdAt : new Date().toISOString(),
      createdBy: editingPendiente?.createdBy || 'Administrador Matriz',
    };

    onSavePendiente(p);
    setIsModalOpen(false);
  };

  // Lista filtrada
  const filteredList = useMemo(() => {
    return pendientes.filter((item) => {
      // Pestaña
      if (activeTab === 'por_hacer' && item.completed) return false;
      if (activeTab === 'completados' && !item.completed) return false;
      if (activeTab === 'urgentes' && (item.completed || item.priority !== 'alta')) return false;

      // Categoría
      if (selectedCategory !== 'todas' && item.category !== selectedCategory) return false;

      // Sede
      if (selectedWorkshop !== 'todos' && item.workshopId !== selectedWorkshop) return false;

      // Búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = item.title?.toLowerCase().includes(query);
        const inDesc = item.description?.toLowerCase().includes(query);
        const inMoto = item.relatedClientOrBike?.toLowerCase().includes(query);
        const inWorkshop = item.workshopName?.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inMoto && !inWorkshop) return false;
      }

      return true;
    });
  }, [pendientes, activeTab, selectedCategory, selectedWorkshop, searchQuery]);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-150">
      {/* 1. CABECERA & CONTADORES */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <CalendarClock className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Registrar Pendientes & Agendamiento
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
              Agendamiento de compras de repuestos, gestiones de taller y tareas prioritarias. Puedes marcarlos como completados o dejarlos pendientes para comprar después.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pendiente</span>
            </button>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100">
          <div
            onClick={() => setActiveTab('por_hacer')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'por_hacer'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Por Hacer / Comprar</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-950">{uncompletedCount}</span>
              <span className="text-[11px] text-amber-700 font-medium">pendientes activos</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('urgentes')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'urgentes'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/30'
                : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900">Alta Prioridad</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-950">{urgentCount}</span>
              <span className="text-[11px] text-red-700 font-medium">urgentes</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('completados')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeTab === 'completados'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Completados</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950">{completedCount}</span>
              <span className="text-[11px] text-emerald-700 font-medium">realizados</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700">Presupuesto por Comprar</span>
              <DollarSign className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-zinc-900">
                ${pendingBudgetSum.toFixed(2)}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">estimado</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs principales */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('por_hacer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'por_hacer'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Por Hacer ({uncompletedCount})
            </button>
            <button
              onClick={() => setActiveTab('urgentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'urgentes'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Urgentes ({urgentCount})
            </button>
            <button
              onClick={() => setActiveTab('completados')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'completados'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Completados ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todos ({totalCount})
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, moto, detalle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Filtros secundarios: Categoría y Sede */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 font-medium focus:outline-hidden focus:border-blue-500 text-xs"
            >
              <option value="todas">Todas las categorías</option>
              <option value="repuesto">Repuestos por Comprar</option>
              <option value="compra">Compras / Insumos</option>
              <option value="revision">Revisiones en Taller</option>
              <option value="llamada">Llamadas / Contactos</option>
              <option value="gestion">Gestiones / Trámites</option>
              <option value="otro">General / Otro</option>
            </select>
          </div>

          {workshops.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">Sede / Taller:</span>
              <select
                value={selectedWorkshop}
                onChange={(e) => setSelectedWorkshop(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 font-medium focus:outline-hidden focus:border-blue-500 text-xs"
              >
                <option value="todos">Todos los talleres</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedCategory !== 'todas' || selectedWorkshop !== 'todos' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('todas');
                setSelectedWorkshop('todos');
                setSearchQuery('');
              }}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold ml-auto cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. LISTADO DE PENDIENTES */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <CalendarClock className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-base font-bold text-zinc-800">
              No hay pendientes registrados en esta vista
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {activeTab === 'completados'
                ? 'Aún no has marcado ningún pendiente como completado.'
                : 'Todo está al día o no coincide con los filtros aplicados. Agrega una nueva tarea o pedido.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Pendiente</span>
            </button>
          </div>
        ) : (
          filteredList.map((item) => {
            const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.otro;
            const pri = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.media;

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                  item.completed
                    ? 'bg-zinc-50/80 border-zinc-200 opacity-80'
                    : item.priority === 'alta'
                    ? 'bg-white border-red-200 hover:border-red-300 ring-1 ring-red-400/20 shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* CHECKBOX DE COMPLETADO */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id)}
                    title={
                      item.completed
                        ? 'Completado (Clic para dejar sin completar y comprar después)'
                        : 'Marcar como completado'
                    }
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-zinc-300 hover:border-blue-600 hover:bg-blue-50 text-transparent'
                    }`}
                  >
                    <Check className={`w-4 h-4 ${item.completed ? 'block' : 'opacity-0'}`} />
                  </button>

                  {/* CONTENIDO PRINCIPAL */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm sm:text-base font-bold text-zinc-900 leading-snug ${
                            item.completed ? 'line-through text-zinc-400' : ''
                          }`}
                        >
                          {item.title}
                        </h3>

                        {item.completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Completado
                          </span>
                        )}
                      </div>

                      {/* Botones de acción en tarjeta */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                          title="Editar pendiente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar "${item.title}"?`)) {
                              onDeletePendiente(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Eliminar pendiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Descripción o notas */}
                    {item.description && (
                      <p
                        className={`text-xs text-zinc-600 whitespace-pre-line leading-relaxed ${
                          item.completed ? 'line-through text-zinc-400' : ''
                        }`}
                      >
                        {item.description}
                      </p>
                    )}

                    {/* Meta tags / Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {/* Categoría */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold border ${cat.badgeClass}`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>

                      {/* Prioridad */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border ${pri.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pri.dotClass}`} />
                        <span>{pri.label}</span>
                      </span>

                      {/* Fecha de agendamiento / vencimiento */}
                      {item.dueDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>
                            {item.dueDate} {item.dueTime ? `(${item.dueTime})` : ''}
                          </span>
                        </span>
                      )}

                      {/* Costo estimado para compras/repuestos */}
                      {item.estimatedCost !== undefined && item.estimatedCost > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span>${Number(item.estimatedCost).toFixed(2)}</span>
                        </span>
                      )}

                      {/* Moto / Cliente relacionado */}
                      {item.relatedClientOrBike && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                          <Bike className="w-3 h-3 text-blue-600" />
                          <span>{item.relatedClientOrBike}</span>
                        </span>
                      )}

                      {/* Taller / Sede */}
                      {item.workshopName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium ml-auto">
                          <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{item.workshopName}</span>
                        </span>
                      )}
                    </div>

                    {/* Fecha de completado si aplica */}
                    {item.completed && item.completedAt && (
                      <div className="text-[10px] text-zinc-400 italic pt-1">
                        Completado el: {new Date(item.completedAt).toLocaleString('es-EC')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header del modal */}
            <div className="bg-blue-700 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-800 text-white">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {editingPendiente ? 'Editar Pendiente / Agendamiento' : 'Registrar Nuevo Pendiente'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Control operativo para compras, repuestos y citas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Título / Asunto del Pendiente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Comprar pastillas de freno Shineray XY200..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Categoría y Prioridad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PendienteCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white font-medium"
                  >
                    <option value="repuesto">Repuesto por Comprar</option>
                    <option value="compra">Compra / Insumo General</option>
                    <option value="revision">Revisión de Taller</option>
                    <option value="llamada">Llamada / Contacto Cliente</option>
                    <option value="gestion">Gestión / Trámite Administrativo</option>
                    <option value="otro">General / Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Prioridad</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PendientePriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white font-medium"
                  >
                    <option value="alta">Alta (Urgente)</option>
                    <option value="media">Media (Normal)</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              {/* Fecha y Hora de Agendamiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Fecha Agendada / Límite
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Hora Estimada</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Presupuesto / Costo y Sede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Costo Estimado ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formEstimatedCost}
                      onChange={(e) => setFormEstimatedCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Sede / Taller</label>
                  <select
                    value={formWorkshopId}
                    onChange={(e) => setFormWorkshopId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white font-medium"
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Moto o Cliente relacionado */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Moto o Cliente Relacionado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Shineray XY250 / Cliente Juan Pérez"
                  value={formRelatedClientOrBike}
                  onChange={(e) => setFormRelatedClientOrBike(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white"
                />
              </div>

              {/* Notas / Descripción */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Notas / Observaciones del Pedido
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre proveedores, especificaciones técnicas o indicaciones para el taller..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 focus:outline-hidden focus:border-blue-500 bg-white resize-none"
                />
              </div>

              {/* Estado de completado */}
              <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formCompletedCheckbox"
                  checked={formCompleted}
                  onChange={(e) => setFormCompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="formCompletedCheckbox"
                  className="text-xs font-medium text-zinc-700 cursor-pointer select-none"
                >
                  Marcar este ítem como ya completado
                </label>
              </div>

              {/* Footer de botones */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  {editingPendiente ? 'Actualizar Pendiente' : 'Guardar Pendiente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
