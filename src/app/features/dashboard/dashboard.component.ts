import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';

interface FirmanteStats {
  totalFirmantes: number;
  activeFirmantes: number;
  pendingFirmantes: number;
}

interface CertificateStats {
  totalCertificates: number;
  validCertificates: number;
  invalidCertificates: number;
}

interface DocumentStats {
  totalDocuments: number;
  signedDocuments: number;
  visadoDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
}

interface DashboardStats {
  firmantes: FirmanteStats;
  certificates: CertificateStats;
  documents: DocumentStats;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly API_URL = 'https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe';
  
  stats: DashboardStats = {
    firmantes: { totalFirmantes: 0, activeFirmantes: 0, pendingFirmantes: 0 },
    certificates: { totalCertificates: 0, validCertificates: 0, invalidCertificates: 0 },
    documents: { totalDocuments: 0, signedDocuments: 0, visadoDocuments: 0, completedDocuments: 0, pendingDocuments: 0 }
  };
  
  isLoading = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async loadDashboardStats() {
    try {
      this.isLoading = true;
      this.error = null;

      const headers = this.getAuthHeaders();

      // Cargar estadísticas en paralelo
      const [firmanteStats, certificateStats, documentStats] = await Promise.all([
        this.http.get<any>(`${this.API_URL}/auth/api/v1/admin/gestion/firmantes-stats`, { headers }).toPromise(),
        this.http.get<any>(`${this.API_URL}/certificates/api/v1/stats`, { headers }).toPromise(),
        this.http.get<any>(`${this.API_URL}/signatures/api/v1/admin/stats`, { headers }).toPromise()
      ]);

      // Asignar datos o valores por defecto
      this.stats = {
        firmantes: firmanteStats?.data || { totalFirmantes: 0, activeFirmantes: 0, pendingFirmantes: 0 },
        certificates: certificateStats?.data || { totalCertificates: 0, validCertificates: 0, invalidCertificates: 0 },
        documents: documentStats?.data || { totalDocuments: 0, signedDocuments: 0, visadoDocuments: 0, completedDocuments: 0, pendingDocuments: 0 }
      };

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      this.error = 'Error al cargar las estadísticas';
      
      // Datos de respaldo para demo
      this.stats = {
        firmantes: { totalFirmantes: 25, activeFirmantes: 20, pendingFirmantes: 5 },
        certificates: { totalCertificates: 45, validCertificates: 40, invalidCertificates: 5 },
        documents: { totalDocuments: 120, signedDocuments: 85, visadoDocuments: 35, completedDocuments: 115, pendingDocuments: 5 }
      };
    } finally {
      this.isLoading = false;
    }
  }

  getSuccessRate(): number {
    const total = this.stats.documents.totalDocuments;
    const completed = this.stats.documents.completedDocuments;
    return total > 0 ? Math.round((completed / total) * 100) : 100;
  }

  getCertificateHealthRate(): number {
    const total = this.stats.certificates.totalCertificates;
    const valid = this.stats.certificates.validCertificates;
    return total > 0 ? Math.round((valid / total) * 100) : 100;
  }

  getUserActiveRate(): number {
    const total = this.stats.firmantes.totalFirmantes;
    const active = this.stats.firmantes.activeFirmantes;
    return total > 0 ? Math.round((active / total) * 100) : 100;
  }

  refreshStats() {
    this.loadDashboardStats();
  }
}