export interface Certificate {
  id: number;
  userId: number;
  fileUuid: string;
  fileName: string;
  status: CertificateStatus;
  validationMessage: string;
  subjectCN: string | null;
  issuerCN: string | null;
  subject: string | null; // For backward compatibility
  issuer: string | null; // For backward compatibility
  serialNumber: string | null;
  validFrom: string | null;
  validTo: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export enum CertificateStatus {
  VALIDO = 'VALIDO',
  REVOCADO = 'REVOCADO',
  INVALIDO = 'INVALIDO',
  CADUCADO = 'CADUCADO',
  NO_PERMITIDO_FIRMA_DIGITAL = 'NO_PERMITIDO_FIRMA_DIGITAL',
  ADULTERADO = 'ADULTERADO',
  PENDIENTE_VALIDACION = 'PENDIENTE_VALIDACION',
  ELIMINADO = 'ELIMINADO'
}

export interface CertificateUploadRequest {
  userId: number;
  password: string;
  file: File;
}

export interface CertificateFilter {
  userId?: number;
  status?: CertificateStatus;
  issuer?: string;
  validFrom?: Date;
  validTo?: Date;
  search?: string;
}

export interface CertificateListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filter?: CertificateFilter;
}