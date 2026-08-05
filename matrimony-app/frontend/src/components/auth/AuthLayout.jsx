import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles, Users, Lock, Languages } from 'lucide-react';
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
      <div className="pointer-events-none absolute top-16 left-1/2 w-40 h-40 rounded-full opacity-25 blur-2xl bg-[radial-gradient(circle,#fff0f5,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-card overflow-hidden shadow-[var(--shadow-pop)] grid md:grid-cols-2"
        >
          {/* ── Brand panel ── */}
          <div className="relative hidden md:flex flex-col overflow-hidden bg-[linear-gradient(160deg,#e0136a_0%,#c00f5c_45%,#8a0f45_100%)] text-white">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute bottom-1/4 -left-20 w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute top-1/3 left-1/2 w-40 h-40 rounded-full bg-black/10" />
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-16 left-10 text-white/25"
            >
              <Heart className="w-20 h-20 fill-current" />
            </motion.div>

            <div className="relative z-10 p-10 flex flex-col h-full">
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

              <div className="mt-auto pt-10">
                <h2 className="font-display text-3xl font-extrabold leading-tight">
                  {t('auth_brand_headline_a')}
                  <br />
                  <span className="text-[#ffd3e6]">{t('auth_brand_headline_b')}</span>
                </h2>
                <p className="text-white/80 text-sm mt-4 leading-relaxed">
                  {t('auth_brand_desc')}
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {BRAND_POINTS.map(({ icon: Icon, titleKey, subKey }) => (
                    <div key={titleKey} className="rounded-2xl bg-white/12 backdrop-blur-sm border border-white/15 p-3">
                      <Icon className="w-5 h-5 mb-2 text-[#ffd3e6]" aria-hidden="true" />
                      <p className="text-[12px] font-bold leading-tight">{t(titleKey)}</p>
                      <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{t(subKey)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {['bg-[#ffd3e6]', 'bg-[#ffc9de]', 'bg-[#ffb6d9]', 'bg-[#ff9ec9]'].map((c, i) => (
                      <span key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[#a00d4e]`} />
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
          <div className="bg-[var(--surface)] p-7 sm:p-10 flex flex-col">
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
              <h1 className="font-display text-[1.6rem] font-extrabold text-[var(--ink)] leading-tight">{t(title)}</h1>
              {subtitle && <p className="text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">{t(subtitle)}</p>}
            </div>

            {children}

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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
