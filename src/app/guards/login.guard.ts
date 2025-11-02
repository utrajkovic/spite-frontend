import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = await Preferences.get({ key: 'user' });

    if (user.value) {
      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      return false;
    }

    return true;
  }
}
