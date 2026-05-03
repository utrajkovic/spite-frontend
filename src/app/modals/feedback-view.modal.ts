import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { VideoComment } from '../services/models';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'app-feedback-view-modal',
    templateUrl: './feedback-view.modal.html',
    styleUrls: ['./feedback-view.modal.scss'],
    imports: [
        CommonModule,
                FormsModule,
        NgForOf,
                NgIf,
        IonButton
    ]
})
export class FeedbackViewModal {

    @Input() feedback: any;
        videoComments: VideoComment[] = [];
        timestampSec: number | null = null;
        newComment = '';
        me = '';
        role = '';
        addingComment = false;

        constructor(
            private modalCtrl: ModalController,
            private backend: BackendService
        ) { }

        ngOnInit() {
            const stored = localStorage.getItem('user');
            if (stored) {
                const user = JSON.parse(stored);
                this.me = user.username || '';
                this.role = user.role || '';
            }
            this.loadComments();

            if (this.isTrainer && this.feedback?.id) {
                this.backend.markFeedbackReadByTrainer(this.feedback.id).subscribe({ error: () => {} });
            }
        }

        get isTrainer(): boolean {
            return this.role === 'TRAINER';
        }

        loadComments() {
            if (!this.feedback?.id) return;
            this.backend.getVideoComments(this.feedback.id).subscribe({
                next: (rows) => {
                    this.videoComments = rows || [];
                },
                error: () => {
                    this.videoComments = [];
                }
            });
        }

        addComment() {
            if (!this.isTrainer || !this.feedback?.id || !this.feedback?.userId) return;
            if (this.addingComment || this.timestampSec == null || this.timestampSec < 0 || !this.newComment.trim()) return;

            this.addingComment = true;

            this.backend.addVideoComment({
                feedbackId: this.feedback.id,
                exerciseId: this.feedback.exercises?.[0]?.exerciseId,
                trainerUsername: this.me,
                clientUsername: this.feedback.userId,
                timestampSec: this.timestampSec,
                comment: this.newComment.trim()
            }).subscribe({
                next: () => {
                    this.addingComment = false;
                    this.timestampSec = null;
                    this.newComment = '';
                    this.loadComments();
                },
                error: () => {
                    this.addingComment = false;
                }
            });
        }

        toTime(sec?: number) {
            if (sec == null || sec < 0) return '00:00';
            const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
            const seconds = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        }

    dismiss() {
        this.modalCtrl.dismiss();
    }
}
