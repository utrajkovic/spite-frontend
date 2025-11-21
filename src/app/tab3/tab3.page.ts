import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonReorder, IonReorderGroup } from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Exercise, Workout } from '../services/models';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { LocalDataService } from '../services/local-data.service';
import { HttpClient } from '@angular/common/http';
import { IonModal } from '@ionic/angular/standalone';
import { IonInput } from '@ionic/angular/standalone';
import { IonButtons } from '@ionic/angular/standalone';
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
    IonButtons,
    IonSpinner,
    IonModal,
    IonInput,
    IonReorder,
    IonReorderGroup
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

  ionViewWillEnter() {
    this.loadData();
  }

  private async getAlertMessageElement(alert: HTMLIonAlertElement): Promise<HTMLElement | null> {
    await new Promise(res => setTimeout(res, 20));

    const anyAlert = alert as any;

    if (anyAlert.shadowRoot) {
      const el = anyAlert.shadowRoot.querySelector('.alert-message') as HTMLElement | null;
      if (el) return el;
    }
    return document.querySelector('ion-alert .alert-message') as HTMLElement | null;
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

    const messageEl = await this.getAlertMessageElement(alert);
    if (!messageEl) {
      console.warn('❗ Cannot find alert message element for exercise preview');
      return;
    }

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
      messageEl.innerHTML = `<p>Unable to load video.</p>`;
    }
  }



  async showWorkoutDetails(workout: Workout) {
    if (!workout?.id) {
      this.showAlert("Invalid workout.");
      return;
    }

    const fresh: Workout = await fetch(
      `${this.backendUrl}/api/workouts/${workout.id}`
    ).then(r => r.json());

    if (!fresh.exerciseIds || fresh.exerciseIds.length === 0) {
      this.showAlert("This workout has no exercises.");
      return;
    }

    const allExercises = await this.http
      .get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${fresh.userId}`)
      .toPromise()
      .then(res => res ?? []);

    fresh.exercises = fresh.exerciseIds
      .map(id => allExercises.find(e => e.id === id))
      .filter((e): e is Exercise => !!e);

    if (fresh.exercises.length === 0) {
      this.showAlert("This workout has no exercises.");
      return;
    }

    this.openWorkoutModal(fresh);
  }




  async openWorkoutModal(workout: Workout) {
    const alert = await this.alertCtrl.create({
      header: workout.title,
      message: "",
      buttons: [
        { text: "Close", role: "cancel", cssClass: "alert-confirm" }
      ],
      cssClass: "custom-alert workout-preview-modal allow-html"
    });

    await alert.present();

    const msgEl = await this.getAlertMessageElement(alert);
    if (!msgEl) {
      console.warn('❗ Cannot find alert message element for workout preview');
      return;
    }

    const exerciseHtml = (workout.exercises ?? [])
      .map(e => `<p>${e.name}</p>`)
      .join("");

    msgEl.innerHTML = `
    <div class="workout-details-alert">
      <p><strong>Category:</strong> ${workout.subtitle || "—"}</p>
      <p><strong>Description:</strong> ${workout.content || "—"}</p>
      <hr>
      <h4>Exercises:</h4>
      ${exerciseHtml}
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

  // PRIKAZ MODAL-A I EDIT TRENINGA

  openEditWorkout(workout: Workout) {
    this.editingWorkout = { ...workout };

    const exs = workout.exercises || [];

    if (workout.exerciseIds?.length && exs.length) {
      this.editableExercises = workout.exerciseIds
        .map(id => exs.find(e => e.id === id)!)
        .filter((e): e is Exercise => !!e);
    } else {
      this.editableExercises = [...exs];
    }

    this.showEditModal = true;
  }



  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;

    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);

    ev.detail.complete();
  }



  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
  }


  async saveEdit() {
    if (!this.editingWorkout) return;

    const updatedWorkout = {
      ...this.editingWorkout,
      exerciseIds: this.editableExercises.map(e => e.id!) // ID je sada 100% siguran
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

      this.showAlert("Workout updated successfully!");

    } catch (err) {
      console.error(err);
      this.showAlert("Error updating workout");
    }
  }


}
