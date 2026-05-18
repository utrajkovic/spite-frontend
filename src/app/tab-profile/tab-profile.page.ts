import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonList,
  IonBadge, AlertController
} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Preferences } from '@capacitor/preferences';
import { PageLoadingOverlayComponent } from '../page-loading-overlay/page-loading-overlay.component';
import { BadgeService } from '../services/badge.service';
import { NotificationService } from '../services/notification.service';
import { PRService, ExercisePR } from '../services/pr.service';
import { PRListModal } from '../modals/pr-list.modal';
import { WorkoutCalendarModal } from '../modals/workout-calendar.modal';
import { ModalController } from '@ionic/angular';
import { ThemeService, Theme } from '../services/theme.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab-profile',
  templateUrl: './tab-profile.page.html',
  styleUrls: ['./tab-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonButton, IonList,
    IonBadge,
    PageLoadingOverlayComponent,
    WorkoutCalendarModal
  ],
  providers: [ModalController]
})
export class TabProfilePage implements OnInit, OnDestroy {

  user: any = null;
  feedbackHistory: any[] = [];
  completedWorkouts: any[] = [];
  pendingInvites: any[] = [];
  pendingShares: any[] = [];
  loading = true;
  prs: ExercisePR[] = [];
  trainerName: string = '';
  memberSince: string = '';

  installPrompt: any = null;
  isIos = false;
  isInstalled = false;
  notificationsEnabled = false;
  notificationsSupported = 'Notification' in window;
  pendingInviteActions = new Set<string>();
  pendingShareActions = new Set<string>();
  clearHistoryLoading = false;

  private readonly backendUrl = 'https://spite-backend-v2.onrender.com/api';

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private badgeService: BadgeService,
    private notificationService: NotificationService,
    private prService: PRService,
    private modalCtrl: ModalController,
    private router: Router,
    public themeService: ThemeService,
    private http: HttpClient
  ) {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
    });
    this.isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if ('Notification' in window) {
      this.notificationsEnabled = Notification.permission === 'granted';
    }
  }

  async ngOnInit() {
    const stored = await Preferences.get({ key: 'user' });
    this.user = stored.value ? JSON.parse(stored.value) : null;
    if (this.user) {
      this.memberSince = this.extractMemberSince(this.user.id);
      this.loadData();
      this.loadTrainerName();
    }
  }

  async ionViewWillEnter() {
    if (this.user) {
      this.badgeService.checkNow();
      this.loadData();
      this.loadTrainerName();
    }
  }

  ngOnDestroy() {}

  /** Extract approximate registration date from MongoDB ObjectId */
  private extractMemberSince(id: string): string {
    try {
      const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  /** Try to find trainer name from assigned workouts endpoint */
  loadTrainerName() {
    // Use the client workouts endpoint — if workouts are assigned, there's a trainer
    this.http.get<any[]>(`${this.backendUrl}/workouts/client/${this.user.username}`).subscribe({
      next: (workouts) => {
        if (workouts && workouts.length > 0 && workouts[0].note) {
          // Notes often contain trainer context, but we need direct link
        }
      },
      error: () => {}
    });

    // Check accepted invites via pending (already accepted ones show in trainer links)
    // Best approach: check if there are accepted invites by looking at existing data
    this.backend.getPendingInvites(this.user.username).subscribe({
      next: (invites) => {
        // Pending invites have trainerUsername — but these are NOT yet accepted
        // We need accepted trainers. Let's use a workaround:
        // If user has assigned workouts, they have a trainer
      },
      error: () => {}
    });

    // Fallback: try to read from localStorage if old app stored it
    const storedTrainer = localStorage.getItem('trainerUsername');
    if (storedTrainer) {
      this.trainerName = storedTrainer;
      return;
    }

    // Last resort: check assigned workouts — if they exist, get trainer from client workout links
    this.http.get<any[]>(`${this.backendUrl}/workouts/client/${this.user.username}`).subscribe({
      next: (workouts) => {
        if (workouts && workouts.length > 0) {
          // User has assigned workouts = has a trainer, but we can't get name from here
          // We'll show "Has trainer" or try trainer-client-links
          this.trainerName = 'Linked';
        }
      },
      error: () => {}
    });
  }

  loadData() {
    this.loading = true;

    this.backend.getFeedbackForUser(this.user.username).subscribe({
      next: (data) => {
        this.feedbackHistory = data.sort((a: any, b: any) => b.timestamp - a.timestamp);
        this.prs = this.prService.compute(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.backend.getCompletedWorkouts(this.user.username).subscribe({
      next: (data) => { this.completedWorkouts = data; },
      error: () => {}
    });

    this.backend.getPendingInvites(this.user.username).subscribe({
      next: (data) => {
        this.pendingInvites = data;
        this.badgeService.markInvitesSeen([
          ...this.pendingInvites.map((i: any) => i.id),
          ...this.pendingShares.map((s: any) => s.id)
        ]);
      },
      error: () => {}
    });

    this.backend.getPendingShares(this.user.username).subscribe({
      next: (data) => {
        this.pendingShares = data;
        this.badgeService.markInvitesSeen([
          ...this.pendingInvites.map((i: any) => i.id),
          ...this.pendingShares.map((s: any) => s.id)
        ]);
      },
      error: () => {}
    });
  }

  async acceptShare(share: any) {
    if (!share?.id || this.pendingShareActions.has(share.id)) return;
    this.pendingShareActions.add(share.id);
    this.backend.acceptShare(share.id).subscribe({
      next: () => {
        this.pendingShareActions.delete(share.id);
        this.pendingShares = this.pendingShares.filter((s: any) => s.id !== share.id);
        this.showAlert(`Accepted share from "${share.fromUsername}".`);
      },
      error: () => {
        this.pendingShareActions.delete(share.id);
        this.showAlert('Error accepting share.');
      }
    });
  }

  async declineShare(share: any) {
    if (!share?.id || this.pendingShareActions.has(share.id)) return;
    this.pendingShareActions.add(share.id);
    this.backend.declineShare(share.id).subscribe({
      next: () => {
        this.pendingShareActions.delete(share.id);
        this.pendingShares = this.pendingShares.filter((s: any) => s.id !== share.id);
      },
      error: () => {
        this.pendingShareActions.delete(share.id);
        this.showAlert('Error declining share.');
      }
    });
  }

  async acceptInvite(invite: any) {
    if (!invite?.id || this.pendingInviteActions.has(invite.id)) return;
    this.pendingInviteActions.add(invite.id);
    this.backend.acceptInvite(invite.id).subscribe({
      next: () => {
        this.pendingInviteActions.delete(invite.id);
        this.pendingInvites = this.pendingInvites.filter((i: any) => i.id !== invite.id);
        this.trainerName = invite.trainerUsername;
        localStorage.setItem('trainerUsername', invite.trainerUsername);
        this.showAlert(`Accepted invite from trainer "${invite.trainerUsername}".`);
      },
      error: () => {
        this.pendingInviteActions.delete(invite.id);
        this.showAlert('Error accepting invite.');
      }
    });
  }

  async declineInvite(invite: any) {
    if (!invite?.id || this.pendingInviteActions.has(invite.id)) return;
    this.pendingInviteActions.add(invite.id);
    this.backend.declineInvite(invite.id).subscribe({
      next: () => {
        this.pendingInviteActions.delete(invite.id);
        this.pendingInvites = this.pendingInvites.filter((i: any) => i.id !== invite.id);
      },
      error: () => {
        this.pendingInviteActions.delete(invite.id);
        this.showAlert('Error declining invite.');
      }
    });
  }

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({ message: msg, buttons: ['OK'], cssClass: 'custom-alert' });
    await a.present();
  }

  async installApp() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      if (outcome === 'accepted') { this.installPrompt = null; this.isInstalled = true; }
    }
  }

  async showIosInstallGuide() {
    const a = await this.alertCtrl.create({
      header: 'Add to Home Screen',
      message: '1. Tap the Share button ⎙ at the bottom of Safari\n\n2. Scroll down and tap "Add to Home Screen"\n\n3. Tap Add',
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await a.present();
  }

  async enableNotifications() {
    if (!this.user) return;
    await this.notificationService.init(this.user.username);
    this.notificationsEnabled = Notification.permission === 'granted';
    if (this.notificationsEnabled) this.showAlert('Notifications enabled.');
  }

  setTheme(theme: Theme) {
    this.themeService.apply(theme);
  }

  async openPRList() {
    const modal = await this.modalCtrl.create({
      component: PRListModal,
      componentProps: { prs: this.prs },
      cssClass: 'pr-list-wrapper'
    });
    await modal.present();
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          role: 'confirm',
          handler: async () => {
            this.badgeService.stop();
            await Preferences.remove({ key: 'user' });
            await Preferences.remove({ key: 'authToken' });
            localStorage.removeItem('authToken');
            localStorage.removeItem('trainerUsername');
            await this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async clearHistory() {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Clear All Data',
      message: 'This will <strong>permanently delete</strong> all your workout history, feedback and personal records. This action cannot be undone.',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes, delete everything',
          cssClass: 'alert-button-danger',
          handler: () => {
            this.clearHistoryLoading = true;
            this.backend.clearFeedbackHistory(this.user.username).subscribe({
              next: () => {
                this.clearHistoryLoading = false;
                this.feedbackHistory = [];
                this.completedWorkouts = [];
                this.prs = [];
                this.showAlert('All history and records cleared.');
              },
              error: () => {
                this.clearHistoryLoading = false;
                this.showAlert('Error clearing history.');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}