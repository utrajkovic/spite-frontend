import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCard,
  IonCardContent, IonIcon, IonProgressBar, IonButtons, IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';
import { Workout, Exercise } from '../services/models';
import { AlertController } from '@ionic/angular';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  selector: 'app-workout',
  templateUrl: './workout.page.html',
  styleUrls: ['./workout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,

    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,

    IonSpinner,
    IonProgressBar,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonAlert
  ]

})
export class WorkoutPage implements OnInit {
  workout!: Workout;
  exercises: Exercise[] = [];
  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  currentExerciseIndex = 0;
  currentSet = 1;
  isResting = false;
  restTimeLeft = 0;
  timer: any = null;
  started = false;
  circumference = 2 * Math.PI * 45;
  totalRestTime = 1;
  restCallback?: Function;
  loading = true;
  private alertShown = false;
  isVideoLoading = false;


  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private router: Router,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;

    this.backend.getWorkoutById(id).subscribe({
      next: (workout) => {
        this.workout = workout;

        this.backend.getAllExercises().subscribe({
          next: (allExercises) => {
            this.exercises = workout.exerciseIds
              .map(id => allExercises.find(e => e.id === id))
              .filter((e): e is Exercise => !!e);

            console.log('🔍 Vežbe:', this.exercises);
            this.loading = false;

            if (this.exercises.length === 0 && !this.alertShown) {
              this.alertShown = true;
              this.showNoExercisesAlert();
            }
          },
          error: (err) => {
            console.error('❌ Greška pri učitavanju vežbi:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('❌ Greška pri učitavanju treninga:', err);
        this.loading = false;
      }
    });
  }

  startWorkout() {
    this.started = true;
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.isResting = false;
  }

  completeSet() {
    const exercise = this.exercises[this.currentExerciseIndex];

    if (this.currentSet < exercise.sets) {
      this.startRest(exercise.restBetweenSets, () => this.currentSet++);
    } else {
      this.startRest(exercise.restAfterExercise, () => this.nextExercise());
    }
  }

  startRest(seconds: number, callback: Function) {
    this.isResting = true;
    this.restTimeLeft = seconds;
    this.totalRestTime = seconds;
    this.restCallback = callback;

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.restTimeLeft--;
      if (this.restTimeLeft <= 0) {
        this.stopRest();
      }
    }, 1000);
  }

  skipRest() {
    clearInterval(this.timer);
    this.stopRest();
  }

  private stopRest() {
    clearInterval(this.timer);
    this.isResting = false;
    this.restTimeLeft = 0;

    if (this.restCallback) {
      this.restCallback();
      this.restCallback = undefined;
    }
  }

  nextExercise() {
    if (this.currentExerciseIndex < this.exercises.length - 1) {
      this.isVideoLoading = true;

      setTimeout(() => {
        this.currentExerciseIndex++;
        this.currentSet = 1;
        this.isVideoLoading = false;
      }, 800);
    } else {
      this.showAlert('✅ Training completed!');
      this.router.navigate(['/tabs/tab1']);
    }
  }


  goHome() {
    this.router.navigate(['/tabs/tab1']);
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: '',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showNoExercisesAlert() {
    const alert = await this.alertCtrl.create({
      header: 'No Exercises Found',
      message: 'Returning to workout list...',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/tabs/tab1']);
        }
      }],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
