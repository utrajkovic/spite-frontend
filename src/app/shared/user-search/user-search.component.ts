import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonInput } from '@ionic/angular/standalone';
import { AvatarComponent } from '../avatar/avatar.component';

/**
 * Username autocomplete (Instagram-stil): dok kucaš, ispod izlazi lista korisnika.
 * Klik bira korisnika; X briše izbor. Emituje `picked` sa izabranim username-om
 * (i na svaki keystroke, da roditeljska promenljiva ostane u sinhronu).
 */
@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule, IonInput, AvatarComponent],
  template: `
    <div class="us-wrap">
      <div class="us-input-row">
        <ion-input
          [(ngModel)]="query"
          [placeholder]="placeholder"
          (ionInput)="onInput()"
          (ionFocus)="onInput()"
          class="us-input">
        </ion-input>
        <button class="us-clear" *ngIf="query" (click)="clear()" aria-label="Clear">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="us-dropdown" *ngIf="showList && results.length">
        <button class="us-item" *ngFor="let u of results" (click)="pick(u.username)">
          <span class="us-avatar"><app-avatar [username]="u.username" [name]="u.username"></app-avatar></span>
          <span class="us-name">{{ u.username }}</span>
          <span class="us-role">{{ u.role }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; flex: 1; min-width: 0; }
    .us-wrap { position: relative; width: 100%; }
    .us-input-row {
      display: flex; align-items: center; gap: 6px;
      background: var(--bg-input, rgba(255,255,255,0.04));
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding-right: 8px;
    }
    .us-input { flex: 1; --background: transparent; --padding-start: 12px; }
    .us-clear {
      background: transparent; border: none; color: var(--color-text-muted);
      font-size: 15px; cursor: pointer; padding: 6px; flex-shrink: 0;
    }
    .us-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
      background: #08202a;            /* neprozirno — da se sadržaj ispod ne providi */
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.55);
      max-height: 260px; overflow-y: auto;
    }
    .us-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 10px 12px; background: transparent; border: none;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      cursor: pointer; text-align: left;
    }
    .us-item:last-child { border-bottom: none; }
    .us-item:active { background: rgba(255,255,255,0.06); }
    .us-avatar {
      width: 30px; height: 30px; border-radius: 50%; overflow: hidden;
      flex-shrink: 0; background: rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); color: var(--color-primary); font-size: 13px;
    }
    .us-name { flex: 1; font-family: var(--font-display); font-size: 14px; color: var(--color-text); }
    .us-role {
      font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase;
      color: var(--color-text-muted); opacity: 0.6;
    }
  `]
})
export class UserSearchComponent {
  @Input() placeholder = 'Search username...';
  @Input() exclude?: string;                 // sakrij sebe iz rezultata
  @Output() picked = new EventEmitter<string>();

  query = '';
  results: { username: string; role: string }[] = [];
  showList = false;

  private readonly url = 'https://spite-backend.fly.dev/api/users/search';
  private deb: any;

  constructor(private http: HttpClient) {}

  onInput() {
    const q = this.query.trim();
    this.picked.emit(q); // drži roditeljsku promenljivu u sinhronu i bez klika
    clearTimeout(this.deb);
    if (q.length < 2) { this.results = []; this.showList = false; return; }
    this.deb = setTimeout(() => this.search(q), 250);
  }

  private search(q: string) {
    this.http.get<any[]>(`${this.url}?q=${encodeURIComponent(q)}`).subscribe({
      next: (rows) => {
        const ex = (this.exclude || '').toLowerCase();
        this.results = (rows || []).filter(r => r.username.toLowerCase() !== ex);
        this.showList = true;
      },
      error: () => { this.results = []; this.showList = false; }
    });
  }

  pick(username: string) {
    this.query = username;
    this.results = [];
    this.showList = false;
    this.picked.emit(username);
  }

  clear() {
    this.query = '';
    this.results = [];
    this.showList = false;
    this.picked.emit('');
  }
}
