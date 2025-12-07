'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { Sparkles, Users, TrendingUp, Zap, Check, Calendar, Dumbbell } from 'lucide-react';
// FIXME: Temporarily disabled due to invalid exercise IDs causing build errors
// import { ROUTINE_TEMPLATES, RoutineTemplate } from '@/data/routine-templates';
import { Routine } from '@/types';

type RoutineTemplate = any; // Temporary type

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // FIXME: Temporarily using empty array until exercise IDs are fixed
  const ROUTINE_TEMPLATES: any[] = [];

  const filteredTemplates = selectedCategory === 'all'
    ? ROUTINE_TEMPLATES
    : ROUTINE_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleApplyTemplate = (template: RoutineTemplate) => {
    // Cargar rutinas existentes
    const existingRoutines = JSON.parse(localStorage.getItem('gym-tracker-routines') || '[]');

    // Crear nuevas rutinas basadas en la plantilla
    const newRoutines: Routine[] = template.routines.map((routineData: any) => ({
      id: `${template.id}-${routineData.day}-${Date.now()}`,
      name: routineData.name,
      day: routineData.day,
      exercises: routineData.exercises,
      duration: routineData.exercises.length * 8 // Estimación: 8 min por ejercicio
    }));

    // Combinar con rutinas existentes
    const allRoutines = [...existingRoutines, ...newRoutines];
    localStorage.setItem('gym-tracker-routines', JSON.stringify(allRoutines));

    // Redirigir a rutinas
    router.push('/routines');
  };

  const categoryLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  };

  const categoryColors = {
    beginner: 'text-green-500',
    intermediate: 'text-blue-500',
    advanced: 'text-purple-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white dark:text-slate-900">Plantillas de Rutinas</h1>
            </div>
            <p className="text-slate-400 dark:text-slate-600">
              Comienza rápido con rutinas probadas y efectivas
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { label: 'Todas', value: 'all' as const, icon: Sparkles },
              { label: 'Principiante', value: 'beginner' as const, icon: Users },
              { label: 'Intermedio', value: 'intermediate' as const, icon: TrendingUp },
              { label: 'Avanzado', value: 'advanced' as const, icon: Zap }
            ].map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 hover:border-emerald-500/50 dark:hover:border-emerald-400 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{template.icon}</span>
                      <h3 className="text-xl font-bold text-white dark:text-slate-900">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-slate-400 dark:text-slate-600 text-sm mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase ${categoryColors[template.category]}`}>
                        {categoryLabels[template.category]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {template.daysPerWeek} días/semana
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routine Days */}
                <div className="space-y-2 mb-4">
                  {template.routines.map((routine, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/30 dark:bg-white border border-slate-600/30 dark:border-slate-300 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-white dark:text-slate-900">
                            {routine.day}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-600">
                            {routine.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400 dark:text-emerald-600">
                            {routine.exercises.length}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-600">
                            ejercicios
                          </p>
                        </div>
                      </div>

                      {/* Exercise Preview */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {routine.exercises.slice(0, 3).map((_, exIdx) => (
                          <div
                            key={exIdx}
                            className="w-2 h-2 rounded-full bg-emerald-500"
                          />
                        ))}
                        {routine.exercises.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-600 ml-1">
                            +{routine.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/50"
                >
                  <Check className="w-5 h-5" />
                  Aplicar Plantilla
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-600 text-center mt-2">
                  Se añadirán {template.routines.length} rutinas a tu programa
                </p>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 dark:text-slate-600 text-lg">
                No hay plantillas en esta categoría
              </p>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
