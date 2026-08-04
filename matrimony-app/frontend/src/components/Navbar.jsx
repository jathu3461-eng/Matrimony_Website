import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Navbar({ siteName }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Logout ── */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      /* ignore */
    }
    navigate('/');
  };

  /* ── Dashboard path by role ── */
  const dashboardPath =
    user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  /* ── Language toggle ── */
  const toggleLang = () => setLang(lang === 'en' ? 'ta' : 'en');

  /* ── Active link helper ── */
  const active = (path) =>
    location.pathname === path
      ? 'bg-white text-pink-600 font-bold shadow-sm'
      : 'text-slate-600 hover:text-pink-600 hover:bg-white/70';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-pink-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4 flex-wrap">

        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.12, rotate: 8 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400
                       flex items-center justify-center text-white shadow-md shadow-pink-500/30"
          >
            <span className="text-lg">💖</span>
          </motion.div>
          <div>
            <span className="font-display text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
              {siteName || 'Mukurtham'}
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping inline-block" />
            </span>
            <span className="block text-[9px] font-bold text-pink-600 tracking-widest uppercase -mt-0.5">
              {lang === 'ta' ? 'உங்கள் இல்லம் காண்போம் 💕' : 'Find Your Forever 💕'}
            </span>
          </div>
        </Link>

        {/* ── Single pill nav row ── */}
        <nav className="flex items-center gap-1 bg-pink-50/70 p-1.5 rounded-full border border-pink-100/70 flex-wrap">

          {/* Home */}
          <Link
            to="/"
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${active('/')}`}
          >
            {t('nav_home')}
          </Link>

          {/* Matches */}
          <Link
            to="/search"
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${active('/search')}`}
          >
            {t('nav_matches')}
          </Link>

          {/* Tamil / EN toggle — glowing pill */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            onClick={toggleLang}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5
              ${lang === 'ta'
                ? 'bg-amber-500 text-white border-amber-400 shadow shadow-amber-400/40'
                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'}`}
            title={lang === 'ta' ? 'Switch to English' : 'தமிழில் காண'}
          >
            <span className="text-sm leading-none">🌐</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={lang}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
              >
                {t('nav_lang_switch')}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Dashboard — only when logged in */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(dashboardPath)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all
                ${location.pathname === dashboardPath
                  ? 'bg-white text-pink-600 font-extrabold shadow-sm'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-white/70'}`}
            >
              {t('nav_dashboard')}
            </motion.button>
          )}

          {/* Messages — only when logged in */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/chat')}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1
                ${location.pathname.startsWith('/chat')
                  ? 'bg-white text-pink-600 font-extrabold shadow-sm'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-white/70'}`}
            >
              💬 Messages
            </motion.button>
          )}

          {/* Logout — only when logged in */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleLogout}
              className="px-4 py-1.5 text-xs font-bold text-white
                         bg-gradient-to-r from-rose-500 to-pink-500
                         rounded-full shadow shadow-pink-400/30
                         hover:shadow-md hover:shadow-pink-400/50
                         transition-all"
            >
              {t('nav_logout')}
            </motion.button>
          )}
        </nav>

      </div>
    </header>
  );
}
