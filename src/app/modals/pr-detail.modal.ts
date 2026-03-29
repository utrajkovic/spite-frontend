import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonButton } from '@ionic/angular/standalone';
import { ExercisePR } from '../services/pr.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'pr-detail-modal',
  templateUrl: './pr-detail.modal.html',
  styleUrls: ['./pr-detail.modal.scss'],
  imports: [CommonModule, IonButton]
})
export class PRDetailModal implements AfterViewInit, OnDestroy {

  @Input() pr!: ExercisePR;
  @ViewChild('prChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  constructor(private modalCtrl: ModalController) {}

  ngAfterViewInit() {
    setTimeout(() => this.renderChart(), 100);
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private renderChart() {
    if (!this.chartRef || !this.pr.history.length) return;

    const labels = this.pr.history.map(h =>
      new Date(h.date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
    );
    const data = this.pr.history.map(h => h.value);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: 'rgba(0,255,255,0.8)',
          backgroundColor: 'rgba(0,255,255,0.08)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(0,255,255,1)',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw}${this.pr.unit}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,255,255,0.05)' },
            ticks: { color: 'rgba(0,247,255,0.5)', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(0,255,255,0.05)' },
            ticks: {
              color: 'rgba(0,247,255,0.5)',
              font: { size: 10 },
              callback: (val) => `${val}${this.pr.unit}`
            },
            beginAtZero: false
          }
        }
      }
    });
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('sr-RS', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
