import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles, Users, Lock, Languages, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';

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
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,95,158,0.5),transparent_70%)] blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,180,190,0.4),transparent_70%)] blur-3xl"
      />

      {/* 3D Rotating ring */}
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute w-64 h-64 border-2 border-white/15 rounded-full"
        style={{ transformStyle: 'preserve-3d' }}
      />
      <motion.div
        animate={{ rotateY: [360, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute w-48 h-48 border border-white/10 rounded-full"
        style={{ transformStyle: 'preserve-3d' }}
      />

      {/* Floating hearts */}
      {[
        { x: -60, y: -40, size: 28, delay: 0, dur: 4.5 },
        { x: 50, y: -20, size: 22, delay: 0.8, dur: 5.2 },
        { x: -30, y: 50, size: 18, delay: 1.5, dur: 4.8 },
        { x: 70, y: 40, size: 24, delay: 0.3, dur: 5.5 },
        { x: -80, y: 20, size: 16, delay: 2, dur: 4.2 },
      ].map((h, i) => (
        <motion.div
          key={i}
          animate={{ y: [h.y, h.y - 18, h.y], rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
          transition={{ duration: h.dur, repeat: Infinity, ease: 'easeInOut', delay: h.delay }}
          className="absolute text-pink-200/60"
          style={{ left: `calc(50% + ${h.x}px)`, top: `calc(50% + ${h.y}px)` }}
        >
          <Heart className="fill-current" style={{ width: h.size, height: h.size }} />
        </motion.div>
      ))}

      {/* Floating stars */}
      {[
        { x: 40, y: -60, delay: 0.5 },
        { x: -70, y: -10, delay: 1.2 },
        { x: 60, y: 30, delay: 0.8 },
      ].map((s, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          className="absolute text-amber-300/50"
          style={{ left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)` }}
        >
          <Star className="w-3 h-3 fill-current" />
        </motion.div>
      ))}

      {/* Main couple SVG illustration */}
      <motion.svg
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 w-52 h-52 drop-shadow-2xl"
        viewBox="0 0 300 300"
        fill="none"
      >
        {/* Background circle */}
        <circle cx="150" cy="150" r="130" fill="url(#bgGrad)" opacity="0.15" />
        <circle cx="150" cy="150" r="100" fill="url(#bgGrad)" opacity="0.1" />

        {/* Groom */}
        <g transform="translate(55, 40)">
          {/* Hair */}
          <path d="M40 35 C25 10 85 10 100 35 C110 25 115 45 105 60 Z" fill="#1a0c06" />
          {/* Face */}
          <circle cx="72" cy="72" r="35" fill="#f8d0b0" />
          {/* Eyes */}
          <ellipse cx="58" cy="74" rx="5" ry="6.5" fill="#2d1206" />
          <ellipse cx="86" cy="74" rx="5" ry="6.5" fill="#2d1206" />
          <circle cx="56.5" cy="72.5" r="2" fill="#fff" />
          <circle cx="84.5" cy="72.5" r="2" fill="#fff" />
          {/* Eyebrows */}
          <path d="M50 62 Q58 57 66 62" stroke="#1a0c06" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M78 62 Q86 57 94 62" stroke="#1a0c06" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M58 88 Q72 100 86 88" stroke="#d97757" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Ears */}
          <circle cx="37" cy="72" r="7" fill="#f8d0b0" />
          <circle cx="107" cy="72" r="7" fill="#f8d0b0" />
          {/* Body - white shirt */}
          <path d="M30 120 Q72 100 115 120 L125 200 H20 Z" fill="#fff9ef" />
          {/* Shirt collar detail */}
          <path d="M55 120 L65 140 L75 120" stroke="#e8d5c4" strokeWidth="1.5" fill="none" />
          {/* Tie/malai */}
          <path d="M55 128 Q72 165 90 128" stroke="#e11d48" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>

        {/* Bride */}
        <g transform="translate(140, 35)">
          {/* Hair */}
          <path d="M30 55 Q10 130 25 210 Q70 240 120 210 Q140 130 120 55 Z" fill="#120703" />
          {/* Face */}
          <circle cx="75" cy="68" r="32" fill="#fae2cd" />
          {/* Hair bun decoration */}
          <circle cx="45" cy="52" r="5" fill="#f43f5e" />
          <circle cx="52" cy="47" r="5" fill="#f59e0b" />
          <circle cx="108" cy="52" r="5" fill="#f43f5e" />
          <circle cx="75" cy="56" r="3" fill="#e11d48" />
          {/* Hair ornament chain */}
          <path d="M75 40 V52" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="75" cy="50" r="3" fill="#fbbf24" />
          {/* Eyes */}
          <ellipse cx="60" cy="70" rx="5" ry="6.5" fill="#2d1206" />
          <ellipse cx="90" cy="70" rx="5" ry="6.5" fill="#2d1206" />
          <circle cx="58.5" cy="68.5" r="2" fill="#fff" />
          <circle cx="88.5" cy="68.5" r="2" fill="#fff" />
          {/* Eyebrows */}
          <path d="M52 60 Q60 55 68 60" stroke="#120703" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M82 60 Q90 55 98 60" stroke="#120703" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Bindi */}
          <circle cx="75" cy="58" r="2.5" fill="#e11d48" />
          {/* Nose ring */}
          <circle cx="72" cy="76" r="1.5" fill="#fbbf24" />
          {/* Smile */}
          <path d="M60 84 Q75 96 90 84" stroke="#d97757" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Ears */}
          <circle cx="43" cy="68" r="6" fill="#fae2cd" />
          <circle cx="107" cy="68" r="6" fill="#fae2cd" />
          {/* Earrings */}
          <circle cx="43" cy="78" r="3" fill="#fbbf24" />
          <circle cx="107" cy="78" r="3" fill="#fbbf24" />
          {/* Body - saree */}
          <path d="M20 120 Q75 95 130 120 L140 220 H10 Z" fill="#e11d48" />
          <path d="M20 120 Q75 95 130 120 L140 220 H10 Z" fill="url(#sareeGrad)" />
          {/* Necklace */}
          <path d="M45 120 Q75 140 105 120" stroke="#fbbf24" strokeWidth="3" fill="none" />
          <circle cx="75" cy="132" r="4" fill="#fbbf24" />
        </g>

        {/* Heart between them */}
        <motion.g
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M140 170 C140 160 130 150 120 155 C110 150 100 160 100 170 C100 185 120 195 120 195 C120 195 140 185 140 170Z"
            fill="#ff5f9e"
            opacity="0.8"
          />
        </motion.g>

        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="300" y2="300">
            <stop offset="0%" stopColor="#fff0f6" />
            <stop offset="100%" stopColor="#ffd3e6" />
          </linearGradient>
          <linearGradient id="sareeGrad" x1="20" y1="120" x2="140" y2="220">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Floating badge */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-8 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
      >
        <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold text-white">100% Verified</p>
          <p className="text-[9px] text-white/70 font-medium">Secure & Private</p>
        </div>
      </motion.div>

      {/* Floating badge right */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-12 right-4 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
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
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 6 }}
                  className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                >
                  <Heart className="w-6 h-6 fill-current" aria-hidden="true" />
                </motion.div>
                <div>
                  <p className="font-display font-extrabold text-lg leading-none tracking-tight">Mukurtham</p>
                  <p className="text-white/70 text-[11px] font-semibold mt-0.5">{t('auth_brand_tagline')}</p>
                </div>
              </div>

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
              <Link to="/" className="flex items-center gap-2 md:hidden">
                <div className="w-9 h-9 rounded-xl grad-primary flex items-center justify-center shadow">
                  <Heart className="w-5 h-5 text-white fill-current" aria-hidden="true" />
                </div>
                <span className="font-display font-extrabold text-lg text-[var(--ink)]">Mukurtham</span>
              </Link>
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
