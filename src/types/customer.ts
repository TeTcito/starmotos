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
  preferredBranchId: string;// 'matriz-quito' | 'taller-norte'
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
  | 'entregada';

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

export interface WorkOrder {
  otNumber: string;
  entryDate: string;
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
