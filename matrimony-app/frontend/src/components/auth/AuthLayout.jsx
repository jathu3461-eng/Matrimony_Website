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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ perspective: '800px' }}>
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

      {/* Church silhouette background */}
      <motion.div
        animate={{ opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
      >
        <svg width="200" height="120" viewBox="0 0 200 120" fill="white" opacity="0.12">
          <rect x="85" y="20" width="30" height="100" rx="2" />
          <polygon points="100,0 70,30 130,30" />
          <rect x="96" y="5" width="8" height="20" fill="white" />
          <rect x="92" y="10" width="16" height="6" fill="white" />
          <rect x="20" y="60" width="60" height="60" rx="3" />
          <rect x="120" y="60" width="60" height="60" rx="3" />
          <circle cx="50" cy="45" r="8" />
          <circle cx="150" cy="45" r="8" />
          <rect x="40" y="100" width="20" height="20" rx="3" fill="white" opacity="0.5" />
          <rect x="140" y="100" width="20" height="20" rx="3" fill="white" opacity="0.5" />
        </svg>
      </motion.div>

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

      {/* Floating dove (peace symbol) */}
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

      {/* ── Main 3D Couple ── */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow ring behind couple */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(255,215,180,0.5),transparent_70%)] blur-xl"
        />

        <svg className="w-56 h-56 drop-shadow-2xl" viewBox="0 0 320 320" fill="none">
          {/* Background circle */}
          <circle cx="160" cy="160" r="140" fill="url(#bgGrad3d)" opacity="0.12" />
          <circle cx="160" cy="160" r="110" fill="url(#bgGrad3d)" opacity="0.08" />

          {/* ── Groom ── */}
          <g transform="translate(48, 28)">
            {/* Hair */}
            <path d="M38 32 C22 5 88 5 105 32 C115 20 120 42 108 58 Z" fill="#1a0c06" />
            {/* Hair shine */}
            <path d="M50 20 C55 10 75 8 85 15" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Face */}
            <circle cx="72" cy="72" r="36" fill="#f0c8a0" />
            <circle cx="72" cy="72" r="36" fill="url(#groomFaceShine)" opacity="0.3" />
            {/* Eyes */}
            <ellipse cx="57" cy="74" rx="5.5" ry="7" fill="#1a0800" />
            <ellipse cx="87" cy="74" rx="5.5" ry="7" fill="#1a0800" />
            <circle cx="55.5" cy="72.5" r="2.2" fill="#fff" />
            <circle cx="85.5" cy="72.5" r="2.2" fill="#fff" />
            {/* Eyebrows */}
            <path d="M48 62 Q57 56 66 62" stroke="#1a0c06" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M78 62 Q87 56 96 62" stroke="#1a0c06" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Smile */}
            <path d="M57 90 Q72 104 87 90" stroke="#d97757" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Ears */}
            <circle cx="36" cy="72" r="8" fill="#f0c8a0" />
            <circle cx="108" cy="72" r="8" fill="#f0c8a0" />
            {/* Body — white kurta with 3D shading */}
            <path d="M25 120 Q72 98 120 120 L132 210 H12 Z" fill="#fff" />
            <path d="M25 120 Q72 98 120 120 L132 210 H12 Z" fill="url(#kurtaShade)" opacity="0.4" />
            {/* Collar V */}
            <path d="M55 120 L65 142 L75 120" stroke="#e0d0c0" strokeWidth="1.8" fill="none" />
            {/* Buttons */}
            <circle cx="65" cy="148" r="1.8" fill="#d4c4b0" />
            <circle cx="65" cy="158" r="1.8" fill="#d4c4b0" />
            <circle cx="65" cy="168" r="1.8" fill="#d4c4b0" />
            {/* Sacred thread / Malai */}
            <path d="M52 126 Q72 168 92 126" stroke="#e11d48" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </g>

          {/* ── Bride ── */}
          <g transform="translate(135, 22)">
            {/* Hair flowing */}
            <path d="M28 52 C8 130 22 215 65 245 C110 245 145 215 125 130 C115 70 105 52 80 42 Z" fill="#0d0500" />
            <path d="M40 55 C30 130 35 200 60 230" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
            {/* Face */}
            <circle cx="72" cy="68" r="34" fill="#f5dcc5" />
            <circle cx="72" cy="68" r="34" fill="url(#brideFaceShine)" opacity="0.3" />
            {/* Hair ornament — matha patti */}
            <path d="M42 50 Q58 38 72 40 Q86 38 102 50" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <circle cx="55" cy="44" r="3.5" fill="#fbbf24" />
            <circle cx="72" cy="40" r="4" fill="#e11d48" />
            <circle cx="89" cy="44" r="3.5" fill="#fbbf24" />
            {/* Jhumka decorations */}
            <circle cx="38" cy="50" r="4" fill="#f59e0b" />
            <circle cx="106" cy="50" r="4" fill="#f59e0b" />
            {/* Eyes */}
            <ellipse cx="57" cy="70" rx="5.5" ry="7" fill="#1a0500" />
            <ellipse cx="87" cy="70" rx="5.5" ry="7" fill="#1a0500" />
            <circle cx="55.5" cy="68.5" r="2.2" fill="#fff" />
            <circle cx="85.5" cy="68.5" r="2.2" fill="#fff" />
            {/* Eyebrows */}
            <path d="M48 60 Q57 54 66 60" stroke="#1a0500" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M78 60 Q87 54 96 60" stroke="#1a0500" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Bindi */}
            <circle cx="72" cy="56" r="2.8" fill="#e11d48" />
            {/* Nose ring with chain */}
            <circle cx="69" cy="76" r="1.8" fill="#fbbf24" />
            <path d="M69 76 Q66 68 63 60" stroke="#fbbf24" strokeWidth="0.8" fill="none" />
            {/* Smile */}
            <path d="M58 86 Q72 100 86 86" stroke="#d97757" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Ears */}
            <circle cx="38" cy="68" r="7" fill="#f5dcc5" />
            <circle cx="106" cy="68" r="7" fill="#f5dcc5" />
            {/* Earrings */}
            <path d="M38 75 L35 85 L41 85 Z" fill="#fbbf24" />
            <path d="M106 75 L103 85 L109 85 Z" fill="#fbbf24" />
            {/* Body — red saree with gold border */}
            <path d="M15 120 Q72 92 135 120 L148 228 H5 Z" fill="#e11d48" />
            <path d="M15 120 Q72 92 135 120 L148 228 H5 Z" fill="url(#sareeGrad3d)" />
            {/* Saree gold border */}
            <path d="M15 120 Q72 92 135 120" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
            <path d="M5 228 H148" stroke="#fbbf24" strokeWidth="2" fill="none" />
            {/* Blouse neckline */}
            <path d="M50 120 Q72 110 95 120" stroke="#be123c" strokeWidth="3" fill="none" />
            {/* Necklace — layered */}
            <path d="M42 122 Q72 142 102 122" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
            <path d="M48 128 Q72 148 96 128" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <circle cx="72" cy="138" r="4.5" fill="#fbbf24" />
            <circle cx="72" cy="138" r="2.5" fill="#e11d48" />
            {/* Bangles */}
            <circle cx="20" cy="155" r="5" fill="#fbbf24" opacity="0.7" />
            <circle cx="124" cy="155" r="5" fill="#fbbf24" opacity="0.7" />
          </g>

          {/* ── Sacred fire / Mangal Pooja element ── */}
          <motion.g
            animate={{ opacity: [0.4, 0.7, 0.4], y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ellipse cx="160" cy="275" rx="18" ry="6" fill="#fbbf24" opacity="0.3" />
            <path d="M152 275 Q156 260 160 248 Q164 260 168 275" fill="#ff6b35" opacity="0.5" />
            <path d="M155 275 Q158 265 160 255 Q162 265 165 275" fill="#fbbf24" opacity="0.6" />
          </motion.g>

          {/* ── Pulsing heart between them ── */}
          <motion.g
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M148 180 C148 168 136 157 125 163 C114 157 102 168 102 180 C102 198 125 210 125 210 C125 210 148 198 148 180Z"
              fill="url(#heartGrad)"
            />
          </motion.g>

          {/* ── Thaali / Mangalsutra symbol ── */}
          <motion.g
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <circle cx="160" cy="235" r="8" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="160" cy="235" r="4" fill="#fbbf24" />
          </motion.g>

          <defs>
            <linearGradient id="bgGrad3d" x1="0" y1="0" x2="320" y2="320">
              <stop offset="0%" stopColor="#fff0f6" />
              <stop offset="100%" stopColor="#ffd3e6" />
            </linearGradient>
            <linearGradient id="sareeGrad3d" x1="15" y1="120" x2="148" y2="228">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="40%" stopColor="#be123c" />
              <stop offset="70%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id="kurtaShade" x1="12" y1="120" x2="132" y2="210">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="heartGrad" x1="102" y1="157" x2="148" y2="210">
              <stop offset="0%" stopColor="#ff5f9e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <radialGradient id="groomFaceShine" cx="0.35" cy="0.3">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="brideFaceShine" cx="0.35" cy="0.3">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating badge — Verified */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
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
        className="absolute top-10 right-2 bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg"
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
