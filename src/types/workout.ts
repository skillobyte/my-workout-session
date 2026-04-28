export interface Exercise {
  id: string;
  name: string;
  reps: number;
  load?: number;
  unit?: string;
  done: boolean;
  dateAdded: string;
}

export interface DayWorkout {
  day: string;
  exercises: Exercise[];
}

export interface WorkoutCache {
  [day: string]: Exercise[];
}
