import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCard,
  IonCardContent, IonIcon, IonProgressBar, IonButtons, IonSpinner
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';
import { Workout, Exercise } from '../services/models';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-workout',
  templateUrl: './workout.page.html',
  styleUrls: ['./workout.page.scss'],
  standalone: true,
  imports: [IonSpinner,
    IonButtons, IonProgressBar, IonIcon, CommonModule, IonContent,
    IonHeader, IonTitle, IonToolbar, IonButton, IonCard, IonCardContent
  ],
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

  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.backend.getWorkoutById(id).subscribe({
      next: (workout) => {
        this.workout = workout;

        this.backend.getAllExercises().subscribe({
          next: (allExercises) => {
            this.exercises = workout.exerciseIds
              .map(id => allExercises.find(e => e.id == id))
              .filter((e): e is Exercise => !!e);
            console.log('🔍 Vežbe:', this.exercises);
            this.loading = false;
          },
          error: (err) => {
            console.error('Greška pri učitavanju vežbi:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Greška pri učitavanju treninga:', err);
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
      this.currentExerciseIndex++;
      this.currentSet = 1;
    } else {
      this.showToast('Trening gotov');
      this.router.navigate(['/tabs/tab1']);
    }
  }

  goHome() {
    this.router.navigate(['/tabs/tab1']);
  }
  getVideoUrl(videoUrl: string | null | undefined): string {
    if (!videoUrl) return '';
    if (videoUrl.startsWith('http')) {
      return videoUrl;
    }
    return `${this.backendUrl}${videoUrl}`;
  }
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'middle',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

}
