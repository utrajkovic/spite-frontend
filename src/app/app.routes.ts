import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'workout/:id',
    loadComponent: () => import('./workout/workout.page').then( m => m.WorkoutPage)
  },
];
