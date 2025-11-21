import { Component, OnInit } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonButton, IonIcon, IonToolbar, IonTitle, IonHeader
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';

@Component({
  selector: 'app-tab-trainings',
  templateUrl: './tab-trainings.page.html',
  styleUrls: ['./tab-trainings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol
  ],
})
export class TabTrainingsPage implements OnInit {
  workout: any;
  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private router: Router,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const workoutId = nav?.extras.state?.['workoutId'];

    if (workoutId) {
      this.loadWorkout(workoutId);
    }
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


  async loadWorkout(id: string) {
    const w = await fetch(`${this.backendUrl}/api/workouts/${id}`).then(r => r.json());

    if (w.exerciseIds && w.exercises && w.exercises.length > 0) {
      w.exercises = w.exerciseIds
        .map((eid: string) => w.exercises.find((e: any) => e.id === eid))
        .filter((e: any) => !!e);
    }

    this.workout = w;
  }


  goBack() {
    this.router.navigateByUrl('/tabs/tab1');
  }

  async openExercisePreview(exercise: any) {
    const alert = await this.alertCtrl.create({
      header: exercise.name,
      message: '',
      buttons: ['Close'],
      cssClass: 'custom-alert exercise-preview-alert',
    });

    await alert.present();
    const messageEl = await this.getAlertMessageElement(alert);
    if (!messageEl) {
      console.warn('❗ Could not find alert message element');
      return;
    }

    messageEl.innerHTML = `
    <div class="exercise-preview-alert">
      <video src="${exercise.videoUrl}" autoplay loop muted playsinline controls></video>
      <p>${exercise.description || 'No description available.'}</p>
    </div>
  `;
  }

}
