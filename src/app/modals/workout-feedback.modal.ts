import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonButton } from "@ionic/angular/standalone";
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';



@Component({
    standalone: true,
    selector: 'workout-feedback-modal',
    templateUrl: './workout-feedback.modal.html',
    styleUrls: ['./workout-feedback.modal.scss'],
    imports: [
        IonButton,
        CommonModule,
        FormsModule,
        NgForOf
    ],
})
export class WorkoutFeedbackModal {

    @Input() exercises!: any[];
    feedback: any[] = [];

    constructor(private modalCtrl: ModalController) { }

    ngOnInit() {
        this.feedback = this.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            doneSets: 0,
            doneReps: 0,
            maxKg: null,
            intensity: 'normal'
        }));
    }

    setIntensity(index: number, val: 'easy' | 'normal' | 'hard') {
        this.feedback[index].intensity = val;
    }

    finish() {
        this.modalCtrl.dismiss(this.feedback);
    }
}
