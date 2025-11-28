import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/angular/standalone';
import { CommonModule, UpperCasePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../services/chat.service';
import { LocalDataService } from '../services/local-data.service';
import { IonAlert } from '@ionic/angular/standalone';


@Component({
  selector: 'app-tab-messages',
  templateUrl: './tab-messages.page.html',
  styleUrls: ['./tab-messages.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgForOf,
    NgIf,
    UpperCasePipe,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonAlert
  ]
})
export class TabMessagesPage {

  myId!: string;
  conversations: string[] = [];

  newChatUsername: string = '';
  unsubscribe: any = null;

  constructor(
    private chat: ChatService,
    private local: LocalDataService,
    private router: Router
  ) { }

  async ionViewWillEnter() {
    const me = await this.local.getUser();
    this.myId = me.username;

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.chat.listenToConversations(this.myId, (list: string[]) => {
      this.conversations = list ?? [];
    });
  }

  ionViewWillLeave() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  openChat(username: string) {
    this.router.navigate(['/chat', username]);
  }

  async startNewChat() {
    this.newChatUsername = this.newChatUsername.trim();

    if (!this.newChatUsername) return;

    if (this.newChatUsername === this.myId) {
      alert('You cannot chat with yourself.');
      return;
    }

    try {
      const exists = await this.chat.checkUserExists(this.newChatUsername);

      if (exists === true) {

        if (!this.conversations.includes(this.newChatUsername)) {
          this.conversations = [this.newChatUsername, ...this.conversations];
        }

        this.router.navigate(['/chat', this.newChatUsername]);
      } else {
        alert('User not found.');
      }
    } catch (err) {
      console.error(err);
      alert('Error while checking user.');
    } finally {
      this.newChatUsername = '';
    }
  }
}
