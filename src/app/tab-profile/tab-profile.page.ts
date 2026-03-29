import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonList, IonListHeader,
  IonBadge, IonSpinner, AlertController
} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Preferences } from '@capacitor/preferences';
import { PageLoadingOverlayComponent } from '../page-loading-overlay/page-loading-overlay.component';
import { BadgeService } from '../services/badge.service';

@Component({
  selector: 'app-tab-profile',
  templateUrl: './tab-profile.page.html',
  styleUrls: ['./tab-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonButton, IonList, IonListHeader,
    IonBadge, IonSpinner,
    PageLoadingOverlayComponent
  ]
})
export class TabProfilePage implements OnInit {

  user: any = null;
  feedbackHistory: any[] = [];
  pendingInvites: any[] = [];
  loading = true;

  // PWA install
  installPrompt: any = null;
  isIos = false;
  isInstalled = false;

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private badgeService: BadgeService
  ) {
    // Uhvati beforeinstallprompt (Android/Desktop Chrome)
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
    });

    // Detektuj iOS
    this.isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

    // Detektuj da li je već instaliran (standalone mode)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
  }

  async ngOnInit() {
    const stored = await Preferences.get({ key: 'user' });
    this.user = stored.value ? JSON.parse(stored.value) : null;
    if (this.user) {
      this.loadData();
    }
  }

  async ionViewWillEnter() {
    if (this.user) {
      this.loadData();
      // Označi invites kao viđene - briše badge
      this.badgeService.markInvitesSeen(this.pendingInvites.map(i => i.id));
    }
  }

  loadData() {
    this.loading = true;

    this.backend.getFeedbackForUser(this.user.username).subscribe({
      next: (data) => {
        this.feedbackHistory = data.sort((a, b) => b.timestamp - a.timestamp);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.backend.getPendingInvites(this.user.username).subscribe({
      next: (data) => { this.pendingInvites = data; },
      error: () => {}
    });
  }

  async acceptInvite(invite: any) {
    this.backend.acceptInvite(invite.id).subscribe({
      next: () => {
        this.pendingInvites = this.pendingInvites.filter(i => i.id !== invite.id);
        this.showAlert(`Prihvatio si pozivnicu od trenera "${invite.trainerUsername}".`);
      },
      error: () => this.showAlert('Greška pri prihvatanju pozivnice.')
    });
  }

  async declineInvite(invite: any) {
    this.backend.declineInvite(invite.id).subscribe({
      next: () => {
        this.pendingInvites = this.pendingInvites.filter(i => i.id !== invite.id);
      },
      error: () => this.showAlert('Greška pri odbijanju pozivnice.')
    });
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('sr-RS', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  avgIntensity(fb: any): string {
    if (!fb.exercises?.length) return '-';
    const map: any = { easy: 1, normal: 2, hard: 3 };
    const avg = fb.exercises.reduce((s: number, e: any) => s + (map[e.intensity] || 2), 0) / fb.exercises.length;
    if (avg < 1.5) return 'Easy';
    if (avg < 2.5) return 'Normal';
    return 'Hard';
  }

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg, buttons: ['OK'], cssClass: 'custom-alert'
    });
    await a.present();
  }

  async installApp() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      if (outcome === 'accepted') {
        this.installPrompt = null;
        this.isInstalled = true;
      }
    }
  }

  async showIosInstallGuide() {
    const a = await this.alertCtrl.create({
      header: 'Add to Home Screen',
      message: `1. Tap the Share button <strong>⎙</strong> at the bottom of Safari<br><br>2. Scroll down and tap <strong>"Add to Home Screen"</strong><br><br>3. Tap <strong>Add</strong>`,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await a.present();
  }
}
