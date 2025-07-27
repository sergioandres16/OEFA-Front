import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const authService = inject(AuthService);
  
  // Skip auth header for login endpoints
  const isLoginRequest = req.url.includes('/login') || req.url.includes('/register');
  
  let authReq = req;
  if (!isLoginRequest) {
    const token = authService.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
}

function handle401Error(
  request: HttpRequest<any>, 
  next: HttpHandlerFn, 
  authService: AuthService
): Observable<HttpEvent<any>> {
  
  return authService.refreshToken().pipe(
    switchMap(() => {
      const newToken = authService.getToken();
      if (newToken) {
        const newAuthReq = request.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });
        return next(newAuthReq);
      }
      authService.logout();
      return throwError(() => new Error('Token refresh failed'));
    }),
    catchError((error) => {
      authService.logout();
      return throwError(() => error);
    })
  );
}