'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Routine, WorkoutExercise, WorkoutSet, Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { Play, Pause, Check, Plus, Trash2, Timer, Save, X, History, TrendingUp, Lightbulb, Link2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getProgressionSuggestion } from '@/lib/progression-suggestions';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import { generateSetsForExercise } from '@/lib/exercise-utils';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const routineId = params.id as string;
  const { user } = useAuth();
  const toast = useToast();
  const { confirm: showConfirmDialog, confirmState } = useConfirm();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(90); // Duración configurable del descanso
  const [restEndTime, setRestEndTime] = useState<number>(0); // Timestamp cuando termina el descanso
  const [notes, setNotes] = useState('');
  const [rpe, setRpe] = useState<number>(5);
  const [lastWorkoutData, setLastWorkoutData] = useState<Record<string, { weight: number; reps: number }>>({});
  const [workoutId, setWorkoutId] = useState<string>(`workout-in-progress-${routineId}`);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [progressionSuggestion, setProgressionSuggestion] = useState<any>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseIndexToReplace, setExerciseIndexToReplace] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Refs para scroll automático a las series
  const setRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Detectar si hay progreso en el entrenamiento
  const hasProgress = workoutExercises.some(ex =>
    ex.sets.some(set => set.completed || set.weight > 0 || set.reps > 0)
  );

  // Callback memoizado para navigation guard
  const handleNavigateAway = useCallback(async () => {
    const shouldLeave = await showConfirmDialog({
      title: '¿Salir del entrenamiento?',
      message: 'Tienes un entrenamiento en progreso. Los datos se guardarán automáticamente, pero perderás el contexto actual.',
      confirmText: 'Salir',
      cancelText: 'Continuar entrenando',
      type: 'warning',
    });
    return shouldLeave;
  }, [showConfirmDialog]);

  // Protección contra pérdida de datos - TEMPORALMENTE DESHABILITADO PARA DEBUG
  // useBeforeUnload(hasProgress && !justSaved, 'Tienes un entrenamiento en progreso. ¿Estás seguro de que quieres salir?');
  // useNavigationGuard(hasProgress && !justSaved, handleNavigateAway);

  useEffect(() => {
    const initializeWorkout = async () => {
      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') return;

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
          // Preguntar si quiere continuar (usando window.confirm para no bloquear inicialización)
          if (window.confirm('Tienes un entrenamiento en progreso. ¿Quieres continuar donde lo dejaste?')) {
            setWorkoutExercises(inProgressData.exercises);
            setCurrentExerciseIndex(inProgressData.currentExerciseIndex || 0);
            setStartTime(inProgressData.startTime);
            setNotes(inProgressData.notes || '');
            setRpe(inProgressData.rpe || 5);

            // Restaurar el estado del descanso si había uno activo
            if (inProgressData.isResting && inProgressData.restEndTime) {
              const now = Date.now();
              const remaining = Math.ceil((inProgressData.restEndTime - now) / 1000);

              if (remaining > 0) {
                // El descanso todavía está activo
                setRestEndTime(inProgressData.restEndTime);
                setRestTimer(remaining);
                setIsResting(true);
              }
            }
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

      // Guardar datos para mostrar "Última vez" (usando peso máximo y reps promedio)
      const lastWeights: Record<string, { weight: number; reps: number }> = {};
      if (lastWorkout) {
        lastWorkout.exercises.forEach((ex: WorkoutExercise) => {
          const completedSets = ex.sets.filter(s => s.completed);
          if (completedSets.length > 0) {
            const maxWeight = Math.max(...completedSets.map(s => s.weight));
            const avgReps = Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length);
            lastWeights[ex.exerciseId] = { weight: maxWeight, reps: avgReps };
          }
        });
      }
      setLastWorkoutData(lastWeights);

      // Inicializar workout exercises basados en la rutina
      const initialWorkout: WorkoutExercise[] = foundRoutine.exercises.map((ex: any) => {
        // Buscar el ejercicio en el último entrenamiento
        const lastExercise = lastWorkout?.exercises.find((lastEx: WorkoutExercise) => lastEx.exerciseId === ex.exerciseId);

        let sets: WorkoutSet[];
        if (lastExercise) {
          // Usar las series exactas del último entrenamiento (solo las completadas)
          const completedSets = lastExercise.sets.filter((s: WorkoutSet) => s.completed);
          if (completedSets.length > 0) {
            // Crear el mismo número de series que en la rutina, usando los datos del último entrenamiento
            sets = Array(ex.sets).fill(null).map((_, idx) => {
              // Si hay una serie correspondiente en el último entrenamiento, usar sus datos
              if (completedSets[idx]) {
                return {
                  reps: completedSets[idx].reps,
                  weight: completedSets[idx].weight,
                  completed: false
                };
              }
              // Si no hay serie correspondiente, usar la última serie completada como referencia
              const lastSet = completedSets[completedSets.length - 1];
              return {
                reps: lastSet.reps,
                weight: lastSet.weight,
                completed: false
              };
            });
          } else {
            // No hay series completadas, inicializar vacío
            sets = Array(ex.sets).fill(null).map(() => ({
              reps: 0,
              weight: 0,
              completed: false
            }));
          }
        } else {
          // No hay datos del último entrenamiento, inicializar vacío
          sets = Array(ex.sets).fill(null).map(() => ({
            reps: 0,
            weight: 0,
            completed: false
          }));
        }

        return {
          exerciseId: ex.exerciseId,
          sets,
          isSupersetWith: ex.isSupersetWith,
          notes: ''
        };
      });
      setWorkoutExercises(initialWorkout);
      }
    };

    initializeWorkout();
  }, [routineId]);

  // Timer del workout
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Timer de descanso - Usa timestamps para que funcione en segundo plano
  useEffect(() => {
    if (isResting && restEndTime > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((restEndTime - now) / 1000);

        if (remaining <= 0) {
          setRestTimer(0);
          setIsResting(false);
          setRestEndTime(0);
        } else {
          setRestTimer(remaining);
        }
      }, 100); // Actualizar cada 100ms para mayor precisión
      return () => clearInterval(interval);
    }
  }, [isResting, restEndTime]);

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
        routineName: routine.name,
        restEndTime,
        isResting
      };
      localStorage.setItem(inProgressKey, JSON.stringify(dataToSave));
    }
  }, [workoutExercises, currentExerciseIndex, notes, rpe, routine, routineId, startTime, restEndTime, isResting]);

  // Calcular sugerencias de progresión
  useEffect(() => {
    if (workoutExercises.length === 0 || !user?.trainingGoal) {
      setProgressionSuggestion(null);
      return;
    }

    const currentExercise = workoutExercises[currentExerciseIndex];
    if (!currentExercise) return;

    const completedSets = currentExercise.sets.filter(s => s.completed);
    if (completedSets.length === 0) {
      setProgressionSuggestion(null);
      return;
    }

    // Obtener historial del ejercicio
    const history = getExerciseHistory(currentExercise.exerciseId);
    if (history.length === 0) {
      setProgressionSuggestion(null);
      return;
    }

    // Calcular datos actuales
    const currentMaxWeight = Math.max(...completedSets.map(s => s.weight));
    const currentAvgReps = Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length);

    // Formatear historial para la función de sugerencias
    const formattedHistory = history.map((h: any) => ({
      date: h.date,
      maxWeight: h.maxWeight,
      avgReps: h.avgReps,
      sets: h.sets
    }));

    // Obtener sugerencia
    const suggestion = getProgressionSuggestion(
      formattedHistory,
      currentMaxWeight,
      currentAvgReps,
      user.trainingGoal
    );

    setProgressionSuggestion(suggestion);
  }, [currentExerciseIndex, workoutExercises, user?.trainingGoal]);

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
          const endTime = Date.now() + (restDuration * 1000);
          setRestEndTime(endTime);
          setRestTimer(restDuration);
          setIsResting(true);
        }
      }
    }

    setWorkoutExercises(updated);
  };

  const handleToggleSet = (exerciseIdx: number, setIdx: number) => {
    const updated = [...workoutExercises];
    const isCompleting = !updated[exerciseIdx].sets[setIdx].completed;
    updated[exerciseIdx].sets[setIdx].completed = isCompleting;
    setWorkoutExercises(updated);

    // Verificar si es la última serie del último ejercicio
    if (isCompleting) {
      const isLastExercise = exerciseIdx === updated.length - 1;
      const isLastSet = setIdx === updated[exerciseIdx].sets.length - 1;

      if (isLastExercise && isLastSet) {
        // Es la última serie del último ejercicio, preguntar si quiere finalizar
        setTimeout(() => {
          const shouldFinish = window.confirm(
            '¡Has completado la última serie! ¿Deseas finalizar y guardar el entrenamiento?'
          );
          if (shouldFinish) {
            handleSaveWorkout();
          }
        }, 500); // Pequeño delay para que se vea la animación primero
      }
    }

    // Scroll automático a la siguiente serie si se completó
    if (isCompleting) {
      const nextSetIdx = setIdx + 1;
      if (nextSetIdx < updated[exerciseIdx].sets.length) {
        // Hay una siguiente serie, hacer scroll a ella
        setTimeout(() => {
          const nextSetKey = `set-${exerciseIdx}-${nextSetIdx}`;
          const nextSetElement = setRefs.current[nextSetKey];
          if (nextSetElement) {
            nextSetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 300); // Pequeño delay para que se vea la animación de completar
      }
    }

    // Auto-iniciar descanso si completó la serie
    if (isCompleting && !isResting) {
      const currentExercise = updated[exerciseIdx];

      // BISERIE: Si forma parte de una biserie, alternar al otro ejercicio
      if (currentExercise.isSupersetWith) {
        const supersetPartnerIdx = updated.findIndex(ex => ex.exerciseId === currentExercise.isSupersetWith);

        if (supersetPartnerIdx !== -1) {
          const partnerExercise = updated[supersetPartnerIdx];

          // Verificar si el ejercicio partner tiene una serie pendiente en el mismo índice
          const partnerSet = partnerExercise.sets[setIdx];

          if (partnerSet && !partnerSet.completed) {
            // Cambiar al ejercicio de la biserie sin descanso
            setTimeout(() => {
              setCurrentExerciseIndex(supersetPartnerIdx);
            }, 200);
            return; // No iniciar descanso aún
          } else {
            // Si el partner ya completó esta serie, verificar si quedan más series
            const hasMoreSets = currentExercise.sets.some((s, idx) => idx > setIdx && !s.completed) ||
                               partnerExercise.sets.some((s, idx) => idx > setIdx && !s.completed);

            if (hasMoreSets) {
              // Hay más series, volver al primer ejercicio de la biserie
              setTimeout(() => {
                setCurrentExerciseIndex(Math.min(exerciseIdx, supersetPartnerIdx));
              }, 200);

              // Iniciar descanso después de completar ambas series de la biserie
              const endTime = Date.now() + (restDuration * 1000);
              setRestEndTime(endTime);
              setRestTimer(restDuration);
              setIsResting(true);
            }
          }
          return;
        }
      }

      // Si NO es biserie, descanso normal
      const endTime = Date.now() + (restDuration * 1000);
      setRestEndTime(endTime);
      setRestTimer(restDuration);
      setIsResting(true);
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

  const handleExerciseNoteChange = (exerciseIdx: number, note: string) => {
    const updated = [...workoutExercises];
    updated[exerciseIdx].notes = note;
    setWorkoutExercises(updated);
  };

  const getExerciseHistory = (exerciseId: string) => {
    const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');

    return workouts
      .map((w: Workout) => {
        const exercise = w.exercises.find(ex => ex.exerciseId === exerciseId);
        if (!exercise) return null;

        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return null;

        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        const avgReps = Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length);
        const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

        return {
          date: new Date(w.date),
          maxWeight,
          avgReps,
          totalVolume,
          sets: completedSets.length,
          notes: exercise.notes
        };
      })
      .filter((h: any) => h !== null)
      .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  };

  const showHistory = (exerciseId: string) => {
    setHistoryExerciseId(exerciseId);
    setShowHistoryModal(true);
  };

  const handleReplaceExercise = (newExerciseId: string) => {
    if (exerciseIndexToReplace === null) return;

    const updated = [...workoutExercises];
    const oldExercise = updated[exerciseIndexToReplace];
    const numSets = oldExercise.sets.length;

    // Generar sets para el nuevo ejercicio (con historial o en 0)
    const newSets = generateSetsForExercise(newExerciseId, numSets);

    updated[exerciseIndexToReplace] = {
      exerciseId: newExerciseId,
      sets: newSets,
      isSupersetWith: oldExercise.isSupersetWith, // Preservar biserie
      notes: '' // Limpiar notas ya que es un ejercicio diferente
    };

    setWorkoutExercises(updated);
    setShowExercisePicker(false);
    setExerciseIndexToReplace(null);
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
      duration: Math.round(elapsedTime / 60), // Convertir segundos a minutos
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

    // Marcar como guardado recientemente para evitar warnings de navegación
    setJustSaved(true);

    // Mostrar confirmación
    toast.success('Entrenamiento guardado correctamente');

    // Navegar después de un pequeño delay para que se vea el toast
    setTimeout(() => {
      router.push('/history');
    }, 300);
  };

  const handleCancelWorkout = async () => {
    const shouldCancel = await showConfirmDialog({
      title: '¿Cancelar entrenamiento?',
      message: '¿Estás seguro de que quieres cancelar este entrenamiento? Se perderá todo el progreso.',
      confirmText: 'Cancelar entrenamiento',
      cancelText: 'Continuar',
      type: 'danger',
    });

    if (shouldCancel) {
      // Limpiar el workout en progreso
      const inProgressKey = `workout-in-progress-${routineId}`;
      localStorage.removeItem(inProgressKey);

      // Marcar como guardado para evitar el warning de navegación
      setJustSaved(true);

      toast.info('Entrenamiento cancelado');
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
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white dark:text-slate-900">{exercise.name}</h2>
                  {currentExercise.isSupersetWith && (() => {
                    const partnerExercise = workoutExercises.find(ex => ex.exerciseId === currentExercise.isSupersetWith);
                    const partnerExerciseData = partnerExercise ? getExerciseById(partnerExercise.exerciseId) : null;
                    return (
                      <div className="flex items-center gap-2 bg-purple-500/20 dark:bg-purple-100 border border-purple-500/50 dark:border-purple-300 px-3 py-1 rounded-full">
                        <Link2 className="w-4 h-4 text-purple-400 dark:text-purple-600" />
                        <span className="text-sm font-medium text-purple-300 dark:text-purple-700">
                          Biserie con {partnerExerciseData?.name || 'otro ejercicio'}
                        </span>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => {
                      setExerciseIndexToReplace(currentExerciseIndex);
                      setShowExercisePicker(true);
                    }}
                    className="p-2 text-emerald-400 dark:text-emerald-600 hover:text-emerald-300 dark:hover:text-emerald-700 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
                    title="Cambiar ejercicio"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => showHistory(currentExercise.exerciseId)}
                    className="p-2 text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
                    title="Ver historial"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-400 dark:text-slate-600">{exercise.category} • {exercise.muscleGroup}</p>
                {lastWorkoutData[currentExercise.exerciseId] && (() => {
                  const lastData = lastWorkoutData[currentExercise.exerciseId];
                  const completedSets = currentExercise.sets.filter(s => s.completed);

                  if (completedSets.length > 0) {
                    const currentMaxWeight = Math.max(...completedSets.map(s => s.weight));
                    const currentAvgReps = Math.round(completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length);
                    const weightDiff = currentMaxWeight - lastData.weight;
                    const repsDiff = currentAvgReps - lastData.reps;

                    let statusColor = 'text-yellow-400 dark:text-yellow-600';
                    let statusIcon = '⚠️';
                    let statusText = 'Sin cambios';

                    if (weightDiff > 0 || (weightDiff === 0 && repsDiff > 0)) {
                      statusColor = 'text-emerald-400 dark:text-emerald-600';
                      statusIcon = '✅';
                      statusText = weightDiff > 0 ? `+${weightDiff}kg` : `+${repsDiff} reps`;
                    } else if (weightDiff < 0 || repsDiff < 0) {
                      statusColor = 'text-red-400 dark:text-red-600';
                      statusIcon = '❌';
                      statusText = weightDiff < 0 ? `${weightDiff}kg` : `${repsDiff} reps`;
                    }

                    return (
                      <div className="mt-1">
                        <p className="text-slate-400 dark:text-slate-600 text-sm">
                          Última vez: {lastData.weight}kg × {lastData.reps} reps
                        </p>
                        <p className={`${statusColor} text-sm font-bold flex items-center gap-1`}>
                          <span>{statusIcon}</span>
                          <span>{statusText}</span>
                        </p>
                      </div>
                    );
                  }

                  return (
                    <p className="text-blue-400 dark:text-blue-600 text-sm mt-1">
                      Última vez: {lastData.weight}kg × {lastData.reps} reps
                    </p>
                  );
                })()}
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
                  ref={(el) => {
                    setRefs.current[`set-${currentExerciseIndex}-${idx}`] = el;
                  }}
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
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 dark:text-slate-600 block mb-2 font-medium">Peso (kg)</label>
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
                          className="w-full px-4 py-4 bg-slate-600/50 dark:bg-slate-100 border-2 border-slate-500 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 font-bold text-center text-2xl"
                          disabled={set.completed}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 dark:text-slate-600 block mb-2 font-medium">Reps</label>
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
                          className="w-full px-4 py-4 bg-slate-600/50 dark:bg-slate-100 border-2 border-slate-500 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 font-bold text-center text-2xl"
                          disabled={set.completed}
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => handleToggleSet(currentExerciseIndex, idx)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                          set.completed
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400'
                        }`}
                      >
                        {set.completed ? (
                          <Check className="w-7 h-7 text-white" />
                        ) : (
                          <Play className="w-7 h-7 text-white dark:text-slate-900" />
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

            {/* Notas del Ejercicio Actual */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
                Notas de este ejercicio (opcional)
              </label>
              <textarea
                value={currentExercise?.notes || ''}
                onChange={(e) => handleExerciseNoteChange(currentExerciseIndex, e.target.value)}
                placeholder="Ej: Sentí dolor en el hombro, mejorar técnica, etc."
                className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 resize-none text-sm"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Sugerencia de Progresión */}
        {progressionSuggestion && (
          <div className="bg-gradient-to-r from-slate-800/60 via-slate-800/40 to-slate-800/60 dark:from-slate-50 dark:via-slate-100 dark:to-slate-50 backdrop-blur-sm border-2 border-slate-700/50 dark:border-slate-300 rounded-xl p-5 mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-3xl mt-1">
                {progressionSuggestion.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className={`w-5 h-5 ${progressionSuggestion.color}`} />
                  <h3 className={`text-lg font-bold ${progressionSuggestion.color}`}>
                    {progressionSuggestion.message}
                  </h3>
                </div>
                <p className="text-slate-300 dark:text-slate-700 text-sm leading-relaxed mb-3">
                  {progressionSuggestion.reasoning}
                </p>
                {(progressionSuggestion.suggestedWeight || progressionSuggestion.suggestedReps || progressionSuggestion.suggestedSets) && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {progressionSuggestion.suggestedWeight && (
                      <div className="bg-slate-700/50 dark:bg-white/80 border border-slate-600 dark:border-slate-300 rounded-lg px-4 py-2">
                        <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-wide">Peso Sugerido</p>
                        <p className="text-lg font-bold text-white dark:text-slate-900">{progressionSuggestion.suggestedWeight}kg</p>
                      </div>
                    )}
                    {progressionSuggestion.suggestedReps && (
                      <div className="bg-slate-700/50 dark:bg-white/80 border border-slate-600 dark:border-slate-300 rounded-lg px-4 py-2">
                        <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-wide">Reps Sugeridas</p>
                        <p className="text-lg font-bold text-white dark:text-slate-900">{progressionSuggestion.suggestedReps}</p>
                      </div>
                    )}
                    {progressionSuggestion.suggestedSets && (
                      <div className="bg-slate-700/50 dark:bg-white/80 border border-slate-600 dark:border-slate-300 rounded-lg px-4 py-2">
                        <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-wide">Series Sugeridas</p>
                        <p className="text-lg font-bold text-white dark:text-slate-900">{progressionSuggestion.suggestedSets}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notas Generales y RPE */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">Resumen del Entrenamiento</h3>

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

          <div>
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-700 mb-2">
              Notas generales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas generales sobre tu entrenamiento (cómo te sentiste, sueño, nutrición, etc.)"
              className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 placeholder-slate-500 dark:placeholder-slate-400 resize-none"
              rows={3}
            />
          </div>
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

        {/* Modal de Historial */}
        {showHistoryModal && historyExerciseId && (() => {
          const history = getExerciseHistory(historyExerciseId);
          const exercise = getExerciseById(historyExerciseId);

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 dark:bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 dark:border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                      <div>
                        <h3 className="text-xl font-bold text-white dark:text-slate-900">{exercise?.name}</h3>
                        <p className="text-slate-400 dark:text-slate-600 text-sm">Últimos 10 entrenamientos</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="p-2 text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/50 dark:hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 dark:text-slate-600">No hay historial de entrenamientos para este ejercicio</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((h: any, index: number) => {
                        const prevH = history[index + 1];
                        let trendIcon = null;
                        let trendColor = '';

                        if (prevH) {
                          if (h.maxWeight > prevH.maxWeight || (h.maxWeight === prevH.maxWeight && h.avgReps > prevH.avgReps)) {
                            trendIcon = '📈';
                            trendColor = 'text-emerald-500';
                          } else if (h.maxWeight < prevH.maxWeight || h.avgReps < prevH.avgReps) {
                            trendIcon = '📉';
                            trendColor = 'text-red-500';
                          } else {
                            trendIcon = '➡️';
                            trendColor = 'text-yellow-500';
                          }
                        }

                        return (
                          <div
                            key={index}
                            className="bg-slate-700/30 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-white dark:text-slate-900 font-medium">
                                  {h.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                {trendIcon && (
                                  <span className={`text-lg ${trendColor}`}>{trendIcon}</span>
                                )}
                              </div>
                              <div className="text-sm text-slate-400 dark:text-slate-600">
                                {h.sets} {h.sets === 1 ? 'serie' : 'series'}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-2">
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-600">Peso máx</p>
                                <p className="text-lg font-bold text-emerald-400 dark:text-emerald-600">{h.maxWeight}kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-600">Reps prom</p>
                                <p className="text-lg font-bold text-blue-400 dark:text-blue-600">{h.avgReps}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-600">Volumen</p>
                                <p className="text-lg font-bold text-purple-400 dark:text-purple-600">{h.totalVolume}kg</p>
                              </div>
                            </div>

                            {h.notes && (
                              <div className="mt-2 pt-2 border-t border-slate-600 dark:border-slate-300">
                                <p className="text-xs text-slate-400 dark:text-slate-600 italic">{h.notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal de Selección de Ejercicio */}
        {exercise && currentExercise && (
          <ExercisePickerModal
            isOpen={showExercisePicker}
            onClose={() => {
              setShowExercisePicker(false);
              setExerciseIndexToReplace(null);
            }}
            currentExerciseId={currentExercise.exerciseId}
            onSelectExercise={handleReplaceExercise}
            isSupersetExercise={!!currentExercise.isSupersetWith}
          />
        )}

        {/* Dialog de Confirmación */}
        <ConfirmDialog {...confirmState} />
      </div>
    </div>
  );
}
