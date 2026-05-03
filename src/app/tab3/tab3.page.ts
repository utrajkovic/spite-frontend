import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonSearchbar
} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { Exercise, Workout, WorkoutItem } from '../services/models';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';
import { LocalDataService } from '../services/local-data.service';
import { HttpClient } from '@angular/common/http';
import { IonModal } from '@ionic/angular/standalone';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonSpinner,
    IonModal,
    IonSearchbar,
    PageLoadingOverlayComponent
  ]
})
export class Tab3Page implements OnInit {
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  exerciseSearch = '';
  exercisesExpanded = false;

  workouts: Workout[] = [];
  assignedWorkouts: Workout[] = [];
  loading: HTMLIonLoadingElement | null = null;
  isDeleting: string | null = null;
  isLoading = false;

  // Share selection
  shareMode: 'none' | 'exercise' | 'workout' = 'none';
  selectedIds = new Set<string>();
  shareUsername: string = '';
  isSharing: boolean = false;
  async startShare(mode: 'exercise' | 'workout') {
    this.shareMode = mode;
    this.selectedIds.clear();
    this.shareUsername = '';
  }
  cancelShare() {
    this.shareMode = 'none';
    this.selectedIds.clear();
    this.shareUsername = '';
  }
  toggleSelect(id: string) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }
  async confirmShare() {
    if (!this.shareUsername.trim() || this.selectedIds.size === 0) {
      this.showAlert('Enter username and select at least one item.');
      return;
    }
    this.isSharing = true;
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;
    if (!currentUser) {
      this.isSharing = false;
      this.showAlert('Not logged in.');
      return;
    }
    if (this.shareMode === 'none') {
      this.isSharing = false;
      this.showAlert('Select what you want to share.');
      return;
    }
    this.backend.sendShareInvite(
      currentUser.username,
      this.shareUsername.trim(),
      this.shareMode as 'exercise' | 'workout',
      Array.from(this.selectedIds)
    ).subscribe({
      next: () => {
        this.isSharing = false;
        this.showAlert('Invite sent!');
        this.cancelShare();
      },
      error: (err) => {
        this.isSharing = false;
        this.showAlert('Error sending invite: ' + (err?.error || ''));
      }
    });
  }

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
    private localData: LocalDataService,
    private zone: NgZone,
    private loadingCtrl: LoadingController,
    private http: HttpClient
  ) { }

  @ViewChild('exerciseModal', { static: true }) exerciseModal: any;
  @ViewChild('contentRef', { static: true }) contentRef!: any;
  previewExercise: Exercise | null = null;

  previewWorkout: any = null;
  previewWorkoutExercises: string[] = [];
  @ViewChild('workoutModal') workoutModal!: IonModal;


  private audioUnlocked = false;

  ngOnInit() {
    this.unlockVideoPlayback();
    this.loadData();
    this.localData.refreshTab3$.subscribe(() => this.loadData());
  }

  private unlockVideoPlayback() {
    if (this.audioUnlocked) return;
    const unlock = () => {
      if (this.audioUnlocked) return;
      this.audioUnlocked = true;
      document.querySelectorAll<HTMLVideoElement>('video').forEach(v => {
        v.play().then(() => v.pause()).catch(() => {});
      });
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock);
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;

    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('⚠️ Nema ulogovanog korisnika!');
      this.isLoading = false;
      return;
    }

    const exercises$ = this.backend.getExercisesByUser(currentUser.id);
    const workouts$ = this.backend.getWorkoutsByUser(currentUser.id);
    const assigned$ = this.http.get<Workout[]>(`${this.backendUrl}/api/workouts/client/${currentUser.username}`);

    forkJoin([exercises$, workouts$, assigned$]).subscribe({
      next: ([exercises, workouts, assigned]) => {
        this.zone.run(() => {
          this.exercises = exercises;
          this.filteredExercises = exercises;
          this.workouts = workouts;
          this.assignedWorkouts = assigned;
          this.isLoading = false;
        });
      },
      error: (err) => {
        console.error('❌ Greška pri učitavanju:', err);
        this.isLoading = false;
      }
    });
  }



  async deleteExercise(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this exercise?');
    if (!confirmDelete) return;

    this.isDeleting = id;

    try {
      await this.backend.deleteExercise(id).toPromise();

      this.zone.run(() => {
        this.exercises = this.exercises.filter(e => e.id !== id);
      });

      await this.showAlert('Exercise deleted successfully!');
    } catch (err) {
      console.error('Error deleting exercise:', err);
      await this.showAlert('Failed to delete exercise.');
    } finally {
      this.isDeleting = null;
    }
  }

  async deleteWorkout(id: string) {
    const confirmDelete = await this.confirmDelete('Are you sure you want to delete this workout?');
    if (!confirmDelete) return;

    this.isDeleting = id;

    try {
      await this.backend.deleteWorkout(id).toPromise();

      this.zone.run(() => {
        this.workouts = this.workouts.filter(w => w.id !== id);
      });

      await this.showAlert('Workout deleted successfully!');
    } catch (err) {
      console.error('Error deleting workout:', err);
      await this.showAlert('Failed to delete workout.');
    } finally {
      this.isDeleting = null;
    }
  }

  async confirmDelete(message: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Confirmation',
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-cancel' },
        { text: 'Delete', role: 'confirm', cssClass: 'alert-confirm' }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  async showExercisePreview(exercise: Exercise) {
    const alert = await this.alertCtrl.create({
      header: exercise.name,
      message: '',
      buttons: [{ text: 'Close', role: 'cancel', cssClass: 'alert-confirm' }],
      cssClass: 'custom-alert exercise-preview-modal'
    });

    await alert.present();

    const messageEl = document.querySelector('ion-alert .alert-message');
    if (!messageEl) return;

    messageEl.innerHTML = `
    <div class="exercise-preview-alert">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Loading video...</p>
    </div>
  `;

    try {
      if (!exercise.videoUrl) {
        messageEl.innerHTML = `<p>⚠️ No video available for this exercise.</p>`;
        return;
      }

      const videoEl = document.createElement('video');
      videoEl.src = exercise.videoUrl;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.controls = false;
      videoEl.playsInline = true;
      videoEl.className = 'exercise-video';

      videoEl.onloadeddata = () => {
        messageEl.innerHTML = `
          <div class="exercise-modal-wrapper">

            <h2 class="ex-modal-title">${exercise.name}</h2>

            <video src="${exercise.videoUrl}" autoplay loop muted playsinline class="ex-modal-video"></video>

            <p class="ex-modal-description">
              ${exercise.description || 'No description available.'}
            </p>

          </div>
        `;
      };
    } catch (err) {
      console.error('Error loading video:', err);
      messageEl.innerHTML = `<p> Unable to load video.</p>`;
    }
  }

  openEditWorkout(workout: Workout) {
    this.router.navigate(['/tab-edit', workout.id]);
  }


  async showWorkoutDetails(workout: any) {
    this.previewWorkout = workout;

    const items: WorkoutItem[] = workout.items || [];
    const allExercises = workout.exercises || this.exercises || [];

    const map = new Map<string, Exercise>(
      allExercises.map((e: Exercise) => [e.id!, e])
    );

    this.previewWorkoutExercises = items.map((it: any) => {
      const main = map.get(it.exerciseId)?.name || 'Unknown';

      if (it.supersetExerciseId) {
        const superset = map.get(it.supersetExerciseId)?.name || 'Unknown';
        return `${main}  →  ${superset}  (Superset)`;
      }

      return main;
    });

    await this.workoutModal.present();
  }


  closeWorkoutModal() {
    this.workoutModal.dismiss();
  }


  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          role: 'confirm',
          handler: async () => {
            await Preferences.remove({ key: 'user' });
            await Preferences.remove({ key: 'authToken' });
            localStorage.removeItem('authToken');
            await this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
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
  openExercisePreview(ex: Exercise) {
    this.previewExercise = ex;
    this.exerciseModal.present();
  }

  closeExerciseModal() {
    this.exerciseModal.dismiss();
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/č/g, 'c').replace(/ć/g, 'c')
      .replace(/š/g, 's').replace(/ž/g, 'z')
      .replace(/đ/g, 'd').replace(/dž/g, 'dz');
  }

  onExerciseSearch(ev: any) {
    const q = ev.target.value ?? '';
    this.exerciseSearch = q;
    this.filteredExercises = this.exercises.filter(e =>
      this.normalize(e.name).includes(this.normalize(q))
    );
  }

  get visibleExercises(): Exercise[] {
    const list = this.filteredExercises;
    if (this.shareMode === 'exercise') return list;
    return this.exercisesExpanded ? list : list.slice(0, 5);
  }

  get hasMoreExercises(): boolean {
    return this.filteredExercises.length > 5 && !this.exercisesExpanded && this.shareMode !== 'exercise';
  }

}