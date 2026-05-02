import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet, IonAlert } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { WorkoutStateService } from './services/workout-state.service';
import { BackendService } from './services/backend.service';
import { ThemeService } from './services/theme.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonAlert],
})
export class AppComponent implements OnInit, OnDestroy {

  private validateInterval: any;
  private readonly backendUrl = 'https://spite-backend-v2.onrender.com';

  constructor(
    private workoutState: WorkoutStateService,
    private backend: BackendService,
    private themeService: ThemeService,
    private authInterceptor: AuthInterceptor,
    private http: HttpClient
  ) {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: '#00111a' });
    StatusBar.setStyle({ style: Style.Dark });
    this.themeService.init();
  }

  ngOnInit() {
    this.syncPendingFeedbacks();
    this.startSessionValidation();
  }

  ngOnDestroy() {
    clearInterval(this.validateInterval);
  }

  private startSessionValidation() {
    // Provjeri odmah pri pokretanju, pa svakih 60 sekundi
    this.validateSession();
    this.validateInterval = setInterval(() => this.validateSession(), 10_000);
  }

  private async validateSession() {
    const stored = await Preferences.get({ key: 'user' });
    if (!stored.value) return; // nije ulogovan, nema šta da se provjeri

    const user = JSON.parse(stored.value);
    this.http.get(`${this.backendUrl}/api/users/validate/${user.username}`, { responseType: 'text' })
      .subscribe({
        error: async (err) => {
          if (err.status === 403 || err.status === 404) {
            await this.authInterceptor.forceLogout();
          }
        }
      });
  }

  private syncPendingFeedbacks() {
    const pending = this.workoutState.getPendingFeedbacks();
    if (!pending.length) return;

    pending.forEach((feedback, index) => {
      this.backend.sendWorkoutFeedback(feedback).subscribe({
        next: () => {
          this.workoutState.removePendingFeedback(index);
        },
        error: () => {}
      });
    });
  }
}
