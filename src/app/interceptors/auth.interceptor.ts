import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private alertCtrl: AlertController) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne interceptuj login/register
    if (req.url.includes('/login') || req.url.includes('/register')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError(async (err: HttpErrorResponse) => {
        if (err.status === 403 || err.status === 404) {
          const body = typeof err.error === 'string' ? err.error : '';
          if (body === 'blocked' || body === 'deleted' || err.status === 403) {
            await this.forceLogout();
          }
        }
        return throwError(() => err);
      }) as any
    );
  }

  async forceLogout() {
    await Preferences.remove({ key: 'user' });
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('role');

    const alert = await this.alertCtrl.create({
      header: 'Pristup odbijen',
      message: 'Vaš nalog je izbrisan ili trenutno blokiran. Molimo kontaktirajte našu podršku.',
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
