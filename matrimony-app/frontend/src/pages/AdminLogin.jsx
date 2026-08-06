import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, ErrorCard } from '../components/ui';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (!loading && user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/admin-login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setUser(res.data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please wait 15 minutes and try again.');
      } else {
        // Use generic message to avoid revealing credential details
        setError(data?.error || 'Invalid email or password. Please check your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #fff0f6, #fce7f3)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Admin Access"
      subtitle="Master Admin Portal"
      brand={undefined}
      hideToggle
    >
      <motion.div variants={stagger} initial="hidden" animate="show">
        {error && (
          <motion.div variants={fadeUp} className="mb-5">
            <ErrorCard message={error} onDismiss={() => setError('')} />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <motion.div variants={fadeUp}>
            <TextField
              label="Admin Email"
              placeholder="admin@mukurtham.ca"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={fieldErrors.email}
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <TextField
              label="Password"
              placeholder="Enter admin password"
              type={showPw ? 'text' : 'password'}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={fieldErrors.password}
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-[0.8rem] text-[var(--ink-faint)] hover:text-[var(--primary)] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button type="submit" fullWidth loading={submitting} className="mt-2">
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Sign In to Admin Panel
              </span>
            </Button>
          </motion.div>
        </form>

        <motion.div
          variants={fadeUp}
          className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-faint)] font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
          Restricted access — authorized administrators only
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4 text-center">
          <Link to="/login" className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to User Login
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
