'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, BarChart3, Calendar, Dumbbell, Award, Clock, Zap, Download, FileText, FileType } from 'lucide-react';
import { getPersonalRecords, getTrainingFrequency, getTimeUnderTension } from '@/lib/volume-stats';
import { exportToCSV, exportToPDF, downloadFile, generateFilename } from '@/lib/data-export';

export default function StatsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    const storedWorkouts = JSON.parse(localStorage.getItem('gym-tracker-workouts') || '[]');
    setWorkouts(storedWorkouts);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    if (timeRange === '7') cutoffDate.setDate(now.getDate() - 7);
    else if (timeRange === '30') cutoffDate.setDate(now.getDate() - 30);
    else if (timeRange === '90') cutoffDate.setDate(now.getDate() - 90);
    else cutoffDate.setFullYear(2000); // All time

    const filteredWorkouts = workouts.filter(w => new Date(w.date) >= cutoffDate);

    // Total volume (kg lifted)
    const totalVolume = filteredWorkouts.reduce((sum, workout) => {
      return sum + (workout.totalVolume || 0);
    }, 0);

    // Total workouts
    const totalWorkouts = filteredWorkouts.length;

    // Average duration
    const avgDuration = totalWorkouts > 0
      ? filteredWorkouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts
      : 0;

    // Frequency per week
    const weeks = timeRange === '7' ? 1 : timeRange === '30' ? 4 : timeRange === '90' ? 12 : 52;
    const frequency = totalWorkouts / weeks;

    return {
      totalVolume,
      totalWorkouts,
      avgDuration,
      frequency
    };
  }, [workouts, timeRange]);

  // Volume over time
  const volumeData = useMemo(() => {
    const grouped: { [key: string]: number } = {};

    workouts.forEach(workout => {
      const date = new Date(workout.date).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric'
      });
      grouped[date] = (grouped[date] || 0) + (workout.totalVolume || 0);
    });

    return Object.entries(grouped)
      .map(([date, volume]) => ({
        date,
        volume: Math.round(volume)
      }))
      .slice(-14); // Last 14 entries
  }, [workouts]);

  // Exercise frequency
  const exerciseFrequency = useMemo(() => {
    const freq: { [key: string]: number } = {};

    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        const exercise = getExerciseById(ex.exerciseId);
        if (exercise) {
          freq[exercise.name] = (freq[exercise.name] || 0) + 1;
        }
      });
    });

    return Object.entries(freq)
      .map(([name, count]) => ({
        name,
        value: count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [workouts]);

  // Muscle group distribution
  const muscleGroupDistribution = useMemo(() => {
    const dist: { [key: string]: number } = {};

    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        const exercise = getExerciseById(ex.exerciseId);
        if (exercise) {
          dist[exercise.category] = (dist[exercise.category] || 0) + 1;
        }
      });
    });

    return Object.entries(dist).map(([name, value]) => ({
      name,
      value
    }));
  }, [workouts]);

  // Strength progression for selected exercise
  const strengthProgression = useMemo(() => {
    if (selectedExercise === 'all') return [];

    const data: { date: string; maxWeight: number }[] = [];

    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (ex.exerciseId === selectedExercise) {
          const maxWeight = Math.max(...ex.sets.map(s => s.weight));
          data.push({
            date: new Date(workout.date).toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric'
            }),
            maxWeight
          });
        }
      });
    });

    return data;
  }, [workouts, selectedExercise]);

  // Get unique exercises
  const exercises = useMemo(() => {
    const uniqueExercises = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        uniqueExercises.add(ex.exerciseId);
      });
    });
    return Array.from(uniqueExercises).map(id => getExerciseById(id)).filter(Boolean);
  }, [workouts]);

  // Advanced stats: PR, Frequency, TUT
  const advancedStats = useMemo(() => {
    const personalRecords = getPersonalRecords(workouts);
    const trainingFrequency = getTrainingFrequency(workouts, 4);
    const timeUnderTension = getTimeUnderTension(workouts);

    // Get top 5 PRs
    const topPRs = Array.from(personalRecords.values())
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 5)
      .map(pr => {
        const exercise = getExerciseById(pr.exerciseId);
        return {
          exerciseName: exercise?.name || 'Unknown',
          maxWeight: pr.maxWeight,
          date: new Date(pr.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        };
      });

    return {
      topPRs,
      trainingFrequency,
      timeUnderTension,
      totalPRs: personalRecords.size
    };
  }, [workouts]);

  const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#eab308'];

  const handleExportCSV = () => {
    if (workouts.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const csvContent = exportToCSV(workouts);
    const filename = generateFilename('csv');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const handleExportPDF = async () => {
    if (workouts.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const pdf = await exportToPDF(workouts);
    const filename = generateFilename('pdf');
    pdf.save(filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900 mb-2">Estadísticas</h1>
          <p className="text-slate-400 dark:text-slate-600">Analiza tu progreso y rendimiento</p>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            { label: '7 días', value: '7' as const },
            { label: '30 días', value: '30' as const },
            { label: '90 días', value: '90' as const },
            { label: 'Todo', value: 'all' as const }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                timeRange === range.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800/40 dark:bg-slate-200 text-slate-300 dark:text-slate-700 hover:bg-slate-700/50 dark:hover:bg-slate-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Data Export Section */}
        {workouts.length > 0 && (
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-white dark:text-slate-900">Exportar Datos</h3>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-4">
              Descarga todos tus entrenamientos en formato profesional CSV o PDF
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/50"
              >
                <FileText className="w-5 h-5" />
                Exportar CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/50"
              >
                <FileType className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-3 text-center">
              {workouts.length} {workouts.length === 1 ? 'entrenamiento' : 'entrenamientos'} disponibles para exportar
            </p>
          </div>
        )}

        {/* Advanced Statistics */}
        {workouts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Personal Records */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-100 dark:to-emerald-50 border border-emerald-500/30 dark:border-emerald-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/30 dark:bg-emerald-200 rounded-lg">
                  <Award className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-emerald-900">Récords Personales</h3>
                  <p className="text-xs text-emerald-300 dark:text-emerald-700">{advancedStats.totalPRs} ejercicios</p>
                </div>
              </div>
              {advancedStats.topPRs.length > 0 ? (
                <div className="space-y-2">
                  {advancedStats.topPRs.map((pr, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100 dark:text-emerald-900 truncate flex-1 mr-2">
                        {pr.exerciseName}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-white dark:text-emerald-900">{pr.maxWeight} kg</span>
                        <span className="text-xs text-emerald-300 dark:text-emerald-700 ml-2">{pr.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-200 dark:text-emerald-800 text-sm">Completa entrenamientos para ver tus récords</p>
              )}
            </div>

            {/* Training Frequency */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-100 dark:to-blue-50 border border-blue-500/30 dark:border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/30 dark:bg-blue-200 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400 dark:text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-blue-900">Frecuencia</h3>
                  <p className="text-xs text-blue-300 dark:text-blue-700">Últimas 4 semanas</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-white dark:text-blue-900 mb-2">
                  {advancedStats.trainingFrequency}
                </p>
                <p className="text-blue-200 dark:text-blue-800 text-sm">
                  entrenamientos por semana
                </p>
                <div className="mt-4 pt-4 border-t border-blue-500/30 dark:border-blue-200">
                  <p className="text-xs text-blue-300 dark:text-blue-700">
                    {advancedStats.trainingFrequency >= 4 ? '🔥 Excelente consistencia!' :
                     advancedStats.trainingFrequency >= 3 ? '💪 Buen ritmo' :
                     advancedStats.trainingFrequency >= 2 ? '👍 Mantenlo así' :
                     '⚡ Puedes aumentar la frecuencia'}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Under Tension */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-100 dark:to-purple-50 border border-purple-500/30 dark:border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/30 dark:bg-purple-200 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-400 dark:text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-purple-900">Tiempo Bajo Tensión</h3>
                  <p className="text-xs text-purple-300 dark:text-purple-700">Total acumulado</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-white dark:text-purple-900 mb-2">
                  {advancedStats.timeUnderTension}
                </p>
                <p className="text-purple-200 dark:text-purple-800 text-sm mb-1">
                  minutos totales
                </p>
                <p className="text-xs text-purple-300 dark:text-purple-700">
                  {(advancedStats.timeUnderTension / 60).toFixed(1)} horas de trabajo muscular
                </p>
                <div className="mt-4 pt-4 border-t border-purple-500/30 dark:border-purple-200">
                  <p className="text-xs text-purple-300 dark:text-purple-700">
                    ~3 segundos por repetición
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-sm">Volumen Total</p>
            </div>
            <p className="text-2xl font-bold text-white dark:text-slate-900">
              {stats.totalVolume.toLocaleString()} kg
            </p>
          </div>

          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-sm">Entrenamientos</p>
            </div>
            <p className="text-2xl font-bold text-white dark:text-slate-900">{stats.totalWorkouts}</p>
          </div>

          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-sm">Frecuencia</p>
            </div>
            <p className="text-2xl font-bold text-white dark:text-slate-900">
              {stats.frequency.toFixed(1)}/sem
            </p>
          </div>

          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-sm">Duración Prom.</p>
            </div>
            <p className="text-2xl font-bold text-white dark:text-slate-900">
              {Math.round(stats.avgDuration)} min
            </p>
          </div>
        </div>

        {/* Volume Over Time Chart */}
        <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">
            Volumen de Entrenamiento
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorVolume)"
                name="Volumen (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Strength Progression */}
        {exercises.length > 0 && (
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-3">
                Progreso de Fuerza
              </h3>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full md:w-auto px-4 py-2 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Selecciona un ejercicio</option>
                {exercises.map(ex => ex && (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            {strengthProgression.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={strengthProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    name="Peso Máximo (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 dark:text-slate-600">
                  Selecciona un ejercicio para ver su progreso
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exercise Frequency */}
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">
              Ejercicios Más Frecuentes
            </h3>
            {exerciseFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exerciseFrequency} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="value" fill="#a855f7" name="Veces realizado" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 dark:text-slate-600">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Muscle Group Distribution */}
          <div className="bg-slate-800/40 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white dark:text-slate-900 mb-4">
              Distribución por Grupo Muscular
            </h3>
            {muscleGroupDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={muscleGroupDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {muscleGroupDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 dark:text-slate-600">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-slate-600 text-lg mb-2">
              No hay entrenamientos registrados
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Completa algunos entrenamientos para ver tus estadísticas
            </p>
          </div>
        )}
        </div>
      </PageTransition>
    </div>
  );
}
