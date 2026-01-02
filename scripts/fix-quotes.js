const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'exercises.ts');

console.log('📖 Leyendo archivo...');
let content = fs.readFileSync(file, 'utf-8');

console.log('🔧 Corrigiendo caracteres especiales...');

// Reemplazar todos los tipos de apóstrofes y comillas usando Unicode
const replacements = [
  // Apóstrofes curvos
  { from: '\u2019', to: "'", name: 'Right Single Quotation Mark (U+2019)' },
  { from: '\u2018', to: "'", name: 'Left Single Quotation Mark (U+2018)' },
  { from: '\u201A', to: "'", name: 'Single Low-9 Quotation Mark (U+201A)' },
  { from: '\u201B', to: "'", name: 'Single High-Reversed-9 Quotation Mark (U+201B)' },
  // Comillas curvadas
  { from: '\u201C', to: '"', name: 'Left Double Quotation Mark (U+201C)' },
  { from: '\u201D', to: '"', name: 'Right Double Quotation Mark (U+201D)' },
  { from: '\u201E', to: '"', name: 'Double Low-9 Quotation Mark (U+201E)' },
  { from: '\u201F', to: '"', name: 'Double High-Reversed-9 Quotation Mark (U+201F)' },
];

let totalReplacements = 0;

for (const {from, to, name} of replacements) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const count = (content.match(regex) || []).length;
  if (count > 0) {
    console.log(`   Reemplazando ${count} ocurrencias de ${name}`);
    content = content.replace(regex, to);
    totalReplacements += count;
  }
}

console.log(`\n✅ Total de caracteres corregidos: ${totalReplacements}`);

console.log('💾 Guardando archivo...');
fs.writeFileSync(file, content, 'utf-8');

console.log('✅ Archivo corregido exitosamente!');
