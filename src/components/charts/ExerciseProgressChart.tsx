'use client';

import { Workout } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo, memo } from 'react';
import { getExerciseById } from '@/data/exercises';

interface ExerciseProgressChartProps {
  workouts: Workout[];
  exerciseId: string;
}

interface ChartDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
}

function ExerciseProgressChart({ workouts, exerciseId }: ExerciseProgressChartProps) {
  const exercise = getExerciseById(exerciseId);

  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    workouts.forEach(workout => {
      const workoutExercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
      if (!workoutExercise) return;

      const completedSets = workoutExercise.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map(s => s.weight));
      const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);

      const date = new Date(workout.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;

      data.push({
        date: formattedDate,
        maxWeight,
        totalVolume,
        totalReps
      });
    });

    return data.reverse(); // Mostrar del más antiguo al más reciente
  }, [workouts, exerciseId]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-600">
        No hay datos de este ejercicio en el historial
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white dark:text-slate-900">
        {exercise?.name || 'Ejercicio'}
      </h3>

      {/* Gráfico de Peso Máximo */}
      <div>
        <h4 className="text-sm text-slate-400 dark:text-slate-600 mb-2">Peso Máximo por Sesión</h4>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`${value} kg`, 'Peso Máximo']}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Volumen Total */}
      <div>
        <h4 className="text-sm text-slate-400 dark:text-slate-600 mb-2">Volumen Total por Sesión</h4>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`${value} kg`, 'Volumen']}
              />
              <Line
                type="monotone"
                dataKey="totalVolume"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default memo(ExerciseProgressChart);
