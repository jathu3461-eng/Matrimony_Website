import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, Navigate } from 'react-router-dom';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  const email = form.email.trim();
  if (!email) errors.email = 'Admin email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!form.password) errors.password = 'Password is required';
  return errors;
}

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();

  // Already signed in as admin? Skip the login page.
  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError('');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');

    // Client-side validation — prevent empty submissions before hitting the API.
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const res = await api.post('/auth/admin-login', {
        email: form.email.trim(),
        password: form.password,
      });
      setUser(res.data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        setError(err.response?.data?.errors?.general || err.response?.data?.error || 'Invalid email or password');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
              error={fieldErrors.email}
              value={form.email}
              onChange={handleChange('email')}
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <TextField
              label="Password"
              placeholder="Enter admin password"
              type={showPw ? 'text' : 'password'}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              error={fieldErrors.password}
              value={form.password}
              onChange={handleChange('password')}
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
