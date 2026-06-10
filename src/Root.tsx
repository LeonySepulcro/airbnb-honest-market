import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import App from './App';
import AdminApp from './admin/AdminApp';

const PASSWORD    = '98965857';
const SESSION_KEY = 'hm_admin_auth';

type View = 'guest' | 'login' | 'admin';

export default function Root() {
  const [view, setView] = useState<View>(() =>
    sessionStorage.getItem(SESSION_KEY) === 'true' ? 'admin' : 'guest'
  );
  const [pin, setPin]     = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (pin === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setView('admin');
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setView('guest');
  };

  if (view === 'admin') return <AdminApp onLogout={handleLogout} />;

  return (
    <>
      <App onAdminAccess={() => setView('login')} />

      <AnimatePresence>
        {view === 'login' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-[32px] p-6 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800">Área Restrita</h3>
                  <p className="text-xs text-slate-400">Digite a senha para acessar o painel</p>
                </div>
                <button
                  onClick={() => { setView('guest'); setPin(''); setError(false); }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={`w-full border rounded-2xl p-4 text-center text-2xl font-black tracking-widest focus:outline-none transition-all ${
                  error
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
                }`}
                autoFocus
              />

              {error && (
                <p className="text-center text-xs text-red-500 -mt-2 font-semibold">
                  Senha incorreta
                </p>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                Entrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
