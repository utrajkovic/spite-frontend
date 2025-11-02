import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/models';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterModule]
})
export class RegisterPage {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.maxLength(30)]],
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const validLength = password.length >= 6 && password.length <= 50;

    if (!hasUpperCase || !hasNumber || !validLength) {
      return { passwordRules: true };
    }
    return null;
  }

  get password() {
    return this.registerForm.get('password')?.value || '';
  }

  get passwordStatus() {
    const pass = this.password;
    return {
      length: pass.length >= 6 && pass.length <= 50,
      upper: /[A-Z]/.test(pass),
      number: /\d/.test(pass)
    };
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  async register() {
    if (this.registerForm.invalid) {
      if (this.registerForm.get('confirmPassword')?.hasError('passwordMismatch')) {
        this.showAlert('Passwords do not match.');
      } else {
        this.showAlert('Please fill all fields correctly.');
      }
      return;
    }

    this.loading = true;
    const user: User = {
      username: this.registerForm.value.username,
      password: this.registerForm.value.password
    };

    this.auth.register(user).subscribe({
      next: () => {
        this.loading = false;
        this.showAlert('Registration successful! You can now log in.');
        this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: () => {
        this.loading = false;
        this.showAlert('Username already exists or an error occurred.');
      }
    });
  }

  async showAlert(msg: string) {
    const alert = await this.alertCtrl.create({
      header: 'Register',
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
