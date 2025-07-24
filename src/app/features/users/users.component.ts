import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, CreateFirmanteRequest, UserListParams, PagedResponse } from '../../core/services/user.service';
import { User, UserRole, UserStatus } from '../../core/models/user.model';
import { NotificationService } from '../../shared/services/notification.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  
  // Filters
  filters = {
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Sorting
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // UI State
  isLoading = false;
  showCreateModal = false;
  showEditModal = false;
  selectedUser: User | null = null;
  
  // Forms
  createUserForm: FormGroup;
  editUserForm: FormGroup;
  
  // Options  
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'PENDIENTE', label: 'Pendiente' }
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.createUserForm = this.createForm();
    this.editUserForm = this.createForm();
  }

  ngOnInit() {
    this.loadUsers();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      cargo: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  loadUsers() {
    this.isLoading = true;
    
    const params: UserListParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDir: this.sortDirection,
      nombre: this.filters.search,
      email: this.filters.search
    };

    // Use real API to get all users
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter only firmantes (exclude admins and service accounts) and only active/pending status
          const firmantesOnly = response.data.content.filter(user => {
            return user.role === 'ROLE_FIRMANTE' && 
                   (user.status === 'ACTIVO' || user.status === 'PENDIENTE');
          });
          this.users = firmantesOnly;
          this.totalElements = firmantesOnly.length;
          this.totalPages = Math.ceil(firmantesOnly.length / this.pageSize);
          this.currentPage = response.data.page;
          this.applyFilters();
          console.log('Firmantes loaded:', firmantesOnly);
        } else {
          console.error('Error in API response:', response.message);
          this.users = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      // Search filter - now includes cargo
      const matchesSearch = !this.filters.search || 
        user.nombre.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.apellido.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (user.dni?.includes(this.filters.search) || false) ||
        (user.cargo?.toLowerCase().includes(this.filters.search.toLowerCase()) || false);
      
      // Status filter
      const matchesStatus = !this.filters.status || user.status === this.filters.status;
      
      // Date range filter
      let matchesDateRange = true;
      if (this.filters.dateFrom || this.filters.dateTo) {
        const userDate = new Date(user.createdAt!);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59') : null;
        
        if (fromDate && userDate < fromDate) matchesDateRange = false;
        if (toDate && userDate > toDate) matchesDateRange = false;
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadUsers();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadUsers();
  }

  getPages(): number[] {
    const pages = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.createUserForm.reset();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createUserForm.reset();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editUserForm.reset();
    this.selectedUser = null;
  }

  onCreateUser() {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      return;
    }

    const formData = this.createUserForm.value;
    const request: CreateFirmanteRequest = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      dni: formData.dni,
      cargo: formData.cargo
    };
    
    this.userService.createFirmante(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            'Usuario creado exitosamente',
            `${response.data.nombre} ${response.data.apellido} ha sido registrado como firmante.`
          );
          console.log('Firmante creado:', response.data);
          this.closeCreateModal();
          this.loadUsers();
        } else {
          this.notificationService.error('Error al crear usuario', response.message);
        }
      },
      error: (error) => {
        console.error('Error creating user:', error);
        
        // Try to extract the API error message
        let errorMessage = 'Error al crear el usuario';
        
        if (error.error && error.error.message) {
          // API returned error in expected format
          errorMessage = error.error.message;
        } else if (error.message) {
          // HTTP error message
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error al crear usuario', errorMessage);
      }
    });
  }

  onEditUser(user: User) {
    this.selectedUser = user;
    this.showEditModal = true;
    
    // Populate the edit form with current user data
    this.editUserForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      dni: user.dni,
      cargo: user.cargo,
      role: user.role
    });
  }

  onUpdateUser() {
    if (this.editUserForm.invalid || !this.selectedUser) {
      this.markFormGroupTouched(this.editUserForm);
      return;
    }

    const formData = this.editUserForm.value;
    const request = {
      id: this.selectedUser.id,
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      dni: formData.dni,
      cargo: formData.cargo,
      role: formData.role
    };
    
    this.userService.updateUser(this.selectedUser.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            'Usuario actualizado exitosamente',
            `${response.data.nombre} ${response.data.apellido} ha sido actualizado.`
          );
          this.closeEditModal();
          // Refresh the user list to show updated data
          this.loadUsers();
        } else {
          this.notificationService.error('Error al actualizar usuario', response.message);
        }
      },
      error: (error) => {
        console.error('Error updating user:', error);
        
        let errorMessage = 'Error al actualizar el usuario';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error al actualizar usuario', errorMessage);
      }
    });
  }

  onViewUser(user: User) {
    this.selectedUser = user;
    // TODO: Implementar modal de vista
    console.log('View user:', user);
  }

  onDeleteUser(user: User) {
    if (confirm(`¿Está seguro de que desea eliminar al usuario "${user.nombre} ${user.apellido}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          this.notificationService.success('Usuario eliminado', `${user.nombre} ${user.apellido} ha sido eliminado del sistema.`);
          // Refresh the user list to show updated data
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.notificationService.error('Error al eliminar usuario', 'No se pudo eliminar el usuario. Inténtelo nuevamente.');
        }
      });
    }
  }

  onResendCredentials(user: User) {
    if (confirm(`¿Reenviar credenciales de acceso a ${user.email}?`)) {
      const request = {
        email: user.email,
        dni: user.dni,
        regeneratePassword: false
      };
      
      this.userService.resendCredentials(request).subscribe({
        next: (response) => {
          this.notificationService.success('Credenciales reenviadas', `Se han enviado las credenciales a ${user.email}`);
          // Refresh the user list to show any updated status
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error resending credentials:', error);
          this.notificationService.error('Error al reenviar credenciales', 'No se pudieron enviar las credenciales. Inténtelo nuevamente.');
        }
      });
    }
  }


  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_FIRMANTE':
        return 'Firmante';
      default:
        return 'Usuario';
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'ACTIVO':
        return 'Activo';
      case 'PENDIENTE':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVO':
        return 'badge-success';
      case 'PENDIENTE':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | Date): string {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${formattedDate} ${formattedTime}`;
  }

  getFieldError(fieldName: string, formType: 'create' | 'edit' = 'create'): string | null {
    const form = formType === 'create' ? this.createUserForm : this.editUserForm;
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors['pattern']) {
        return 'DNI debe tener exactamente 8 dígitos';
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string, formType: 'create' | 'edit' = 'create'): boolean {
    const form = formType === 'create' ? this.createUserForm : this.editUserForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getMaxItemsShown(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }


}