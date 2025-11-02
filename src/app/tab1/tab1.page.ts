import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackendService } from '../services/backend.service';
import { Workout } from '../services/models';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader,
    IonCard, IonHeader, IonToolbar, IonTitle, IonContent, RouterLink, IonIcon
  ],
})
export class Tab1Page {
  workouts: Workout[] = [];

  constructor(private backendService: BackendService) { }

  ionViewWillEnter() {
    this.loadUserWorkouts();
  }

  async loadUserWorkouts() {
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('⛔ Nema ulogovanog korisnika!');
      return;
    }

    this.backendService.getWorkoutsByUser(currentUser.id).subscribe({
      next: (data) => {
        this.workouts = data;
      },
      error: (err) => {
        console.error('Greška pri učitavanju treninga:', err);
      }
    });
  }
}
