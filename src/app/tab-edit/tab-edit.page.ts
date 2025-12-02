import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput,
  IonButton, IonList, IonSearchbar, IonReorderGroup, IonReorder, IonButtons,
  IonSpinner, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Exercise, Workout, WorkoutItem } from '../services/models';
import { LocalDataService } from '../services/local-data.service';
import { ExerciseSettingsModalComponent } from '../exercise-settings-modal/exercise-settings-modal.component';
import { ModalController } from '@ionic/angular';

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
    IonSelect,
    IonSelectOption,
    ExerciseSettingsModalComponent
  ],
  providers: [ModalController]

})
export class TabEditPage implements OnInit {

  workoutId!: string;
  workout!: Workout;

  editableExercises: Exercise[] = [];
  workoutItems: WorkoutItem[] = [];

  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];

  searchQuery = '';
  isSaving = false;
  loaded = false;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    public router: Router,
    private localData: LocalDataService,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    this.workoutId = this.route.snapshot.paramMap.get('id')!;
    await this.loadWorkout();
    await this.loadAllUserExercises();
    this.filterList();
    this.loaded = true;
  }

  async loadWorkout() {

    const w = await this.http
      .get<Workout | null>(`${this.backendUrl}/api/workouts/${this.workoutId}`)
      .toPromise()
      .catch(() => null);

    if (!w) {
      this.workout = {
        id: this.workoutId,
        title: '',
        subtitle: '',
        content: '',
        items: [],
        exercises: [],
        exerciseIds: []
      };
      this.editableExercises = [];
      this.workoutItems = [];
      return;
    }

    this.workout = w;

    const map = new Map((w.exercises ?? []).map(e => [e.id, e]));

    this.editableExercises = w.items!.map(item => map.get(item.exerciseId)!);

    this.workoutItems = w.items!.map(it => ({
      exerciseId: it.exerciseId,
      sets: it.sets,
      reps: it.reps,
      restBetweenSets: it.restBetweenSets,
      restAfterExercise: it.restAfterExercise,
      supersetExerciseId: it.supersetExerciseId ?? ''
    }));
  }



  async loadAllUserExercises() {
    const user = await this.localData.getUser();
    this.allExercises =
      await this.http
        .get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
        .toPromise() ?? [];
  }

  getExerciseNameById(id: string | null | undefined): string {
    if (!id) return 'None';
    return this.allExercises.find(e => e.id === id)?.name ?? 'Unknown';
  }

  onSearch(ev: any) {
    this.searchQuery = ev.target.value?.toLowerCase() || '';
    this.filterList();
  }

  filterList() {
    const q = this.searchQuery.toLowerCase();

    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(q)
    );
  }


  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;

    const ex = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, ex);

    const item = this.workoutItems.splice(from, 1)[0];
    this.workoutItems.splice(to, 0, item);

    ev.detail.complete();
    this.editableExercises = [...this.editableExercises];
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);

    this.workoutItems.push({
      exerciseId: ex.id!,
      sets: 3,
      reps: '10',
      restBetweenSets: 60,
      restAfterExercise: 120,
      supersetExerciseId: ''
    });

    this.filterList();
  }

  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
    this.workoutItems.splice(i, 1);
    this.filterList();
  }

  async saveChanges() {
    this.isSaving = true;

    const body = {
      title: this.workout.title,
      subtitle: this.workout.subtitle,
      content: this.workout.content,
      exerciseIds: this.editableExercises.map(e => e.id!),
      items: this.workoutItems
    };

    try {
      await this.http.put(`${this.backendUrl}/api/workouts/${this.workoutId}`, body).toPromise();

      const a = await this.alertCtrl.create({
        message: 'Workout updated!',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });
      await a.present();

      this.localData.triggerTab3Refresh();
      this.localData.triggerTab1Refresh();
      this.localData.triggerWorkoutRefresh();

      this.router.navigateByUrl('/tabs/tab3');

    } catch (err) {
      console.error(err);

      const a = await this.alertCtrl.create({
        message: 'Failed to update workout',
        buttons: ['OK']
      });
      a.present();

    } finally {
      this.isSaving = false;
    }
  }
  async openExerciseModal(i: number) {
    const modal = await this.modalCtrl.create({
      component: ExerciseSettingsModalComponent,
      componentProps: {
        item: this.workoutItems[i],
        exercise: this.editableExercises[i]
      },
      cssClass: 'exercise-modal'
    });

    await modal.present();

    const result = await modal.onDidDismiss();

    if (result.data) {
      this.workoutItems[i] = result.data;
    }
  }

}
