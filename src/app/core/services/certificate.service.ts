import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Certificate, CertificateUploadRequest, CertificateListParams, CertificateStatus } from '../models/certificate.model';
import { ApiResponse, PagedResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private readonly API_URL = 'https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe/certificates/api/v1';

  constructor(private http: HttpClient) {}

  getCertificates(params: CertificateListParams = {}): Observable<PagedResponse<Certificate>> {
    // Mock data para desarrollo
    const mockCertificates: Certificate[] = [
      {
        id: 1,
        userId: 2,
        fileName: 'certificado_juan_perez.p12',
        fileSize: 2048,
        uploadedAt: new Date('2024-01-15'),
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        issuer: 'RENIEC - Registro Nacional de Identificación y Estado Civil',
        subject: 'Juan Carlos Pérez Rodríguez',
        serialNumber: '123456789ABC',
        status: CertificateStatus.ACTIVE,
        algorithm: 'RSA',
        keySize: 2048,
        isValid: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        userId: 2,
        fileName: 'certificado_backup.p12',
        fileSize: 1024,
        uploadedAt: new Date('2024-02-01'),
        validFrom: new Date('2024-02-01'),
        validTo: new Date('2025-01-31'),
        issuer: 'IOFE - Instituto de Firmas Electrónicas',
        subject: 'Juan Carlos Pérez Rodríguez',
        serialNumber: 'DEF456789123',
        status: CertificateStatus.ACTIVE,
        algorithm: 'RSA',
        keySize: 2048,
        isValid: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: 3,
        userId: 1,
        fileName: 'admin_certificate.p12',
        fileSize: 3072,
        uploadedAt: new Date('2024-01-01'),
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        issuer: 'OEFA - Organismo de Evaluación y Fiscalización Ambiental',
        subject: 'Administrador OEFA',
        serialNumber: 'GHI789123456',
        status: CertificateStatus.EXPIRED,
        algorithm: 'RSA',
        keySize: 2048,
        isValid: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    const mockResponse: PagedResponse<Certificate> = {
      content: mockCertificates,
      page: params.page || 0,
      size: params.size || 10,
      totalElements: mockCertificates.length,
      totalPages: 1,
      first: true,
      last: true,
      empty: false
    };

    return of(mockResponse);

    // Implementación real comentada
    // let httpParams = new HttpParams();
    // if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    // if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    // if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    // if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    // 
    // return this.http.get<PagedResponse<Certificate>>(this.API_URL, { params: httpParams });
  }

  getCertificateById(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.API_URL}/${id}`);
  }

  getCertificatesByUser(userId: number): Observable<ApiResponse<Certificate[]>> {
    // Mock data para desarrollo
    const mockCertificates: Certificate[] = [
      {
        id: 1,
        userId: userId,
        fileName: 'certificado_usuario.p12',
        fileSize: 2048,
        uploadedAt: new Date('2024-01-15'),
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        issuer: 'RENIEC',
        subject: 'Usuario Test',
        serialNumber: '123456789ABC',
        status: CertificateStatus.ACTIVE,
        algorithm: 'RSA',
        keySize: 2048,
        isValid: true
      }
    ];

    const mockResponse: ApiResponse<Certificate[]> = {
      success: true,
      message: 'Certificados obtenidos exitosamente',
      data: mockCertificates
    };

    return of(mockResponse);

    // Implementación real comentada
    // return this.http.get<ApiResponse<Certificate[]>>(`${this.API_URL}/user/${userId}`);
  }

  uploadCertificate(request: CertificateUploadRequest): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    const params = new HttpParams()
      .set('userId', request.userId.toString())
      .set('password', request.password);

    return this.http.post<ApiResponse>(`${this.API_URL}/upload`, formData, { params });
  }

  deleteCertificate(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/${id}`);
  }

  validateCertificate(id: number): Observable<ApiResponse> {
    // Mock para desarrollo
    const mockResponse: ApiResponse = {
      success: true,
      message: 'Certificado validado exitosamente',
      data: { isValid: true, validationDate: new Date() }
    };

    return of(mockResponse);
  }

  getStatusBadgeClass(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.ACTIVE:
        return 'badge-success';
      case CertificateStatus.EXPIRED:
        return 'badge-warning';
      case CertificateStatus.REVOKED:
        return 'badge-error';
      case CertificateStatus.PENDING:
        return 'badge-info';
      default:
        return 'badge-info';
    }
  }

  getStatusText(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.ACTIVE:
        return 'Activo';
      case CertificateStatus.EXPIRED:
        return 'Expirado';
      case CertificateStatus.REVOKED:
        return 'Revocado';
      case CertificateStatus.PENDING:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}