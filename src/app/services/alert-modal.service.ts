import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AlertModalComponent } from '../shared/alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root'
})
export class AlertModalService {

  constructor(private modalCtrl: ModalController) {}

  async show(title: string, html: string) {
    const modal = await this.modalCtrl.create({
      component: AlertModalComponent,
      componentProps: { title, html },
      cssClass: 'alert-modal'
    });

    await modal.present();
  }

  success(message: string) {
    return this.show('Success', message);
  }

  error(message: string) {
    return this.show('Error', message);
  }

  info(message: string) {
    return this.show('Info', message);
  }

  previewVideo(videoUrl: string, description = '') {
    const html = `
      <video src="${videoUrl}" controls autoplay></video>
      <p>${description}</p>
    `;
    return this.show("Exercise Preview", html);
  }
}
