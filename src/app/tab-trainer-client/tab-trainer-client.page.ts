import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel,
  IonList, IonListHeader, IonButton, AlertController, LoadingController, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  selector: 'app-tab-trainer-client',
  templateUrl: './tab-trainer-client.page.html',
  styleUrls: ['./tab-trainer-client.page.scss'],
  standalone: true,
  imports: [
    IonButtons, IonBackButton,
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonList, IonListHeader, IonButton, IonSpinner, IonAlert
  ]
})
export class TabTrainerClientPage implements OnInit {
  clientUsername!: string;
  trainerUsername!: string;
  trainerWorkouts: any[] = [];
  clientWorkouts: any[] = [];
  baseUrl = 'https://spite-backend-v2.onrender.com/api/trainer';
  loading: HTMLIonLoadingElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
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

  assignWorkout(workoutId: string) {
    const url = `${this.baseUrl}/assign?trainer=${this.trainerUsername}&client=${this.clientUsername}&workoutId=${workoutId}`;
    this.http.post(url, {}, { responseType: 'text' as 'json' }).subscribe({
      next: () => {
        this.showAlert('Workout successfully assigned to client.');
        this.loadClientWorkouts();
      },
      error: () => this.showAlert('Error assigning workout.')
    });
  }

  unassignWorkout(workoutId: string) {
    const url = `${this.baseUrl}/unassign?client=${this.clientUsername}&workoutId=${workoutId}`;
    this.http.delete(url, { responseType: 'text' as 'json' }).subscribe({
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
}
