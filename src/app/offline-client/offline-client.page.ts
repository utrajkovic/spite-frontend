import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  AlertController
} from '@ionic/angular/standalone';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

@Component({
  selector: 'app-offline-client',
  templateUrl: './offline-client.page.html',
  styleUrls: ['./offline-client.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton
  ]
})
export class OfflineClientPage implements OnInit, OnDestroy {

  @ViewChild('weightChart') chartRef!: ElementRef<HTMLCanvasElement>;

  id = '';
  client: any = null;
  logs: any[] = [];
  loading = true;
  savingProfile = false;
  addingLog = false;
  showLogForm = false;

  newLog: any = {
    date: this.todayInput(),
    workoutTitle: '',
    note: '',
    bodyWeightKg: null,
    exercises: [],
    records: []
  };

  private chart: Chart | null = null;
  private baseUrl = 'https://spite-backend.fly.dev/api/offline-clients';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.loadAll();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private todayInput(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadAll() {
    this.loading = true;
    this.http.get<any>(`${this.baseUrl}/${this.id}`).subscribe({
      next: (c) => { this.client = c; this.loading = false; },
      error: () => { this.loading = false; this.showAlert('Greška pri učitavanju klijenta.'); }
    });
    this.http.get<any[]>(`${this.baseUrl}/${this.id}/logs`).subscribe({
      next: (rows) => {
        this.logs = rows || [];
        setTimeout(() => this.renderChart(), 50);
      },
      error: () => { this.logs = []; }
    });
  }

  saveProfile() {
    if (!this.client?.name?.trim()) { this.showAlert('Ime je obavezno.'); return; }
    this.savingProfile = true;
    this.http.put<any>(`${this.baseUrl}/${this.id}`, {
      name: this.client.name,
      email: this.client.email,
      heightCm: this.client.heightCm,
      weightKg: this.client.weightKg,
      goal: this.client.goal,
      notes: this.client.notes
    }).subscribe({
      next: (c) => { this.client = c; this.savingProfile = false; this.showAlert('Sačuvano.'); },
      error: () => { this.savingProfile = false; this.showAlert('Greška pri čuvanju.'); }
    });
  }

  // ── Log form ──
  addExerciseRow() { this.newLog.exercises.push({ name: '', sets: null, reps: '', weightKg: null }); }
  removeExerciseRow(i: number) { this.newLog.exercises.splice(i, 1); }
  addRecordRow() { this.newLog.records.push({ name: '', value: null, unit: 'kg' }); }
  removeRecordRow(i: number) { this.newLog.records.splice(i, 1); }

  addLog() {
    if (this.addingLog) return;
    const [y, m, d] = (this.newLog.date || this.todayInput()).split('-').map(Number);
    const dateMs = new Date(y, m - 1, d, 12, 0, 0, 0).getTime();

    const body = {
      date: dateMs,
      workoutTitle: (this.newLog.workoutTitle || '').trim(),
      note: (this.newLog.note || '').trim(),
      bodyWeightKg: this.newLog.bodyWeightKg,
      exercises: this.newLog.exercises.filter((e: any) => (e.name || '').trim()),
      records: this.newLog.records.filter((r: any) => (r.name || '').trim() && r.value != null)
    };

    this.addingLog = true;
    this.http.post<any>(`${this.baseUrl}/${this.id}/logs`, body).subscribe({
      next: (saved) => {
        this.addingLog = false;
        this.logs = [saved, ...this.logs];
        if (body.bodyWeightKg != null && this.client) this.client.weightKg = body.bodyWeightKg;
        this.newLog = { date: this.todayInput(), workoutTitle: '', note: '', bodyWeightKg: null, exercises: [], records: [] };
        this.showLogForm = false;
        setTimeout(() => this.renderChart(), 50);
      },
      error: () => { this.addingLog = false; this.showAlert('Greška pri dodavanju zapisa.'); }
    });
  }

  async confirmDeleteLog(log: any) {
    const alert = await this.alertCtrl.create({
      header: 'Obriši zapis',
      message: `Obrisati zapis od ${this.formatDate(log.date)}?`,
      buttons: [
        { text: 'Ne', role: 'cancel' },
        { text: 'Obriši', role: 'confirm', handler: () => this.deleteLog(log.id) }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  deleteLog(logId: string) {
    this.http.delete(`${this.baseUrl}/logs/${logId}`, { responseType: 'text' as 'json' }).subscribe({
      next: () => {
        this.logs = this.logs.filter(l => l.id !== logId);
        setTimeout(() => this.renderChart(), 50);
      },
      error: () => this.showAlert('Greška pri brisanju.')
    });
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get hasWeightData(): boolean {
    return this.logs.some(l => l.bodyWeightKg != null);
  }

  private renderChart() {
    if (!this.chartRef) return;
    this.chart?.destroy();

    const points = this.logs
      .filter(l => l.bodyWeightKg != null)
      .sort((a, b) => a.date - b.date);
    if (!points.length) return;

    const labels = points.map(p => new Date(p.date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }));
    const data = points.map(p => p.bodyWeightKg);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: 'rgba(255,255,255,0.85)',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointRadius: 4,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} kg` } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, callback: (v) => `${v}kg` } }
        }
      }
    });
  }

  async showAlert(message: string) {
    const a = await this.alertCtrl.create({ message, buttons: ['OK'], cssClass: 'custom-alert' });
    await a.present();
  }
}
