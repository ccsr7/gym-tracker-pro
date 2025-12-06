'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Dumbbell, Info } from 'lucide-react';
import { storageService, STORAGE_KEYS } from '@/lib/storage-service';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  // Create demo account on first load if no users exist
  useEffect(() => {
    const users = storageService.get<any[]>(STORAGE_KEYS.USERS, []);
    if (users.length === 0) {
      // Create demo user with plaintext password - will be migrated to hash on first login
      const demoUser = {
        name: 'Usuario Demo',
        email: 'demo@gym.com',
        password: 'demo123'
      };
      storageService.set(STORAGE_KEYS.USERS, [demoUser]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Error al iniciar sesión');
        }
      } else {
        const result = await register(name, email, password);
        if (!result.success) {
          setError(result.error || 'Error al registrar');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await login('demo@gym.com', 'demo123');
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md p-8">
        <div className="bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-emerald-500 p-3 rounded-xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-white">
            Gym Tracker Pro
          </h1>
          <p className="text-center text-slate-400 mb-8">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-400"
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-400"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-400"
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="text-emerald-400 hover:text-emerald-300 text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          {/* Demo Account Info */}
          {isLogin && (
            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex gap-3 items-start mb-3">
                <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-emerald-300 text-sm font-medium mb-1">Cuenta Demo</p>
                  <p className="text-emerald-200/80 text-xs mb-2">
                    Prueba la aplicación con estas credenciales:
                  </p>
                  <div className="bg-slate-900/30 rounded p-2 mb-2">
                    <p className="text-emerald-300 text-xs font-mono">Email: demo@gym.com</p>
                    <p className="text-emerald-300 text-xs font-mono">Contraseña: demo123</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-slate-700 disabled:cursor-not-allowed border border-emerald-500/50 text-emerald-300 disabled:text-slate-500 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isLoading ? 'Cargando...' : 'Usar Cuenta Demo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
