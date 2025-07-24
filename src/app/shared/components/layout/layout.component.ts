import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  title: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <nav class="sidebar" [class.expanded]="isSidebarExpanded">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">
              <span class="logo-text">OEFA</span>
            </div>
            <div class="logo-info" *ngIf="isSidebarExpanded">
              <h3>Sistema de Firmas</h3>
              <p>Certificados Digitales</p>
            </div>
          </div>
          <button class="sidebar-toggle" (click)="toggleSidebar()">
            <i class="icon-menu"></i>
          </button>
        </div>

        <div class="sidebar-content">
          <div class="sidebar-user">
            <div class="user-avatar">
              <span>{{ getUserInitials() }}</span>
            </div>
            <div class="user-info" *ngIf="isSidebarExpanded">
              <h4>{{ getUserDisplayName() }}</h4>
              <p>{{ getRoleDisplayName() }}</p>
              <span class="user-status">{{ currentUser?.status }}</span>
            </div>
          </div>

          <div class="sidebar-menu">
            <ul class="menu-list">
              <li class="menu-item" *ngFor="let item of getVisibleMenuItems()">
                <a 
                  [routerLink]="item.route" 
                  routerLinkActive="active" 
                  class="menu-link">
                  <i class="menu-icon icon-{{ item.icon }}"></i>
                  <span class="menu-text" *ngIf="isSidebarExpanded">{{ item.title }}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="icon-logout"></i>
            <span *ngIf="isSidebarExpanded">Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="main-content" [class.sidebar-expanded]="isSidebarExpanded">
        <header class="main-header">
          <div class="header-left">
            <button class="menu-toggle" (click)="toggleSidebar()">
              <i class="icon-menu"></i>
            </button>
            <h1 class="page-title">Sistema de Gestión OEFA</h1>
          </div>
          
          <div class="header-right">
            <div class="header-actions">
              <button class="header-action">
                <i class="icon-bell"></i>
                <span class="notification-badge">3</span>
              </button>
              <button class="header-action">
                <i class="icon-settings"></i>
              </button>
            </div>
            
            <div class="user-menu">
              <div class="user-avatar">
                <span>{{ getUserInitials() }}</span>
              </div>
              <div class="user-details">
                <span class="user-name">{{ getUserDisplayName() }}</span>
                <span class="user-role">{{ getRoleDisplayName() }}</span>
              </div>
            </div>
          </div>
        </header>

        <main class="main-body">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  currentUser: any = null;
  isSidebarExpanded = true;

  menuItems: MenuItem[] = [
    { title: 'Panel Principal', route: '/dashboard', icon: 'dashboard', roles: ['ROLE_ADMIN'] },
    { title: 'Certificados', route: '/certificates', icon: 'certificate', roles: ['ROLE_ADMIN'] },
    { title: 'Usuarios', route: '/users', icon: 'users', roles: ['ROLE_ADMIN'] },
    { title: 'Documentos Firmados', route: '/signed-documents', icon: 'document', roles: ['ROLE_ADMIN'] },
    { title: 'Seguridad', route: '/security', icon: 'shield', roles: ['ROLE_ADMIN'] }
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

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const firstName = this.currentUser.nombre || '';
    const lastName = this.currentUser.apellido || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Usuario';
    return `${this.currentUser.nombre || ''} ${this.currentUser.apellido || ''}`.trim();
  }

  getRoleDisplayName(): string {
    if (!this.currentUser?.role) return 'Usuario';
    switch (this.currentUser.role) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_FIRMANTE':
        return 'Firmante';
      default:
        return 'Usuario';
    }
  }

  getVisibleMenuItems(): MenuItem[] {
    if (!this.currentUser?.role) return [];
    
    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(this.currentUser.role);
    });
  }

  logout() {
    this.authService.logout();
  }
}