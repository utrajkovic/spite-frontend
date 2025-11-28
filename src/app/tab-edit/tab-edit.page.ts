import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonButton, IonList, IonReorderGroup, IonReorder, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Exercise, Workout } from '../services/models';
import { AlertController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';
import { FormsModule } from '@angular/forms';
import { IonSearchbar } from '@ionic/angular/standalone';


@Component({
  standalone: true,
  selector: 'app-tab-edit',
  templateUrl: './tab-edit.page.html',
  styleUrls: ['./tab-edit.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonList,
    IonSearchbar,
    IonReorderGroup,
    IonReorder,
    IonButtons,
    IonSpinner
  ]
})
export class TabEditPage implements OnInit {

  workoutId!: string;
  workout!: Workout;
  editableExercises: Exercise[] = [];
  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchQuery: string = '';
  isSaving: boolean = false;

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController,
    public router: Router,
    private localData: LocalDataService
  ) { }

  async ngOnInit() {
    this.workoutId = this.route.snapshot.paramMap.get('id')!;
    await this.loadWorkout();
    await this.loadAllUserExercises();
    this.filterList();
  }

  async loadWorkout() {
    this.workout = await fetch(`${this.backendUrl}/api/workouts/${this.workoutId}`).then(r => r.json());

    const rawExercises = this.workout.exercises ?? [];
    const rawIds = this.workout.exerciseIds ?? [];

    const map = new Map(rawExercises.map((e: any) => [e.id, e]));

    this.editableExercises = rawIds
      .map(id => map.get(id))
      .filter((e): e is Exercise => !!e);
  }

  async loadAllUserExercises() {
    const user = await this.localData.getUser();
    this.allExercises =
      await this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`).toPromise()
      ?? [];
  }

  onSearch(ev: any) {
    this.searchQuery = ev.target.value?.toLowerCase() || '';
    this.filterList();
  }

  filterList() {
    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(this.searchQuery) &&
      !this.editableExercises.some(e => e.id === ex.id)
    );
  }

  handleReorder(ev: any) {
    const from = ev.detail.from;
    const to = ev.detail.to;
    const moved = this.editableExercises.splice(from, 1)[0];
    this.editableExercises.splice(to, 0, moved);
    ev.detail.complete();
  }

  addExercise(ex: Exercise) {
    this.editableExercises.push(ex);
    this.filterList(); 
  }

  removeExercise(i: number) {
    const removed = this.editableExercises[i];
    this.editableExercises.splice(i, 1);

    if (removed) this.filterList();
  }

  async saveChanges() {
    this.isSaving = true;

    const updated = {
      title: this.workout.title,
      subtitle: this.workout.subtitle,
      content: this.workout.content,
      exerciseIds: this.editableExercises.map(e => e.id!)
    };

    try {
      await this.http.put(`${this.backendUrl}/api/workouts/${this.workoutId}`, updated).toPromise();

      const alert = await this.alertCtrl.create({
        message: 'Workout updated!',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });

      await alert.present();

      this.localData.triggerTab3Refresh();
      this.localData.triggerTab1Refresh();
      this.localData.triggerWorkoutRefresh();
      this.router.navigateByUrl('/tabs/tab3');

    } catch (err) {
      console.error(err);

      const alert = await this.alertCtrl.create({
        message: 'Failed to update workout.',
        buttons: ['OK']
      });

      await alert.present();
    } finally {
      this.isSaving = false;
    }
  }

}
