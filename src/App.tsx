import { useState, useEffect } from 'react'
import { WorkoutList } from './components/WorkoutList'
import { AddExercise } from './components/AddExercise'
import { ExportImport } from './components/ExportImport'
import { workoutStorage, getCurrentDay } from './utils/workoutStorage'
import type { Exercise } from './types/workout'
import './App.css'

function App() {
  const [currentDay, setCurrentDay] = useState<string>(getCurrentDay())
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Load workouts for current day
  useEffect(() => {
    loadWorkouts()
  }, [currentDay, refreshKey])

  const loadWorkouts = () => {
    const dayWorkouts = workoutStorage.getWorkoutsByDay(currentDay)
    setExercises(dayWorkouts)
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

  const handleImportSuccess = () => {
    loadWorkouts()
    setRefreshKey(prev => prev + 1)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
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
                onClick={() => setCurrentDay(day)}
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
        />
      </main>
    </div>
  )
}

export default App

