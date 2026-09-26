// src/types/customer.ts
// Definiciones completas de tipos para el Portal de Clientes StarMotos

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

export interface ClientProfile {
  id: string;
  fullName: string;
  idNumber: string;         // Cédula o RUC ecuatoriano
  phone: string;            // WhatsApp principal
  email: string;            // Correo para facturación electrónica SRI
  address: string;          // Dirección domiciliaria
  city: string;             // Ciudad (ej. Quito)
  emergencyContactName: string;
  emergencyContactPhone: string;
  clientType: 'particular' | 'delivery' | 'motoviajero';
  avatarUrl: string;
  mustChangePassword?: boolean;
}

export interface MotorcycleClientData {
  plate: string;            // Placa Ecuador ej. "PBX-8492"
  brand: string;            // ej. "Benelli"
  model: string;            // ej. "TRK 502X ABS"
  year: number;             // ej. 2024
  displacement: string;     // ej. "500 cc"
  vin: string;              // Número de chasis
  color: string;            // ej. "Gris Antracita / Rojo Racing"
  currentKm: number;        // Kilometraje reportado por el cliente
  lastOilChangeKm: number;  // Último cambio registrado
  oilChangeIntervalKm: number; // Intervalo recomendado ej. 3000 km o 5000 km
  preferredOil: string;     // ej. "Motul 7100 10W-40 Sintético"
  dailyUsageKm: number;     // Promedio de km por día
  reportedSymptoms: string; // Síntomas, ruidos o fallas reportadas para el taller
  preferredPartsQuality: 'originales_oem' | 'alternativos_premium';
  preferredBranchId: string; // 'matriz-la-mana' | 'taller-quevedo'
  photoUrl: string;
}

export type ScheduledMaintenanceStatus = 'pendiente' | 'confirmada' | 'completada';

export interface ScheduledMaintenance {
  id: string;
  serviceTitle: string;
  recommendedKm: number;
  recommendedDate: string;
  scheduledDate?: string;
  scheduledTime?: string;
  branchName: string;
  branchId: string;
  status: ScheduledMaintenanceStatus;
  estimatedCost: number;
  tasks: string[];
  notes?: string;
}

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  displacement: string;
  year: number;
  color: string;
  vin: string;
  currentKm: number;
  fuelLevel: FuelLevel;
  fuelPercentage: number;
  photoUrl: string;
}

export type DamageSeverity = 'leve' | 'moderado' | 'grave';

export interface DamageCheckItem {
  id: string;
  zone: string;
  damageType: string;
  severity: DamageSeverity;
  advisorNotes: string;
  photoUrl?: string;
}

export interface Inspection360Photos {
  frontal: string;
  lateralIzq: string;
  lateralDer: string;
  trasera: string;
  tablero: string;
}

export interface ClientDigitalSignature {
  signatureUrl: string;
  clientName: string;
  identificationId: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Inspection360 {
  receptionDate: string;
  advisorName: string;
  photos: Inspection360Photos;
  damages: DamageCheckItem[];
  advisorGeneralNotes: string;
  fuelLevelAtCheckin: FuelLevel;
  kmAtCheckin: number;
  helmetReceived: boolean;
  documentsReceived: boolean;
  toolsReceived: boolean;
  signature: ClientDigitalSignature;
}

export type WorkOrderStatus =
  | 'recepcion'
  | 'diagnostico'
  | 'cotizacion_pendiente'
  | 'en_reparacion'
  | 'control_calidad'
  | 'lista_retiro'
  | 'entregada'
  | 'inicio'
  | 'en_proceso'
  | 'trabajando'
  | 'listo_para_entregar'
  | 'entregado';

export interface ProgressStep {
  id: WorkOrderStatus;
  label: string;
  shortLabel: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  schedule: string;
  googleMapsUrl: string;
  province?: string;
  canton?: string;
  parroquia?: string;
  reference?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  certifications: string[];
}

export interface DiagnosticPhoto {
  id: string;
  url: string;
  title: string;
  description: string;
  uploadedAt: string;
  stage: string;
}

export interface PartItem {
  code: string;
  description: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  warrantyMonths: number;
}

export interface ServiceItem {
  code: string;
  description: string;
  hours: number;
  unitCost: number;
  subtotal: number;
}

export type QuotationStatus = 'pendiente_aprobacion' | 'aprobado' | 'rechazado';

export interface Quotation {
  quotationNumber: string;
  createdAt: string;
  expiresAt: string;
  status: QuotationStatus;
  approvedAt?: string;
  approvedBy?: string;
  parts: PartItem[];
  services: ServiceItem[];
  subtotalParts: number;
  subtotalServices: number;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  mechanicNotes: string;
}

export interface MaintenanceRecord {
  id: string;
  otNumber: string;
  invoiceNumber: string;
  date: string;
  mileage: number;
  branchName: string;
  workSummary: string[];
  partsReplaced: string[];
  totalPaid: number;
  technicianName: string;
}

export type WarrantyStatus = 'vigente' | 'por_vencer' | 'vencida';
export type WarrantyType = 'repuesto' | 'mano_de_obra' | 'garantia_fabrica';

export interface WarrantyItem {
  id: string;
  title: string;
  type: WarrantyType;
  status: WarrantyStatus;
  coverage: string;
  startDate: string;
  expirationDate: string;
  kmLimit: number;
  currentKm: number;
  terms: string;
}

export interface OrderRating {
  id: string;
  orderId: string;
  otNumber: string;
  clientIdNumber: string;
  clientName: string;
  motorcycleInfo?: string;
  plate?: string;
  technicianName: string;
  technicianId?: string;
  workshopId?: string;
  workshopName?: string;
  serviceSummary?: string;
  stars: number; // 1 - 5
  comment: string;
  createdAt: string;
}

export interface WorkOrder {
  otNumber: string;
  entryDate: string;
  entryTime?: string;
  estimatedDelivery: string;
  clientReason: string;
  branch: Branch;
  mechanic: Mechanic;
  advisor: string;
  status: WorkOrderStatus;
  steps: ProgressStep[];
  quotation: Quotation;
  diagnosticPhotos: DiagnosticPhoto[];
  supervisorObservations: string;
  pickupReadyNotice?: string;
  // Campos vinculados al Alistamiento / Servicio Real
  alistamientoId?: string;
  serviciosRealizados?: ServiceActionType[];
  tecnicoResponsable?: string;
  kilometrajeIngreso?: number;
  proximoMantenimientoKm?: number;
  tipoAceite?: string;
  nivelAceite?: string;
  estadoAceite?: string;
  valorServicio?: number;
  abono?: number;
  saldoPendiente?: number;
  metodoPago?: string;
  observacionesTaller?: string;
  numeroFactura?: string;
  numeroTicket?: string;
  fotosIngreso?: string[];
  origenIngreso?: string;
  orderId?: string;
  rating?: OrderRating;
}

export interface CustomerPortalData {
  profile: ClientProfile;
  motorcycle: MotorcycleClientData;
  scheduledMaintenances: ScheduledMaintenance[];
  vehicle: Vehicle;
  activeOrder: WorkOrder;
  inspection: Inspection360;
  history: MaintenanceRecord[];
  warranties: WarrantyItem[];
}

// ===================== SISTEMA MULTI-ROL =====================

export type UserRole = 'cliente' | 'admin' | 'taller' | 'garante';

// --- Secciones por rol ---
export type AdminSection =
  | 'talleres'
  | 'pendientes'
  | 'alistamiento'
  | 'clientes_admin'
  | 'garantias_admin'
  | 'tecnicos'
  | 'facturacion'
  | 'alertas';

export type AdminSectionMobile = AdminSection | 'perfil_admin';

export type TallerSection =
  | 'perfil_taller'
  | 'ordenes_taller'
  | 'agendamientos'
  | 'alistamiento_taller'
  | 'solicitudes_garantia'
  | 'clientes_taller'
  | 'tecnicos'
  | 'inventario'
  | 'alertas_taller';

export type TallerSectionMobile = TallerSection;

export interface AdminProfile {
  id?: string;
  fullName: string;
  firstNames: string;
  lastNames: string;
  email: string;
  phone: string;
  roleTitle?: string;
  companyName?: string;
  roleName?: string;
  organization?: string;
  updatedAt?: string;
}

export type GaranteSection =
  | 'solicitudes_garante'
  | 'historial_garantias'
  | 'clientes_garante'
  | 'reportes_garante'
  | 'perfil_garante'
  | 'alertas_garante';

// --- Flujo de Garantías (Máquina de Estados) ---
export type WarrantyRequestStatus =
  | 'en_revision'
  | 'en_proceso'
  | 'en_proceso_aceptacion_2'
  | 'aceptada'
  | 'denegada'
  | 'enviada_matriz'
  | 'validada_matriz'
  | 'enviada_garante'
  | 'aprobada'
  | 'rechazada'
  | 'completada'
  | 'creada';

export interface WarrantyRequest {
  id: string;
  requestNumber: string;
  createdAt: string;
  clientName: string;
  clientIdNumber: string;
  clientPhone?: string;
  motorcycleBrand: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  motorcycleVin: string;
  motorcycleMileage?: number;
  motorNumber?: string;
  ramvNumber?: string;
  warrantyType: 'marca' | 'plus_taller' | 'gps' | string;
  issueDescription: string;
  diagnosticPhotos: string[];
  status: WarrantyRequestStatus;
  tallerOrigin: string;
  tallerOriginId: string;
  partsRequired?: string;
  partsTags?: string[];
  resolutionType?: 'encargar_taller' | 'envio_repuesto';
  partsBudget?: Record<string, number> | Array<{ name: string; cost: number }>;
  partsObservations?: Record<string, string>;
  laborTime?: string;
  laborCost?: number;
  totalBudget?: number;
  mechanicDiagnosis?: string;
  matrizNotes?: string;
  garanteNotes?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  estimatedCost?: number;
  invoiceNumber?: string;
  garanteId?: string;
  targetBrand?: string;
  garanteName?: string;
  destinationType?: 'matriz' | 'garante';
}

// --- Entidad Taller ---
export interface Workshop {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  status: 'operativo' | 'mantenimiento' | 'inactivo';
  activeOrders: number;
  completedToday: number;
  pendingWarranties: number;
  mechanics: number;
  province?: string;
  canton?: string;
  parroquia?: string;
  reference?: string;
  street?: string;
  intersection?: string;
  number?: string;
  email?: string;
}

// --- Alistamiento (Wizard 3 Pasos Profesional) ---
export type ServiceActionType =
  | 'alistamiento_pdi'
  | 'engrasado'
  | 'mantenimiento';

export interface AlistamientoFullRecord {
  id: string;
  // Paso 1: Atención & Sede
  atendidoPor: string;
  sede: string;
  sedeId: string;
  fechaServicio: string;
  horaServicio?: string;
  // Paso 1: Datos del cliente
  nombres: string;
  apellidos: string;
  cedulaRuc: string;
  celular1: string;
  celular2?: string;
  email: string;
  direccion: string;
  origen: string; // ej: "almacen Tenso santo domingo"
  // Paso 2: Datos de la moto
  motoPreviaId?: string;
  chasis: string; // VIN
  numeroMotor?: string;
  ramv?: string;
  placa: string;
  modeloMarca: string;
  color?: string;
  year?: number;
  // Paso 3: Datos del servicio
  serviciosRealizados: ServiceActionType[];
  tecnicoResponsable: string;
  tecnicoId: string;
  kilometraje: number;
  aceite: 'sin_aceite' | 'con_aceite' | string;
  nivelAceite?: string;
  tipoAceite?: string;
  numeroFactura: string;
  numeroTicket: string;
  valorServicio: number;
  montoPagado: number;
  abono?: number;
  saldoPendiente?: number;
  esCredito?: boolean;
  mesesCredito?: number;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Mixto' | 'Crédito' | 'Crédito Directo';
  observaciones: string;
  proximoMantenimientoKm: number;
  fotos: string[];
  evidenciaTransferencia?: string;
  comprobantePagoUrl?: string;
  historialAbonos?: AbonoRecord[];
  createdAt: string;
}

export interface AbonoRecord {
  id: string;
  fecha: string;
  hora?: string;
  monto: number;
  metodoPago: string;
  evidenciaTransferencia?: string;
  numeroFactura?: string;
  saldoRestante: number;
  registradoPor?: string;
}

export type AlistamientoFormData = Omit<
  AlistamientoFullRecord,
  'kilometraje' | 'valorServicio' | 'montoPagado' | 'abono' | 'saldoPendiente' | 'proximoMantenimientoKm' | 'year'
> & {
  kilometraje: number | string;
  valorServicio: number | string;
  montoPagado: number | string;
  abono?: number | string;
  saldoPendiente?: number | string;
  proximoMantenimientoKm: number | string;
  year?: number | string;
};

// --- Entidad Técnico ---
export interface Technician {
  id: string;
  name: string;
  workshopId: string;
  workshopName: string;
  specialty: string;
  phone: string;
  status: 'activo' | 'inactivo';
  avatarUrl?: string;
  activeOrdersCount: number;
}

export interface AlistamientoClient {
  idNumber: string;
  fullName: string;
  tipoContribuyente: string;
  phone: string;
  email: string;
  address: string;
}

export interface AlistamientoMotorcycle {
  brand: string;
  model: string;
  chassisNumber: string;
  plate: string;
  year: number;
  color: string;
}

export type MaintenanceType = 'preventivo' | 'engrasado' | 'mantenimiento_completo';

export interface AlistamientoService {
  maintenanceType: MaintenanceType;
  observations: string;
  invoiceNumber: string;
  cost: number;
}

// --- Alertas del Sistema ---
export type AlertRole = 'admin' | 'taller' | 'garante' | 'cliente' | 'all';

export type AlertType =
  | 'orden_creada'
  | 'estado_cambiado'
  | 'factura_emitida'
  | 'garantia_aprobada'
  | 'garantia_rechazada'
  | 'cliente_creado'
  | 'solicitud_garantia'
  | 'garantia_validada'
  | 'dictamen_emitido'
  | 'cita_agendada'
  | 'stock_bajo'
  | 'info';

export interface SystemAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  targetRole?: AlertRole;
  targetRoles?: ('admin' | 'taller' | 'garante' | 'cliente')[];
  targetWorkshopId?: string;
  targetBrand?: string;
  targetClientId?: string;
}

// --- Factura Admin ---
export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientIdNumber: string;
  date: string;
  subtotal: number;
  iva: number;
  total: number;
  status: 'emitida' | 'anulada' | 'pendiente';
  workshopName: string;
}

// --- Inventario Taller ---
export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  lastRestocked: string;
}

// --- Cliente de Taller ---
export interface TallerClient {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  motorcycleBrand: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  motorcycleVin?: string;
  motorNumber?: string;
  ramvNumber?: string;
  motorcycleMileage?: number;
  address?: string;
  color?: string;
  year?: number;
  lastVisit: string;
  totalVisits: number;
  workshopId?: string;
  workshopName?: string;
  mustChangePassword?: boolean;
  createdManually?: boolean;
  password?: string;
}

export interface TallerOrder {
  id: string;
  otNumber: string;
  clientName: string;
  clientIdNumber: string;
  motorcycleInfo: string;
  plate: string;
  entryDate: string;
  status: WorkOrderStatus;
  mechanicName: string;
  estimatedDelivery: string;
  totalCost: number;
  workshopId?: string;
  workshopName?: string;
  alistamientoId?: string;
  servicesSummary?: string;
  createdAt?: string;
  rating?: OrderRating;
}

// --- Perfil Garante ---
export interface GaranteProfile {
  id: string;
  companyName: string;
  ruc: string;
  contactName: string;
  roleTitle?: string;
  phone: string;
  email: string;
  address: string;
  brandsRepresented: string[];
  contractStartDate?: string;
  contractEndDate?: string;
  password?: string;
  createdAt?: string;
}

// --- Cuenta de Jefe de Taller ---
export interface WorkshopManagerAccount {
  id: string;
  name: string;
  workshopId: string;
  workshopName: string;
  email: string;
  phone: string;
  password?: string;
  createdAt?: string;
}

// --- Cliente Unificado para Módulo de Clientes Multirrol ---
export interface UnifiedClient {
  id: string; // cedulaRuc
  fullName: string;
  nombres: string;
  apellidos: string;
  cedulaRuc: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  origin?: string;
  workshopId?: string;
  workshopName?: string;
  motorcycles: Array<{
    model: string;
    brand?: string;
    plate: string;
    chasis: string;
    lastMileage?: number;
  }>;
  pdiCompleted: boolean;
  engrasadoCompleted: boolean;
  maintenanceCount: number;
  totalSpent: number;
  lastVisitDate: string;
  lastServiceType: string;
  warrantiesCount: number;
  records: AlistamientoFullRecord[];
}

// --- Dictamen Oficial de Garantía Emitido por Garante de Marca ---
export interface DictamenRecord {
  id: string;
  warrantyId: string;
  requestNumber: string;
  decision: 'aprobada' | 'rechazada' | 'aceptada' | 'denegada';
  resolutionType?: 'envio_repuesto' | 'encargar_taller' | 'rechazo_tecnico' | string;
  motorcycleBrand: string;
  motorcycleModel: string;
  motorcyclePlate?: string;
  motorcycleVin?: string;
  clientName: string;
  clientIdNumber?: string;
  garanteId?: string;
  garanteName: string;
  garanteCompany: string;
  garanteNotes: string;
  rejectionReason?: string;
  data?: any;
  createdAt: string;
  updatedAt?: string;
}

// --- Módulo de Agendamiento y Registro de Pendientes (Administración) ---
export type PendienteCategory = 'repuesto' | 'compra' | 'revision' | 'llamada' | 'gestion' | 'otro';
export type PendientePriority = 'alta' | 'media' | 'baja';

export interface AdminPendiente {
  id: string;
  title: string;
  description?: string;
  category: PendienteCategory;
  priority: PendientePriority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedCost?: number;
  workshopId?: string;
  workshopName?: string;
  relatedClientOrBike?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  createdBy?: string;
}

// --- Tickets de Agendamiento Técnico de Clientes (Red de Talleres) ---
export interface AgendamientoTicket {
  id: string; // ID único ej: "AGN-182940"
  ticketNumber: string; // ej: "TKT-891024"
  clientId?: string;
  clientName: string;
  clientCedula: string;
  clientPhone: string;
  clientEmail?: string;
  motoPlate: string;
  motoModel: string;
  motoBrand?: string;
  motoChasis?: string;
  motoYear?: number | string;
  workshopId: string;
  workshopName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // e.g. "09:30 AM"
  serviceId: ServiceActionType | 'alistamiento_pdi' | 'engrasado' | 'mantenimiento' | string;
  serviceTitle: string;
  serviceCategory?: string;
  estimatedCost?: number;
  notes?: string;
  status: 'confirmado' | 'atendido' | 'cancelado';
  createdAt: string; // ISO string
}
