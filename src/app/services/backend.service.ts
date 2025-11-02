import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workout, Exercise } from './models';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private readonly API_URL = 'https://spite-backend-v2.onrender.com/api';

  constructor(private http: HttpClient) { }

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

}
