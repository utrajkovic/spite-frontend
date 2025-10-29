import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Exercise, Workout } from '../services/models';
import { AlertController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonButton, IonIcon
  ]
})
export class Tab3Page implements OnInit {
  exercises: Exercise[] = [];
  workouts: Workout[] = [];

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const access = localStorage.getItem('spite-access');
    if (!access) {
      const password = prompt('🔒 Enter access password for Spite Dev Version:');
      if (password !== 'uki') {
        alert('Incorrect password!');
        window.location.href = 'https://google.com';
        return;
      }
      localStorage.setItem('spite-access', 'granted');
    }
    this.loadData();
  }

  loadData() {
    this.backend.getAllExercises().subscribe({
      next: (res) => this.exercises = res,
      error: (err) => console.error('Error loading exercises:', err)
    });

    this.backend.getAllWorkouts().subscribe({
      next: (res) => this.workouts = res,
      error: (err) => console.error('Error loading workouts:', err)
    });
  }

  async deleteExercise(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this exercise?');
    if (confirmDelete) {
      this.backend.deleteExercise(id).subscribe({
        next: () => {
          this.exercises = this.exercises.filter(e => e.id !== id.toString());
          console.log('🗑️ Exercise deleted:', id);
        },
        error: (err) => console.error('Error deleting exercise:', err)
      });
    }
  }

  async deleteWorkout(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this workout?');
    if (confirmDelete) {
      this.backend.deleteWorkout(id).subscribe({
        next: () => {
          this.workouts = this.workouts.filter(w => w.id !== String(id));
          console.log('🗑️ Workout deleted:', id);
        },
        error: (err) => console.error('Error deleting workout:', err)
      });
    }
  }

  async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Confirmation',
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Delete',
          role: 'confirm',
          cssClass: 'alert-confirm'
        }
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
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'alert-confirm'
        }
      ],
      cssClass: 'custom-alert exercise-preview-modal'
    });

    await alert.present();

    const messageEl = document.querySelector('ion-alert .alert-message');
    if (messageEl) {
      messageEl.innerHTML = `
      <div class="exercise-preview-alert">
        <video src="${exercise.videoUrl}" autoplay loop muted playsinline></video>
        <p>${exercise.description || 'No description available.'}</p>
      </div>
      `;
    }
  }
  async showWorkoutDetails(workout: Workout) {
    const exerciseNames = workout.exerciseIds
      .map(id => this.exercises.find(e => e.id === id)?.name || 'Unknown exercise')
      .join('<br>');

    const alert = await this.alertCtrl.create({
      header: workout.title,
      message: ' ',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'alert-confirm'
        }
      ],
      cssClass: 'custom-alert workout-preview-modal'
    });

    await alert.present();

    // 2️⃣ Ručno ubacujemo HTML u alert nakon što se renderuje
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
}
