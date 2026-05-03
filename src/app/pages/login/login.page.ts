import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonInput, IonButton
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { NotificationService } from 'src/app/services/notification.service';



@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonButton,
    RouterModule
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  readonly backendUrl = 'https://spite-backend-v2.onrender.com/api/users/login';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      this.showAlert('Please fill in all fields.');
      return;
    }

    const credentials = this.loginForm.value;

    try {
      const response: any = await this.http.post(this.backendUrl, credentials).toPromise();
      const user = response?.user ?? response;
      const token = response?.token ?? null;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('username', user.username);
      localStorage.setItem('role', user.role);
      if (token) {
        localStorage.setItem('authToken', token);
      }
      
      await Preferences.set({
        key: 'user',
        value: JSON.stringify(user)
      });
      if (token) {
        await Preferences.set({ key: 'authToken', value: token });
      }

      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      // Inicijalizuj notifikacije u pozadini
      this.notificationService.init(user.username).catch(e => console.warn('Notifications init failed', e));

    } catch (error) {
      console.error('Login error:', error);
      this.showAlert('Invalid username or password.');
    }
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
