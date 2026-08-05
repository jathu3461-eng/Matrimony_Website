import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, TextField, ErrorCard } from '../components/ui';
import { createSignupSchema, normalizeApiErrors, passwordRules } from '../lib/validation';

const VAL_MSG_KEYS = {
  Required: 'err_required',
  'Enter at least 2 characters': 'err_name_min',
  'Too long (maximum 60 characters)': 'err_name_max',
  "Letters, spaces, and ' . - only": 'err_name_chars',
  'Invalid email format (e.g. name@example.com)': 'err_email_format',
  'Minimum 8 characters': 'err_pw_min',
  'Needs at least 1 uppercase letter and 1 special character': 'err_pw_rules',
  'Enter a valid phone number (e.g. +14165550198)': 'err_phone',
  'Required. Minimum 2 characters': 'err_business_min',
  'Too long (maximum 80 characters)': 'err_business_max',
  'Confirm your password': 'err_confirm_required',
  'Passwords do not match': 'err_confirm_match',
};

const RULES = [
  { key: 'min8', labelKey: 'auth_rule_min8' },
  { key: 'upper', labelKey: 'auth_rule_upper' },
  { key: 'special', labelKey: 'auth_rule_special' },
];

function PasswordChecklist({ value, t }) {
  const rules = passwordRules(value);
  return (
    <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3 animate-[fade-in-up_0.2s_ease-out_both]">
      {RULES.map(({ key, labelKey }) => {
        const ok = rules[key];
        return (
          <span key={key} className={`pw-rule ${ok ? 'pw-rule-ok' : ''}`}>
            <span className="pw-rule-icon">{ok && <Check className="w-3 h-3" aria-hidden="true" />}</span>
            {t(labelKey)}
          </span>
        );
      })}
    </div>
  );
}

function StrengthMeter({ score, label }) {
  const cols = [
    { min: 1, color: 'bg-[var(--error)]' },
    { min: 2, color: 'bg-amber-400' },
    { min: 3, color: 'bg-[var(--success)]' },
  ];
  return (
    <div className="mt-1.5 flex items-center gap-2 animate-[fade-in-up_0.2s_ease-out_both]">
      <div className="flex gap-1 flex-1">
        {cols.map((c, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${score >= c.min ? c.color : 'bg-[var(--border)]'}`}
          />
        ))}
      </div>
      {label && <span className="text-[10px] font-bold text-[var(--ink-faint)] whitespace-nowrap">{label}</span>}
    </div>
  );
}

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [isBroker, setIsBroker] = useState(params.get('role') === 'broker');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = useMemo(() => createSignupSchema(isBroker), [isBroker]);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      username: '', email: '', password: '', confirm_password: '', phone_number: '',
      business_name: '', terms: false,
    },
  });

  const passwordValue = watch('password');
  const pwOk = passwordRules(passwordValue).all;
  const pwScore = passwordRules(passwordValue).all
    ? 3
    : Object.values(passwordRules(passwordValue)).filter(Boolean).length - 1;

  const strengthLabel = pwScore === 3 ? t('auth_strength_strong') : pwScore === 2 ? t('auth_strength_good') : pwScore === 1 ? t('auth_strength_weak') : null;

  const localize = (msg) => (msg && VAL_MSG_KEYS[msg] ? t(VAL_MSG_KEYS[msg]) : msg);

  const showErr = (f) => localize(touchedFields[f] ? errors[f]?.message : undefined);
  const showSuccess = (f, value) => (touchedFields[f] && !errors[f] && value ? true : false);

  const toggleRole = (broker) => {
    if (broker === isBroker) return;
    setIsBroker(broker);
    clearErrors(['business_name', 'terms', 'confirm_password']);
    resetField('business_name');
    setServerError('');
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    if (!getValues('terms')) {
      setError('terms', { type: 'manual', message: t('err_terms') });
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

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="auth_signup_title"
      subtitle="auth_signup_subtitle"
      brand={{ prefixKey: 'auth_already_have', labelKey: 'auth_login_here', to: '/login' }}
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {/* Role switcher */}
        <div className="flex gap-1.5 p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] mb-5" role="tablist" aria-label="Account type">
          {[
            { v: false, labelKey: 'auth_individual', icon: User },
            { v: true, labelKey: 'auth_broker', icon: Building2 },
          ].map(({ v, labelKey, icon: Icon }) => (
            <button
              key={labelKey}
              type="button"
              role="tab"
              aria-selected={isBroker === v}
              onClick={() => toggleRole(v)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-extrabold transition-all ${
                isBroker === v ? 'grad-primary text-white shadow-md' : 'text-[var(--ink-soft)] hover:text-[var(--primary)]'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {t(labelKey)}
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
            label={t('auth_full_name')}
            placeholder={t('auth_full_name_placeholder')}
            icon={<User className="w-4 h-4" />}
            error={showErr('username')}
            success={showSuccess('username', touchedFields.username) ? t('auth_valid') : undefined}
            autoComplete="name"
            {...register('username')}
          />
          <TextField
            label={t('auth_email_label')}
            placeholder={t('auth_email_placeholder')}
            icon={<Mail className="w-4 h-4" />}
            error={showErr('email')}
            success={showSuccess('email', touchedFields.email) ? t('auth_valid') : undefined}
            autoComplete="email"
            inputMode="email"
            {...register('email')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label={t('auth_mobile_label')}
              placeholder={t('auth_mobile_placeholder')}
              icon={<Phone className="w-4 h-4" />}
              error={showErr('phone_number')}
              success={showSuccess('phone_number', touchedFields.phone_number) ? t('auth_valid') : undefined}
              autoComplete="tel"
              inputMode="tel"
              {...register('phone_number')}
            />
            <TextField
              label={t('auth_create_password')}
              type={showPw ? 'text' : 'password'}
              icon={<Lock className="w-4 h-4" />}
              error={showErr('password')}
              success={showSuccess('password', passwordValue) ? t('auth_looks_strong') : undefined}
              autoComplete="new-password"
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
          </div>

          {touchedFields.password && passwordValue && (
            <>
              <PasswordChecklist value={passwordValue} t={t} />
              <StrengthMeter score={pwScore} label={strengthLabel} />
            </>
          )}

          <TextField
            label={t('auth_confirm_password')}
            placeholder={t('auth_confirm_placeholder')}
            type={showConfirm ? 'text' : 'password'}
            icon={<Lock className="w-4 h-4" />}
            error={showErr('confirm_password')}
            success={showSuccess('confirm_password', touchedFields.confirm_password) ? t('auth_valid') : undefined}
            autoComplete="new-password"
            right={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? t('auth_hide_password') : t('auth_show_password')}
                className="absolute right-3 top-[0.8rem] text-[var(--ink-faint)] hover:text-[var(--primary)] transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('confirm_password')}
          />

          <AnimatePresence>
            {isBroker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TextField
                  label={t('auth_business_name')}
                  placeholder={t('auth_business_placeholder')}
                  icon={<Building2 className="w-4 h-4" />}
                  error={showErr('business_name')}
                  success={showSuccess('business_name', touchedFields.business_name) ? t('auth_valid') : undefined}
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
              {t('auth_terms_i_agree')}{' '}
              <span className="text-[var(--primary)] hover:underline cursor-pointer">{t('auth_terms_conditions')}</span>{' '}
              <span className="text-[var(--ink-faint)]">{t('auth_and')}</span>{' '}
              <span className="text-[var(--primary)] hover:underline cursor-pointer">{t('auth_privacy_policy')}</span>
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
            {isBroker ? t('auth_register_broker') : t('auth_register_individual')}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-faint)] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
            {t('auth_encrypted_note')}
          </div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
