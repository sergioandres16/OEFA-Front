import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit {
  activateForm: FormGroup;
  activationToken: string | null = null;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.activateForm = this.createForm();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.activationToken = params['token'];
      if (!this.activationToken) {
        this.error = 'Token de activación no válido';
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      confirmPin: ['', [Validators.required]]
    }, { validators: this.pinMatchValidator });
  }

  pinMatchValidator(form: FormGroup) {
    const pin = form.get('pin');
    const confirmPin = form.get('confirmPin');
    
    if (pin && confirmPin && pin.value !== confirmPin.value) {
      confirmPin.setErrors({ mismatch: true });
    } else if (confirmPin?.errors?.['mismatch']) {
      delete confirmPin.errors['mismatch'];
      if (Object.keys(confirmPin.errors).length === 0) {
        confirmPin.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit() {
    if (this.activateForm.invalid || !this.activationToken) {
      this.markFormGroupTouched(this.activateForm);
      return;
    }

    this.error = null;
    this.success = null;
    this.isLoading = true;

    const { pin } = this.activateForm.value;
    
    // Simulación de activación para desarrollo
    // TODO: Descomentar cuando esté la API real
    setTimeout(() => {
      this.success = 'Cuenta activada exitosamente. Ya puedes iniciar sesión.';
      this.isLoading = false;
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 1000);

    // Implementación real (comentada)
    // this.authService.activateFirmante(this.activationToken, pin).subscribe({
    //   next: (response) => {
    //     this.success = 'Cuenta activada exitosamente. Ya puedes iniciar sesión.';
    //     this.isLoading = false;
    //     
    //     setTimeout(() => {
    //       this.router.navigate(['/login']);
    //     }, 2000);
    //   },
    //   error: (error) => {
    //     this.error = error.userMessage || 'Error al activar la cuenta';
    //     this.isLoading = false;
    //   }
    // });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.activateForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['pattern']) {
        return 'El PIN debe tener exactamente 6 dígitos';
      }
      if (field.errors['mismatch']) {
        return 'Los PINs no coinciden';
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.activateForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}