import { Component, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IonButton, IonContent,
  AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";
import { BackendService } from '../services/backend.service';
import { PriorityClient } from '../services/models';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { UserSearchComponent } from '../shared/user-search/user-search.component';

@Component({
  selector: 'app-tab-trainer',
  templateUrl: './tab-trainer.page.html',
  styleUrls: ['./tab-trainer.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent,
    IonButton,
    PageLoadingOverlayComponent,
    AvatarComponent,
    UserSearchComponent
]
})
export class TabTrainerPage {
  
  trainerUsername = '';
  clientUsername = '';
  clients: { clientUsername: string }[] = [];
  priorityClients: PriorityClient[] = [];

  baseUrl = 'https://spite-backend.fly.dev/api/trainer';
  sessionsUrl = 'https://spite-backend.fly.dev/api/sessions';
  usersUrl = 'https://spite-backend.fly.dev/api/users';
  isLoading = false;

  // Daily reminder settings
  reminderEnabled = true;
  reminderTime = '07:00';

  // Scheduling
  view: 'clients' | 'schedule' = 'clients';
  calRef = new Date();
  calendarDays: { date: Date; inMonth: boolean }[] = [];
  monthLabel = '';
  selectedDate: Date | null = null;
  sessionTime = '18:00';
  sessionDuration = 60;
  sessionNote = '';
  selectedClients = new Set<string>();
  customNames: string[] = [];
  customNameInput = '';
  allSessions: any[] = [];
  booking = false;

  // Offline (non-app) clients
  offlineClientsUrl = 'https://spite-backend.fly.dev/api/offline-clients';
  offlineClients: any[] = [];
  selectedOfflineIds = new Set<string>();
  newOffline = { name: '', email: '', heightCm: null as number | null, weightKg: null as number | null, goal: '', notes: '' };
  addingOffline = false;
  showOfflineForm = false;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private zone: NgZone,
    private backend: BackendService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.trainerUsername = parsed.username;
      this.loadClients();
      this.loadOfflineClients();
      this.buildCalendar();
      this.loadSessions();
      this.loadReminderSettings();
    }
  }

  loadReminderSettings() {
    this.http.get<any>(`${this.usersUrl}/username/${this.trainerUsername}`).subscribe({
      next: (u) => {
        this.reminderEnabled = u?.dailyReminderEnabled !== false;
        if (u?.dailyReminderTime) this.reminderTime = u.dailyReminderTime;
      },
      error: () => {}
    });
  }

  toggleReminder() {
    this.reminderEnabled = !this.reminderEnabled;
    this.saveReminder();
  }

  saveReminder() {
    this.http.put(
      `${this.usersUrl}/reminder?username=${this.trainerUsername}&enabled=${this.reminderEnabled}&time=${this.reminderTime}`,
      {}, { responseType: 'text' as 'json' }
    ).subscribe({ next: () => {}, error: () => {} });
  }

  // ───────── Scheduling ─────────

  loadSessions() {
    if (!this.trainerUsername) return;
    this.http.get<any[]>(`${this.sessionsUrl}/trainer/${this.trainerUsername}`).subscribe({
      next: (res) => { this.allSessions = res || []; },
      error: () => { this.allSessions = []; }
    });
  }

  buildCalendar() {
    const year = this.calRef.getFullYear();
    const month = this.calRef.getMonth();
    this.monthLabel = this.calRef.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });

    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // ponedeljak prvi
    const start = new Date(year, month, 1 - startOffset);

    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, inMonth: d.getMonth() === month });
    }
    this.calendarDays = days;
  }

  prevMonth() {
    this.calRef = new Date(this.calRef.getFullYear(), this.calRef.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.calRef = new Date(this.calRef.getFullYear(), this.calRef.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDay(d: { date: Date; inMonth: boolean }) {
    this.selectedDate = new Date(d.date);
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  isToday(date: Date): boolean {
    return this.sameDay(date, new Date());
  }

  isSelected(date: Date): boolean {
    return !!this.selectedDate && this.sameDay(date, this.selectedDate);
  }

  hasSessionsOn(date: Date): boolean {
    return this.allSessions.some(s => this.sameDay(new Date(s.startTime), date));
  }

  sessionsForSelectedDay(): any[] {
    if (!this.selectedDate) return [];
    return this.allSessions
      .filter(s => this.sameDay(new Date(s.startTime), this.selectedDate as Date))
      .sort((a, b) => a.startTime - b.startTime);
  }

  toggleClientSel(username: string) {
    if (this.selectedClients.has(username)) this.selectedClients.delete(username);
    else this.selectedClients.add(username);
  }

  toggleOfflineSel(id: string) {
    if (this.selectedOfflineIds.has(id)) this.selectedOfflineIds.delete(id);
    else this.selectedOfflineIds.add(id);
  }

  addCustomName() {
    const name = (this.customNameInput || '').trim();
    if (!name) return;
    if (!this.customNames.includes(name)) this.customNames.push(name);
    this.customNameInput = '';
  }

  removeCustomName(i: number) {
    this.customNames.splice(i, 1);
  }

  get totalSelected(): number {
    return this.selectedClients.size + this.customNames.length + this.selectedOfflineIds.size;
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  }

  book() {
    if (this.booking) return;
    if (!this.selectedDate) { this.showAlert('Izaberi datum.'); return; }
    if (this.totalSelected === 0) { this.showAlert('Izaberi bar jednog klijenta ili dodaj ime.'); return; }
    if (!/^\d{1,2}:\d{2}$/.test(this.sessionTime)) { this.showAlert('Unesi vreme u formatu HH:MM.'); return; }

    const [h, m] = this.sessionTime.split(':').map(Number);
    const dt = new Date(this.selectedDate);
    dt.setHours(h, m, 0, 0);

    const body = {
      startTime: dt.getTime(),
      durationMinutes: Number(this.sessionDuration) || 60,
      note: this.sessionNote.trim(),
      clientUsernames: Array.from(this.selectedClients),
      customNames: [...this.customNames],
      offlineClientIds: Array.from(this.selectedOfflineIds)
    };

    this.booking = true;
    this.http.post(
      `${this.sessionsUrl}?trainerUsername=${this.trainerUsername}`,
      body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => {
        this.booking = false;
        this.selectedClients.clear();
        this.selectedOfflineIds.clear();
        this.customNames = [];
        this.customNameInput = '';
        this.sessionNote = '';
        this.loadSessions();
        this.showAlert('Termin je zakazan.');
      },
      error: () => {
        this.booking = false;
        this.showAlert('Greška pri zakazivanju.');
      }
    });
  }

  async confirmCancelSession(s: any) {
    const alert = await this.alertCtrl.create({
      header: 'Otkaži termin',
      message: `Otkazati termin sa "${s.clientUsername}" u ${this.formatTime(s.startTime)}?`,
      buttons: [
        { text: 'Ne', role: 'cancel' },
        { text: 'Otkaži termin', role: 'confirm', handler: () => this.cancelSession(s.id) }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  cancelSession(id: string) {
    this.http.delete(`${this.sessionsUrl}/${id}`, { responseType: 'text' as 'json' }).subscribe({
      next: () => { this.loadSessions(); },
      error: () => { this.showAlert('Greška pri otkazivanju.'); }
    });
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

  // ───────── Offline (non-app) clients ─────────

  loadOfflineClients() {
    if (!this.trainerUsername) return;
    this.http.get<any[]>(`${this.offlineClientsUrl}/trainer/${this.trainerUsername}`).subscribe({
      next: (res) => { this.offlineClients = res || []; },
      error: () => { this.offlineClients = []; }
    });
  }

  addOfflineClient() {
    const name = (this.newOffline.name || '').trim();
    if (!name) { this.showAlert('Unesi ime klijenta.'); return; }
    if (this.addingOffline) return;
    this.addingOffline = true;

    const body = {
      name,
      email: (this.newOffline.email || '').trim(),
      heightCm: this.newOffline.heightCm,
      weightKg: this.newOffline.weightKg,
      goal: (this.newOffline.goal || '').trim(),
      notes: (this.newOffline.notes || '').trim()
    };
    this.http.post<any>(
      `${this.offlineClientsUrl}?trainerUsername=${this.trainerUsername}`, body
    ).subscribe({
      next: (created) => {
        this.addingOffline = false;
        this.offlineClients = [...this.offlineClients, created];
        this.newOffline = { name: '', email: '', heightCm: null, weightKg: null, goal: '', notes: '' };
        this.showOfflineForm = false;
      },
      error: () => { this.addingOffline = false; this.showAlert('Greška pri dodavanju klijenta.'); }
    });
  }

  goToOfflineClient(id: string) {
    this.router.navigateByUrl(`/offline-client/${id}`);
  }

  async confirmRemoveOfflineClient(c: any) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Client',
      message: `Obrisati offline klijenta "${c.name}" i sve njegove zapise?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Remove', role: 'confirm', cssClass: 'alert-confirm', handler: () => this.removeOfflineClient(c.id) }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  removeOfflineClient(id: string) {
    this.http.delete(`${this.offlineClientsUrl}/${id}`, { responseType: 'text' as 'json' }).subscribe({
      next: () => {
        this.offlineClients = this.offlineClients.filter(c => c.id !== id);
        this.selectedOfflineIds.delete(id);
      },
      error: () => this.showAlert('Greška pri brisanju klijenta.')
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

    // 1. Učitaj sve dodeljene treninge za tog klijenta
    this.http.get<any[]>(
      `https://spite-backend.fly.dev/api/workouts/client/${username}`
    ).subscribe({
      next: async (workouts) => {
        // 2. Unassign svaki trening
        const unassignCalls = (workouts || [])
          .filter((w: any) => w.id)
          .map((w: any) =>
            this.http.delete(
              `https://spite-backend.fly.dev/api/workouts/assign?workoutId=${w.id}&clientUsername=${username}&assignedBy=${t}`,
              { responseType: 'text' as 'json' }
            ).toPromise().catch(() => {})
          );

        await Promise.all(unassignCalls);

        // 3. Obriši trainer-client link
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
            this.showAlert(`Client "${username}" removed. All assigned workouts have been cleared.`);
          },
          error: () => {
            this.isLoading = false;
            this.showAlert('Error removing client.');
          }
        });
      },
      error: () => {
        // Ako ne može da učita treninge, svejedno obriši link
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
            this.showAlert(`Client "${username}" removed.`);
          },
          error: () => {
            this.isLoading = false;
            this.showAlert('Error removing client.');
          }
        });
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
