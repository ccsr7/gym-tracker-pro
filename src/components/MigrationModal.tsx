'use client';

import { useState } from 'react';
import { X, Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { createRoutine, createWorkout, createRestDay } from '@/lib/supabase/services';
import { useToast } from '@/hooks/useToast';
import { Routine, Workout, RestDay } from '@/types';
import LoadingLogo from '@/components/ui/LoadingLogo';

interface MigrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface MigrationStats {
  routines: number;
  workouts: number;
  restDays: number;
}

export default function MigrationModal({ onClose, onSuccess }: MigrationModalProps) {
  const toast = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [stats, setStats] = useState<MigrationStats>({ routines: 0, workouts: 0, restDays: 0 });
  const [errors, setErrors] = useState<string[]>([]);

  const analyzeLocalData = (): MigrationStats => {
    const routines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    const workouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    const restDays = JSON.parse(localStorage.getItem('gym-tracker-rest-days') || '[]');

    return {
      routines: routines.length,
      workouts: workouts.length,
      restDays: restDays.length,
    };
  };

  const localStats = analyzeLocalData();
  const hasDataToMigrate = localStats.routines > 0 || localStats.workouts > 0 || localStats.restDays > 0;

  const handleMigration = async () => {
    setIsMigrating(true);
    setErrors([]);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión para migrar tus datos');
        setIsMigrating(false);
        return;
      }

      const migrationErrors: string[] = [];
      let migratedRoutines = 0;
      let migratedWorkouts = 0;
      let migratedRestDays = 0;

      // Migrate Routines
      const routines: Routine[] = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
      for (const routine of routines) {
        try {
          await createRoutine(user.id, {
            name: routine.name,
            day: routine.day,
            exercises: routine.exercises,
            duration: routine.duration,
            isRestDay: routine.isRestDay || false,
          });
          migratedRoutines++;
        } catch (error) {
          console.error('[Migration] Error migrating routine:', error);
          migrationErrors.push(`Rutina "${routine.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      // Migrate Workouts
      const workouts: Workout[] = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
      for (const workout of workouts) {
        try {
          await createWorkout(user.id, {
            date: workout.date,
            routineId: workout.routineId,
            routineName: workout.routineName,
            exercises: workout.exercises,
            duration: workout.duration,
            notes: workout.notes,
            rpe: workout.rpe,
            totalVolume: workout.totalVolume,
          });
          migratedWorkouts++;
        } catch (error) {
          console.error('[Migration] Error migrating workout:', error);
          migrationErrors.push(`Entrenamiento del ${new Date(workout.date).toLocaleDateString()}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      // Migrate Rest Days
      const restDays: RestDay[] = JSON.parse(localStorage.getItem('gym-tracker-rest-days') || '[]');
      for (const restDay of restDays) {
        try {
          await createRestDay(user.id, {
            date: restDay.date,
            reason: restDay.reason,
            notes: restDay.notes,
          });
          migratedRestDays++;
        } catch (error) {
          console.error('[Migration] Error migrating rest day:', error);
          migrationErrors.push(`Día de descanso del ${new Date(restDay.date).toLocaleDateString()}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      setStats({
        routines: migratedRoutines,
        workouts: migratedWorkouts,
        restDays: migratedRestDays,
      });

      setErrors(migrationErrors);
      setMigrationComplete(true);

      if (migrationErrors.length === 0) {
        toast.success('Migración completada exitosamente');
      } else {
        toast.warning(`Migración completada con ${migrationErrors.length} errores`);
      }
    } catch (error) {
      console.error('[Migration] Fatal error:', error);
      toast.error('Error al migrar los datos');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocalData = () => {
    localStorage.removeItem('gym-tracker-routines');
    localStorage.removeItem('gym-tracker-workouts');
    localStorage.removeItem('gym-tracker-rest-days');
    toast.success('Datos locales eliminados');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 dark:bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 dark:border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 dark:bg-white border-b border-slate-700/50 dark:border-slate-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 dark:bg-blue-100 p-2 rounded-lg">
              <Database className="w-5 h-5 text-blue-400 dark:text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-slate-900">
                Migrar Datos a Supabase
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-600">
                Importa tus datos locales a la nube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 dark:hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!migrationComplete ? (
            <>
              {/* Info Box */}
              <div className="bg-blue-500/10 dark:bg-blue-50 border border-blue-500/30 dark:border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 dark:text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 dark:text-blue-700 mb-1">
                      ¿Qué hace esta migración?
                    </p>
                    <p className="text-xs text-blue-200 dark:text-blue-600">
                      Esta herramienta copiará todos tus datos almacenados localmente (rutinas, entrenamientos y días de descanso)
                      a Supabase. Esto te permitirá acceder a tus datos desde cualquier dispositivo y mantenerlos sincronizados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              {hasDataToMigrate ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white dark:text-slate-900">
                    Datos detectados en este dispositivo:
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-emerald-400 dark:text-emerald-600">
                        {localStats.routines}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Rutinas</p>
                    </div>
                    <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-400 dark:text-blue-600">
                        {localStats.workouts}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Entrenamientos</p>
                    </div>
                    <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-400 dark:text-purple-600">
                        {localStats.restDays}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Días de Descanso</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-600">
                    No se encontraron datos para migrar en este dispositivo
                  </p>
                </div>
              )}

              {/* Warning */}
              {hasDataToMigrate && (
                <div className="bg-yellow-500/10 dark:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 dark:text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300 dark:text-yellow-700 mb-1">
                        Importante
                      </p>
                      <ul className="text-xs text-yellow-200 dark:text-yellow-600 space-y-1 list-disc list-inside">
                        <li>La migración puede tomar algunos minutos dependiendo de la cantidad de datos</li>
                        <li>Asegúrate de tener una conexión estable a internet</li>
                        <li>Los datos duplicados serán omitidos automáticamente</li>
                        <li>Tus datos locales permanecerán intactos después de la migración</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isMigrating}
                  className="flex-1 px-6 py-3 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMigration}
                  disabled={isMigrating || !hasDataToMigrate}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isMigrating ? (
                    <>
                      <LoadingLogo size="sm" variant="lift" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Iniciar Migración
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-8">
                <div className="bg-emerald-500/20 dark:bg-emerald-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 dark:text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-white dark:text-slate-900 mb-2">
                  ¡Migración Completada!
                </h3>
                <p className="text-slate-400 dark:text-slate-600 mb-6">
                  Tus datos han sido migrados exitosamente
                </p>

                {/* Migration Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-400 dark:text-emerald-600">
                      {stats.routines}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Rutinas</p>
                  </div>
                  <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-400 dark:text-blue-600">
                      {stats.workouts}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Entrenamientos</p>
                  </div>
                  <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-400 dark:text-purple-600">
                      {stats.restDays}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Días de Descanso</p>
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-500/10 dark:bg-red-50 border border-red-500/30 dark:border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-red-300 dark:text-red-700 mb-2">
                      Errores durante la migración ({errors.length}):
                    </p>
                    <div className="text-xs text-red-200 dark:text-red-600 max-h-40 overflow-y-auto space-y-1">
                      {errors.map((error, idx) => (
                        <p key={idx}>• {error}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option to clear local data */}
                <div className="bg-slate-700/30 dark:bg-slate-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-300 dark:text-slate-700 mb-3">
                    ¿Deseas eliminar los datos locales ahora que están en Supabase?
                  </p>
                  <button
                    onClick={handleClearLocalData}
                    className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 dark:text-red-600 rounded-lg text-sm transition-colors"
                  >
                    Eliminar Datos Locales
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-2">
                    Puedes hacerlo más tarde si prefieres
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
