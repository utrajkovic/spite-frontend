import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { BackendService } from '../services/backend.service';
import { AlertController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { AvatarComponent } from '../shared/avatar/avatar.component';

@Component({
  selector: 'app-tab-admin',
  templateUrl: './tab-admin.page.html',
  styleUrls: ['./tab-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonSpinner,
    AvatarComponent
  ],
})
export class TabAdminPage implements OnInit {

  adminTab: 'users' | 'exercises' = 'users';

  // ─── Users ───
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedRole = 'ALL';
  currentUser: any = null;
  loadingAction: string | null = null;

  // ─── Global Exercises ───
  globalExercises: any[] = [];
  geSaving = false;
  geEditId: string | null = null;
  geFilterMuscle = 'ALL';

  allMuscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'glutes'];

  geForm: any = {
    name: '',
    description: '',
    muscleGroups: [] as string[],
    videoUrl: '',
    defaultSets: 3,
    defaultReps: '10',
    defaultRestBetweenSets: 60,
    defaultRestAfterExercise: 120,
    category: 'compound',
    sortOrder: 0
  };

  private readonly backendUrl = 'https://spite-backend.fly.dev/api';

  constructor(
    private backend: BackendService,
    private alertCtrl: AlertController,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const user = await Preferences.get({ key: 'user' });
    this.currentUser = user.value ? JSON.parse(user.value) : null;
    this.loadUsers();
  }

  // ─── Users Tab ───

  loadUsers() {
    this.backend.getAllUsers().subscribe({
      next: data => {
        this.users = data.filter((u: any) => u.username !== this.currentUser.username);
        this.applyFilter();
      },
      error: err => console.error(err)
    });
  }

  applyFilter() {
    if (this.selectedRole === 'ALL') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter((u: any) => u.role === this.selectedRole);
    }
  }

  async changeRole(user: any, newRole: string) {
    const ok = await this.confirmAction(`Change role of ${user.username} to ${newRole}?`);
    if (!ok) return;
    this.loadingAction = 'role-' + user.username;
    this.backend.updateUserRole(user.username, newRole).subscribe({
      next: () => { user.role = newRole; this.applyFilter(); this.loadingAction = null; },
      error: () => { this.loadingAction = null; }
    });
  }

  async toggleBlock(user: any) {
    const action = user.blocked ? 'unblock' : 'block';
    const ok = await this.confirmAction(`${action} ${user.username}?`);
    if (!ok) return;
    this.loadingAction = 'block-' + user.username;
    const url = `${this.backendUrl}/admin/users/${user.username}/${action}?adminUsername=${this.currentUser.username}`;
    this.http.put(url, {}, { responseType: 'text' as 'json' }).subscribe({
      next: () => { user.blocked = !user.blocked; this.loadingAction = null; },
      error: () => { this.loadingAction = null; }
    });
  }

  async deleteUser(user: any) {
    const ok = await this.confirmAction(`Delete user ${user.username}? This cannot be undone.`);
    if (!ok) return;
    this.loadingAction = 'delete-' + user.username;
    this.backend.deleteUser(user.username).subscribe({
      next: () => { this.users = this.users.filter((u: any) => u.username !== user.username); this.applyFilter(); this.loadingAction = null; },
      error: () => { this.loadingAction = null; }
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
            if (!pass || pass.length < 5) { this.showInfo('Password must be at least 5 characters.'); return false; }
            if (pass !== conf) { this.showInfo('Passwords do not match.'); return false; }
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
            style="padding:8px;border-radius:8px;border:1px solid #00f7ff;background:rgba(0,255,255,0.04);color:#e0ffff;">
          <input id="confirm-pass" placeholder="Confirm Password" type="password"
            style="padding:8px;border-radius:8px;border:1px solid #00f7ff;background:rgba(0,255,255,0.04);color:#e0ffff;">
        </div>
      `;
    }
  }

// ─── Global Exercises Tab ───

  geSelectedMuscle: string = '';
  geSearchQuery: string = '';
  myExercises: any[] = [];
  filteredMyExercises: any[] = [];
  geQuickCategory: string = 'compound';
  geQuickSets: number = 3;
  geQuickReps: string = '10';
  geQuickRest: number = 60;

  loadGlobalExercises() {
    this.http.get<any[]>(`${this.backendUrl}/global-exercises`).subscribe({
      next: (data) => { this.globalExercises = data || []; },
      error: () => { this.globalExercises = []; }
    });

    // Also load my exercises for quick-add
    if (this.currentUser?.id && this.myExercises.length === 0) {
      this.http.get<any[]>(`${this.backendUrl}/exercises/user/${this.currentUser.id}`).subscribe({
        next: (data) => {
          this.myExercises = data || [];
          this.filterMyExercises();
        },
        error: () => { this.myExercises = []; }
      });
    }
  }

  get filteredGlobalExercises(): any[] {
    if (this.geFilterMuscle === 'ALL') return this.globalExercises;
    return this.globalExercises.filter((ex: any) =>
      ex.muscleGroups && ex.muscleGroups.includes(this.geFilterMuscle)
    );
  }

  filterMyExercises() {
    const q = this.geSearchQuery.toLowerCase().trim();
    this.filteredMyExercises = this.myExercises.filter((ex: any) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  isAlreadyGlobal(name: string): boolean {
    return this.globalExercises.some((g: any) =>
      g.name.toLowerCase() === name.toLowerCase() &&
      g.muscleGroups?.includes(this.geSelectedMuscle)
    );
  }

  quickAddGlobal(ex: any) {
    if (!this.geSelectedMuscle) {
      this.showInfo('Select a muscle group first');
      return;
    }

    const body = {
      name: ex.name,
      description: ex.description || '',
      muscleGroups: [this.geSelectedMuscle],
      videoUrl: ex.videoUrl || null,
      defaultSets: Number(this.geQuickSets) || 3,
      defaultReps: String(this.geQuickReps || '10'),
      defaultRestBetweenSets: Number(this.geQuickRest) || 60,
      defaultRestAfterExercise: 120,
      category: this.geQuickCategory || 'compound',
      sortOrder: this.globalExercises.length + 1
    };

    this.http.post(`${this.backendUrl}/global-exercises`, body).subscribe({
      next: () => {
        this.loadGlobalExercises();
        this.showInfo(`"${ex.name}" added for ${this.geSelectedMuscle}`);
      },
      error: () => { this.showInfo('Error adding exercise'); }
    });
  }

  async deleteGlobalExercise(ex: any) {
    const ok = await this.confirmAction(`Remove "${ex.name}" from global exercises?`);
    if (!ok) return;
    this.http.delete(`${this.backendUrl}/global-exercises/${ex.id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.globalExercises = this.globalExercises.filter((e: any) => e.id !== ex.id);
        this.showInfo('Exercise removed');
      },
      error: () => { this.showInfo('Error removing'); }
    });
  }

  private resetGeForm() {
    this.geEditId = null;
    this.geForm = {
      name: '',
      description: '',
      muscleGroups: [],
      videoUrl: '',
      defaultSets: 3,
      defaultReps: '10',
      defaultRestBetweenSets: 60,
      defaultRestAfterExercise: 120,
      category: 'compound',
      sortOrder: 0
    };
  }

  // ─── Shared ───

  async showInfo(msg: string) {
    const alert = await this.alertCtrl.create({
      message: msg,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async confirmAction(message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Confirm Action',
        message,
        cssClass: 'custom-alert',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
          { text: 'Yes', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }
}