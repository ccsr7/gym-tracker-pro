const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'exercises.ts');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(file, 'utf-8');

console.log('🔧 Escapando apóstrofes en strings...');

// Buscar todos los name: '...' y escapar apóstrofes internos
let fixCount = 0;

// Regex para encontrar name: 'texto con potencial apostrofe'
content = content.replace(/name:\s*'([^']*'[^']*)',/g, (match, nameContent) => {
  // Hay un apóstrofe dentro del string
  fixCount++;
  // Usar comillas dobles en lugar de simples
  return `name: "${nameContent}",`;
});

console.log(`✅ ${fixCount} nombres con apóstrofes corregidos`);

console.log('💾 Guardando archivo...');
fs.writeFileSync(file, content, 'utf-8');

console.log('✅ Archivo corregido exitosamente!');
