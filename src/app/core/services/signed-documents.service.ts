import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/user.model';

export interface PagedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface SignedDocument {
  id: number;
  fileName: string;
  documentType: string;
  documentPath: string;
  userId: number;
  dni: string;
  signerName?: string;
  signerEmail?: string;
  signatureDate: string;
  status: string;
  documentSize: number;
  motivo?: string;
  localidad?: string;
  cargoFirmante?: string;
  isVisa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignedDocumentListParams {
  search?: string;
  page?: number;
  size?: number;
  sortDirection?: string;
}

export interface SignedDocumentStats {
  totalDocuments: number;
  signedDocuments: number;
  visadoDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
}

@Injectable({
  providedIn: 'root'
})
export class SignedDocumentsService {
  private readonly API_URL = 'https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe/signatures/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Listar Documentos Firmados (Admin) - GET /admin/signed
   */
  getAllSignedDocuments(params?: SignedDocumentListParams): Observable<ApiResponse<PagedResponse<SignedDocument>>> {
    let httpParams = new HttpParams();
    
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);

    return this.http.get<ApiResponse<PagedResponse<SignedDocument>>>(`${this.API_URL}/admin/signed`, { params: httpParams });
  }

  /**
   * Listar Documentos Visados (Admin) - GET /admin/visado
   */
  getAllVisadoDocuments(params?: SignedDocumentListParams): Observable<ApiResponse<PagedResponse<SignedDocument>>> {
    let httpParams = new HttpParams();
    
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);

    return this.http.get<ApiResponse<PagedResponse<SignedDocument>>>(`${this.API_URL}/admin/visado`, { params: httpParams });
  }

  /**
   * Obtener Documentos por Usuario - GET /user/{userId}
   */
  getDocumentsByUser(userId: number): Observable<ApiResponse<SignedDocument[]>> {
    return this.http.get<ApiResponse<SignedDocument[]>>(`${this.API_URL}/user/${userId}`);
  }

  /**
   * Obtener Documentos por DNI - GET /dni/{dni}
   */
  getDocumentsByDni(dni: string): Observable<ApiResponse<SignedDocument[]>> {
    return this.http.get<ApiResponse<SignedDocument[]>>(`${this.API_URL}/dni/${dni}`);
  }

  /**
   * Obtener Documento por ID - GET /{documentId}
   */
  getDocumentById(documentId: number): Observable<ApiResponse<SignedDocument>> {
    return this.http.get<ApiResponse<SignedDocument>>(`${this.API_URL}/${documentId}`);
  }

  /**
   * Estadísticas de Documentos - GET /admin/stats
   */
  getDocumentStats(): Observable<ApiResponse<SignedDocumentStats>> {
    return this.http.get<ApiResponse<SignedDocumentStats>>(`${this.API_URL}/admin/stats`);
  }

}