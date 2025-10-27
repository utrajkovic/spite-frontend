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
import { ToastController } from '@ionic/angular';

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

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(private fb: FormBuilder, private http: HttpClient, private toastCtrl: ToastController) {
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
      error: (err) => console.error('Greška pri učitavanju vežbi', err)
    });
  }

  saveWorkout() {
    if (this.workoutForm.valid) {
      const formValue = this.workoutForm.value;

      const workout = {
        title: formValue.title,
        subtitle: formValue.subtitle,
        content: formValue.content,
        exerciseIds: formValue.exercises.map((e: any) => e.exerciseId)
      };

      console.log('📤 Slanje treninga:', workout);

      this.http.post(`${this.backendUrl}/api/workouts`, workout).subscribe({
        next: () => {
          this.showToast('Trening uspesno dodat!');
          this.workoutForm.reset();
          this.exercises.clear();
          this.loadExercises();
        },
        error: (err) => {
          console.error('Greška pri čuvanju treninga:', err);
          this.showToast('Trening nije sačuvan! pogledaj konzolu');
        }
      });
    } else {
      this.showToast('Moras popuniti sva polja !');
    }
  }



  async onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 600 * 1024;
    if (file.size > maxSize) {
      this.showToast(' Video je prevelik (maksimalno 600 KB).');
      console.warn(`Fajl prevelik: ${(file.size / 1024).toFixed(1)} KB`);
      this.selectedVideo = null;
      return;
    }

    const allowedFormats = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedFormats.includes(file.type)) {
      this.showToast('Format .MOV nije podržan. Dodajte MP4 video fajl.');
      console.warn(' Nepodržan format:', file.type);
      this.selectedVideo = null;
      return;
    }

    this.selectedVideo = file;
    console.log('🎬 Video prihvaćen:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    this.showToast('✅ Video uspešno dodat!');
  }



  saveExercise() {
    if (this.exerciseForm.valid) {
      const exercise = this.exerciseForm.value;

      if (this.selectedVideo) {
        const formData = new FormData();
        formData.append('video', this.selectedVideo);

        this.http.post(`${this.backendUrl}/api/exercises/upload`, formData, { responseType: 'text' }).subscribe({
          next: (videoPath) => {
            exercise.videoUrl = videoPath;
            this.http.post(`${this.backendUrl}/api/exercises`, exercise).subscribe({
              next: () => {
                this.showToast('Vezba uspesno dodata!');
                this.exerciseForm.reset();
                this.selectedVideo = null;
                this.loadExercises();
              },
              error: (err) => console.error('Greška pri dodavanju vežbe', err)
            });
          },
          error: (err) => alert('Greška pri uploadu videa!')
        });
      } else {
        this.http.post(`${this.backendUrl}/api/exercises`, exercise).subscribe({
          next: () => {
            this.showToast('Vezba dodata bez videa');
            this.exerciseForm.reset();
            this.loadExercises();
          },
          error: (err) => console.error('Greška pri dodavanju vežbe', err)
        });
      }
    }
  }
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'middle',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

}
