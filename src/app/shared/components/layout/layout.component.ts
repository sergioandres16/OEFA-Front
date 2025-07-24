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
      <main class="main-content" [class.sidebar-expanded]="isSidebarExpanded">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  currentUser: any = null;
  isSidebarExpanded = false;

  menuItems: MenuItem[] = [
    { title: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { title: 'Gestión de Firmantes', route: '/users', icon: 'users', roles: ['ROLE_ADMIN'] },
    { title: 'Documentos Firmados', route: '/signed-documents', icon: 'document' },
    { title: 'Certificados', route: '/certificates', icon: 'certificate' }
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