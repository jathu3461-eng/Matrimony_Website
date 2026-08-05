import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, ErrorCard } from '../components/ui';
import { loginSchema, normalizeApiErrors } from '../lib/validation';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, user, loading: authLoading } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const showErr = (f) => (touchedFields[f] ? errors[f]?.message : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      const res = await api.post('/auth/login', values);
      if (res.data.status === 'pending_approval') {
        navigate('/broker-pending');
      } else {
        setUser(res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      const fieldErrors = normalizeApiErrors(err.response?.data);
      if (Object.keys(fieldErrors).length) {
        for (const [k, msg] of Object.entries(fieldErrors)) setError(k, { message: msg });
      } else {
        setServerError(err.response?.data?.error || 'Invalid credentials or account unapproved');
      }
    }
  });

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle={
        <>
          Glad to see you again. Login to continue your journey
          <br className="hidden sm:block" /> to find your perfect life partner.
        </>
      }
      brand={{ prefix: 'New to Mukurtham?', label: 'Create an account', to: '/signup' }}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {['bg-[#ffd3e6]', 'bg-[#ffc9de]', 'bg-[#ffb6d9]', 'bg-[#ff9ec9]'].map((c, i) => (
                <span key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[var(--surface)]`} />
              ))}
            </div>
            <span className="text-[10px] text-[var(--ink-soft)] font-semibold leading-tight">
              Trusted by the Tamil community worldwide
            </span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="font-extrabold text-[var(--primary)] text-sm">10M+</span>
            <span className="text-[10px] text-[var(--ink-soft)] font-semibold leading-tight">happy matches made</span>
          </div>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {serverError && (
          <div className="mb-5">
            <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField
            label="Email or Mobile Number"
            placeholder="name@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={showErr('email')}
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />

          <TextField
            label="Password"
            type={showPw ? 'text' : 'password'}
            icon={<Lock className="w-4 h-4" />}
            error={showErr('password')}
            autoComplete="current-password"
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
            {...register('password')}
          />

          <div className="text-right -mt-1">
            <Link to="/forgot-password" className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-strong)] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
            Login
          </Button>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
