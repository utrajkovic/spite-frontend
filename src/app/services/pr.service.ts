import { Injectable } from '@angular/core';

export interface ExercisePR {
  exerciseName: string;
  currentRecord: number;
  unit: 'kg' | 'reps';
  history: { date: number; value: number }[];
  trend: 'up' | 'down' | 'same';
}

@Injectable({ providedIn: 'root' })
export class PRService {

  compute(feedbacks: any[]): ExercisePR[] {
    // Grupiši sve feedback entries po vežbi
    const byExercise: Record<string, { date: number; kg: number | null; reps: number }[]> = {};

    feedbacks.forEach(fb => {
      (fb.exercises || []).forEach((ex: any) => {
        if (!ex.exerciseName) return;
        if (!byExercise[ex.exerciseName]) byExercise[ex.exerciseName] = [];

        byExercise[ex.exerciseName].push({
          date: fb.timestamp,
          kg: ex.maxKg ?? null,
          reps: ex.doneReps ?? ex.reps ?? 0
        });
      });
    });

    const prs: ExercisePR[] = [];

    Object.entries(byExercise).forEach(([name, entries]) => {
      const sorted = entries.sort((a, b) => a.date - b.date);
      const hasKg = sorted.some(e => e.kg && e.kg > 0);

      // Grupiši po danu - uzmi max vrednost tog dana
      const dailyMap: Record<string, number> = {};
      sorted.forEach(e => {
        const day = new Date(e.date).toDateString();
        const val = hasKg ? (e.kg || 0) : (e.reps || 0);
        if (!dailyMap[day] || val > dailyMap[day]) {
          dailyMap[day] = val;
        }
      });

      const history = Object.entries(dailyMap)
        .map(([day, value]) => ({ date: new Date(day).getTime(), value }))
        .sort((a, b) => a.date - b.date);

      if (!history.length) return;

      const currentRecord = Math.max(...history.map(h => h.value));
      const last = history[history.length - 1].value;
      const prev = history.length > 1 ? history[history.length - 2].value : last;
      const trend: 'up' | 'down' | 'same' = last > prev ? 'up' : last < prev ? 'down' : 'same';

      prs.push({
        exerciseName: name,
        currentRecord,
        unit: hasKg ? 'kg' : 'reps',
        history,
        trend
      });
    });

    // Sortiraj po broju unosa (najaktivnije vežbe prve)
    return prs.sort((a, b) => b.history.length - a.history.length);
  }
}
