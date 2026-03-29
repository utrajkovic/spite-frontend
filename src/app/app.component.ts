import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonAlert } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { WorkoutStateService } from './services/workout-state.service';
import { BackendService } from './services/backend.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonAlert],
})
export class AppComponent implements OnInit {
  constructor(
    private workoutState: WorkoutStateService,
    private backend: BackendService,
    private themeService: ThemeService
  ) {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: '#00111a' });
    StatusBar.setStyle({ style: Style.Dark });
    this.themeService.init();
  }

  ngOnInit() {
    this.syncPendingFeedbacks();
  }

  private syncPendingFeedbacks() {
    const pending = this.workoutState.getPendingFeedbacks();
    if (!pending.length) return;

    pending.forEach((feedback, index) => {
      this.backend.sendWorkoutFeedback(feedback).subscribe({
        next: () => {
          this.workoutState.removePendingFeedback(index);
          console.log('Synced pending feedback:', feedback.workoutTitle);
        },
        error: () => {
          // Još uvek offline, pokušaćemo sledeći put
        }
      });
    });
  }
}
