import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-firmante-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './firmante-login.component.html',
  styleUrls: ['./firmante-login.component.css']
})
export class FirmanteLoginComponent implements OnInit {
  verifyForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  activationToken: string = '';
  showSuccessModal = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.verifyForm = this.createForm();
  }

  ngOnInit() {
    this.authService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    // Obtener el token de activación completo de la URL (incluyendo caracteres especiales)
    const url = this.route.snapshot.url.map(segment => segment.path).join('/');
    this.activationToken = url.replace('firmante/verify/', '') || '';
    if (!this.activationToken) {
      this.error = 'Token de activación no válido';
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/), Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onSubmit() {
    if (this.verifyForm.invalid || !this.activationToken) {
      this.markFormGroupTouched(this.verifyForm);
      return;
    }

    this.error = null;
    const { pin } = this.verifyForm.value;
    
    this.authService.activateFirmante(this.activationToken, pin).subscribe({
      next: (response) => {
        // Mostrar modal de éxito con mensaje del response por 3 segundos
        this.successMessage = response.message || 'PIN registrado exitosamente';
        this.showSuccessModal = true;
        setTimeout(() => {
          this.showSuccessModal = false;
          window.location.reload();
        }, 3000);
      },
      error: (error) => {
        this.error = error.error?.message || error.message || 'Error al registrar PIN';
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.verifyForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['pattern']) {
        return 'El PIN debe tener exactamente 6 dígitos numéricos';
      }
      if (field.errors['minlength'] || field.errors['maxlength']) {
        return 'El PIN debe tener exactamente 6 dígitos';
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.verifyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}