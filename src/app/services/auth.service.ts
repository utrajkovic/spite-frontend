import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable } from 'rxjs';
import { User } from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly backendUrl = 'https://dead-jade-spite-11d3e918.koyeb.app/api/users';

  constructor(private http: HttpClient) {}

  register(user: User): Observable<any> {
    return this.http.post(`${this.backendUrl}/register`, user);
  }

  login(user: User): Observable<any> {
    return this.http.post(`${this.backendUrl}/login`, user);
  }

  async saveUserLocally(user: any): Promise<void> {
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(user)
    });
  }

  async getUser(): Promise<any | null> {
    const res = await Preferences.get({ key: 'user' });
    return res.value ? JSON.parse(res.value) : null;
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: 'user' });
  }
}
