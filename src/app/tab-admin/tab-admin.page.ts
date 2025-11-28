import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardContent, 
  IonCardTitle, IonButton, IonItem, IonLabel, IonSelect, 
  IonToolbar, IonSelectOption, IonSpinner, IonHeader, IonTitle} from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-tab-admin',
  templateUrl: './tab-admin.page.html',
  styleUrls: ['./tab-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,

    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,

    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,

    IonButton,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,

    FormsModule
  ]

})
export class TabAdminPage implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  selectedRole = 'ALL';
  currentUser: any = null;


  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController
  ) { }

  async ngOnInit() {
    const user = await Preferences.get({ key: 'user' });
    this.currentUser = user.value ? JSON.parse(user.value) : null;

    this.loadUsers();
  }


  loadingAction: string | null = null;

  loadUsers() {
    this.backend.getAllUsers().subscribe({
      next: data => {
        this.users = data.filter(u => u.username !== this.currentUser.username);

        this.applyFilter();
      },
      error: err => console.error(err)
    });
  }


  applyFilter() {
    if (this.selectedRole === 'ALL') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(u => u.role === this.selectedRole);
    }
  }

  async changeRole(user: any, newRole: string) {

    const ok = await this.confirmAction(
      `Are you sure you want to change role of ${user.username} to ${newRole} ?`
    );

    if (!ok) return;

    this.loadingAction = "role-" + user.username;

    this.backend.updateUserRole(user.username, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.applyFilter();
        this.loadingAction = null;
      },
      error: err => {
        console.error(err);
        this.loadingAction = null;
      }
    });
  }


  async deleteUser(user: any) {

    const ok = await this.confirmAction(`Delete user ${user.username} ?`);

    if (!ok) return;

    this.loadingAction = "delete-" + user.username;

    this.backend.deleteUser(user.username).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.username !== user.username);
        this.applyFilter();
        this.loadingAction = null;
      },
      error: err => {
        console.error(err);
        this.loadingAction = null;
      }
    });
  }


  async changePassword(user: any) {
    const alert = await this.alertCtrl.create({
      header: `Change Password`,
      message: '',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: () => {
            const pass = (document.getElementById('new-pass') as HTMLInputElement).value;
            const conf = (document.getElementById('confirm-pass') as HTMLInputElement).value;

            if (!pass || pass.length < 5) {
              this.showInfo('Password must be at least 5 characters.');
              return false;
            }
            if (pass !== conf) {
              this.showInfo('Passwords do not match.');
              return false;
            }

            this.backend.updateUserPassword(user.username, pass).subscribe(() => {
              this.showInfo('Password updated successfully.');
            });

            return true;
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();

    const msg = alert.querySelector('.alert-message') as HTMLElement;

    if (msg) {
      msg.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
          <input id="new-pass" placeholder="New Password" type="password"
            style="padding:8px;border-radius:8px;border:1px solid #00f7ff;">
          
          <input id="confirm-pass" placeholder="Confirm Password" type="password"
            style="padding:8px;border-radius:8px;border:1px solid #00f7ff;">
        </div>
      `;
    }
  }

  async showInfo(msg: string) {
    const alert = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async openRoleFilter() {
    const alert = await this.alertCtrl.create({
      header: 'Filter Users',
      message: '',
      buttons: ['Cancel'],
      cssClass: 'custom-alert'
    });

    await alert.present();

    const msgEl = alert.querySelector('.alert-message');

    if (!msgEl) return;

    msgEl.innerHTML = `
      <div class="admin-filter-container">
        <button class="filter-btn" data-role="ALL">All</button>
        <button class="filter-btn" data-role="USER">Users</button>
        <button class="filter-btn" data-role="TRAINER">Trainers</button>
        <button class="filter-btn" data-role="ADMIN">Admins</button>
      </div>
    `;

    msgEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = (btn as HTMLElement).dataset['role']!;
        this.selectedRole = role;
        this.applyFilter();
        alert.dismiss();
      });
    });
  }

  async confirmAction(message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Confirm Action',
        message,
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Yes',
            handler: () => resolve(true)
          }
        ]
      });

      await alert.present();
    });
  }

}
