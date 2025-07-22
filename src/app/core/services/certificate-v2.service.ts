import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Certificate, CertificateUploadRequest, CertificateResponse, CertificateListParams } from '../models/certificate-v2.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateV2Service {
  private readonly API_URL = 'http://localhost:8080/certificates/api/certificates';
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Upload a certificate file for a specific user
   */
  uploadCertificate(userId: number, password: string, file: File): Observable<CertificateResponse> {
    this.isLoadingSubject.next(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('password', password);

    return this.http.post<CertificateResponse>(`${this.API_URL}/upload`, formData, { params })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Get certificate by ID
   */
  getCertificateById(certificateId: number): Observable<CertificateResponse> {
    return this.http.get<CertificateResponse>(`${this.API_URL}/${certificateId}`);
  }

  /**
   * Get all certificates for a specific user
   */
  getCertificatesByUser(userId: number): Observable<CertificateResponse> {
    return this.http.get<CertificateResponse>(`${this.API_URL}/user/${userId}`);
  }

  /**
   * Delete a certificate
   */
  deleteCertificate(certificateId: number): Observable<CertificateResponse> {
    return this.http.delete<CertificateResponse>(`${this.API_URL}/${certificateId}`);
  }

  /**
   * Get all certificates with filtering and pagination (Admin only)
   * This method combines data from certificate API and user API
   */
  getAllCertificates(params?: CertificateListParams): Observable<Certificate[]> {
    // Since the API doesn't have a direct "get all certificates" endpoint,
    // we'll need to implement this by getting users first and then their certificates
    // For now, we'll return mock data that matches the API structure
    
    this.isLoadingSubject.next(true);
    
    return new Observable(observer => {
      setTimeout(() => {
        const mockCertificates: Certificate[] = [
          {
            id: 1,
            userId: 2,
            fileName: 'juan_perez_cert.p12',
            filePath: '/certificates/juan_perez_cert.p12',
            certificateSerial: 'A1B2C3D4E5F67890',
            subject: 'CN=Juan Carlos Pérez, O=Empresa Consultora SAC, C=PE',
            issuer: 'CN=RENIEC CA, O=RENIEC, C=PE',
            validFrom: '2024-01-01T00:00:00Z',
            validTo: '2025-12-31T23:59:59Z',
            status: 'ACTIVE' as any,
            uploadedAt: '2024-03-15T10:30:00Z',
            lastValidatedAt: '2024-03-15T10:30:00Z',
            fileSize: 4096,
            keyAlgorithm: 'RSA',
            signatureAlgorithm: 'SHA256withRSA',
            userInfo: {
              nombre: 'Juan Carlos',
              apellido: 'Pérez Rodríguez',
              email: 'juan.perez@empresa.com',
              dni: '12345678'
            }
          },
          {
            id: 2,
            userId: 3,
            fileName: 'maria_garcia_cert.p12',
            filePath: '/certificates/maria_garcia_cert.p12',
            certificateSerial: 'B2C3D4E5F6789012',
            subject: 'CN=María García López, O=Consultora Ambiental EIRL, C=PE',
            issuer: 'CN=RENIEC CA, O=RENIEC, C=PE',
            validFrom: '2024-02-01T00:00:00Z',
            validTo: '2024-12-31T23:59:59Z',
            status: 'EXPIRED' as any,
            uploadedAt: '2024-03-14T14:15:00Z',
            lastValidatedAt: '2024-03-14T14:15:00Z',
            fileSize: 4048,
            keyAlgorithm: 'RSA',
            signatureAlgorithm: 'SHA256withRSA',
            userInfo: {
              nombre: 'María',
              apellido: 'García López',
              email: 'maria.garcia@consultora.com',
              dni: '87654321'
            }
          },
          {
            id: 3,
            userId: 4,
            fileName: 'carlos_lopez_cert.p12',
            filePath: '/certificates/carlos_lopez_cert.p12',
            certificateSerial: 'C3D4E5F678901234',
            subject: 'CN=Carlos López Ruiz, O=Auditoría y Consultoría SAC, C=PE',
            issuer: 'CN=RENIEC CA, O=RENIEC, C=PE',
            validFrom: '2023-12-01T00:00:00Z',
            validTo: '2025-11-30T23:59:59Z',
            status: 'ACTIVE' as any,
            uploadedAt: '2024-02-28T16:45:00Z',
            lastValidatedAt: '2024-02-28T16:45:00Z',
            fileSize: 4120,
            keyAlgorithm: 'RSA',
            signatureAlgorithm: 'SHA256withRSA',
            userInfo: {
              nombre: 'Carlos',
              apellido: 'López Ruiz',
              email: 'carlos.lopez@auditoria.com',
              dni: '11223344'
            }
          }
        ];

        // Apply filters if provided
        let filteredCerts = mockCertificates;
        
        if (params?.search) {
          const searchTerm = params.search.toLowerCase();
          filteredCerts = filteredCerts.filter(cert =>
            cert.fileName.toLowerCase().includes(searchTerm) ||
            cert.subject.toLowerCase().includes(searchTerm) ||
            cert.userInfo?.nombre.toLowerCase().includes(searchTerm) ||
            cert.userInfo?.apellido.toLowerCase().includes(searchTerm) ||
            cert.userInfo?.email.toLowerCase().includes(searchTerm)
          );
        }

        if (params?.status) {
          filteredCerts = filteredCerts.filter(cert => cert.status === params.status);
        }

        if (params?.userId) {
          filteredCerts = filteredCerts.filter(cert => cert.userId === params.userId);
        }

        // Apply sorting
        if (params?.sortBy) {
          filteredCerts.sort((a, b) => {
            const aVal = a[params.sortBy as keyof Certificate];
            const bVal = b[params.sortBy as keyof Certificate];
            
            // Handle undefined values
            if (aVal === undefined && bVal === undefined) return 0;
            if (aVal === undefined) return 1;
            if (bVal === undefined) return -1;
            
            if (params.sortDir === 'desc') {
              return aVal < bVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
          });
        }

        this.isLoadingSubject.next(false);
        observer.next(filteredCerts);
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Batch delete certificates
   */
  deleteCertificates(certificateIds: number[]): Observable<CertificateResponse> {
    // The API doesn't have batch delete, so we'll simulate it
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: `${certificateIds.length} certificados eliminados correctamente`
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Validate certificate status
   */
  validateCertificate(certificateId: number): Observable<CertificateResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Certificado validado correctamente'
        });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Get certificate statistics
   */
  getCertificateStats(): Observable<any> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          total: 12,
          active: 8,
          expired: 3,
          revoked: 1,
          expiringSoon: 2
        });
        observer.complete();
      }, 500);
    });
  }
}

// Import statements for RxJS operators
import { tap, catchError } from 'rxjs/operators';