/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProcessType = 'Importação' | 'Exportação';
export type PortType = 'Maputo' | 'Beira' | 'Nacala' | 'Outro';
export type ProcessStatus = 'OK' | 'Em Correção' | 'Erro Crítico' | 'Submetido';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto';
export type DiscrepancySeverity = 'critical' | 'warning' | 'regulatory';

export interface AuditField {
  fieldName: string;
  label: string;
  extractedValue: string;
  confidence: number; // percentage (0-100)
  manuallyCorrectedValue?: string;
  isCorrected: boolean;
  docSource: string; // e.g. "Commercial Invoice", "DUADO", etc.
}

export interface Discrepancy {
  id: string;
  severity: DiscrepancySeverity;
  title: string;
  description: string;
  documentA: string;
  documentB: string;
  fieldA: string;
  fieldB: string;
  valA: string;
  valB: string;
  isCorrected: boolean;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: 'invoice' | 'packing_list' | 'bl_awb' | 'duado' | 'license' | 'certificate' | 'pre_shipment_inspect' | 'other';
  status: 'Pendente' | 'Presente';
  fileName?: string;
  uploadedAt?: string;
  fileContent?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface CustomsProcess {
  id: string;
  client: string;
  internNumber: string;
  type: ProcessType;
  port: PortType;
  status: ProcessStatus;
  risk: RiskLevel;
  updatedAt: string;
  createdAt: string;
  daysRemaining: number; // for alerts (documental, storage, demurrage)
  costAtRisk: number; // estimated penalties, demurrage storage in USD
  documents: DocumentAttachment[];
  extractedFields: Record<string, AuditField>;
  discrepancies: Discrepancy[];
  canal?: 'Verde' | 'Amarelo' | 'Vermelho' | 'Cinzento' | null;
  checklist: {
    invoiceValidated: boolean;
    blValidated: boolean;
    weightConfirmed: boolean;
    mapaLicenseConfirmed: boolean;
    hsCodeConfirmed: boolean;
    adminOverridden?: boolean;
    overriddenBy?: string;
  };
}

export interface HSAdvisorProduct {
  code: string;
  product: string;
  category: string;
  description: string;
  dutyRate: number; // e.g. 0.20 (20%)
  vatRate: number; // e.g. 0.16 (16%)
  otherTaxRate?: number;
  ministerialChecklist: string[];
}

export interface AuditLog {
  id: string;
  processId: string;
  processNumber: string;
  user: string;
  userRole: 'Admin' | 'Operacional';
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  action: string;
}

export interface UserRoleProfile {
  role: 'Admin' | 'Operacional';
  name: string;
  email: string;
}
