export interface Exercise {
  id?: string;
  name: string;
  description: string;
  videoUrl?: string | null;
  localVideoPath?: string | null;
  localVideoSrc?: string;

  sets?: number;
  reps?: string;
  restBetweenSets?: number;
  restAfterExercise?: number;
  userId?: string;
}

export interface WorkoutItem {
  exerciseId: string;
  sets: number;
  reps: string;
  restBetweenSets: number;
  restAfterExercise: number;
  supersetExerciseId?: string | null;
}


export interface Workout {
  id?: string;
  title: string;
  subtitle: string;
  content: string;
  userId?: string;
  exerciseIds?: string[];
  items: WorkoutItem[];
  exercises?: Exercise[];
}

export interface User {
  id?: string;
  username: string;
  password: string;
}
export interface ExerciseFeedback {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  doneSets: number;
  doneReps: number;
  maxKg: number | null;
  intensity: 'easy' | 'normal' | 'hard';
}


export interface WorkoutFeedback {
  workoutId: string;
  userId: string;
  timestamp: number;
  exercises: ExerciseFeedback[];
}


