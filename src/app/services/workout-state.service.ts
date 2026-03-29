import { Injectable } from '@angular/core';

const STORAGE_KEY = 'active_workout_state';
const PENDING_FEEDBACK_KEY = 'pending_workout_feedback';

export interface ActiveWorkoutState {
  workoutId: string;
  workoutTitle: string;
  items: any[];
  exercises: any[];
  currentIndex: number;
  currentSet: number;
  showingSuperset: boolean;
  startedAt: number;
}

@Injectable({ providedIn: 'root' })
export class WorkoutStateService {

  save(state: ActiveWorkoutState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  load(): ActiveWorkoutState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  hasActiveWorkout(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  // Feedback queue za offline slučaj
  savePendingFeedback(feedback: any): void {
    const existing = this.getPendingFeedbacks();
    existing.push(feedback);
    localStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(existing));
  }

  getPendingFeedbacks(): any[] {
    const raw = localStorage.getItem(PENDING_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  removePendingFeedback(index: number): void {
    const existing = this.getPendingFeedbacks();
    existing.splice(index, 1);
    localStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(existing));
  }

  clearPendingFeedbacks(): void {
    localStorage.removeItem(PENDING_FEEDBACK_KEY);
  }
}
