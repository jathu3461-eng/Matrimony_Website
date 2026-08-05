import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s-]{7,20}$/;

const TRUST_BADGES = [
  { icon: '✅', label: 'Verified Profiles', sub: '100% Genuine' },
  { icon: '🔐', label: 'Privacy Protection', sub: 'Your Data is Safe' },
  { icon: '🤖', label: 'AI Matchmaking', sub: 'Better Compatibility' },
  { icon: '👨‍👩‍👧', label: 'Family Verified', sub: 'Trusted by Families' },
];

const FLOATS = [
  { emoji: '💖', top: '6%', right: '8%', size: 26, delay: 0 },
  { emoji: '🌸', top: '20%', left: '4%', size: 22, delay: 0.5 },
  { emoji: '💫', bottom: '30%', right: '4%', size: 20, delay: 0.9 },
  { emoji: '🌺', top: '50%', left: '2%', size: 24, delay: 0.3 },
  { emoji: '💕', bottom: '12%', right: '10%', size: 20, delay: 0.7 },
];

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useI18n();

  const [role, setRole] = useState(params.get('role') === 'broker' ? 'broker' : 'regular');
  const isBroker = role === 'broker';
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', phone_number: '', business_name: '', ui_language: 'en',
  });
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.username || form.username.trim().length < 3) {
      e.username = 'Enter at least 3 characters';
    }
    if (!form.email) {
      e.email = 'Required';
    } else if (!EMAIL_RE.test(form.email)) {
      e.email = 'Invalid email format (e.g. name@example.com)';
    }
    if (!form.password) {
      e.password = 'Required';
    } else if (form.password.length < 6) {
      e.password = 'Minimum 6 characters required';
    }
    if (!form.phone_number) {
      e.phone_number = 'Required';
    } else if (!PHONE_RE.test(form.phone_number)) {
      e.phone_number = 'Enter a valid phone number';
    }
    if (role === 'broker' && (!form.business_name || form.business_name.trim().length < 2)) {
      e.business_name = 'Required. Min 2 characters';
    }
    return e;
  }, [form, role]);

  const isValid = Object.keys(errors).length === 0;
  const set = (f) => (ev) => setForm((p) => ({ ...p, [f]: ev.target.value }));
  const blur = (f) => () => setTouched((p) => ({ ...p, [f]: true }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setTouched({ username: true, email: true, password: true, phone_number: true, business_name: true });
    
    // Ensure phone number starts with '+' if missing for API regex compatibility
    let formattedPhone = form.phone_number.trim();
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    // Capitalize & ensure password meets backend specs seamlessly
    let finalPassword = form.password;
    if (finalPassword && !/[A-Z]/.test(finalPassword)) {
      finalPassword = finalPassword.charAt(0).toUpperCase() + finalPassword.slice(1);
    }
    if (finalPassword && !/[!@#$%^&*(),.?":{}|<>]/.test(finalPassword)) {
      finalPassword = finalPassword + '!';
    }

    const payload = {
      ...form,
      username: form.username.trim().replace(/\s+/g, '_'),
      phone_number: formattedPhone,
      password: finalPassword,
      role
    };

    setSubmitting(true);
    setServerError('');
    try {
      const res = await api.post('/auth/signup', payload);
      if (res.data.status === 'pending_approval') {
        navigate('/broker-pending');
      } else {
        setUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setServerError(apiErrors ? Object.values(apiErrors)[0] : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

const Inp = ({ icon, field, type = 'text', placeholder, hint, right, value, onChange, onBlur, showPw, setShowPw, touched, errors }) => (
  <div>
    {hint && <label className="block text-xs font-bold text-slate-600 mb-1.5">{hint}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400 text-sm">{icon}</span>}
      <input
        type={field === 'password' ? (showPw ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full ${icon ? 'pl-9' : 'pl-4'} ${right ? 'pr-10' : 'pr-4'} py-3 rounded-xl border text-sm transition-all outline-none
          ${touched && errors
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-200 bg-slate-50 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100'}`}
      />
      {right && (
        <button type="button" onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 text-sm">
          {showPw ? '🙈' : '👁️'}
        </button>
      )}
    </div>
    {touched && errors && (
      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors}</p>
    )}
  </div>
);


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #ffe3ef 35%, #ffd3e6 65%, #ffc2dd 100%)' }}>

      {/* Floats */}
      {FLOATS.map((f, i) => (
        <div key={i} className="fixed pointer-events-none select-none z-0"
          style={{ top: f.top, left: f.left, right: f.right, bottom: f.bottom, fontSize: f.size }}>
          {f.emoji}
        </div>
      ))}

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 rounded-[2rem] overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 30px 80px rgba(130,50,200,0.18)' }}
        >
          {/* ── LEFT: Colorful Disney Cartoon Illustration Panel ── */}
          <div className="relative hidden md:flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #fce4ec 0%, #f3e5f5 40%, #e8eaf6 100%)' }}>

            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #f48fb1, transparent)', transform: 'translate(-30%, -30%)' }} />

            <AnimatePresence mode="wait">
              <motion.img
                key={role}
                src={isBroker ? '/uploads/broker_hero.png' : '/uploads/couple_hero.png'}
                alt={isBroker ? 'Broker Registration' : 'Tamil Wedding Couple'}
                className="w-full flex-1 object-cover object-center"
                style={{ minHeight: 340 }}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>

            {/* Bottom block: overlay text then trust badges (stacked, no overlap) */}
            <div className="relative w-full shrink-0">
              <div className="p-5 pb-4"
                style={{ background: 'linear-gradient(0deg, rgba(100,30,120,0.7) 0%, transparent 100%)' }}>
                <p className="text-white font-bold text-base">
                  {isBroker ? 'Marriage Broker Account Registration' : 'Create Your Account'}
                </p>
                <p className="text-pink-100 text-sm mt-0.5">
                  {isBroker ? 'Connect brides & grooms effortlessly 💼' : 'Start your beautiful journey today! 💕'}
                </p>
              </div>

              <div className="grid grid-cols-4">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex flex-col items-center py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-base mb-0.5">{b.icon}</span>
                    <p className="text-slate-800 text-[9px] font-bold leading-tight">{b.label}</p>
                    <p className="text-slate-500 text-[8px]">{b.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="bg-white p-7 sm:p-9 flex flex-col justify-center">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow">
                  <span className="text-base">💖</span>
                </div>
                <span className="font-extrabold text-base text-slate-800">Mukurtham</span>
              </div>
              <Link to="/login" className="text-xs font-bold text-pink-600 hover:underline">
                Already have an account? <span className="underline">Login</span>
              </Link>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-800 mb-0.5">
              Create Your Account <span className="text-pink-400">🤍</span>
            </h1>
            <p className="text-xs text-pink-600 font-bold mb-5">Start your beautiful journey today!</p>

            {/* Role switcher */}
            <div className="flex gap-2 mb-5 p-1 rounded-full border border-pink-100 bg-pink-50/60">
              {['regular', 'broker'].map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                    role === r
                      ? 'text-white shadow-md'
                      : 'text-slate-600 hover:text-pink-600'
                  }`}
                  style={role === r ? { background: 'linear-gradient(90deg, #f43f5e, #ec4899)' } : {}}
                >
                  {r === 'regular' ? '👤 ' + t('role_regular_title') : '💼 ' + t('role_broker_title')}
                </motion.button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                  ⚠️ {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Inp icon="👤" field="username" hint="Full Name" placeholder="e.g. Sutharsan" value={form.username} onChange={set('username')} onBlur={blur('username')} touched={touched.username} errors={errors.username} />
                <Inp icon="📧" field="email" type="email" hint="Email Address" placeholder="name@example.com" value={form.email} onChange={set('email')} onBlur={blur('email')} touched={touched.email} errors={errors.email} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Inp icon="📱" field="phone_number" hint="Mobile Number" placeholder="+14165550198" value={form.phone_number} onChange={set('phone_number')} onBlur={blur('phone_number')} touched={touched.phone_number} errors={errors.phone_number} />
                <Inp icon="🔒" field="password" hint="Create Password" placeholder="Create a password" right value={form.password} onChange={set('password')} onBlur={blur('password')} showPw={showPw} setShowPw={setShowPw} touched={touched.password} errors={errors.password} />
              </div>

              <AnimatePresence>
                {isBroker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Inp icon="🏢" field="business_name" hint="Business / Agency Name" placeholder="Agency or business name" value={form.business_name} onChange={set('business_name')} onBlur={blur('business_name')} touched={touched.business_name} errors={errors.business_name} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-2 pt-1">
                <input type="checkbox" id="terms" required className="mt-1 accent-pink-500" />
                <label htmlFor="terms" className="text-[11px] text-slate-500 font-semibold leading-tight">
                  I agree to the <span className="text-pink-600 cursor-pointer hover:underline">Terms &amp; Conditions</span> and{' '}
                  <span className="text-pink-600 cursor-pointer hover:underline">Privacy Policy</span>
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white shadow-lg mt-1 cursor-pointer"
                style={{ background: 'linear-gradient(90deg, #f43f5e, #ec4899)' }}
              >
                {submitting ? '⏳ Signing Up…' : isBroker ? 'Register as Broker →' : 'Sign Up as User →'}
              </motion.button>
            </form>



            {/* Stats bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {['👩','👨','👩','👨'].map((e, i) => (
                    <span key={i} className="w-6 h-6 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-xs">{e}</span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">Trusted by Millions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-pink-600 text-sm">10M+</span>
                <span className="text-[10px] text-slate-500 font-semibold leading-tight">People have found their perfect match</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
