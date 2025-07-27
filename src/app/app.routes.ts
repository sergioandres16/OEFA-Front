import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard, AdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/login',
    pathMatch: 'full'
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/admin-login/admin-login.component').then(c => c.AdminLoginComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'firmante/verify/:token',
    loadComponent: () => import('./features/auth/firmante-login/firmante-login.component').then(c => c.FirmanteLoginComponent)
  },
  {
    path: 'activate',
    loadComponent: () => import('./features/auth/activate/activate.component').then(c => c.ActivateComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'demo',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'certificates',
    loadComponent: () => import('./features/certificates/certificates.component').then(c => c.CertificatesComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(c => c.UsersComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'signed-documents',
    loadComponent: () => import('./features/signed-documents/signed-documents.component').then(c => c.SignedDocumentsComponent),
    canActivate: [AdminGuard]
  },
  {
    path: '**',
    redirectTo: '/admin/login'
  }
];
