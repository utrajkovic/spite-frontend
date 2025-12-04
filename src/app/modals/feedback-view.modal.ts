import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule, NgForOf } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';

@Component({
    standalone: true,
    selector: 'app-feedback-view-modal',
    templateUrl: './feedback-view.modal.html',
    styleUrls: ['./feedback-view.modal.scss'],
    imports: [
        CommonModule,
        NgForOf,
        IonButton
    ]
})
export class FeedbackViewModal {

    @Input() feedback: any;

    constructor(private modalCtrl: ModalController) { }

    dismiss() {
        this.modalCtrl.dismiss();
    }
}
