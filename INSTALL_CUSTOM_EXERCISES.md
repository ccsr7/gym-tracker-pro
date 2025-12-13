# Instalación del Sistema de Ejercicios Personalizados

## Pasos para habilitar ejercicios personalizados

### 1. Ejecutar la migración SQL en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/ymuqlopycwdqrrmaaaoa
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega todo el contenido del archivo `migrations/create-custom-exercises-table.sql`
5. Ejecuta la query (botón "Run" o Ctrl+Enter)

### 2. Verificar la instalación

Después de ejecutar la migración, verifica que:

- ✅ Tabla `custom_exercises` creada
- ✅ Índices creados (`idx_custom_exercises_user_id`, `idx_custom_exercises_category`)
- ✅ RLS policies configuradas (4 policies)
- ✅ Bucket de Storage `custom-exercises` creado
- ✅ Storage policies configuradas (4 policies)

### 3. Usar el sistema

Una vez ejecutada la migración, las funcionalidades estarán disponibles:

#### Crear ejercicio personalizado:
1. Inicia sesión en la app
2. Ve a la página "Biblioteca"
3. Haz clic en el botón verde "Crear Ejercicio" (arriba a la derecha)
4. Llena el formulario:
   - **Nombre** (obligatorio): Ej. "Press de Banca con Pausa"
   - **Categoría** (obligatorio): Selecciona de la lista
   - **Grupo Muscular** (obligatorio): Ej. "Pectoral"
   - **Equipamiento** (obligatorio): Selecciona de la lista
   - **Dificultad** (opcional): Principiante/Intermedio/Avanzado
   - **Imagen** (opcional): Sube una imagen (max 5MB)
   - **Instrucciones** (opcional): Escribe cada paso en una línea nueva
   - **Tips de Forma** (opcional): Escribe cada tip en una línea nueva
   - **Músculos Principales** (opcional): Separados por comas
   - **Músculos Secundarios** (opcional): Separados por comas
5. Haz clic en "Crear Ejercicio"

#### Ver tus ejercicios personalizados:
1. En "Biblioteca", haz clic en la pestaña "Mis Ejercicios"
2. Verás solo tus ejercicios personalizados con un badge verde "Custom"

#### Ver todos los ejercicios (predefinidos + custom):
1. En "Biblioteca", haz clic en la pestaña "Todos"
2. Verás 121 ejercicios predefinidos + tus ejercicios personalizados

#### Eliminar ejercicio personalizado:
1. Localiza el ejercicio con badge verde "Custom"
2. Haz clic en el ícono de basura (🗑️) en la esquina inferior derecha
3. Confirma la eliminación
4. El ejercicio y su imagen se eliminarán permanentemente

#### Ver detalles de ejercicio personalizado:
1. Haz clic en cualquier card de ejercicio (predefinido o custom)
2. Se abrirá el modal de detalles con toda la información
3. Para ejercicios custom, verás los datos que ingresaste

## Características de Seguridad

- ✅ **RLS (Row Level Security)**: Cada usuario solo puede ver, crear, editar y eliminar sus propios ejercicios
- ✅ **Validación de imágenes**: Solo se permiten imágenes (JPG, PNG, GIF) de máximo 5MB
- ✅ **Storage seguro**: Las imágenes se organizan por usuario (`custom-exercises/{user_id}/{timestamp}.{ext}`)
- ✅ **Eliminación en cascada**: Si eliminas un ejercicio, su imagen también se elimina automáticamente

## Troubleshooting

### Error: "No se puede crear el ejercicio"
- Verifica que hayas ejecutado la migración SQL
- Asegúrate de estar autenticado (iniciado sesión)
- Revisa que todos los campos obligatorios estén llenos

### Error: "Error al subir la imagen"
- Verifica que la imagen sea menor a 5MB
- Asegúrate de que sea un formato válido (JPG, PNG, GIF)
- Verifica que el bucket `custom-exercises` exista en Storage

### No veo el botón "Crear Ejercicio"
- Debes estar autenticado (iniciado sesión)
- El botón solo aparece para usuarios registrados

### Mis ejercicios custom no aparecen
- Verifica que la tabla `custom_exercises` exista
- Asegúrate de que las RLS policies estén activas
- Revisa la consola del navegador para errores

## Estructura de la Base de Datos

```sql
custom_exercises
├── id (UUID, primary key)
├── user_id (UUID, foreign key -> auth.users)
├── name (TEXT, required)
├── category (TEXT, required)
├── muscle_group (TEXT, required)
├── equipment (TEXT, required)
├── difficulty (TEXT, optional: 'Principiante' | 'Intermedio' | 'Avanzado')
├── instructions (JSONB, array of strings)
├── form_tips (JSONB, array of strings)
├── primary_muscles (JSONB, array of strings)
├── secondary_muscles (JSONB, array of strings)
├── variations (JSONB, array of exercise IDs)
├── image_url (TEXT, optional)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP, auto-updated)
```

## Notas

- Los ejercicios predefinidos (121 en total) siguen funcionando igual
- Los ejercicios personalizados se mezclan con los predefinidos en la vista "Todos"
- Los favoritos funcionan tanto con ejercicios predefinidos como personalizados
- El modal de detalles funciona igual para ambos tipos de ejercicios
- Los IDs de ejercicios personalizados tienen el prefijo `custom-` para distinguirlos
