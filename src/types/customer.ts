// src/types/customer.ts
// Definiciones completas de tipos para el Portal de Clientes StarMotos

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';

export interface Vehicle {
  plate: string;          // Formato Ecuador: ej. "PBX-8492" o "IC-459K"
  brand: string;          // ej. "Benelli", "Yamaha", "Honda"
  model: string;          // ej. "TRK 502X", "MT-03", "CB190R"
  displacement: string;   // ej. "500 cc", "321 cc"
  year: number;           // ej. 2024
  color: string;          // ej. "Blanco Glaciar / Cuadro Rojo"
  vin: string;            // Número de chasis
  currentKm: number;      // ej. 14850
  fuelLevel: FuelLevel;   // Nivel de combustible
  fuelPercentage: number; // 0 - 100%
  photoUrl: string;       // Foto general de la motocicleta
}

export type DamageSeverity = 'leve' | 'moderado' | 'grave';

export interface DamageCheckItem {
  id: string;
  zone: string;           // ej. "Carenado Lateral Izquierdo", "Retrovisor Derecho"
  damageType: string;     // ej. "Rayón superficial", "Fisura en carcasa", "Desgaste"
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
  identificationId: string; // Cédula ecuatoriana
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
  technicianNote?: string;
}

export interface Branch {
  id: string;
  name: string;           // ej. "Matriz Central", "Taller Norte"
  code: string;           // ej. "UIO-01", "UIO-02"
  address: string;
  city: string;
  phone: string;
  whatsapp: string;       // Formato internacional ej. "593987654321"
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
  code: string;           // ej. "REP-BEN-042"
  description: string;    // ej. "Kit de Arrastre Regina Reforzado 525"
  brand: string;          // ej. "Regina", "Motul", "Brembo"
  quantity: number;
  unitPrice: number;      // USD
  subtotal: number;       // USD
  warrantyMonths: number;
  isOptional?: boolean;
}

export interface ServiceItem {
  code: string;           // ej. "MO-MEC-01"
  description: string;    // ej. "Calibración de Válvulas y Sincronización"
  hours: number;
  unitCost: number;       // USD
  subtotal: number;       // USD
}

export type QuotationStatus = 'pendiente_aprobacion' | 'aprobado' | 'rechazado';

export interface Quotation {
  quotationNumber: string; // ej. "COT-2026-1104"
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
  taxRate: number;         // 0.15 (15% Ecuador SRI)
  taxAmount: number;       // USD
  total: number;           // USD
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
  invoicePdfUrl?: string;
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
  otNumber: string;        // ej. "OT-2026-0841"
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
  vehicle: Vehicle;
  activeOrder: WorkOrder;
  inspection: Inspection360;
  history: MaintenanceRecord[];
  warranties: WarrantyItem[];
}
