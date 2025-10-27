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
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon,]
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
    this.loadData();
  }

  loadData() {
    this.backend.getAllExercises().subscribe({
      next: (res) => this.exercises = res,
      error: (err) => console.error('Greška pri učitavanju vežbi:', err)
    });

    this.backend.getAllWorkouts().subscribe({
      next: (res) => this.workouts = res,
      error: (err) => console.error('Greška pri učitavanju treninga:', err)
    });
  }

  async deleteExercise(id: string) {
    const potvrda = await this.confirmDelete('Da li sigurno želiš da obrišeš ovu vežbu?');
    if (potvrda) {
      this.backend.deleteExercise(id).subscribe({
        next: () => {
          this.exercises = this.exercises.filter(e => e.id !== id.toString());
          console.log('🗑️ Vežba obrisana:', id);
        },
        error: (err) => console.error('Greška pri brisanju vežbe:', err)
      });
    }
  }

  async deleteWorkout(id: string) {
    const potvrda = await this.confirmDelete('Da li sigurno želiš da obrišeš ovaj trening?');
    if (potvrda) {
      this.backend.deleteWorkout(id).subscribe({
        next: () => {
          this.workouts = this.workouts.filter(w => w.id !== String(id));
          console.log('🗑️ Trening obrisan:', id);
        },
        error: (err) => console.error('Greška pri brisanju treninga:', err)
      });
    }
  }

  async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: 'Potvrda brisanja',
      message,
      buttons: [
        {
          text: 'Otkaži',
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
        {
          text: 'Obriši',
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
          text: 'Zatvori',
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
        <p>${exercise.description || 'Bez opisa'}</p>
      </div>
    `;
    }
  }



}
