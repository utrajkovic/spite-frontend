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
    this.workout = nav?.extras.state?.['workout'];
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
