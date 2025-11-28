import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IonButton, IonContent, IonHeader, IonInput,
  IonItem, IonLabel, IonList, IonListHeader,
  IonTitle, IonToolbar, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  selector: 'app-tab-trainer',
  templateUrl: './tab-trainer.page.html',
  styleUrls: ['./tab-trainer.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton,
    IonList, IonListHeader, IonAlert
  ]

})
export class TabTrainerPage {
  trainerUsername = '';
  clientUsername = '';
  clients: { clientUsername: string }[] = [];
  baseUrl = 'https://spite-backend-v2.onrender.com/api/trainer';
  loading: HTMLIonLoadingElement | null = null;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { }

  ionViewWillEnter() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.trainerUsername = parsed.username;
      this.loadClients();
    }
  }

  async loadClients() {
    if (!this.trainerUsername) return;
    await this.showLoading('Učitavam klijente...');
    this.http.get<{ clientUsername: string }[]>(`${this.baseUrl}/clients/${this.trainerUsername}`)
      .subscribe({
        next: async (res) => {
          this.clients = res;
          await this.hideLoading();
        },
        error: async () => {
          await this.hideLoading();
          this.showAlert('❌ Greška pri učitavanju klijenata.');
        }
      });
  }

  async addClient() {
    const t = this.trainerUsername.trim();
    const c = this.clientUsername.trim();

    if (!t || !c) {
      this.showAlert('⚠️ Unesi korisničko ime klijenta.');
      return;
    }

    await this.showLoading('Dodajem klijenta...');
    this.http.post(`${this.baseUrl}/add-client?trainerUsername=${t}&clientUsername=${c}`, {})
      .subscribe({
        next: async () => {
          await this.hideLoading();
          this.showAlert(`✅ Klijent "${c}" uspešno dodat.`);
          this.clientUsername = '';
          this.loadClients();
        },
        error: async (err) => {
          await this.hideLoading();
          this.showAlert(err?.error || '❌ Greška pri dodavanju klijenta.');
        }
      });
  }

  async removeClient(username: string) {
    const t = this.trainerUsername.trim();
    await this.showLoading('Uklanjam klijenta...');
    this.http.delete(`${this.baseUrl}/remove-client?trainerUsername=${t}&clientUsername=${username}`)
      .subscribe({
        next: async () => {
          await this.hideLoading();
          this.showAlert(`🗑️ Klijent "${username}" je uklonjen.`);
          this.loadClients();
        },
        error: async (err) => {
          await this.hideLoading();
          this.showAlert(err?.error || '❌ Greška pri uklanjanju klijenta.');
        }
      });
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Obaveštenje',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showLoading(message: string = 'Molimo sačekajte...') {
    this.loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      backdropDismiss: false,
      cssClass: 'custom-loading'
    });
    await this.loading.present();
  }

  async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
