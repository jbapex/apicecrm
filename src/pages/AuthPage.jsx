import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_expired') === 'true') {
      setShowSessionExpired(true);
      // Remove o parâmetro da URL para não mostrar a mensagem novamente em um refresh manual
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Ápice CRM</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Sistema de Gestão de Leads</p>
        </motion.div>

        {showSessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-md mb-6 flex items-center"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 mr-3" />
            <p className="font-semibold">Sua sessão expirou. Por favor, faça login novamente.</p>
          </motion.div>
        )}

        <motion.div layout className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
              <LogIn className="inline-block mr-2 h-5 w-5" /> Entrar
            </button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
              <UserPlus className="inline-block mr-2 h-5 w-5" /> Cadastrar
            </button>
          </div>

          <motion.form key={isLogin ? 'login' : 'signup'} initial={{ opacity: 0, x: isLogin ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? -50 : 50 }} transition={{ duration: 0.3 }} onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
              {isLogin ? 'Acessar sua conta' : 'Criar nova conta'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                Email
              </label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" placeholder="seu@email.com" required />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                Senha
              </label>
              <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105" disabled={loading}>
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};
export default AuthPage;