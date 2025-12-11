# 🧹 Configuración de Auto-Limpieza para Cuenta Demo

## Problema Detectado

La cuenta demo (`demo@gym.com`) acumula datos de usuarios previos (rutinas, workouts) que no deberían estar ahí. Esto confunde a nuevos usuarios que prueban la app.

## Solución Implementada

Sistema de auto-limpieza que elimina datos de la cuenta demo cada 7 días cuando alguien hace login.

---

## 📋 Instrucciones de Configuración

### Opción 1: Limpieza al Login (RECOMENDADO ✅)

**Ventajas:**
- ✅ Limpia automáticamente cuando alguien usa la cuenta
- ✅ No requiere cron jobs ni extensiones especiales
- ✅ Funciona en Free Tier de Supabase
- ✅ Ya integrado con el frontend

**Pasos:**

1. **Ejecuta el script SQL:**
   - Abre: https://app.supabase.com/project/ymuqlopycwdqrrmaaaoa/sql/new
   - Copia y pega TODO el contenido de: [`demo-cleanup-on-login.sql`](demo-cleanup-on-login.sql)
   - Click "Run"

2. **Deploy del frontend:**
   ```bash
   git add .
   git commit -m "Add demo account auto-cleanup on login"
   git push
   ```

3. **Verificar que funciona:**
   - Haz login en `demo@gym.com`
   - Revisa la consola del navegador (F12)
   - Deberías ver logs como:
     ```
     [Auth] Checking if demo account needs cleanup...
     [Auth] Demo account cleaned: { workouts: X, routines: Y }
     ```

**¿Cómo funciona?**
- Al hacer login con `demo@gym.com`, verifica si pasaron 7+ días desde la última limpieza
- Si sí → Elimina todos los workouts y rutinas, resetea el perfil
- Si no → No hace nada (deja los datos intactos)

---

### Opción 2: Limpieza con Cron Job (Solo Pro Plan)

**Ventajas:**
- Limpia automáticamente cada domingo a las 3:00 AM
- No depende de que alguien haga login

**Desventajas:**
- ❌ Requiere Supabase Pro Plan ($25/mes)
- ❌ Necesita extensión `pg_cron`

**Pasos:**

1. Verifica tu plan de Supabase (debe ser Pro o superior)

2. Ejecuta: [`setup-demo-account-auto-cleanup.sql`](setup-demo-account-auto-cleanup.sql)

3. Verifica el cron job:
   ```sql
   SELECT * FROM cron.job;
   ```

---

### Opción 3: Limpieza con Trigger (Automático al crear workout)

**Ventajas:**
- Se limpia automáticamente cuando alguien agrega un workout
- No requiere Pro Plan

**Pasos:**

1. Ejecuta: [`demo-account-cleanup-simple.sql`](demo-account-cleanup-simple.sql)

2. La limpieza ocurre automáticamente cuando:
   - Un usuario crea un workout en la cuenta demo
   - Y hay workouts de más de 7 días

---

## 🧪 Testing Manual

### Probar la limpieza ahora (sin esperar 7 días)

```sql
-- 1. Forzar que la limpieza sea necesaria
UPDATE demo_last_cleanup
SET last_cleaned_at = NOW() - INTERVAL '8 days'
WHERE id = 1;

-- 2. Ejecutar limpieza manualmente
SELECT * FROM cleanup_demo_account_smart();

-- 3. Verificar resultado
SELECT
  last_cleaned_at,
  EXTRACT(DAY FROM (NOW() - last_cleaned_at)) as dias_desde_limpieza
FROM demo_last_cleanup;
```

### Ver datos actuales de la cuenta demo

```sql
SELECT
  (SELECT COUNT(*) FROM workouts WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as workouts,
  (SELECT COUNT(*) FROM routines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')) as rutinas,
  (SELECT last_cleaned_at FROM demo_last_cleanup WHERE id = 1) as ultima_limpieza;
```

### Limpiar manualmente la cuenta demo ahora

```sql
-- Opción A: Respetando el límite de 7 días
SELECT * FROM cleanup_demo_account_smart();

-- Opción B: Forzar limpieza inmediata (ignorar 7 días)
DO $$
DECLARE demo_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@gym.com';
  DELETE FROM public.workouts WHERE user_id = demo_user_id;
  DELETE FROM public.routines WHERE user_id = demo_user_id;
  UPDATE public.profiles SET weight = 70, height = 175, training_goal = 'strength' WHERE id = demo_user_id;
  UPDATE demo_last_cleanup SET last_cleaned_at = NOW() WHERE id = 1;
END $$;
```

---

## 📊 Monitoreo

### Ver historial de limpieza

```sql
-- Si usaste la Opción 2 (cron):
SELECT * FROM demo_cleanup_log
ORDER BY cleaned_at DESC
LIMIT 10;

-- Si usaste la Opción 1 (login):
SELECT
  last_cleaned_at,
  NOW() - last_cleaned_at as tiempo_desde_limpieza,
  should_cleanup_demo() as necesita_limpieza_ahora
FROM demo_last_cleanup;
```

### Ver workouts de la cuenta demo

```sql
SELECT
  w.id,
  w.date,
  r.name as routine_name,
  w.created_at,
  EXTRACT(DAY FROM (NOW() - w.created_at)) as dias_antiguedad
FROM workouts w
LEFT JOIN routines r ON w.routine_id = r.id
WHERE w.user_id = (SELECT id FROM auth.users WHERE email = 'demo@gym.com')
ORDER BY w.date DESC;
```

---

## 🔧 Troubleshooting

### La limpieza no se ejecuta

1. **Verifica que la función existe:**
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name = 'cleanup_demo_account_smart';
   ```

2. **Verifica que el usuario demo existe:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'demo@gym.com';
   ```

3. **Verifica la tabla de tracking:**
   ```sql
   SELECT * FROM demo_last_cleanup;
   ```

4. **Revisa logs del frontend:**
   - Abre consola (F12)
   - Haz login con demo@gym.com
   - Busca mensajes `[Auth]` relacionados con cleanup

### Error: "function cleanup_demo_account_smart does not exist"

Ejecuta el script [`demo-cleanup-on-login.sql`](demo-cleanup-on-login.sql) de nuevo.

### La limpieza se ejecuta pero los datos siguen ahí

1. Verifica que el frontend está actualizado:
   ```bash
   git log --oneline -1  # Debe mostrar el commit de cleanup
   ```

2. Limpia cache del navegador (Ctrl + Shift + Delete)

3. Verifica localStorage:
   ```javascript
   // En consola del navegador:
   localStorage.getItem('gym-tracker-routines');
   localStorage.getItem('gym-tracker-workouts');
   ```

---

## 📝 Notas Importantes

- ✅ **La limpieza es segura:** Solo afecta a `demo@gym.com`, nunca a otros usuarios
- ✅ **No interrumpe el login:** Si la limpieza falla, el login continúa normalmente
- ✅ **Configurable:** Puedes cambiar el período de 7 días modificando `INTERVAL '7 days'` en el SQL
- ✅ **Logs incluidos:** Puedes ver cuándo y qué se limpió

---

## 🎯 Recomendación

**Usa la Opción 1 (Limpieza al Login)** porque:
- No requiere configuración adicional
- Funciona en Free Tier
- Ya está integrada con el código del frontend
- Es más confiable (se ejecuta cuando realmente importa)

Solo ejecuta [`demo-cleanup-on-login.sql`](demo-cleanup-on-login.sql) y estás listo ✅
