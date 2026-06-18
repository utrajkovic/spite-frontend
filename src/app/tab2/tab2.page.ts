import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonContent, IonItem, IonInput, IonButton, IonSearchbar, IonSpinner, IonReorderGroup, IonReorder, IonSelectOption, IonSelect, IonModal } from '@ionic/angular/standalone';

import { HttpClient, HttpEventType } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

import { Exercise, WorkoutItem } from '../services/models';
import { LocalDataService } from '../services/local-data.service';
import { ModalController } from '@ionic/angular';
import { ExerciseSettingsModalComponent } from '../exercise-settings-modal/exercise-settings-modal.component';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";



@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent,
    IonItem, IonInput, IonButton,
    IonSearchbar, IonSpinner,
    IonReorderGroup, IonReorder,
    IonSelect, IonSelectOption,
    IonModal,
    PageLoadingOverlayComponent
  ],
  providers: [ModalController]
})
export class Tab2Page implements OnInit {

  @ViewChild('exPreviewModal') exPreviewModal!: IonModal;
  previewExercise: Exercise | null = null;

  tab: 'exercise' | 'workout' = 'exercise';

  exerciseForm: FormGroup;
  workoutForm: FormGroup;

  selectedVideo: File | null = null;
  uploadProgress: number | null = null; // % upload-a videa (null = nema upload-a u toku)
  allExercises: Exercise[] = [];
  editableExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchQuery = '';
  showAllExercises = false;
  readonly EXERCISES_LIMIT = 10;

  get visibleExercises(): Exercise[] {
    return this.showAllExercises
      ? this.filteredExercises
      : this.filteredExercises.slice(0, this.EXERCISES_LIMIT);
  }

  workoutItems: WorkoutItem[] = [];

  isSavingExercise = false;
  isSavingWorkout = false;

  readonly backendUrl = 'https://spite-backend.fly.dev';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private localData: LocalDataService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {
    this.exerciseForm = this.fb.group({
      name: [''],
      description: [''],
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

  // Osveži listu svaki put kad se uđe u tab (npr. posle brisanja vežbe u tab3)
  async ionViewWillEnter() {
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

  getExerciseNameById(id: string | null | undefined): string {
    if (!id) return 'None';
    const ex = this.allExercises.find(e => e.id === id);
    return ex?.name ?? 'Unknown';
  }


  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/č/g, 'c').replace(/ć/g, 'c')
      .replace(/š/g, 's').replace(/ž/g, 'z')
      .replace(/đ/g, 'd').replace(/dž/g, 'dz');
  }

  onSearch(ev: any) {
    this.searchQuery = ev.target.value ?? '';
    this.showAllExercises = false;
    this.filterList();
  }

  filterList() {
    const q = this.normalize(this.searchQuery);
    this.filteredExercises = this.allExercises.filter(ex =>
      this.normalize(ex.name).includes(q) &&
      !this.editableExercises.some(e => e.id === ex.id)
    );
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);

    this.workoutItems.push({
      exerciseId: ex.id!,
      sets: 3,
      reps: '10',
      restBetweenSets: 60,
      restAfterExercise: 120,
      supersetExerciseId: ""
    });
  }

  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
    this.workoutItems.splice(i, 1);
    this.filterList();
  }

  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;

    const ex = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, ex);

    const item = this.workoutItems.splice(from, 1)[0];
    this.workoutItems.splice(to, 0, item);

    ev.detail.complete();
  }

  onVideoSelected(ev: any) {
    const file: File | null = ev.target.files?.[0] ?? null;
    if (!file) return;

    const fileMB = file.size / 1024 / 1024;
    if (fileMB > 20) {
      this.showAlert(`Video is too large (${fileMB.toFixed(1)} MB). Maximum allowed is 20 MB.`);
      ev.target.value = '';
      return;
    }

    this.selectedVideo = file;
  }

  async saveExercise() {
    if (this.isSavingExercise) return;

    const value = this.exerciseForm.value;

    if (!value.name?.trim()) return this.showAlert('Exercise must have a name.');
    if (!value.description?.trim()) return this.showAlert('Description required.');

    this.isSavingExercise = true;

    const user = await this.localData.getUser();
    if (!user) return this.showAlert('User error');

    const ex: any = {
      name: value.name.trim(),
      description: value.description.trim(),
      userId: user.id
    };

    if (this.selectedVideo) {
      try {
        const form = new FormData();
        form.append('video', this.selectedVideo);
        this.uploadProgress = 0;
        ex.videoUrl = await this.uploadVideo(form);
        this.uploadProgress = null; // upload gotov → sledeći korak je upis vežbe ("Saving...")
      } catch {
        this.isSavingExercise = false;
        this.uploadProgress = null;
        return this.showAlert('Video upload failed.');
      }
    }

    try {
      await this.http.post(`${this.backendUrl}/api/exercises`, ex).toPromise();
      this.showAlert('Exercise added!');
    } catch {
      this.showAlert('Error adding exercise.');
    }

    this.exerciseForm.reset();
    this.selectedVideo = null;
    this.uploadProgress = null;
    this.isSavingExercise = false;

    await this.loadExercises();
    this.filterList();
  }

  /** Upload videa uz praćenje napretka (%). Vraća videoUrl iz odgovora. */
  private uploadVideo(form: FormData): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.http.post(`${this.backendUrl}/api/exercises/upload`, form, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true
      }).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            resolve(event.body as string);
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  async saveNewWorkout() {
    if (this.isSavingWorkout) return;

    const value = this.workoutForm.value;

    if (!value.title?.trim()) return this.showAlert('Workout must have a title.');
    if (this.editableExercises.length === 0) return this.showAlert('Workout needs exercises.');

    this.isSavingWorkout = true;

    const user = await this.localData.getUser();
    if (!user) return;

    const body = {
      title: value.title.trim(),
      subtitle: value.subtitle?.trim() || '',
      content: value.content?.trim() || '',
      userId: user.id,
      items: this.workoutItems.map(it => ({
        exerciseId: it.exerciseId,
        sets: it.sets,
        reps: it.reps,
        restBetweenSets: it.restBetweenSets,
        restAfterExercise: it.restAfterExercise,
        supersetExerciseId: it.supersetExerciseId || null
      })),
      exerciseIds: this.workoutItems.map(it => it.exerciseId)
    };

    try {
      await this.http.post(`${this.backendUrl}/api/workouts`, body).toPromise();
      this.showAlert('Workout created!');

      this.workoutForm.reset();
      this.editableExercises = [];
      this.workoutItems = [];
      this.filterList();

    } catch {
      this.showAlert('Failed to create workout.');
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

  openExercisePreview(ex: Exercise) {
    this.previewExercise = ex;
    this.exPreviewModal.present();
  }

  closeExercisePreview() {
    this.exPreviewModal.dismiss();
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