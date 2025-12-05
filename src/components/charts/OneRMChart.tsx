'use client';

import { Workout } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { getExerciseById } from '@/data/exercises';

interface OneRMChartProps {
  workouts: Workout[];
  exerciseId: string;
}

interface ChartDataPoint {
  date: string;
  estimated1RM: number;
  maxWeight: number;
}

// Fórmula de Brzycki para estimar 1RM
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
};

export default function OneRMChart({ workouts, exerciseId }: OneRMChartProps) {
  const exercise = getExerciseById(exerciseId);

  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    workouts.forEach(workout => {
      const workoutExercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
      if (!workoutExercise) return;

      const completedSets = workoutExercise.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      // Calcular el 1RM estimado más alto de todas las series
      const estimated1RMs = completedSets.map(s => calculate1RM(s.weight, s.reps));
      const maxEstimated1RM = Math.max(...estimated1RMs);
      const maxWeight = Math.max(...completedSets.map(s => s.weight));

      const date = new Date(workout.date);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;

      data.push({
        date: formattedDate,
        estimated1RM: Math.round(maxEstimated1RM * 10) / 10,
        maxWeight
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
      <div>
        <h3 className="text-lg font-bold text-white dark:text-slate-900">
          {exercise?.name || 'Ejercicio'} - 1RM Estimado
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Basado en la fórmula de Brzycki
        </p>
      </div>

      <div className="w-full h-[300px]">
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
              label={{ value: '1RM (kg)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="estimated1RM"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 5 }}
              activeDot={{ r: 7 }}
              name="1RM Estimado"
            />
            <Line
              type="monotone"
              dataKey="maxWeight"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', r: 3 }}
              name="Peso Máximo Real"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mostrar valor actual del 1RM */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-500/20 dark:bg-orange-100 border border-orange-500/50 dark:border-orange-300 rounded-lg p-4 text-center">
          <p className="text-xs text-orange-400 dark:text-orange-600 mb-1">1RM Estimado Actual</p>
          <p className="text-2xl font-bold text-orange-500">
            {chartData[chartData.length - 1]?.estimated1RM} kg
          </p>
        </div>
        <div className="bg-purple-500/20 dark:bg-purple-100 border border-purple-500/50 dark:border-purple-300 rounded-lg p-4 text-center">
          <p className="text-xs text-purple-400 dark:text-purple-600 mb-1">Peso Máximo Real</p>
          <p className="text-2xl font-bold text-purple-500">
            {chartData[chartData.length - 1]?.maxWeight} kg
          </p>
        </div>
      </div>
    </div>
  );
}
