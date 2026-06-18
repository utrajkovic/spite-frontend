import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'page-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="active">
      <div class="box">
        <div class="spinner"></div>
        <p class="msg">{{ message }}</p>
        <div class="lo-bar" *ngIf="progress !== null">
          <div class="lo-bar-fill" [style.width.%]="progress"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./page-loading-overlay.component.scss']
})
export class PageLoadingOverlayComponent {
  @Input() active = false;
  @Input() message = "Loading...";
  @Input() progress: number | null = null; // 0–100 → prikaže traku; null → samo spinner
}

