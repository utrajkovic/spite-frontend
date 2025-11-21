import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonInput, IonModal, IonButtons, IonReorderGroup, IonReorder } from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Exercise, Workout } from '../services/models';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { LocalDataService } from '../services/local-data.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonInput,
    IonModal,
    IonButtons,
    IonReorderGroup,
    IonReorder
  ]
})
export class Tab3Page implements OnInit {
  exercises: Exercise[] = [];
  workouts: Workout[] = [];
  assignedWorkouts: Workout[] = []; // 🟢 novi deo
  loading: HTMLIonLoadingElement | null = null;
  isDeleting: string | null = null;
  editingWorkout: Workout | null = null;
  showEditModal = false;
  editableExercises: Exercise[] = [];


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

    // 🔹 Vežbe
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

  async deleteWorkout(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this workout?');
    if (!confirmDelete) return;

    this.isDeleting = id;

    try {
      await this.backend.deleteWorkout(id).toPromise();

      this.zone.run(() => {
        this.workouts = this.workouts.filter(w => w.id !== id);
      });

      this.localData.triggerWorkoutsRefresh();
      this.localData.triggerTab1Refresh();
      
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
      buttons: [{ text: 'Close', role: 'cancel', cssClass: 'alert-confirm' }],
      cssClass: 'custom-alert exercise-preview-modal'
    });

    await alert.present();

    const messageEl = document.querySelector('ion-alert .alert-message');
    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="exercise-preview-alert">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Loading video...</p>
    </div>
  `;

    try {
      if (!exercise.videoUrl) {
        messageEl.innerHTML = `<p>⚠️ No video available for this exercise.</p>`;
        return;
      }

      const videoEl = document.createElement('video');
      videoEl.src = exercise.videoUrl;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.controls = true;
      videoEl.playsInline = true;
      videoEl.className = 'exercise-video';

      videoEl.onloadeddata = () => {
        messageEl.innerHTML = `
        <div class="exercise-preview-alert">
          <video src="${exercise.videoUrl}" autoplay loop muted playsinline controls></video>
          <p>${exercise.description || 'No description available.'}</p>
        </div>
      `;
      };
    } catch (err) {
      console.error('Error loading video:', err);
      messageEl.innerHTML = `<p> Unable to load video.</p>`;
    }
  }

  async showWorkoutDetails(workout: any) {

    const fresh = await fetch(
      `${this.backendUrl}/api/workouts/${workout.id}`
    ).then(r => r.json());

    let sortedExercises: any[] = [];

    if (fresh.exercises && fresh.exerciseIds) {
      const map = new Map(fresh.exercises.map((e: any) => [e.id, e]));
      sortedExercises = fresh.exerciseIds
        .map((id: string) => map.get(id))
        .filter((e: any) => !!e);
    }

    const exerciseNames = sortedExercises.length > 0
      ? sortedExercises.map(e => e.name).join('<br>')
      : 'No exercises listed.';

    const alert = await this.alertCtrl.create({
      header: fresh.title,
      message: '',
      buttons: [{ text: 'Close', role: 'cancel', cssClass: 'alert-confirm' }],
      cssClass: 'custom-alert workout-preview-modal allow-html'
    });

    await alert.present();

    const messageEl = document.querySelector('ion-alert .alert-message');
    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="workout-details-alert">
      <p><strong>Category:</strong> ${fresh.subtitle || '—'}</p>
      <p><strong>Description:</strong> ${fresh.content || '—'}</p>
      <hr>
      <h4>Exercises:</h4>
      <p>${exerciseNames}</p>
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

  async openEditWorkout(workout: Workout) {

    const fresh: Workout = await fetch(
      `${this.backendUrl}/api/workouts/${workout.id}`
    ).then(r => r.json());

    const user = await this.localData.getUser();
    const allExercises: Exercise[] = await this.http
      .get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
      .toPromise() ?? [];

    const map = new Map(allExercises.map(e => [e.id, e]));
    this.editableExercises = fresh.exerciseIds
      .map(id => map.get(id))
      .filter((e): e is Exercise => !!e);

    this.editingWorkout = { ...fresh };
    this.showEditModal = true;
  }


  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;

    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);

    ev.detail.complete();
  }
  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
  }

  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
  }
  async saveEdit() {
    if (!this.editingWorkout) return;

    const updatedWorkout = {
      ...this.editingWorkout,
      exerciseIds: this.editableExercises.map(e => e.id!)
    };

    try {
      await this.http.put(
        `${this.backendUrl}/api/workouts/${updatedWorkout.id}`,
        updatedWorkout
      ).toPromise();

      this.showEditModal = false;
      this.editingWorkout = null;

      this.loadData();
      this.localData.triggerWorkoutsRefresh();
      this.localData.triggerTab1Refresh();
      this.showAlert("Workout updated successfully!");

    } catch (err) {
      console.error(err);
      this.showAlert("Error updating workout");
    }
  }

}
