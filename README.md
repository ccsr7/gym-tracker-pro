# Gym Tracker Pro

Aplicación completa de seguimiento de entrenamientos construida con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

- ✅ Sistema de autenticación
- ✅ Registro de entrenamientos en tiempo real
- ✅ Constructor de rutinas personalizadas
- ✅ Biblioteca de 50+ ejercicios extensible
- ✅ Calculadora de 1RM con instrucciones
- ✅ Historial de entrenamientos
- ✅ Gráficos de progreso
- ✅ Exportación de datos
- ✅ Diseño responsive y moderno
- ✅ Modo claro/oscuro
- ✅ Animaciones fluidas

## 💾 Almacenamiento de Datos

La aplicación utiliza `localStorage` para persistir datos localmente:
- Información de usuario
- Ejercicios personalizados
- Historial de entrenamientos
- Rutinas creadas
- Records personales

## 🎨 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos Utility-first
- **Lucide React** - Iconos
- **Recharts** - Gráficos (opcional)

## 📱 Características Responsive

- Diseño mobile-first
- Navegación adaptativa (escritorio/móvil)
- Navegación inferior en móviles
- Optimizado para todas las pantallas

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd gym-tracker-pro
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🗂️ Estructura del Proyecto

```
gym-tracker-pro/
├── src/
│   ├── app/              # App router (Next.js 14)
│   │   ├── library/      # Biblioteca de ejercicios
│   │   ├── routines/     # Gestión de rutinas
│   │   ├── calculator/   # Calculadora 1RM
│   │   ├── history/      # Historial de entrenamientos
│   │   └── profile/      # Perfil de usuario
│   ├── components/       # Componentes React reutilizables
│   ├── lib/              # Utilidades y contextos
│   ├── types/            # Definiciones TypeScript
│   └── data/             # Datos iniciales (ejercicios)
├── public/
│   └── exercises/        # Imágenes de ejercicios
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎯 Características Principales

### Dashboard
- Saludo personalizado
- Estadísticas de la semana
- Rutina del día
- Botón de inicio rápido

### Biblioteca de Ejercicios
- 50+ ejercicios precargados
- Filtros por categoría
- Sistema de favoritos
- Búsqueda avanzada

### Rutinas
- Organización por días de la semana
- Colores distintivos por día
- Estimación de duración
- Edición fácil

### Calculadora 1RM
- Fórmula de Brzycki
- Tabla de porcentajes
- Instrucciones de uso
- Diseño intuitivo

### Perfil
- Información personal
- Datos físicos
- Cálculo automático de IMC
- Gestión de cuenta

## 🔐 Autenticación

El sistema de autenticación es local y usa localStorage. Para uso en producción, se recomienda implementar autenticación real con:
- NextAuth.js
- Firebase Auth
- Supabase Auth
- O cualquier otro proveedor

## 🎨 Personalización

### Colores
Los colores se pueden modificar en `tailwind.config.ts` y `src/app/globals.css`

### Ejercicios
Agrega más ejercicios en `src/data/exercises.ts`

### Temas
El tema se puede cambiar usando el toggle en la navegación

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

Desarrollado con 💪 por Cesar

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.
