import type { Exercise, WorkoutCache } from '../types/workout';

const STORAGE_KEY = 'workout_cache';
const LAST_OPENED_KEY = 'workout_last_opened_by_day';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

type LastOpenedCache = Partial<Record<string, string>>;
type ImportResult = { success: true } | { success: false; error: string };
type ExerciseValidationResult = { success: true; exercise: Exercise } | { success: false; error: string };
type WorkoutValidationResult = { success: true; workouts: WorkoutCache } | { success: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isValidDay = (day: string): boolean => DAYS.includes(day);

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

const getDayName = (date: Date): string => DAYS[date.getDay()];

const toLocalDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};

const parseLocalDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
};

const getDateKeyTime = (dateKey: string): number | null => {
  const date = parseLocalDateKey(dateKey);
  if (!date) {
    return null;
  }

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

const isNextWeeklyOccurrence = (lastOpenedDateKey: string | undefined, currentDate: Date): boolean => {
  if (!lastOpenedDateKey) {
    return false;
  }

  const lastOpenedTime = getDateKeyTime(lastOpenedDateKey);
  if (lastOpenedTime === null) {
    return false;
  }

  const currentDateTime = getDateKeyTime(toLocalDateKey(currentDate));
  if (currentDateTime === null) {
    return false;
  }

  return currentDateTime - lastOpenedTime >= WEEK_IN_MS;
};

const readStorageItem = (key: string): string | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const saveStorageItem = (key: string, value: unknown): boolean => {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors so clearing never crashes the app.
  }
};

const readStoredWorkouts = (): string | null => readStorageItem(STORAGE_KEY);

const saveWorkouts = (workouts: WorkoutCache): boolean => saveStorageItem(STORAGE_KEY, workouts);

const readLastOpened = (): LastOpenedCache => {
  const cached = readStorageItem(LAST_OPENED_KEY);
  if (!cached) {
    return {};
  }

  try {
    const parsed = JSON.parse(cached) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    const lastOpened: LastOpenedCache = {};
    for (const [day, dateKey] of Object.entries(parsed)) {
      if (isValidDay(day) && typeof dateKey === 'string' && parseLocalDateKey(dateKey)) {
        lastOpened[day] = dateKey;
      }
    }

    return lastOpened;
  } catch {
    return {};
  }
};

const saveLastOpened = (lastOpened: LastOpenedCache): boolean => {
  return saveStorageItem(LAST_OPENED_KEY, lastOpened);
};

const markDayOpened = (day: string, date: Date): void => {
  const lastOpened = readLastOpened();
  lastOpened[day] = toLocalDateKey(date);
  saveLastOpened(lastOpened);
};

const resetDoneStatus = (exercises: Exercise[]): Exercise[] => {
  return exercises.map(exercise => ({ ...exercise, done: false }));
};

const validateExercise = (value: unknown): ExerciseValidationResult => {
  if (!isRecord(value)) {
    return { success: false, error: 'Exercise must be an object' };
  }

  const { id, name, reps, load, unit, done, dateAdded } = value;

  if (typeof id !== 'string' || id.trim() === '') {
    return { success: false, error: 'Exercise id must be a non-empty string' };
  }

  if (typeof name !== 'string' || name.trim() === '') {
    return { success: false, error: 'Exercise name must be a non-empty string' };
  }

  if (typeof reps !== 'number' || !Number.isInteger(reps) || reps < 1) {
    return { success: false, error: 'Exercise reps must be a positive integer' };
  }

  if (load !== undefined && (typeof load !== 'number' || !Number.isFinite(load) || load < 0)) {
    return { success: false, error: 'Exercise load must be a non-negative number' };
  }

  if (unit !== undefined && typeof unit !== 'string') {
    return { success: false, error: 'Exercise unit must be a string' };
  }

  if (typeof done !== 'boolean') {
    return { success: false, error: 'Exercise done status must be a boolean' };
  }

  if (typeof dateAdded !== 'string' || Number.isNaN(Date.parse(dateAdded))) {
    return { success: false, error: 'Exercise dateAdded must be a valid date string' };
  }

  const trimmedUnit = unit?.trim();
  const exercise: Exercise = {
    id: id.trim(),
    name: name.trim(),
    reps,
    done,
    dateAdded,
  };

  if (load !== undefined) {
    exercise.load = load;
  }

  if (load !== undefined && trimmedUnit) {
    exercise.unit = trimmedUnit;
  }

  return { success: true, exercise };
};

const validateWorkoutCache = (value: unknown): WorkoutValidationResult => {
  if (!isRecord(value)) {
    return { success: false, error: 'Backup must be an object keyed by day' };
  }

  const workouts: WorkoutCache = {};

  for (const [day, exercises] of Object.entries(value)) {
    if (!isValidDay(day)) {
      return { success: false, error: `Invalid day "${day}"` };
    }

    if (!Array.isArray(exercises)) {
      return { success: false, error: `${day} workouts must be an array` };
    }

    const validatedExercises: Exercise[] = [];
    for (const [index, exercise] of exercises.entries()) {
      const result = validateExercise(exercise);
      if (!result.success) {
        return { success: false, error: `${day} exercise ${index + 1}: ${result.error}` };
      }

      validatedExercises.push(result.exercise);
    }

    workouts[day] = validatedExercises;
  }

  return { success: true, workouts };
};

export const workoutStorage = {
  // Get all workouts
  getAllWorkouts: (): WorkoutCache => {
    const cached = readStoredWorkouts();
    if (!cached) {
      return {};
    }

    try {
      const parsed = JSON.parse(cached) as unknown;
      const result = validateWorkoutCache(parsed);
      return result.success ? result.workouts : {};
    } catch {
      return {};
    }
  },

  // Get workouts for a specific day
  getWorkoutsByDay: (day: string): Exercise[] => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    return allWorkouts[day] || [];
  },

  // Open a day and reset completion only when this is today's next weekly occurrence
  openDay: (day: string, date = new Date()): Exercise[] => {
    if (!isValidDay(day)) {
      return [];
    }

    const allWorkouts = workoutStorage.getAllWorkouts();
    const currentDay = getDayName(date);

    if (day !== currentDay) {
      return allWorkouts[day] || [];
    }

    const lastOpened = readLastOpened();
    if (isNextWeeklyOccurrence(lastOpened[day], date)) {
      allWorkouts[day] = resetDoneStatus(allWorkouts[day] || []);
      saveWorkouts(allWorkouts);
    }

    markDayOpened(day, date);
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
    saveWorkouts(allWorkouts);
    return newExercise;
  },

  // Toggle exercise done status
  toggleExercise: (day: string, exerciseId: string) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      const exercise = allWorkouts[day].find(e => e.id === exerciseId);
      if (exercise) {
        exercise.done = !exercise.done;
        saveWorkouts(allWorkouts);
      }
    }
  },

  // Delete exercise
  deleteExercise: (day: string, exerciseId: string) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      allWorkouts[day] = allWorkouts[day].filter(e => e.id !== exerciseId);
      saveWorkouts(allWorkouts);
    }
  },

  // Update exercise
  updateExercise: (day: string, exerciseId: string, updates: Partial<Exercise>) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    if (allWorkouts[day]) {
      const exercise = allWorkouts[day].find(e => e.id === exerciseId);
      if (exercise) {
        Object.assign(exercise, updates);
        saveWorkouts(allWorkouts);
      }
    }
  },

  // Reorder exercises
  reorderExercises: (day: string, reorderedExercises: Exercise[]) => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    allWorkouts[day] = reorderedExercises;
    saveWorkouts(allWorkouts);
  },

  // Export workouts as JSON
  exportWorkouts: (): string => {
    const allWorkouts = workoutStorage.getAllWorkouts();
    return JSON.stringify(allWorkouts, null, 2);
  },

  // Import workouts from JSON
  importWorkouts: (jsonData: string): ImportResult => {
    try {
      const parsed = JSON.parse(jsonData) as unknown;
      const result = validateWorkoutCache(parsed);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (!saveWorkouts(result.workouts)) {
        return { success: false, error: 'Could not save workouts to local storage' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }
  },

  // Clear all workouts
  clearAll: () => {
    removeStorageItem(STORAGE_KEY);
    removeStorageItem(LAST_OPENED_KEY);
  },
};

// Get current day name
export const getCurrentDay = (): string => {
  return getDayName(new Date());
};

// Get day index
export const getDayIndex = (day: string): number => {
  return DAYS.indexOf(day);
};
