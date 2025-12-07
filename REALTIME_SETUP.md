# Configuración de Supabase Realtime

Este documento explica cómo habilitar y usar la sincronización en tiempo real en Gym Tracker Pro.

## ¿Qué es Supabase Realtime?

Supabase Realtime permite que tu aplicación reciba actualizaciones automáticas cuando los datos cambian en la base de datos. Esto significa que si un usuario actualiza sus rutinas en un dispositivo, los cambios aparecerán automáticamente en todos sus otros dispositivos sin necesidad de recargar la página.

## Paso 1: Habilitar Realtime en Supabase

1. Abre tu proyecto de Supabase en [https://app.supabase.com](https://app.supabase.com)
2. Ve a la sección **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-realtime.sql`
4. Ejecuta el script haciendo clic en "Run"

Esto habilitará Realtime en las siguientes tablas:
- `profiles`
- `routines`
- `workouts`
- `rest_days`
- `achievements`
- `workout_sessions`

## Paso 2: Verificar que Realtime está habilitado

Ejecuta esta consulta en el SQL Editor para verificar:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Deberías ver todas las tablas mencionadas arriba en los resultados.

## Cómo funciona en la aplicación

### Componentes con Realtime habilitado

1. **Página de Rutinas** (`/routines`)
   - Se actualiza automáticamente cuando se crean, editan o eliminan rutinas
   - Funciona en todos los dispositivos conectados a la misma cuenta

2. **Página de Perfil** (`/profile`)
   - Las estadísticas de entrenamientos se actualizan en tiempo real
   - El historial se refresca cuando se completan nuevos workouts

### Hook personalizado

La aplicación usa el hook `useRealtimeSubscription` para manejar las suscripciones:

```typescript
useRealtimeSubscription({
  table: 'routines',
  event: '*',
  filter: `user_id=eq.${userId}`,
  enabled: !!userId,
  onChange: (payload) => {
    console.log('Change detected:', payload);
    // Recargar datos
  },
});
```

## Eventos soportados

El hook detecta los siguientes tipos de eventos:

- `INSERT`: Cuando se crea un nuevo registro
- `UPDATE`: Cuando se actualiza un registro existente
- `DELETE`: Cuando se elimina un registro
- `*`: Todos los eventos (recomendado)

## Seguridad

- Solo los usuarios autenticados pueden suscribirse a cambios
- Las políticas RLS (Row Level Security) garantizan que cada usuario solo vea sus propios datos
- Los filtros por `user_id` aseguran que solo recibas notificaciones de tus propios datos

## Logs de depuración

La aplicación registra eventos de Realtime en la consola del navegador:

```
[Realtime] Subscription status for routines: subscribed
[Routines] Realtime change detected: INSERT
[Profile] Workouts changed: UPDATE
```

## Desactivar Realtime temporalmente

Si necesitas desactivar Realtime temporalmente (por ejemplo, para depuración), simplemente establece `enabled: false` en el hook:

```typescript
useRealtimeSubscription({
  // ... otras opciones
  enabled: false, // Desactiva Realtime
});
```

## Solución de problemas

### Los cambios no se sincronizan

1. Verifica que Realtime esté habilitado en Supabase (ejecuta el script SQL)
2. Comprueba que estás autenticado (debes tener un `userId`)
3. Revisa la consola del navegador para ver los logs de Realtime
4. Asegúrate de que las políticas RLS están configuradas correctamente

### Múltiples recargas

Si notas que la aplicación recarga datos múltiples veces:
- Es normal cuando hay muchos dispositivos conectados
- Los hooks están optimizados para evitar llamadas innecesarias

## Próximos pasos

En futuras versiones se puede agregar Realtime a:
- Página de historial de entrenamientos
- Página de logros/achievements
- Sesiones de entrenamiento en vivo (para entrenadores/clientes)

## Recursos adicionales

- [Documentación oficial de Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
