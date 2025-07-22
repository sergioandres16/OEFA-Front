export interface Certificate {
  id: number;
  userId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  validFrom: Date;
  validTo: Date;
  issuer: string;
  subject: string;
  serialNumber: string;
  status: CertificateStatus;
  algorithm: string;
  keySize: number;
  isValid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING'
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