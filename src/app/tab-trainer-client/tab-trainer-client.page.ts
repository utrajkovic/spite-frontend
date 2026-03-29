import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { FeedbackViewModal } from '../modals/feedback-view.modal';
import { PRDetailModal } from '../modals/pr-detail.modal';
import { WorkoutCalendarModal } from '../modals/workout-calendar.modal';
import { StatsService, WorkoutStats } from '../services/stats.service';
import { PRService, ExercisePR } from '../services/pr.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
export class TabTrainerClientPage implements OnInit, OnDestroy {

  @ViewChild('clientChartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  clientUsername!: string;
  trainerUsername!: string;

  trainerWorkouts: any[] = [];
  clientWorkouts: any[] = [];

  segment: string = 'assign';
  feedbackList: any[] = [];
  clientInfo: any = null;
  clientStats: WorkoutStats | null = null;
  clientPRs: ExercisePR[] = [];

  private chart: Chart | null = null;

  baseUrl = 'https://spite-backend-v2.onrender.com/api/trainer';
  feedbackUrl = 'https://spite-backend-v2.onrender.com/api/feedback';

  loading: HTMLIonLoadingElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private statsService: StatsService,
    private prService: PRService
  ) { }

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) this.trainerUsername = JSON.parse(user).username;
    this.clientUsername = this.route.snapshot.paramMap.get('username')!;
    this.loadData();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  onSegmentChange() {
    if (this.segment === 'profile' && this.clientStats) {
      setTimeout(() => this.renderChart(), 100);
    }
  }

  private renderChart() {
    if (!this.chartCanvas || !this.clientStats?.weeklyData.length) return;
    this.chart?.destroy();

    const labels = this.clientStats.weeklyData.map(w => w.label);
    const counts = this.clientStats.weeklyData.map(w => w.count);

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: counts.map(c =>
            c === 0 ? 'rgba(0,255,255,0.05)' : 'rgba(0,255,255,0.25)'
          ),
          borderColor: counts.map(c =>
            c === 0 ? 'rgba(0,255,255,0.1)' : 'rgba(0,255,255,0.8)'
          ),
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(0,255,255,0.05)' }, ticks: { color: 'rgba(0,247,255,0.5)', font: { size: 11 } } },
          y: { grid: { color: 'rgba(0,255,255,0.05)' }, ticks: { color: 'rgba(0,247,255,0.5)', font: { size: 11 }, stepSize: 1 }, beginAtZero: true }
        }
      }
    });
  }

  async loadData() {
    await this.showLoading('Loading workouts...');

    this.http.get<any[]>(`${this.baseUrl}/workouts/${this.trainerUsername}`)
      .subscribe({
        next: async (res) => {
          this.trainerWorkouts = res;
          this.loadClientWorkouts();
          this.loadFeedback();
          this.loadClientInfo();
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
          this.feedbackList = res.sort((a, b) => b.timestamp - a.timestamp);
          this.clientStats = this.statsService.compute(res);
          this.clientPRs = this.prService.compute(res);
        },
        error: () => console.warn('No feedback found for this client.')
      });
  }

  loadClientInfo() {
    this.http.get<any>(`https://spite-backend-v2.onrender.com/api/users/username/${this.clientUsername}`)
      .subscribe({
        next: (res) => { this.clientInfo = res; },
        error: () => {}
      });
  }

  assignWorkout(workoutId: string) {
    const url =
      `${this.baseUrl}/assign?trainer=${this.trainerUsername}&client=${this.clientUsername}&workoutId=${workoutId}`;

    this.http.post(url, {}, { responseType: 'text' as 'json' })
      .subscribe({
        next: async () => {
          // Pitaj za napomenu nakon dodeljivanja
          this.promptNote(workoutId);
          this.loadClientWorkouts();
        },
        error: () => this.showAlert('Error assigning workout.')
      });
  }

  async promptNote(workoutId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Add a note',
      message: 'Leave a note for your client (optional)',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'note',
          type: 'textarea',
          placeholder: 'e.g. Focus on form, not weight...',
          attributes: { rows: 3 }
        }
      ],
      buttons: [
        { text: 'Skip', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            if (data.note?.trim()) {
              this.saveNote(workoutId, data.note.trim());
            }
          }
        }
      ]
    });
    await alert.present();
  }

  saveNote(workoutId: string, note: string) {
    this.http.put(
      `https://spite-backend-v2.onrender.com/api/workouts/assign/note?workoutId=${workoutId}&clientUsername=${this.clientUsername}&note=${encodeURIComponent(note)}`,
      {},
      { responseType: 'text' as 'json' }
    ).subscribe({ error: () => console.warn('Note save failed') });
  }

  async editNote(workout: any) {
    const alert = await this.alertCtrl.create({
      header: 'Edit note',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'note',
          type: 'textarea',
          value: workout.note || '',
          placeholder: 'Leave a note for your client...',
          attributes: { rows: 3 }
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.saveNote(workout.id, data.note?.trim() || '');
            workout.note = data.note?.trim() || '';
          }
        }
      ]
    });
    await alert.present();
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

  async openPR(pr: ExercisePR) {
    const modal = await this.modalCtrl.create({
      component: PRDetailModal,
      componentProps: { pr },
      cssClass: 'pr-modal-wrapper'
    });
    await modal.present();
  }

  async openCalendar() {
    const modal = await this.modalCtrl.create({
      component: WorkoutCalendarModal,
      componentProps: { feedbacks: this.feedbackList },
      cssClass: 'calendar-wrapper'
    });
    await modal.present();
  }

  getWorkoutName(fb: any): string {
    if (fb.workoutTitle) return fb.workoutTitle;
    const w = this.clientWorkouts.find((x: any) => x.id === fb.workoutId);
    return w ? w.title : 'Deleted workout';
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('sr-RS', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  avgIntensity(fb: any): string {
    if (!fb.exercises?.length) return '-';
    const map: any = { easy: 1, normal: 2, hard: 3 };
    const avg = fb.exercises.reduce((s: number, e: any) => s + (map[e.intensity] || 2), 0) / fb.exercises.length;
    if (avg < 1.5) return 'Easy';
    if (avg < 2.5) return 'Normal';
    return 'Hard';
  }

}

