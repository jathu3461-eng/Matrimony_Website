import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button, ErrorCard } from '../components/ui';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function PhoneVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, user, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const phone = location.state?.phone || '';
  const userData = location.state?.userData || null;
  const flow = location.state?.flow || 'signup';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [otpSent, setOtpSent] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no phone in state
  if (!phone) return <Navigate to="/signup" replace />;

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Send OTP on mount
  useEffect(() => {
    if (phone && !otpSent) {
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOtp = async () => {
    setSending(true);
    setServerError('');
    try {
      await api.post('/auth/phone-otp/send', { phone_number: phone });
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || sending) return;
    sendOtp();
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) {
      const newOtp = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      setActiveIndex(nextIndex);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setServerError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const res = await api.post('/auth/phone-otp/verify', {
        phone_number: phone,
        otp: code,
      });

      if (res.data.user) {
        setUser(res.data.user);
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile/new', { replace: true });
        }, 1200);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Invalid code. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;
  if (success) {
    return (
      <AuthLayout title="auth_phone_verify_title" hideToggle>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-full bg-[var(--success)] flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-extrabold text-[var(--ink)] font-display mb-2">
            Phone Verified!
          </h2>
          <p className="text-sm text-[var(--ink-soft)]">
            Redirecting you to complete your profile…
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="auth_phone_verify_title"
      subtitle="auth_phone_verify_subtitle"
      hideToggle
    >
      <motion.div variants={stagger} initial="hidden" animate="show">
        {serverError && (
          <motion.div variants={fadeUp} className="mb-5">
            <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
            <Phone className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <div>
              <p className="text-xs text-[var(--ink-faint)] font-medium">Sending code to</p>
              <p className="text-sm font-bold text-[var(--ink)]">{phone}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6">
          <label className="block text-xs font-bold text-[var(--ink-soft)] mb-3">
            Enter the 6-digit code
          </label>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                onFocus={() => setActiveIndex(index)}
                className={`w-full aspect-square text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
                  digit
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                    : activeIndex === index
                    ? 'border-[var(--primary)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_0_0_4px_var(--focus-ring)]'
                    : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)]'
                }`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Button
            type="button"
            fullWidth
            loading={loading}
            onClick={handleVerify}
            disabled={otp.join('').length !== OTP_LENGTH}
            className="mb-4"
          >
            <span className="flex items-center justify-center gap-2">
              Verify Phone Number
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center">
          {cooldown > 0 ? (
            <p className="text-xs text-[var(--ink-faint)] font-medium">
              Resend code in{' '}
              <span className="text-[var(--primary)] font-bold">
                {cooldown}s
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-[var(--ink-faint)] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
          Your phone number is kept private and secure
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
