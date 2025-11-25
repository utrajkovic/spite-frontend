import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonCheckbox,
  IonButton, IonHeader, IonToolbar, IonButtons, IonIcon, IonTitle
} from '@ionic/angular/standalone';
import { Exercise } from '../services/models';
import { LocalDataService } from '../services/local-data.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SelectedExercisesService } from '../services/selected-exercises.service';

@Component({
  standalone: true,
  selector: 'app-select-exercises',
  templateUrl: './select-exercises.page.html',
  styleUrls: ['./select-exercises.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonButton,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonTitle
  ]
})
export class SelectExercisesPage implements OnInit {
  allExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedIds: string[] = [];

  readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private localData: LocalDataService,
    private http: HttpClient,
    private router: Router,
    private selectedService: SelectedExercisesService
  ) { }

  async ngOnInit() {
    this.selectedService.selectedIds$.subscribe(ids => {
      this.selectedIds = [...ids];
    });

    const user = await this.localData.getUser();
    if (!user) return;

    this.http.get<Exercise[]>(`${this.backendUrl}/api/exercises/user/${user.id}`)
      .subscribe(res => {
        this.allExercises = res;
        this.filteredExercises = res;
      });
  }

  onSearch(event: any) {
    const q = event.target.value?.toLowerCase() || '';
    this.filteredExercises = this.allExercises.filter(ex =>
      ex.name.toLowerCase().includes(q)
    );
  }

  toggleSelect(id: string) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(x => x !== id);
    } else {
      this.selectedIds.push(id);
    }
  }

  saveSelection() {
    this.selectedService.setSelected(this.selectedIds);
    this.localData.triggerTab2Refresh();
    this.router.navigateByUrl('/tabs/tab2');
  }

  goBack() {
    this.router.navigateByUrl('/tabs/tab2');
  }
}
