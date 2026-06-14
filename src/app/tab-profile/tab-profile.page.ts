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
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { AvatarService } from '../shared/avatar/avatar.service';
import { PwaInstallService } from '../services/pwa-install.service';

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
    WorkoutCalendarModal,
    AvatarComponent
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
  assignedWorkoutsCount: number = 0;
  cardIndex = 0;
  cardTitles = ['Workout Calendar', 'Trainer Zone'];
  mealPlan: any = null;

  accountEmail: string | null = null;
  emailVerified = false;
  newEmail = '';
  emailBusy = false;
  scheduledSessions: any[] = [];
  scheduleGroups: any[] = [];

  // Workout reminders (CLIENT)
  clientReminderEnabled = false;
  clientReminderMode: 'SESSIONS' | 'CUSTOM' = 'SESSIONS';
  clientReminderTime = '07:00';
  customReminders: { days: number[]; time: string; note: string }[] = [];
  reminderBusy = false;
  weekDays = [
    { v: 1, l: 'Mon' }, { v: 2, l: 'Tue' }, { v: 3, l: 'Wed' },
    { v: 4, l: 'Thu' }, { v: 5, l: 'Fri' }, { v: 6, l: 'Sat' }, { v: 7, l: 'Sun' }
  ];
  completionRate: number = 0;
  lastWorkoutDate: string = '';

  installPrompt: any = null;
  isIos = false;
  isAndroid = false;
  isInstalled = false;
  notificationsEnabled = false;
  notificationsSupported = 'Notification' in window;
  pendingInviteActions = new Set<string>();
  pendingShareActions = new Set<string>();
  clearHistoryLoading = false;
  inactiveClients: any[] = [];
  

  private readonly backendUrl = 'https://spite-backend.fly.dev/api';

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private badgeService: BadgeService,
    private notificationService: NotificationService,
    private prService: PRService,
    private modalCtrl: ModalController,
    private router: Router,
    public themeService: ThemeService,
    private http: HttpClient,
    private avatarService: AvatarService,
    public pwa: PwaInstallService
  ) {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
    });
    this.isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    this.isAndroid = /android/.test(navigator.userAgent.toLowerCase());
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
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
      this.cardTitles = this.user.role === 'TRAINER'
        ? ['Workout Calendar', "Today's Tasks"]
        : ['Workout Calendar', 'Trainer Zone', 'Meal Plan', "Today's Tasks"];
      this.loadData();
      this.loadTrainerName();
      this.loadMealPlan();
      this.loadAccount();
      this.loadSchedule();
    }
  }

  async ionViewWillEnter() {
    if (this.user) {
      this.badgeService.checkNow();
      this.loadData();
      this.loadTrainerName();
      this.loadMealPlan();
      this.loadAccount();
      this.loadSchedule();
    }
  }

  loadAccount() {
    this.http.get<any>(`${this.backendUrl}/users/username/${this.user.username}`).subscribe({
      next: (u) => {
        this.accountEmail = u?.email ?? null;
        this.emailVerified = !!u?.emailVerified;
        this.clientReminderEnabled = !!u?.clientReminderEnabled;
        this.clientReminderMode = u?.clientReminderMode === 'CUSTOM' ? 'CUSTOM' : 'SESSIONS';
        if (u?.clientReminderTime) this.clientReminderTime = u.clientReminderTime;
        this.customReminders = Array.isArray(u?.customReminders)
          ? u.customReminders.map((r: any) => ({
              days: Array.isArray(r.days) ? r.days : [],
              time: r.time || '07:00',
              note: r.note || ''
            }))
          : [];
      },
      error: () => {}
    });
  }

  // ── Workout reminders (CLIENT) ──
  toggleClientReminder() {
    this.clientReminderEnabled = !this.clientReminderEnabled;
    this.saveClientReminder();
  }

  setReminderMode(mode: 'SESSIONS' | 'CUSTOM') {
    this.clientReminderMode = mode;
  }

  isReminderDayOn(r: { days: number[] }, day: number): boolean {
    return r.days.includes(day);
  }

  toggleReminderDay(r: { days: number[] }, day: number) {
    const i = r.days.indexOf(day);
    if (i >= 0) r.days.splice(i, 1);
    else r.days.push(day);
  }

  addCustomReminder() {
    this.customReminders.push({ days: [], time: '07:00', note: '' });
  }

  removeCustomReminder(i: number) {
    this.customReminders.splice(i, 1);
  }

  saveClientReminder() {
    this.reminderBusy = true;
    const payload = {
      enabled: this.clientReminderEnabled,
      mode: this.clientReminderMode,
      time: this.clientReminderTime,
      customReminders: this.customReminders.filter(r => r.days.length > 0)
    };
    this.http.put(
      `${this.backendUrl}/users/client-reminder?username=${this.user.username}`,
      payload, { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => {
        this.reminderBusy = false;
        this.showAlert('Reminder settings saved.');
      },
      error: () => { this.reminderBusy = false; this.showAlert('Error saving reminder settings.'); }
    });
  }

  saveEmail() {
    const email = (this.newEmail || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.showAlert('Enter a valid email address.');
      return;
    }
    this.emailBusy = true;
    this.http.put(
      `${this.backendUrl}/users/email?username=${this.user.username}&email=${encodeURIComponent(email)}`,
      {}, { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => {
        this.emailBusy = false;
        this.accountEmail = email;
        this.emailVerified = false;
        this.newEmail = '';
        this.showAlert('Verification email sent. Check your inbox.');
      },
      error: () => { this.emailBusy = false; this.showAlert('Error saving email.'); }
    });
  }

  resendVerification() {
    this.emailBusy = true;
    this.http.post(
      `${this.backendUrl}/users/email/resend?username=${this.user.username}`,
      {}, { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => { this.emailBusy = false; this.showAlert('Verification email sent.'); },
      error: () => { this.emailBusy = false; this.showAlert('Error sending email.'); }
    });
  }

  loadSchedule() {
    const url = this.user.role === 'TRAINER'
      ? `${this.backendUrl}/sessions/trainer/${this.user.username}`
      : `${this.backendUrl}/sessions/client/${this.user.username}`;
    this.http.get<any[]>(url).subscribe({
      next: (list) => { this.scheduledSessions = list || []; this.computeScheduleGroups(); },
      error: () => { this.scheduledSessions = []; this.computeScheduleGroups(); }
    });
  }

  // Termini grupisani po vremenu (isti termin = jedan bubble), bez prošlih.
  // Računa se jednom po učitavanju (NE getter) da ne gradi Map na svaki CD ciklus.
  private computeScheduleGroups() {
    const now = Date.now();
    const groups = new Map<string, any>();
    for (const s of this.scheduledSessions) {
      const endT = s.startTime + (s.durationMinutes || 60) * 60000;
      if (endT <= now) continue; // termin je prošao -> sakrij
      const key = s.startTime + '|' + s.trainerUsername;
      if (!groups.has(key)) {
        groups.set(key, {
          startTime: s.startTime,
          durationMinutes: s.durationMinutes,
          note: s.note,
          trainer: s.trainerUsername,
          names: []
        });
      }
      groups.get(key).names.push(s.clientUsername);
    }
    this.scheduleGroups = Array.from(groups.values()).sort((a, b) => a.startTime - b.startTime);
  }

  formatSessionTime(ts: number): string {
    return new Date(ts).toLocaleString('sr-RS', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  onAvatarSelected(ev: any) {
    const file: File = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    this.router.navigateByUrl('/avatar-crop', { state: { file } });
  }

  loadMealPlan() {
    this.http.get<any>(`${this.backendUrl}/meals/client/${this.user.username}`).subscribe({
      next: (plan) => { this.mealPlan = plan; },
      error: () => { this.mealPlan = null; }
    });
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

  calcCompletionRate() {
    if (this.assignedWorkoutsCount === 0) {
      this.completionRate = 0;
      return;
    }
    const rate = Math.round((this.completedWorkouts.length / this.assignedWorkoutsCount) * 100);
    this.completionRate = Math.min(rate, 100);
  }

  calcLastWorkout() {
    if (this.completedWorkouts.length === 0) {
      this.lastWorkoutDate = '';
      return;
    }
    const sorted = [...this.completedWorkouts].sort((a: any, b: any) => b.completedAt - a.completedAt);
    const last = sorted[0];
    if (last?.completedAt) {
      const d = new Date(last.completedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) this.lastWorkoutDate = 'Today';
      else if (diffDays === 1) this.lastWorkoutDate = 'Yesterday';
      else if (diffDays < 7) this.lastWorkoutDate = diffDays + ' days ago';
      else this.lastWorkoutDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  /** Try to find trainer name from assigned workouts endpoint */
  loadTrainerName() {
    this.http.get<any>(`${this.backendUrl}/trainer/my-trainer/${this.user.username}`).subscribe({
      next: (link) => {
        if (link && link.trainerUsername) {
          this.trainerName = link.trainerUsername;
        }
      },
      error: () => {}
    });

    this.http.get<any[]>(`${this.backendUrl}/workouts/client/${this.user.username}`).subscribe({
      next: (workouts) => {
        this.assignedWorkoutsCount = workouts?.length ?? 0;
        this.calcCompletionRate();
      },
      error: () => {}
    });

    if (this.user?.role === 'TRAINER'){
      this.http.get<any>(`${this.backendUrl}/trainer/inbox/${this.user.username}`).subscribe({
        next: (inbox) => {
          this.inactiveClients = (inbox.priorityClients || [])
            .sort((a: any, b: any) => (b.daysSinceLastWorkout ?? 0) - (a.daysSinceLastWorkout ?? 0));
        },
        error: () => {}
      });
    }
  }

  prevCard() {
    if (this.cardIndex > 0) this.cardIndex--;
  }

  nextCard() {
    if (this.cardIndex < this.cardTitles.length - 1) this.cardIndex++;
  }

  openTrainerChat() {
    if (this.trainerName) {
      this.router.navigateByUrl(`/chat/${this.trainerName}`);
    }
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
      next: (data) => {
        this.completedWorkouts = data;
        this.calcCompletionRate();
        this.calcLastWorkout();
      },
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
    const outcome = await this.pwa.prompt();
    if (outcome === 'accepted') { this.isInstalled = true; return; }
    if (outcome === 'unavailable') {
      // Nema native prompt (npr. iOS, ili in-app/neeligibilan Chrome) → uputstvo kao fallback
      if (this.isIos) await this.showIosInstallGuide();
      else await this.showAndroidInstallGuide();
    }
  }

  async showIosInstallGuide() {
    const message =
      '<div style="text-align:left;text-shadow:none;line-height:1.55;font-size:14px;color:#f2f2f2">' +
        '<p style="margin:0 0 14px">Add <b>Spite</b> to your home screen:</p>' +
        '<ol style="margin:0;padding-left:22px">' +
          '<li style="margin-bottom:10px">Tap the <b>Share</b> button ' +
            '<span style="display:inline-block">&#x2191;</span> in Safari\'s bottom bar</li>' +
          '<li style="margin-bottom:10px">Scroll down and tap <b>&ldquo;Add to Home Screen&rdquo;</b></li>' +
          '<li>Tap <b>Add</b> in the top-right corner</li>' +
        '</ol>' +
      '</div>';

    const a = await this.alertCtrl.create({
      header: 'Install Spite',
      message,
      buttons: ['Got it'],
      cssClass: 'custom-alert install-alert'
    });
    await a.present();
  }

  async showAndroidInstallGuide() {
    const message =
      '<div style="text-align:left;text-shadow:none;line-height:1.55;font-size:14px;color:#f2f2f2">' +
        '<p style="margin:0 0 14px">Add <b>Spite</b> to your home screen (Chrome):</p>' +
        '<ol style="margin:0;padding-left:22px">' +
          '<li style="margin-bottom:10px">Tap the <b>menu</b> ' +
            '<span style="display:inline-block">&#x22EE;</span> in the top-right corner</li>' +
          '<li style="margin-bottom:10px">Tap <b>&ldquo;Install app&rdquo;</b> or <b>&ldquo;Add to Home screen&rdquo;</b></li>' +
          '<li>Tap <b>Install</b> to confirm</li>' +
        '</ol>' +
      '</div>';

    const a = await this.alertCtrl.create({
      header: 'Install Spite',
      message,
      buttons: ['Got it'],
      cssClass: 'custom-alert install-alert'
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