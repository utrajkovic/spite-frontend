import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarService } from './avatar.service';

/**
 * Popunjava roditeljski wrapper (100% širine/visine). Prikazuje sliku ako postoji,
 * inače prvo slovo `name` (nasleđuje font/boju roditelja) ili user ikonicu.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img *ngIf="resolvedUrl" [src]="resolvedUrl" class="av-img" alt="" />
    <span *ngIf="!resolvedUrl && name" class="av-letter">{{ name[0] | uppercase }}</span>
    <i *ngIf="!resolvedUrl && !name" class="fa-solid fa-user av-icon"></i>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
      overflow: hidden;
    }
    .av-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .av-letter { font: inherit; color: inherit; line-height: 1; }
    .av-icon { font-size: 1.4em; color: inherit; }
  `]
})
export class AvatarComponent implements OnChanges {
  /** Korisničko ime — koristi se za dohvat slike i kao fallback slovo. */
  @Input() username?: string;
  /** Eksplicitno slovo (ako se razlikuje od username-a). Podrazumevano = username. */
  @Input() name?: string;
  /** Eksplicitni URL (preskače dohvat servisom). */
  @Input() url?: string | null;

  resolvedUrl: string | null = null;

  constructor(private avatars: AvatarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.name === undefined && this.username) {
      this.name = this.username;
    }
    if (this.url !== undefined) {
      this.resolvedUrl = this.url;
      return;
    }
    if (this.username) {
      this.avatars.getUrl(this.username).subscribe(u => this.resolvedUrl = u);
    }
  }
}
