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

  getAllCertificates(): Observable<ApiResponse<PagedResponse<Certificate>>> {
    return this.http.get<ApiResponse<PagedResponse<Certificate>>>(`${this.API_URL}`);
  }

  getCertificateById(id: number): Observable<ApiResponse<Certificate>> {
    return this.http.get<ApiResponse<Certificate>>(`${this.API_URL}/${id}`);
  }

  getCertificatesByUser(userId: number): Observable<ApiResponse<Certificate[]>> {
    return this.http.get<ApiResponse<Certificate[]>>(`${this.API_URL}/user/${userId}`);
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