import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { ExercisePR } from '../services/pr.service';
import { PRDetailModal } from './pr-detail.modal';

@Component({
  standalone: true,
  selector: 'pr-list-modal',
  templateUrl: './pr-list.modal.html',
  styleUrls: ['./pr-list.modal.scss'],
  imports: [CommonModule],
  providers: [ModalController]
})
export class PRListModal {
  @Input() prs: ExercisePR[] = [];

  constructor(private modalCtrl: ModalController) {}

  async openPR(pr: ExercisePR) {
    const modal = await this.modalCtrl.create({
      component: PRDetailModal,
      componentProps: { pr },
      cssClass: 'pr-modal-wrapper'
    });
    await modal.present();
  }

  dismiss() { this.modalCtrl.dismiss(); }
}