import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { WorkoutFeedbackModal } from './workout-feedback.modal';
import { BackendService } from '../services/backend.service';
import { FeedbackViewModal } from './feedback-view.modal';


interface CalCell {
  key: string | null;
  dayNum: number;
  hasWorkout: boolean;
  noFeedback: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  standalone: true,
  selector: 'workout-calendar-modal',
  templateUrl: './workout-calendar.modal.html',
  styleUrls: ['./workout-calendar.modal.scss'],
  imports: [CommonModule],
  providers: [ModalController]
})
export class WorkoutCalendarModal implements OnInit, OnChanges {

  @Input() feedbacks: any[] = [];
  @Input() completedWorkouts: any[] = [];
  @Input() username: string = '';
  @Input() inline = false;
  @Output() dataChanged = new EventEmitter<void>();

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  selectedDay: string | null = null;
  selectedFeedbacks: any[] = [];

  // Map: 'YYYY-MM-DD' -> feedbacks[]
  feedbackMap: Record<string, any[]> = {};
  // Map: 'YYYY-MM-DD' -> completedWorkout (bez feedbacka)
  completedMap: Record<string, any[]> = {};

  weeks: CalCell[][] = [];
  monthNames = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  addingFeedbackForCompletedId = new Set<string>();
  editingFeedbackIds = new Set<string>();
  activeProfileCard = 0;
  private touchStartX: number | null = null;
  private readonly swipeThreshold = 45;

profileCards = ['calendar', 'snapshot', 'upcoming', 'trainerZone'] as const;

  constructor(private modalCtrl: ModalController, private backend: BackendService) {}

  ngOnInit() {
    this.buildFeedbackMap();
    this.buildCompletedMap();
    this.buildCalendar();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['feedbacks'] || changes['completedWorkouts']) {
      this.buildFeedbackMap();
      this.buildCompletedMap();
      this.selectedDay = null;
      this.selectedFeedbacks = [];
      this.buildCalendar();
    }
  }

  private buildFeedbackMap() {
    this.feedbackMap = {};
    this.feedbacks.forEach(fb => {
      const key = this.tsToKey(fb.timestamp);
      if (!this.feedbackMap[key]) this.feedbackMap[key] = [];
      this.feedbackMap[key].push(fb);
    });
  }

  private buildCompletedMap() {
    this.completedMap = {};
    this.completedWorkouts
      .filter(cw => !cw.hasFeedback)
      .forEach(cw => {
        const key = this.tsToKey(cw.completedAt);
        if (!this.completedMap[key]) this.completedMap[key] = [];
        this.completedMap[key].push(cw);
      });
  }

  private buildCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Monday = 0, adjust getDay() (0=Sun -> 6)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const todayKey = this.toKey(new Date());
    this.weeks = [];
    let week: CalCell[] = [];
    for (let i = 0; i < startDow; i++) week.push(this.makeCell(null, todayKey));

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      week.push(this.makeCell(this.toKey(date), todayKey));
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(this.makeCell(null, todayKey));
      this.weeks.push(week);
    }
  }

  /** Pre-izračuna sve flag-ove za ćeliju jednom (umesto poziva funkcija po CD ciklusu). */
  private makeCell(key: string | null, todayKey: string): CalCell {
    return {
      key,
      dayNum: key ? parseInt(key.split('-')[2]) : 0,
      hasWorkout: !!key && !!this.feedbackMap[key],
      noFeedback: !!key && !!this.completedMap[key],
      isToday: key === todayKey,
      isSelected: key === this.selectedDay,
    };
  }

  /** Osveži samo selected flag na ćelijama (jeftino, na klik). */
  private refreshSelection() {
    for (const week of this.weeks) {
      for (const cell of week) cell.isSelected = cell.key === this.selectedDay;
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.selectedDay = null;
    this.selectedFeedbacks = [];
    this.buildCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.selectedDay = null;
    this.selectedFeedbacks = [];
    this.buildCalendar();
  }

  selectDay(key: string | null) {
    if (!key) return;
    if (!this.feedbackMap[key] && !this.completedMap[key]) return;
    this.selectedDay = key;
    // Pre-izračunaj intenzitet jednom po feedbacku (umesto avgIntensity() po CD ciklusu).
    this.selectedFeedbacks = (this.feedbackMap[key] || []).map(fb => ({
      ...fb,
      _intensity: this.avgIntensity(fb)
    }));
    this.refreshSelection();
  }

  async openAddFeedback(cw: any) {
    if (!cw?.id || this.addingFeedbackForCompletedId.has(cw.id)) return;
    this.addingFeedbackForCompletedId.add(cw.id);
    // Učitaj vežbe sa backenda
    this.backend.getWorkoutById(cw.workoutId).subscribe({
      next: async (workout: any) => {
        const exercises = (workout.items || []).map((item: any) => {
          const ex = (workout.exercises || []).find((e: any) => e.id === item.exerciseId);
          return {
            exerciseId: item.exerciseId,
            name: ex?.name || 'Exercise',
            sets: item.sets,
            reps: item.reps
          };
        });

        const modal = await this.modalCtrl.create({
          component: WorkoutFeedbackModal,
          cssClass: 'feedback-transparent',
          componentProps: { exercises }
        });
        await modal.present();
        const result = await modal.onDidDismiss();
        if (result.data) {
          const feedbackPayload = {
            workoutId: cw.workoutId,
            workoutTitle: cw.workoutTitle,
            userId: this.username,
            timestamp: cw.completedAt,
            completionPercent: 100,
            exercises: result.data
          };
          this.backend.sendWorkoutFeedback(feedbackPayload).subscribe({
            next: (saved: any) => {
              this.addingFeedbackForCompletedId.delete(cw.id);
              this.feedbacks = [...this.feedbacks, saved];
              this.completedWorkouts = this.completedWorkouts.map(c =>
                c.id === cw.id ? { ...c, hasFeedback: true, feedbackId: saved.id } : c
              );
              this.buildFeedbackMap();
              this.buildCompletedMap();
              this.selectedDay = null;
              this.selectedFeedbacks = [];
              this.dataChanged.emit();
            },
            error: () => {
              this.addingFeedbackForCompletedId.delete(cw.id);
            }
          });
          return;
        }
        this.addingFeedbackForCompletedId.delete(cw.id);
      },
      error: async () => {
        this.addingFeedbackForCompletedId.delete(cw.id);
        // Ako ne mozemo da ucitamo vezbe, otvori prazan feedback
        const modal = await this.modalCtrl.create({
          component: WorkoutFeedbackModal,
          cssClass: 'feedback-transparent',
          componentProps: { exercises: [{ exerciseId: '', name: cw.workoutTitle, sets: 1, reps: '10' }] }
        });
        await modal.present();
      }
    });
  }

  async openEditFeedback(fb: any) {
    if (!fb?.id || this.editingFeedbackIds.has(fb.id)) return;
    this.editingFeedbackIds.add(fb.id);
    const modal = await this.modalCtrl.create({
      component: WorkoutFeedbackModal,
      cssClass: 'feedback-transparent',
      componentProps: {
        exercises: fb.exercises.map((ex: any) => ({
          exerciseId: ex.exerciseId,
          name: ex.exerciseName,
          sets: ex.sets,
          reps: ex.reps,
          doneSets: ex.doneSets,
          doneReps: ex.doneReps,
          maxKg: ex.maxKg,
          intensity: ex.intensity
        }))
      }
    });
    await modal.present();
    const result = await modal.onDidDismiss();
    if (result.data) {
      this.backend.updateWorkoutFeedback(fb.id, { ...fb, exercises: result.data }).subscribe({
        next: (updated: any) => {
          this.editingFeedbackIds.delete(fb.id);
          this.feedbacks = this.feedbacks.map(f => f.id === fb.id ? updated : f);
          this.buildFeedbackMap();
          this.selectedDay = null;
          this.selectedFeedbacks = [];
          this.dataChanged.emit();
        },
        error: () => {
          this.editingFeedbackIds.delete(fb.id);
        }
      });
      return;
    }
    this.editingFeedbackIds.delete(fb.id);
  }

  async openViewFeedback(fb: any) {
  const modal = await this.modalCtrl.create({
    component: FeedbackViewModal,
    componentProps: { feedback: fb },
    cssClass: 'feedback-transparent'
  });
  await modal.present();
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

  private tsToKey(timestamp: number): string {
    const d = new Date(timestamp);
    // Koristimo lokalno vreme da izbegnemo UTC offset problem
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  dismiss() { this.modalCtrl.dismiss(); }
}
