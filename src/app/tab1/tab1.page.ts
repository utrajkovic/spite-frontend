import { Component, NgZone } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackendService } from '../services/backend.service';
import { Workout } from '../services/models';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,

    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,

    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,

    IonButton,
    IonIcon,
    IonSpinner
  ]

})
export class Tab1Page {
  workouts: Workout[] = [];
  loading = false;
  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private backendService: BackendService,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private zone: NgZone,
  ) { }

  private initialized = false;

  ionViewWillEnter() {
    if (!this.initialized) {
      this.loadUserWorkouts();
      this.initialized = true;
    }
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

    const userWorkouts$ = this.backendService.getWorkoutsByUser(currentUser.id);
    const assignedWorkouts$ = this.http.get<Workout[]>(`${this.backendUrl}/api/trainer/client-workouts-full/${currentUser.username}`);

    Promise.all([userWorkouts$.toPromise(), assignedWorkouts$.toPromise()])
      .then(([mine, assigned]) => {
        this.workouts = [...(mine || []), ...(assigned || [])];
        this.loading = false;
      })
      .catch((err) => {
        console.error('❌ Greška pri učitavanju treninga:', err);
        this.loading = false;
      });
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
