import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonButton,
  IonList, IonSearchbar, IonSpinner, IonReorderGroup, IonReorder
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';

import { Exercise } from '../services/models';
import { AlertController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';
import { IonAlert } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';



@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,

    IonContent, IonHeader, IonToolbar, IonTitle,
    IonItem, IonLabel, IonInput, IonButton,
    IonList, IonSearchbar, IonSpinner,
    IonReorderGroup, IonReorder, IonAlert
  ]
})
export class Tab2Page implements OnInit {

  tab: 'exercise' | 'workout' = 'exercise';

  // -------------------------
  // ADD EXERCISE
  // -------------------------
  exerciseForm: FormGroup;
  selectedVideo: File | null = null;
  isSavingExercise = false;

  // -------------------------
  // NEW WORKOUT
  // -------------------------
  newWorkout = { title: '', subtitle: '', content: '' };
  editableExercises: Exercise[] = [];
  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchQuery = '';
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

  }

  async ngOnInit() {
    console.log('[TAB2] TEST: ngOnInit PRAZAN');
  }


  // -------------------------
  // LOAD ALL USER EXERCISES
  // -------------------------
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

  // -------------------------
  // ADD EXERCISE
  // -------------------------
  async onVideoSelected(ev: any) {
    this.selectedVideo = ev.target.files?.[0] ?? null;
  }

  async saveExercise() {
    if (this.isSavingExercise) return;
    this.isSavingExercise = true;

    const user = await this.localData.getUser();
    if (!user) {
      this.isSavingExercise = false;
      return this.showAlert('User error');
    }

    const ex = this.exerciseForm.value;
    ex.userId = user.id;

    // Upload video
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
        return this.showAlert('Upload failed!');
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

  // -------------------------
  // ADD WORKOUT
  // -------------------------

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

  async saveNewWorkout() {
    if (this.isSavingWorkout) return;
    this.isSavingWorkout = true;

    if (!this.newWorkout.title) {
      this.isSavingWorkout = false;
      return this.showAlert('Workout must have a title');
    }

    const user = await this.localData.getUser();
    if (!user) {
      this.isSavingWorkout = false;
      return;
    }

    const body = {
      ...this.newWorkout,
      exerciseIds: this.editableExercises.map(ex => ex.id!),
      userId: user.id
    };

    try {
      await this.http.post(`${this.backendUrl}/api/workouts`, body).toPromise();

      this.showAlert('Workout created!');
      this.newWorkout = { title: '', subtitle: '', content: '' };
      this.editableExercises = [];
      this.filterList();

    } catch {
      this.showAlert('Failed to create workout');
    }

    this.isSavingWorkout = false;
  }

  // -------------------------
  // ALERT
  // -------------------------
  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    a.present();
  }

  async testAlert() {
    console.log('[TEST ALERT] kliknuto');

    try {
      const a = await this.alertCtrl.create({
        header: 'TEST',
        message: 'Radi li alert?',
        buttons: ['OK']
      });

      console.log('[TEST ALERT] kreiran:', a);

      await a.present();
      console.log('[TEST ALERT] present pozvan');
    } catch (err) {
      console.error('[TEST ALERT] GREŠKA:', err);
    }
  }

}
