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
  note?: string;
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
  workoutTitle?: string;
  userId: string;
  timestamp: number;
  completionPercent?: number;
  exercises: ExerciseFeedback[];
}

export interface DailyCheckIn {
  id?: string;
  username: string;
  trainerUsername: string;
  dateKey?: string;
  sleepHours: number;
  energy: number;
  pain: number;
  weight?: number | null;
  comment?: string;
  reviewed?: boolean;
  createdAt?: number;
}

export interface VideoComment {
  id?: string;
  feedbackId: string;
  exerciseId?: string;
  trainerUsername: string;
  clientUsername: string;
  timestampSec: number;
  comment: string;
  createdAt?: number;
}

export interface AgendaTask {
  key: string;
  title: string;
  done: boolean;
}

export interface AgendaItem {
  workoutId: string;
  title: string;
  note?: string;
}

export interface DailyAgenda {
  dateKey: string;
  trainerUsername: string | null;
  assignedCount: number;
  completedToday: number;
  checkInSubmitted: boolean;
  tasks: AgendaTask[];
  assignedWorkouts: AgendaItem[];
}

export interface PriorityClient {
  clientUsername: string;
  daysSinceLastWorkout: number | null;
  pendingCheckins: number;
  unreadFeedback: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface InboxUnreadFeedback {
  clientUsername: string;
  unreadCount: number;
}

export interface TrainerInbox {
  clients: string[];
  pendingCheckins: DailyCheckIn[];
  unreadFeedback: InboxUnreadFeedback[];
  priorityClients: PriorityClient[];
}


