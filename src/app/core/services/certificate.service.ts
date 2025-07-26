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
    return this.http.get<ApiResponse<PagedResponse<Certificate>>>(`${this.API_URL}/list`);
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

  updateCertificate(id: number, updateData: Partial<Certificate>): Observable<ApiResponse<Certificate>> {
    return this.http.put<ApiResponse<Certificate>>(`${this.API_URL}/${id}`, updateData);
  }

  getCertificatesExpiringSoon(): Observable<ApiResponse<Certificate[]>> {
    return this.http.get<ApiResponse<Certificate[]>>(`${this.API_URL}/expiring-soon`);
  }

  getCertificateStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/stats`);
  }

  validateCertificate(id: number): Observable<ApiResponse> {
    // Mock para desarrollo - En producción debería conectar con el endpoint real
    const mockResponse: ApiResponse = {
      success: true,
      message: 'Certificado validado exitosamente',
      data: { isValid: true, validationDate: new Date() }
    };

    return of(mockResponse);
  }

  getStatusBadgeClass(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.VALIDO:
        return 'badge-success';
      case CertificateStatus.CADUCADO:
        return 'badge-warning';
      case CertificateStatus.REVOCADO:
      case CertificateStatus.INVALIDO:
      case CertificateStatus.ADULTERADO:
        return 'badge-error';
      case CertificateStatus.NO_PERMITIDO_FIRMA_DIGITAL:
        return 'badge-warning';
      case CertificateStatus.PENDIENTE_VALIDACION:
        return 'badge-info';
      case CertificateStatus.ELIMINADO:
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  }

  getStatusText(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.VALIDO:
        return 'Válido';
      case CertificateStatus.REVOCADO:
        return 'Revocado';
      case CertificateStatus.INVALIDO:
        return 'Inválido';
      case CertificateStatus.CADUCADO:
        return 'Caducado';
      case CertificateStatus.NO_PERMITIDO_FIRMA_DIGITAL:
        return 'No permitido firma digital';
      case CertificateStatus.ADULTERADO:
        return 'Adulterado';
      case CertificateStatus.PENDIENTE_VALIDACION:
        return 'Pendiente validación';
      case CertificateStatus.ELIMINADO:
        return 'Eliminado';
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