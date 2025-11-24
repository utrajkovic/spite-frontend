import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonButton,
  IonSearchbar
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { LocalDataService } from '../services/local-data.service';
import { Exercise } from '../services/models';

@Component({
  selector: 'app-exercise-selector',
  templateUrl: './exercise-selector.page.html',
  styleUrls: ['./exercise-selector.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonButton,
    IonSearchbar
  ]
})
export class ExerciseSelectorPage implements OnInit {

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selected: string[] = [];
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private localData: LocalDataService,
    private navCtrl: NavController
  ) { }

  async ngOnInit() {
    const state = history.state as { preselected?: string[] };
    if (state && state.preselected) {
      this.selected = [...state.preselected];
    }

    await this.loadExercises();
  }

  async loadExercises() {
    try {
      const user = await this.localData.getUser();
      if (!user) {
        console.warn('No logged-in user!');
        this.allExercises = [];
        this.filteredExercises = [];
        return;
      }

      this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
        .subscribe({
          next: (res) => {
            this.allExercises = res;
            this.applyFilter();
          },
          error: (err) => console.error('Error loading exercises in selector:', err)
        });

    } catch (err) {
      console.error('Error fetching user in selector:', err);
    }
  }

  applyFilter() {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) {
      this.filteredExercises = [...this.allExercises];
      return;
    }
    this.filteredExercises = this.allExercises.filter(e =>
      e.name.toLowerCase().includes(q)
    );
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilter();
  }

  isSelected(id: string): boolean {
    return this.selected.includes(id);
  }

  getOrder(id: string): number {
    return this.selected.indexOf(id) + 1;
  }

  toggleSelect(id: string) {
    const index = this.selected.indexOf(id);
    if (index === -1) {
      this.selected.push(id);
    } else {
      this.selected.splice(index, 1);
    }
  }

  expanded: boolean = false;

  toggleList() {
    this.expanded = !this.expanded;
  }


  confirmSelection() {
    this.navCtrl.navigateBack('/tabs/tab2', {
      state: { selected: this.selected }
    });

  }

  cancel() {
    this.navCtrl.navigateBack('/tabs/tab2');
  }
}
