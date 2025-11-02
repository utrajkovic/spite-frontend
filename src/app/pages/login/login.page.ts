import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonLabel, IonInput, IonButton
} from '@ionic/angular/standalone';
import { BackendService } from 'src/app/services/backend.service';
import { AlertController } from '@ionic/angular';



@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    RouterModule
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  readonly backendUrl = 'https://dead-jade-spite-11d3e918.koyeb.app/api/users/login';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private backendService: BackendService,
    private alertCtrl: AlertController
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
      const user: any = await this.http.post(this.backendUrl, credentials).toPromise();

      await Preferences.set({
        key: 'user',
        value: JSON.stringify(user)
      });

      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });

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
