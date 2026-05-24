import { Component, NgZone } from '@angular/core';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonContent
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackendService } from '../services/backend.service';
import { Workout } from '../services/models';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { PageLoadingOverlayComponent } from "../page-loading-overlay/page-loading-overlay.component";
import { BadgeService } from '../services/badge.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader,
    IonCard, IonContent, RouterLink,
    PageLoadingOverlayComponent
  ],
})
export class Tab1Page {
  workouts: Workout[] = [];
  loading = false;
  openNotes = new Set<string>();
  readonly backendUrl = 'https://spite-backend.fly.dev';

  toggleNote(id: string | undefined) {
    if (!id) return;
    if (this.openNotes.has(id)) this.openNotes.delete(id);
    else this.openNotes.add(id);
  }

  constructor(
    private backendService: BackendService,
    private http: HttpClient,
    private zone: NgZone,
    private badgeService: BadgeService
  ) {}

  ionViewWillEnter() {
    this.loadUserWorkouts();
  }

  async loadUserWorkouts() {
    this.loading = true;
    const user = await Preferences.get({ key: 'user' });
    const currentUser = user.value ? JSON.parse(user.value) : null;

    if (!currentUser) {
      console.warn('⚠️ Nema ulogovanog korisnika!');
      this.loading = false;
      return;
    }

    const userWorkouts$ = this.backendService.getWorkoutsByUser(currentUser.id);
    const assignedWorkouts$ = this.http.get<Workout[]>(`${this.backendUrl}/api/workouts/client/${currentUser.username}`);

    Promise.all([userWorkouts$.toPromise(), assignedWorkouts$.toPromise()])
      .then(([mine, assigned]) => {
        this.workouts = [...(mine || []), ...(assigned || [])];
        this.loading = false;
        const allIds = this.workouts.map(w => w.id).filter(Boolean) as string[];
        this.badgeService.markWorkoutsSeen(allIds);
      })
      .catch((err) => {
        console.error('❌ Greška pri učitavanju treninga:', err);
        this.loading = false;
      });
  }
}