import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CertificateV2Service } from '../../core/services/certificate-v2.service';
import { AuthService } from '../../core/services/auth.service';
import { Certificate, CertificateStatus } from '../../core/models/certificate-v2.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css']
})
export class CertificatesComponent implements OnInit {
  certificates: Certificate[] = [];
  filteredCertificates: Certificate[] = [];
  currentUser: User | null = null;
  
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
  showFilters = false;
  
  // Status options
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: CertificateStatus.ACTIVE, label: 'Activo' },
    { value: CertificateStatus.EXPIRED, label: 'Expirado' },
    { value: CertificateStatus.REVOKED, label: 'Revocado' },
    { value: CertificateStatus.INVALID, label: 'Inválido' }
  ];

  // Forms
  uploadForm: FormGroup;
  filterForm: FormGroup;
  
  // UI State
  showUploadModal = false;
  showDeleteModal = false;
  certificateToDelete: Certificate | null = null;
  selectedFile: File | null = null;
  uploadProgress = 0;

  constructor(
    private certificateService: CertificateV2Service,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.uploadForm = this.createUploadForm();
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadCertificates();
    });
    
    this.setupFilterSubscription();
  }

  createUploadForm(): FormGroup {
    return this.fb.group({
      userId: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      file: [null, Validators.required]
    });
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      status: [''],
      userId: ['']
    });
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadCertificates() {
    this.isLoading = true;
    
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDir: this.sortDirection,
      search: this.filterForm.get('search')?.value || '',
      status: this.filterForm.get('status')?.value || '',
      userId: this.filterForm.get('userId')?.value || undefined
    };

    this.certificateService.getAllCertificates(params).subscribe({
      next: (certificates) => {
        this.certificates = certificates;
        this.totalElements = certificates.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredCertificates = this.certificates.filter(cert => {
      const matchesSearch = !this.filters.search || 
        cert.fileName.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cert.subject.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(this.filters.search.toLowerCase());
      
      const matchesStatus = !this.filters.status || cert.status === this.filters.status;
      
      const matchesIssuer = !this.filters.issuer || 
        cert.issuer.toLowerCase().includes(this.filters.issuer.toLowerCase());
      
      const matchesDateFrom = !this.filters.dateFrom || 
        new Date(cert.uploadedAt) >= new Date(this.filters.dateFrom);
      
      const matchesDateTo = !this.filters.dateTo || 
        new Date(cert.uploadedAt) <= new Date(this.filters.dateTo);
      
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
    this.loadCertificates();
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

  getStatusBadgeClass(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.ACTIVE: return 'badge-success';
      case CertificateStatus.EXPIRED: return 'badge-warning';
      case CertificateStatus.REVOKED: return 'badge-danger';
      case CertificateStatus.INVALID: return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getStatusText(status: CertificateStatus): string {
    switch (status) {
      case CertificateStatus.ACTIVE: return 'Activo';
      case CertificateStatus.EXPIRED: return 'Expirado';
      case CertificateStatus.REVOKED: return 'Revocado';
      case CertificateStatus.INVALID: return 'Inválido';
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

  canEditCertificate(certificate: Certificate): boolean {
    return this.currentUser?.role === 'ROLE_ADMIN' || 
           certificate.userId === this.currentUser?.id;
  }

  canDeleteCertificate(certificate: Certificate): boolean {
    return this.currentUser?.role === 'ROLE_ADMIN' || 
           certificate.userId === this.currentUser?.id;
  }

  onUploadCertificate() {
    this.openUploadModal();
  }

  onEditCertificate(certificate: Certificate) {
    // TODO: Implement edit functionality
    alert('Funcionalidad de edición no implementada aún');
  }

  // Upload methods
  openUploadModal() {
    this.showUploadModal = true;
    this.uploadForm.reset();
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.uploadForm.reset();
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.p12')) {
      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
    } else {
      alert('Por favor selecciona un archivo .p12 válido');
      event.target.value = '';
    }
  }

  onUploadSubmit() {
    if (this.uploadForm.valid && this.selectedFile) {
      const formData = this.uploadForm.value;
      
      this.certificateService.uploadCertificate(
        formData.userId,
        formData.password,
        this.selectedFile
      ).subscribe({
        next: (response) => {
          alert('Certificado subido exitosamente');
          this.closeUploadModal();
          this.loadCertificates();
        },
        error: (error) => {
          console.error('Error uploading certificate:', error);
          alert('Error al subir el certificado');
        }
      });
    }
  }

  onViewCertificate(certificate: Certificate) {
    // Show certificate details in a modal or navigate to detail view
    console.log('View certificate:', certificate);
    alert(`Detalles del certificado:\n\nArchivo: ${certificate.fileName}\nSujeto: ${certificate.subject}\nEmisor: ${certificate.issuer}\nVálido desde: ${this.formatDate(new Date(certificate.validFrom))}\nVálido hasta: ${this.formatDate(new Date(certificate.validTo))}\nEstado: ${this.getStatusText(certificate.status)}`);
  }

  confirmDeleteCertificate(certificate: Certificate) {
    this.certificateToDelete = certificate;
    this.showDeleteModal = true;
  }

  onDeleteCertificate(certificate?: Certificate) {
    if (certificate) {
      // Direct delete from button click
      this.confirmDeleteCertificate(certificate);
    } else if (this.certificateToDelete) {
      // Delete from modal confirmation
      this.certificateService.deleteCertificate(this.certificateToDelete.id).subscribe({
        next: (response) => {
          alert('Certificado eliminado exitosamente');
          this.showDeleteModal = false;
          this.certificateToDelete = null;
          this.loadCertificates();
        },
        error: (error) => {
          console.error('Error deleting certificate:', error);
          alert('Error al eliminar el certificado');
        }
      });
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.certificateToDelete = null;
  }

  onBulkDelete() {
    if (this.selectedCertificates.size === 0) return;
    
    const count = this.selectedCertificates.size;
    if (confirm(`¿Está seguro de que desea eliminar ${count} certificado(s) seleccionado(s)?`)) {
      const certificateIds = Array.from(this.selectedCertificates);
      
      this.certificateService.deleteCertificates(certificateIds).subscribe({
        next: (response) => {
          alert(response.message);
          this.selectedCertificates.clear();
          this.loadCertificates();
        },
        error: (error) => {
          console.error('Error deleting certificates:', error);
          alert('Error al eliminar los certificados');
        }
      });
    }
  }

  onValidateCertificate(certificate: Certificate) {
    this.certificateService.validateCertificate(certificate.id).subscribe({
      next: (response) => {
        alert('Certificado validado correctamente');
        this.loadCertificates();
      },
      error: (error) => {
        console.error('Error validating certificate:', error);
        alert('Error al validar el certificado');
      }
    });
  }

  // Form validation helpers
  getFieldError(formName: string, fieldName: string): string | null {
    const form = formName === 'upload' ? this.uploadForm : this.filterForm;
    const field = form.get(fieldName);
    
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

  isFieldInvalid(formName: string, fieldName: string): boolean {
    const form = formName === 'upload' ? this.uploadForm : this.filterForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
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