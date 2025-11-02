import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonLabel, IonInput, IonButton,
  IonList, IonListHeader, IonSelect, IonSelectOption, IonSpinner
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise } from '../services/models';
import { AlertController, LoadingController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

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
    IonList, IonListHeader, IonSelect, IonSelectOption, IonSpinner
  ]
})
export class Tab2Page implements OnInit {
  workoutForm: FormGroup;
  exerciseForm: FormGroup;
  allExercises: Exercise[] = [];
  selectedVideo: File | null = null;
  loading: HTMLIonLoadingElement | null = null;
  isUploading = false;

  readonly backendUrl = 'https://dead-jade-spite-11d3e918.koyeb.app';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private localData: LocalDataService
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
      localVideoPath: [''],
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
    this.exercises.push(this.fb.group({ exerciseId: [null, Validators.required] }));
  }

  removeExercise(index: number) {
    this.exercises.removeAt(index);
  }

  async loadExercises() {
    try {
      const user = await this.localData.getUser();
      if (!user) {
        console.warn('No logged-in user found!');
        this.allExercises = [];
        return;
      }
      this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`).subscribe({
        next: (res) => {
          this.allExercises = res;
          console.log('Loaded user exercises:', res);
        },
        error: (err) => console.error('.Error loading user exercises', err)
      });
    } catch (err) {
      console.error('Error fetching user for exercises:', err);
    }
  }


  async saveWorkout() {
    if (!this.workoutForm.valid) {
      this.showAlert('Please fill in all required fields!');
      return;
    }

    const user = await this.localData.getUser();
    if (!user) {
      this.showAlert('Error: No user logged in!');
      return;
    }

    const formValue = this.workoutForm.value;
    const workout = {
      title: formValue.title,
      subtitle: formValue.subtitle,
      content: formValue.content,
      exerciseIds: formValue.exercises.map((e: any) => e.exerciseId),
      userId: user.id
    };
    console.log('📤 Sending workout:', workout);

    try {
      this.showLoading('Saving workout...');
      await this.http.post(`${this.backendUrl}/api/workouts`, workout).toPromise();
      await this.hideLoading();

      this.localData.triggerTab3Refresh();
      this.showAlert('Workout added successfully!');
      this.workoutForm.reset();
      this.exercises.clear();
      this.loadExercises();
    } catch (err) {
      console.error('Error saving workout:', err);
      await this.hideLoading();
      this.showAlert('Workout was not saved! Check console.');
    }
  }

  async onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.showAlert('Video is too large (max 10MB).');
      return;
    }

    const allowedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedFormats.includes(file.type)) {
      this.showAlert(`Unsupported format: ${file.type}.`);
      return;
    }

    this.selectedVideo = file;
    this.showAlert(`🎥 Video selected: ${file.name}`);
  }


  async saveExercise() {
    if (this.isUploading) return; // ⛔ spreči duple klikove
    this.isUploading = true;

    if (!this.exerciseForm.valid) {
      this.showAlert('Please fill in all required fields!');
      this.isUploading = false;
      return;
    }

    const user = await this.localData.getUser();
    if (!user) {
      this.showAlert('Error: No user logged in!');
      this.isUploading = false;
      return;
    }

    const exercise = this.exerciseForm.value;
    exercise.userId = user.id;

    if (this.selectedVideo) {
      try {
        const base64Data = await this.readFileAsBase64(this.selectedVideo);
        const fileName = `${Date.now()}_${this.selectedVideo.name}`;
        const savePath = `SpiteVideos/${fileName}`;

        await Filesystem.writeFile({
          path: savePath,
          data: base64Data,
          directory: Directory.Data
        });

        exercise.localVideoPath = savePath;
        console.log('✅ Video saved locally at', savePath);

        try {
          const formData = new FormData();
          formData.append('video', this.selectedVideo);

          const cloudUrl = await this.http
            .post(`${this.backendUrl}/api/exercises/upload`, formData, { responseType: 'text' })
            .toPromise();

          exercise.videoUrl = cloudUrl;
          console.log('☁️ Cloudinary upload success:', cloudUrl);
        } catch (err) {
          console.warn('⚠️ Cloudinary upload failed — keeping local only.');
        }

      } catch (err) {
        console.error('❌ Error saving video locally:', err);
        this.showAlert('Error saving video locally.');
        this.isUploading = false;
        return;
      }
    }

    try {
      this.showLoading('Saving exercise...');
      await this.http.post(`${this.backendUrl}/api/exercises`, exercise).toPromise();
      await this.hideLoading();

      this.localData.triggerTab3Refresh();
      this.showAlert('✅ Exercise added successfully!');
      this.exerciseForm.reset({
        name: '',
        description: '',
        sets: 3,
        reps: '10',
        videoUrl: '',
        localVideoPath: '',
        restBetweenSets: 60,
        restAfterExercise: 180
      });

      this.selectedVideo = null;
      this.loadExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
      await this.hideLoading();
      this.showAlert('❌ Error adding exercise.');
    } finally {
      this.isUploading = false;
    }
  }



  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

  sanitizeNumberInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }
}
