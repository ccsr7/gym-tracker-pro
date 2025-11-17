# Test de Login - Gym Tracker Pro

## Servidor corriendo en:
http://localhost:3003

## Pasos para probar el login:

### Opción 1: Borrar todo y empezar de cero
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. En "Local Storage", encuentra `http://localhost:3003`
4. Haz clic derecho → "Clear" o borra estos items:
   - `gym-tracker-user`
   - `gym-tracker-users`
5. Recarga la página (F5)
6. Haz clic en "Usar Cuenta Demo"

### Opción 2: Login manual
1. Email: `demo@gym.com`
2. Password: `demo123`
3. Click "Iniciar Sesión"

### Opción 3: Crear nueva cuenta
1. Click en "¿No tienes cuenta? Regístrate"
2. Nombre: Tu nombre
3. Email: tucorreo@ejemplo.com
4. Password: mínimo 6 caracteres
5. Click "Registrarse"

## Si aún no funciona:

### Debug en consola del navegador:
Abre la consola (F12) y pega estos comandos uno por uno:

```javascript
// Ver usuarios guardados
console.log(JSON.parse(localStorage.getItem('gym-tracker-users') || '[]'));

// Ver usuario actual
console.log(JSON.parse(localStorage.getItem('gym-tracker-user') || 'null'));

// Crear cuenta demo manualmente
localStorage.setItem('gym-tracker-users', JSON.stringify([{name: 'Demo', email: 'demo@gym.com', password: 'demo123'}]));

// Recargar página
location.reload();
```

## Problemas comunes:

1. **Error: "Email o contraseña incorrectos"**
   - Asegúrate de usar: demo@gym.com / demo123
   - Verifica que no haya espacios en el email

2. **La página no carga**
   - Verifica que el servidor esté corriendo en http://localhost:3003
   - Revisa la consola del navegador por errores

3. **Se queda en "Cargando..."**
   - Borra localStorage y recarga
   - Verifica que JavaScript esté habilitado

4. **Botón "Usar Cuenta Demo" no funciona**
   - Usa login manual: demo@gym.com / demo123
