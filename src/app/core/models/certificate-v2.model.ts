export interface Certificate {
  id: number;
  userId: number;
  fileName: string;
  filePath: string;
  certificateSerial: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  status: CertificateStatus;
  uploadedAt: string;
  lastValidatedAt?: string;
  fileSize: number;
  keyAlgorithm: string;
  signatureAlgorithm: string;
  
  // User information (populated from user service)
  userInfo?: {
    nombre: string;
    apellido: string;
    email: string;
    dni: string;
  };
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  INVALID = 'INVALID'
}

export interface CertificateUploadRequest {
  userId: number;
  password: string;
  file: File;
}

export interface CertificateResponse {
  success: boolean;
  message: string;
  data?: Certificate | Certificate[];
}

export interface CertificateListParams {
  userId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  search?: string;
  status?: CertificateStatus;
}