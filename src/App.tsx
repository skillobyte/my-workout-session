import { useState, useCallback } from 'react'
import { WorkoutList } from './components/WorkoutList'
import { AddExercise } from './components/AddExercise'
import { ExportImport } from './components/ExportImport'
import { workoutStorage, getCurrentDay } from './utils/workoutStorage'
import type { Exercise } from './types/workout'
import './App.css'

function App() {
  const initialDay = getCurrentDay()
  const [currentDay, setCurrentDay] = useState<string>(initialDay)
  const [exercises, setExercises] = useState<Exercise[]>(() => workoutStorage.openDay(initialDay))

  const loadWorkouts = useCallback((day = currentDay, trackOpen = false) => {
    const dayWorkouts = trackOpen ? workoutStorage.openDay(day) : workoutStorage.getWorkoutsByDay(day)
    setExercises(dayWorkouts)
  }, [currentDay])

  const handleDayChange = (day: string) => {
    setCurrentDay(day)
    loadWorkouts(day, true)
  }

  const handleAddExercise = (exerciseData: { name: string; reps: number; load?: number; unit?: string }) => {
    workoutStorage.addExercise(currentDay, exerciseData)
    loadWorkouts()
  }

  const handleToggleExercise = (exerciseId: string) => {
    workoutStorage.toggleExercise(currentDay, exerciseId)
    loadWorkouts()
  }

  const handleDeleteExercise = (exerciseId: string) => {
    if (window.confirm('Delete this exercise?')) {
      workoutStorage.deleteExercise(currentDay, exerciseId)
      loadWorkouts()
    }
  }

  const handleEditExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    workoutStorage.updateExercise(currentDay, exerciseId, updates)
    loadWorkouts()
  }

  const handleReorderExercises = (day: string, reorderedExercises: Exercise[]) => {
    workoutStorage.reorderExercises(day, reorderedExercises)
    loadWorkouts()
  }

  const handleImportSuccess = () => {
    loadWorkouts(currentDay, true)
  }

  const handleRefresh = () => {
    loadWorkouts()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>💪 Personal Workout Tracker 1.0</h1>
          <ExportImport onImportSuccess={handleImportSuccess} />
        </div>
      </header>

      <main className="app-main">
        <div className="day-selector">
          <div className="day-buttons">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <button
                key={day}
                className={`day-btn ${currentDay === day ? 'active' : ''}`}
                onClick={() => handleDayChange(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <AddExercise day={currentDay} onAdd={handleAddExercise} />
        <WorkoutList 
          day={currentDay} 
          exercises={exercises}
          onToggle={handleToggleExercise}
          onDelete={handleDeleteExercise}
          onRefresh={handleRefresh}
          onEdit={handleEditExercise}
          onReorder={handleReorderExercises}
        />
      </main>
    </div>
  )
}

export default App

