import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonList, IonSpinner, IonReorderGroup, IonReorder, IonAccordionGroup, IonAccordion, IonSearchbar } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise } from '../services/models';
import { AlertController, LoadingController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonItem, IonLabel, IonInput, IonButton,
    IonList, IonSpinner,
    IonReorderGroup,
    IonReorder,
    IonAccordionGroup,
    IonAccordion,
    IonSearchbar
  ]
})
export class Tab2Page implements OnInit {
  workoutForm: FormGroup;
  exerciseForm: FormGroup;
  allExercises: Exercise[] = [];
  selectedVideo: File | null = null;
  loading: HTMLIonLoadingElement | null = null;
  isUploading = false;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

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

  editableExercises: Exercise[] = [];

  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;

    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);

    ev.detail.complete();
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
  }

  removeExercise(i: number) {
    this.editableExercises.splice(i, 1);
  }

  exerciseSearch: string = '';
  filteredExercises: Exercise[] = [];

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
          this.filteredExercises = res;
          console.log('Loaded user exercises:', res);
        },
        error: (err) => console.error('Error loading user exercises', err)
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

    if (this.editableExercises.length === 0) {
      this.showAlert('Workout must contain at least one exercise!');
      return;
    }

    const formValue = this.workoutForm.value;
    const workout = {
      title: formValue.title,
      subtitle: formValue.subtitle,
      content: formValue.content,
      exerciseIds: this.editableExercises.map(ex => ex.id),
      userId: user.id
    };

    try {
      this.showLoading('Saving workout...');
      await this.http.post(`${this.backendUrl}/api/workouts`, workout).toPromise();
      await this.hideLoading();

      this.localData.triggerTab3Refresh();
      this.showAlert('Workout added successfully!');

      this.workoutForm.reset();
      this.editableExercises = [];
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
    if (this.isUploading) return;
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
        const formData = new FormData();
        formData.append('video', this.selectedVideo);

        const cloudUrl = await this.http
          .post(`${this.backendUrl}/api/exercises/upload`, formData, { responseType: 'text' })
          .toPromise();

        exercise.videoUrl = cloudUrl;
        console.log('Cloudinary upload success:', cloudUrl);
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        this.showAlert('Upload failed. Please try again.');
        this.isUploading = false;
        return;
      }
    }

    try {
      this.showLoading('Saving exercise...');
      await this.http.post(`${this.backendUrl}/api/exercises`, exercise).toPromise();
      await this.hideLoading();

      this.localData.triggerTab3Refresh();
      this.showAlert('Exercise added successfully!');
      this.exerciseForm.reset({
        name: '',
        description: '',
        sets: 3,
        reps: '10',
        videoUrl: '',
        restBetweenSets: 60,
        restAfterExercise: 180
      });

      this.selectedVideo = null;
      this.loadExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
      await this.hideLoading();
      this.showAlert('Error adding exercise.');
    } finally {
      this.isUploading = false;
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

  sanitizeNumberInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  onSearchChange(ev: any) {
    const value = (ev.detail?.value || '').toLowerCase();
    this.exerciseSearch = value;

    if (!value) {
      this.filteredExercises = this.allExercises;
      return;
    }

    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(value)
    );
  }

}
