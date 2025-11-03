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
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalDataService } from '../services/local-data.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner

  ]
})
export class Tab3Page implements OnInit {
  exercises: Exercise[] = [];
  workouts: Workout[] = [];

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
    private localData: LocalDataService,
    private zone: NgZone,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.loadData();
    this.localData.refreshTab3$.subscribe(() => this.loadData());
  }
  loading: HTMLIonLoadingElement | null = null;
  isDeleting: string | null = null;

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('Nema ulogovanog korisnika!');
      return;
    }

    console.log('👤 Ulogovan korisnik:', currentUser);

    this.backend.getExercisesByUser(currentUser.id).subscribe({
      next: (res) => {
        console.log('Vežbe sa servera:', res);
        this.zone.run(() => {
          this.exercises = res;
        });
      },
      error: (err) => console.error('Greška pri učitavanju vežbi:', err)
    });

    this.backend.getWorkoutsByUser(currentUser.id).subscribe({
      next: (res) => {
        console.log('Treninzi sa servera:', res);
        this.zone.run(() => {
          this.workouts = res;
        });
      },
      error: (err) => console.error('Greška pri učitavanju treninga:', err)
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

      const exerciseToDelete = this.exercises.find(e => e.id === id);
      if (exerciseToDelete?.localVideoPath) {
        try {
          await Filesystem.deleteFile({
            path: exerciseToDelete.localVideoPath,
            directory: Directory.Data
          });
        } catch { }
      }

      await this.showAlert('Exercise deleted successfully!');
    } catch (err) {
      console.error('Error deleting exercise:', err);
      await this.showAlert('Failed to delete exercise. Check console.');
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
      await this.showAlert('Failed to delete workout. Check console.');
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
      message: ' ',
      buttons: [{ text: 'Close', role: 'cancel', cssClass: 'alert-confirm' }],
      cssClass: 'custom-alert exercise-preview-modal'
    });

    await alert.present();
    const messageEl = document.querySelector('ion-alert .alert-message');
    if (!messageEl) return;

    try {
      if (!exercise.localVideoPath) throw new Error('No local video path');
      const file = await Filesystem.readFile({
        path: exercise.localVideoPath,
        directory: Directory.Data
      });
      const videoSrc = `data:video/mp4;base64,${file.data}`;
      messageEl.innerHTML = `
        <div class="exercise-preview-alert">
          <video src="${videoSrc}" autoplay loop muted playsinline controls></video>
          <p>${exercise.description || 'No description available.'}</p>
        </div>
      `;
    } catch (err) {
      console.error('Video nije pronađen:', err);
      messageEl.innerHTML = `<p> Video nije pronađen na uređaju.</p>`;
    }
  }

  async showWorkoutDetails(workout: Workout) {
    const exerciseNames = workout.exerciseIds
      .map(id => this.exercises.find(e => e.id === id)?.name || 'Unknown exercise')
      .join('<br>');

    const alert = await this.alertCtrl.create({
      header: workout.title,
      message: ' ',
      buttons: [{ text: 'Close', role: 'cancel', cssClass: 'alert-confirm' }],
      cssClass: 'custom-alert workout-preview-modal'
    });

    await alert.present();
    const messageEl = document.querySelector('ion-alert .alert-message');
    if (messageEl) {
      messageEl.innerHTML = `
        <div class="workout-details-alert">
          <p><strong>Category:</strong> ${workout.subtitle || '—'}</p>
          <p><strong>Description:</strong> ${workout.content || '—'}</p>
          <hr>
          <p><strong>Exercises:</strong><br>${exerciseNames || 'No exercises listed.'}</p>
        </div>
      `;
    }
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

  async showLoading(message: string = 'Please wait...') {
    this.loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      backdropDismiss: false,
      cssClass: 'custom-loading'
    });
    await this.loading.present();
  }

  async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
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
