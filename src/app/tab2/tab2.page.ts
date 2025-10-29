import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonLabel, IonInput, IonButton,
  IonList, IonListHeader, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise } from '../services/models';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonButton,
    IonList, IonListHeader, IonSelect, IonSelectOption
  ]
})
export class Tab2Page implements OnInit {
  workoutForm: FormGroup;
  exerciseForm: FormGroup;
  allExercises: Exercise[] = [];
  selectedVideo: File | null = null;
  loading: HTMLIonLoadingElement | null = null;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.workoutForm = this.fb.group({
      title: ['', Validators.required],
      subtitle: [''],
      content: [''],
      exercises: this.fb.array([])
    });

    this.exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      sets: [3, Validators.required],
      reps: ['10', Validators.required],
      videoUrl: [''],
      restBetweenSets: [60, Validators.required],
      restAfterExercise: [180, Validators.required]
    });
  }

  ngOnInit() {
    const access = localStorage.getItem('spite-access');
    if (!access) {
      const password = prompt('🔒 Enter access password for Spite Dev Version:');
      if (password !== 'Uki') {
        alert('Incorrect password!');
        window.location.href = 'https://google.com';
        return;
      }
      localStorage.setItem('spite-access', 'granted');
    }

    this.loadExercises();
  }

  get exercises(): FormArray {
    return this.workoutForm.get('exercises') as FormArray;
  }

  addExercise() {
    const ex = this.fb.group({
      exerciseId: [null, Validators.required]
    });
    this.exercises.push(ex);
  }

  removeExercise(index: number) {
    this.exercises.removeAt(index);
  }

  loadExercises() {
    this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises`).subscribe({
      next: (res) => (this.allExercises = res),
      error: (err) => console.error('Error loading exercises', err)
    });
  }

  async saveWorkout() {
    if (this.workoutForm.valid) {
      const formValue = this.workoutForm.value;
      const workout = {
        title: formValue.title,
        subtitle: formValue.subtitle,
        content: formValue.content,
        exerciseIds: formValue.exercises.map((e: any) => e.exerciseId)
      };

      await this.showLoading('Saving workout...');
      this.http.post(`${this.backendUrl}/api/workouts`, workout).subscribe({
        next: async () => {
          await this.hideLoading();
          this.showAlert('Workout added successfully!');
          this.workoutForm.reset();
          this.exercises.clear();
          this.loadExercises();
        },
        error: async (err) => {
          await this.hideLoading();
          console.error('Error saving workout:', err);
          this.showAlert('Workout was not saved! Check the console.');
        }
      });
    } else {
      this.showAlert('Please fill in all required fields!');
    }
  }

  async onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showAlert('Video is too large (maximum 10 MB).');
      this.selectedVideo = null;
      return;
    }

    const allowedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedFormats.includes(file.type)) {
      this.showAlert(`Unsupported format: ${file.type}. Please upload MP4 or MOV.`);
      this.selectedVideo = null;
      return;
    }

    this.selectedVideo = file;
    this.showAlert('Video selected successfully!');
  }


  async saveExercise() {
    console.log('🧩 saveExercise called');
    if (this.exerciseForm.valid) {
      const exercise = this.exerciseForm.value;

      if (this.selectedVideo) {
        const formData = new FormData();
        formData.append('video', this.selectedVideo);

        await this.showLoading('Uploading video...');
        this.http.post(`${this.backendUrl}/api/exercises/upload`, formData, { responseType: 'text' }).subscribe({
          next: async (videoPath) => {
            exercise.videoUrl = videoPath;
            await this.hideLoading();
            await this.showLoading('Saving exercise...');
            this.http.post(`${this.backendUrl}/api/exercises`, exercise).subscribe({
              next: async () => {
                await this.hideLoading();
                this.showAlert('Exercise added successfully!');
                this.exerciseForm.reset();
                this.selectedVideo = null;
                this.loadExercises();
              },
              error: async (err) => {
                await this.hideLoading();
                this.showAlert('Error saving exercise!');
                console.error('Error adding exercise', err);
              }
            });
          },
          error: async (err) => {
            await this.hideLoading();
            this.showAlert('Error uploading video!');
            console.error('Upload failed:', err);
          }
        });
      } else {
        await this.showLoading('Saving exercise...');
        this.http.post(`${this.backendUrl}/api/exercises`, exercise).subscribe({
          next: async () => {
            await this.hideLoading();
            this.showAlert('Exercise added (without video).');
            this.exerciseForm.reset();
            this.loadExercises();
          },
          error: async (err) => {
            await this.hideLoading();
            this.showAlert('Error adding exercise.');
            console.error('Error adding exercise', err);
          }
        });
      }
    }
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Notification',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async showLoading(message: string = 'Please wait...') {
    this.loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      backdropDismiss: false,
      cssClass: 'custom-loading'
    });
    await this.loading.present();
  }

  async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
