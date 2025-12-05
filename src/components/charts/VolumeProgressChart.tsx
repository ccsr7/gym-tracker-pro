'use client';

import { Workout } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

interface VolumeProgressChartProps {
  workouts: Workout[];
}

export default function VolumeProgressChart({ workouts }: VolumeProgressChartProps) {
  const chartData = useMemo(() => {
    // Agrupar workouts por semana
    const weeklyData: { [key: string]: { week: string; volume: number; workouts: number } } = {};

    workouts.forEach(workout => {
      const date = new Date(workout.date);
      // Obtener el lunes de la semana
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: formatWeekLabel(monday),
          volume: 0,
          workouts: 0
        };
      }

      weeklyData[weekKey].volume += workout.totalVolume || 0;
      weeklyData[weekKey].workouts += 1;
    });

    // Convertir a array y ordenar por fecha
    return Object.values(weeklyData).sort((a, b) => {
      const dateA = new Date(a.week.split(' - ')[0]);
      const dateB = new Date(b.week.split(' - ')[0]);
      return dateA.getTime() - dateB.getTime();
    });
  }, [workouts]);

  const formatWeekLabel = (monday: Date): string => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) => {
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-600">
        No hay datos suficientes para mostrar el gráfico
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="week"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
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
            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
            formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volumen']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
            name="Volumen Total"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
