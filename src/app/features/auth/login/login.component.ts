import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginType: 'admin' | 'firmante' = 'admin';
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit() {
    this.authService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      rememberMe: [false]
    });
  }

  switchLoginType(type: 'admin' | 'firmante') {
    this.loginType = type;
    this.error = null;
    this.loginForm.reset();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.error = null;
    this.isLoading = true;

    if (this.loginType === 'admin') {
      const { email, password } = this.loginForm.value;
      this.authService.loginAdmin(email, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.error = error.message || 'Error al iniciar sesión';
          this.isLoading = false;
        }
      });
    } else {
      const { dni, pin } = this.loginForm.value;
      this.authService.loginFirmante(dni, pin).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.error = error.userMessage || 'Error al iniciar sesión';
          this.isLoading = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'dni') {
          return 'DNI debe tener exactamente 8 dígitos';
        }
        if (fieldName === 'pin') {
          return 'PIN debe tener exactamente 6 dígitos';
        }
      }
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}