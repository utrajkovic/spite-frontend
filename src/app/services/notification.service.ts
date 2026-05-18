import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { environment } from '../../environments/environment';

const DAILY_REMINDER_ID = 1001;
const INACTIVITY_REMINDER_ID = 1002;

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly API_URL = 'https://spite-backend-v2.onrender.com/api';

  constructor(private http: HttpClient, private router: Router) {}

  async init(username: string) {
    if (Capacitor.isNativePlatform()) {
      await this.initNativePush(username);
      await this.initLocalNotifications();
    } else {
      await this.initWebPush(username);
    }
  }

  // =============================================
  // WEB PUSH (browser - Android Chrome, iOS Safari 16.4+)
  // =============================================

  private async initWebPush(username: string) {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

    const vapidKey = (environment.vapidKey || '').trim();
    if (!vapidKey || vapidKey.includes('PLACEHOLDER') || !/^[A-Za-z0-9_-]+$/.test(vapidKey)) {
      console.warn('Web push skipped: invalid or missing VAPID key.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      const app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
      const messaging = getMessaging(app);

      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg
      });

      if (token) {
        this.saveFcmToken(username, token);
      }

      // Foreground notifikacije (kad je app otvorena)
      onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        if (title) {
          new Notification(title, {
            body,
            icon: '/assets/icon/icon-192.png',
            data: payload.data
          });
        }
      });

    } catch (e) {
      console.warn('Web push init failed:', e);
    }
  }

  // =============================================
  // NATIVE PUSH (Capacitor - Android/iOS APK)
  // =============================================

  private async initNativePush(username: string) {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const { receive } = await PushNotifications.requestPermissions();
    if (receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: any) => {
      this.saveFcmToken(username, token.value);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      this.handlePushAction(action.notification.data);
    });
  }

  // =============================================
  // LOCAL NOTIFICATIONS (samo native)
  // =============================================

  private async initLocalNotifications() {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') return;
    await this.scheduleDailyReminderNative();
  }

  private async scheduleDailyReminderNative() {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });

    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);
    if (scheduledTime <= new Date()) scheduledTime.setDate(scheduledTime.getDate() + 1);

    await LocalNotifications.schedule({
      notifications: [{
        id: DAILY_REMINDER_ID,
        title: '💪 Spite',
        body: 'Time to train! Your workout is waiting.',
        schedule: { at: scheduledTime, repeats: true, every: 'day' },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#00ffff'
      }]
    } as any);
  }

  async scheduleInactivityReminder(daysThreshold = 3) {
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: INACTIVITY_REMINDER_ID }] });

    const triggerAt = new Date();
    triggerAt.setDate(triggerAt.getDate() + daysThreshold);
    triggerAt.setHours(10, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [{
        id: INACTIVITY_REMINDER_ID,
        title: '🔥 Spite - Come back!',
        body: `It's been ${daysThreshold} days since your last workout. Get back on track!`,
        schedule: { at: triggerAt },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#ff6600'
      }]
    } as any);
  }

  // =============================================
  // SHARED
  // =============================================

  private saveFcmToken(username: string, token: string) {
    this.http.post(`${this.API_URL}/users/fcm-token`, { username, token })
      .subscribe({ error: (e) => console.warn('FCM token save failed', e) });
  }

  private handlePushAction(data: any) {
    if (!data?.type) return;
    switch (data.type) {
      case 'message': this.router.navigate(['/chat', data.from]); break;
      case 'invite': this.router.navigate(['/tabs/tab-profile']); break;
      case 'workout_assigned': this.router.navigate(['/tabs/tab1']); break;
    }
  }

  async cleanup() {
    if (Capacitor.isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.removeAllListeners();
    }
  }
}
