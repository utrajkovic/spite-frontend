import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly api = 'https://spite-backend.fly.dev/api/users';

  private cache = new Map<string, string | null>();
  private subjects = new Map<string, ReplaySubject<string | null>>();
  private pending = new Set<string>();
  private flushScheduled = false;

  constructor(private http: HttpClient) {}

  /** Vrati avatar URL (ili null) za korisnika; batch-uje zahteve i kešira. */
  getUrl(username: string): Observable<string | null> {
    if (!username) return of(null);
    if (this.cache.has(username)) return of(this.cache.get(username)!);

    let subj = this.subjects.get(username);
    if (!subj) {
      subj = new ReplaySubject<string | null>(1);
      this.subjects.set(username, subj);
    }
    this.pending.add(username);
    this.scheduleFlush();
    return subj.asObservable();
  }

  /** Ručno postavi/azuriraj avatar (posle uploada). */
  set(username: string, url: string | null): void {
    this.cache.set(username, url);
    let subj = this.subjects.get(username);
    if (!subj) {
      subj = new ReplaySubject<string | null>(1);
      this.subjects.set(username, subj);
    }
    subj.next(url);
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

    this.http.post<Record<string, string | null>>(`${this.api}/avatars`, list).subscribe({
      next: (map) => {
        for (const u of list) {
          const url = (map && map[u]) ? map[u] : null;
          this.cache.set(u, url);
          this.subjects.get(u)?.next(url);
        }
      },
      error: () => {
        for (const u of list) {
          this.cache.set(u, null);
          this.subjects.get(u)?.next(null);
        }
      }
    });
  }
}
