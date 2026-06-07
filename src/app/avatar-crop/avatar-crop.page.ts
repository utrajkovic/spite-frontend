import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { AvatarService } from '../shared/avatar/avatar.service';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-avatar-crop',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton
  ],
  templateUrl: './avatar-crop.page.html',
  styleUrls: ['./avatar-crop.page.scss']
})
export class AvatarCropPage implements OnInit {

  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('img') imgRef!: ElementRef<HTMLImageElement>;

  imgSrc = '';
  zoom = 1;
  ready = false;
  coverW = 0;
  coverH = 0;
  uploading = false;

  private offsetX = 0;
  private offsetY = 0;
  private vp = 300;
  private natW = 0;
  private natH = 0;
  private baseScale = 1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private username = '';

  private readonly backendUrl = 'https://spite-backend.fly.dev/api';

  constructor(
    private router: Router,
    private zone: NgZone,
    private avatarService: AvatarService,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const file: File | undefined = nav?.extras?.state?.['file'];

    const stored = await Preferences.get({ key: 'user' });
    const user = stored.value ? JSON.parse(stored.value) : null;
    this.username = user?.username ?? '';

    if (!file) {
      this.router.navigateByUrl('/tabs/tab-profile');
      return;
    }

    this.downscaleAndLoad(file);
  }

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
        this.zone.run(() => {
          if (!ctx) { this.imgSrc = tmp.src; return; }
          ctx.drawImage(tmp, 0, 0, w, h);
          this.imgSrc = canvas.toDataURL('image/jpeg', 0.92);
        });
      };
      tmp.onerror = () => this.zone.run(() => this.cancel());
      tmp.src = reader.result as string;
    };
    reader.onerror = () => this.zone.run(() => this.cancel());
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
    this.baseScale = this.vp / Math.min(this.natW, this.natH);
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

  clamp() {
    const s = this.baseScale * this.zoom;
    const maxX = Math.max(0, (this.natW * s - this.vp) / 2);
    const maxY = Math.max(0, (this.natH * s - this.vp) / 2);
    this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
    this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
  }

  cancel() {
    this.router.navigateByUrl('/tabs/tab-profile');
  }

  confirm() {
    if (!this.ready || this.uploading) return;
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
      this.zone.run(() => {
        if (!blob) { this.cancel(); return; }
        this.uploadAvatar(blob);
      });
    }, 'image/jpeg', 0.9);
  }

  uploadAvatar(blob: Blob) {
    this.uploading = true;
    const form = new FormData();
    form.append('image', blob, 'avatar.jpg');
    this.http.post(
      `${this.backendUrl}/users/avatar?username=${this.username}`,
      form,
      { responseType: 'text' }
    ).subscribe({
      next: (url) => {
        this.avatarService.set(this.username, url as string);
        this.uploading = false;
        this.router.navigateByUrl('/tabs/tab-profile');
      },
      error: () => {
        this.uploading = false;
        this.showAlert('Photo upload failed.');
      }
    });
  }

  async showAlert(msg: string) {
    const a = await this.alertCtrl.create({
      message: msg, buttons: ['OK'], cssClass: 'custom-alert'
    });
    await a.present();
  }
}
