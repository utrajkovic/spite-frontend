import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

const SEEN_WORKOUTS_KEY = 'seen_workout_ids';
const SEEN_INVITES_KEY = 'seen_invite_ids';

@Injectable({ providedIn: 'root' })
export class BadgeService {

  private readonly API_URL = 'https://spite-backend-v2.onrender.com/api';

  hasProfileBadge$ = new BehaviorSubject<boolean>(false);
  hasWorkoutBadge$ = new BehaviorSubject<boolean>(false);

  private username = '';
  private pollInterval: any = null;

  constructor(private http: HttpClient) {}

  start(username: string) {
    this.username = username;
    this.check();
    // Poll svake 30 sekundi
    this.pollInterval = setInterval(() => this.check(), 30000);
  }

  stop() {
    clearInterval(this.pollInterval);
    this.hasProfileBadge$.next(false);
    this.hasWorkoutBadge$.next(false);
  }

  private check() {
    this.checkInvites();
    this.checkNewWorkouts();
  }

  private checkInvites() {
    this.http.get<any[]>(`${this.API_URL}/trainer/invites/${this.username}`).subscribe({
      next: (invites) => {
        const seenIds: string[] = JSON.parse(localStorage.getItem(SEEN_INVITES_KEY) || '[]');
        const hasNew = invites.some(i => !seenIds.includes(i.id));
        this.hasProfileBadge$.next(hasNew);
      },
      error: () => {}
    });
  }

  private checkNewWorkouts() {
    this.http.get<any[]>(`${this.API_URL}/workouts/client/${this.username}`).subscribe({
      next: (workouts) => {
        const seenIds: string[] = JSON.parse(localStorage.getItem(SEEN_WORKOUTS_KEY) || '[]');
        const hasNew = workouts.some(w => !seenIds.includes(w.id));
        this.hasWorkoutBadge$.next(hasNew);
      },
      error: () => {}
    });
  }

  // Pozovi kad korisnik otvori profile tab - briše badge za invites
  markInvitesSeen(inviteIds: string[]) {
    const existing: string[] = JSON.parse(localStorage.getItem(SEEN_INVITES_KEY) || '[]');
    const merged = [...new Set([...existing, ...inviteIds])];
    localStorage.setItem(SEEN_INVITES_KEY, JSON.stringify(merged));
    this.hasProfileBadge$.next(false);
  }

  // Pozovi kad korisnik otvori workout tab - briše badge za workouts
  markWorkoutsSeen(workoutIds: string[]) {
    const existing: string[] = JSON.parse(localStorage.getItem(SEEN_WORKOUTS_KEY) || '[]');
    const merged = [...new Set([...existing, ...workoutIds])];
    localStorage.setItem(SEEN_WORKOUTS_KEY, JSON.stringify(merged));
    this.hasWorkoutBadge$.next(false);
  }
}
