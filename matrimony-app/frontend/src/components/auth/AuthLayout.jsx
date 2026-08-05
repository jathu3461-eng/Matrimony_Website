import { motion } from 'framer-motion';
import { Heart, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const BRAND_POINTS = [
  { icon: ShieldCheck, title: '100% Verified', sub: 'Trusted profiles only' },
  { icon: Sparkles, title: 'Smart Matches', sub: 'AI-powered compatibility' },
  { icon: Users, title: 'Happy Stories', sub: 'Millions of couples' },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brand = { label: 'Sign in', to: '/login' },
  wide = false,
}) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8 px-4 grad-hero">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40 blur-3xl bg-[radial-gradient(circle,#ff7ab3,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl bg-[radial-gradient(circle,#ff5f9e,transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl bg-[radial-gradient(circle,#e0136a,transparent_70%)]" />

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

            <div className="relative z-10 p-10 flex flex-col h-full">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 fill-current" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-extrabold text-lg leading-none tracking-tight">Mukurtham</p>
                  <p className="text-white/70 text-[11px] font-semibold mt-0.5">Where families meet forever</p>
                </div>
              </div>

              <div className="mt-auto pt-10">
                <h2 className="font-display text-3xl font-extrabold leading-tight">
                  Your perfect
                  <br />
                  life partner
                  <br />
                  <span className="text-[#ffd3e6]">is one click away.</span>
                </h2>
                <p className="text-white/80 text-sm mt-4 leading-relaxed">
                  A trusted matrimony for the Tamil community — built on family values,
                  verified profiles and genuine matches.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {BRAND_POINTS.map(({ icon: Icon, title: tt, sub }) => (
                    <div key={tt} className="rounded-2xl bg-white/12 backdrop-blur-sm border border-white/15 p-3">
                      <Icon className="w-5 h-5 mb-2 text-[#ffd3e6]" aria-hidden="true" />
                      <p className="text-[12px] font-bold leading-tight">{tt}</p>
                      <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Form panel ── */}
          <div className="bg-[var(--surface)] p-7 sm:p-10 flex flex-col">
            <div className={`flex items-center justify-between mb-7 ${wide ? '' : ''}`}>
              <Link to="/" className="flex items-center gap-2 md:hidden">
                <div className="w-9 h-9 rounded-xl grad-primary flex items-center justify-center shadow">
                  <Heart className="w-5 h-5 text-white fill-current" aria-hidden="true" />
                </div>
                <span className="font-display font-extrabold text-lg text-[var(--ink)]">Mukurtham</span>
              </Link>
              <div className="hidden md:block">
                <p className="text-[11px] text-[var(--ink-faint)] font-semibold">Secure &amp; private</p>
              </div>
              {brand && (
                <div className="ml-auto md:ml-0">
                  <p className="text-sm text-[var(--ink-soft)] font-semibold">
                    {brand.prefix}{' '}
                    <Link to={brand.to} className="font-bold text-[var(--primary)] hover:underline">
                      {brand.label}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h1 className="font-display text-[1.6rem] font-extrabold text-[var(--ink)] leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-7 pt-5 border-t border-[var(--border)]">{footer}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
