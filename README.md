# Gym Tracker Pro 💪

Aplicación completa de seguimiento de entrenamientos construida con Next.js 14, TypeScript y Tailwind CSS. Una solución moderna, intuitiva y completa para gestionar tus entrenamientos, rutinas y progreso físico.

## ✨ Características Principales

### 🎯 Sistema de Entrenamientos
- ✅ **Registro en tiempo real** con auto-guardado
- ✅ **Timer de entrenamiento** y cronómetro de descanso configurable (30s - 3min)
- ✅ **Historial de ejercicios** con comparación de progreso
- ✅ **Sugerencias de progresión** basadas en objetivo de entrenamiento
- ✅ **Biseries/Supersets** - Alterna automáticamente entre ejercicios emparejados
- ✅ **Auto-completado inteligente** de series al cambiar de foco
- ✅ **Pre-carga de pesos** del último entrenamiento
- ✅ **RPE (Rate of Perceived Exertion)** para medir intensidad (1-10)
- ✅ **Cálculo automático de volumen** total levantado
- ✅ **Notas por ejercicio** y notas generales del entrenamiento

### 📊 Sistema de Rutinas Avanzado
- ✅ **Rutinas semanales personalizadas** organizadas por días
- ✅ **Días de descanso programados** con contenido motivacional
- ✅ **Plantillas predefinidas** (Push/Pull/Legs, Full Body, Upper/Lower)
- ✅ **Biseries configurables** para entrenamientos más eficientes
- ✅ **Estimación de duración** de cada rutina
- ✅ **Colores distintivos** por día de la semana
- ✅ **Comparación de rutinas** lado a lado

### 📚 Biblioteca de Ejercicios Extensible
- ✅ **50+ ejercicios precargados** con imágenes
- ✅ **Filtros avanzados** por categoría, grupo muscular y equipo
- ✅ **Sistema de favoritos** para acceso rápido
- ✅ **Búsqueda en tiempo real** por nombre
- ✅ **Agregar ejercicios personalizados** con tus propias imágenes
- ✅ **Historial completo** por ejercicio con tendencias

### 📈 Análisis y Estadísticas Completas
- ✅ **Gráficos de progreso** con Recharts
- ✅ **Volumen semanal** acumulado
- ✅ **Records personales** por ejercicio
- ✅ **Frecuencia de entrenamiento** semanal/mensual
- ✅ **Time Under Tension (TUT)** estimado
- ✅ **Distribución por grupo muscular** con gráfico de pastel
- ✅ **Seguimiento de 1RM** a lo largo del tiempo
- ✅ **Filtros por rango de tiempo** (7/30/90 días o todos)

### 🧮 Calculadora 1RM Inteligente
- ✅ **Fórmula de Brzycki** para precisión
- ✅ **Zonas de entrenamiento personalizadas** según objetivo
- ✅ **Recomendaciones basadas en perfil** (Fuerza, Hipertrofia, Resistencia)
- ✅ **Advertencias inteligentes** para rangos de reps con mayor margen de error
- ✅ **Tabla completa de porcentajes** (65%-100%)
- ✅ **Cálculo de reps máximas** por zona

### 👤 Perfil y Objetivos
- ✅ **Información personal** editable
- ✅ **Datos físicos** (peso, altura)
- ✅ **Cálculo automático de IMC** con categorización
- ✅ **Objetivos de entrenamiento**:
  - 💪 **Fuerza** (1-6 reps, cargas pesadas, 3-5 min descanso)
  - 🏋️ **Hipertrofia** (6-12 reps, volumen moderado, 1-2 min descanso)
  - ⚡ **Resistencia** (15+ reps, cargas ligeras, 30-60 seg descanso)
- ✅ **Estadísticas totales** de entrenamientos

### 🔥 Sistema de Rachas (Duolingo-style)
- ✅ **Contador de días consecutivos** de entrenamiento
- ✅ **Ignora días de descanso programados** automáticamente
- ✅ **Motivación visual** con emoji de fuego
- ✅ **Reset inteligente** solo al perder un día de entrenamiento

### 🌙 Días de Descanso Mejorados
- ✅ **Frases motivacionales rotativas** (20 frases únicas)
- ✅ **Consejos de recuperación** (20 tips profesionales)
- ✅ **Contenido diario diferente** con hash basado en fecha
- ✅ **Estadísticas de la semana** (entrenamientos completados, días de descanso)
- ✅ **Vista previa del próximo entrenamiento** con ejercicios
- ✅ **Diseño "zen"** con gradientes relajados

### 📤 Exportación de Datos Profesional
- ✅ **Exportar a CSV** con formato profesional y estadísticas
- ✅ **Exportar a PDF** con diseño de marca (jsPDF)
- ✅ **Resumen estadístico** incluido en exportaciones
- ✅ **Datos completos** de todos los entrenamientos
- ✅ **Formato legible** para análisis en Excel/Sheets

### 🎨 Experiencia de Usuario Premium
- ✅ **Diseño responsive** mobile-first
- ✅ **Modo claro/oscuro** con toggle
- ✅ **Animaciones fluidas** con Framer Motion
- ✅ **Navegación adaptativa** (escritorio/móvil)
- ✅ **Navegación inferior** en móviles
- ✅ **Inputs grandes y legibles** en workout
- ✅ **Dashboard intuitivo** con accesos rápidos
- ✅ **Optimizado para todas las pantallas**

### 🏆 Sistema de Logros
- ✅ **14 logros desbloqueables** con iconos únicos
- ✅ **Niveles de progreso** (Bronce, Plata, Oro, Platino, Diamante)
- ✅ **Tracking de progreso visual** con barras de progreso
- ✅ **Notificaciones de nuevos logros**
- ✅ **Estadísticas de desbloqueo**

## 💾 Almacenamiento de Datos

La aplicación utiliza `localStorage` para persistir datos localmente en tu dispositivo:
- ✅ Información de usuario y objetivo de entrenamiento
- ✅ Ejercicios personalizados con imágenes
- ✅ Historial completo de entrenamientos
- ✅ Rutinas semanales creadas
- ✅ Records personales automáticos
- ✅ Workouts en progreso (auto-guardado)
- ✅ Configuración de descansos preferida
- ✅ Logros desbloqueados

**Nota:** Todos tus datos permanecen en tu dispositivo. No se envían a ningún servidor.

## 🎨 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework React con App Router y Server Components
- **TypeScript** - Tipado estático para mayor robustez
- **Tailwind CSS** - Estilos utility-first para diseño rápido
- **Framer Motion** - Animaciones fluidas y profesionales
- **Lucide React** - Iconos modernos y consistentes

### Gráficos y Visualización
- **Recharts** - Gráficos interactivos y responsive
- **jsPDF + autoTable** - Generación de PDFs profesionales

### Estado y Contexto
- **React Context API** - Manejo de estado global
- **localStorage API** - Persistencia de datos local

## 📱 Características Responsive

- 📱 **Diseño mobile-first** optimizado para teléfonos
- 💻 **Adaptación a tablets** con grid de 2 columnas
- 🖥️ **Vista de escritorio** con grid de 3 columnas
- 🎯 **Touch-friendly** con botones grandes y claros
- ⚡ **Inputs táctiles mejorados** para registro rápido
- 📐 **Layouts flexibles** que se adaptan al contenido

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Pasos de Instalación

1. **Clona el repositorio:**
```bash
git clone https://github.com/ccsr7/gym-tracker-pro.git
cd gym-tracker-pro
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Ejecuta el servidor de desarrollo:**
```bash
npm run dev
```

4. **Abre tu navegador:**
```
http://localhost:3000
```

## 📦 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo (http://localhost:3000)
npm run build    # Construye la aplicación para producción
npm start        # Inicia el servidor de producción
npm run lint     # Ejecuta el linter de código
```

## 🗂️ Estructura del Proyecto

```
gym-tracker-pro/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── library/           # Biblioteca de ejercicios con filtros
│   │   ├── routines/          # Gestión de rutinas semanales
│   │   │   └── templates/     # Plantillas predefinidas
│   │   ├── calculator/        # Calculadora 1RM con zonas
│   │   ├── history/           # Historial de entrenamientos
│   │   ├── profile/           # Perfil y objetivos
│   │   ├── stats/             # Estadísticas y exportación
│   │   ├── progress/          # Progreso por ejercicio
│   │   ├── workout/[id]/      # Página de entrenamiento en vivo
│   │   └── achievements/      # Sistema de logros
│   ├── components/            # Componentes React reutilizables
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   ├── Navigation.tsx     # Navegación adaptativa
│   │   └── PageTransition.tsx # Animaciones de página
│   ├── lib/                   # Utilidades y lógica de negocio
│   │   ├── auth-context.tsx   # Contexto de autenticación
│   │   ├── utils.ts           # Utilidades (BMI, 1RM, fechas, streaks)
│   │   ├── volume-stats.ts    # Cálculos de estadísticas
│   │   ├── data-export.ts     # Exportación CSV/PDF
│   │   └── progression-suggestions.ts # Sugerencias de progresión
│   ├── types/                 # Definiciones TypeScript
│   │   └── index.ts           # Tipos globales
│   └── data/                  # Datos iniciales
│       ├── exercises.ts       # Biblioteca de 50+ ejercicios
│       ├── routine-templates.ts # Plantillas predefinidas
│       └── rest-day-content.ts # Frases y consejos para descanso
├── public/
│   └── exercises/             # Imágenes de ejercicios (50+ imágenes)
├── package.json               # Dependencias del proyecto
├── tsconfig.json              # Configuración TypeScript
├── tailwind.config.ts         # Configuración Tailwind
├── next.config.js             # Configuración Next.js
└── README.md                  # Este archivo
```

## 🎯 Guía de Uso

### 1. Primer Uso - Configuración Inicial

1. **Registra tu cuenta** con nombre y email
2. **Completa tu perfil** con peso, altura y objetivo de entrenamiento
3. **Explora la biblioteca** de ejercicios y marca favoritos
4. **Crea tu primera rutina** o usa una plantilla predefinida

### 2. Creación de Rutinas

1. Ve a **Rutinas** → **Crear Nueva Rutina**
2. Selecciona el **día de la semana**
3. Agrega **ejercicios** desde la biblioteca
4. Configura **series y reps** para cada ejercicio
5. Opcional: **Crea biseries** emparejando ejercicios
6. Guarda tu rutina

### 3. Durante el Entrenamiento

1. **Dashboard** mostrará tu rutina del día
2. Presiona **"Iniciar Entrenamiento"**
3. **Registra peso y reps** para cada serie
4. El timer de **descanso inicia automáticamente** al completar una serie
5. En **biseries**, alterna automáticamente entre ejercicios
6. Agrega **notas** por ejercicio si es necesario
7. Al finalizar, ajusta **RPE** y guarda

### 4. Análisis de Progreso

1. Ve a **Estadísticas** para ver tu progreso general
2. Ve a **Progreso por Ejercicio** para análisis detallados
3. Compara tu **1RM** y volumen a lo largo del tiempo
4. Revisa tus **records personales**
5. **Exporta tus datos** en CSV o PDF

### 5. Sistema de Logros

1. Ve a **Logros** para ver tu progreso
2. Desbloquea logros completando objetivos
3. Sube de nivel en diferentes categorías
4. Comparte tus logros con amigos

## 🧮 Fórmulas y Cálculos

### 1RM (Brzycki)
```
1RM = Peso × (36 / (37 - Reps))
```

### IMC (Índice de Masa Corporal)
```
IMC = Peso (kg) / (Altura (m))²
```

### Volumen Total
```
Volumen = Σ (Peso × Reps × Series)
```

### Racha de Entrenamiento
- Cuenta días consecutivos de entrenamientos completados
- Ignora días de descanso programados
- Se reinicia al perder un día de entrenamiento

## 🔐 Autenticación

El sistema de autenticación actual es **local** y usa `localStorage`.

### Para Uso en Producción:

Se recomienda implementar autenticación real con:
- **NextAuth.js** - Autenticación para Next.js
- **Firebase Auth** - Backend como servicio
- **Supabase Auth** - Alternativa open-source
- **Clerk** - Autenticación moderna
- O cualquier otro proveedor de tu preferencia

## 🎨 Personalización

### Colores y Temas

Los colores se pueden modificar en:
- `tailwind.config.ts` - Colores base y extendidos
- `src/app/globals.css` - Variables CSS y temas

### Agregar Ejercicios

Edita `src/data/exercises.ts` y agrega:
```typescript
{
  id: 'nuevo-ejercicio',
  name: 'Nombre del Ejercicio',
  category: 'Pecho',
  muscleGroup: 'Pectorales',
  equipment: 'Barra',
  image: '/exercises/tu-imagen.jpg'
}
```

### Crear Plantillas de Rutinas

Edita `src/data/routine-templates.ts`:
```typescript
{
  id: 'mi-plantilla',
  name: 'Mi Rutina Personalizada',
  description: 'Descripción de tu rutina',
  routines: [...]
}
```

### Modificar Contenido de Días de Descanso

Edita `src/data/rest-day-content.ts`:
- Agrega frases motivacionales al array `MOTIVATIONAL_QUOTES`
- Agrega consejos al array `RECOVERY_TIPS`

## 📊 Exportación de Datos

### Formato CSV
- Incluye resumen estadístico
- Datos completos de cada serie
- Compatible con Excel/Google Sheets
- Formato: `gym-tracker-YYYY-MM-DD.csv`

### Formato PDF
- Diseño profesional con logo
- Resumen general con métricas
- Tabla detallada de entrenamientos
- Paginación automática
- Formato: `gym-tracker-YYYY-MM-DD.pdf`

## 🐛 Solución de Problemas

### Los datos no se guardan
- Verifica que el navegador permita `localStorage`
- Revisa la consola del navegador para errores
- Intenta limpiar el caché y recargar

### Las imágenes no cargan
- Asegúrate de que las imágenes estén en `public/exercises/`
- Verifica las rutas en `src/data/exercises.ts`
- Usa el formato correcto: `/exercises/nombre-imagen.jpg`

### El modo oscuro no funciona
- Limpia el caché del navegador
- Verifica que Tailwind esté configurado con `darkMode: 'class'`

## 🚀 Deployment

### Vercel (Recomendado)

1. Push tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Vercel detectará automáticamente Next.js
4. Deploy con un click

### Otras Opciones

- **Netlify** - Alternativa similar a Vercel
- **Railway** - Para proyectos con backend
- **Digital Ocean** - VPS tradicional
- **AWS Amplify** - Ecosistema AWS

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la **Licencia MIT**.

Puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del software libremente.

## 👨‍💻 Autor

**Desarrollado por Cesar**
Gracias especiales a Claude Code por la asistencia en el desarrollo

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!

### Cómo Contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ideas para Contribuciones:

- 🎯 Agregar más ejercicios a la biblioteca
- 📊 Mejorar los gráficos y estadísticas
- 🌐 Agregar soporte multi-idioma
- 🔔 Sistema de notificaciones
- 📱 Aplicación móvil nativa
- 🎨 Más temas de color
- 🏆 Más logros y desafíos
- 💪 Integración con wearables

## 🙏 Agradecimientos

- **Next.js Team** - Por el excelente framework
- **Tailwind CSS** - Por el sistema de diseño
- **Lucide** - Por los hermosos iconos
- **Recharts** - Por los gráficos
- **Comunidad Open Source** - Por todas las librerías

## 📧 Contacto

Si tienes preguntas, sugerencias o encontraste un bug:
- Abre un [Issue](https://github.com/ccsr7/gym-tracker-pro/issues)
- O contacta directamente en GitHub

---

⭐ Si te gusta el proyecto, considera darle una estrella en GitHub!

**Gym Tracker Pro** - Lleva tus entrenamientos al siguiente nivel 💪🚀
