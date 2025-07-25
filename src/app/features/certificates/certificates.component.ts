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
    issuer: '',
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
  selectedCertificates: Set<number> = new Set();
  
  // Status options
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'VALIDO', label: 'Válido' },
    { value: 'REVOCADO', label: 'Revocado' },
    { value: 'INVALIDO', label: 'Inválido' },
    { value: 'CADUCADO', label: 'Caducado' },
    { value: 'NO_PERMITIDO_FIRMA_DIGITAL', label: 'No permitido firma digital' },
    { value: 'ADULTERADO', label: 'Adulterado' },
    { value: 'PENDIENTE_VALIDACION', label: 'Pendiente validación' },
    { value: 'ELIMINADO', label: 'Eliminado' }
  ];

  // Forms
  uploadForm: FormGroup;
  
  // UI State
  showUploadModal = false;
  showDeleteModal = false;
  showViewModal = false;
  certificateToDelete: Certificate | null = null;
  selectedCertificate: Certificate | null = null;
  selectedFile: File | null = null;

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
      userId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  loadCertificates() {
    this.isLoading = true;
    
    this.certificateService.getAllCertificates().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filter out deleted certificates (status != ELIMINADO)
          const activeCertificates = response.data.content?.filter(cert => 
            cert.status !== 'ELIMINADO'
          ) || [];
          
          this.certificates = activeCertificates;
          this.totalElements = activeCertificates.length;
          this.totalPages = Math.ceil(activeCertificates.length / this.pageSize);
          this.currentPage = response.data.page || 0;
          this.applyFilters();
          console.log('Certificates loaded:', activeCertificates);
        } else {
          console.error('Error in API response:', response.message);
          this.certificates = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        
        let errorMessage = 'Error al cargar los certificados';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error al cargar certificados', errorMessage);
        this.certificates = [];
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
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
      const matchesSearch = !this.filters.search || 
        cert.fileName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (cert.subject && cert.subject.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (cert.issuer && cert.issuer.toLowerCase().includes(this.filters.search.toLowerCase())) ||
        (cert.serialNumber && cert.serialNumber.toLowerCase().includes(this.filters.search.toLowerCase()));
      
      const matchesStatus = !this.filters.status || cert.status === this.filters.status;
      
      const matchesIssuer = !this.filters.issuer || 
        (cert.issuer && cert.issuer.toLowerCase().includes(this.filters.issuer.toLowerCase()));
      
      const matchesDateFrom = !this.filters.dateFrom || 
        new Date(cert.uploadedAt!) >= new Date(this.filters.dateFrom);
      
      const matchesDateTo = !this.filters.dateTo || 
        new Date(cert.uploadedAt!) <= new Date(this.filters.dateTo + 'T23:59:59');
      
      return matchesSearch && matchesStatus && matchesIssuer && matchesDateFrom && matchesDateTo;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      issuer: '',
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
        case 'subject':
          valueA = (a.subject || '').toLowerCase();
          valueB = (b.subject || '').toLowerCase();
          break;
        case 'issuer':
          valueA = (a.issuer || '').toLowerCase();
          valueB = (b.issuer || '').toLowerCase();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'uploadedAt':
          valueA = new Date(a.uploadedAt!);
          valueB = new Date(b.uploadedAt!);
          break;
        case 'validTo':
          valueA = new Date(a.validTo!);
          valueB = new Date(b.validTo!);
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

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
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

  toggleCertificateSelection(certificateId: number) {
    if (this.selectedCertificates.has(certificateId)) {
      this.selectedCertificates.delete(certificateId);
    } else {
      this.selectedCertificates.add(certificateId);
    }
  }

  selectAllCertificates() {
    if (this.selectedCertificates.size === this.filteredCertificates.length) {
      this.selectedCertificates.clear();
    } else {
      this.selectedCertificates.clear();
      this.filteredCertificates.forEach(cert => this.selectedCertificates.add(cert.id));
    }
  }

  isAllSelected(): boolean {
    return this.filteredCertificates.length > 0 && 
           this.selectedCertificates.size === this.filteredCertificates.length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VALIDO': return 'badge-success';
      case 'CADUCADO': return 'badge-warning';
      case 'REVOCADO': return 'badge-danger';
      case 'INVALIDO': return 'badge-danger';
      case 'ADULTERADO': return 'badge-danger';
      case 'NO_PERMITIDO_FIRMA_DIGITAL': return 'badge-warning';
      case 'PENDIENTE_VALIDACION': return 'badge-info';
      case 'ELIMINADO': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'VALIDO': return 'Válido';
      case 'REVOCADO': return 'Revocado';
      case 'INVALIDO': return 'Inválido';
      case 'CADUCADO': return 'Caducado';
      case 'NO_PERMITIDO_FIRMA_DIGITAL': return 'No permitido firma digital';
      case 'ADULTERADO': return 'Adulterado';
      case 'PENDIENTE_VALIDACION': return 'Pendiente validación';
      case 'ELIMINADO': return 'Eliminado';
      default: return status;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onUploadCertificate() {
    this.openUploadModal();
  }

  onEditCertificate(certificate: Certificate) {
    // TODO: Implement edit functionality
    this.notificationService.info('Funcionalidad no disponible', 'La edición de certificados no está implementada aún');
  }

  // Upload methods
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

  onUploadSubmit() {
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
        if (response.success && response.data) {
          this.selectedCertificate = response.data;
          this.showViewModal = true;
        } else {
          this.notificationService.error('Error', 'No se pudieron cargar los detalles del certificado');
        }
      },
      error: (error) => {
        console.error('Error loading certificate details:', error);
        
        let errorMessage = 'No se pudieron cargar los detalles del certificado';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  onDeleteCertificate(certificate: Certificate) {
    this.certificateToDelete = certificate;
    this.showDeleteModal = true;
  }

  confirmDeleteCertificate() {
    if (!this.certificateToDelete) return;

    this.certificateService.deleteCertificate(this.certificateToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Certificado eliminado', 'El certificado ha sido eliminado del sistema.');
          this.closeDeleteModal();
          this.loadCertificates();
        } else {
          this.notificationService.error('Error al eliminar certificado', response.message);
        }
      },
      error: (error) => {
        console.error('Error deleting certificate:', error);
        
        let errorMessage = 'No se pudo eliminar el certificado. Inténtelo nuevamente.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error al eliminar certificado', errorMessage);
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.certificateToDelete = null;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedCertificate = null;
  }

  onBulkDelete() {
    if (this.selectedCertificates.size === 0) return;
    
    const count = this.selectedCertificates.size;
    if (confirm(`¿Está seguro de que desea eliminar ${count} certificado(s) seleccionado(s)?`)) {
      const certificateIds = Array.from(this.selectedCertificates);
      
      // Since we don't have a bulk delete API, delete them one by one
      let deletedCount = 0;
      certificateIds.forEach(id => {
        this.certificateService.deleteCertificate(id).subscribe({
          next: (response) => {
            deletedCount++;
            if (deletedCount === certificateIds.length) {
              this.notificationService.success('Certificados eliminados', `Se eliminaron ${deletedCount} certificados exitosamente.`);
              this.selectedCertificates.clear();
              this.loadCertificates();
            }
          },
          error: (error) => {
            console.error('Error deleting certificate:', error);
            this.notificationService.error('Error', 'Algunos certificados no pudieron ser eliminados');
          }
        });
      });
    }
  }

  onValidateCertificate(certificate: Certificate) {
    // This functionality might not be available in the API, show a message
    this.notificationService.info('Funcionalidad no disponible', 'La validación de certificados no está implementada en el backend');
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : `ID: ${userId}`;
  }

  // Form validation helpers
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

  trackByCertificate(index: number, certificate: Certificate): number {
    return certificate.id;
  }

  getDaysUntilExpiration(validTo: Date | string): string {
    const now = new Date();
    const expiration = new Date(validTo);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expirado';
    } else if (diffDays === 0) {
      return 'Expira hoy';
    } else if (diffDays === 1) {
      return 'Expira mañana';
    } else if (diffDays <= 30) {
      return `${diffDays} días restantes`;
    } else {
      return `${Math.ceil(diffDays / 30)} meses restantes`;
    }
  }

  isExpiringSoon(validTo: Date | string): boolean {
    const now = new Date();
    const expiration = new Date(validTo);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  isExpired(validTo: Date | string): boolean {
    const now = new Date();
    const expiration = new Date(validTo);
    return expiration <= now;
  }

  getMaxItemsShown(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}