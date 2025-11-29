import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonAlert } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonAlert],
})
export class AppComponent {
  constructor() {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: '#00111a' });
    StatusBar.setStyle({ style: Style.Dark });
  }
}
