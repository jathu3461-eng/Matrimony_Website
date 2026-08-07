import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useI18n } from '../context/I18nContext';
import { uploadsUrl } from '../api';

export default function Navbar({ siteName }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { unreadTotal } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/chat')) return null;

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
    user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'broker' ? '/broker/dashboard'
    : '/dashboard';

  /* ── Language toggle ── */
  const toggleLang = () => setLang(lang === 'en' ? 'ta' : 'en');

  /* ── Active link helper ── */
  const active = (path) =>
    location.pathname === path
      ? 'bg-white text-pink-600 font-bold shadow-sm'
      : 'text-slate-600 hover:text-pink-600 hover:bg-white/70';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-pink-100/80 shadow-sm supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4 flex-wrap">

        {/* ── Brand Logo ── */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <motion.img
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            src={uploadsUrl('logo.png')}
            alt="Mukurtham Matrimony"
            className="h-10 w-auto"
          />
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
                ? 'bg-pink-500 text-white border-pink-400 shadow shadow-pink-400/40'
                : 'bg-white text-pink-600 border-pink-300 hover:bg-pink-50'}`}
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
              {unreadTotal > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center leading-none">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
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
