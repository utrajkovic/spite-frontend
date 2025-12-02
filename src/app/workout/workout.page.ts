import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonButton, IonCard, IonCardContent,
  IonSpinner, IonProgressBar, IonIcon
} from '@ionic/angular/standalone';

import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../services/backend.service';
import { Workout, WorkoutItem, Exercise } from '../services/models';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-workout',
  templateUrl: './workout.page.html',
  styleUrls: ['./workout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonProgressBar,
    IonIcon
  ]
})
export class WorkoutPage implements OnInit {

  workout!: Workout;
  items: WorkoutItem[] = [];
  exercises: Exercise[] = [];

  loading = true;

  currentIndex = 0;  // index u items
  currentSet = 1;    // 1..sets

  // da li trenutno gledamo SUPERSET vežbu za ovaj item
  showingSuperset = false;

  isResting = false;
  restLeft = 0;
  totalRest = 0;
  timer: any;

  started = false;
  isVideoLoading = false;

  circleLength = 2 * Math.PI * 45;

  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private router: Router,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.backend.getWorkoutById(id).subscribe({
      next: (workout) => {
        this.workout = workout;
        this.items = workout.items ?? [];
        this.exercises = workout.exercises ?? [];

        this.loading = false;

        if (this.items.length === 0) {
          this.showAlert('No exercises in workout.');
          this.router.navigate(['/tabs/tab1']);
        }
      },
      error: () => {
        this.loading = false;
        this.showAlert('Error loading workout.');
      }
    });
  }

  // ==========================
  // GETTERS
  // ==========================

  get currentExerciseIndex() {
    // samo radi progress bara (1..items.length)
    return this.currentIndex;
  }

  get restTimeLeft() {
    return this.restLeft;
  }

  get totalRestTime() {
    return this.totalRest;
  }

  get circumference() {
    return this.circleLength;
  }

  get currentItem(): WorkoutItem {
    return this.items[this.currentIndex];
  }

  get hasSupersetForCurrent(): boolean {
    return !!this.currentItem?.supersetExerciseId;
  }

  // helper: nađi vežbu po id-ju
  private getExerciseById(id: string | undefined | null): Exercise | undefined {
    if (!id) return undefined;
    return this.exercises.find(e => e.id === id);
  }

  // Naziv superset vežbe za prikaz u UI
  get supersetExerciseName(): string | null {
    if (!this.currentItem?.supersetExerciseId) return null;
    const ex = this.getExerciseById(this.currentItem.supersetExerciseId);
    return ex?.name ?? null;
  }

  // koja vežba se trenutno prikazuje (main ili superset)
  get currentExercise(): Exercise | undefined {
    if (!this.showingSuperset || !this.currentItem.supersetExerciseId) {
      return this.getExerciseById(this.currentItem.exerciseId);
    }
    return this.getExerciseById(this.currentItem.supersetExerciseId);
  }

  // sledeći item & vežba (za “Next exercise” preview)
  get nextItem(): WorkoutItem | null {
    if (this.currentIndex < this.items.length - 1) {
      return this.items[this.currentIndex + 1];
    }
    return null;
  }

  get nextMainExercise(): Exercise | null {
    const ni = this.nextItem;
    if (!ni) return null;
    return this.getExerciseById(ni.exerciseId) ?? null;
  }

  // ==========================
  // START
  // ==========================

  startWorkout() {
    this.started = true;
    this.currentIndex = 0;
    this.currentSet = 1;
    this.showingSuperset = false;
  }

  // ==========================
  // MAIN LOGIKA: COMPLETE SET
  // ==========================

  completeSet() {
    const item = this.currentItem;
    const hasSuperset = !!item.supersetExerciseId;

    // ------------------------------
    // 1) NEMA SUPERSETA → kao ranije
    // ------------------------------
    if (!hasSuperset) {
      if (this.currentSet < item.sets) {
        // mala pauza između SERIJA
        this.startRest(item.restBetweenSets, () => {
          this.currentSet++;
        });
      } else {
        // završene sve serije → VELIKA pauza → sledeći item
        this.startRest(item.restAfterExercise, () => {
          this.currentSet = 1;
          this.showingSuperset = false;
          this.goToNextItem();
        });
      }
      return;
    }

    // ------------------------------
    // 2) IMA SUPERSET
    // ------------------------------

    // Ako trenutno gledamo GLAVNU vežbu → odmah prebaci na superset (bez pauze)
    if (!this.showingSuperset) {
      this.showSuperset();
      return;
    }

    // Ako smo OVDE, znači: trenutno smo na SUPERSET vežbi
    // Sad odlučujemo da li ima još setova ili je kraj glavne vežbe

    if (this.currentSet < item.sets) {
      // još setova glavne → posle superseta ide mala pauza,
      // pa se vraćamo na GLAVNU vežbu sa sledećim setom
      this.startRest(item.restBetweenSets, () => {
        this.currentSet++;
        this.showingSuperset = false; // vrati se na main
      });
    } else {
      // NEMA više setova → ovo je bio poslednji superset u poslednjoj seriji
      // posle ovoga ide VELIKA pauza, pa sledeći item
      this.startRest(item.restAfterExercise, () => {
        this.currentSet = 1;
        this.showingSuperset = false;
        this.goToNextItem();
      });
    }
  }

  // prikaži superset vežbu (bez pauze)
  private showSuperset() {
    this.showingSuperset = true;
    this.isVideoLoading = true;

    setTimeout(() => {
      this.isVideoLoading = false;
    }, 500);
  }

  // prelazak na sledeći WorkoutItem
  private goToNextItem() {
    if (this.currentIndex < this.items.length - 1) {
      this.isVideoLoading = true;
      setTimeout(() => {
        this.currentIndex++;
        this.currentSet = 1;
        this.showingSuperset = false;
        this.isVideoLoading = false;
      }, 700);
    } else {
      this.showAlert('Workout completed!');
      this.router.navigate(['/tabs/tab1']);
    }
  }

  // ==========================
  // REST TIMER
  // ==========================
  private pendingRestCallback: Function = () => { };

  startRest(seconds: number, callback: Function) {
    this.showingSuperset = false;
    this.pendingRestCallback = callback;
    this.isResting = true;
    this.restLeft = seconds;
    this.totalRest = seconds;

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.restLeft--;
      if (this.restLeft <= 0) {
        this.stopRest(callback);
      }
    }, 1000);
  }

  skipRest() {
    this.showingSuperset = false;
    this.stopRest(this.pendingRestCallback);
  }


  private stopRest(callback: Function) {
    clearInterval(this.timer);
    this.isResting = false;
    this.restLeft = 0;
    callback();
  }

  // ==========================
  // ALERT
  // ==========================

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await a.present();
  }
}
