import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { CommonModule, UpperCasePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../services/chat.service';
import { LocalDataService } from '../services/local-data.service';
import { BackendService } from '../services/backend.service';
import { TrainerInbox } from '../services/models';
import { AlertController } from '@ionic/angular';

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
    IonInput
  ]
})
export class TabMessagesPage {

  myId!: string;
  myRole = '';
  conversations: string[] = [];
  trainerInbox: TrainerInbox | null = null;
  inboxLoading = false;

  newChatUsername: string = '';
  unsubscribe: any = null;

  constructor(
    private chat: ChatService,
    private local: LocalDataService,
    private router: Router,
    private backend: BackendService,
    private alertCtrl: AlertController
  ) { }

  async ionViewWillEnter() {
    const me = await this.local.getUser();
    this.myId = me.username;
    this.myRole = me.role || '';

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.chat.listenToConversations(this.myId, (list: string[]) => {
      this.conversations = list ?? [];
    });

    this.loadTrainerInbox();
  }

  ionViewWillLeave() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  hasUnread(username: string) {
    return this.chat.unreadMap[username] === true;
  }

  openChat(username: string) {
    this.chat.markAsRead(username);
    this.router.navigate(['/chat', username]);
  }

  get isTrainer(): boolean {
    return this.myRole === 'TRAINER';
  }

  loadTrainerInbox() {
    if (!this.isTrainer || !this.myId) {
      this.trainerInbox = null;
      return;
    }

    this.inboxLoading = true;
    this.backend.getTrainerInbox(this.myId).subscribe({
      next: (data) => {
        this.trainerInbox = data;
        this.inboxLoading = false;
      },
      error: () => {
        this.inboxLoading = false;
      }
    });
  }

  markCheckInReviewed(id?: string) {
    if (!id) return;
    this.backend.markCheckInReviewed(id).subscribe({
      next: () => this.loadTrainerInbox(),
      error: () => this.showAlert('Unable to mark check-in as reviewed.')
    });
  }

  markAllReviewed() {
    if (!this.myId) return;
    this.backend.markAllCheckInsReviewed(this.myId).subscribe({
      next: async (msg) => {
        await this.showAlert(msg || 'All pending check-ins reviewed.');
        this.loadTrainerInbox();
      },
      error: () => this.showAlert('Bulk review failed.')
    });
  }

  sendLateReminders() {
    if (!this.myId) return;
    this.backend.sendBulkLateReminders(this.myId).subscribe({
      next: async (msg) => {
        await this.showAlert(msg || 'Reminders sent.');
      },
      error: () => this.showAlert('Failed to send reminders.')
    });
  }

  async markFeedbackRead(feedbackId: string) {
    this.backend.markFeedbackReadByTrainer(feedbackId).subscribe({
      next: () => this.loadTrainerInbox(),
      error: () => this.showAlert('Failed to mark feedback as read.')
    });
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

  private async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Notification',
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
