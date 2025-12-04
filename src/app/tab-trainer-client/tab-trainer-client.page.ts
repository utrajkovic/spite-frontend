import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { FeedbackViewModal } from '../modals/feedback-view.modal';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonList, IonListHeader, IonButton, AlertController, LoadingController, IonBackButton, IonButtons, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-tab-trainer-client',
  templateUrl: './tab-trainer-client.page.html',
  styleUrls: ['./tab-trainer-client.page.scss'],
  standalone: true,
  imports: [
    IonButtons, IonBackButton,
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonList, IonListHeader, IonButton, IonSpinner,
    IonSegment,
    IonSegmentButton
  ],
  providers: [ModalController]

})
export class TabTrainerClientPage implements OnInit {

  clientUsername!: string;
  trainerUsername!: string;

  trainerWorkouts: any[] = [];
  clientWorkouts: any[] = [];

  segment: string = 'assign';  
  feedbackList: any[] = [];     

  baseUrl = 'https://spite-backend-v2.onrender.com/api/trainer';
  feedbackUrl = 'https://spite-backend-v2.onrender.com/api/feedback';

  loading: HTMLIonLoadingElement | null = null;


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    const user = localStorage.getItem('user');

    if (user) {
      this.trainerUsername = JSON.parse(user).username;
    }

    this.clientUsername = this.route.snapshot.paramMap.get('username')!;
    this.loadData();
  }

  async loadData() {
    await this.showLoading('Loading workouts...');

    this.http.get<any[]>(`${this.baseUrl}/workouts/${this.trainerUsername}`)
      .subscribe({
        next: async (res) => {
          this.trainerWorkouts = res;
          this.loadClientWorkouts();
          this.loadFeedback();
        },
        error: async () => {
          await this.hideLoading();
          this.showAlert('Error loading trainer workouts.');
        }
      });
  }


  loadClientWorkouts() {
    this.http.get<any[]>(`${this.baseUrl}/client-workouts/${this.clientUsername}`)
      .subscribe({
        next: async (res) => {
          this.clientWorkouts = res;
          await this.hideLoading();
        },
        error: async () => {
          await this.hideLoading();
          this.showAlert('Error loading client workouts.');
        }
      });
  }

  loadFeedback() {
    this.http.get<any[]>(`${this.feedbackUrl}/user/${this.clientUsername}`)
      .subscribe({
        next: (res) => {
          this.feedbackList = res;
        },
        error: () => {
          console.warn('No feedback found for this client.');
        }
      });
  }

  assignWorkout(workoutId: string) {
    const url =
      `${this.baseUrl}/assign?trainer=${this.trainerUsername}&client=${this.clientUsername}&workoutId=${workoutId}`;

    this.http.post(url, {}, { responseType: 'text' as 'json' })
      .subscribe({
        next: () => {
          this.showAlert('Workout successfully assigned to client.');
          this.loadClientWorkouts();
        },
        error: () => this.showAlert('Error assigning workout.')
      });
  }


  unassignWorkout(workoutId: string) {
    const url =
      `${this.baseUrl}/unassign?client=${this.clientUsername}&workoutId=${workoutId}`;

    this.http.delete(url, { responseType: 'text' as 'json' })
      .subscribe({
        next: () => {
          this.showAlert('Workout successfully removed from client.');
          this.loadClientWorkouts();
        },
        error: () => this.showAlert('Error removing workout.')
      });
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


  async showLoading(message: string) {
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

  async openFeedback(fb: any) {
    const modal = await this.modalCtrl.create({
      component: FeedbackViewModal,
      componentProps: { feedback: fb },
      cssClass: 'feedback-transparent'
    });

    await modal.present();
  }

  getWorkoutName(id: string): string {
    const w = this.clientWorkouts.find(x => x.id === id);
    return w ? w.title : 'Unknown workout';
  }

}

