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
    IonButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol
  ],
})
export class TabTrainingsPage implements OnInit {
  workout: any;

  constructor(private router: Router, private alertCtrl: AlertController) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const w = nav?.extras.state?.['workout'];

    if (!w) return;

    const map = new Map(w.exercises.map((e: any) => [e.id, e]));

    this.workout = {
      ...w,
      exercises: w.exerciseIds
        .map((id: string) => map.get(id))
        .filter((e: any) => !!e)
    };
  }


  goBack() {
    this.router.navigateByUrl('/tabs/tab1');
  }

  async openExercisePreview(exercise: any) {
    const alert = await this.alertCtrl.create({
      header: exercise.name,
      message: '',
      buttons: ['Close'],
      cssClass: 'custom-alert exercise-preview-alert'
    });

    await alert.present();

    const alertEl = await this.alertCtrl.getTop();
    if (!alertEl) return;

    const messageEl = alertEl.querySelector('.alert-message');
    if (!messageEl) return;

    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="exercise-preview-alert">
      <video src="${exercise.videoUrl}" autoplay loop muted playsinline controls></video>
      <p>${exercise.description || 'No description available.'}</p>
    </div>
  `;
  }

}
