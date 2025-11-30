import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonButton,
  IonList, IonSearchbar, IonSpinner, IonReorderGroup, IonReorder, IonAlert
} from '@ionic/angular/standalone';

import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

import { Exercise } from '../services/models';
import { LocalDataService } from '../services/local-data.service';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

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
    IonSpinner,
    IonReorderGroup,
    IonReorder,
    IonAlert
  ]
})

export class Tab2Page implements OnInit {

  tab: 'exercise' | 'workout' = 'exercise';

  exerciseForm: FormGroup;
  workoutForm: FormGroup;

  selectedVideo: File | null = null;
  allExercises: Exercise[] = [];
  editableExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchQuery = '';

  isSavingExercise = false;
  isSavingWorkout = false;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private localData: LocalDataService,
    private alertCtrl: AlertController
  ) {

    this.exerciseForm = this.fb.group({
      name: [''],
      description: [''],
      sets: [3],
      reps: ['10'],
      restBetweenSets: [60],
      restAfterExercise: [180],
      videoUrl: ['']
    });

    this.workoutForm = this.fb.group({
      title: [''],
      subtitle: [''],
      content: ['']
    });
  }

  async ngOnInit() {
    await this.loadExercises();
    this.filterList();
  }

  async loadExercises() {
    const user = await this.localData.getUser();
    if (!user) return;

    try {
      this.allExercises = await this.http
        .get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
        .toPromise() ?? [];
    } catch {
      this.allExercises = [];
    }
  }

  onSearch(ev: any) {
    this.searchQuery = ev.target.value?.toLowerCase() ?? '';
    this.filterList();
  }

  filterList() {
    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(this.searchQuery) &&
      !this.editableExercises.some(e => e.id === ex.id)
    );
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
    this.filterList();
  }

  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
    this.filterList();
  }

  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;
    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);
    ev.detail.complete();
  }

  onVideoSelected(ev: any) {
    this.selectedVideo = ev.target.files?.[0] ?? null;
  }

  async saveExercise() {
    if (this.isSavingExercise) return;

    const value = this.exerciseForm.value;

    if (!value.name || value.name.trim().length < 1) {
      return this.showAlert("Exercise must have a name.");
    }

    if (!value.description || value.description.trim().length < 1) {
      return this.showAlert("Description cannot be empty.");
    }

    if (!value.sets || !value.reps) {
      return this.showAlert("Sets and reps must be provided.");
    }

    this.isSavingExercise = true;

    const user = await this.localData.getUser();
    if (!user) {
      this.isSavingExercise = false;
      return this.showAlert('User error');
    }

    const ex = value;
    ex.userId = user.id;

    if (this.selectedVideo) {
      try {
        const form = new FormData();
        form.append('video', this.selectedVideo);

        ex.videoUrl = await this.http.post(
          `${this.backendUrl}/api/exercises/upload`,
          form,
          { responseType: 'text' }
        ).toPromise() ?? '';

      } catch {
        this.isSavingExercise = false;
        return this.showAlert('Video upload failed.');
      }
    }

    try {
      await this.http.post(`${this.backendUrl}/api/exercises`, ex).toPromise();
      this.showAlert('Exercise added!');
    } catch {
      this.showAlert('Error adding exercise.');
    }

    this.exerciseForm.reset({
      sets: 3,
      reps: '10',
      restBetweenSets: 60,
      restAfterExercise: 180
    });

    this.selectedVideo = null;
    this.isSavingExercise = false;

    await this.loadExercises();
    this.filterList();
  }

  async saveNewWorkout() {
    if (this.isSavingWorkout) return;

    const value = this.workoutForm.value;

    if (!value.title || value.title.trim().length === 0) {
      return this.showAlert("Workout must have a title.");
    }

    if (this.editableExercises.length === 0) {
      return this.showAlert("Workout must have at least 1 exercise.");
    }

    this.isSavingWorkout = true;

    const user = await this.localData.getUser();
    if (!user) {
      this.isSavingWorkout = false;
      return;
    }

    const body = {
      ...value,
      exerciseIds: this.editableExercises.map(ex => ex.id!),
      userId: user.id
    };

    try {
      await this.http.post(`${this.backendUrl}/api/workouts`, body).toPromise();
      this.showAlert('Workout created!');

      this.workoutForm.reset();
      this.editableExercises = [];
      this.filterList();

    } catch {
      this.showAlert('Failed to create workout');
    }

    this.isSavingWorkout = false;
  }

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    a.present();
  }
}
