import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonButton, IonCard, IonCardContent,
  IonSpinner, IonProgressBar, IonIcon
} from '@ionic/angular/standalone';

import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';
import { WorkoutStateService, ActiveWorkoutState } from '../services/workout-state.service';
import { NotificationService } from '../services/notification.service';
import { RestFeedbackService } from '../services/rest-feedback.service';
import { Workout, WorkoutItem, Exercise } from '../services/models';
import { AlertController, ModalController } from '@ionic/angular';
import { WorkoutFeedbackModal } from '../modals/workout-feedback.modal';

@Component({
  selector: 'app-workout',
  templateUrl: './workout.page.html',
  styleUrls: ['./workout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonButton, IonCard, IonCardContent,
    IonSpinner, IonProgressBar, IonIcon,
    WorkoutFeedbackModal
  ],
  providers: [ModalController]
})
export class WorkoutPage implements OnInit, OnDestroy {

  workout!: Workout;
  items: WorkoutItem[] = [];
  exercises: Exercise[] = [];

  loading = true;

  currentIndex = 0;
  currentSet = 1;
  showingSuperset = false;

  isResting = false;
  restLeft = 0;
  totalRest = 0;
  timer: any;

  private restStartedAt = 0;      // timestamp kad je odmor počeo
  private restDuration = 0;       // ukupno trajanje odmora
  private restCallback: Function = () => {};
  private visibilityHandler: any = null;

  started = false;
  isVideoLoading = false;

  circleLength = 2 * Math.PI * 45;

  private pendingRestCallback: Function = () => {};

  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private workoutState: WorkoutStateService,
    private notificationService: NotificationService,
    private restFeedback: RestFeedbackService,
    private router: Router,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    // Provjeri da li postoji sačuvan state za ovaj workout
    const saved = this.workoutState.load();

    this.backend.getWorkoutById(id).subscribe({
      next: (workout) => {
        this.workout = workout;
        this.items = workout.items ?? [];
        this.exercises = workout.exercises ?? [];
        this.loading = false;

        if (this.items.length === 0) {
          this.showAlert('No exercises in workout.');
          this.router.navigate(['/tabs/tab1']);
          return;
        }

        // Ako postoji sačuvan state za isti workout, ponudi nastavak
        if (saved && saved.workoutId === id) {
          this.offerResume(saved);
        }
      },
      error: () => {
        // Offline: pokušaj da učitamo iz sačuvanog state-a
        if (saved && saved.workoutId === id) {
          this.restoreFromState(saved);
          this.loading = false;
        } else {
          this.loading = false;
          this.showAlert('Error loading workout. Check your connection.');
        }
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private async offerResume(saved: ActiveWorkoutState) {
    const alert = await this.alertCtrl.create({
      header: 'Resume workout?',
      message: 'You have an unfinished workout. Do you want to continue where you left off?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Start over',
          role: 'cancel',
          handler: () => {
            this.workoutState.clear();
          }
        },
        {
          text: 'Continue',
          handler: () => {
            this.restoreFromState(saved);
          }
        }
      ]
    });
    await alert.present();
  }

  private restoreFromState(saved: ActiveWorkoutState) {
    // Ako smo učitali workout sa servera, koristimo te podatke ali vraćamo poziciju
    if (saved.exercises?.length && this.exercises.length === 0) {
      this.exercises = saved.exercises;
    }
    if (saved.items?.length && this.items.length === 0) {
      this.items = saved.items;
    }
    this.currentIndex = saved.currentIndex;
    this.currentSet = saved.currentSet;
    this.showingSuperset = saved.showingSuperset;
    this.started = true;
  }

  private persistState() {
    if (!this.started || !this.workout) return;
    this.workoutState.save({
      workoutId: this.workout.id!,
      workoutTitle: this.workout.title,
      items: this.items,
      exercises: this.exercises,
      currentIndex: this.currentIndex,
      currentSet: this.currentSet,
      showingSuperset: this.showingSuperset,
      startedAt: Date.now()
    });
  }

  // ==========================
  // GETTERS
  // ==========================

  get currentItem(): WorkoutItem {
    return this.items[this.currentIndex];
  }

  get hasSupersetForCurrent(): boolean {
    return !!this.currentItem?.supersetExerciseId;
  }

  get currentExercise(): Exercise | undefined {
    if (!this.showingSuperset || !this.currentItem.supersetExerciseId) {
      return this.getExerciseById(this.currentItem.exerciseId);
    }
    return this.getExerciseById(this.currentItem.supersetExerciseId);
  }

  get supersetExerciseName(): string | null {
    if (!this.currentItem?.supersetExerciseId) return null;
    return this.getExerciseById(this.currentItem.supersetExerciseId)?.name ?? null;
  }

  get nextItem(): WorkoutItem | null {
    return this.currentIndex < this.items.length - 1
      ? this.items[this.currentIndex + 1]
      : null;
  }

  get nextMainExercise(): Exercise | null {
    const ni = this.nextItem;
    return ni ? (this.getExerciseById(ni.exerciseId) ?? null) : null;
  }

  get circumference() { return this.circleLength; }
  get currentExerciseIndex() { return this.currentIndex; }
  get restTimeLeft() { return this.restLeft; }
  get totalRestTime() { return this.totalRest; }

  private getExerciseById(id: string | undefined | null): Exercise | undefined {
    if (!id) return undefined;
    return this.exercises.find(e => e.id === id);
  }

  // ==========================
  // START
  // ==========================

  startWorkout() {
    this.started = true;
    this.currentIndex = 0;
    this.currentSet = 1;
    this.showingSuperset = false;
    this.persistState();
  }

  // ==========================
  // COMPLETE SET
  // ==========================

  completeSet() {
    const item = this.currentItem;
    const hasSuperset = !!item.supersetExerciseId;

    if (!hasSuperset) {
      if (this.currentSet < item.sets) {
        this.startRest(item.restBetweenSets, () => {
          this.currentSet++;
          this.persistState();
        });
      } else {
        this.startRest(item.restAfterExercise, () => {
          this.currentSet = 1;
          this.showingSuperset = false;
          this.goToNextItem();
        });
      }
      return;
    }

    if (!this.showingSuperset) {
      this.showSuperset();
      return;
    }

    if (this.currentSet < item.sets) {
      this.startRest(item.restBetweenSets, () => {
        this.currentSet++;
        this.showingSuperset = false;
        this.persistState();
      });
    } else {
      this.startRest(item.restAfterExercise, () => {
        this.currentSet = 1;
        this.showingSuperset = false;
        this.goToNextItem();
      });
    }
  }

  private showSuperset() {
    this.showingSuperset = true;
    this.isVideoLoading = true;
    setTimeout(() => { this.isVideoLoading = false; }, 500);
  }

  private async goToNextItem() {
    if (this.currentIndex < this.items.length - 1) {
      this.isVideoLoading = true;
      setTimeout(() => {
        this.currentIndex++;
        this.currentSet = 1;
        this.showingSuperset = false;
        this.isVideoLoading = false;
        this.persistState();
      }, 700);
    } else {
      await this.finishWorkout();
    }
  }

  private async finishWorkout() {
    // Čistimo state - trening je završen
    this.workoutState.clear();
    // Zakažemo inactivity reminder za 3 dana
    this.notificationService.scheduleInactivityReminder(3).catch(() => {});

    const exerciseList = this.items.map(item => {
      const ex = this.exercises.find(e => e.id === item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        name: ex?.name ?? 'Exercise',
        sets: item.sets,
        reps: item.reps
      };
    });

    // Otvaramo feedback modal PRE navigacije
    const modal = await this.modalCtrl.create({
      component: WorkoutFeedbackModal,
      cssClass: 'feedback-transparent',
      componentProps: { exercises: exerciseList }
    });

    await modal.present();
    const result = await modal.onDidDismiss();
    const feedback = result.data;

    if (feedback) {
      const userId = localStorage.getItem('username') ?? JSON.parse(localStorage.getItem('user') ?? '{}').username ?? '';
      const feedbackPayload = {
        workoutId: this.workout.id!,
        workoutTitle: this.workout.title,
        userId,
        timestamp: Date.now(),
        exercises: feedback
      };

      this.backend.sendWorkoutFeedback(feedbackPayload).subscribe({
        next: () => console.log('Feedback saved'),
        error: () => {
          // Offline: sačuvaj lokalno, poslaćemo kad se veza vrati
          this.workoutState.savePendingFeedback(feedbackPayload);
          console.warn('Offline - feedback saved locally, will sync later');
        }
      });
    }

    this.router.navigate(['/tabs/tab1']);
  }

  // ==========================
  // REST TIMER
  // ==========================

  startRest(seconds: number, callback: Function) {
    this.showingSuperset = false;
    this.pendingRestCallback = callback;
    this.restCallback = callback;
    this.isResting = true;
    this.restLeft = seconds;
    this.totalRest = seconds;
    this.restDuration = seconds;
    this.restStartedAt = Date.now();

    this.restFeedback.onRestStart();

    // Registruj visibility handler - kad se app vrati iz pozadine
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.visibilityHandler = () => {
      if (!document.hidden && this.isResting) {
        this.syncRestTimer();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.syncRestTimer();
    }, 500); // češće tickovanje za tačnost
  }

  private syncRestTimer() {
    if (!this.isResting) return;

    const elapsed = (Date.now() - this.restStartedAt) / 1000;
    const remaining = Math.max(0, this.restDuration - elapsed);
    const prevLeft = this.restLeft;
    this.restLeft = Math.ceil(remaining);

    // Countdown feedback samo kad pređemo celu sekundu
    if (Math.ceil(prevLeft) !== Math.ceil(remaining) && remaining > 0 && remaining <= 3) {
      this.restFeedback.onRestCountdown();
    }

    if (remaining <= 0) {
      this.stopRest(this.restCallback);
    }
  }

  skipRest() {
    this.showingSuperset = false;
    this.stopRest(this.pendingRestCallback);
  }

  private stopRest(callback: Function) {
    clearInterval(this.timer);
    this.isResting = false;
    this.restLeft = 0;

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    this.restFeedback.onRestEnd();
    callback();
  }

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await a.present();
  }
}
