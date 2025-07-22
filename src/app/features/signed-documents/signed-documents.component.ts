import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SignedDocumentsService, SignedDocument, SignedDocumentListParams } from '../../core/services/signed-documents.service';

@Component({
  selector: 'app-signed-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './signed-documents.component.html',
  styleUrls: ['./signed-documents.component.css']
})
export class SignedDocumentsComponent implements OnInit {
  documents: SignedDocument[] = [];
  filteredDocuments: SignedDocument[] = [];
  filterForm: FormGroup;
  isLoading = false;
  selectedDocuments: number[] = [];
  showDeleteModal = false;
  documentToDelete: SignedDocument | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(
    private fb: FormBuilder,
    private signedDocumentsService: SignedDocumentsService
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.loadDocuments();
    this.setupFilterSubscription();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      documentType: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
      signer: ['']
    });
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadDocuments() {
    this.isLoading = true;
    
    const params: SignedDocumentListParams = {
      search: this.filterForm.get('search')?.value || '',
      documentType: this.filterForm.get('documentType')?.value || '',
      status: this.filterForm.get('status')?.value || '',
      signerName: this.filterForm.get('signer')?.value || '',
      dateFrom: this.filterForm.get('dateFrom')?.value || '',
      dateTo: this.filterForm.get('dateTo')?.value || '',
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'signatureDate',
      sortDir: 'desc'
    };

    this.signedDocumentsService.getSignedDocuments(params).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.totalItems = documents.length;
        this.calculatePagination();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading signed documents:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    let filtered = [...this.documents];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentName.toLowerCase().includes(searchTerm) ||
        doc.signerName.toLowerCase().includes(searchTerm) ||
        doc.signerEmail.toLowerCase().includes(searchTerm)
      );
    }

    // Document type filter
    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }

    // Signer filter
    if (filters.signer) {
      const signerTerm = filters.signer.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.signerName.toLowerCase().includes(signerTerm)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => 
        new Date(doc.signatureDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(doc => 
        new Date(doc.signatureDate) <= new Date(filters.dateTo)
      );
    }

    this.filteredDocuments = filtered;
    this.totalItems = filtered.length;
    this.calculatePagination();
    this.currentPage = 1;
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  getPaginatedDocuments(): SignedDocument[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredDocuments.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleDocumentSelection(documentId: number) {
    const index = this.selectedDocuments.indexOf(documentId);
    if (index > -1) {
      this.selectedDocuments.splice(index, 1);
    } else {
      this.selectedDocuments.push(documentId);
    }
  }

  selectAllDocuments() {
    const currentPageDocs = this.getPaginatedDocuments();
    const allSelected = currentPageDocs.every(doc => 
      this.selectedDocuments.includes(doc.id)
    );

    if (allSelected) {
      // Deselect all current page documents
      currentPageDocs.forEach(doc => {
        const index = this.selectedDocuments.indexOf(doc.id);
        if (index > -1) {
          this.selectedDocuments.splice(index, 1);
        }
      });
    } else {
      // Select all current page documents
      currentPageDocs.forEach(doc => {
        if (!this.selectedDocuments.includes(doc.id)) {
          this.selectedDocuments.push(doc.id);
        }
      });
    }
  }

  isDocumentSelected(documentId: number): boolean {
    return this.selectedDocuments.includes(documentId);
  }

  areAllCurrentPageSelected(): boolean {
    const currentPageDocs = this.getPaginatedDocuments();
    return currentPageDocs.length > 0 && 
           currentPageDocs.every(doc => this.selectedDocuments.includes(doc.id));
  }

  confirmDeleteDocument(document: SignedDocument) {
    this.documentToDelete = document;
    this.showDeleteModal = true;
  }

  confirmDeleteSelected() {
    if (this.selectedDocuments.length === 0) return;
    
    // For multiple deletions, we'll use a different approach
    this.showDeleteModal = true;
    this.documentToDelete = null; // Indicates bulk delete
  }

  deleteDocument() {
    if (this.documentToDelete) {
      // Delete single document
      this.signedDocumentsService.deleteSignedDocumentMock(this.documentToDelete.id).subscribe({
        next: (response) => {
          alert('Documento eliminado exitosamente');
          this.showDeleteModal = false;
          this.documentToDelete = null;
          this.loadDocuments();
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          alert('Error al eliminar el documento');
        }
      });
    } else {
      // Delete selected documents
      this.signedDocumentsService.bulkDeleteSignedDocumentsMock(this.selectedDocuments).subscribe({
        next: (response) => {
          alert(response.message);
          this.selectedDocuments = [];
          this.showDeleteModal = false;
          this.loadDocuments();
        },
        error: (error) => {
          console.error('Error deleting documents:', error);
          alert('Error al eliminar los documentos');
        }
      });
    }
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.documentToDelete = null;
  }

  downloadDocument(document: SignedDocument) {
    // Mock download - replace with actual implementation
    console.log('Downloading document:', document.documentName);
    // In real implementation, you would call an API to get download URL
    alert(`Descargando: ${document.documentName}`);
  }

  clearFilters() {
    this.filterForm.reset();
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'VALID': return 'Válido';
      case 'INVALID': return 'Inválido';
      case 'EXPIRED': return 'Expirado';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VALID': return 'badge-success';
      case 'INVALID': return 'badge-danger';
      case 'EXPIRED': return 'badge-warning';
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

  exportDocuments() {
    // Mock export functionality
    const exportData = this.selectedDocuments.length > 0 
      ? this.documents.filter(doc => this.selectedDocuments.includes(doc.id))
      : this.filteredDocuments;
    
    console.log('Exporting documents:', exportData);
    alert(`Exportando ${exportData.length} documentos...`);
  }
}