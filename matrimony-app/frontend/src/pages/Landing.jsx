import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, Lock, Sparkles, Headphones, Gift, Check, HeartHandshake, BadgeCheck } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import { Button, Badge, TiltCard } from '../components/ui';
import CtaBanner from '../components/landing/CtaBanner';

// ─── Flat Vector Couple Hero Illustration (SVG fallback if no photo exists) ───
function CoupleHeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-300 via-pink-200 to-rose-200 blur-2xl opacity-70"
      />
      <svg className="w-full h-full relative z-10 drop-shadow-2xl" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="250" cy="220" r="160" fill="url(#heroMoonGrad)" opacity="0.4" />
        <g transform="translate(90, 80)">
          <path d="M70 60 C50 30 110 10 140 30 C160 20 170 50 160 80 Z" fill="#1f110b" />
          <circle cx="115" cy="100" r="48" fill="#f8d0b0" />
          <path d="M68 60 C80 35 150 35 162 60 C140 45 90 45 68 60 Z" fill="#1a0c06" />
          <ellipse cx="98" cy="102" rx="7" ry="9" fill="#2d1206" />
          <ellipse cx="132" cy="102" rx="7" ry="9" fill="#2d1206" />
          <circle cx="96" cy="99" r="2.5" fill="#ffffff" />
          <circle cx="130" cy="99" r="2.5" fill="#ffffff" />
          <path d="M88 88 Q98 83 108 88" stroke="#1f110b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M122 88 Q132 83 142 88" stroke="#1f110b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M96 122 Q115 138 134 122" stroke="#d97757" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="67" cy="102" r="10" fill="#f8d0b0" />
          <circle cx="163" cy="102" r="10" fill="#f8d0b0" />
          <path d="M50 160 Q115 140 180 160 L195 320 H35 Z" fill="#fff9ef" />
          <path d="M100 150 L115 175 L130 150" stroke="#f59e0b" strokeWidth="4" fill="none" />
          <path d="M80 160 Q115 220 150 160" stroke="#e11d48" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(210, 95)">
          <path d="M50 80 Q20 180 40 280 Q100 320 160 280 Q180 180 150 80 Z" fill="#120703" />
          <circle cx="100" cy="95" r="44" fill="#fae2cd" />
          <path d="M60 70 Q100 45 140 70 Q120 50 80 50 Z" fill="#120703" />
          <circle cx="62" cy="72" r="6" fill="#f43f5e" />
          <circle cx="70" cy="65" r="6" fill="#f59e0b" />
          <circle cx="138" cy="72" r="6" fill="#f43f5e" />
          <circle cx="100" cy="74" r="3" fill="#e11d48" />
          <path d="M100 50 V70" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="100" cy="68" r="4" fill="#fbbf24" />
          <ellipse cx="82" cy="98" rx="7" ry="9" fill="#2d1206" />
          <ellipse cx="118" cy="98" rx="7" ry="9" fill="#2d1206" />
          <circle cx="80" cy="95" r="2.5" fill="#ffffff" />
          <circle cx="116" cy="95" r="2.5" fill="#ffffff" />
          <path d="M74 90 L78 86 M86 86 L90 90" stroke="#120703" strokeWidth="2" />
          <path d="M110 90 L114 86 M122 86 L126 90" stroke="#120703" strokeWidth="2" />
          <circle cx="90" cy="106" r="3" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          <path d="M84 116 Q100 132 116 116" stroke="#e11d48" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M72 135 Q100 155 128 135" stroke="#fbbf24" strokeWidth="5" fill="none" />
          <circle cx="100" cy="148" r="4" fill="#e11d48" />
          <path d="M40 145 Q100 130 160 145 L180 310 H20 Z" fill="#e11d48" />
          <path d="M60 145 Q120 220 180 300" stroke="#fbbf24" strokeWidth="12" fill="none" opacity="0.9" />
        </g>
        <g>
          <text x="235" y="70" fontSize="28" fill="#f43f5e">💖</text>
          <text x="60" y="240" fontSize="20" fill="#fbbf24">✨</text>
          <text x="420" y="280" fontSize="22" fill="#fbbf24">✨</text>
          <text x="240" y="340" fontSize="24" fill="#f43f5e">💕</text>
        </g>
        <defs>
          <radialGradient id="heroMoonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(250 220) scale(160)">
            <stop stopColor="#ffd1dc" />
            <stop offset="1" stopColor="#e0b0ff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedProfiles, setRecommendedProfiles] = useState([]);
  const [heroImgIndex, setHeroImgIndex] = useState(0);
  const heroSources = ['/uploads/hero_couple.png', '/uploads/couple_hero.png'];
  const [searchFilter, setSearchFilter] = useState({ gender: 'F', age: '22-35', religion: 'Hindu', language: 'Tamil' });

  useEffect(() => {
    api.get('/profiles/search').then((res) => {
      setRecommendedProfiles((res.data.results || []).slice(0, 4));
    }).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchFilter.gender) params.set('gender', searchFilter.gender);
    navigate(`/search?${params.toString()}`);
  };

  const goRegister = () => navigate(user ? '/dashboard' : '/signup');

  const selectCls = 'input-base text-xs font-bold py-3 px-3.5';

  const featurePills = [
    { icon: <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />, label: '100% Verified Profiles' },
    { icon: <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />, label: 'AI Smart Matching' },
    { icon: <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Privacy First' },
  ];

  const testimonials = [
    { name: 'Priya & Arjun', text: 'Thanks to Mukurtham, we found each other and our families are now one big happy family!' },
    { name: 'Neha & Suresh', text: 'The journey from a profile view to a life together. Forever grateful!' },
    { name: 'Kavya & Rohan', text: 'Genuine platform with genuine people. We found our happily ever after.' },
  ];

  const fallbackProfiles = [
    { id: 101, name: 'Ananya', age: 26, city_or_state: 'Chennai', occupation: 'Software Engineer', gender: 'F', is_verified: 1 },
    { id: 102, name: 'Karthik', age: 28, city_or_state: 'Coimbatore', occupation: 'Business Analyst', gender: 'M', is_verified: 1 },
    { id: 103, name: 'Meera', age: 24, city_or_state: 'Madurai', occupation: 'Doctor', gender: 'F', is_verified: 1 },
    { id: 104, name: 'Vikram', age: 29, city_or_state: 'Trichy', occupation: 'Product Manager', gender: 'M', is_verified: 1 },
  ];

  const stats = [
    { value: '50K+', label: 'Success Stories' },
    { value: '10K+', label: 'Verified Profiles' },
    { value: '5K+', label: 'Matches / Day' },
    { value: '98%', label: 'Member Satisfaction' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="relative pt-10 pb-28 lg:pt-14 lg:pb-32 px-5">
        {/* Ambient glows */}
        <div className="absolute -top-20 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(255,95,158,0.28),transparent_70%)] blur-2xl pointer-events-none" />
        <div className="absolute top-24 right-0 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(255,180,190,0.3),transparent_70%)] blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(224,19,106,0.16),transparent_70%)] blur-2xl pointer-events-none" />

        {/* Floating decorative hearts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="float-blob absolute top-16 left-[8%] text-2xl opacity-30">💕</span>
          <span className="float-blob absolute top-40 right-[12%] text-xl opacity-25" style={{ animationDelay: '1.2s' }}>💖</span>
          <span className="float-blob absolute bottom-24 left-[45%] text-lg opacity-20" style={{ animationDelay: '2.1s' }}>💞</span>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
          {/* Left: copy */}
          <div className="lg:col-span-6 text-left">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="primary" icon={<span>💖</span>} className="mb-5">
                Trusted by Millions. Loved for Happiness.
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold text-[var(--ink)] leading-[1.12] mb-5">
                Find Your Perfect <span className="text-gradient">Life Partner</span> <br />
                Begin Your Beautiful Journey
              </h1>

              <p className="text-sm sm:text-base text-[var(--ink-soft)] max-w-lg mb-8 leading-relaxed font-medium">
                Lakhs of happy couples. Find your perfect life partner today rooted in Tamil culture and diaspora values — with verified profiles and AI-powered smart matching.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Button onClick={goRegister} size="lg" className="!rounded-full !px-8 !shadow-[0_18px_40px_-10px_rgba(224,19,106,0.55)] hover:!-translate-y-1">
                  Create Profile Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button onClick={() => navigate('/search')} variant="secondary" size="lg" className="!rounded-full !px-7">
                  <Search className="w-4 h-4" aria-hidden="true" /> Search Matches
                </Button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {featurePills.map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink-soft)] bg-white/70 border border-white/80 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-[var(--success)]">{p.icon}</span>
                    {p.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: couple photo in elegant arch frame */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="relative max-w-md mx-auto"
            >
              <TiltCard max={7} scale={1.03} className="perspective">
              <div className="relative rounded-t-full rounded-b-[2rem] overflow-hidden border-[6px] border-white shadow-[var(--shadow-pop)] bg-gradient-to-b from-pink-100 via-rose-50 to-pink-50 aspect-[4/5]">
                {heroImgIndex < heroSources.length ? (
                  <img
                    src={heroSources[heroImgIndex]}
                    alt="Happy Indian couple"
                    className="w-full h-full object-cover"
                    onError={() => setHeroImgIndex((i) => i + 1)}
                  />
                ) : (
                  <CoupleHeroIllustration />
                )}

                {/* Overlay gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1226]/25 via-transparent to-transparent pointer-events-none" />
              </div>
              </TiltCard>

              {/* Floating: success badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 left-2 glass-card px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-lg">👩‍❤️‍👨</div>
                <div className="text-left">
                  <p className="text-sm font-extrabold text-[var(--ink)]">50,000+</p>
                  <p className="text-[10px] font-bold text-[var(--primary)]">Success Stories</p>
                </div>
              </motion.div>

              {/* Floating: horoscope badge */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute -top-3 -right-2 glass-card px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--success-soft)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-extrabold text-[var(--ink)]">10+ Porutham</p>
                  <p className="text-[10px] font-bold text-[var(--success)]">Horoscope Check</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. FULL-WIDTH SEARCH MATCHES CARD ═══════════════ */}
      <section className="relative z-20 max-w-7xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="glass-card rounded-[28px] p-6 lg:p-8 shadow-[var(--shadow-pop)] bg-white/80 backdrop-blur-xl border border-white/80 -mt-20 lg:-mt-24"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl grad-primary text-white flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-[var(--ink)]">Find Your Match</h3>
                <p className="text-[11px] font-semibold text-[var(--ink-faint)]">Search lakhs of verified Tamil profiles</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Advanced Search <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} noValidate>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">I am looking for a</label>
                <select
                  className={selectCls}
                  value={searchFilter.gender}
                  onChange={(e) => setSearchFilter({ ...searchFilter, gender: e.target.value })}
                >
                  <option value="F">Bride (பெண்)</option>
                  <option value="M">Groom (ஆண்)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Age</label>
                <select
                  className={selectCls}
                  value={searchFilter.age}
                  onChange={(e) => setSearchFilter({ ...searchFilter, age: e.target.value })}
                >
                  <option value="18-25">18 - 25 yrs</option>
                  <option value="22-35">22 - 35 yrs</option>
                  <option value="35-50">35 - 50 yrs</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Religion</label>
                <select
                  className={selectCls}
                  value={searchFilter.religion}
                  onChange={(e) => setSearchFilter({ ...searchFilter, religion: e.target.value })}
                >
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Any">Any Religion</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Mother Tongue</label>
                <select
                  className={selectCls}
                  value={searchFilter.language}
                  onChange={(e) => setSearchFilter({ ...searchFilter, language: e.target.value })}
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="English">English</option>
                  <option value="Any">Any Language</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" size="lg" fullWidth className="!rounded-2xl !py-3.5">
                  <Search className="w-4 h-4" aria-hidden="true" /> Search Matches <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </section>

      {/* ═══════════════ 3. TRUST STATS STRIP ═══════════════ */}
      <section className="max-w-7xl mx-auto px-5 mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl px-5 py-6 text-center lift">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-gradient">{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)] mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════ 4. PREMIUM CTA BANNER ═══════════════ */}
      <CtaBanner />

      {/* ═══════════════ 5. FEATURED PROFILES ═══════════════ */}
      <section className="max-w-7xl mx-auto px-5 py-12 lg:py-16">
        <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)]">Handpicked For You</span>
            <h2 className="font-display text-3xl font-extrabold text-[var(--ink)] flex items-center gap-2 mt-1">
              Featured Profiles 💖
            </h2>
            <p className="text-xs text-[var(--ink-faint)] font-semibold mt-1">
              Meet verified members ready for a beautiful journey ahead
            </p>
          </div>
          <button onClick={() => navigate('/search')} className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline">
            View All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {(recommendedProfiles.length > 0 ? recommendedProfiles : fallbackProfiles).map((p) => (
            <motion.div key={p.id} {...reveal}>
              <ProfileCard profile={p} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 6. SUCCESS STORIES ═══════════════ */}
      <section className="relative py-16 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface-muted)] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 relative">
          <motion.div {...reveal} className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)]">Real Stories, Real Happiness</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] mt-2 mb-3">
              Couples Who Found Forever 💕
            </h2>
            <p className="text-sm text-[var(--ink-soft)] font-medium max-w-xl mx-auto">
              Every week, more couples write their love stories with us.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' }}
                whileHover={{ y: -6 }}
                className="glass-card rounded-3xl p-6 text-left border border-[var(--border)] flex flex-col justify-between"
              >
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed font-medium mb-5">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center text-lg shadow-md border-2 border-white">
                    <HeartHandshake className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold text-[var(--ink)]">{t.name}</h4>
                    <span className="text-[10px] font-bold text-[var(--primary)] flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" aria-hidden="true" /> Verified Couple
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. MEMBERSHIP PLANS ═══════════════ */}
    </div>
  );
}
