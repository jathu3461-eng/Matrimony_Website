import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import { uploadsUrl } from '../../api';

const BENEFITS = [
  'Get more match responses',
  'Increase profile visibility',
  '10+ Porutham Horoscope Check',
  'Verified Profile Badge',
  'AI Smart Match Recommendations',
];

export default function CtaBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goCreate = () => navigate(user ? '/dashboard' : '/signup');

  return (
    <section className="max-w-7xl mx-auto px-5 py-10 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="glass-cta relative overflow-hidden rounded-[28px]"
      >
        {/* Animated glow decorations */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,95,158,0.5),transparent_70%)] blur-2xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 -left-14 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,180,190,0.55),transparent_70%)] blur-2xl pointer-events-none"
        />
        <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-[var(--primary)]/30 pointer-events-none" />
        <div className="absolute bottom-16 left-8 w-2 h-2 rounded-full bg-amber-300/70 pointer-events-none" />
        {/* Subtle ring shapes */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/60 pointer-events-none" />
        <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/50 pointer-events-none" />

        <div className="flex flex-col relative z-10">
          {/* ── Top: illustration ── */}
          <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden flex items-end justify-center">
            <img
              src={uploadsUrl('auth-couple.png')}
              alt="Wedding couple"
              className="w-[70%] h-[90%] object-contain drop-shadow-lg"
            />
          </div>

          {/* ── Bottom: copy ── */}
          <div className="px-7 pt-2 pb-9 flex flex-col items-center text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--primary)] mb-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
              Join Free Today
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="font-display text-2xl sm:text-[28px] lg:text-[30px] xl:text-3xl font-extrabold text-[var(--ink)] leading-tight mb-2"
            >
              Create Your Dream Profile <span className="text-gradient">✨</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.26 }}
              className="text-[13px] leading-relaxed text-[var(--ink-soft)] font-medium mb-4 max-w-lg mx-auto"
            >
              Find your perfect life partner with verified profiles and AI-powered smart matching.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.34 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 mb-6 max-w-lg mx-auto"
            >
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-[12px] font-bold text-[var(--ink-soft)]">
                  <span className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-[var(--success-soft)] border border-[var(--success)]/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[var(--success)]" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {b}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.42 }}
            >
              <Button
                onClick={goCreate}
                size="lg"
                className="!rounded-full !px-9 !py-4 !text-[15px] !font-extrabold !shadow-[0_18px_40px_-10px_rgba(224,19,106,0.6)] hover:!-translate-y-1 hover:!shadow-[0_24px_50px_-10px_rgba(224,19,106,0.7)] transition-all duration-300"
              >
                Create Profile Now
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
