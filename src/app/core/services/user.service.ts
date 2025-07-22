import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, UserRole, UserStatus, ApiResponse } from '../models/user.model';

export interface CreateFirmanteRequest {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  cargo: string;
}

export interface ResendCredentialsRequest {
  email: string;
  dni?: string;
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
  private readonly API_URL = 'http://10.100.20.54:9002/auth/api/v1';
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * List all users with pagination and filters (Admin only)
   */
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
  createFirmante(request: CreateFirmanteRequest): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<ApiResponse>(`${this.API_URL}/admin/create-firmante`, request)
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
  
  getUserById(id: number): Observable<User> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        const mockUser: User = {
          id: id,
          nombre: 'Usuario',
          apellido: 'Ejemplo',
          email: `user${id}@example.com`,
          dni: '12345678',
          role: UserRole.ROLE_FIRMANTE,
          cargo: 'Cargo de ejemplo',
          status: UserStatus.ACTIVE
        };
        observer.next(mockUser);
        observer.complete();
      }, 500);
    });
  }

  updateUser(id: number, user: Partial<User>): Observable<ApiResponse> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario actualizado correctamente',
          data: { ...user, id }
        });
        observer.complete();
      }, 1000);
    });
  }

  deleteUser(id: number): Observable<ApiResponse> {
    // Mock implementation - replace with real API when available
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario eliminado correctamente'
        });
        observer.complete();
      }, 1000);
    });
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

  /**
   * Mock data generator for development
   */
  generateMockUsers(): User[] {
    return [
      {
        id: 1,
        nombre: 'Juan Carlos',
        apellido: 'Pérez Rodríguez',
        email: 'juan.perez@empresa.com',
        dni: '12345678',
        role: UserRole.ROLE_FIRMANTE,
        cargo: 'Especialista en Medio Ambiente',
        status: UserStatus.ACTIVE
      },
      {
        id: 2,
        nombre: 'María',
        apellido: 'García López',
        email: 'maria.garcia@consultora.com',
        dni: '87654321',
        role: UserRole.ROLE_FIRMANTE,
        cargo: 'Consultora Ambiental',
        status: UserStatus.ACTIVE
      },
      {
        id: 3,
        nombre: 'Carlos',
        apellido: 'López Ruiz',
        email: 'carlos.lopez@auditoria.com',
        dni: '11223344',
        role: UserRole.ROLE_FIRMANTE,
        cargo: 'Auditor Ambiental',
        status: UserStatus.INACTIVE
      },
      {
        id: 4,
        nombre: 'Ana Sofía',
        apellido: 'Martínez Torres',
        email: 'ana.martinez@oefa.gob.pe',
        dni: '44332211',
        role: UserRole.ROLE_ADMIN,
        cargo: 'Administradora del Sistema',
        status: UserStatus.ACTIVE
      },
      {
        id: 5,
        nombre: 'Roberto',
        apellido: 'Silva Chen',
        email: 'roberto.silva@consultora.com',
        dni: '55667788',
        role: UserRole.ROLE_FIRMANTE,
        cargo: 'Ingeniero Ambiental',
        status: UserStatus.PENDING
      }
    ];
  }

  /**
   * Mock listUsers with local data for development
   */
  listUsersMock(params?: UserListParams): Observable<PagedResponse<User>> {
    this.isLoadingSubject.next(true);
    
    return new Observable(observer => {
      setTimeout(() => {
        let users = this.generateMockUsers();
        
        // Apply filters
        if (params?.nombre) {
          const searchTerm = params.nombre.toLowerCase();
          users = users.filter(user => 
            user.nombre.toLowerCase().includes(searchTerm) ||
            user.apellido.toLowerCase().includes(searchTerm)
          );
        }
        
        if (params?.email) {
          users = users.filter(user => 
            user.email.toLowerCase().includes(params.email!.toLowerCase())
          );
        }
        
        if (params?.dni) {
          users = users.filter(user => user.dni.includes(params.dni!));
        }
        
        // Apply sorting
        if (params?.sortBy) {
          users.sort((a, b) => {
            const aVal = a[params.sortBy as keyof User] as string;
            const bVal = b[params.sortBy as keyof User] as string;
            
            if (params.sortDir === 'desc') {
              return bVal.localeCompare(aVal);
            }
            return aVal.localeCompare(bVal);
          });
        }
        
        // Apply pagination
        const page = params?.page || 0;
        const size = params?.size || 10;
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        const response: PagedResponse<User> = {
          content: paginatedUsers,
          page: page,
          size: size,
          totalElements: users.length,
          totalPages: Math.ceil(users.length / size),
          first: page === 0,
          last: page === Math.ceil(users.length / size) - 1,
          empty: users.length === 0
        };
        
        this.isLoadingSubject.next(false);
        observer.next(response);
        observer.complete();
      }, 1000);
    });
  }
}