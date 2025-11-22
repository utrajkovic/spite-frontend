import { Injectable } from '@angular/core';
import { db } from '../firebase';
import {
    collection, addDoc, query, where,
    orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    constructor() { }

    async sendMessage(senderId: string, receiverId: string, text: string) {
        return await addDoc(collection(db, 'messages'), {
            senderId,
            receiverId,
            text,
            participants: [senderId, receiverId],  
            timestamp: serverTimestamp()
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

            callback(all);
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

            snapshot.forEach(doc => {
                const msg = doc.data() as any;

                const other =
                    msg.senderId === me ? msg.receiverId : msg.senderId;

                if (!list.includes(other)) {
                    list.push(other);
                }
            });

            callback(list);
        });
    }
    checkUserExists(username: string) {
        return fetch(`https://spite-backend-v2.onrender.com/api/users/exists/${username}`)
            .then(res => res.json()); 
    }

}
