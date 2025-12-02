import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonTitle, IonToolbar, IonRouterOutlet, IonContent, IonApp } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonApp, IonContent,
    IonRouterOutlet, IonToolbar,
    IonTitle, IonHeader, IonTabs,
    IonTabBar, IonTabButton,
    IonIcon, IonLabel, CommonModule
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  role: string | null = null;
  hasUnreadMessages = false;
  unsubscribeUnread: any = null;


  constructor(private chat: ChatService) {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.role = parsed.role;
      const myUsername = parsed.username;

      if (this.unsubscribeUnread) {
        this.unsubscribeUnread();
      }

      this.unsubscribeUnread = this.chat.listenUnread(myUsername, (hasUnread) => {
        this.hasUnreadMessages = hasUnread;
      });
    }
  }

  ionViewWillLeave() {
    if (this.unsubscribeUnread) {
      this.unsubscribeUnread();
    }
  }



}
