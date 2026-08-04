import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Field from '../components/Field';

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async (ev) => {
    ev.preventDefault();
    setErrors({});
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErrors({ email: 'Invalid Format. Expected format: name@example.com' });
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password/request', { email });
      setDemoOtp(res.data.demo_otp || '');
      setStep(2);
    } catch (err) {
      setErrors(err.response?.data?.errors || { email: 'Could not send reset code' });
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (ev) => {
    ev.preventDefault();
    setErrors({});
    if (!/^\d{6}$/.test(otp)) return setErrors({ otp: 'Invalid Format. Expected: 6 digit code' });
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password/verify', { email, otp });
      setStep(3);
    } catch (err) {
      setErrors(err.response?.data?.errors || { otp: 'Invalid or expired code' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (ev) => {
    ev.preventDefault();
    setErrors({});
    if (!PASSWORD_RE.test(newPassword)) {
      return setErrors({ new_password: 'Password too weak. Required: Min 8 chars, 1 uppercase, 1 special character' });
    }
    if (newPassword !== confirmPassword) {
      return setErrors({ confirm_password: "Passwords don't match" });
    }
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, otp, new_password: newPassword });
      navigate('/login');
    } catch (err) {
      setErrors(err.response?.data?.errors || { new_password: 'Reset failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-2xl text-burgundy-700 mb-1">Reset your password</h1>
        <p className="text-sm text-[#4a2a1a]/70 mb-6">Step {step} of 3</p>

        {step === 1 && (
          <form onSubmit={requestOtp} noValidate>
            <Field label="Email Address" error={errors.email}>
              <input className={`input-base ${errors.email ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? '…' : 'Send Code'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} noValidate>
            {demoOtp && (
              <p className="text-xs text-gold bg-gold/10 rounded-lg px-3 py-2 mb-4">
                Demo mode (no email service configured): your code is <strong>{demoOtp}</strong>
              </p>
            )}
            <Field label="6-digit Code" error={errors.otp}>
              <input className={`input-base ${errors.otp ? 'input-error' : ''}`} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </Field>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? '…' : 'Verify Code'}</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} noValidate>
            <Field label="New Password" error={errors.new_password}>
              <input type="password" className={`input-base ${errors.new_password ? 'input-error' : ''}`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
            <Field label="Confirm New Password" error={errors.confirm_password}>
              <input type="password" className={`input-base ${errors.confirm_password ? 'input-error' : ''}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Field>
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? '…' : 'Reset Password'}</button>
          </form>
        )}

        <p className="text-center text-sm text-[#4a2a1a]/70 mt-5">
          <Link to="/login" className="text-burgundy-700 font-semibold hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}
