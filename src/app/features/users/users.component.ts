import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService, CreateFirmanteRequest, UserListParams, PagedResponse } from '../../core/services/user.service';
import { User, UserRole, UserStatus } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  currentUser: User | null = null;
  
  // Filters
  filters = {
    search: '',
    role: '',
    status: ''
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
  
  // Options
  roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: UserRole.ROLE_ADMIN, label: 'Administrador' },
    { value: UserRole.ROLE_FIRMANTE, label: 'Firmante' }
  ];
  
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: UserStatus.ACTIVE, label: 'Activo' },
    { value: UserStatus.INACTIVE, label: 'Inactivo' },
    { value: UserStatus.PENDING, label: 'Pendiente' },
    { value: UserStatus.LOCKED, label: 'Bloqueado' }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.createUserForm = this.createForm();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadUsers();
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      cargo: ['', [Validators.required, Validators.maxLength(150)]],
      role: [UserRole.ROLE_FIRMANTE, [Validators.required]]
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
          this.users = response.data.content;
          this.totalElements = response.data.totalElements;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
          this.pageSize = response.data.size;
          this.applyFilters();
          console.log('Users loaded:', response.data.content);
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
      const matchesSearch = !this.filters.search || 
        user.nombre.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.apellido.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (user.dni?.includes(this.filters.search) || false);
      
      const matchesRole = !this.filters.role || user.role === this.filters.role;
      const matchesStatus = !this.filters.status || user.status === this.filters.status;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      search: '',
      role: '',
      status: ''
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
    this.createUserForm.patchValue({
      role: UserRole.ROLE_FIRMANTE
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createUserForm.reset();
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
          alert(`Usuario creado exitosamente: ${response.message}`);
          console.log('Firmante creado:', response.data);
          this.closeCreateModal();
          this.loadUsers();
        } else {
          alert(`Error: ${response.message}`);
        }
      },
      error: (error) => {
        console.error('Error creating user:', error);
        alert('Error al crear el usuario');
      }
    });
  }

  onViewUser(user: User) {
    this.selectedUser = user;
    // TODO: Implementar modal de vista
    console.log('View user:', user);
  }

  onEditUser(user: User) {
    this.selectedUser = user;
    this.showEditModal = true;
    // TODO: Implementar modal de edición
    console.log('Edit user:', user);
  }

  onDeleteUser(user: User) {
    if (confirm(`¿Está seguro de que desea eliminar al usuario "${user.nombre} ${user.apellido}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          alert('Usuario eliminado exitosamente');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Error al eliminar el usuario');
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
          alert('Credenciales reenviadas exitosamente');
        },
        error: (error) => {
          console.error('Error resending credentials:', error);
          alert('Error al reenviar las credenciales');
        }
      });
    }
  }

  onToggleStatus(user: User) {
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const action = newStatus === UserStatus.ACTIVE ? 'activar' : 'desactivar';
    
    if (confirm(`¿Está seguro de que desea ${action} al usuario "${user.nombre} ${user.apellido}"?`)) {
      const serviceMethod = newStatus === UserStatus.ACTIVE 
        ? this.userService.activateUser(user.id)
        : this.userService.deactivateUser(user.id);
        
      serviceMethod.subscribe({
        next: (response) => {
          alert(`Usuario ${action}do exitosamente`);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
          alert(`Error al ${action} el usuario`);
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
      case 'INACTIVE':
        return 'Inactivo';
      case 'PENDING':
        return 'Pendiente';
      case 'LOCKED':
        return 'Bloqueado';
      default:
        return 'Desconocido';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVO':
        return 'badge-success';
      case 'INACTIVE':
        return 'badge-error';
      case 'PENDING':
        return 'badge-warning';
      case 'LOCKED':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.createUserForm.get(fieldName);
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
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