import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-avatar-crop',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  template: `
    <div class="crop-sheet">
      <p class="crop-title">Adjust your photo</p>

      <div class="crop-area">
        <image-cropper
          [imageFile]="file"
          [maintainAspectRatio]="true"
          [aspectRatio]="1"
          [roundCropper]="true"
          [resizeToWidth]="400"
          [cropperMinWidth]="64"
          format="jpeg"
          (imageCropped)="onCropped($event)">
        </image-cropper>
      </div>

      <div class="crop-actions">
        <button class="crop-btn cancel" (click)="cancel()">Cancel</button>
        <button class="crop-btn save" (click)="confirm()" [disabled]="!croppedBlob">Use photo</button>
      </div>
    </div>
  `,
  styles: [`
    .crop-sheet {
      background: #0d0d0d;
      padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
      border-radius: 20px 20px 0 0;
      color: #f2f2f2;
    }
    .crop-title {
      text-align: center;
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 14px;
    }
    .crop-area {
      max-height: 60vh;
      overflow: hidden;
      border-radius: 12px;
    }
    .crop-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .crop-btn {
      flex: 1;
      padding: 14px;
      border-radius: 14px;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .crop-btn.cancel {
      background: rgba(255, 255, 255, 0.06);
      color: #f2f2f2;
    }
    .crop-btn.save {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #00111a;
    }
    .crop-btn:disabled { opacity: 0.5; }
  `]
})
export class AvatarCropModal {
  @Input() file!: File;

  croppedBlob: Blob | null = null;

  constructor(private modalCtrl: ModalController) {}

  onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  cancel(): void {
    this.modalCtrl.dismiss(null);
  }

  confirm(): void {
    if (this.croppedBlob) this.modalCtrl.dismiss(this.croppedBlob);
  }
}
