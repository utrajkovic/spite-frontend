import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonTitle, IonToolbar, IonRouterOutlet, IonContent, IonApp } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonApp, IonContent,
    IonRouterOutlet, IonToolbar,
    IonTitle, IonHeader, IonTabs,
    IonTabBar, IonTabButton,
    IonIcon, IonLabel, CommonModule, IonAlert
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  role: string | null = null;


  constructor() {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.role = parsed.role;
    } else {
      this.role = null;
    }
  }

}
