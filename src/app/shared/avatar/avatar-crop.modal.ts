import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton
} from '@ionic/angular/standalone';

/**
 * Lagani sopstveni cropper (bez biblioteke): slika se pomera (drag) i zumira (slajder)
 * ispod fiksnog okruglog isečka, pa se renderuje na canvas 400x400.
 */
@Component({
  selector: 'app-avatar-crop',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Adjust photo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="crop-content">
      <div class="crop-stage">
        <div #viewport class="crop-viewport"
             (pointerdown)="onDown($event)"
             (pointermove)="onMove($event)"
             (pointerup)="onUp($event)"
             (pointercancel)="onUp($event)"
             (pointerleave)="onUp($event)">
          <img #img class="crop-img" [src]="imgSrc"
               [style.width.px]="coverW" [style.height.px]="coverH" [style.transform]="transform"
               (load)="onImgLoad()" draggable="false" alt="" />
          <div class="crop-ring"></div>
        </div>

        <div class="zoom-row">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
          <input type="range" min="1" max="4" step="0.01" [(ngModel)]="zoom" (input)="clamp()" />
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button [strong]="true" [disabled]="!ready" (click)="confirm()">Use photo</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .crop-content { --background: #0d0d0d; }
    .crop-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
      padding: 24px 16px;
    }
    .crop-viewport {
      position: relative;
      width: min(78vw, 300px);
      height: min(78vw, 300px);
      overflow: hidden;
      border-radius: 12px;
      background: #000;
      touch-action: none;
      cursor: grab;
      user-select: none;
    }
    .crop-viewport:active { cursor: grabbing; }
    .crop-img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform-origin: center;
      pointer-events: none;
      -webkit-user-drag: none;
    }
    /* jeftina maska: tamno van kruga, providno unutar (ograničeno na viewport) */
    .crop-ring {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle closest-side at 50% 50%,
                  transparent 0 99%, rgba(0, 0, 0, 0.55) 100%);
    }
    .crop-ring::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.85);
    }
    .zoom-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: min(78vw, 300px);
      color: var(--color-text-muted);
    }
    .zoom-row input[type="range"] {
      flex: 1;
      accent-color: var(--color-primary);
    }
    .zoom-row i { font-size: 13px; opacity: 0.7; }
  `]
})
export class AvatarCropModal implements OnInit {
  @Input() file!: File;

  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('img') imgRef!: ElementRef<HTMLImageElement>;

  imgSrc = '';
  zoom = 1;
  ready = false;
  coverW = 0;
  coverH = 0;

  private offsetX = 0;
  private offsetY = 0;
  private vp = 300;
  private natW = 0;
  private natH = 0;
  private baseScale = 1;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.downscaleAndLoad(this.file);
  }

  /** Smanji sliku pre prikaza (telefonske fotke su ogromne -> renderer pukne). */
  private downscaleAndLoad(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const tmp = new Image();
      tmp.onload = () => {
        const MAX = 1000;
        let w = tmp.naturalWidth;
        let h = tmp.naturalHeight;
        const scale = Math.min(1, MAX / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { this.imgSrc = tmp.src; return; }
        ctx.drawImage(tmp, 0, 0, w, h);
        this.imgSrc = canvas.toDataURL('image/jpeg', 0.92);
      };
      tmp.onerror = () => { this.modalCtrl.dismiss(null); };
      tmp.src = reader.result as string;
    };
    reader.onerror = () => { this.modalCtrl.dismiss(null); };
    reader.readAsDataURL(file);
  }

  get transform(): string {
    return `translate(-50%, -50%) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoom})`;
  }

  onImgLoad() {
    const img = this.imgRef.nativeElement;
    this.natW = img.naturalWidth;
    this.natH = img.naturalHeight;
    this.vp = this.viewportRef.nativeElement.clientWidth || 300;
    this.baseScale = this.vp / Math.min(this.natW, this.natH); // cover
    this.coverW = this.natW * this.baseScale;
    this.coverH = this.natH * this.baseScale;
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;
    this.ready = true;
    this.clamp();
  }

  onDown(e: PointerEvent) {
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  onMove(e: PointerEvent) {
    if (!this.dragging) return;
    this.offsetX += e.clientX - this.lastX;
    this.offsetY += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.clamp();
  }

  onUp(_e: PointerEvent) {
    this.dragging = false;
  }

  /** Drži sliku tako da uvek pokriva viewport. */
  clamp() {
    const s = this.baseScale * this.zoom;
    const maxX = Math.max(0, (this.natW * s - this.vp) / 2);
    const maxY = Math.max(0, (this.natH * s - this.vp) / 2);
    this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
    this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
  }

  cancel() {
    this.cleanup();
    this.modalCtrl.dismiss(null);
  }

  confirm() {
    if (!this.ready) return;
    const out = 400;
    const s = this.baseScale * this.zoom;
    const sx = this.natW / 2 + (-this.vp / 2 - this.offsetX) / s;
    const sy = this.natH / 2 + (-this.vp / 2 - this.offsetY) / s;
    const sSize = this.vp / s;

    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.cancel(); return; }
    ctx.drawImage(this.imgRef.nativeElement, sx, sy, sSize, sSize, 0, 0, out, out);

    canvas.toBlob((blob) => {
      this.cleanup();
      this.modalCtrl.dismiss(blob);
    }, 'image/jpeg', 0.9);
  }

  private cleanup() {
    // imgSrc je data URL (downscaled) — nema šta da se oslobađa
  }
}
