import { Injectable } from '@angular/core';
import { db } from '../firebase';
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp,
  getDocs, updateDoc, doc
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  unreadMap: Record<string, boolean> = {};
  globalUnread = false;

  constructor() { }

  async sendMessage(senderId: string, receiverId: string, text: string) {
    return await addDoc(collection(db, 'messages'), {
      senderId,
      receiverId,
      text,
      participants: [senderId, receiverId],
      timestamp: serverTimestamp(),
      seen: false    
    });
  }

  listenToChat(userA: string, userB: string, callback: any) {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', userA),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) =>
          (m.senderId === userA && m.receiverId === userB) ||
          (m.senderId === userB && m.receiverId === userA)
        );

      if (this.unreadMap[userB]) {
        this.unreadMap[userB] = false;
        this.updateGlobalUnread();
      }

      callback(all);
    });
  }

  listenUnread(myId: string, callback: (unread: boolean) => void) {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', myId)
    );

    return onSnapshot(q, (snapshot) => {
      const newMap: Record<string, boolean> = {};

      snapshot.forEach(docSnap => {
        const msg = docSnap.data() as any;

        if (
          msg.receiverId === myId &&
          msg.senderId !== myId &&
          msg.seen === false
        ) {
          newMap[msg.senderId] = true;
        }
      });

      this.unreadMap = newMap;
      this.updateGlobalUnread();
      callback(this.globalUnread);
    });
  }

  listenToConversations(me: string, callback: any) {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', me),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const list: string[] = [];

      snapshot.forEach(docSnap => {
        const msg = docSnap.data() as any;

        const other =
          msg.senderId === me ? msg.receiverId : msg.senderId;

        if (!list.includes(other)) {
          list.push(other);
        }
      });

      callback(list);
    });
  }

  async markMessagesAsRead(me: string, other: string) {
    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', other),
      where('receiverId', '==', me),
      where('seen', '==', false)
    );

    const snaps = await getDocs(q);
    for (const msg of snaps.docs) {
      await updateDoc(doc(db, 'messages', msg.id), { seen: true });
    }
  }

  markAsRead(username: string) {
    this.unreadMap[username] = false;
    this.updateGlobalUnread();
  }

  private updateGlobalUnread() {
    this.globalUnread = Object.values(this.unreadMap).some(v => v === true);
  }

  checkUserExists(username: string) {
    return fetch(`https://spite-backend-v2.onrender.com/api/users/exists/${username}`)
      .then(res => res.json());
  }


  listenToUnreadGlobal(myId: string, callback: (v: boolean) => void) {
    return onSnapshot(collection(db, 'messages'), (snapshot) => {
      let unreadExists = false;

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();
        if (data.lastSender !== myId && data.lastSender) {
          unreadExists = true;
        }
      });

      callback(unreadExists);
    });
  }
}
