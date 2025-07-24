import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isSidebarExpanded = true;

  menuItems = [
    {
      title: 'Panel Principal',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ROLE_ADMIN']
    },
    {
      title: 'Certificados',
      icon: 'certificate',
      route: '/certificates',
      roles: ['ROLE_ADMIN']
    },
    {
      title: 'Usuarios',
      icon: 'users',
      route: '/users',
      roles: ['ROLE_ADMIN']
    },
    {
      title: 'Documentos Firmados',
      icon: 'document',
      route: '/signed-documents',
      roles: ['ROLE_ADMIN']
    },
    {
      title: 'Seguridad',
      icon: 'shield',
      route: '/security',
      roles: ['ROLE_ADMIN']
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  logout() {
    this.authService.logout();
  }

  hasRole(requiredRoles: string[]): boolean {
    return this.currentUser ? requiredRoles.includes(this.currentUser.role) : false;
  }

  getVisibleMenuItems() {
    return this.menuItems.filter(item => this.hasRole(item.roles));
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.nombre} ${this.currentUser.apellido}`;
    }
    return 'Usuario';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      return `${this.currentUser.nombre.charAt(0)}${this.currentUser.apellido.charAt(0)}`;
    }
    return 'U';
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    switch (this.currentUser.role) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_FIRMANTE':
        return 'Firmante';
      default:
        return 'Usuario';
    }
  }
}