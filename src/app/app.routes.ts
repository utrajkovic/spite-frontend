import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [LoginGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [LoginGuard],
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('./tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('./tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('./tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'tab-trainer',
        loadComponent: () =>
          import('./tab-trainer/tab-trainer.page').then((m) => m.TabTrainerPage),
      },
      {
        path: 'tab-admin',
        loadComponent: () =>
          import('./tab-admin/tab-admin.page').then((m) => m.TabAdminPage),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: 'workout/:id',
    loadComponent: () =>
      import('./workout/workout.page').then((m) => m.WorkoutPage),
  },
  {
    path: 'trainer-client/:username',
    loadComponent: () =>
      import('./tab-trainer-client/tab-trainer-client.page').then(m => m.TabTrainerClientPage),
  },
  {
    path: 'tab-trainings',
    loadComponent: () => import('./tab-trainings/tab-trainings.page').then(m => m.TabTrainingsPage)
  },
  {
    path: 'tab-edit/:id',
    loadComponent: () =>
      import('./tab-edit/tab-edit.page').then(m => m.TabEditPage),
  },
];
