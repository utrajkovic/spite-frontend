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
      </div>
    </div>
  `,
  styleUrls: ['./page-loading-overlay.component.scss']
})
export class PageLoadingOverlayComponent {
  @Input() active = false;
  @Input() message = "Loading...";
}

