import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Exercise, Workout } from '../services/models';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { LocalDataService } from '../services/local-data.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonSpinner
  ]
})
export class Tab3Page implements OnInit {
  exercises: Exercise[] = [];
  workouts: Workout[] = [];
  assignedWorkouts: Workout[] = []; // 🟢 novi deo
  loading: HTMLIonLoadingElement | null = null;
  isDeleting: string | null = null;


  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
    private localData: LocalDataService,
    private zone: NgZone,
    private loadingCtrl: LoadingController,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.loadData();
    this.localData.refreshTab3$.subscribe(() => this.loadData());
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('⚠️ Nema ulogovanog korisnika!');
      return;
    }

    console.log('👤 Ulogovan korisnik:', currentUser);

    this.backend.getExercisesByUser(currentUser.id).subscribe({
      next: (res) => {
        console.log('📦 Vežbe sa servera:', res);
        this.zone.run(() => {
          this.exercises = res;
        });
      },
      error: (err) => console.error('Greška pri učitavanju vežbi:', err)
    });

    this.backend.getWorkoutsByUser(currentUser.id).subscribe({
      next: (res) => {
        console.log('📦 Moji treninzi:', res);
        this.zone.run(() => {
          this.workouts = res;
        });
      },
      error: (err) => console.error('Greška pri učitavanju treninga:', err)
    });

    this.http.get<Workout[]>(`${this.backendUrl}/api/trainer/client-workouts-full/${currentUser.username}`).subscribe({
      next: (res) => {
        console.log('🎯 Dodeljeni treninzi od trenera:', res);
        this.zone.run(() => {
          this.assignedWorkouts = res;
        });
      },
      error: (err) => console.error('Greška pri učitavanju dodeljenih treninga:', err)
    });
  }


  async deleteExercise(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this exercise?');
    if (!confirmDelete) return;

    this.isDeleting = id;

    try {
      await this.backend.deleteExercise(id).toPromise();

      this.zone.run(() => {
        this.exercises = this.exercises.filter(e => e.id !== id);
      });

      await this.showAlert('Exercise deleted successfully!');
    } catch (err) {
      console.error('Error deleting exercise:', err);
      await this.showAlert('Failed to delete exercise.');
    } finally {
      this.isDeleting = null;
    }
  }

  openEditWorkout(workout: Workout) {
    this.router.navigate(['/tab-edit', workout.id]);
  }

  async deleteWorkout(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this workout?');
    if (!confirmDelete) return;

    this.isDeleting = id;

    try {
      await this.backend.deleteWorkout(id).toPromise();

      this.zone.run(() => {
        this.workouts = this.workouts.filter(w => w.id !== id);
      });

      await this.showAlert('Workout deleted successfully!');
    } catch (err) {
      console.error('Error deleting workout:', err);
      await this.showAlert('Failed to delete workout.');
    } finally {
      this.isDeleting = null;
    }
  }

  async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Confirmation',
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-cancel' },
        { text: 'Delete', role: 'confirm', cssClass: 'alert-confirm' }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  async showExercisePreview(exercise: Exercise) {
    const alert = await this.alertCtrl.create({
      header: exercise.name,
      message: '',
      buttons: [{ text: 'Close', role: 'cancel' }],
      cssClass: 'custom-alert exercise-preview-modal'
    });

    await alert.present();

    const alertEl = await this.alertCtrl.getTop();
    if (!alertEl) return;

    const messageEl = alertEl.querySelector('.alert-message');
    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="exercise-preview-alert">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Loading video...</p>
    </div>
  `;

    try {
      if (!exercise.videoUrl) {
        messageEl.innerHTML = `<p>No video available.</p>`;
        return;
      }

      const videoEl = document.createElement('video');
      videoEl.src = exercise.videoUrl;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.controls = true;

      videoEl.onloadeddata = () => {
        messageEl.innerHTML = `
        <div class="exercise-preview-alert">
          <video src="${exercise.videoUrl}" autoplay loop muted playsinline controls></video>
          <p>${exercise.description || ''}</p>
        </div>
      `;
      };
    } catch {
      messageEl.innerHTML = `<p>Error loading video.</p>`;
    }
  }




  async showWorkoutDetails(workout: any) {
    const fresh = await fetch(`${this.backendUrl}/api/workouts/${workout.id}`).then(r => r.json());

    const map = new Map(fresh.exercises.map((e: any) => [e.id, e]));
    const sorted = fresh.exerciseIds.map((id: any) => map.get(id)).filter((e: any) => !!e);

    const alert = await this.alertCtrl.create({
      header: fresh.title,
      message: '',
      buttons: ['Close'],
      cssClass: 'custom-alert workout-preview-modal allow-html'
    });

    await alert.present();

    const alertEl = await this.alertCtrl.getTop();
    if (!alertEl) return;

    const messageEl = alertEl.querySelector('.alert-message');
    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="workout-details-alert">
      <p><strong>Category:</strong> ${fresh.subtitle || '—'}</p>
      <p><strong>Description:</strong> ${fresh.content || '—'}</p>
      <hr>
      <h4>Exercises:</h4>
      <p>${sorted.map((e: Exercise) => e.name).join('<br>')}</p>
    </div>
  `;
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
            await Preferences.remove({ key: 'user' });
            await this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Notification',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
