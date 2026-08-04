import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRUST_BADGES = [
  { icon: '🛡️', label: '100% Verified', sub: 'Trusted Profiles' },
  { icon: '🔒', label: 'Privacy First', sub: 'Your Safety is Priority' },
  { icon: '✨', label: 'Smart Matches', sub: 'AI Powered' },
  { icon: '💑', label: 'Happy Stories', sub: 'Millions of Couples' },
];

/* Floating decorative elements */
const FLOATS = [
  { emoji: '💖', top: '8%', left: '6%', size: 28, delay: 0 },
  { emoji: '🌸', top: '18%', right: '8%', size: 24, delay: 0.4 },
  { emoji: '💫', top: '55%', left: '3%', size: 20, delay: 0.8 },
  { emoji: '🌺', bottom: '22%', right: '5%', size: 26, delay: 0.2 },
  { emoji: '💕', bottom: '10%', left: '10%', size: 22, delay: 0.6 },
  { emoji: '⭐', top: '35%', right: '3%', size: 18, delay: 1 },
];

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.email) e.email = 'Required';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Required';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;
  const set = (f) => (ev) => setForm((p) => ({ ...p, [f]: ev.target.value }));
  const blur = (f) => () => setTouched((p) => ({ ...p, [f]: true }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setSubmitting(true);
    setServerError('');
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.status === 'pending_approval') {
        navigate('/broker-pending');
      } else {
        setUser(res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Invalid credentials or account unapproved');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fce4ff 35%, #ede0ff 65%, #e0eaff 100%)' }}>

      {/* Floating decorative elements */}
      {FLOATS.map((f, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none select-none z-0"
          style={{ top: f.top, left: f.left, right: f.right, bottom: f.bottom, fontSize: f.size }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
        >
          {f.emoji}
        </motion.div>
      ))}

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 rounded-[2rem] overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 30px 80px rgba(220,50,100,0.18)' }}
        >
          {/* ── LEFT: Form Panel ── */}
          <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-7">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center shadow-lg">
                <span className="text-lg">💖</span>
              </div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">Mukurtham</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Welcome Back! <span className="text-pink-400">🤍</span></h1>
            <p className="text-sm text-slate-500 mb-7">
              Glad to <span className="text-pink-500 font-bold">see you again</span><br />
              Login to continue your journey to find your perfect life partner.
            </p>

            {/* Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600"
                >
                  ⚠️ {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email / Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400 text-sm">👤</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    onBlur={blur('email')}
                    placeholder="Enter email or mobile number"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
                      ${touched.email && errors.email
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 bg-slate-50 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100'}`}
                  />
                </div>
                {touched.email && errors.email && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400 text-sm">🔒</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    onBlur={blur('password')}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-3 rounded-xl border text-sm transition-all outline-none
                      ${touched.password && errors.password
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 bg-slate-50 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100'}`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 text-sm">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {touched.password && errors.password && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.password}</p>}
              </div>

              {/* Forgot */}
              <div className="text-right -mt-1">
                <Link to="/forgot-password" className="text-xs font-bold text-pink-500 hover:text-pink-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all"
                style={{ background: 'linear-gradient(90deg, #f43f5e, #ec4899)' }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Signing in…</span>
                ) : (
                  <span>Login →</span>
                )}
              </motion.button>
            </form>



            <p className="text-center text-xs text-slate-500 font-semibold mt-6">
              New to Mukurtham?{' '}
              <Link to="/signup" className="text-pink-600 font-bold hover:underline">Create an account</Link>
            </p>
          </div>

          {/* ── RIGHT: Illustration Panel ── */}
          <div className="relative hidden md:flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #fce4ec 0%, #f8bbd0 30%, #e1bee7 65%, #d1c4e9 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #f48fb1, transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #ce93d8, transparent)', transform: 'translate(-30%, 30%)' }} />

            {/* Couple image */}
            <img
              src="/uploads/couple_hero.png"
              alt="Tamil Wedding Couple"
              className="w-full h-full object-cover object-center flex-1"
              style={{ minHeight: 340 }}
            />

            {/* Overlay quote */}
            <div className="absolute bottom-0 left-0 right-0 p-6"
              style={{ background: 'linear-gradient(0deg, rgba(180,40,80,0.65) 0%, transparent 100%)' }}>
              <p className="text-white font-bold text-base leading-snug">
                Every love story is beautiful,
              </p>
              <p className="text-pink-100 text-sm font-semibold mt-0.5">but ours could be my favorite. 💕</p>
            </div>

            {/* Trust badges */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="grid grid-cols-4 gap-0">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex flex-col items-center py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-lg mb-0.5">{b.icon}</span>
                    <p className="text-white text-[9px] font-bold leading-tight">{b.label}</p>
                    <p className="text-pink-100 text-[8px]">{b.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
