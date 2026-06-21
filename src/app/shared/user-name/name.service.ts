import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';

/**
 * Razrešava display ime (fullName) po username-u; batch-uje i kešira.
 * Uvek vraća prikaz: fullName ako postoji, inače sam username.
 */
@Injectable({ providedIn: 'root' })
export class NameService {
  private readonly api = 'https://spite-backend.fly.dev/api/users';

  private cache = new Map<string, string>();
  private subjects = new Map<string, ReplaySubject<string>>();
  private pending = new Set<string>();
  private flushScheduled = false;

  constructor(private http: HttpClient) {}

  getName(username: string): Observable<string> {
    if (!username) return of('');
    if (this.cache.has(username)) return of(this.cache.get(username)!);

    let subj = this.subjects.get(username);
    if (!subj) {
      subj = new ReplaySubject<string>(1);
      this.subjects.set(username, subj);
    }
    this.pending.add(username);
    this.scheduleFlush();
    return subj.asObservable();
  }

  /** Ručno ažuriranje (posle izmene imena u profilu). */
  set(username: string, fullName: string | null): void {
    const display = (fullName && fullName.trim()) ? fullName.trim() : username;
    this.cache.set(username, display);
    let subj = this.subjects.get(username);
    if (!subj) {
      subj = new ReplaySubject<string>(1);
      this.subjects.set(username, subj);
    }
    subj.next(display);
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    setTimeout(() => this.flush(), 50);
  }

  private flush(): void {
    this.flushScheduled = false;
    const list = Array.from(this.pending);
    this.pending.clear();
    if (!list.length) return;

    this.http.post<Record<string, string>>(`${this.api}/names`, list).subscribe({
      next: (map) => {
        for (const u of list) {
          const display = (map && map[u]) ? map[u] : u;
          this.cache.set(u, display);
          this.subjects.get(u)?.next(display);
        }
      },
      error: () => {
        for (const u of list) {
          this.cache.set(u, u);
          this.subjects.get(u)?.next(u);
        }
      }
    });
  }
}
