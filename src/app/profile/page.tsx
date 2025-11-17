'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/lib/auth-context';
import { calculateBMI, getBMICategory } from '@/lib/utils';
import { User as UserIcon, Scale, Ruler, Activity, LogOut, Edit } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setWeight(user.weight?.toString() || '');
      setHeight(user.height?.toString() || '');
    }
  }, [user]);

  const handleSave = () => {
    updateUser({
      name,
      email,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const bmi = user?.weight && user?.height ? calculateBMI(user.weight, user.height) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-slate-100">
      <Navigation />

      <PageTransition>
        <div className="container mx-auto px-4 pt-20 py-8 pb-24 md:pt-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white dark:text-slate-900">Mi Perfil</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-transparent hover:bg-white/5 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-slate-700 dark:border-slate-300"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
              <UserIcon className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-white dark:text-slate-900">Información Personal</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Nombre</p>
                <p className="text-white dark:text-slate-900 font-medium text-lg">{user?.name || 'Cesar'}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-600 text-sm mb-1">Email</p>
                <p className="text-white dark:text-slate-900 font-medium">{user?.email || 'cesar_robledo7@hotmail.com'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Physical Data */}
        <div className="bg-slate-800/60 dark:bg-slate-100 backdrop-blur-sm border border-slate-700/50 dark:border-slate-200 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-700/50 dark:bg-slate-200 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-white dark:text-slate-900">Datos Físicos</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 dark:text-slate-600 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Estatura (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 dark:bg-white border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">Peso (kg)</p>
                  </div>
                  <p className="text-white dark:text-slate-900 font-bold text-3xl">{user?.weight || '65'} kg</p>
                </div>
                <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-400 dark:text-slate-600 text-sm">Estatura (cm)</p>
                  </div>
                  <p className="text-white dark:text-slate-900 font-bold text-3xl">{user?.height || '175'} cm</p>
                </div>
              </div>

              {/* BMI Display */}
              <div className="bg-slate-700/30 dark:bg-slate-200 rounded-xl p-4">
                <p className="text-slate-400 dark:text-slate-600 text-sm mb-2">Índice de Masa Corporal (IMC)</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-white dark:text-slate-900 font-bold text-4xl">{bmi || '21.2'}</p>
                  <span className="text-emerald-400 dark:text-emerald-600 text-sm font-medium px-3 py-1 bg-emerald-500/20 dark:bg-emerald-100 rounded-full">
                    {bmiCategory || 'Normal'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Guardar Cambios
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-700 dark:bg-slate-300 hover:bg-slate-600 dark:hover:bg-slate-400 text-white dark:text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        )}
        </div>
      </PageTransition>
    </div>
  );
}
