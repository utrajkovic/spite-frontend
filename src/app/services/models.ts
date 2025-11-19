
export interface Exercise {
  id?: string;
  name: string;
  description: string;
  videoUrl?: string | null;  
  localVideoPath?: string | null;  
  localVideoSrc?: string;  
  sets: number;
  reps: string;
  restBetweenSets: number;
  restAfterExercise: number;
  userId?: string;         
}

export interface Workout {
  id?: string;
  title: string;
  subtitle: string;
  content: string;
  exerciseIds: string[];
  userId?: string;    
  exercises?: Exercise[];   
}

export interface User {
  id?: string;
  username: string;
  password: string;
}

