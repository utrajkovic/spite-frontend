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

  workout: (Workout & { exercises: Exercise[] }) | null = null;
  currentIndex = 0;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const w = nav?.extras.state?.['workout'];

    // Ako se uđe direktno bez state-a, vrati korisnika na listu
    if (!w || !w.id) {
      this.router.navigateByUrl('/tabs/tab1');
      return;
    }

    await this.loadWorkout(w.id);
  }

  async loadWorkout(id: string) {
    // povuci svež workout sa backenda
    const fresh = await this.http
      .get<Workout & { exercises?: Exercise[]; exerciseIds?: string[] }>(
        `${this.backendUrl}/api/workouts/${id}`
      )
      .toPromise();

    if (!fresh) return;

    const rawExercises = fresh.exercises ?? [];
    const rawIds = fresh.exerciseIds ?? [];

    const map = new Map(rawExercises.map((e: any) => [e.id, e]));

    const orderedExercises: Exercise[] = rawIds
      .map((exId: string) => map.get(exId))
      .filter((e: Exercise | undefined): e is Exercise => !!e);

    this.workout = {
      ...fresh,
      exercises: orderedExercises
    };

    this.currentIndex = 0;
  }

  get currentExercise(): Exercise | null {
    return this.workout?.exercises?.[this.currentIndex] ?? null;
  }

  goBack() {
    this.router.navigateByUrl('/tabs/tab1');
  }

  prevExercise() {
    if (!this.workout) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  nextExercise() {
    if (!this.workout) return;
    if (this.currentIndex < this.workout.exercises.length - 1) {
      this.currentIndex++;
    }
  }
}
