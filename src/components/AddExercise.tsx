import { useState } from 'react';
import './AddExercise.css';

interface AddExerciseProps {
  day: string;
  onAdd: (exercise: { name: string; reps: number; load?: number; unit?: string }) => void;
}

export function AddExercise({ day, onAdd }: AddExerciseProps) {
  const [name, setName] = useState('');
  const [reps, setReps] = useState(10);
  const [load, setLoad] = useState('');
  const [unit, setUnit] = useState('kg');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter exercise name');
      return;
    }

    if (reps <= 0) {
      alert('Reps must be greater than 0');
      return;
    }

    onAdd({
      name: name.trim(),
      reps,
      load: load ? parseFloat(load) : undefined,
      unit: load ? unit : undefined,
    });

    setName('');
    setReps(10);
    setLoad('');
    setUnit('kg');
    setShowForm(false);
  };

  return (
    <div className="add-exercise">
      {!showForm ? (
        <button 
          className="add-btn"
          onClick={() => setShowForm(true)}
        >
          + Add Exercise for {day}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="exercise-form">
          <h3>Add New Exercise</h3>
          
          <div className="form-group">
            <label htmlFor="exercise-name">Exercise Name *</label>
            <input
              id="exercise-name"
              type="text"
              placeholder="e.g., Bench Press, Squats, Running"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-reps">Reps *</label>
            <input
              id="exercise-reps"
              type="number"
              placeholder="10"
              value={reps}
              onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exercise-load">Load (optional)</label>
              <input
                id="exercise-load"
                type="number"
                placeholder="e.g., 20"
                value={load}
                onChange={(e) => setLoad(e.target.value)}
                step="0.5"
              />
            </div>

            {load && (
              <div className="form-group">
                <label htmlFor="exercise-unit">Unit</label>
                <select 
                  id="exercise-unit"
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="m">m</option>
                  <option value="km">km</option>
                  <option value="sec">sec</option>
                  <option value="min">min</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">Add Exercise</button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
