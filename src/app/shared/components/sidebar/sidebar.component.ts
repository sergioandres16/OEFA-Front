import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar" [class.collapsed]="isCollapsed">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="logo" *ngIf="!isCollapsed">
          <h3>OEFA</h3>
          <span>Sistema de Firmas</span>
        </div>
        <button class="toggle-btn" (click)="toggleSidebar()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of navItems" class="nav-item">
            <a 
              [routerLink]="item.route" 
              routerLinkActive="active"
              class="nav-link"
              [title]="isCollapsed ? item.label : ''">
              <div class="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @switch (item.icon) {
                    @case ('dashboard') {
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    }
                    @case ('users') {
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    }
                    @case ('documents') {
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    }
                    @case ('certificates') {
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    }
                    @default {
                      <circle cx="12" cy="12" r="10"></circle>
                    }
                  }
                </svg>
              </div>
              <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- User Section -->
      <div class="sidebar-footer" *ngIf="!isCollapsed">
        <div class="user-info" *ngIf="currentUser">
          <div class="user-avatar">
            <span>{{ currentUser.nombre?.charAt(0) }}{{ currentUser.apellido?.charAt(0) }}</span>
          </div>
          <div class="user-details">
            <div class="user-name">{{ currentUser.nombre }} {{ currentUser.apellido }}</div>
            <div class="user-role">{{ currentUser.role === 'ROLE_ADMIN' ? 'Administrador' : 'Usuario' }}</div>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span *ngIf="!isCollapsed">Cerrar sesión</span>
        </button>
      </div>
      
      <div class="sidebar-footer-collapsed" *ngIf="isCollapsed">
        <button class="logout-btn-collapsed" (click)="logout()" title="Cerrar sesión">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  currentUser: any = null;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Gestión de Firmantes', icon: 'users', route: '/users' },
    { label: 'Documentos Firmados', icon: 'documents', route: '/signed-documents' },
    { label: 'Certificados', icon: 'certificates', route: '/certificates' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}