import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { User, JwtResponse, LoginRequest, ApiResponse, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe/auth/api/v1';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.tokenSubject.next(token);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  loginAdmin(email: string, password: string): Observable<JwtResponse> {
    this.isLoadingSubject.next(true);
    
    const request: LoginRequest = { email, password };
    return this.http.post<JwtResponse>(`${this.API_URL}/admin/login`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleError(error)),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  loginFirmante(dni: string, pin: string): Observable<JwtResponse> {
    this.isLoadingSubject.next(true);
    
    const request = { dni, pin };
    return this.http.post<JwtResponse>(`${this.API_URL}/firmante/login`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => this.handleError(error)),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  refreshToken(): Observable<JwtResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return of().pipe(
        tap(() => this.logout())
      );
    }

    return this.http.post<JwtResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          this.logout();
          return of();
        })
      );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken })
        .pipe(
          catchError(() => of(null))
        )
        .subscribe();
    }
    
    this.clearAuthData();
    this.router.navigate(['/admin/login']);
  }

  validateToken(token: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.API_URL}/validate`, {
      params: { token }
    });
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.ROLE_ADMIN;
  }

  isFirmante(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === UserRole.ROLE_FIRMANTE;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const token = localStorage.getItem('accessToken');
    console.log('AuthService.getToken() called, token exists:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    return token;
  }

  createFirmante(firmanteData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/admin/create-firmante`, firmanteData)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  activateFirmante(activationToken: string, pin: string): Observable<any> {
    const request = { activationToken, pin };
    return this.http.post(`${this.API_URL}/firmante/activate`, request)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  private handleAuthSuccess(response: JwtResponse): void {
    // Store only essential auth data
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Store minimal user info for session
    const userSession: User = {
      id: response.userId,
      nombre: response.nombre,
      apellido: response.apellido,
      email: response.email,
      dni: response.dni,
      role: response.role,
      cargo: response.cargo,
      status: response.status
    };
    localStorage.setItem('currentUser', JSON.stringify(userSession));
    
    this.currentUserSubject.next(userSession);
    this.tokenSubject.next(response.accessToken);
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const isExpired = Date.now() > expiry;
      console.log('Token expiry check:', {
        expires: new Date(expiry),
        now: new Date(),
        isExpired
      });
      return isExpired;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    this.isLoadingSubject.next(false);
    
    let errorMessage = 'Error al iniciar sesión';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Credenciales inválidas';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    }
    
    throw { userMessage: errorMessage };
  }
}