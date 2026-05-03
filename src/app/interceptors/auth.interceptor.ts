import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private showingServerError = false;

  constructor(private router: Router, private alertCtrl: AlertController) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne interceptuj login/register
    if (req.url.includes('/login') || req.url.includes('/register')) {
      return next.handle(req);
    }

    return from(this.getToken()).pipe(
      switchMap((token) => {
        const securedReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;

        return next.handle(securedReq).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
              this.forceLogout();
            } else if (err.status === 403 || err.status === 404) {
              const body = typeof err.error === 'string' ? err.error : '';
              if (body === 'blocked' || body === 'deleted' || err.status === 403) {
                this.forceLogout();
              }
            } else if (err.status === 0 || err.status >= 500) {
              this.showServerError();
            }

            return throwError(() => err);
          })
        );
      })
    );
  }

  private async getToken(): Promise<string | null> {
    const inLocalStorage = localStorage.getItem('authToken');
    if (inLocalStorage) return inLocalStorage;

    const stored = await Preferences.get({ key: 'authToken' });
    if (stored.value) {
      localStorage.setItem('authToken', stored.value);
      return stored.value;
    }
    return null;
  }

  private async showServerError() {
    if (this.showingServerError) return;
    this.showingServerError = true;

    const alert = await this.alertCtrl.create({
      header: 'Server error',
      message: 'Server is currently unavailable. Please try again in a few moments.',
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
    await alert.onDidDismiss();
    this.showingServerError = false;
  }

  async forceLogout() {
    await Preferences.remove({ key: 'user' });
    await Preferences.remove({ key: 'authToken' });
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('authToken');

    const alert = await this.alertCtrl.create({
      header: 'Pristup odbijen',
      message: 'Vaša sesija je istekla, nalog je blokiran, ili je nalog obrisan. Prijavite se ponovo.',
      cssClass: 'custom-alert',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigateByUrl('/login', { replaceUrl: true });
        }
      }]
    });
    await alert.present();
  }
}
