export interface Certificate {
  id: number;
  userId: number;
  fileUuid: string;
  status: CertificateStatus;
  validationMessage: string;
  subjectCN: string | null;
  issuerCN: string | null;
  serialNumber: string | null;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
  INVALIDO = 'INVALIDO'
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