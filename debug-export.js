// ============================================
// SCRIPT DE DIAGNÓSTICO - EXPORT/IMPORT
// ============================================
// Copia y pega este script en la consola del navegador (F12)
// mientras estás en la app para diagnosticar el problema

console.log('🔍 ===== DIAGNÓSTICO DE EXPORTACIÓN =====');

// 1. Verificar autenticación
console.log('\n📝 1. VERIFICANDO AUTENTICACIÓN...');
const authData = localStorage.getItem('gym-tracker-auth');
if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('✅ Auth data encontrado:', {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name
    });
  } catch (e) {
    console.error('❌ Error al parsear auth data:', e);
  }
} else {
  console.log('❌ No hay datos de autenticación en localStorage');
}

// 2. Verificar rutinas en localStorage
console.log('\n📝 2. VERIFICANDO RUTINAS...');
const routines = localStorage.getItem('gym-tracker-routines');
if (routines) {
  try {
    const parsed = JSON.parse(routines);
    console.log(`✅ Se encontraron ${parsed.length} rutinas:`,
      parsed.map(r => ({ id: r.id, name: r.name, day: r.day, exercises: r.exercises?.length || 0 }))
    );
  } catch (e) {
    console.error('❌ Error al parsear rutinas:', e);
  }
} else {
  console.log('❌ No hay rutinas en localStorage');
}

// 3. Verificar códigos de exportación en localStorage (método antiguo)
console.log('\n📝 3. VERIFICANDO CÓDIGOS LOCALES...');
let localCodes = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('gym-export-')) {
    localCodes.push(key);
  }
}
if (localCodes.length > 0) {
  console.log(`✅ Se encontraron ${localCodes.length} códigos en localStorage:`, localCodes);
} else {
  console.log('ℹ️  No hay códigos en localStorage (esto es normal con Supabase)');
}

// 4. Test de Supabase auth
console.log('\n📝 4. VERIFICANDO SUPABASE AUTH...');
console.log('Ejecuta este comando para verificar la sesión de Supabase:');
console.log(`
// Copia y pega esto en la consola:
(async () => {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    '${process.env.NEXT_PUBLIC_SUPABASE_URL || 'REEMPLAZAR_CON_TU_URL'}',
    '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REEMPLAZAR_CON_TU_KEY'}'
  );
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('❌ Error de Supabase Auth:', error);
  } else if (data.user) {
    console.log('✅ Usuario de Supabase:', {
      id: data.user.id,
      email: data.user.email,
      confirmed: data.user.email_confirmed_at !== null
    });
  } else {
    console.log('❌ No hay sesión activa en Supabase');
  }
})();
`);

// 5. Resumen
console.log('\n📋 ===== RESUMEN =====');
console.log('Para completar el diagnóstico:');
console.log('1. Verifica los resultados arriba');
console.log('2. Ejecuta el comando de Supabase Auth (paso 4)');
console.log('3. Intenta generar un código de exportación');
console.log('4. Copia TODOS los logs que aparezcan (incluyendo [ExportCode] y [RoutineImportExport])');
console.log('5. Verifica en Supabase si el código se guardó:');
console.log('   https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/editor');
console.log('   SELECT * FROM shared_routine_codes ORDER BY created_at DESC;');
