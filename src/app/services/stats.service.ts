import { Injectable } from '@angular/core';

export interface WorkoutStats {
  totalWorkouts: number;
  thisWeek: number;
  avgIntensity: string;
  streak: number; // consecutive days with workout
  weeklyData: { label: string; count: number; avgIntensity: number }[];
  topExercises: { name: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {

  compute(feedbacks: any[]): WorkoutStats {
    if (!feedbacks.length) return this.empty();

    const sorted = [...feedbacks].sort((a, b) => a.timestamp - b.timestamp);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // This week
    const thisWeek = feedbacks.filter(f => now - f.timestamp < oneWeek).length;

    // Avg intensity overall
    const intensityMap: any = { easy: 1, normal: 2, hard: 3 };
    const allIntensities = feedbacks.flatMap(f =>
      (f.exercises || []).map((e: any) => intensityMap[e.intensity] || 2)
    );
    const avgVal = allIntensities.length
      ? allIntensities.reduce((a: number, b: number) => a + b, 0) / allIntensities.length
      : 2;
    const avgIntensity = avgVal < 1.5 ? 'Easy' : avgVal < 2.5 ? 'Normal' : 'Hard';

    // Streak - consecutive days
    const days = new Set(feedbacks.map(f =>
      new Date(f.timestamp).toDateString()
    ));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }

    // Weekly data - last 7 weeks
    const weeklyData = this.getWeeklyData(feedbacks);

    // Top exercises
    const exCount: Record<string, number> = {};
    feedbacks.forEach(f => {
      (f.exercises || []).forEach((e: any) => {
        if (e.exerciseName) {
          exCount[e.exerciseName] = (exCount[e.exerciseName] || 0) + 1;
        }
      });
    });
    const topExercises = Object.entries(exCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalWorkouts: feedbacks.length,
      thisWeek,
      avgIntensity,
      streak,
      weeklyData,
      topExercises
    };
  }

  private getWeeklyData(feedbacks: any[]) {
    const weeks: { label: string; count: number; avgIntensity: number }[] = [];
    const intensityMap: any = { easy: 1, normal: 2, hard: 3 };

    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);

      const weekFeedbacks = feedbacks.filter(f =>
        f.timestamp >= weekStart.getTime() && f.timestamp <= weekEnd.getTime()
      );

      const intensities = weekFeedbacks.flatMap(f =>
        (f.exercises || []).map((e: any) => intensityMap[e.intensity] || 2)
      );
      const avg = intensities.length
        ? intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length
        : 0;

      const label = `W${7 - i}`;
      weeks.push({ label, count: weekFeedbacks.length, avgIntensity: avg });
    }

    return weeks;
  }

  private empty(): WorkoutStats {
    return {
      totalWorkouts: 0, thisWeek: 0, avgIntensity: '-',
      streak: 0, weeklyData: [], topExercises: []
    };
  }
}
