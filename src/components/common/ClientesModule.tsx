// src/components/common/ClientesModule.tsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Bike,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Wrench,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  X,
  Building2,
  ChevronRight,
  Filter,
  Eye,
  DollarSign,
  Clock,
  Camera,
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  TallerClient,
  Workshop,
  WarrantyRequest,
  UnifiedClient,
} from '../../types/customer';

interface Props {
  role: 'admin' | 'taller' | 'garante';
  currentWorkshopId?: string;
  workshops: Workshop[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  warranties?: WarrantyRequest[];
  onNavigateToAlistamiento?: (clientCedula?: string) => void;
}

export const ClientesModule: React.FC<Props> = ({
  role,
  currentWorkshopId,
  workshops,
  fullAlistamientos = [],
  clients = [],
  warranties = [],
  onNavigateToAlistamiento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'pdi_ok' | 'warranties' | 'frequent'>('all');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<UnifiedClient | null>(null);
  const [copiedCedula, setCopiedCedula] = useState<string | null>(null);

  // Unificación de clientes entre fullAlistamientos y clients
  const unifiedClients = useMemo<UnifiedClient[]>(() => {
    const map = new Map<string, UnifiedClient>();

    // 1. Procesar todos los registros de Alistamiento
    fullAlistamientos.forEach((rec) => {
      const cedula = rec.cedulaRuc.trim();
      if (!cedula) return;

      const ws = workshops.find((w) => w.id === rec.sedeId || w.name === rec.sede);
      const isPdi = rec.serviciosRealizados?.includes('alistamiento_pdi') || false;
      const isEngrasado = rec.serviciosRealizados?.includes('engrasado') || false;
      const isMant = rec.serviciosRealizados?.includes('mantenimiento') || false;
      const cost = rec.montoPagado || rec.valorServicio || 0;

      if (!map.has(cedula)) {
        const matchingWarranties = warranties.filter(
          (w) =>
            w.clientIdNumber === cedula ||
            w.clientName.toLowerCase().includes(rec.nombres.toLowerCase()) ||
            (w.motorcyclePlate && rec.placa && w.motorcyclePlate.toLowerCase() === rec.placa.toLowerCase()) ||
            (w.motorcycleVin && rec.chasis && w.motorcycleVin.toLowerCase() === rec.chasis.toLowerCase())
        );

        map.set(cedula, {
          id: cedula,
          fullName: `${rec.nombres} ${rec.apellidos}`.trim(),
          nombres: rec.nombres,
          apellidos: rec.apellidos,
          cedulaRuc: cedula,
          phone: rec.celular1,
          phone2: rec.celular2,
          email: rec.email,
          address: rec.direccion,
          origin: rec.origen,
          workshopId: rec.sedeId || ws?.id || 'taller-quevedo',
          workshopName: rec.sede || ws?.name || 'Sede Quevedo',
          motorcycles: [
            {
              model: rec.modeloMarca,
              plate: rec.placa,
              chasis: rec.chasis,
              lastMileage: rec.kilometraje,
            },
          ],
          pdiCompleted: isPdi,
          engrasadoCompleted: isEngrasado,
          maintenanceCount: isMant ? 1 : 0,
          totalSpent: cost,
          lastVisitDate: rec.fechaServicio || rec.createdAt,
          lastServiceType: rec.serviciosRealizados?.join(', ') || 'Alistamiento',
          warrantiesCount: matchingWarranties.length,
          records: [rec],
        });
      } else {
        const existing = map.get(cedula)!;
        existing.records.push(rec);
        existing.totalSpent += cost;
        if (isPdi) existing.pdiCompleted = true;
        if (isEngrasado) existing.engrasadoCompleted = true;
        if (isMant) existing.maintenanceCount += 1;

        // Comprobar si es una nueva moto o fecha más reciente
        const hasMoto = existing.motorcycles.some(
          (m) => (m.chasis && m.chasis === rec.chasis) || (m.plate && m.plate === rec.placa)
        );
        if (!hasMoto && (rec.chasis || rec.placa)) {
          existing.motorcycles.push({
            model: rec.modeloMarca,
            plate: rec.placa,
            chasis: rec.chasis,
            lastMileage: rec.kilometraje,
          });
        }

        // Actualizar última visita si esta fecha es más reciente
        if (rec.fechaServicio && rec.fechaServicio > existing.lastVisitDate) {
          existing.lastVisitDate = rec.fechaServicio;
          existing.lastServiceType = rec.serviciosRealizados?.join(', ') || 'Mantenimiento';
        }
      }
    });

    // 2. Incorporar clientes de la base TallerClient si no existen aún
    clients.forEach((c) => {
      const cedula = c.idNumber.trim();
      if (!cedula) return;

      if (!map.has(cedula)) {
        const parts = c.fullName.split(' ');
        const matchingWarranties = warranties.filter(
          (w) =>
            w.clientName.toLowerCase().includes(c.fullName.toLowerCase()) ||
            w.motorcyclePlate?.toLowerCase() === c.motorcyclePlate?.toLowerCase()
        );

        map.set(cedula, {
          id: cedula,
          fullName: c.fullName,
          nombres: parts[0] || c.fullName,
          apellidos: parts.slice(1).join(' ') || '',
          cedulaRuc: cedula,
          phone: c.phone,
          email: c.email,
          workshopId: c.workshopId || currentWorkshopId || 'taller-quevedo',
          workshopName: c.workshopName || 'Sede Quevedo',
          motorcycles: [
            {
              model: `${c.motorcycleBrand} ${c.motorcycleModel}`.trim(),
              brand: c.motorcycleBrand,
              plate: c.motorcyclePlate,
              chasis: 'S/N',
            },
          ],
          pdiCompleted: false,
          engrasadoCompleted: false,
          maintenanceCount: c.totalVisits || 1,
          totalSpent: (c.totalVisits || 1) * 35.0,
          lastVisitDate: c.lastVisit || 'Reciente',
          lastServiceType: 'Mantenimiento',
          warrantiesCount: matchingWarranties.length,
          records: [],
        });
      }
    });

    return Array.from(map.values());
  }, [fullAlistamientos, clients, workshops, warranties, currentWorkshopId]);

  // Filtrado según rol, sede, tab y búsqueda
  const filteredClients = useMemo(() => {
    return unifiedClients.filter((client) => {
      // Filtro de alcance por rol
      if (role === 'taller' && currentWorkshopId) {
        const matchesWorkshop =
          client.workshopId === currentWorkshopId ||
          client.records.some((r) => r.sedeId === currentWorkshopId);
        if (!matchesWorkshop) return false;
      }

      if (role === 'admin' && selectedWorkshopFilter !== 'all') {
        const matchesSelected =
          client.workshopId === selectedWorkshopFilter ||
          client.records.some((r) => r.sedeId === selectedWorkshopFilter);
        if (!matchesSelected) return false;
      }

      // Filtro de Tabs
      if (activeFilterTab === 'pdi_ok' && !client.pdiCompleted) return false;
      if (activeFilterTab === 'warranties' && client.warrantiesCount === 0) return false;
      if (activeFilterTab === 'frequent' && client.maintenanceCount < 2) return false;

      // Buscador
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = client.fullName.toLowerCase().includes(term);
        const matchCedula = client.cedulaRuc.toLowerCase().includes(term);
        const matchPhone = client.phone?.toLowerCase().includes(term);
        const matchMoto = client.motorcycles.some(
          (m) =>
            m.model.toLowerCase().includes(term) ||
            m.plate.toLowerCase().includes(term) ||
            m.chasis.toLowerCase().includes(term)
        );
        return matchName || matchCedula || matchPhone || matchMoto;
      }

      return true;
    });
  }, [unifiedClients, role, currentWorkshopId, selectedWorkshopFilter, activeFilterTab, searchTerm]);

  // Métricas rápidas
  const totalMotos = useMemo(
    () => filteredClients.reduce((acc, c) => acc + c.motorcycles.length, 0),
    [filteredClients]
  );
  const totalPdiOk = useMemo(
    () => filteredClients.filter((c) => c.pdiCompleted).length,
    [filteredClients]
  );
  const totalSpentAll = useMemo(
    () => filteredClients.reduce((acc, c) => acc + c.totalSpent, 0),
    [filteredClients]
  );

  const handleCopyCedula = (cedula: string) => {
    navigator.clipboard.writeText(cedula);
    setCopiedCedula(cedula);
    setTimeout(() => setCopiedCedula(null), 1800);
  };

  const getCleanWhatsappUrl = (phone: string, clientName: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos desde el Taller Oficial StarMotos. ¿En qué podemos ayudarle con su motocicleta?`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. HEADER & MÉTRICAS                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                {role === 'admin'
                  ? 'Fichero Nacional de Clientes & Flota'
                  : role === 'taller'
                  ? 'Directorio de Clientes & Propietarios del Taller'
                  : 'Clientes & Flota Oficial con Cobertura de Garantía'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                {filteredClients.length} Clientes
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {role === 'admin'
                ? 'Control centralizado de propietarios, motocicletas asignadas, estado de alistamientos y facturación consolidada.'
                : role === 'taller'
                ? 'Historial de propietarios locales, contacto directo por WhatsApp y acceso rápido a alistamientos.'
                : 'Auditoría de propietarios de unidades comercializadas, inspección PDI obligatoria y gestión de garantías.'}
            </p>
          </div>

          {/* Botón rápido para registrar alistamiento */}
          {onNavigateToAlistamiento && (
            <button
              type="button"
              onClick={() => onNavigateToAlistamiento()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Alistamiento</span>
            </button>
          )}
        </div>

        {/* Métricas Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100">
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Total Clientes
            </span>
            <span className="text-lg sm:text-xl font-black text-zinc-900 mt-0.5 block">
              {filteredClients.length}
            </span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Motos Registradas
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 block">
              {totalMotos}
            </span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Con Alistamiento PDI
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 block">
              {totalPdiOk}
            </span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/60">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              {role === 'garante' ? 'Casos de Garantía' : 'Facturación Total'}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-700 mt-0.5 block font-mono">
              {role === 'garante'
                ? filteredClients.reduce((acc, c) => acc + c.warrantiesCount, 0)
                : `$${totalSpentAll.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE BÚSQUEDA Y FILTROS                                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cédula, nombre de cliente, placa, chasis (VIN) o teléfono..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de Sede para Matriz */}
          {role === 'admin' && (
            <div className="sm:w-64">
              <select
                value={selectedWorkshopFilter}
                onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs sm:text-sm font-semibold text-zinc-800 outline-none focus:border-blue-600"
              >
                <option value="all">🏢 Todas las Sedes StarMotos</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chips de Filtro Rápido */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              activeFilterTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todos ({unifiedClients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('pdi_ok')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeFilterTab === 'pdi_ok'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>PDI Oficial Realizado ({unifiedClients.filter((c) => c.pdiCompleted).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('warranties')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeFilterTab === 'warranties'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Con Garantías ({unifiedClients.filter((c) => c.warrantiesCount > 0).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('frequent')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeFilterTab === 'frequent'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Clientes Frecuentes ({unifiedClients.filter((c) => c.maintenanceCount >= 2).length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRID DE TARJETAS DE CLIENTES                                           */}
      {/* ========================================================================= */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const mainMoto = client.motorcycles[0];
            const initials = client.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={client.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all hover:border-blue-300 flex flex-col justify-between"
              >
                <div>
                  {/* Cabecera Tarjeta: Avatar + Nombre + Sede */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                          {client.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono font-bold text-zinc-600">
                            C.I: {client.cedulaRuc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCedula(client.cedulaRuc)}
                            className="text-zinc-400 hover:text-blue-600 cursor-pointer p-0.5"
                            title="Copiar cédula"
                          >
                            {copiedCedula === client.cedulaRuc ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
                      {client.workshopName}
                    </span>
                  </div>

                  {/* Datos de Contacto */}
                  <div className="py-2.5 space-y-1.5 text-xs text-zinc-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono">{client.phone || 'Sin número'}</span>
                      </div>
                      {client.phone && (
                        <a
                          href={getCleanWhatsappUrl(client.phone, client.fullName)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="text-[10px] text-zinc-400 truncate">
                        📍 {client.address}
                      </div>
                    )}
                  </div>

                  {/* Motocicleta Asociada */}
                  {mainMoto && (
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                          <Bike className="w-3.5 h-3.5 text-blue-600" />
                          <span>{mainMoto.model}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-zinc-200">
                          {mainMoto.plate || 'S/P'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">
                        VIN: {mainMoto.chasis || 'S/N'}
                        {mainMoto.lastMileage ? ` • ${mainMoto.lastMileage} km` : ''}
                      </div>
                    </div>
                  )}

                  {/* Badges de Estados Técnicos */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {client.pdiCompleted ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PDI Oficial OK</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>PDI Pendiente</span>
                      </span>
                    )}

                    {client.engrasadoCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        Engrasado OK
                      </span>
                    )}

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                      {client.maintenanceCount} Mantenimientos
                    </span>

                    {client.warrantiesCount > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{client.warrantiesCount} Garantías</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones al Pie de la Tarjeta */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-400">
                    Última visita: <strong className="text-zinc-700">{client.lastVisitDate}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedClientForDetail(client)}
                      className="px-2.5 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ficha</span>
                    </button>

                    {onNavigateToAlistamiento && (
                      <button
                        type="button"
                        onClick={() => onNavigateToAlistamiento(client.cedulaRuc)}
                        className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Crear nuevo servicio de alistamiento o mantenimiento"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Servicio</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-bold text-zinc-800">
            No se encontraron clientes con los filtros aplicados
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Verifique la ortografía de la cédula o nombre, o cambie el filtro de sede para ver más resultados.
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActiveFilterTab('all');
                setSelectedWorkshopFilter('all');
              }}
              className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl cursor-pointer"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: FICHA DETALLADA DEL CLIENTE & HISTORIAL                         */}
      {/* ========================================================================= */}
      {selectedClientForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200 animate-slide-in">
            {/* Header Modal */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  {selectedClientForDetail.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    {selectedClientForDetail.fullName}
                  </h3>
                  <p className="text-xs text-zinc-300">
                    C.I. / RUC: <span className="font-mono font-bold text-white">{selectedClientForDetail.cedulaRuc}</span> • Sede:{' '}
                    <span className="font-bold text-blue-400">{selectedClientForDetail.workshopName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientForDetail(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-700">
              {/* Bloque 1: Resumen Propietario & Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-900 block">
                    Contacto Directo
                  </span>
                  <div className="font-mono font-bold text-zinc-800 text-xs">
                    {selectedClientForDetail.phone || 'Sin celular'}
                  </div>
                  {selectedClientForDetail.email && (
                    <div className="text-[11px] text-zinc-600 truncate">
                      {selectedClientForDetail.email}
                    </div>
                  )}
                  {selectedClientForDetail.address && (
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-blue-200/50">
                      📍 {selectedClientForDetail.address}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-900 block">
                    Cumplimiento Técnico
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    {selectedClientForDetail.pdiCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Alistamiento PDI Oficial Realizado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Alistamiento PDI Pendiente</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Engrasado: <strong>{selectedClientForDetail.engrasadoCompleted ? 'Completado' : 'Pendiente'}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    Total Servicios: <strong>{selectedClientForDetail.records.length} registrados</strong>
                  </div>
                </div>

                <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-900 block">
                    Facturación & Garantías
                  </span>
                  <div className="text-sm font-black font-mono text-purple-950">
                    ${selectedClientForDetail.totalSpent.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Garantías asociadas: <strong>{selectedClientForDetail.warrantiesCount}</strong>
                  </div>
                  <div className="text-[10px] text-purple-700">
                    Origen: <strong>{selectedClientForDetail.origin || 'Almacén Oficial'}</strong>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Motocicletas Registradas */}
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-2 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-blue-600" />
                  <span>Parque Vehicular Registrado ({selectedClientForDetail.motorcycles.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedClientForDetail.motorcycles.map((moto, i) => (
                    <div
                      key={i}
                      className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 text-xs">{moto.model}</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          VIN: {moto.chasis || 'S/N'}
                          {moto.lastMileage ? ` • ${moto.lastMileage} km` : ''}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-zinc-300 rounded-md">
                        {moto.plate || 'S/P'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 3: Historial de Servicios & Alistamientos */}
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Historial de Servicios & Alistamientos ({selectedClientForDetail.records.length})</span>
                </h4>

                {selectedClientForDetail.records.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedClientForDetail.records.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-900">
                              {rec.serviciosRealizados?.map((s) => s.toUpperCase()).join(' • ')}
                            </span>
                            <span className="text-[10px] text-zinc-400">• {rec.fechaServicio}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ${(rec.montoPagado || rec.valorServicio).toFixed(2)} ({rec.metodoPago})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg">
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Técnico</span>
                            <strong>{rec.tecnicoResponsable}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Kilometraje</span>
                            <strong>{rec.kilometraje} km</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Aceite</span>
                            <strong>{rec.aceite === 'sin_aceite' ? 'Sin Aceite' : rec.nivelAceite || 'Óptimo'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Factura</span>
                            <strong className="font-mono">{rec.numeroFactura || 'S/F'}</strong>
                          </div>
                        </div>

                        {rec.observaciones && (
                          <p className="text-[11px] text-zinc-600 italic bg-zinc-50/50 p-2 rounded border border-zinc-100">
                            "{rec.observaciones}"
                          </p>
                        )}

                        {rec.fotos && rec.fotos.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-zinc-400" />
                              <span>Evidencias de Entrega ({rec.fotos.length})</span>
                            </span>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                              {rec.fotos.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="aspect-video rounded overflow-hidden border border-zinc-200 block group relative"
                                >
                                  <img
                                    src={url}
                                    alt={`Evidencia ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    No registra alistamientos o mantenimientos cargados en este portal aún.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Ficha generada para el sistema integral StarMotos.
              </span>
              <div className="flex items-center gap-2">
                {onNavigateToAlistamiento && (
                  <button
                    type="button"
                    onClick={() => {
                      const cId = selectedClientForDetail.cedulaRuc;
                      setSelectedClientForDetail(null);
                      onNavigateToAlistamiento(cId);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar Nuevo Alistamiento / Servicio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedClientForDetail(null)}
                  className="px-4 py-2 text-xs font-bold bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
