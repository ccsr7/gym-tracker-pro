import { Workout } from '@/types';
import { getExerciseById } from '@/data/exercises';

/**
 * Calcula estadísticas generales de los entrenamientos
 */
function calculateStats(workouts: Workout[]) {
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const avgRPE = workouts.filter(w => w.rpe).reduce((sum, w) => sum + (w.rpe || 0), 0) / workouts.filter(w => w.rpe).length || 0;

  return {
    totalWorkouts,
    totalVolume: Math.round(totalVolume),
    totalDuration,
    avgRPE: avgRPE.toFixed(1)
  };
}

/**
 * Exporta los entrenamientos a formato CSV profesional
 */
export function exportToCSV(workouts: Workout[]): string {
  const stats = calculateStats(workouts);
  const exportDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Header section
  const lines = [
    '════════════════════════════════════════════════════════════════',
    'GYM TRACKER PRO - REPORTE DE ENTRENAMIENTOS',
    '════════════════════════════════════════════════════════════════',
    '',
    `Fecha de exportación: ${exportDate}`,
    '',
    '─────────────────────── RESUMEN ───────────────────────',
    `Total de entrenamientos: ${stats.totalWorkouts}`,
    `Volumen total levantado: ${stats.totalVolume.toLocaleString('es-ES')} kg`,
    `Tiempo total de entrenamiento: ${stats.totalDuration} minutos`,
    `RPE promedio: ${stats.avgRPE}`,
    '',
    '─────────────────── DETALLE DE ENTRENAMIENTOS ─────────────────',
    ''
  ];

  // Column headers
  const headers = [
    'Fecha',
    'Rutina',
    'Ejercicio',
    'Grupo Muscular',
    'Serie',
    'Reps',
    'Peso (kg)',
    'Volumen (kg)',
    'Completada',
    'Duración (min)',
    'RPE',
    'Notas Ejercicio',
    'Notas Generales'
  ];

  lines.push(headers.join(','));

  // Data rows
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId);
      const exerciseName = exercise?.name || 'Unknown';
      const muscleGroup = exercise?.muscleGroup || 'Unknown';

      ex.sets.forEach((set, setIdx) => {
        const row = [
          new Date(workout.date).toLocaleDateString('es-ES'),
          `"${workout.routineName}"`,
          `"${exerciseName}"`,
          muscleGroup,
          setIdx + 1,
          set.reps,
          set.weight,
          set.completed ? set.reps * set.weight : 0,
          set.completed ? 'Sí' : 'No',
          workout.duration,
          workout.rpe || '',
          `"${ex.notes || ''}"`,
          `"${workout.notes || ''}"`
        ];
        lines.push(row.join(','));
      });
    });
  });

  // Footer
  lines.push('');
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push('Generado por GYM TRACKER PRO');
  lines.push('════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Exporta los entrenamientos a formato PDF profesional
 * Usa dynamic import para cargar jsPDF solo cuando se necesita
 */
export async function exportToPDF(workouts: Workout[]): Promise<any> {
  // Lazy load jsPDF and autoTable
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf').then(mod => mod.default),
    import('jspdf-autotable').then(mod => mod.default)
  ]);
  const doc = new jsPDF();
  const stats = calculateStats(workouts);
  const exportDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Colors (app theme)
  const orange: [number, number, number] = [249, 115, 22]; // Orange-500
  const emerald: [number, number, number] = [16, 185, 129]; // Emerald-500
  const slate: [number, number, number] = [51, 65, 85]; // Slate-700
  const lightSlate: [number, number, number] = [148, 163, 184]; // Slate-400

  let yPosition = 20;

  // Header - Logo and Title
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.circle(20, yPosition, 6, 'F');

  // Dumbbell icon (simplified representation)
  doc.setFillColor(255, 255, 255);
  doc.rect(17, yPosition - 1.5, 6, 3, 'F');
  doc.circle(16.5, yPosition, 1.5, 'F');
  doc.circle(23.5, yPosition, 1.5, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('GYM TRACKER', 30, yPosition - 2);

  doc.setFontSize(12);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text('PRO', 30, yPosition + 4);

  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Entrenamientos', 105, yPosition, { align: 'center' });

  // Export date
  doc.setFontSize(9);
  doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
  doc.text(`Exportado el ${exportDate}`, 105, yPosition + 6, { align: 'center' });

  yPosition += 20;

  // Separator line
  doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, 195, yPosition);

  yPosition += 10;

  // Summary Statistics
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('Resumen General', 15, yPosition);

  yPosition += 8;

  // Stats table
  autoTable(doc, {
    startY: yPosition,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Entrenamientos', stats.totalWorkouts.toString()],
      ['Volumen Total Levantado', `${stats.totalVolume.toLocaleString('es-ES')} kg`],
      ['Tiempo Total de Entrenamiento', `${stats.totalDuration} minutos`],
      ['RPE Promedio', stats.avgRPE]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: orange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      textColor: slate,
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Workouts detail section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('Detalle de Entrenamientos', 15, yPosition);

  yPosition += 8;

  // Prepare data for workouts table
  const tableData: any[] = [];
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId);
      const exerciseName = exercise?.name || 'Unknown';
      const muscleGroup = exercise?.muscleGroup || 'Unknown';

      ex.sets.forEach((set, setIdx) => {
        tableData.push([
          new Date(workout.date).toLocaleDateString('es-ES'),
          workout.routineName,
          exerciseName,
          muscleGroup,
          (setIdx + 1).toString(),
          set.reps.toString(),
          set.weight.toString(),
          set.completed ? (set.reps * set.weight).toString() : '0',
          set.completed ? '✓' : '✗'
        ]);
      });
    });
  });

  // Workouts table
  autoTable(doc, {
    startY: yPosition,
    head: [['Fecha', 'Rutina', 'Ejercicio', 'Grupo', 'Serie', 'Reps', 'Peso', 'Vol.', '✓']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: emerald,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      textColor: slate,
      fontSize: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
      8: { cellWidth: 10 }
    },
    margin: { left: 15, right: 15 }
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.setLineWidth(0.3);
    doc.line(15, 285, 195, 285);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Generado por GYM TRACKER PRO', 105, 290, { align: 'center' });
    doc.text(`Página ${i} de ${pageCount}`, 195, 290, { align: 'right' });
  }

  return doc;
}

/**
 * Descarga un archivo con el contenido especificado
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera un nombre de archivo con fecha actual
 */
export function generateFilename(format: 'csv' | 'pdf'): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `gym-tracker-${dateStr}.${format}`;
}
