import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useI18n } from '../context/I18nContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, Badge, ErrorCard } from '../components/ui';
import { forgotPasswordSchema, resetPasswordSchema, normalizeApiErrors } from '../lib/validation';

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const VAL_MSG_KEYS = {
  Required: 'err_required',
  'Invalid email format (e.g. name@example.com)': 'err_email_format',
  'Minimum 8 characters': 'err_pw_min',
  'Needs at least 1 uppercase letter and 1 special character': 'err_pw_rules',
  'Confirm your password': 'err_confirm_required',
  'Passwords do not match': 'err_confirm_match',
  'Enter the 6-digit code': 'fp_enter_code',
  'Expected a 6 digit code': 'fp_invalid_code',
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const requestForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });
  const otpForm = useForm({
    mode: 'onTouched',
    defaultValues: { otp: '' },
  });
  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirm_password: '' },
  });

  const localize = (msg) => (msg && VAL_MSG_KEYS[msg] ? t(VAL_MSG_KEYS[msg]) : msg);
  const showErr = (form, f) => localize(form.formState.touchedFields[f] ? form.formState.errors[f]?.message : undefined);

  const requestOtp = requestForm.handleSubmit(async ({ email: em }) => {
    setServerError('');
    try {
      const res = await api.post('/auth/forgot-password/request', { email: em });
      setEmail(em);
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Could not send reset code');
    }
  });

  const verifyOtp = otpForm.handleSubmit(async ({ otp }) => {
    setServerError('');
    try {
      await api.post('/auth/forgot-password/verify', { email, otp });
      setStep(3);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Invalid or expired code');
    }
  });

  const resetPassword = resetForm.handleSubmit(async ({ password }) => {
    setServerError('');
    if (!PASSWORD_RE.test(password)) {
      resetForm.setError('password', { message: t('fp_pw_weak') });
      return;
    }
    try {
      await api.post('/auth/forgot-password/reset', { email, otp: otpForm.getValues('otp'), new_password: password });
      navigate('/login');
    } catch (err) {
      const fe = normalizeApiErrors(err.response?.data);
      if (Object.keys(fe).length) {
        for (const [k, msg] of Object.entries(fe)) resetForm.setError(k, { message: localize(msg) });
      } else {
        setServerError(err.response?.data?.error || 'Reset failed');
      }
    }
  });

  const titles = {
    1: 'fp_title_step1',
    2: 'fp_title_step2',
    3: 'fp_title_step3',
  };

  const stepIcons = { 1: Mail, 2: KeyRound, 3: Lock };

  return (
    <AuthLayout title={titles[step]} subtitle="fp_subtitle" brand={undefined}>
      {/* Step indicators */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((n) => {
            const StepIcon = stepIcons[n];
            const isActive = n === step;
            const isDone = n < step;
            return (
              <div key={n} className="flex items-center gap-3 flex-1">
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                    isDone
                      ? 'bg-[var(--success)] text-white shadow-md'
                      : isActive
                      ? 'grad-primary text-white shadow-lg'
                      : 'bg-[var(--border)] text-[var(--ink-faint)]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </motion.div>
                {n < 3 && (
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    n < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-right text-[10px] font-bold text-[var(--ink-faint)] mt-2">
          {t('step')} {step} {t('of')} 3
        </p>
      </motion.div>

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-700"
        >
          ✅ A verification code has been sent to <strong>{email}</strong>. Check your inbox and enter the 6-digit code below.
        </motion.div>
      )}

      {serverError && (
        <div className="mb-5">
          <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {step === 1 && (
            <form onSubmit={requestOtp} noValidate className="space-y-4">
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <TextField
                  label={t('auth_email_label')}
                  placeholder={t('auth_email_placeholder')}
                  icon={<Mail className="w-4 h-4" />}
                  error={showErr(requestForm, 'email')}
                  autoComplete="email"
                  {...requestForm.register('email')}
                />
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <Button type="submit" fullWidth loading={requestForm.formState.isSubmitting}>
                  <span className="flex items-center gap-2">
                    {t('fp_send_code')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </motion.div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyOtp} noValidate className="space-y-4">
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <TextField
                  label={t('fp_code_label')}
                  placeholder="000000"
                  icon={<KeyRound className="w-4 h-4" />}
                  error={showErr(otpForm, 'otp')}
                  inputMode="numeric"
                  maxLength={6}
                  {...otpForm.register('otp', {
                    required: 'Enter the 6-digit code',
                    pattern: { value: /^\d{6}$/, message: 'Expected a 6 digit code' },
                  })}
                />
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <Button type="submit" fullWidth loading={otpForm.formState.isSubmitting}>
                  <span className="flex items-center gap-2">
                    {t('fp_verify_code')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </motion.div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword} noValidate className="space-y-4">
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <TextField
                  label={t('fp_new_password')}
                  type="password"
                  icon={<Lock className="w-4 h-4" />}
                  error={showErr(resetForm, 'password')}
                  autoComplete="new-password"
                  {...resetForm.register('password')}
                />
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.08 }}>
                <TextField
                  label={t('fp_confirm_new_password')}
                  type="password"
                  icon={<Lock className="w-4 h-4" />}
                  error={showErr(resetForm, 'confirm_password')}
                  autoComplete="new-password"
                  {...resetForm.register('confirm_password')}
                />
              </motion.div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.16 }}>
                <Button type="submit" fullWidth loading={resetForm.formState.isSubmitting}>
                  {t('fp_reset_password')}
                </Button>
              </motion.div>
            </form>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6"
          >
            <Link to="/login" className="text-sm font-bold text-[var(--primary)] hover:underline flex items-center justify-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              {t('auth_back_to_login')}
            </Link>
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
