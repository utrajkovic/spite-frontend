import { Component, Input } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle,
  IonContent, IonButton
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-alert-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <div class="alert-content" [innerHTML]="html"></div>

      <ion-button expand="block" color="primary" (click)="dismiss()">OK</ion-button>

    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: rgba(0, 40, 60, 0.45);
      backdrop-filter: blur(10px);
    }

    .alert-content {
      color: #aefcff;
      text-shadow: 0 0 6px rgba(0,255,255,0.4);
      font-size: 16px;
      text-align: center;
    }

    video {
      width: 100%;
      border-radius: 12px;
      margin-top: 12px;
      box-shadow: 0 0 14px rgba(0,255,255,0.3);
    }
  `],
  imports: [
    IonHeader, IonToolbar, IonTitle,
    IonContent, IonButton
  ]
})
export class AlertModalComponent {
  @Input() title: string = 'Message';
  @Input() html: string = '';

  dismiss() {
    (window as any).modalController.dismiss();
  }
}
