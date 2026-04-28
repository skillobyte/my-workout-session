import type { Exercise } from '../types/workout'
import './WorkoutList.css';

interface WorkoutListProps {
  day: string;
  exercises: Exercise[];
  onToggle: (exerciseId: string) => void;
  onDelete: (exerciseId: string) => void;
  onRefresh: () => void;
}

export function WorkoutList({ day, exercises, onToggle, onDelete, onRefresh }: WorkoutListProps) {
  const pendingExercises = exercises.filter(e => !e.done);
  const completedExercises = exercises.filter(e => e.done);

  return (
    <div className="workout-list">
      <h2>{day}'s Workout</h2>
      
      {exercises.length === 0 ? (
        <p className="empty-state">No exercises for {day} yet. Add one to get started!</p>
      ) : (
        <>
          {pendingExercises.length > 0 && (
            <section className="pending-section">
              <h3>📋 To Do ({pendingExercises.length})</h3>
              <div className="exercises-list">
                {pendingExercises.map(exercise => (
                  <div key={exercise.id} className="exercise-item pending">
                    <button
                      onClick={() => {
                        onDelete(exercise.id);
                        onRefresh();
                      }}
                      className="delete-btn"
                      aria-label={`Delete ${exercise.name}`}
                    >
                      🗑️
                    </button>
                    <div className="exercise-content">
                      <input
                        type="checkbox"
                        checked={exercise.done}
                        onChange={() => {
                          onToggle(exercise.id);
                          onRefresh();
                        }}
                        className="exercise-checkbox"
                        aria-label={`Mark ${exercise.name} as done`}
                      />
                      <div className="exercise-info">
                        <h4>{exercise.name}</h4>
                        <p className="exercise-details">
                          {exercise.reps} reps
                          {exercise.load && ` • ${exercise.load}${exercise.unit || 'kg'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completedExercises.length > 0 && (
            <section className="completed-section">
              <h3>✅ Done ({completedExercises.length})</h3>
              <div className="exercises-list">
                {completedExercises.map(exercise => (
                  <div key={exercise.id} className="exercise-item completed">
                    <button
                      onClick={() => {
                        onDelete(exercise.id);
                        onRefresh();
                      }}
                      className="delete-btn"
                      aria-label={`Delete ${exercise.name}`}
                    >
                      🗑️
                    </button>
                    <div className="exercise-content">
                      <input
                        type="checkbox"
                        checked={exercise.done}
                        onChange={() => {
                          onToggle(exercise.id);
                          onRefresh();
                        }}
                        className="exercise-checkbox"
                        aria-label={`Mark ${exercise.name} as incomplete`}
                      />
                      <div className="exercise-info">
                        <h4>{exercise.name}</h4>
                        <p className="exercise-details">
                          {exercise.reps} reps
                          {exercise.load && ` • ${exercise.load}${exercise.unit || 'kg'}`}
                        </p>
                      </div>
                    </div>                    
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
