import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonItem, IonLabel, IonInput, IonButton, IonList,
  IonReorderGroup, IonReorder, IonButtons, IonSpinner, IonSearchbar
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise, Workout } from '../services/models';
import { AlertController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';
import { FormsModule } from '@angular/forms';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  standalone: true,
  selector: 'app-tab-edit',
  templateUrl: './tab-edit.page.html',
  styleUrls: ['./tab-edit.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonList,
    IonSearchbar,
    IonReorderGroup,
    IonReorder,
    IonButtons,
    IonSpinner,
    IonAlert
  ]
})
export class TabEditPage implements OnInit {

  workoutId: string | null = null;
  workout!: Workout;

  editableExercises: Exercise[] = [];
  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];

  searchQuery: string = '';
  isSaving: boolean = false;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private localData: LocalDataService,
    public router: Router
  ) { }

  async ngOnInit() {
    this.workoutId = this.route.snapshot.paramMap.get('id');

    if (!this.workoutId) {
      this.workout = {
        id: '',
        title: '',
        subtitle: '',
        content: '',
        exercises: [],
        exerciseIds: []
      } as Workout;

      await this.loadAllUserExercises();
      this.filterList();
      return;
    }

    await this.loadWorkout();
    await this.loadAllUserExercises();
    this.filterList();
  }


  async loadWorkout() {
    const response = await fetch(`${this.backendUrl}/api/workouts/${this.workoutId}`);

    if (!response.ok) {
      console.error('Workout not found or backend error');
      return;
    }

    const data = await response.json();

    this.workout = data;

    const rawExercises = data.exercises ?? [];
    const rawIds = data.exerciseIds ?? [];

    const map = new Map(rawExercises.map((e: any) => [e.id, e]));

    this.editableExercises = rawIds
      .map((id: string) => map.get(id))
      .filter((e: Exercise | undefined): e is Exercise => !!e);

  }

  // -------------------------------------
  // LOAD ALL USER EXERCISES
  // -------------------------------------
  async loadAllUserExercises() {
    const user = await this.localData.getUser();
    this.allExercises =
      await this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`).toPromise()
      ?? [];
  }

  // -------------------------------------
  // SEARCH & FILTER
  // -------------------------------------
  onSearch(ev: any) {
    this.searchQuery = ev.target.value?.toLowerCase() || '';
    this.filterList();
  }

  filterList() {
    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(this.searchQuery) &&
      !this.editableExercises.some(e => e.id === ex.id)
    );
  }

  // -------------------------------------
  // EDITING EXERCISE LIST
  // -------------------------------------
  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;
    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);
    ev.detail.complete();
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
    this.filterList();
  }

  removeExercise(i: number) {
    const removed = this.editableExercises[i];
    this.editableExercises.splice(i, 1);

    if (removed) this.filterList();
  }


  async saveChanges() {
    this.isSaving = true;

    const user = await this.localData.getUser();

    const payload = {
      title: this.workout.title,
      subtitle: this.workout.subtitle,
      content: this.workout.content,
      exerciseIds: this.editableExercises.map(e => e.id!),
      userId: user.id
    };

    try {
      if (!this.workoutId) {
        await this.http.post(`${this.backendUrl}/api/workouts`, payload).toPromise();
      } else {
        await this.http.put(`${this.backendUrl}/api/workouts/${this.workoutId}`, payload).toPromise();
      }

      const alert = await this.alertCtrl.create({
        message: this.workoutId ? 'Workout updated!' : 'Workout created!',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });
      await alert.present();

      this.localData.triggerTab3Refresh();
      this.router.navigateByUrl('/tabs/tab3');

    } catch (err) {
      console.error(err);

      const alert = await this.alertCtrl.create({
        message: 'Failed to save workout.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.isSaving = false;
    }
  }


}
