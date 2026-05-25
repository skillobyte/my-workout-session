import { useState, useRef, useEffect } from 'react'
import type { Exercise } from '../types/workout'
import './WorkoutList.css';

interface WorkoutListProps {
  day: string;
  exercises: Exercise[];
  onToggle: (exerciseId: string) => void;
  onDelete: (exerciseId: string) => void;
  onRefresh: () => void;
  onEdit: (exerciseId: string, updates: Partial<Exercise>) => void;
  onReorder: (day: string, reorderedExercises: Exercise[]) => void;
}

interface EditingData {
  id: string;
  name: string;
  reps: number;
  load?: number;
  unit?: string;
}

const UNIT_OPTIONS = ['kg', 'lbs', 'm', 'reps', 'sec', 'min'];

export function WorkoutList({ day, exercises, onToggle, onDelete, onRefresh, onEdit, onReorder }: WorkoutListProps) {
  const pendingExercises = exercises.filter(e => !e.done);
  const completedExercises = exercises.filter(e => e.done);
  const [editingData, setEditingData] = useState<EditingData | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const editingId = editingData?.id;

  const startEditing = (exercise: Exercise) => {
    setEditingData({
      id: exercise.id,
      name: exercise.name,
      reps: exercise.reps,
      load: exercise.load,
      unit: exercise.unit,
    });
  };

  const cancelEditing = () => {
    setEditingData(null);
  };

  const commitEditing = () => {
    if (!editingData) return;

    const trimmedName = editingData.name.trim();
    if (!trimmedName || editingData.reps < 1) {
      cancelEditing();
      return;
    }

    const load = editingData.load && editingData.load !== 0 ? editingData.load : undefined;
    const unit = load ? editingData.unit : undefined;

    onEdit(editingData.id, {
      name: trimmedName,
      reps: editingData.reps,
      load,
      unit,
    });
    onRefresh();
    cancelEditing();
  };

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingId]);

  const updateDragOverId = (exerciseId: string | null) => {
    dragOverIdRef.current = exerciseId;
    setDragOverId(exerciseId);
  };

  const resetDragState = () => {
    draggedIdRef.current = null;
    dragOverIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
  };

  const getExerciseIdAtPoint = (clientX: number, clientY: number): string | null => {
    const element = document.elementFromPoint(clientX, clientY);
    const item = element?.closest<HTMLElement>('[data-exercise-id]');
    return item?.dataset.exerciseId || null;
  };

  const scrollWhileDragging = (clientY: number) => {
    const scrollContainer = document.querySelector<HTMLElement>('.app-main');
    if (!scrollContainer) return;

    const rect = scrollContainer.getBoundingClientRect();
    const edgeSize = 72;
    const maxStep = 14;
    let scrollStep = 0;

    if (clientY < rect.top + edgeSize) {
      scrollStep = -Math.ceil(((rect.top + edgeSize - clientY) / edgeSize) * maxStep);
    }

    if (clientY > rect.bottom - edgeSize) {
      scrollStep = Math.ceil(((clientY - (rect.bottom - edgeSize)) / edgeSize) * maxStep);
    }

    if (scrollStep !== 0) {
      scrollContainer.scrollTop += scrollStep;
    }
  };

  const reorderDraggedExercise = (targetId: string) => {
    const activeDraggedId = draggedIdRef.current;
    if (!activeDraggedId || activeDraggedId === targetId) {
      return;
    }

    const draggedIndex = exercises.findIndex(ex => ex.id === activeDraggedId);
    const targetIndex = exercises.findIndex(ex => ex.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = [...exercises];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    onReorder(day, reordered);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, exerciseId: string) => {
    if (editingData || (e.pointerType === 'mouse' && e.button !== 0)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggedIdRef.current = exerciseId;
    setDraggedId(exerciseId);
    updateDragOverId(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggedIdRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    scrollWhileDragging(e.clientY);

    const targetId = getExerciseIdAtPoint(e.clientX, e.clientY);
    if (targetId && targetId !== draggedIdRef.current && targetId !== dragOverIdRef.current) {
      updateDragOverId(targetId);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggedIdRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const targetId = getExerciseIdAtPoint(e.clientX, e.clientY) || dragOverIdRef.current;
    if (targetId) {
      reorderDraggedExercise(targetId);
    }

    resetDragState();
  };

  const handlePointerCancel = () => {
    resetDragState();
  };

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
                  <div 
                    key={exercise.id} 
                    data-exercise-id={exercise.id}
                    className={`exercise-item pending ${dragOverId === exercise.id ? 'drag-over' : ''} ${draggedId === exercise.id ? 'dragging' : ''}`}
                    onDoubleClick={() => !editingData && startEditing(exercise)}
                  >
                    <div className="exercise-content">
                      <button
                        type="button"
                        className="drag-handle"
                        aria-label={`Reorder ${exercise.name}`}
                        disabled={!!editingData}
                        onPointerDown={(e) => handlePointerDown(e, exercise.id)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                        onDoubleClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="checkbox"
                        checked={exercise.done}
                        onChange={() => {
                          onToggle(exercise.id);
                          onRefresh();
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="exercise-checkbox"
                        aria-label={`Mark ${exercise.name} as done`}
                      />
                      <div className="exercise-info">
                        {editingData?.id === exercise.id ? (
                          <div className="exercise-edit-form">
                            <input
                              ref={nameInputRef}
                              className="exercise-edit-input"
                              value={editingData.name}
                              onChange={e => setEditingData({ ...editingData, name: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitEditing()
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                              placeholder="Exercise name"
                            />
                            <div className="exercise-edit-row">
                              <input
                                type="number"
                                className="exercise-edit-number"
                                value={editingData.reps}
                                onChange={e => setEditingData({ ...editingData, reps: parseInt(e.target.value) || 0 })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                                placeholder="Reps"
                              />
                              <span className="edit-separator">•</span>
                              <input
                                type="number"
                                className="exercise-edit-number"
                                value={editingData.load || ''}
                                onChange={e => setEditingData({ ...editingData, load: e.target.value ? parseFloat(e.target.value) : undefined })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                                placeholder="Load"
                              />
                              <select
                                className="exercise-edit-unit"
                                value={editingData.unit || ''}
                                onChange={e => setEditingData({ ...editingData, unit: e.target.value || undefined })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Unit</option>
                                {UNIT_OPTIONS.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                            <div className="exercise-edit-actions">
                              <button onClick={commitEditing} className="edit-save">Save</button>
                              <button onClick={cancelEditing} className="edit-cancel">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <h4>{exercise.name}</h4>
                        )}
                        <p className="exercise-details">
                          {exercise.reps} reps
                          {exercise.load && ` • ${exercise.load}${exercise.unit || 'kg'}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDelete(exercise.id);
                        onRefresh();
                      }}
                      className="delete-btn"
                      aria-label={`Delete ${exercise.name}`}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      X
                    </button>
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
                  <div 
                    key={exercise.id} 
                    data-exercise-id={exercise.id}
                    className={`exercise-item completed ${dragOverId === exercise.id ? 'drag-over' : ''} ${draggedId === exercise.id ? 'dragging' : ''}`}
                    onDoubleClick={() => !editingData && startEditing(exercise)}
                  >
                    <div className="exercise-content">
                      <button
                        type="button"
                        className="drag-handle"
                        aria-label={`Reorder ${exercise.name}`}
                        disabled={!!editingData}
                        onPointerDown={(e) => handlePointerDown(e, exercise.id)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                        onDoubleClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="checkbox"
                        checked={exercise.done}
                        onChange={() => {
                          onToggle(exercise.id);
                          onRefresh();
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="exercise-checkbox"
                        aria-label={`Mark ${exercise.name} as incomplete`}
                      />
                      <div className="exercise-info">
                        {editingData?.id === exercise.id ? (
                          <div className="exercise-edit-form">
                            <input
                              ref={nameInputRef}
                              className="exercise-edit-input"
                              value={editingData.name}
                              onChange={e => setEditingData({ ...editingData, name: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitEditing()
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                              placeholder="Exercise name"
                            />
                            <div className="exercise-edit-row">
                              <input
                                type="number"
                                className="exercise-edit-number"
                                value={editingData.reps}
                                onChange={e => setEditingData({ ...editingData, reps: parseInt(e.target.value) || 0 })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                                placeholder="Reps"
                              />
                              <span className="edit-separator">•</span>
                              <input
                                type="number"
                                className="exercise-edit-number"
                                value={editingData.load || ''}
                                onChange={e => setEditingData({ ...editingData, load: e.target.value ? parseFloat(e.target.value) : undefined })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                                placeholder="Load"
                              />
                              <select
                                className="exercise-edit-unit"
                                value={editingData.unit || ''}
                                onChange={e => setEditingData({ ...editingData, unit: e.target.value || undefined })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEditing()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                                onDoubleClick={(e) => e.stopPropagation()}
                              >
                                <option value="">Unit</option>
                                {UNIT_OPTIONS.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                            <div className="exercise-edit-actions">
                              <button onClick={commitEditing} className="edit-save">Save</button>
                              <button onClick={cancelEditing} className="edit-cancel">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <h4>{exercise.name}</h4>
                        )}
                        <p className="exercise-details">
                          {exercise.reps} reps
                          {exercise.load && ` • ${exercise.load}${exercise.unit || 'kg'}`}
                        </p>
                      </div>
                    </div>   
                    <button
                      onClick={() => {
                        onDelete(exercise.id);
                        onRefresh();
                      }}
                      className="delete-btn"
                      aria-label={`Delete ${exercise.name}`}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      X
                    </button>                 
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
