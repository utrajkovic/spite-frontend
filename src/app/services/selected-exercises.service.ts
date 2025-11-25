import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectedExercisesService {

  private selectedIdsSource = new BehaviorSubject<string[]>([]);
  selectedIds$ = this.selectedIdsSource.asObservable();

  setSelected(ids: string[]) {
    this.selectedIdsSource.next(ids);
  }

  getSelected(): string[] {
    return this.selectedIdsSource.value;
  }

  clear() {
    this.selectedIdsSource.next([]);
  }
}
