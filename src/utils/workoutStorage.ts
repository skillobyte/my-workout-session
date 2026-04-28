import type { Exercise, WorkoutCache } from '../types/workout';

const STORAGE_KEY = 'workout_cache';

export const workoutStorage = {
  // Get all workouts
  getAllWorkouts: (): WorkoutCache => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : {};
  },

  // Get workouts for a specific day
  getWorkoutsByDay: (day: string): Exercise[] => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    return allWorkouts[day] || [];
  },

  // Add exercise to a day
  addExercise: (day: string, exercise: Omit<Exercise, 'id' | 'dateAdded' | 'done'>) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (!allWorkouts[day]) {
      allWorkouts[day] = [];
    }
    
    const newExercise: Exercise = {
      ...exercise,
      id: `${Date.now()}_${Math.random()}`,
      dateAdded: new Date().toISOString(),
      done: false,
    };
    
    allWorkouts[day].push(newExercise);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkouts));
    return newExercise;
  },

  // Toggle exercise done status
  toggleExercise: (day: string, exerciseId: string) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      const exercise = allWorkouts[day].find(e => e.id === exerciseId);
      if (exercise) {
        exercise.done = !exercise.done;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkouts));
      }
    }
  },

  // Delete exercise
  deleteExercise: (day: string, exerciseId: string) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      allWorkouts[day] = allWorkouts[day].filter(e => e.id !== exerciseId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkouts));
    }
  },

  // Update exercise
  updateExercise: (day: string, exerciseId: string, updates: Partial<Exercise>) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      const exercise = allWorkouts[day].find(e => e.id === exerciseId);
      if (exercise) {
        Object.assign(exercise, updates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkouts));
      }
    }
  },

  // Export workouts as JSON
  exportWorkouts: (): string => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    return JSON.stringify(allWorkouts, null, 2);
  },

  // Import workouts from JSON
  importWorkouts: (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid JSON format' };
    }
  },

  // Clear all workouts
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Get current day name
export const getCurrentDay = (): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// Get day index
export const getDayIndex = (day: string): number => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(day);
};
