import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalDataService {

  private refreshTab1Subject = new Subject<void>();
  refreshTab1$ = this.refreshTab1Subject.asObservable();

  triggerTab1Refresh() {
    this.refreshTab1Subject.next();
  }

  private refreshTab2Subject = new Subject<void>();
  refreshTab2$ = this.refreshTab2Subject.asObservable();

  triggerTab2Refresh() {
    this.refreshTab2Subject.next();
  }

  private refreshTab3Subject = new Subject<void>();
  refreshTab3$ = this.refreshTab3Subject.asObservable();

  triggerTab3Refresh() {
    this.refreshTab3Subject.next();
  }

  private refreshWorkoutsSubject = new Subject<void>();
  refreshWorkouts$ = this.refreshWorkoutsSubject.asObservable();

  triggerWorkoutsRefresh() {
    this.refreshWorkoutsSubject.next();
  }


  async saveWorkouts(data: any) {
    await Filesystem.writeFile({
      path: 'workouts.json',
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  }

  async loadWorkouts() {
    try {
      const result = await Filesystem.readFile({
        path: 'workouts.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(result.data as string);
    } catch (error) {
      return [];
    }
  }

  async saveUser(user: any) {
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(user)
    });
  }

  async getUser() {
    const result = await Preferences.get({ key: 'user' });
    return result.value ? JSON.parse(result.value) : null;
  }

  async clearAll() {
    await Preferences.clear();
    await Filesystem.deleteFile({
      path: 'workouts.json',
      directory: Directory.Data
    }).catch(() => { });
  }
}
