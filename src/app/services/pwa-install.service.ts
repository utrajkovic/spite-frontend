import { Injectable } from '@angular/core';

/**
 * Hvata Chrome-ov `beforeinstallprompt` event što ranije (servis se kreira
 * pri startu aplikacije iz AppComponent-a) i izlaže ga ostatku app-a.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;
  installed = false;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.installed = true;
    });
  }

  /** Da li je dostupan native install prompt (Chrome/Edge na Androidu). */
  get canPrompt(): boolean {
    return !!this.deferredPrompt;
  }

  /** App je pokrenuta kao instalirana (standalone), ne u browser tabu. */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
      || (navigator as any).standalone === true;
  }

  isAndroid(): boolean {
    return /android/.test(navigator.userAgent.toLowerCase());
  }

  isIos(): boolean {
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  }

  /** Pokreće native install (WebAPK). Vraća ishod ili 'unavailable'. */
  async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome;
  }
}
