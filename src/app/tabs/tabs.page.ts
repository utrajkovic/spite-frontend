import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonHeader, IonTitle, IonToolbar, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';
import { ChatService } from '../services/chat.service';
import { BadgeService } from '../services/badge.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonRouterOutlet, IonToolbar,
    IonTitle, IonHeader, IonTabs,
    IonTabBar, IonTabButton,
    IonLabel, CommonModule
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  role: string | null = null;
  hasUnreadMessages = false;
  hasProfileBadge = false;
  hasWorkoutBadge = false;
  unsubscribeUnread: any = null;

  constructor(private chat: ChatService, public badge: BadgeService) {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter() {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      this.role = parsed.role;
      const myUsername = parsed.username;

      if (this.unsubscribeUnread) this.unsubscribeUnread();

      this.unsubscribeUnread = this.chat.listenUnread(myUsername, (hasUnread) => {
        this.hasUnreadMessages = hasUnread;
      });

      this.badge.start(myUsername);
      this.badge.hasProfileBadge$.subscribe(v => this.hasProfileBadge = v);
      this.badge.hasWorkoutBadge$.subscribe(v => this.hasWorkoutBadge = v);
    }
  }

  ionViewWillLeave() {
    if (this.unsubscribeUnread) this.unsubscribeUnread();
  }
}
