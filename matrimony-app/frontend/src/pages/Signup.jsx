import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, ErrorCard } from '../components/ui';
import { createSignupSchema, normalizeApiErrors, passwordRules } from '../lib/validation';

const RULES = [
  { key: 'min8', label: 'At least 8 characters' },
  { key: 'upper', label: 'One uppercase letter (A-Z)' },
  { key: 'special', label: 'One special character (!@#$…)' },
];

function PasswordChecklist({ value }) {
  const rules = passwordRules(value);
  return (
    <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3 animate-[fade-in-up_0.2s_ease-out_both]">
      {RULES.map((r) => {
        const ok = rules[r.key];
        return (
          <span key={r.key} className={`pw-rule ${ok ? 'pw-rule-ok' : ''}`}>
            <span className="pw-rule-icon">{ok && <Check className="w-3 h-3" aria-hidden="true" />}</span>
            {r.label}
          </span>
        );
      })}
    </div>
  );
}

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isBroker, setIsBroker] = useState(params.get('role') === 'broker');
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = useMemo(() => createSignupSchema(isBroker), [isBroker]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      username: '', email: '', password: '', phone_number: '',
      business_name: '', terms: false,
    },
  });

  const passwordValue = watch('password');
  const pwOk = passwordRules(passwordValue).all;

  const showErr = (f) => (touchedFields[f] ? errors[f]?.message : undefined);

  const toggleRole = (broker) => {
    if (broker === isBroker) return;
    setIsBroker(broker);
    clearErrors(['business_name', 'terms']);
    resetField('business_name');
    setServerError('');
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    if (!values.terms) {
      setError('terms', { type: 'manual', message: 'Please accept the Terms & Conditions and Privacy Policy' });
      return;
    }

    let formattedPhone = values.phone_number.trim();
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    }

    const payload = {
      username: values.username.trim().replace(/\s+/g, '_'),
      email: values.email.trim(),
      password: values.password,
      phone_number: formattedPhone,
      business_name: isBroker ? values.business_name.trim() : undefined,
      role: isBroker ? 'broker' : 'regular',
    };

    try {
      const res = await api.post('/auth/signup', payload);
      if (res.data.status === 'pending_approval') {
        navigate('/broker-pending');
      } else {
        setUser(res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      const fieldErrors = normalizeApiErrors(err.response?.data);
      if (Object.keys(fieldErrors).length) {
        for (const [k, msg] of Object.entries(fieldErrors)) setError(k, { message: msg });
      } else {
        setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
      }
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your beautiful journey — create your profile in minutes."
      brand={{ prefix: 'Already have an account?', label: 'Login', to: '/login' }}
      footer={
        <p className="text-center text-xs text-[var(--ink-soft)] font-semibold leading-relaxed">
          By creating an account you agree to our
          <LinkToTerms />
        </p>
      }
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {/* Role switcher */}
        <div className="flex gap-1.5 p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] mb-5" role="tablist" aria-label="Account type">
          {[
            { v: false, label: 'Individual', icon: User },
            { v: true, label: 'Broker / Agency', icon: Building2 },
          ].map(({ v, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={isBroker === v}
              onClick={() => toggleRole(v)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                isBroker === v ? 'grad-primary text-white shadow-md' : 'text-[var(--ink-soft)] hover:text-[var(--primary)]'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {serverError && (
          <div className="mb-5">
            <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField
            label="Full Name"
            placeholder="e.g. Sutharsan"
            icon={<User className="w-4 h-4" />}
            error={showErr('username')}
            autoComplete="name"
            {...register('username')}
          />
          <TextField
            label="Email Address"
            placeholder="name@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={showErr('email')}
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Mobile Number"
              placeholder="+14165550198"
              icon={<Phone className="w-4 h-4" />}
              error={showErr('phone_number')}
              autoComplete="tel"
              inputMode="tel"
              {...register('phone_number')}
            />
            <TextField
              label="Create Password"
              type={showPw ? 'text' : 'password'}
              icon={<Lock className="w-4 h-4" />}
              error={showErr('password')}
              success={touchedFields.password && !errors.password && passwordValue ? 'Looks strong!' : undefined}
              autoComplete="new-password"
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
          </div>

          {touchedFields.password && passwordValue && (
            <PasswordChecklist value={passwordValue} />
          )}

          <AnimatePresence>
            {isBroker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  label="Business / Agency Name"
                  placeholder="Agency or business name"
                  icon={<Building2 className="w-4 h-4" />}
                  error={showErr('business_name')}
                  {...register('business_name')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('terms')}
              className="mt-0.5 w-4 h-4 accent-[var(--primary)]"
            />
            <span className={`text-[11px] font-semibold leading-tight ${errors.terms ? 'text-[var(--error)]' : 'text-[var(--ink-soft)]'}`}>
              I agree to the <span className="text-[var(--primary)] hover:underline cursor-pointer">Terms &amp; Conditions</span> and{' '}
              <span className="text-[var(--primary)] hover:underline cursor-pointer">Privacy Policy</span>
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs font-semibold text-[var(--error)] -mt-1" role="alert">{errors.terms.message}</p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            success={pwOk && !isSubmitting}
            className="mt-2"
          >
            {isBroker ? 'Register as Broker' : 'Create Account'}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-faint)] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Your details are encrypted and never shared without consent
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}

function LinkToTerms() {
  return (
    <span className="text-[var(--primary)] font-bold hover:underline cursor-pointer">
      {' '}Terms &amp; Conditions and Privacy Policy
    </span>
  );
}
