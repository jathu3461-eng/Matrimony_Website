import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, Lock, Sparkles, Headphones, Gift, Check } from 'lucide-react';
import api from '../api';
import { useI18n } from '../context/I18nContext';
import ProfileCard from '../components/ProfileCard';
import { Button, Badge } from '../components/ui';

// ─── Disney / Pixar Style Cute 3D Couple Hero Illustration SVG ────────────────
function DisneyCoupleHeroIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center">
      {/* Soft glowing ambient background halo */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-300 via-pink-200 to-rose-200 blur-2xl opacity-70"
      />

      {/* Disney Cartoon SVG Illustration */}
      <svg className="w-full h-full relative z-10 drop-shadow-2xl" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Moon & Lanterns */}
        <circle cx="250" cy="220" r="160" fill="url(#moonGrad)" opacity="0.4" />

        {/* Floating Lanterns */}
        <g opacity="0.8">
          <rect x="70" y="80" width="20" height="28" rx="6" fill="#ffb703" />
          <path d="M70 94 H90" stroke="#fb8500" strokeWidth="2" />
          <rect x="400" y="110" width="24" height="32" rx="6" fill="#ffb703" />
          <path d="M400 126 H424" stroke="#fb8500" strokeWidth="2" />
        </g>

        {/* Groom (Left Character) */}
        <g transform="translate(90, 80)">
          {/* Hair */}
          <path d="M70 60 C50 30 110 10 140 30 C160 20 170 50 160 80 Z" fill="#1f110b" />
          {/* Head */}
          <circle cx="115" cy="100" r="48" fill="#f8d0b0" />
          <path d="M68 60 C80 35 150 35 162 60 C140 45 90 45 68 60 Z" fill="#1a0c06" />
          {/* Eyes */}
          <ellipse cx="98" cy="102" rx="7" ry="9" fill="#2d1206" />
          <ellipse cx="132" cy="102" rx="7" ry="9" fill="#2d1206" />
          <circle cx="96" cy="99" r="2.5" fill="#ffffff" />
          <circle cx="130" cy="99" r="2.5" fill="#ffffff" />
          {/* Eyebrows */}
          <path d="M88 88 Q98 83 108 88" stroke="#1f110b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M122 88 Q132 83 142 88" stroke="#1f110b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M96 122 Q115 138 134 122" stroke="#d97757" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Ears */}
          <circle cx="67" cy="102" r="10" fill="#f8d0b0" />
          <circle cx="163" cy="102" r="10" fill="#f8d0b0" />
          {/* Outfit - Cream Kurta & Dupatta */}
          <path d="M50 160 Q115 140 180 160 L195 320 H35 Z" fill="#fff9ef" />
          {/* Gold collar embroidery */}
          <path d="M100 150 L115 175 L130 150" stroke="#f59e0b" strokeWidth="4" fill="none" />
          <path d="M80 160 Q115 220 150 160" stroke="#e11d48" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        {/* Bride (Right Character) */}
        <g transform="translate(210, 95)">
          {/* Long Hair */}
          <path d="M50 80 Q20 180 40 280 Q100 320 160 280 Q180 180 150 80 Z" fill="#120703" />
          {/* Head */}
          <circle cx="100" cy="95" r="44" fill="#fae2cd" />
          {/* Hairline & Flowers */}
          <path d="M60 70 Q100 45 140 70 Q120 50 80 50 Z" fill="#120703" />
          <circle cx="62" cy="72" r="6" fill="#f43f5e" />
          <circle cx="70" cy="65" r="6" fill="#f59e0b" />
          <circle cx="138" cy="72" r="6" fill="#f43f5e" />
          {/* Bindi & Maang Tikka */}
          <circle cx="100" cy="74" r="3" fill="#e11d48" />
          <path d="M100 50 V70" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="100" cy="68" r="4" fill="#fbbf24" />
          {/* Eyes with Eyelashes */}
          <ellipse cx="82" cy="98" rx="7" ry="9" fill="#2d1206" />
          <ellipse cx="118" cy="98" rx="7" ry="9" fill="#2d1206" />
          <circle cx="80" cy="95" r="2.5" fill="#ffffff" />
          <circle cx="116" cy="95" r="2.5" fill="#ffffff" />
          {/* Lashes */}
          <path d="M74 90 L78 86 M86 86 L90 90" stroke="#120703" strokeWidth="2" />
          <path d="M110 90 L114 86 M122 86 L126 90" stroke="#120703" strokeWidth="2" />
          {/* Nose Ring */}
          <circle cx="90" cy="106" r="3" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          {/* Smile */}
          <path d="M84 116 Q100 132 116 116" stroke="#e11d48" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Necklace & Gold Jewelry */}
          <path d="M72 135 Q100 155 128 135" stroke="#fbbf24" strokeWidth="5" fill="none" />
          <circle cx="100" cy="148" r="4" fill="#e11d48" />
          {/* Saree - Crimson Pink with Gold Pallu */}
          <path d="M40 145 Q100 130 160 145 L180 310 H20 Z" fill="#e11d48" />
          <path d="M60 145 Q120 220 180 300" stroke="#fbbf24" strokeWidth="12" fill="none" opacity="0.9" />
        </g>

        {/* Floating Sparkles & Hearts */}
        <g>
          <text x="235" y="70" fontSize="28" fill="#f43f5e">💖</text>
          <text x="60" y="240" fontSize="20" fill="#fbbf24">✨</text>
          <text x="420" y="280" fontSize="22" fill="#fbbf24">✨</text>
          <text x="240" y="340" fontSize="24" fill="#f43f5e">💕</text>
        </g>

        <defs>
          <radialGradient id="moonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(250 220) scale(160)">
            <stop stopColor="#ffd1dc" />
            <stop offset="1" stopColor="#e0b0ff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [recommendedProfiles, setRecommendedProfiles] = useState([]);
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

  const featureCards = [
    { icon: <ShieldCheck className="w-6 h-6" aria-hidden="true" />, title: 'Verified Profiles', desc: '100% Genuine & Manually Verified Profiles' },
    { icon: <Lock className="w-6 h-6" aria-hidden="true" />, title: 'Privacy First', desc: 'Your Privacy Is Our Top Priority Always' },
    { icon: <Sparkles className="w-6 h-6" aria-hidden="true" />, title: 'Smart Matches', desc: 'AI Powered Matchmaking That Understands You' },
    { icon: <Headphones className="w-6 h-6" aria-hidden="true" />, title: '24/7 Support', desc: 'We Are Here To Help You Anytime' },
    { icon: <Gift className="w-6 h-6" aria-hidden="true" />, title: 'Premium Benefits', desc: 'Unlock Exclusive Features & Better Connections' },
  ];

  const testimonials = [
    { name: 'Priya & Arjun 💕', text: 'Thanks to Mukurtham, we found each other and our families are now one big happy family!' },
    { name: 'Neha & Suresh 💖', text: 'The journey from a profile view to a life together. Forever grateful!' },
    { name: 'Kavya & Rohan 💞', text: 'Genuine platform with genuine people. We found our happily ever after.' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* ── 1. Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-5 pt-8 pb-12">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-12 gap-8 items-center">

          {/* Left Column: Headline & Search Form */}
          <div className="md:col-span-7 text-left z-10">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="primary" icon={<span>💖</span>} className="mb-4">
                Trusted by Millions. Loved for Happiness.
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-[var(--ink)] leading-[1.15] mb-4">
                Find Your Perfect <span className="text-gradient">Life Partner</span> <br />
                Begin Your Beautiful Journey 💕
              </h1>

              <p className="text-sm sm:text-base text-[var(--ink-soft)] max-w-lg mb-8 leading-relaxed font-medium">
                Lakhs of happy couples. Find your perfect life partner today rooted in Tamil culture and diaspora values.
              </p>
            </motion.div>

            {/* Floating Glassmorphic Pill Search Form */}
            <motion.form
              onSubmit={handleSearchSubmit}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-card rounded-3xl p-5 shadow-[var(--shadow-elevated)] max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💖</span>
                <h3 className="font-display text-base font-extrabold text-[var(--ink)]">Find Your Match</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1">I am looking for a</label>
                  <select
                    className="input-base text-xs font-bold py-2 px-3"
                    value={searchFilter.gender}
                    onChange={(e) => setSearchFilter({ ...searchFilter, gender: e.target.value })}
                  >
                    <option value="F">Bride (பெண்)</option>
                    <option value="M">Groom (ஆண்)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1">Age</label>
                  <select
                    className="input-base text-xs font-bold py-2 px-3"
                    value={searchFilter.age}
                    onChange={(e) => setSearchFilter({ ...searchFilter, age: e.target.value })}
                  >
                    <option value="18-25">18 - 25 yrs</option>
                    <option value="22-35">22 - 35 yrs</option>
                    <option value="35-50">35 - 50 yrs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1">Religion</label>
                  <select
                    className="input-base text-xs font-bold py-2 px-3"
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
                  <label className="block text-[10px] font-extrabold text-[var(--ink-faint)] uppercase tracking-wider mb-1">Mother Tongue</label>
                  <select
                    className="input-base text-xs font-bold py-2 px-3"
                    value={searchFilter.language}
                    onChange={(e) => setSearchFilter({ ...searchFilter, language: e.target.value })}
                  >
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="English">English</option>
                    <option value="Any">Any Language</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button type="submit">
                  <Search className="w-4 h-4" aria-hidden="true" /> Search Matches <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  Advanced Search
                </button>
              </div>
            </motion.form>
          </div>

          {/* Right Column: Pixar Disney Couple Vector Illustration */}
          <div className="md:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <img
                src="/uploads/hero_couple.png"
                alt="Professional Matrimony Couple"
                className="w-full max-w-md mx-auto rounded-3xl shadow-2xl border-4 border-white object-cover aspect-square"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/uploads/couple_hero.png';
                }}
              />
            </motion.div>

            {/* Success floating badge overlay */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-6 right-2 glass-card px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-lg">👩‍❤️‍👨</div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-[var(--ink)]">50,000+</p>
                <p className="text-[10px] font-bold text-[var(--primary)]">Success Stories</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── 2. Feature Cards Section ── */}
      <section className="max-w-7xl mx-auto px-5 my-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {featureCards.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl p-4 text-center border border-[var(--border)] flex flex-col items-center justify-center"
            >
              <span className="text-[var(--primary)] mb-2">{f.icon}</span>
              <h4 className="font-display text-xs font-extrabold text-[var(--ink)] mb-1">{f.title}</h4>
              <p className="text-[10px] text-[var(--ink-faint)] font-medium leading-tight">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. Recommended Profiles & Create Dream Profile Banner ── */}
      <section className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid md:grid-cols-12 gap-8 items-start">

          {/* Left 8 Cols: Recommended Profiles Grid */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)]">Handpicked For You</span>
                <h2 className="font-display text-2xl font-extrabold text-[var(--ink)] flex items-center gap-2">
                  Recommended Matches 💖
                </h2>
              </div>
              <button onClick={() => navigate('/search')} className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedProfiles.length > 0 ? (
                recommendedProfiles.map((p) => <ProfileCard key={p.id} profile={p} />)
              ) : (
                /* Fallback Demo Profile Cards */
                [
                  { id: 101, name: 'Ananya', age: 26, city_or_state: 'Chennai', occupation: 'Software Engineer', gender: 'F', is_verified: 1 },
                  { id: 102, name: 'Karthik', age: 28, city_or_state: 'Coimbatore', occupation: 'Business Analyst', gender: 'M', is_verified: 1 },
                  { id: 103, name: 'Meera', age: 24, city_or_state: 'Madurai', occupation: 'Doctor', gender: 'F', is_verified: 1 },
                  { id: 104, name: 'Vikram', age: 29, city_or_state: 'Trichy', occupation: 'Product Manager', gender: 'M', is_verified: 1 },
                ].map((p) => <ProfileCard key={p.id} profile={p} />)
              )}
            </div>
          </div>

          {/* Right 4 Cols: "Create Your Dream Profile" CTA Banner */}
          <div className="md:col-span-4">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass-card rounded-3xl p-6 border-2 border-[var(--border-strong)] bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 text-left relative overflow-hidden shadow-[var(--shadow-elevated)]"
            >
              <span className="text-xs font-extrabold text-[var(--primary)] uppercase tracking-wider block mb-1">Join Free Today</span>
              <h3 className="font-display text-2xl font-extrabold text-[var(--ink)] mb-3">
                Create Your <br />
                <span className="text-gradient">Dream Profile ✨</span>
              </h3>

              <ul className="space-y-2 text-xs font-bold text-[var(--ink-soft)] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" /> Get more match responses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" /> Increase profile visibility
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--success)]" aria-hidden="true" /> 10-Porutham horoscope check
                </li>
              </ul>

              <Button fullWidth onClick={() => navigate('/signup')}>
                Create Profile Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── 4. Vibrant Statistics Counter Banner ── */}
      <section className="max-w-7xl mx-auto px-5 my-12">
        <div className="glass-card-dark rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
            <div>
              <span className="text-3xl mb-1 block">👫</span>
              <p className="font-display text-3xl font-extrabold text-pink-300">10M+</p>
              <p className="text-xs text-pink-100/70 font-semibold">Happy Members</p>
            </div>
            <div>
              <span className="text-3xl mb-1 block">💖</span>
              <p className="font-display text-3xl font-extrabold text-pink-300">50K+</p>
              <p className="text-xs text-pink-100/70 font-semibold">Success Stories</p>
            </div>
            <div>
              <span className="text-3xl mb-1 block">🛡️</span>
              <p className="font-display text-3xl font-extrabold text-pink-300">25L+</p>
              <p className="text-xs text-pink-100/70 font-semibold">Verified Profiles</p>
            </div>
            <div>
              <span className="text-3xl mb-1 block">🌐</span>
              <p className="font-display text-3xl font-extrabold text-pink-300">1000+</p>
              <p className="text-xs text-pink-100/70 font-semibold">Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Success Stories & Testimonials ── */}
      <section className="max-w-7xl mx-auto px-5 py-12 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Real Stories, Real Happiness</span>
        <h2 className="font-display text-3xl font-extrabold text-[var(--ink)] mb-10">
          Couples Who Found Forever 💕
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              whileHover={{ y: -6 }}
              className="glass-card rounded-3xl p-6 text-left border border-[var(--border)] flex flex-col justify-between"
            >
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-medium mb-4 italic">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-lg shadow-sm">
                  👩‍❤️‍👨
                </div>
                <div>
                  <h4 className="font-display text-xs font-extrabold text-[var(--ink)]">{t.name}</h4>
                  <span className="text-[10px] font-semibold text-[var(--primary)]">Verified Couple</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 6. Romantic Scooter CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-5 my-12">
        <div className="grad-primary rounded-3xl p-10 text-white text-center relative overflow-hidden shadow-[var(--shadow-pop)]">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
              Your Forever Is Just A Click Away 💕
            </h2>
            <p className="text-sm text-pink-50 mb-8 font-medium">
              Join millions of happy individuals and find your perfect life partner today.
            </p>
            <Button
              onClick={() => navigate('/signup')}
              size="lg"
              className="!bg-white !text-[var(--primary-strong)] !shadow-[0_10px_30px_-6px_rgba(255,255,255,0.5)]"
            >
              Register Free Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
