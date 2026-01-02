const fs = require('fs');
const path = require('path');

const exercisesPath = path.join(__dirname, '..', 'src', 'data', 'exercises.ts');
const newExercisesPath = path.join(__dirname, 'new-exercises.txt');

console.log('📖 Leyendo archivos...');
let content = fs.readFileSync(exercisesPath, 'utf-8');
const newExercises = fs.readFileSync(newExercisesPath, 'utf-8');

console.log('🔍 Buscando punto de inserción...');

// Probar varios patrones (Unix y Windows)
const patterns = [
  '];\r\n\r\nexport const',  // Windows (CRLF)
  '];\n\nexport const',       // Unix (LF)
  '];\r\nexport const',       // Windows single line
  '];\nexport const',         // Unix single line
];

let insertPoint = -1;
let patternUsed = '';

for (const pattern of patterns) {
  insertPoint = content.indexOf(pattern);
  if (insertPoint !== -1) {
    patternUsed = pattern.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    console.log(`✅ Encontrado con patrón: "${patternUsed}"`);
    break;
  }
}

if (insertPoint === -1) {
  console.error('❌ No se pudo encontrar ningún punto de inserción');
  console.error('Patrones probados:', patterns.map(p => `"${p.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`).join(', '));
  process.exit(1);
}

console.log('✂️  Insertando nuevos ejercicios...');
const before = content.substring(0, insertPoint);
const after = content.substring(insertPoint);
const updated = before + newExercises + after;

console.log('💾 Guardando archivo actualizado...');
fs.writeFileSync(exercisesPath, updated, 'utf-8');

const exerciseCount = (newExercises.match(/\{/g) || []).length;
console.log(`✅ ${exerciseCount} ejercicios agregados exitosamente!`);

console.log('\n📊 Resumen:');
console.log(`   Archivo: ${exercisesPath}`);
console.log(`   Tamaño antes: ${content.length} caracteres`);
console.log(`   Tamaño después: ${updated.length} caracteres`);
console.log(`   Diferencia: +${updated.length - content.length} caracteres`);
