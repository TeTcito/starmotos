// src/utils/historicalOrderUtils.ts
import {
  MaintenanceRecord,
  MotorcycleClientData,
  WorkOrder,
  ProgressStep,
  Branch,
} from '../types/customer';
import { getStoredFullAlistamientos, getStoredOrders } from '../data/mockMultiRoleData';
import { ALL_BRANCHES, BRANCH_MATRIZ, DEFAULT_MOTORCYCLE } from '../hooks/useCustomerPortal';
import { isValidMediaUrl } from '../services/mediaStorage';

/**
 * Convierte un registro histórico de mantenimiento en una Orden de Trabajo completa
 * con todas sus fases finalizadas en verde ('entregado') para visualización de sólo lectura.
 */
export const buildHistoricalWorkOrder = (
  record: MaintenanceRecord,
  motorcycle?: MotorcycleClientData,
  defaultBranch?: Branch
): WorkOrder => {
  const safeMotorcycle: MotorcycleClientData = motorcycle || DEFAULT_MOTORCYCLE;

  const allAlistamientos = getStoredFullAlistamientos();
  const allOrders = getStoredOrders();

  // Buscar coincidencia en alistamientos
  let als = allAlistamientos.find(
    (a) =>
      (record.alistamientoId && a.id === record.alistamientoId) ||
      a.id === record.id ||
      (record.otNumber && a.numeroTicket && (a.numeroTicket === record.otNumber || a.numeroTicket.includes(record.otNumber) || record.otNumber.includes(a.numeroTicket))) ||
      (record.invoiceNumber && a.numeroFactura && a.numeroFactura === record.invoiceNumber)
  );

  if (!als && safeMotorcycle.plate) {
    const cleanPlate = safeMotorcycle.plate.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanPlate && !['sinplaca', 'sp', 'sn', 'entramite'].includes(cleanPlate)) {
      als = allAlistamientos.find((a) => (a.placa || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanPlate);
    }
  }

  // Buscar coincidencia en órdenes de taller
  const ord = allOrders.find(
    (o) =>
      o.id === record.id ||
      (record.otNumber && o.otNumber === record.otNumber) ||
      (als && o.alistamientoId === als.id)
  );

  const matchedBranch =
    ALL_BRANCHES.find(
      (b) =>
        b.id === (als?.sedeId || ord?.workshopId) ||
        b.name === (als?.sede || ord?.workshopName || record.branchName)
    ) ||
    defaultBranch ||
    BRANCH_MATRIZ;

  const totalCost =
    record.totalCost !== undefined && record.totalCost > 0
      ? Number(record.totalCost)
      : als?.valorServicio !== undefined && Number(als.valorServicio) > 0
      ? Number(als.valorServicio)
      : ord?.totalCost !== undefined && ord.totalCost > 0
      ? Number(ord.totalCost)
      : Number(record.totalPaid || 0);

  const abono =
    record.abono !== undefined
      ? Number(record.abono)
      : als?.abono !== undefined
      ? Number(als.abono)
      : totalCost;

  const saldoPendiente =
    record.saldoPendiente !== undefined
      ? Number(record.saldoPendiente)
      : als?.saldoPendiente !== undefined
      ? Number(als.saldoPendiente)
      : Math.max(0, totalCost - abono);

  const kmIngreso =
    als?.kilometraje !== undefined && Number(als.kilometraje) > 0
      ? Number(als.kilometraje)
      : record.mileage > 0
      ? record.mileage
      : safeMotorcycle.currentKm || 0;

  const kmSiguiente =
    als?.proximoMantenimientoKm ||
    (kmIngreso > 0 ? kmIngreso + (safeMotorcycle.oilChangeIntervalKm || 3000) : 3000);

  // Fases del servicio técnico: TODAS en verde con estado completado
  const stepsDef: ProgressStep[] = [
    {
      id: 'inicio',
      label: 'Recepción / Inicio',
      shortLabel: 'Inicio',
      description: 'Moto recibida en taller, inspeccionada y orden creada.',
      completed: true,
      current: false,
      timestamp: record.date,
    },
    {
      id: 'en_proceso',
      label: 'En Proceso',
      shortLabel: 'En Proceso',
      description: 'Diagnóstico técnico y preparación de insumos.',
      completed: true,
      current: false,
      timestamp: record.date,
    },
    {
      id: 'trabajando',
      label: 'Trabajando',
      shortLabel: 'Trabajando',
      description: 'Servicios mecánicos ejecutados con especificaciones OEM.',
      completed: true,
      current: false,
      timestamp: record.date,
    },
    {
      id: 'listo_para_entregar',
      label: 'Listo para Entregar',
      shortLabel: 'Listo',
      description: 'Control de calidad aprobado y vehículo listo para retiro.',
      completed: true,
      current: false,
      timestamp: record.date,
    },
    {
      id: 'entregado',
      label: 'Entregado con Conformidad',
      shortLabel: 'Entregado',
      description: 'Vehículo retirado y entregado al cliente a satisfacción.',
      completed: true,
      current: true,
      timestamp: record.date,
    },
  ];

  const rawFotos =
    record.fotos && record.fotos.length > 0
      ? record.fotos
      : als?.fotos && als.fotos.length > 0
      ? als.fotos
      : [];
  const validFotos = rawFotos.filter(isValidMediaUrl);
  const fotos = validFotos;

  const techName =
    als?.tecnicoResponsable ||
    ord?.mechanicName ||
    record.technicianName ||
    'Técnico Especialista StarMotos';

  const entryTime = als?.horaServicio || '08:30';

  return {
    otNumber: record.otNumber,
    entryDate: record.date,
    entryTime: entryTime,
    estimatedDelivery: 'Entregada con Conformidad',
    clientReason:
      als?.observaciones ||
      ord?.servicesSummary ||
      record.workSummary?.join(' • ') ||
      'Mantenimiento preventivo certificado',
    branch: matchedBranch,
    mechanic: {
      id: als?.tecnicoId || 'tech-assigned',
      name: techName,
      specialty: 'Mecánico Certificado StarMotos',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      certifications: ['Técnico Homologado StarMotos'],
    },
    advisor: als?.sede || ord?.workshopName || record.branchName || matchedBranch.name,
    status: 'entregado',
    steps: stepsDef,
    supervisorObservations:
      als?.observaciones ||
      'Servicio técnico finalizado y entregado al cliente con conformidad técnica.',
    diagnosticPhotos: fotos.map((f, i) => ({
      id: `foto-${i}`,
      url: f,
      title: `Inspección de Recepción ${i + 1}`,
      description: 'Estado de recepción y entrega de la motocicleta',
      uploadedAt: record.date,
      stage: 'Entregado',
    })),
    alistamientoId: als?.id || record.alistamientoId,
    serviciosRealizados: als?.serviciosRealizados || ['mantenimiento'],
    tecnicoResponsable: techName,
    kilometrajeIngreso: kmIngreso,
    proximoMantenimientoKm: kmSiguiente,
    tipoAceite:
      als?.tipoAceite ||
      record.partsReplaced?.find(
        (p) => p.toLowerCase().includes('motul') || p.toLowerCase().includes('aceite')
      ) ||
      'Motul 7100 10W-40 100% Sintético',
    nivelAceite: als?.nivelAceite || 'Sintético',
    estadoAceite: als?.aceite || 'con_aceite',
    valorServicio: totalCost,
    abono: abono,
    saldoPendiente: saldoPendiente,
    metodoPago: (als?.metodoPago as any) || 'Efectivo',
    observacionesTaller:
      als?.observaciones ||
      `${record.workSummary.join('. ')}. Servicio técnico finalizado y entregado con conformidad del cliente.`,
    numeroFactura: record.invoiceNumber || als?.numeroFactura || '',
    numeroTicket: record.otNumber || als?.numeroTicket || '',
    fotosIngreso: fotos,
    origenIngreso: als?.origen || 'Taller StarMotos',
    orderId: ord?.id,
    rating: ord?.rating,
    quotation: {
      quotationNumber: `COT-${record.otNumber.replace(/[^0-9]/g, '') || '01'}`,
      createdAt: record.date,
      expiresAt: 'Completado',
      status: 'aprobado',
      parts:
        record.partsReplaced?.map((p, idx) => ({
          code: `REP-0${idx + 1}`,
          description: p,
          brand: 'StarMotos OEM',
          quantity: 1,
          unitPrice: 0,
          subtotal: 0,
          warrantyMonths: 6,
        })) || [],
      services:
        record.workSummary?.map((s, idx) => ({
          code: `SRV-0${idx + 1}`,
          description: s,
          hours: 1,
          unitCost: totalCost / (record.workSummary.length || 1),
          subtotal: totalCost / (record.workSummary.length || 1),
        })) || [],
      subtotalParts: 0,
      subtotalServices: totalCost,
      subtotal: totalCost,
      discount: 0,
      taxRate: 0.15,
      taxAmount: 0,
      total: totalCost,
      mechanicNotes: 'Servicio entregado con conformidad y respaldo técnico de garantía.',
    },
  };
};
