// models.ts

export interface Exercise {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;       
  sets: number;           
  reps: string;            
  restBetweenSets: number; 
  restAfterExercise: number;
}

export interface Workout {
  id: string;
  title: string;        
  subtitle: string;     
  content: string;     
  exerciseIds: string[];
}
