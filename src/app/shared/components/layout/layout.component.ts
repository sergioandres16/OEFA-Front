import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 280px;
      transition: margin-left 0.3s ease;
      min-height: 100vh;
      background: var(--gray-50);
    }

    :host ::ng-deep app-sidebar.collapsed ~ .main-content {
      margin-left: 64px;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }
      
      :host ::ng-deep app-sidebar.collapsed ~ .main-content {
        margin-left: 64px;
      }
    }
  `]
})
export class LayoutComponent {
}