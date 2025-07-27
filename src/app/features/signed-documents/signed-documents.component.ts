import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SignedDocumentsService, SignedDocument, SignedDocumentListParams } from '../../core/services/signed-documents.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-signed-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './signed-documents.component.html',
  styleUrls: ['./signed-documents.component.css']
})
export class SignedDocumentsComponent implements OnInit {
  documents: SignedDocument[] = [];
  filteredDocuments: SignedDocument[] = [];
  users: User[] = [];
  filterForm: FormGroup;
  isLoading = false;
  
  // Modal state
  showViewModal = false;
  selectedDocument: SignedDocument | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Sorting
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';


  constructor(
    private fb: FormBuilder,
    private signedDocumentsService: SignedDocumentsService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.loadUsers();
    this.loadDocuments();
    this.setupFilterSubscription();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
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
        // Users loading failure doesn't affect main functionality
      }
    });
  }

  loadDocuments() {
    this.isLoading = true;
    
    const params: SignedDocumentListParams = {
      search: this.filterForm.get('search')?.value || '',
      page: this.currentPage,
      size: this.pageSize,
      sortDirection: 'desc'
    };

    // Cargar documentos firmados y visados
    this.signedDocumentsService.getAllSignedDocuments(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.documents = response.data.content || [];
          this.totalElements = response.data.totalElements || 0;
          this.totalPages = response.data.totalPages || 0;
          this.currentPage = response.data.number || 0;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading signed documents:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los documentos firmados');
        this.documents = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    let filtered = [...this.documents];

    // Global search filter - busca en múltiples campos
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(doc => {
        // Buscar información del firmante
        const user = this.users.find(u => u.id === doc.userId);
        const userName = user ? `${user.nombre} ${user.apellido}`.toLowerCase() : '';
        const userEmail = user ? user.email.toLowerCase() : '';
        
        return (
          (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm)) ||
          (doc.dni && doc.dni.toLowerCase().includes(searchTerm)) ||
          (doc.motivo && doc.motivo.toLowerCase().includes(searchTerm)) ||
          (doc.cargoFirmante && doc.cargoFirmante.toLowerCase().includes(searchTerm)) ||
          userName.includes(searchTerm) ||
          userEmail.includes(searchTerm) ||
          (doc.documentPath && doc.documentPath.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Date from filter (createdAt)
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(doc => 
        doc.createdAt && new Date(doc.createdAt) >= fromDate
      );
    }

    // Date to filter (createdAt)
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(doc => 
        doc.createdAt && new Date(doc.createdAt) <= toDate
      );
    }

    this.filteredDocuments = filtered;
    this.applySorting();
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
    this.filteredDocuments.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (this.sortBy) {
        case 'fileName':
          valueA = (a.fileName || '').toLowerCase();
          valueB = (b.fileName || '').toLowerCase();
          break;
        case 'userId':
          valueA = this.getUserName(a.userId).toLowerCase();
          valueB = this.getUserName(b.userId).toLowerCase();
          break;
        case 'dni':
          valueA = (a.dni || '').toLowerCase();
          valueB = (b.dni || '').toLowerCase();
          break;
        case 'signatureDate':
          valueA = new Date(a.signatureDate);
          valueB = new Date(b.signatureDate);
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt);
          valueB = new Date(b.createdAt);
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'documentSize':
          valueA = a.documentSize;
          valueB = b.documentSize;
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
    this.loadDocuments();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadDocuments();
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

  onViewDocument(document: SignedDocument) {
    this.signedDocumentsService.getDocumentById(document.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedDocument = response.data;
          this.showViewModal = true;
        } else {
          this.notificationService.error('Error', 'No se pudieron cargar los detalles del documento');
        }
      },
      error: (error) => {
        console.error('Error loading document details:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los detalles del documento');
      }
    });
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedDocument = null;
  }

  clearFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : `Usuario ID: ${userId}`;
  }

  getUserEmail(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.email : '';
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'FIRMADO': return 'Firmado';
      case 'VISADO': return 'Visado';
      case 'COMPLETADO': return 'Completado';
      case 'PENDIENTE': return 'Pendiente';
      case 'ERROR': return 'Error';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'FIRMADO': return 'badge-success';
      case 'VISADO': return 'badge-info';
      case 'COMPLETADO': return 'badge-success';
      case 'PENDIENTE': return 'badge-warning';
      case 'ERROR': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMaxItemsShown(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}