import { Component, NgZone } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackendService } from '../services/backend.service';
import { Workout } from '../services/models';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";
import { BadgeService } from '../services/badge.service';
import { DailyAgenda } from '../services/models';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader,
    IonCard, IonContent, RouterLink,
    PageLoadingOverlayComponent
],
})
export class Tab1Page {
  workouts: Workout[] = [];
  loading = false;
  openNotes = new Set<string>();
  readonly backendUrl = 'https://spite-backend-v2.onrender.com';
  agenda: DailyAgenda | null = null;
  currentUsername = '';

  toggleNote(id: string | undefined) {
    if (!id) return;
    if (this.openNotes.has(id)) this.openNotes.delete(id);
    else this.openNotes.add(id);
  }

  constructor(
    private backendService: BackendService,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private zone: NgZone,
    private badgeService: BadgeService
  ) { }

  ionViewWillEnter() {
    this.loadUserWorkouts();
  }

  async loadUserWorkouts() {
    this.loading = true;
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('⚠️ Nema ulogovanog korisnika!');
      this.loading = false;
      return;
    }

    this.currentUsername = currentUser.username;
    this.loadDailyAgenda(currentUser.username);

    const userWorkouts$ = this.backendService.getWorkoutsByUser(currentUser.id);
    const assignedWorkouts$ = this.http.get<Workout[]>(`${this.backendUrl}/api/workouts/client/${currentUser.username}`);

    Promise.all([userWorkouts$.toPromise(), assignedWorkouts$.toPromise()])
      .then(([mine, assigned]) => {
        this.workouts = [...(mine || []), ...(assigned || [])];
        this.loading = false;
        // Označi sve workouts kao viđene - briše badge
        const allIds = this.workouts.map(w => w.id).filter(Boolean) as string[];
        this.badgeService.markWorkoutsSeen(allIds);
      })
      .catch((err) => {
        console.error('❌ Greška pri učitavanju treninga:', err);
        this.loading = false;
      });
  }

  private loadDailyAgenda(username: string) {
    this.backendService.getTodayAgenda(username).subscribe({
      next: (agenda) => {
        this.agenda = agenda;
      },
      error: () => {
        this.agenda = null;
      }
    });
  }

  async openCheckInForm() {
    if (!this.currentUsername || !this.agenda?.trainerUsername) {
      this.showSimpleAlert('No trainer assigned yet. Check-in requires active trainer link.');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Daily check-in',
      cssClass: 'custom-alert',
      inputs: [
        { name: 'sleepHours', type: 'number', placeholder: 'Sleep hours (0-24)' },
        { name: 'energy', type: 'number', placeholder: 'Energy (1-5)' },
        { name: 'pain', type: 'number', placeholder: 'Pain (1-5)' },
        { name: 'weight', type: 'number', placeholder: 'Weight (optional)' },
        { name: 'comment', type: 'textarea', placeholder: 'Comment (optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: (data) => {
            const payload = {
              username: this.currentUsername,
              trainerUsername: this.agenda?.trainerUsername || '',
              sleepHours: Number(data.sleepHours),
              energy: Number(data.energy),
              pain: Number(data.pain),
              weight: data.weight ? Number(data.weight) : null,
              comment: (data.comment || '').trim()
            };

            this.backendService.submitDailyCheckIn(payload).subscribe({
              next: () => {
                this.showSimpleAlert('Check-in submitted.');
                this.loadDailyAgenda(this.currentUsername);
              },
              error: (err) => {
                const msg = typeof err?.error === 'string' ? err.error : 'Failed to submit check-in.';
                this.showSimpleAlert(msg);
              }
            });

            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  private async showSimpleAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Notification',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showWorkoutPreview(workout: Workout) {
    if (!workout.exercises?.length) {
      const alert = await this.alertCtrl.create({
        header: workout.title,
        message: '<p>This workout has no exercises assigned.</p>',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });
      await alert.present();
      return;
    }

    let currentIndex = 0;

    const alert = await this.alertCtrl.create({
      message: '',
      buttons: [{ text: 'Close', role: 'cancel' }],
      cssClass: 'custom-alert exercise-preview-alert'
    });

    await alert.present();
    this.renderExercise(alert, workout.exercises![currentIndex], currentIndex + 1, workout.exercises!.length, workout);
  }

  private renderExercise(
    alert: HTMLIonAlertElement,
    exercise: any,
    index: number,
    total: number,
    workout: Workout
  ) {
    const messageEl = alert.querySelector('.alert-message');
    if (!messageEl) return;

    // 💡 Postavi fade-out animaciju pre zamene sadržaja
    messageEl.classList.add('fade-out');

    setTimeout(() => {
      messageEl.innerHTML = `
      <div class="exercise-preview-alert fade-in">
        <div class="video-wrapper">
          <video src="${exercise.videoUrl || ''}" autoplay loop muted playsinline controls></video>
        </div>

        <h3>${exercise.name}</h3>
        <p>${exercise.description || 'No description available.'}</p>
        <div class="index-indicator">${index} / ${total}</div>

        <div class="nav-buttons">
          <ion-button id="prev-btn" fill="clear" size="small" color="white">
            <i class="fa-solid fa-arrow-left"></i>&nbsp;Prev
          </ion-button>
          <ion-button id="next-btn" fill="clear" size="small" color="white">
            Next&nbsp;<i class="fa-solid fa-arrow-right"></i>
          </ion-button>
        </div>
      </div>
    `;

      // Ukloni fade-out i dodeli fade-in
      messageEl.classList.remove('fade-out');
      messageEl.classList.add('fade-in');

      const prevBtn = messageEl.querySelector('#prev-btn') as HTMLIonButtonElement;
      const nextBtn = messageEl.querySelector('#next-btn') as HTMLIonButtonElement;

      prevBtn?.addEventListener('click', () => {
        const newIndex = (index - 2 + total) % total;
        this.renderExercise(alert, workout.exercises![newIndex], newIndex + 1, total, workout);
      });

      nextBtn?.addEventListener('click', () => {
        const newIndex = index % total;
        this.renderExercise(alert, workout.exercises![newIndex], newIndex + 1, total, workout);
      });
    }, 150); 
  }

}
