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
    if (!username) {
      this.stop();
      return;
    }
    this.username = username;
    this.check();
    // Poll svake 10 sekundi
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.check(), 10000);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.username = '';
    this.hasProfileBadge$.next(false);
    this.hasWorkoutBadge$.next(false);
  }

  private check() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (!this.username || !token || !user) {
      this.stop();
      return;
    }
    this.checkInvites();
    this.checkNewWorkouts();
  }

  checkNow() {
    this.check();
  }

  private checkInvites() {
    const seenIds: string[] = JSON.parse(localStorage.getItem(SEEN_INVITES_KEY) || '[]');

    this.http.get<any[]>(`${this.API_URL}/trainer/invites/${this.username}`).subscribe({
      next: (invites) => {
        const hasNewInvite = invites.some(i => !seenIds.includes(i.id));
        if (hasNewInvite) { this.hasProfileBadge$.next(true); return; }

        this.http.get<any[]>(`${this.API_URL}/share/pending/${this.username}`).subscribe({
          next: (shares) => {
            const hasNewShare = shares.some(s => !seenIds.includes(s.id));
            this.hasProfileBadge$.next(hasNewShare);
          },
          error: (err) => {
            this.hasProfileBadge$.next(false);
            if (err?.status === 401 || err?.status === 403) {
              this.stop();
            }
          }
        });
      },
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.stop();
        }
      }
    });
  }

  private checkNewWorkouts() {
    this.http.get<any[]>(`${this.API_URL}/workouts/client/${this.username}`).subscribe({
      next: (workouts) => {
        const seenIds: string[] = JSON.parse(localStorage.getItem(SEEN_WORKOUTS_KEY) || '[]');
        const hasNew = workouts.some(w => !seenIds.includes(w.id));
        this.hasWorkoutBadge$.next(hasNew);
      },
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.stop();
        }
      }
    });
  }

  // Pozovi kad korisnik otvori profile tab - briše badge za invites i shares
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
