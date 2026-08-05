import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/auth/admin-login', form);
      setUser(res.data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.errors?.password || 'Invalid admin credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3d0a2a] via-[#b31255] to-[#3d0a2a] px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="font-display text-2xl text-burgundy-700 mb-1 text-center">Admin Access</h1>
        <p className="text-xs text-center text-[#4a1230]/60 mb-6">Master Admin Portal</p>
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Admin Email">
            <input className="input-base" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Password" error={error}>
            <input type="password" className={`input-base ${error ? 'input-error' : ''}`} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">{submitting ? 'â€¦' : 'Sign In'}</button>
        </form>
      </motion.div>
    </div>
  );
}
