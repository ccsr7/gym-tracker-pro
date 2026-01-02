const https = require('https');
const fs = require('fs');
const path = require('path');

// URL del JSON público
const EXERCISES_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

// Mapeo de primaryMuscles a categorías en español
const MUSCLE_TO_CATEGORY = {
  'abdominals': 'Core',
  'abductors': 'Piernas',
  'adductors': 'Piernas',
  'biceps': 'Brazos',
  'calves': 'Piernas',
  'chest': 'Pecho',
  'forearms': 'Brazos',
  'glutes': 'Piernas',
  'hamstrings': 'Piernas',
  'lats': 'Espalda',
  'lower back': 'Espalda',
  'middle back': 'Espalda',
  'neck': 'Hombros',
  'quadriceps': 'Piernas',
  'shoulders': 'Hombros',
  'traps': 'Espalda',
  'triceps': 'Brazos',
};

// Mapeo de equipment a español
const EQUIPMENT_MAP = {
  'barbell': 'Barra',
  'dumbbell': 'Mancuernas',
  'body only': 'Peso Corporal',
  'cable': 'Polea',
  'machine': 'Máquina',
  'kettlebells': 'Kettlebell',
  'bands': 'Bandas',
  'medicine ball': 'Balón Medicinal',
  'exercise ball': 'Fitball',
  'foam roll': 'Rodillo de Espuma',
  'e-z curl bar': 'Barra Z',
  'other': 'Otro',
  null: 'Peso Corporal'
};

// Función para normalizar nombres y detectar duplicados
function normalizeExerciseName(name) {
  return name
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

// Función para generar ID único
function generateId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}

// Descargar JSON
function downloadJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Leer ejercicios actuales
function readCurrentExercises() {
  const exercisesPath = path.join(__dirname, '..', 'src', 'data', 'exercises.ts');
  const content = fs.readFileSync(exercisesPath, 'utf-8');

  // Extraer nombres de ejercicios existentes
  const nameMatches = content.matchAll(/name:\s*'([^']+)'/g);
  const existingNames = new Set();

  for (const match of nameMatches) {
    existingNames.add(normalizeExerciseName(match[1]));
  }

  return existingNames;
}

// Procesar ejercicios
async function main() {
  console.log('🏋️  Descargando ejercicios desde GitHub...');
  const exercises = await downloadJSON(EXERCISES_URL);
  console.log(`✅ Descargados ${exercises.length} ejercicios`);

  console.log('\n📋 Leyendo ejercicios actuales...');
  const existingNames = readCurrentExercises();
  console.log(`✅ Encontrados ${existingNames.size} ejercicios existentes`);

  console.log('\n🔍 Filtrando duplicados y convirtiendo formato...');

  const newExercises = [];
  const skippedDuplicates = [];
  const skippedNoCategory = [];

  for (const ex of exercises) {
    const normalizedName = normalizeExerciseName(ex.name);

    // Verificar duplicado
    if (existingNames.has(normalizedName)) {
      skippedDuplicates.push(ex.name);
      continue;
    }

    // Obtener categoría
    const primaryMuscle = ex.primaryMuscles && ex.primaryMuscles[0];
    const category = primaryMuscle ? MUSCLE_TO_CATEGORY[primaryMuscle.toLowerCase()] : null;

    if (!category) {
      skippedNoCategory.push(ex.name);
      continue;
    }

    // Obtener grupo muscular más específico
    const muscleGroup = ex.primaryMuscles ?
      ex.primaryMuscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') :
      category;

    // Obtener equipamiento
    const equipment = EQUIPMENT_MAP[ex.equipment] || 'Otro';

    // Crear ejercicio en formato de tu BD
    const newExercise = {
      id: generateId(ex.name),
      name: ex.name,
      category: category,
      muscleGroup: muscleGroup,
      equipment: equipment,
      image: `/exercises/placeholder.jpg`,
    };

    newExercises.push(newExercise);
    existingNames.add(normalizedName); // Evitar duplicados dentro de la nueva lista
  }

  console.log(`\n📊 Resultados:`);
  console.log(`   ✅ Ejercicios nuevos a agregar: ${newExercises.length}`);
  console.log(`   ⏭️  Duplicados omitidos: ${skippedDuplicates.length}`);
  console.log(`   ❌ Sin categoría omitidos: ${skippedNoCategory.length}`);

  // Agrupar por categoría para mejor legibilidad
  const byCategory = newExercises.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  console.log(`\n📁 Distribución por categoría:`);
  Object.entries(byCategory).forEach(([cat, exs]) => {
    console.log(`   ${cat}: ${exs.length} ejercicios`);
  });

  // Generar código TypeScript
  console.log('\n📝 Generando código TypeScript...');

  let tsCode = '\n  // ========================================\n';
  tsCode += '  // EJERCICIOS IMPORTADOS AUTOMÁTICAMENTE\n';
  tsCode += '  // ========================================\n\n';

  for (const [category, exercises] of Object.entries(byCategory)) {
    tsCode += `  // ${category.toUpperCase()}\n`;
    for (const ex of exercises) {
      tsCode += `  {\n`;
      tsCode += `    id: '${ex.id}',\n`;
      tsCode += `    name: '${ex.name}',\n`;
      tsCode += `    category: '${ex.category}',\n`;
      tsCode += `    muscleGroup: '${ex.muscleGroup}',\n`;
      tsCode += `    equipment: '${ex.equipment}',\n`;
      tsCode += `    image: '${ex.image}',\n`;
      tsCode += `  },\n`;
    }
    tsCode += '\n';
  }

  // Guardar en archivo temporal
  const outputPath = path.join(__dirname, 'new-exercises.txt');
  fs.writeFileSync(outputPath, tsCode, 'utf-8');

  console.log(`\n✅ Código generado en: ${outputPath}`);
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Revisa el archivo new-exercises.txt');
  console.log('   2. Copia el contenido al final del array en src/data/exercises.ts');
  console.log('   3. Asegúrate de mantener la coma después del último ejercicio existente');
  console.log('   4. Ejecuta npm run build para verificar');

  console.log(`\n🎉 Total de ${newExercises.length} nuevos ejercicios listos para agregar!`);
}

main().catch(console.error);
