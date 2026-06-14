import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { IonContent } from '@ionic/angular/standalone';
import { PwaInstallService } from '../services/pwa-install.service';

@Component({
  selector: 'app-install-gate',
  templateUrl: './install-gate.page.html',
  styleUrls: ['./install-gate.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent]
})
export class InstallGatePage implements OnInit {
  busy = true;      // dok se ne odluči da li prikazati gate
  installing = false;
  inApp = false;    // otvoreno u in-app browseru (Instagram, FB, TikTok...)
  isIos = false;    // iOS uređaj (drugačiji tok — Safari / Add to Home Screen)

  constructor(
    private router: Router,
    private pwa: PwaInstallService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    // Već ulogovan -> pravo u aplikaciju
    const user = await Preferences.get({ key: 'user' });
    if (user.value) {
      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      return;
    }

    const choseWeb = localStorage.getItem('installGateChoice') === 'web';

    // Gate prikazujemo SAMO na Androidu koji nije instaliran i nije već izabrao web.
    // iOS i desktop idu pravo na login (na iOS-u home-screen već radi odlično).
    const android = this.pwa.isAndroid();
    const ios = this.pwa.isIos();

    // Gate samo na mobilnom (Android/iOS), kad nije instaliran i nije već izabran web.
    if ((!android && !ios) || this.pwa.isStandalone() || choseWeb) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.isIos = ios;
    this.inApp = this.isInAppBrowser();
    this.busy = false; // prikaži gate
  }

  /** In-app browseri (Instagram, FB, TikTok...) ne podržavaju PWA install. */
  private isInAppBrowser(): boolean {
    const ua = navigator.userAgent || '';
    return /Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|Snapchat|Pinterest/i.test(ua);
  }

  /** Forsira otvaranje u Chrome-u (Android intent) — odatle PWA install radi. */
  openInChrome() {
    const target = `${location.host}/`;
    window.location.href = `intent://${target}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  async install() {
    if (this.installing) return;
    this.installing = true;
    const outcome = await this.pwa.prompt();
    this.installing = false;

    if (outcome === 'accepted') {
      // WebAPK se instalira; pusti korisnika dalje na web dok ne otvori app iz drawera
      localStorage.setItem('installGateChoice', 'web');
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    if (outcome === 'unavailable') {
      await this.showManualGuide();
    }
    // 'dismissed' -> ostaje na gate ekranu
  }

  continueWeb() {
    localStorage.setItem('installGateChoice', 'web');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async showManualGuide() {
    const message =
      '<div style="text-align:left;text-shadow:none;line-height:1.55;font-size:14px;color:#f2f2f2">' +
        '<p style="margin:0 0 14px">Dodaj <b>Spite</b> na početni ekran (Chrome):</p>' +
        '<ol style="margin:0;padding-left:22px">' +
          '<li style="margin-bottom:10px">Tapni <b>meni</b> ' +
            '<span style="display:inline-block">&#x22EE;</span> gore desno</li>' +
          '<li style="margin-bottom:10px">Tapni <b>&ldquo;Install app&rdquo;</b> ili <b>&ldquo;Add to Home screen&rdquo;</b></li>' +
          '<li>Potvrdi sa <b>Install</b></li>' +
        '</ol>' +
      '</div>';

    const a = await this.alertCtrl.create({
      header: 'Instaliraj Spite',
      message,
      buttons: ['U redu'],
      cssClass: 'custom-alert install-alert'
    });
    await a.present();
  }
}
