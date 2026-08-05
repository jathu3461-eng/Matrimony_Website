import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, Badge, ErrorCard } from '../components/ui';
import { forgotPasswordSchema, resetPasswordSchema, normalizeApiErrors } from '../lib/validation';

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
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

  const showErr = (form, f) => (form.formState.touchedFields[f] ? form.formState.errors[f]?.message : undefined);

  const requestOtp = requestForm.handleSubmit(async ({ email: em }) => {
    setServerError('');
    try {
      const res = await api.post('/auth/forgot-password/request', { email: em });
      setEmail(em);
      setDemoOtp(res.data.demo_otp || '');
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
      resetForm.setError('password', { message: 'Password too weak. Required: Min 8 chars, 1 uppercase, 1 special character' });
      return;
    }
    try {
      await api.post('/auth/forgot-password/reset', { email, otp: otpForm.getValues('otp'), new_password: password });
      navigate('/login');
    } catch (err) {
      const fe = normalizeApiErrors(err.response?.data);
      if (Object.keys(fe).length) {
        for (const [k, msg] of Object.entries(fe)) resetForm.setError(k, { message: msg });
      } else {
        setServerError(err.response?.data?.error || 'Reset failed');
      }
    }
  });

  const titles = {
    1: 'Reset your password',
    2: 'Enter the verification code',
    3: 'Choose a new password',
  };

  return (
    <AuthLayout title={titles[step]} subtitle="We’ll help you get back in securely." brand={undefined}>
      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            {n > 1 && <div className={`h-1 w-8 rounded-full ${n <= step ? 'grad-primary' : 'bg-[var(--border-strong)]'}`} />}
            <Badge variant={n === step ? 'primary' : n < step ? 'success' : 'neutral'}>{n}</Badge>
          </div>
        ))}
        <span className="ml-auto text-xs font-bold text-[var(--ink-faint)]">Step {step} of 3</span>
      </div>

      {demoOtp && step === 2 && (
        <div className="mb-5 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[13px] font-semibold text-[var(--ink-soft)]">
          Demo mode (no email service configured): your code is{' '}
          <strong className="text-[var(--primary)] font-extrabold tracking-widest">{demoOtp}</strong>
        </div>
      )}

      {serverError && (
        <div className="mb-5">
          <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
        </div>
      )}

      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {step === 1 && (
          <form onSubmit={requestOtp} noValidate className="space-y-4">
            <TextField
              label="Email Address"
              placeholder="name@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={showErr(requestForm, 'email')}
              autoComplete="email"
              {...requestForm.register('email')}
            />
            <Button type="submit" fullWidth loading={requestForm.formState.isSubmitting}>
              Send Reset Code
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} noValidate className="space-y-4">
            <TextField
              label="6-digit Code"
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
            <Button type="submit" fullWidth loading={otpForm.formState.isSubmitting}>
              Verify Code
            </Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} noValidate className="space-y-4">
            <TextField
              label="New Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              error={showErr(resetForm, 'password')}
              autoComplete="new-password"
              {...resetForm.register('password')}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              error={showErr(resetForm, 'confirm_password')}
              autoComplete="new-password"
              {...resetForm.register('confirm_password')}
            />
            <Button type="submit" fullWidth loading={resetForm.formState.isSubmitting}>
              Reset Password
            </Button>
          </form>
        )}

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm font-bold text-[var(--primary)] hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
