import { Component, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IonButton, IonContent, IonInput,
  AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";
import { BackendService } from '../services/backend.service';
import { PriorityClient } from '../services/models';

@Component({
  selector: 'app-tab-trainer',
  templateUrl: './tab-trainer.page.html',
  styleUrls: ['./tab-trainer.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent,
    IonInput, IonButton,
    PageLoadingOverlayComponent
]
})
export class TabTrainerPage {
  
  trainerUsername = '';
  clientUsername = '';
  clients: { clientUsername: string }[] = [];
  priorityClients: PriorityClient[] = [];

  baseUrl = 'https://spite-backend-v2.onrender.com/api/trainer';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private zone: NgZone,
    private backend: BackendService
  ) {}

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

    this.isLoading = true;

    this.http.get<{ clientUsername: string }[]>(
      `${this.baseUrl}/clients/${this.trainerUsername}`
    ).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.clients = res;
          this.loadPriorities();
          this.isLoading = false;
        });
      },
      error: () => {
        this.isLoading = false;
        this.showAlert('❌ Greška pri učitavanju klijenata.');
      }
    });
  }

  loadPriorities() {
    if (!this.trainerUsername) return;
    this.backend.getTrainerInbox(this.trainerUsername).subscribe({
      next: (res) => {
        this.priorityClients = (res.priorityClients || []).slice(0, 5);
      },
      error: () => {
        this.priorityClients = [];
      }
    });
  }

  sendLateReminders() {
    if (!this.trainerUsername) return;
    this.backend.sendBulkLateReminders(this.trainerUsername).subscribe({
      next: (msg) => this.showAlert(msg || 'Reminders sent.'),
      error: () => this.showAlert('❌ Failed to send reminders.')
    });
  }

  async addClient() {
    const t = this.trainerUsername.trim();
    const c = this.clientUsername.trim();

    if (!t || !c) {
      this.showAlert('⚠️ Unesi korisničko ime klijenta.');
      return;
    }

    this.isLoading = true;

    this.http.post(
      `${this.baseUrl}/invite?trainerUsername=${t}&clientUsername=${c}`,
      {},
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert(`Pozivnica je poslata korisniku "${c}".`);
        this.clientUsername = '';
      },
      error: (err) => {
        this.isLoading = false;
        const msg =
          (typeof err?.error === 'string' && err.error) ||
          err?.error?.message ||
          '❌ Greška pri slanju pozivnice.';
        this.showAlert(msg);
      }
    });
  }

  goToClient(username: string) {
    window.location.href = `/trainer-client/${username}`;
  }

  async removeClient(username: string) {
    const t = this.trainerUsername.trim();

    this.isLoading = true;

    this.http.delete(
      `${this.baseUrl}/remove-client?trainerUsername=${t}&clientUsername=${username}`,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => {
        this.isLoading = false;

        this.zone.run(() => {
          this.clients = this.clients.filter(
            c => c.clientUsername !== username
          );
        });

        this.showAlert(`Klijent "${username}" je uklonjen.`);
      },
      error: () => {
        this.isLoading = false;
        this.showAlert('❌ Greška pri uklanjanju klijenta.');
      }
    });
  }

  async confirmRemoveClient(username: string) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Client',
      message: `Are you sure you want to remove "${username}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'confirm',
          cssClass: 'alert-confirm',
          handler: () => this.removeClient(username)
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
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
}
