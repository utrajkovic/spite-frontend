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

  constructor(private backendService: BackendService) {} 

  ionViewWillEnter() {
    this.backendService.getAllWorkouts().subscribe({
      next: (data) => {
        this.workouts = data;
      },
      error: (err) => {
        console.error('Greška pri učitavanju treninga:', err);
      }
    });
  }
}
