import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, ErrorCard } from '../components/ui';
import { loginSchema, normalizeApiErrors } from '../lib/validation';

const VAL_MSG_KEYS = {
  Required: 'err_required',
  'Enter a valid email or mobile number': 'err_email_or_mobile',
  'Invalid email format (e.g. name@example.com)': 'err_email_format',
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Login() {
  const navigate = useNavigate();
  const { setUser, user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const emailValue = watch('email');
  const pwValue = watch('password');

  const localize = (msg) => (msg && VAL_MSG_KEYS[msg] ? t(VAL_MSG_KEYS[msg]) : msg);

  const showErr = (f) => localize(touchedFields[f] ? errors[f]?.message : undefined);
  const showSuccess = (f, value) => (touchedFields[f] && !errors[f] && value ? true : false);

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
      title="login_title"
      subtitle="login_sub"
      brand={{ prefixKey: 'auth_new_to', labelKey: 'auth_create_account', to: '/signup' }}
    >
      <motion.div variants={stagger} initial="hidden" animate="show">
        {serverError && (
          <motion.div variants={fadeUp} className="mb-5">
            <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
          </motion.div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <motion.div variants={fadeUp}>
            <TextField
              label={t('auth_email_or_mobile')}
              placeholder={t('auth_email_placeholder')}
              icon={<Mail className="w-4 h-4" />}
              error={showErr('email')}
              success={showSuccess('email', emailValue) ? t('auth_valid') : undefined}
              autoComplete="email"
              inputMode="email"
              {...register('email')}
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <TextField
              label={t('auth_password_label')}
              placeholder={t('auth_password_placeholder')}
              type={showPw ? 'text' : 'password'}
              icon={<Lock className="w-4 h-4" />}
              error={showErr('password')}
              autoComplete="current-password"
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? t('auth_hide_password') : t('auth_show_password')}
                  className="absolute right-3 top-[0.8rem] text-[var(--ink-faint)] hover:text-[var(--primary)] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-between -mt-1">
            <Link to="/forgot-password" className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-strong)] hover:underline flex items-center gap-1">
              {t('forgot_password')}
            </Link>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
              <span className="flex items-center gap-2">
                {t('auth_login_button')}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </motion.div>
        </form>

        <motion.div
          variants={fadeUp}
          className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-faint)] font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
          {t('auth_secure_private')}
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
