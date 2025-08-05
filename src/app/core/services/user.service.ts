import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, UserRole, UserStatus, ApiResponse } from '../models/user.model';

export interface CreateFirmanteRequest {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  cargo: string;
}

export interface CreateFirmanteData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  cargo: string;
  role: string;
  status: string;
  createdAt: string;
  notificationSent: boolean;
  notificationMethod: string;
}

export interface CreateFirmanteResponse {
  success: boolean;
  message: string;
  data: CreateFirmanteData;
}

export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: {
    content: User[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}

export interface ResendCredentialsRequest {
  email: string;
  dni?: string | null;
  regeneratePassword?: boolean;
  additionalInfo?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserListParams {
  nombre?: string;
  email?: string;
  dni?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe/auth/api/v1';
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * List all users with pagination and filters (Admin only)
   */
  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<GetUsersResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.get<GetUsersResponse>(`${this.API_URL}/admin/users`)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  listUsers(params?: UserListParams): Observable<PagedResponse<User>> {
    this.isLoadingSubject.next(true);
    
    let httpParams = new HttpParams();
    
    if (params?.nombre) httpParams = httpParams.set('nombre', params.nombre);
    if (params?.email) httpParams = httpParams.set('email', params.email);
    if (params?.dni) httpParams = httpParams.set('dni', params.dni);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params?.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

    return this.http.get<PagedResponse<User>>(`${this.API_URL}/admin/users`, { params: httpParams })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Create a new firmante (Admin only)
   */
  createFirmante(request: CreateFirmanteRequest): Observable<CreateFirmanteResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<CreateFirmanteResponse>(`${this.API_URL}/admin/create-firmante`, request)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Resend credentials to a firmante (Admin only)
   */
  resendCredentials(request: ResendCredentialsRequest): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<ApiResponse>(`${this.API_URL}/admin/resend-credentials`, request)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Reset password for a user
   */
  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/admin/reset-password`, request);
  }

  /**
   * Get user profile (current authenticated user)
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`);
  }

  /**
   * Mock methods for user management (CRUD operations not in API)
   * These simulate what would be real endpoints
   */
  
  /**
   * Get firmante by ID (Admin only)
   */
  getUserById(id: number): Observable<ApiResponse<User>> {
    this.isLoadingSubject.next(true);
    
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/admin/firmantes/${id}`)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Edit user (Admin only) - Only email, dni, and cargo can be edited
   */
  updateUser(id: number, updateData: { email?: string; dni?: string; cargo?: string }): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.put<ApiResponse>(`${this.API_URL}/admin/users/${id}`, updateData)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Delete user (Admin only) - Changes status to ELIMINADO
   */
  deleteUser(id: number): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.delete<ApiResponse>(`${this.API_URL}/admin/users/${id}`)
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError(error => {
          this.isLoadingSubject.next(false);
          throw error;
        })
      );
  }

  bulkDeleteUsers(userIds: number[]): Observable<ApiResponse> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: `${userIds.length} usuarios eliminados correctamente`
        });
        observer.complete();
      }, 1500);
    });
  }

  activateUser(id: number): Observable<ApiResponse> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario activado correctamente'
        });
        observer.complete();
      }, 500);
    });
  }

  deactivateUser(id: number): Observable<ApiResponse> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario desactivado correctamente'
        });
        observer.complete();
      }, 500);
    });
  }

}