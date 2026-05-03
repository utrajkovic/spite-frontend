import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workout, Exercise, WorkoutFeedback, DailyCheckIn, DailyAgenda, TrainerInbox, VideoComment } from './models';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private readonly API_URL = 'https://spite-backend-v2.onrender.com/api';

  constructor(private http: HttpClient) { }

  private get adminUsername(): string {
    return localStorage.getItem('username') || '';
  }
  // WORKOUT / EXERCISE
  getAllExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.API_URL}/exercises`);
  }

  addExercise(exercise: Exercise): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.API_URL}/exercises`, exercise);
  }

  getAllWorkouts(): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${this.API_URL}/workouts`);
  }

  getExercisesByUser(userId: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.API_URL}/exercises/user/${userId}`);
  }

  getWorkoutsByUser(userId: string): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${this.API_URL}/workouts/user/${userId}`);
  }

  getWorkoutById(id: string): Observable<Workout> {
    return this.http.get<Workout>(`${this.API_URL}/workouts/${id}`);
  }

  addWorkout(workout: Workout): Observable<Workout> {
    return this.http.post<Workout>(`${this.API_URL}/workouts`, workout);
  }

  deleteWorkout(id: string): Observable<string> {
    return this.http.delete(`${this.API_URL}/workouts/${id}`, { responseType: 'text' });
  }

  deleteExercise(id: string): Observable<string> {
    return this.http.delete(`${this.API_URL}/exercises/${id}`, { responseType: 'text' });
  }

  //        ADMIN API

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/admin/users?adminUsername=${this.adminUsername}`);
  }

  updateUserRole(username: string, newRole: string): Observable<string> {
    return this.http.put(
      `${this.API_URL}/admin/users/${username}/role?adminUsername=${this.adminUsername}&role=${newRole}`,
      {},
      { responseType: 'text' }
    );
  }

  updateUserPassword(username: string, newPassword: string): Observable<string> {
    return this.http.put(
      `${this.API_URL}/admin/users/${username}/password?adminUsername=${this.adminUsername}&newPassword=${newPassword}`,
      {},
      { responseType: 'text' }
    );
  }

  deleteUser(username: string): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/admin/users/${username}?adminUsername=${this.adminUsername}`,
      { responseType: 'text' }
    );
  }
  
  sendWorkoutFeedback(data: WorkoutFeedback): Observable<any> {
    return this.http.post(`${this.API_URL}/feedback`, data);
  }

  updateWorkoutFeedback(id: string, data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/feedback/${id}`, data);
  }

  saveCompletedWorkout(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/completed-workouts`, data);
  }

  getCompletedWorkouts(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/completed-workouts/user/${username}`);
  }

  // Share system
  sendShareInvite(fromUsername: string, toUsername: string, type: 'exercise' | 'workout', itemIds: string[]): Observable<string> {
    return this.http.post(`${this.API_URL}/share/send`,
      { fromUsername, toUsername, type, itemIds },
      { responseType: 'text' }
    );
  }

  getPendingShares(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/share/pending/${username}`);
  }

  acceptShare(inviteId: string): Observable<string> {
    return this.http.post(`${this.API_URL}/share/${inviteId}/accept`, {}, { responseType: 'text' });
  }

  declineShare(inviteId: string): Observable<string> {
    return this.http.post(`${this.API_URL}/share/${inviteId}/decline`, {}, { responseType: 'text' });
  }

  assignWorkoutNote(workoutId: string, clientUsername: string, trainerUsername: string, note: string): Observable<string> {
    return this.http.put(
      `${this.API_URL}/workouts/assign/note?workoutId=${workoutId}&clientUsername=${clientUsername}&trainerUsername=${trainerUsername}&note=${encodeURIComponent(note)}`,
      {},
      { responseType: 'text' }
    );
  }

  getFeedbackForUser(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/feedback/user/${username}`);
  }

  // Trainer invite system
  sendTrainerInvite(trainerUsername: string, clientUsername: string): Observable<string> {
    return this.http.post(
      `${this.API_URL}/trainer/invite?trainerUsername=${trainerUsername}&clientUsername=${clientUsername}`,
      {},
      { responseType: 'text' }
    );
  }

  getPendingInvites(clientUsername: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/trainer/invites/${clientUsername}`);
  }

  acceptInvite(inviteId: string): Observable<string> {
    return this.http.post(`${this.API_URL}/trainer/invite/${inviteId}/accept`, {}, { responseType: 'text' });
  }

  declineInvite(inviteId: string): Observable<string> {
    return this.http.post(`${this.API_URL}/trainer/invite/${inviteId}/decline`, {}, { responseType: 'text' });
  }
  clearFeedbackHistory(username: string): Observable<string> {
    return this.http.delete(`${this.API_URL}/feedback/user/${username}`, { responseType: 'text' });
  }

  markFeedbackReadByTrainer(feedbackId: string): Observable<string> {
    return this.http.put(`${this.API_URL}/feedback/${feedbackId}/trainer-read`, {}, { responseType: 'text' });
  }

  submitDailyCheckIn(payload: DailyCheckIn): Observable<DailyCheckIn> {
    return this.http.post<DailyCheckIn>(`${this.API_URL}/checkins`, payload);
  }

  getMyCheckIns(username: string): Observable<DailyCheckIn[]> {
    return this.http.get<DailyCheckIn[]>(`${this.API_URL}/checkins/user/${username}`);
  }

  getTrainerCheckIns(trainerUsername: string, pendingOnly = true): Observable<DailyCheckIn[]> {
    return this.http.get<DailyCheckIn[]>(`${this.API_URL}/checkins/trainer/${trainerUsername}?pendingOnly=${pendingOnly}`);
  }

  markCheckInReviewed(checkInId: string): Observable<string> {
    return this.http.put(`${this.API_URL}/checkins/${checkInId}/review`, {}, { responseType: 'text' });
  }

  markAllCheckInsReviewed(trainerUsername: string): Observable<string> {
    return this.http.put(`${this.API_URL}/checkins/trainer/${trainerUsername}/review-all`, {}, { responseType: 'text' });
  }

  getTodayAgenda(username: string): Observable<DailyAgenda> {
    return this.http.get<DailyAgenda>(`${this.API_URL}/agenda/today/${username}`);
  }

  getTrainerInbox(trainerUsername: string): Observable<TrainerInbox> {
    return this.http.get<TrainerInbox>(`${this.API_URL}/trainer/inbox/${trainerUsername}`);
  }

  sendBulkLateReminders(trainerUsername: string): Observable<string> {
    return this.http.post(`${this.API_URL}/trainer/inbox/${trainerUsername}/bulk/remind-late`, {}, { responseType: 'text' });
  }

  getVideoComments(feedbackId: string): Observable<VideoComment[]> {
    return this.http.get<VideoComment[]>(`${this.API_URL}/video-comments/feedback/${feedbackId}`);
  }

  addVideoComment(payload: VideoComment): Observable<VideoComment> {
    return this.http.post<VideoComment>(`${this.API_URL}/video-comments`, payload);
  }
}
