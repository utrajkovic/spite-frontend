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

  private restStartedAt = 0;
  private restDuration = 0;
  private restCallback: Function = () => {};
  private visibilityHandler: any = null;

  started = false;
  isVideoLoading = false;

  circleLength = 2 * Math.PI * 45;

  private pendingRestCallback: Function = () => {};
  private audioUnlocked = false;

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
    this.unlockVideoPlayback();
    const id = this.route.snapshot.paramMap.get('id')!;
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

        if (saved && saved.workoutId === id) {
          this.offerResume(saved);
        }
      },
      error: () => {
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

  // Otključava video autoplay u PWA standalone modu (iOS home screen)
  private unlockVideoPlayback() {
    if (this.audioUnlocked) return;
    const unlock = () => {
      if (this.audioUnlocked) return;
      this.audioUnlocked = true;
      document.querySelectorAll<HTMLVideoElement>('video').forEach(v => {
        v.play().then(() => v.pause()).catch(() => {});
      });
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock);
  }

  // Poziva se iz (loadedmetadata) — radi na mobilnom jer je video učitan nakon korisničke akcije
  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.play().catch(() => {});
  }

  // Ručni play svih videa — poziva se posle Done / Skip Rest / prelaska na sledeću vežbu
  private playCurrentVideo() {
    setTimeout(() => {
      const videos = document.querySelectorAll<HTMLVideoElement>('video.ex-video');
      videos.forEach(v => v.play().catch(() => {}));
    }, 500);
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
          handler: () => { this.workoutState.clear(); }
        },
        {
          text: 'Continue',
          handler: () => { this.restoreFromState(saved); }
        }
      ]
    });
    await alert.present();
  }

  private restoreFromState(saved: ActiveWorkoutState) {
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

  getExerciseById(id: string | undefined | null): Exercise | undefined {
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
    this.playCurrentVideo();
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
          this.playCurrentVideo();
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
        this.playCurrentVideo();
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
    setTimeout(() => {
      this.isVideoLoading = false;
      this.playCurrentVideo();
    }, 500);
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
        this.playCurrentVideo();
      }, 700);
    } else {
      await this.finishWorkout(false);
    }
  }

  // ==========================
  // FINISH EARLY
  // ==========================

  async finishEarly() {
    const alert = await this.alertCtrl.create({
      header: 'Finish workout?',
      message: `You've completed ${this.completionPercent}% of the workout. Are you sure you want to finish early?`,
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Continue', role: 'cancel' },
        { text: 'Finish', handler: () => this.finishWorkout(true) }
      ]
    });
    await alert.present();
  }

  get completionPercent(): number {
    if (!this.items.length) return 0;
    return Math.round((this.currentIndex / this.items.length) * 100);
  }

  get completedItemsCount(): number {
    return this.currentIndex;
  }

  // ==========================
  // FINISH WORKOUT
  // ==========================

  private async finishWorkout(early = false) {
    clearInterval(this.timer);
    this.isResting = false;
    this.workoutState.clear();
    this.notificationService.scheduleInactivityReminder(3).catch(() => {});

    // Sačuvaj completed workout zapis
    const userId = localStorage.getItem('username') ?? JSON.parse(localStorage.getItem('user') ?? '{}').username ?? '';
    this.backend.saveCompletedWorkout({
      username: userId,
      workoutId: this.workout.id!,
      workoutTitle: this.workout.title,
      completedAt: Date.now(),
      hasFeedback: false
    }).subscribe({ error: () => {} });

    // KORAK 1: Notifikacija "Trening završen"
    const doneAlert = await this.alertCtrl.create({
      header: '🎉 Workout Complete!',
      message: early
        ? `You finished ${this.completionPercent}% of the workout. Great effort!`
        : 'Amazing job! You completed the full workout!',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Skip Feedback',
          role: 'cancel',
          cssClass: 'alert-button-skip',
          handler: () => {
            this.router.navigate(['/tabs/tab1']);
          }
        },
        {
          text: 'Leave Feedback',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.openFeedbackModal(early);
          }
        }
      ]
    });
    await doneAlert.present();
  }

  // KORAK 2: Feedback modal (samo ako korisnik odabere)
  private async openFeedbackModal(early = false) {
    const completedItems = early
      ? this.items.slice(0, this.currentIndex)
      : this.items;

    const exerciseList = completedItems.map(item => {
      const ex = this.exercises.find(e => e.id === item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        name: ex?.name ?? 'Exercise',
        sets: item.sets,
        reps: item.reps
      };
    });

    const totalItems = this.items.length;
    const completedCount = completedItems.length;
    const percent = Math.round((completedCount / totalItems) * 100);

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
        completionPercent: percent,
        exercises: feedback
      };

      this.backend.sendWorkoutFeedback(feedbackPayload).subscribe({
        next: () => console.log('Feedback saved'),
        error: () => { this.workoutState.savePendingFeedback(feedbackPayload); }
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
    }, 500);
  }

  private syncRestTimer() {
    if (!this.isResting) return;

    const elapsed = (Date.now() - this.restStartedAt) / 1000;
    const remaining = Math.max(0, this.restDuration - elapsed);
    const prevLeft = this.restLeft;
    this.restLeft = Math.ceil(remaining);

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
    this.playCurrentVideo();
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