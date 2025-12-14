# Instalación del Sistema de Compartir Rutinas

## Problema Identificado

El sistema de exportación/importación de rutinas no funciona entre diferentes usuarios porque la tabla `shared_routine_codes` no está creada en Supabase o tiene errores.

## Solución

Ejecutar la migración SQL corregida en Supabase para crear la tabla y habilitar el compartir rutinas globalmente.

---

## 📋 Pasos de Instalación

### 1. Acceder a Supabase SQL Editor

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/ymuqlopycwdqrrmaaaoa
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New query** para crear una nueva consulta

### 2. Ejecutar la Migración

1. Abre el archivo `migrations/shared-routine-codes-fixed.sql`
2. Copia **todo** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

### 3. Verificar la Instalación

Después de ejecutar la migración, deberías ver:

```
✓ Tabla shared_routine_codes creada exitosamente
```

Si ves este mensaje, la instalación fue exitosa. Si hay errores, revisa la sección de Troubleshooting más abajo.

### 4. Verificar la Tabla en Supabase

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver la tabla `shared_routine_codes`
3. Haz clic en ella para verificar su estructura:
   - `id` (UUID, Primary Key)
   - `code` (Text, Unique)
   - `routine_data` (JSONB)
   - `created_by_user_id` (UUID, Foreign Key)
   - `created_at` (Timestamptz)
   - `expires_at` (Timestamptz)
   - `usage_count` (Integer)
   - `version` (Text)

---

## 🎯 Cómo Funciona el Sistema

### Exportar Rutinas

1. **Usuario A** (creador):
   - Va a Rutinas → Botón con 3 puntos → "Importar/Exportar"
   - Selecciona las rutinas que quiere compartir
   - Hace clic en "Generar Código"
   - El sistema crea un código de 8 caracteres (ej: `A3F7B2D1`)
   - Este código se guarda en Supabase y funciona globalmente

2. **Compartir el código**:
   - El Usuario A copia el código y se lo envía al Usuario B por WhatsApp, email, etc.

### Importar Rutinas

3. **Usuario B** (receptor):
   - Va a Rutinas → Botón con 3 puntos → "Importar/Exportar"
   - Cambia a la pestaña "Importar"
   - Pega el código que recibió (ej: `A3F7B2D1`)
   - Hace clic en "Importar Rutinas"
   - El sistema descarga las rutinas desde Supabase
   - Las rutinas se agregan a su cuenta

---

## 🔒 Características de Seguridad

### Row Level Security (RLS)

La tabla tiene 4 políticas de seguridad:

1. **"Anyone can read valid codes"**
   - Cualquier persona puede leer códigos que no hayan expirado
   - Esto permite importar rutinas sin estar autenticado
   - Solo se pueden leer códigos válidos (< 15 días)

2. **"Authenticated users can create codes"**
   - Solo usuarios autenticados pueden crear códigos
   - El `created_by_user_id` debe coincidir con el usuario actual
   - Previene creación de códigos anónimos

3. **"Users can delete own codes"**
   - Los usuarios solo pueden eliminar sus propios códigos
   - Previene que otros borren códigos ajenos

4. **"System can update usage count"**
   - El sistema puede incrementar el contador de uso
   - Se ejecuta automáticamente cada vez que alguien importa

### Expiración Automática

- Los códigos expiran después de **15 días**
- Los códigos expirados no se pueden usar para importar
- Existe una función `cleanup_expired_codes()` para limpiar la base de datos

---

## 🧪 Probar el Sistema

### Prueba Básica (Usuario Único)

1. Crea una rutina de prueba en tu cuenta
2. Ve a Rutinas → Importar/Exportar
3. Selecciona la rutina
4. Genera un código
5. En la pestaña Importar, pega el mismo código
6. Verifica que se importe correctamente (con IDs diferentes)

### Prueba Completa (Entre Usuarios)

1. **Usuario A**:
   - Crea varias rutinas (Lunes, Martes, etc.)
   - Exporta las rutinas y genera código
   - Copia el código (ej: `A3F7B2D1`)

2. **Usuario B** (en otro navegador/dispositivo):
   - Crea una cuenta diferente
   - Va a Rutinas → Importar/Exportar
   - Pega el código de Usuario A
   - Importa las rutinas
   - Verifica que aparezcan todas las rutinas con los ejercicios correctos

---

## 🐛 Troubleshooting

### Error: "relation 'public.profiles' does not exist"

**Causa**: La migración antigua hacía referencia a `profiles` en lugar de `auth.users`

**Solución**: Usa la migración corregida `migrations/shared-routine-codes-fixed.sql` que ya tiene la referencia correcta a `auth.users`

### Error: "Code not found" al importar

**Posibles causas**:

1. **La tabla no existe**: Ejecuta la migración
2. **El código está mal escrito**: Verifica que sea exactamente 8 caracteres
3. **El código expiró**: Los códigos expiran en 15 días
4. **RLS bloqueando la lectura**: Verifica que la política "Anyone can read valid codes" esté activa

**Verificación**:
```sql
-- En Supabase SQL Editor, ejecuta:
SELECT * FROM public.shared_routine_codes;
```

### Error: "Error creating code"

**Posibles causas**:

1. **No estás autenticado**: Inicia sesión primero
2. **La tabla no existe**: Ejecuta la migración
3. **RLS bloqueando la inserción**: Verifica que la política "Authenticated users can create codes" esté activa

**Verificación**:
```sql
-- Verifica las políticas:
SELECT * FROM pg_policies WHERE tablename = 'shared_routine_codes';
```

### El código se genera pero no funciona en otro usuario

**Posibles causas**:

1. **El código se guardó en localStorage**: Verifica en la consola del navegador si dice "Using localStorage fallback"
2. **La tabla existe pero RLS está bloqueando**: Verifica las políticas
3. **El código se escribió mal**: Los códigos son case-insensitive, pero deben ser exactos

**Solución**:
- Asegúrate de que la migración se ejecutó correctamente
- Verifica que el código se guardó en Supabase con:
```sql
SELECT code, created_at, expires_at, usage_count
FROM public.shared_routine_codes
ORDER BY created_at DESC
LIMIT 5;
```

### Error: "Código inválido"

**Posibles causas**:

1. **El código es muy corto/largo**: Debe ser exactamente 8 caracteres
2. **El formato es incorrecto**: Solo alfanuméricos
3. **El código expiró**: Verifica la fecha de expiración

**Verificación**:
```sql
-- Busca un código específico:
SELECT * FROM public.shared_routine_codes WHERE code = 'TU_CODIGO';
```

---

## 📊 Monitoreo y Estadísticas

### Ver todos los códigos activos

```sql
SELECT
  code,
  created_at,
  expires_at,
  usage_count,
  (routine_data->>'routines')::jsonb AS routines_summary
FROM public.shared_routine_codes
WHERE expires_at > NOW()
ORDER BY created_at DESC;
```

### Ver códigos más usados

```sql
SELECT
  code,
  usage_count,
  created_at,
  expires_at
FROM public.shared_routine_codes
WHERE expires_at > NOW()
ORDER BY usage_count DESC
LIMIT 10;
```

### Limpiar códigos expirados manualmente

```sql
-- Ejecuta la función de limpieza:
SELECT cleanup_expired_codes();

-- O elimina directamente:
DELETE FROM public.shared_routine_codes
WHERE expires_at < NOW();
```

---

## 🔧 Mantenimiento

### Limpieza Automática de Códigos Expirados

**Opción 1: Supabase Edge Function** (Recomendado)

1. Crea una Edge Function que ejecute `cleanup_expired_codes()`
2. Configura un cron job para ejecutarla diariamente

**Opción 2: Manual**

1. Ve a SQL Editor en Supabase
2. Ejecuta:
```sql
SELECT cleanup_expired_codes();
```

### Cambiar Tiempo de Expiración

Por defecto, los códigos expiran en 15 días. Para cambiar esto:

```sql
-- Cambiar a 30 días para nuevos códigos:
ALTER TABLE public.shared_routine_codes
ALTER COLUMN expires_at
SET DEFAULT (NOW() + INTERVAL '30 days');

-- Para códigos existentes (extender 30 días más):
UPDATE public.shared_routine_codes
SET expires_at = NOW() + INTERVAL '30 days'
WHERE expires_at > NOW();
```

---

## ✅ Checklist de Instalación

- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar que la tabla `shared_routine_codes` existe
- [ ] Verificar que las 4 políticas RLS están activas
- [ ] Probar exportar una rutina (debe generar código de 8 caracteres)
- [ ] Probar importar con el mismo código (debe funcionar)
- [ ] Probar importar desde otro usuario/dispositivo
- [ ] Verificar que el contador `usage_count` se incrementa

---

## 🎉 Una vez instalado...

El sistema debería funcionar así:

1. **Generar código**: Usuario A exporta rutinas → Código de 8 caracteres
2. **Compartir**: Usuario A envía código a Usuario B
3. **Importar**: Usuario B pega código → Rutinas importadas
4. **Rastreo**: El sistema incrementa `usage_count` automáticamente
5. **Expiración**: Después de 15 días, el código deja de funcionar

---

## 📞 Soporte

Si después de seguir estos pasos el sistema sigue sin funcionar:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña Console
3. Busca mensajes que empiecen con `[ExportCode]`
4. Copia los mensajes de error y compártelos

Los logs más útiles son:
- `[ExportCode] Code created successfully: XXXXXXXX`
- `[ExportCode] Routine data fetched successfully`
- `[ExportCode] Error creating code:` (indica problema)
- `[ExportCode] Code not found:` (indica problema)
