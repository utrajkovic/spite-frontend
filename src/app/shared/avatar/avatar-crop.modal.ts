import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-avatar-crop',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons, IonButton,
    ImageCropperComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Adjust photo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="crop-content">
      <image-cropper
        [imageFile]="file"
        [maintainAspectRatio]="true"
        [aspectRatio]="1"
        [roundCropper]="true"
        [resizeToWidth]="400"
        format="jpeg"
        (imageCropped)="onCropped($event)"
        (loadImageFailed)="onFail()">
      </image-cropper>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button [strong]="true" [disabled]="!croppedBlob" (click)="confirm()">Use photo</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .crop-content {
      --background: #0d0d0d;
    }
    image-cropper {
      display: block;
      width: 100%;
      max-height: 70vh;
      padding: 8px;
      box-sizing: border-box;
    }
  `]
})
export class AvatarCropModal {
  @Input() file!: File;

  croppedBlob: Blob | null = null;

  constructor(private modalCtrl: ModalController) {}

  onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onFail(): void {
    this.modalCtrl.dismiss(null);
  }

  cancel(): void {
    this.modalCtrl.dismiss(null);
  }

  confirm(): void {
    if (this.croppedBlob) this.modalCtrl.dismiss(this.croppedBlob);
  }
}
