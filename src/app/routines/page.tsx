'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import RoutineImportExport from '@/components/RoutineImportExport';
import { Routine, DayOfWeek } from '@/types';
import { getDayColor, getDayInitial } from '@/lib/utils';
import { Plus, Clock, Dumbbell, Calendar, Edit, Download, Sparkles } from 'lucide-react';
import { getExerciseById } from '@/data/exercises';

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [stats, setStats] = useState({ total: 0, exercises: 0, active: 0, time: 0 });
  const [showImportExport, setShowImportExport] = useState(false);

  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = () => {
    const storedRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');
    setRoutines(storedRoutines);

    const totalExercises = storedRoutines.reduce((acc: number, r: Routine) =>
      acc + (r.exercises?.length || 0), 0
    );
    const totalTime = storedRoutines.reduce((acc: number, r: Routine) =>
      acc + (r.duration || 0), 0
    );

    setStats({
      total: storedRoutines.length,
      exercises: totalExercises,
      active: storedRoutines.length,
      time: totalTime,
    });
  };

  const getRoutineForDay = (day: DayOfWeek) => {
    return routines.find(r => r.day === day);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Mis Rutinas</h1>
            <p className="text-slate-400 dark:text-slate-600">Organiza tus entrenamientos por días de la semana</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/routines/templates')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-yellow-500/50"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Importar/Exportar</span>
            </button>
            <button
              onClick={() => router.push('/routines/create')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Rutina</span>
            </button>
          </div>
        </div>

        {/* Weekly Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {days.map((day) => {
            const routine = getRoutineForDay(day);
            const dayColor = getDayColor(day);
            const dayInitial = getDayInitial(day);

            return (
              <StaggerItem key={day}>
                <div
                  className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
                >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${dayColor} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}>
                    {dayInitial}
                  </div>
                  <h3 className="text-lg font-bold text-white dark:text-slate-900">{day}</h3>
                </div>

                {routine ? (
                  <>
                    <div className="bg-slate-700/30 dark:bg-white border border-slate-600/50 dark:border-slate-300 rounded-lg p-3 mb-3">
                      <h4 className="text-white dark:text-slate-900 font-medium mb-2">{routine.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {routine.exercises?.length || 0} ejercicios
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{routine.duration || 0} min
                        </span>
                      </div>

                      {/* Lista de ejercicios con series/reps */}
                      {routine.exercises && routine.exercises.length > 0 && (
                        <div className="space-y-1.5 border-t border-slate-600/50 dark:border-slate-300 pt-2">
                          {routine.exercises.slice(0, 3).map((ex, idx) => {
                            const exercise = getExerciseById(ex.exerciseId);
                            if (!exercise) return null;
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300 dark:text-slate-700 truncate flex-1">{exercise.name}</span>
                                <span className="text-emerald-400 dark:text-emerald-600 ml-2 font-medium whitespace-nowrap">
                                  {ex.sets}×{ex.reps}
                                </span>
                              </div>
                            );
                          })}
                          {routine.exercises.length > 3 && (
                            <p className="text-slate-500 dark:text-slate-600 text-[10px] text-center">
                              +{routine.exercises.length - 3} más
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/routines/edit/${routine.id}`)}
                        className="flex-1 bg-slate-700/50 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-slate-300 dark:text-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => router.push(`/workout/${routine.id}`)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Iniciar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm mb-3">Sin rutina</p>
                    <button
                      onClick={() => router.push(`/routines/create?day=${day}`)}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-emerald-500 mb-1">{stats.total}</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm">Total Rutinas</p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-blue-500 mb-1">{stats.exercises}</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm">Ejercicios Totales</p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-purple-500 mb-1">{stats.active}</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm">Días Activos</p>
          </div>
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-orange-500 mb-1">{stats.time}</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm">Minutos/Semana</p>
          </div>
        </div>
        </div>
      </PageTransition>

      {/* Import/Export Modal */}
      {showImportExport && (
        <RoutineImportExport
          onClose={() => setShowImportExport(false)}
          onImport={() => {
            loadRoutines();
            setShowImportExport(false);
          }}
        />
      )}
    </div>
  );
}
