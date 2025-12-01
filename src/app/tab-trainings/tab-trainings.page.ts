import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise, Workout } from '../services/models';

@Component({
  selector: 'app-tab-trainings',
  templateUrl: './tab-trainings.page.html',
  styleUrls: ['./tab-trainings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent
  ],
})
export class TabTrainingsPage implements OnInit {

  workout: Workout | null = null;
  previewList: {
    isSuperset: boolean,
    mainIndex: number,
    exercise: Exercise
  }[] = [];

  currentIndex = 0;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const w = nav?.extras.state?.['workout'];

    if (!w || !w.id) {
      this.router.navigateByUrl('/tabs/tab1');
      return;
    }

    await this.loadWorkout(w.id);
  }

  async loadWorkout(id: string) {
    const fresh = await this.http
      .get<Workout & { exercises?: Exercise[]; items?: any[]; exerciseIds?: string[] }>(
        `${this.backendUrl}/api/workouts/${id}`
      )
      .toPromise();

    if (!fresh) return;

    const rawExercises = fresh.exercises ?? [];
    const rawItems = fresh.items ?? [];

    const exMap = new Map(rawExercises.map((e) => [e.id, e]));

    this.previewList = [];

    rawItems.forEach((item: any, index: number) => {
      const main = exMap.get(item.exerciseId);
      if (main) {
        this.previewList.push({
          isSuperset: false,
          mainIndex: index + 1,
          exercise: main
        });
      }

      if (item.supersetExerciseId) {
        const sup = exMap.get(item.supersetExerciseId);
        if (sup) {
          this.previewList.push({
            isSuperset: true,
            mainIndex: index + 1,
            exercise: sup
          });
        }
      }
    });

    this.workout = fresh;
    this.currentIndex = 0;
  }

  // CURRENT EXERCISE
  get currentExercise(): Exercise | null {
    return this.previewList[this.currentIndex]?.exercise ?? null;
  }

  get isSupersetNow(): boolean {
    return this.previewList[this.currentIndex]?.isSuperset ?? false;
  }

  get currentMainIndex(): number {
    return this.previewList[this.currentIndex]?.mainIndex ?? 0;
  }

  // NAV
  goBack() {
    this.router.navigateByUrl('/tabs/tab1');
  }

  prevExercise() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextExercise() {
    if (this.currentIndex < this.previewList.length - 1) {
      this.currentIndex++;
    }
  }
}
