import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CertificateService } from '../../core/services/certificate.service';
import { UserService } from '../../core/services/user.service';
import { Certificate, CertificateStatus, CertificateUploadRequest } from '../../core/models/certificate.model';
import { User } from '../../core/models/user.model';
import { NotificationService } from '../../shared/services/notification.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css']
})
export class CertificatesComponent implements OnInit {
  certificates: Certificate[] = [];
  filteredCertificates: Certificate[] = [];
  users: User[] = [];
  
  // Filters
  filters = {
    search: '',
    status: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Sorting
  sortBy = 'uploadedAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // UI State
  isLoading = false;
  showUploadModal = false;
  selectedFile: File | null = null;
  
  // Forms
  uploadForm: FormGroup;
  
  // Options  
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'EXPIRED', label: 'Expirado' },
    { value: 'REVOKED', label: 'Revocado' },
    { value: 'PENDING', label: 'Pendiente' }
  ];

  constructor(
    private certificateService: CertificateService,
    private userService: UserService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.uploadForm = this.createUploadForm();
  }

  ngOnInit() {
    this.loadCertificates();
    this.loadUsers();
  }

  createUploadForm(): FormGroup {
    return this.fb.group({
      userId: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  loadCertificates() {
    this.isLoading = true;
    
    this.certificateService.getAllCertificates().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.certificates = response.data.content;
          this.totalElements = response.data.totalElements;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
          this.applyFilters();
        } else {
          console.error('Error in API response:', response.message);
          this.certificates = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        this.certificates = [];
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data.content.filter(user => user.role === 'ROLE_FIRMANTE');
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  applyFilters() {
    this.filteredCertificates = this.certificates.filter(cert => {
      // Search filter
      const matchesSearch = !this.filters.search || 
        cert.fileName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cert.subject?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cert.issuer?.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cert.serialNumber?.toLowerCase().includes(this.filters.search.toLowerCase());
      
      // Status filter
      const matchesStatus = !this.filters.status || cert.status === this.filters.status;
      
      // User filter
      const matchesUser = !this.filters.userId || cert.userId.toString() === this.filters.userId;
      
      // Date range filter
      let matchesDateRange = true;
      if (this.filters.dateFrom || this.filters.dateTo) {
        const certDate = new Date(cert.uploadedAt);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59') : null;
        
        if (fromDate && certDate < fromDate) matchesDateRange = false;
        if (toDate && certDate > toDate) matchesDateRange = false;
      }
      
      return matchesSearch && matchesStatus && matchesUser && matchesDateRange;
    });
    
    // Apply sorting
    this.applySorting();
  }

  applySorting() {
    this.filteredCertificates.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (this.sortBy) {
        case 'fileName':
          valueA = a.fileName.toLowerCase();
          valueB = b.fileName.toLowerCase();
          break;
        case 'userId':
          valueA = a.userId;
          valueB = b.userId;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'uploadedAt':
          valueA = new Date(a.uploadedAt);
          valueB = new Date(b.uploadedAt);
          break;
        case 'validTo':
          valueA = new Date(a.validTo);
          valueB = new Date(b.validTo);
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      userId: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCertificates();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadCertificates();
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

  openUploadModal() {
    this.showUploadModal = true;
    this.uploadForm.reset();
    this.selectedFile = null;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.uploadForm.reset();
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.p12')) {
      this.selectedFile = file;
    } else {
      this.notificationService.error('Archivo inválido', 'Por favor selecciona un archivo .p12 válido');
      event.target.value = '';
      this.selectedFile = null;
    }
  }

  onUploadCertificate() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.markFormGroupTouched(this.uploadForm);
      return;
    }

    const formData = this.uploadForm.value;
    const request: CertificateUploadRequest = {
      userId: parseInt(formData.userId),
      password: formData.password,
      file: this.selectedFile
    };
    
    this.certificateService.uploadCertificate(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            'Certificado subido exitosamente',
            'El certificado ha sido procesado y almacenado correctamente.'
          );
          this.closeUploadModal();
          this.loadCertificates();
        } else {
          this.notificationService.error('Error al subir certificado', response.message);
        }
      },
      error: (error) => {
        console.error('Error uploading certificate:', error);
        
        let errorMessage = 'Error al subir el certificado';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error al subir certificado', errorMessage);
      }
    });
  }

  onViewCertificate(certificate: Certificate) {
    this.certificateService.getCertificateById(certificate.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Show certificate details
          console.log('Certificate details:', response.data);
        }
      },
      error: (error) => {
        console.error('Error loading certificate details:', error);
      }
    });
  }

  onDeleteCertificate(certificate: Certificate) {
    if (confirm(`¿Está seguro de que desea eliminar el certificado "${certificate.fileName}"?`)) {
      this.certificateService.deleteCertificate(certificate.id).subscribe({
        next: (response) => {
          this.notificationService.success('Certificado eliminado', 'El certificado ha sido eliminado del sistema.');
          this.loadCertificates();
        },
        error: (error) => {
          console.error('Error deleting certificate:', error);
          this.notificationService.error('Error al eliminar certificado', 'No se pudo eliminar el certificado. Inténtelo nuevamente.');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'EXPIRED':
        return 'badge-warning';
      case 'REVOKED':
        return 'badge-error';
      case 'PENDING':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'EXPIRED':
        return 'Expirado';
      case 'REVOKED':
        return 'Revocado';
      case 'PENDING':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : `ID: ${userId}`;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.uploadForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.uploadForm.get(fieldName);
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