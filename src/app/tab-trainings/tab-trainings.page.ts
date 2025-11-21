import { Component, OnInit } from '@angular/core';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonButton, IonIcon, IonToolbar, IonTitle, IonHeader
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab-trainings',
  templateUrl: './tab-trainings.page.html',
  styleUrls: ['./tab-trainings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol
  ],
})
export class TabTrainingsPage implements OnInit {
  workout: any;

  constructor(private router: Router, private alertCtrl: AlertController) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const workout = nav?.extras.state?.['workout'];

    if (workout?.id) {
      this.loadFreshWorkout(workout.id);
    }
  }

  async loadFreshWorkout(id: string) {
    const fresh = await fetch(
      `https://spite-backend-v2.onrender.com/api/workouts/${id}`
    ).then(r => r.json());

    const allExercises = await fetch(
      `https://spite-backend-v2.onrender.com/api/exercises/user/${fresh.userId}`
    ).then(r => r.json());

    const exerciseMap = new Map(allExercises.map((e: any) => [e.id, e]));

    fresh.exercises = fresh.exerciseIds
      .map((id: string) => exerciseMap.get(id))
      .filter((e: any) => !!e);

    this.workout = fresh;
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

    const messageEl = alert.querySelector('.alert-message');
    if (messageEl) {
      messageEl.innerHTML = `
      <div class="exercise-preview-alert">
        <video src="${exercise.videoUrl}" autoplay loop muted playsinline controls></video>
        <p>${exercise.description || 'No description available.'}</p>
      </div>
    `;
    }
  }
}
