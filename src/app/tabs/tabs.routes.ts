import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'tab-messages',
        loadComponent: () =>
          import('../tab-messages/tab-messages.page').then(m => m.TabMessagesPage),
      },
      {
        path: 'tab1',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'tab-trainer',
        loadComponent: () =>
          import('../tab-trainer/tab-trainer.page').then((m) => m.TabTrainerPage),
      },
      {
        path: 'tab-admin',
        loadComponent: () =>
          import('../tab-admin/tab-admin.page').then((m) => m.TabAdminPage),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],

  },
  {
    path: 'test',
    loadComponent: () => import('../tab-trainer/tab-trainer.page').then(m => m.TabTrainerPage),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'chat/:username',
    loadComponent: () =>
      import('../chat/chat.page').then(m => m.ChatPage),
  },

];
