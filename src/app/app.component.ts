import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonAlert } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonAlert]
})
export class AppComponent {
  constructor() {}
}
