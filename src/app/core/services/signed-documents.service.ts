import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface SignedDocument {
  id: number;
  documentName: string;
  documentType: string;
  documentPath: string;
  signerName: string;
  signerEmail: string;
  signerDni: string;
  signatureDate: string;
  certificateSerial: string;
  documentSize: number;
  status: 'VALID' | 'INVALID' | 'EXPIRED';
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignedDocumentListParams {
  search?: string;
  documentType?: string;
  status?: string;
  signerName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SignedDocumentsService {
  private readonly API_URL = 'http://localhost:8080/documents/api/signed-documents';
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all signed documents with filtering and pagination
   * This would be a real API endpoint when implemented
   */
  getSignedDocuments(params?: SignedDocumentListParams): Observable<SignedDocument[]> {
    this.isLoadingSubject.next(true);
    
    let httpParams = new HttpParams();
    
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.documentType) httpParams = httpParams.set('documentType', params.documentType);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.signerName) httpParams = httpParams.set('signerName', params.signerName);
    if (params?.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params?.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

    // TODO: Replace with real API call when available
    // return this.http.get<SignedDocument[]>(`${this.API_URL}`, { params: httpParams })
    //   .pipe(
    //     tap(() => this.isLoadingSubject.next(false)),
    //     catchError(error => {
    //       this.isLoadingSubject.next(false);
    //       throw error;
    //     })
    //   );

    // Mock implementation for development
    return this.getSignedDocumentsMock(params);
  }

  /**
   * Delete a signed document
   */
  deleteSignedDocument(documentId: number): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.delete<ApiResponse>(`${this.API_URL}/${documentId}`)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Bulk delete signed documents
   */
  bulkDeleteSignedDocuments(documentIds: number[]): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<ApiResponse>(`${this.API_URL}/bulk-delete`, { documentIds })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Download a signed document
   */
  downloadSignedDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${documentId}/download`, { 
      responseType: 'blob' 
    });
  }

  /**
   * Export signed documents list
   */
  exportSignedDocuments(params?: SignedDocumentListParams): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.documentType) httpParams = httpParams.set('documentType', params.documentType);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.signerName) httpParams = httpParams.set('signerName', params.signerName);
    if (params?.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);

    return this.http.get(`${this.API_URL}/export`, { 
      params: httpParams,
      responseType: 'blob' 
    });
  }

  /**
   * Mock implementation for development
   */
  private getSignedDocumentsMock(params?: SignedDocumentListParams): Observable<SignedDocument[]> {
    return new Observable(observer => {
      setTimeout(() => {
        let documents = this.generateMockSignedDocuments();
        
        // Apply filters
        if (params?.search) {
          const searchTerm = params.search.toLowerCase();
          documents = documents.filter(doc =>
            doc.documentName.toLowerCase().includes(searchTerm) ||
            doc.signerName.toLowerCase().includes(searchTerm) ||
            doc.signerEmail.toLowerCase().includes(searchTerm)
          );
        }

        if (params?.documentType) {
          documents = documents.filter(doc => doc.documentType === params.documentType);
        }

        if (params?.status) {
          documents = documents.filter(doc => doc.status === params.status);
        }

        if (params?.signerName) {
          const signerTerm = params.signerName.toLowerCase();
          documents = documents.filter(doc => 
            doc.signerName.toLowerCase().includes(signerTerm)
          );
        }

        if (params?.dateFrom) {
          documents = documents.filter(doc => 
            new Date(doc.signatureDate) >= new Date(params.dateFrom!)
          );
        }

        if (params?.dateTo) {
          documents = documents.filter(doc => 
            new Date(doc.signatureDate) <= new Date(params.dateTo!)
          );
        }

        // Apply sorting
        if (params?.sortBy) {
          documents.sort((a, b) => {
            const aVal = a[params.sortBy as keyof SignedDocument] as string;
            const bVal = b[params.sortBy as keyof SignedDocument] as string;
            
            if (params.sortDir === 'desc') {
              return bVal.localeCompare(aVal);
            }
            return aVal.localeCompare(bVal);
          });
        }

        this.isLoadingSubject.next(false);
        observer.next(documents);
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Generate mock data for development
   */
  private generateMockSignedDocuments(): SignedDocument[] {
    return [
      {
        id: 1,
        documentName: 'Informe_Ambiental_Q1_2024.pdf',
        documentType: 'PDF',
        documentPath: '/signed-docs/informe_ambiental_q1_2024_signed.pdf',
        signerName: 'Juan Carlos Pérez Rodríguez',
        signerEmail: 'juan.perez@empresa.com',
        signerDni: '12345678',
        signatureDate: '2024-03-15T10:30:00Z',
        certificateSerial: 'A1B2C3D4E5F6',
        documentSize: 2621440, // 2.5 MB
        status: 'VALID',
        createdAt: '2024-03-15T10:30:00Z',
        updatedAt: '2024-03-15T10:30:00Z'
      },
      {
        id: 2,
        documentName: 'Contrato_Servicios_2024.docx',
        documentType: 'DOCX',
        documentPath: '/signed-docs/contrato_servicios_2024_signed.docx',
        signerName: 'María García López',
        signerEmail: 'maria.garcia@consultora.com',
        signerDni: '87654321',
        signatureDate: '2024-03-14T14:15:00Z',
        certificateSerial: 'F6E5D4C3B2A1',
        documentSize: 1887437, // 1.8 MB
        status: 'VALID',
        createdAt: '2024-03-14T14:15:00Z',
        updatedAt: '2024-03-14T14:15:00Z'
      },
      {
        id: 3,
        documentName: 'Reporte_Auditoria_Feb_2024.pdf',
        documentType: 'PDF',
        documentPath: '/signed-docs/reporte_auditoria_feb_2024_signed.pdf',
        signerName: 'Carlos López Ruiz',
        signerEmail: 'carlos.lopez@auditoria.com',
        signerDni: '11223344',
        signatureDate: '2024-02-28T16:45:00Z',
        certificateSerial: 'G7H8I9J0K1L2',
        documentSize: 4404019, // 4.2 MB
        status: 'EXPIRED',
        createdAt: '2024-02-28T16:45:00Z',
        updatedAt: '2024-02-28T16:45:00Z'
      },
      {
        id: 4,
        documentName: 'Acta_Reunion_Directorio.pdf',
        documentType: 'PDF',
        documentPath: '/signed-docs/acta_reunion_directorio_signed.pdf',
        signerName: 'Ana Sofía Martínez Torres',
        signerEmail: 'ana.martinez@oefa.gob.pe',
        signerDni: '44332211',
        signatureDate: '2024-03-10T09:20:00Z',
        certificateSerial: 'M3N4O5P6Q7R8',
        documentSize: 911769, // 890 KB
        status: 'VALID',
        createdAt: '2024-03-10T09:20:00Z',
        updatedAt: '2024-03-10T09:20:00Z'
      },
      {
        id: 5,
        documentName: 'Propuesta_Mejora_Procesos.xlsx',
        documentType: 'XLSX',
        documentPath: '/signed-docs/propuesta_mejora_procesos_signed.xlsx',
        signerName: 'Roberto Silva Chen',
        signerEmail: 'roberto.silva@consultora.com',
        signerDni: '55667788',
        signatureDate: '2024-03-08T11:00:00Z',
        certificateSerial: 'S9T0U1V2W3X4',
        documentSize: 665600, // 650 KB
        status: 'INVALID',
        createdAt: '2024-03-08T11:00:00Z',
        updatedAt: '2024-03-08T11:00:00Z'
      },
      {
        id: 6,
        documentName: 'Certificacion_Ambiental_2024.pdf',
        documentType: 'PDF',
        documentPath: '/signed-docs/certificacion_ambiental_2024_signed.pdf',
        signerName: 'Juan Carlos Pérez Rodríguez',
        signerEmail: 'juan.perez@empresa.com',
        signerDni: '12345678',
        signatureDate: '2024-03-05T13:22:00Z',
        certificateSerial: 'A1B2C3D4E5F6',
        documentSize: 3145728, // 3 MB
        status: 'VALID',
        createdAt: '2024-03-05T13:22:00Z',
        updatedAt: '2024-03-05T13:22:00Z'
      }
    ];
  }

  /**
   * Mock delete for development
   */
  deleteSignedDocumentMock(documentId: number): Observable<ApiResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Documento eliminado correctamente'
        });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Mock bulk delete for development
   */
  bulkDeleteSignedDocumentsMock(documentIds: number[]): Observable<ApiResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: `${documentIds.length} documentos eliminados correctamente`
        });
        observer.complete();
      }, 1000);
    });
  }
}