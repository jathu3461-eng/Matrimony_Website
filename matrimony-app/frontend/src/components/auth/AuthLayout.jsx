import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles, Users, Lock, Languages, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import { uploadsUrl } from '../../api';

const BRAND_POINTS = [
  { icon: ShieldCheck, titleKey: 'auth_brand_verified', subKey: 'auth_brand_verified_sub' },
  { icon: Sparkles, titleKey: 'auth_brand_matches', subKey: 'auth_brand_matches_sub' },
  { icon: Users, titleKey: 'auth_brand_stories', subKey: 'auth_brand_stories_sub' },
];

function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  const toggle = () => setLang(lang === 'en' ? 'ta' : 'en');
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.93 }}
      onClick={toggle}
      type="button"
      title={lang === 'ta' ? 'Switch to English' : 'தமிழில் காண'}
      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5
        ${lang === 'ta'
          ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 text-white border-pink-400 shadow shadow-pink-500/30'
          : 'bg-white text-pink-600 border-pink-300 hover:bg-pink-50'} ${className}`}
    >
      <Languages className="w-3.5 h-3.5" aria-hidden="true" />
      <AnimatePresence mode="wait">
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
        >
          {lang === 'ta' ? 'English' : 'தமிழ்'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function AuthIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(255,95,158,0.5),transparent_70%)] blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 0.85, 1.1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,180,190,0.4),transparent_70%)] blur-3xl"
      />

      {/* 3D Rotating rings */}
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute w-72 h-72 border border-white/10 rounded-full"
        style={{ transformStyle: 'preserve-3d' }}
      />
      <motion.div
        animate={{ rotateY: [360, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute w-56 h-56 border border-white/10 rounded-full"
        style={{ transformStyle: 'preserve-3d' }}
      />

      {/* Floating hearts */}
      {[
        { x: -70, y: -50, size: 26, delay: 0, dur: 4.5 },
        { x: 60, y: -30, size: 20, delay: 0.8, dur: 5.2 },
        { x: -40, y: 55, size: 16, delay: 1.5, dur: 4.8 },
        { x: 80, y: 45, size: 22, delay: 0.3, dur: 5.5 },
        { x: -90, y: 15, size: 14, delay: 2, dur: 4.2 },
        { x: 30, y: -65, size: 12, delay: 1.8, dur: 4.0 },
      ].map((h, i) => (
        <motion.div
          key={i}
          animate={{ y: [h.y, h.y - 20, h.y], rotate: [-8, 8, -8], scale: [1, 1.15, 1] }}
          transition={{ duration: h.dur, repeat: Infinity, ease: 'easeInOut', delay: h.delay }}
          className="absolute text-pink-200/50"
          style={{ left: `calc(50% + ${h.x}px)`, top: `calc(50% + ${h.y}px)` }}
        >
          <Heart className="fill-current" style={{ width: h.size, height: h.size }} />
        </motion.div>
      ))}

      {/* Floating golden rings */}
      {[
        { x: -55, y: -15, delay: 0.5 },
        { x: 65, y: 20, delay: 1.2 },
      ].map((r, i) => (
        <motion.div
          key={`ring-${i}`}
          animate={{ rotate: [0, 360], scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: r.delay }}
          className="absolute text-amber-300/60"
          style={{ left: `calc(50% + ${r.x}px)`, top: `calc(50% + ${r.y}px)` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="5" />
          </svg>
        </motion.div>
      ))}

      {/* Floating stars */}
      {[
        { x: 45, y: -55, delay: 0.5 },
        { x: -75, y: -5, delay: 1.2 },
        { x: 65, y: 35, delay: 0.8 },
        { x: -25, y: -70, delay: 1.6 },
      ].map((s, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          className="absolute text-amber-300/50"
          style={{ left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)` }}
        >
          <Star className="w-3 h-3 fill-current" />
        </motion.div>
      ))}

      {/* Floating dove */}
      <motion.div
        animate={{ x: [-80, 80, -80], y: [-20, -35, -20], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute text-white/30"
        style={{ top: 'calc(50% - 70px)' }}
      >
        <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor" opacity="0.35">
          <path d="M2 12 C6 2, 14 0, 26 8 C18 4, 10 6, 2 12Z" />
          <path d="M2 12 C6 8, 10 6, 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* ── Main Couple Image ── */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        {/* Glow ring behind image */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(255,215,180,0.5),transparent_70%)] blur-xl"
        />
        <img
          src={uploadsUrl('auth-couple.png')}
          alt="Bride and Groom"
          className="relative w-56 h-56 object-cover rounded-full drop-shadow-2xl border-4 border-white/20"
        />
      </motion.div>

      {/* Floating badge — Verified */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-6 left-6 z-20 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
      >
        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-white">100% Verified</p>
          <p className="text-[9px] text-white/70 font-medium">Secure & Private</p>
        </div>
      </motion.div>

      {/* Floating badge — AI Matching */}
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [3, -3, 3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-10 right-2 z-20 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
      >
        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-200" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-white">AI Matching</p>
          <p className="text-[9px] text-white/70 font-medium">Smart Results</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brand,
  hideToggle = false,
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 px-4 grad-hero">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40 blur-3xl bg-[radial-gradient(circle,#ff7ab3,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl bg-[radial-gradient(circle,#ff5f9e,transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl bg-[radial-gradient(circle,#e0136a,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card overflow-hidden shadow-[var(--shadow-pop)] grid md:grid-cols-2"
          style={{ perspective: '1200px' }}
        >
          {/* ── Brand panel with 3D illustration ── */}
          <div className="relative hidden md:flex flex-col overflow-hidden bg-[linear-gradient(160deg,#e0136a_0%,#c00f5c_45%,#8a0f45_100%)] text-white">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute bottom-1/4 -left-20 w-56 h-56 rounded-full bg-white/10" />

            <div className="relative z-10 p-8 flex flex-col h-full">

              {/* 3D Animated illustration area */}
              <div className="flex-1 flex items-center justify-center my-4">
                <AuthIllustration />
              </div>

              <div className="mt-auto">
                <h2 className="font-display text-2xl font-extrabold leading-tight">
                  {t('auth_brand_headline_a')}
                  <br />
                  <span className="text-[#ffd3e6]">{t('auth_brand_headline_b')}</span>
                </h2>
                <p className="text-white/80 text-xs mt-3 leading-relaxed">
                  {t('auth_brand_desc')}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {BRAND_POINTS.map(({ icon: Icon, titleKey, subKey }) => (
                    <motion.div
                      key={titleKey}
                      whileHover={{ y: -3, scale: 1.03 }}
                      className="rounded-2xl bg-white/12 backdrop-blur-sm border border-white/15 p-2.5"
                    >
                      <Icon className="w-4 h-4 mb-1.5 text-[#ffd3e6]" aria-hidden="true" />
                      <p className="text-[10px] font-bold leading-tight">{t(titleKey)}</p>
                      <p className="text-white/60 text-[9px] mt-0.5 leading-tight">{t(subKey)}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5">
                  <div className="flex -space-x-1.5">
                    {['bg-[#ffd3e6]', 'bg-[#ffc9de]', 'bg-[#ffb6d9]', 'bg-[#ff9ec9]'].map((c, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 * i, type: 'spring', stiffness: 300 }}
                        className={`w-6 h-6 rounded-full ${c} border-2 border-[#a00d4e]`}
                      />
                    ))}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-bold">{t('auth_trusted_community')}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">
                      10M+ <span className="text-white/60">{t('auth_happy_matches')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="bg-[var(--surface)] p-7 sm:p-10 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-7">
              <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--ink-faint)] font-semibold">
                <Lock className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
                {t('auth_secure_private')}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                {!hideToggle && <LanguageToggle />}
                {brand && (
                  <div className="hidden sm:block">
                    <p className="text-sm text-[var(--ink-soft)] font-semibold">
                      {t(brand.prefixKey)}{' '}
                      <Link to={brand.to} className="font-bold text-[var(--primary)] hover:underline">
                        {t(brand.labelKey)}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="font-display text-[1.6rem] font-extrabold text-[var(--ink)] leading-tight"
              >
                {t(title)}
              </motion.h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed"
                >
                  {t(subtitle)}
                </motion.p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
            >
              {children}
            </motion.div>

            {footer && <div className="mt-7 pt-5 border-t border-[var(--border)]">{footer}</div>}

            {brand && (
              <div className="sm:hidden mt-6 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--ink-soft)] font-semibold">
                  {t(brand.prefixKey)}{' '}
                  <Link to={brand.to} className="font-bold text-[var(--primary)] hover:underline">
                    {t(brand.labelKey)}
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
