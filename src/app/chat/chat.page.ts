import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { LocalDataService } from '../services/local-data.service';
import { FormsModule } from '@angular/forms';

import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { UserNameComponent } from '../shared/user-name/user-name.component';


@Component({
  standalone: true,
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    UserNameComponent
  ]
})
export class ChatPage implements OnInit {

  @ViewChild(IonContent) content?: IonContent;

  me!: string;
  other!: string;
  messages: any[] = [];
  text = '';

  constructor(
    private route: ActivatedRoute,
    private chat: ChatService,
    private local: LocalDataService,
    private location: Location
  ) { }

  async ngOnInit() {
    const user = await this.local.getUser();
    this.me = user.username;

    this.other = this.route.snapshot.paramMap.get('username')!;

    await this.chat.markMessagesAsRead(this.me, this.other);

    this.chat.listenToChat(this.me, this.other, (msgs: any[]) => {
      this.messages = msgs;
      // Pouzdano skrolovanje do dna (ion-content ima svoj scroll kontejner)
      setTimeout(() => this.content?.scrollToBottom(250), 100);
    });
  }




  goBack() {
    this.location.back();
  }


  send() {
    if (!this.text.trim()) return;

    this.chat.sendMessage(this.me, this.other, this.text);
    this.text = '';
  }
}
