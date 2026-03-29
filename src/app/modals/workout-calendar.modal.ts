import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'workout-calendar-modal',
  templateUrl: './workout-calendar.modal.html',
  styleUrls: ['./workout-calendar.modal.scss'],
  imports: [CommonModule, IonButton]
})
export class WorkoutCalendarModal implements OnInit {

  @Input() feedbacks: any[] = [];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  selectedDay: string | null = null;
  selectedFeedbacks: any[] = [];

  // Map: 'YYYY-MM-DD' -> feedbacks[]
  feedbackMap: Record<string, any[]> = {};

  weeks: (string | null)[][] = [];
  monthNames = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.buildFeedbackMap();
    this.buildCalendar();
  }

  private buildFeedbackMap() {
    this.feedbackMap = {};
    this.feedbacks.forEach(fb => {
      const key = this.toKey(new Date(fb.timestamp));
      if (!this.feedbackMap[key]) this.feedbackMap[key] = [];
      this.feedbackMap[key].push(fb);
    });
  }

  private buildCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Monday = 0, adjust getDay() (0=Sun -> 6)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    this.weeks = [];
    let week: (string | null)[] = Array(startDow).fill(null);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      week.push(this.toKey(date));
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      this.weeks.push(week);
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.buildCalendar();
    this.selectedDay = null;
    this.selectedFeedbacks = [];
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.buildCalendar();
    this.selectedDay = null;
    this.selectedFeedbacks = [];
  }

  selectDay(key: string | null) {
    if (!key || !this.feedbackMap[key]) return;
    this.selectedDay = key;
    this.selectedFeedbacks = this.feedbackMap[key];
  }

  hasWorkout(key: string | null): boolean {
    return !!key && !!this.feedbackMap[key];
  }

  isToday(key: string | null): boolean {
    return key === this.toKey(new Date());
  }

  isSelected(key: string | null): boolean {
    return key === this.selectedDay;
  }

  getDayNumber(key: string | null): number {
    if (!key) return 0;
    return parseInt(key.split('-')[2]);
  }

  avgIntensity(fb: any): string {
    if (!fb.exercises?.length) return '-';
    const map: any = { easy: 1, normal: 2, hard: 3 };
    const avg = fb.exercises.reduce((s: number, e: any) => s + (map[e.intensity] || 2), 0) / fb.exercises.length;
    return avg < 1.5 ? 'Easy' : avg < 2.5 ? 'Normal' : 'Hard';
  }

  formatSelectedDate(): string {
    if (!this.selectedDay) return '';
    const d = new Date(this.selectedDay);
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private toKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  dismiss() { this.modalCtrl.dismiss(); }
}
