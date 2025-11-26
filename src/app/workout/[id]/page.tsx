'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Routine, WorkoutExercise, WorkoutSet, Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { Play, Pause, Check, Plus, Trash2, Timer, Save, X } from 'lucide-react';

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const routineId = params.id as string;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(90); // Duración configurable del descanso
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState<number>(5);
  const [lastWorkoutData, setLastWorkoutData] = useState<Record<string, { weight: number; reps: number }>>({});
  const [workoutId, setWorkoutId] = useState<string>(`workout-in-progress-${routineId}`);

  useEffect(() => {
    // Cargar duración de descanso preferida
    const savedRestDuration = localStorage.getItem('gym-tracker-rest-duration');
    if (savedRestDuration) {
      setRestDuration(parseInt(savedRestDuration));
    }

    const storedRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const foundRoutine = storedRoutines.find((r: Routine) => r.id === routineId);

    if (foundRoutine) {
      setRoutine(foundRoutine);

      // Verificar si hay un workout en progreso para esta rutina
      const inProgressKey = `workout-in-progress-${routineId}`;
      const savedInProgress = localStorage.getItem(inProgressKey);

      if (savedInProgress) {
        const inProgressData = JSON.parse(savedInProgress);
        // Preguntar si quiere continuar
        if (confirm('Tienes un entrenamiento en progreso. ¿Quieres continuar donde lo dejaste?')) {
          setWorkoutExercises(inProgressData.exercises);
          setCurrentExerciseIndex(inProgressData.currentExerciseIndex || 0);
          setStartTime(inProgressData.startTime);
          setNotes(inProgressData.notes || '');
          setRpe(inProgressData.rpe || 5);
          return;
        } else {
          // Limpiar el workout en progreso si decide no continuar
          localStorage.removeItem(inProgressKey);
        }
      }

      // Buscar el último entrenamiento de esta rutina para pre-cargar pesos
      const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      const lastWorkout = storedWorkouts
        .filter((w: Workout) => w.routineId === routineId)
        .sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const lastWeights: Record<string, { weight: number; reps: number }> = {};
      if (lastWorkout) {
        lastWorkout.exercises.forEach((ex: WorkoutExercise) => {
          const completedSets = ex.sets.filter(s => s.completed);
          if (completedSets.length > 0) {
            // Usar el peso máximo de las series completadas
            const maxWeight = Math.max(...completedSets.map(s => s.weight));
            const avgReps = Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length);
            lastWeights[ex.exerciseId] = { weight: maxWeight, reps: avgReps };
          }
        });
      }
      setLastWorkoutData(lastWeights);

      // Inicializar workout exercises basados en la rutina con pesos y reps previos si existen
      const initialWorkout: WorkoutExercise[] = foundRoutine.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        sets: Array(ex.sets).fill(null).map(() => ({
          reps: lastWeights[ex.exerciseId]?.reps || 0, // Solo usar último entrenamiento, no el valor por defecto de la rutina
          weight: lastWeights[ex.exerciseId]?.weight || 0,
          completed: false
        })),
        isSupersetWith: ex.isSupersetWith
      }));
      setWorkoutExercises(initialWorkout);
    }
  }, [routineId]);

  // Timer del workout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Timer de descanso
  useEffect(() => {
    if (isResting && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isResting, restTimer]);

  // Auto-guardar progreso del workout
  useEffect(() => {
    if (routine && workoutExercises.length > 0) {
      const inProgressKey = `workout-in-progress-${routineId}`;
      const dataToSave = {
        exercises: workoutExercises,
        currentExerciseIndex,
        startTime,
        notes,
        rpe,
        routineId: routine.id,
        routineName: routine.name
      };
      localStorage.setItem(inProgressKey, JSON.stringify(dataToSave));
    }
  }, [workoutExercises, currentExerciseIndex, notes, rpe, routine, routineId, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIdx].sets[setIdx][field] = value;
    setWorkoutExercises(updated);
  };

  // Auto-completar la serie anterior cuando el usuario cambia de foco a otra serie
  const handleSetFocus = (exerciseIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];

    // Buscar la serie anterior que no esté completada
    for (let i = 0; i < updated[exerciseIdx].sets.length; i++) {
      const set = updated[exerciseIdx].sets[i];

      // Si encontramos una serie anterior (antes de la actual) que no está completada
      // pero tiene datos válidos (peso > 0 y reps > 0), la completamos
      if (i < setIdx && !set.completed && set.weight > 0 && set.reps > 0) {
        set.completed = true;

        // Auto-iniciar descanso
        if (!isResting) {
          setRestTimer(restDuration);
          setIsResting(true);
        }
      }
    }

    setWorkoutExercises(updated);
  };

  const handleToggleSet = (exerciseIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIdx].sets[setIdx].completed = !updated[exerciseIdx].sets[setIdx].completed;
    setWorkoutExercises(updated);

    // Auto-iniciar descanso si completó la serie
    if (updated[exerciseIdx].sets[setIdx].completed && !isResting) {
      setRestTimer(restDuration);
      setIsResting(true);

      // Auto-avance en biseries: cambiar al otro ejercicio de la biserie
      const currentExercise = updated[exerciseIdx];
      if (currentExercise.isSupersetWith) {
        // Buscar el ejercicio con el que forma biserie
        const supersetPartnerIdx = updated.findIndex(ex => ex.exerciseId === currentExercise.isSupersetWith);

        if (supersetPartnerIdx !== -1) {
          // Cambiar al ejercicio de la biserie
          setTimeout(() => {
            setCurrentExerciseIndex(supersetPartnerIdx);
          }, 100); // Pequeño delay para que se vea el cambio
        }
      }
    }
  };

  const handleAddSet = (exerciseIdx: number) => {
    const updated = [...workoutExercises];
    const lastSet = updated[exerciseIdx].sets[updated[exerciseIdx].sets.length - 1];
    updated[exerciseIdx].sets.push({
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      completed: false
    });
    setWorkoutExercises(updated);
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIdx].sets.splice(setIdx, 1);
    setWorkoutExercises(updated);
  };

  const handleSaveWorkout = () => {
    if (!routine) return;

    const totalVolume = workoutExercises.reduce((total, ex) => {
      return total + ex.sets.reduce((exTotal, set) => {
        return exTotal + (set.completed ? set.reps * set.weight : 0);
      }, 0);
    }, 0);

    const workout: Workout = {
      id: `workout-${Date.now()}`,
      date: new Date().toISOString(),
      routineId: routine.id,
      routineName: routine.name,
      exercises: workoutExercises,
      duration: elapsedTime,
      notes,
      rpe,
      totalVolume
    };

    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    storedWorkouts.push(workout);
    localStorage.setItem('gym-tracker-workouts', JSON.stringify(storedWorkouts));

    // Limpiar el workout en progreso
    const inProgressKey = `workout-in-progress-${routineId}`;
    localStorage.removeItem(inProgressKey);

    router.push('/history');
  };

  const handleCancelWorkout = () => {
    if (confirm('¿Estás seguro de que quieres cancelar este entrenamiento? Se perderá todo el progreso.')) {
      // Limpiar el workout en progreso
      const inProgressKey = `workout-in-progress-${routineId}`;
      localStorage.removeItem(inProgressKey);
      router.push('/');
    }
  };

  if (!routine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100 flex items-center justify-center">
        <p className="text-white dark:text-slate-900">Cargando rutina...</p>
      </div>
    );
  }

  const currentExercise = workoutExercises[currentExerciseIndex];
  const exercise = currentExercise ? getExerciseById(currentExercise.exerciseId) : null;
  const completedSets = currentExercise?.sets.filter(s => s.completed).length || 0;
  const totalSets = currentExercise?.sets.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <div className="container mx-auto px-4 pt-20 py-6 pb-24 md:pt-6">
        {/* Header con timer */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-white dark:text-slate-900">{routine.name}</h1>
              <p className="text-slate-400 dark:text-slate-600 text-sm">
                Ejercicio {currentExerciseIndex + 1} de {workoutExercises.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-500">{formatTime(elapsedTime)}</div>
              <p className="text-slate-400 dark:text-slate-600 text-xs">Tiempo total</p>
            </div>
          </div>

          {/* Progreso */}
          <div className="w-full bg-slate-700/50 dark:bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${(currentExerciseIndex / workoutExercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <div className="bg-orange-500/20 dark:bg-orange-100 border border-orange-500/50 dark:border-orange-300 rounded-xl p-4 mb-6 text-center">
            <Timer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-500">{formatTime(restTimer)}</p>
            <p className="text-orange-400 dark:text-orange-600 text-sm">Tiempo de descanso</p>
            <button
              onClick={() => setIsResting(false)}
              className="mt-2 text-orange-400 dark:text-orange-600 text-sm underline"
            >
              Saltar descanso
            </button>
          </div>
        )}

        {/* Configuración de descanso */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-slate-400 dark:text-slate-600" />
              <label className="text-sm font-medium text-white dark:text-slate-900">
                Descanso entre series: {Math.floor(restDuration / 60)}:{(restDuration % 60).toString().padStart(2, '0')}
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            {[30, 60, 90, 120, 180].map((seconds) => {
              // Formatear el tiempo correctamente
              let label = '';
              if (seconds < 60) {
                label = `${seconds}s`;
              } else if (seconds === 90) {
                label = '1.5m';
              } else {
                label = `${Math.floor(seconds / 60)}m`;
              }

              return (
                <button
                  key={seconds}
                  onClick={() => {
                    setRestDuration(seconds);
                    localStorage.setItem('gym-tracker-rest-duration', seconds.toString());
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    restDuration === seconds
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700/50 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ejercicio actual */}
        {exercise && currentExercise && (
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-slate-900">{exercise.name}</h2>
                <p className="text-slate-400 dark:text-slate-600">{exercise.category} • {exercise.muscleGroup}</p>
                {lastWorkoutData[currentExercise.exerciseId] && (
                  <p className="text-blue-400 dark:text-blue-600 text-sm mt-1">
                    Última vez: {lastWorkoutData[currentExercise.exerciseId].weight}kg × {lastWorkoutData[currentExercise.exerciseId].reps} reps
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-emerald-500">{completedSets}/{totalSets}</p>
                <p className="text-slate-400 dark:text-slate-600 text-sm">Series</p>
              </div>
            </div>

            {/* Series */}
            <div className="space-y-3 mb-4">
              {currentExercise.sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border-2 transition-all ${
                    set.completed
                      ? 'bg-emerald-500/20 border-emerald-500/50 dark:bg-emerald-100 dark:border-emerald-300'
                      : 'bg-slate-700/30 border-slate-600/50 dark:bg-white dark:border-slate-300'
                  }`}
                >
                  <div className="p-3">
                    {/* Header de la serie */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-300 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-600">Serie {idx + 1}</span>
                      </div>
                      {currentExercise.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(currentExerciseIndex, idx)}
                          className="w-8 h-8 rounded-full bg-red-500/20 dark:bg-red-100 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>

                    {/* Inputs y botón de completar */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-slate-400 dark:text-slate-600 block mb-1.5">Peso (kg)</label>
                        <input
                          type="number"
                          value={set.weight === 0 ? '' : set.weight}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleSetChange(currentExerciseIndex, idx, 'weight', isNaN(value) ? 0 : value);
                          }}
                          onFocus={(e) => {
                            handleSetFocus(currentExerciseIndex, idx);
                            e.target.select(); // Seleccionar todo el texto al hacer focus
                          }}
                          className="w-full px-3 py-3 bg-slate-600/50 dark:bg-slate-100 border border-slate-500 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 font-bold text-center text-lg"
                          disabled={set.completed}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-400 dark:text-slate-600 block mb-1.5">Reps</label>
                        <input
                          type="number"
                          value={set.reps === 0 ? '' : set.reps}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                            handleSetChange(currentExerciseIndex, idx, 'reps', isNaN(value) ? 0 : value);
                          }}
                          onFocus={(e) => {
                            handleSetFocus(currentExerciseIndex, idx);
                            e.target.select(); // Seleccionar todo el texto al hacer focus
                          }}
                          className="w-full px-3 py-3 bg-slate-600/50 dark:bg-slate-100 border border-slate-500 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 font-bold text-center text-lg"
                          disabled={set.completed}
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => handleToggleSet(currentExerciseIndex, idx)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                          set.completed
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400'
                        }`}
                      >
                        {set.completed ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white dark:text-slate-900" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Agregar serie */}
            <button
              onClick={() => handleAddSet(currentExerciseIndex)}
              className="w-full py-3 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-slate-300 dark:text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Serie
            </button>

            {/* Navegación entre ejercicios */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                disabled={currentExerciseIndex === 0}
                className="flex-1 py-3 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentExerciseIndex(Math.min(workoutExercises.length - 1, currentExerciseIndex + 1))}
                disabled={currentExerciseIndex === workoutExercises.length - 1}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Notas y RPE */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">Notas del Entrenamiento</h3>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 dark:text-slate-600 mb-2">
              RPE (Esfuerzo Percibido): {rpe}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-600">
              <span>Muy fácil</span>
              <span>Máximo esfuerzo</span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade notas sobre tu entrenamiento (cómo te sentiste, ajustes realizados, etc.)"
            className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 resize-none"
            rows={4}
          />
        </div>

        {/* Acciones finales */}
        <div className="flex gap-3">
          <button
            onClick={handleCancelWorkout}
            className="flex-1 py-4 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            onClick={handleSaveWorkout}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Guardar Entrenamiento
          </button>
        </div>
      </div>
    </div>
  );
}
