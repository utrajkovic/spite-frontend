import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WorkoutItem, Exercise } from '../services/models';
import { IonButton, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LocalDataService } from '../services/local-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'exercise-settings-modal',
  templateUrl: './exercise-settings-modal.component.html',
  styleUrls: ['./exercise-settings-modal.component.scss'],
  imports: [
    FormsModule,
    IonButton, IonItem, IonLabel, IonSelect, IonSelectOption,
    IonInput, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,CommonModule
  ]
})
export class ExerciseSettingsModalComponent implements OnInit {

  @Input() item!: WorkoutItem;
  @Input() exercise!: Exercise;

  allExercises: Exercise[] = [];

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private localData: LocalDataService
  ) { }

  async ngOnInit() {
    await this.loadExercises();
  }

  async loadExercises() {
    const user = await this.localData.getUser();
    if (!user) return;

    this.allExercises = await this.http
      .get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
      .toPromise() ?? [];
  }

  save() {
    this.modalCtrl.dismiss(this.item);
  }

  close() {
    this.modalCtrl.dismiss(null);
  }
}

