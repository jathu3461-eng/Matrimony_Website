import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { useI18n } from '../context/I18nContext';
import ProfileCard from '../components/ProfileCard';

export default function Search() {
  const { t, lang } = useI18n();
  const [meta, setMeta] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const [filters, setFilters] = useState({
    gender: 'F', religion_id: '', caste_id: '', current_country_id: '',
    min_age: '', max_age: '', raasi_id: '', star_id: '',
    income_range: '', manglik_status: '', q: '',
  });

  useEffect(() => {
    api.get('/profiles/meta').then((res) => setMeta(res.data));
  }, []);

  const runSearch = async (f = filters) => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    const count = Object.entries(params).filter(([k, v]) => k !== 'gender' && v !== '').length;
    setActiveFiltersCount(count);
    setLoading(true);
    setSearchError('');
    try {
      const res = await api.get('/profiles/search', { params });
      setResults(res.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchError('Could not load matches. Please check your connection and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSearch(); }, []); // eslint-disable-line

  const set = (field) => (ev) => {
    const val = ev.target.value;
    setFilters((f) => ({ ...f, [field]: val }));
  };

  const handleClearFilters = () => {
    const cleared = {
      gender: 'F', religion_id: '', caste_id: '', current_country_id: '',
      min_age: '', max_age: '', raasi_id: '', star_id: '',
      income_range: '', manglik_status: '', q: '',
    };
    setFilters(cleared);
    runSearch(cleared);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* ── Top Header Panel (Matching mockup 3) ── */}
      <div className="rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-pink-100 via-pink-50 to-pink-200 border border-pink-200/50 shadow-md flex flex-col md:flex-row items-center justify-between p-8 md:p-12 relative">
        <div className="max-w-lg text-left z-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-pink-600 mb-2 block">Premium Matchmaking</span>
          <h1 className="font-display text-4xl font-extrabold text-slate-800 leading-tight mb-2">
            Search Your <span className="text-pink-600">Perfect Match</span>
          </h1>
          <p className="text-sm font-semibold text-slate-600">Your happy story begins here. Discover verified profiles matching your criteria. 💕</p>
        </div>
        <div className="w-full md:w-80 h-48 mt-6 md:mt-0 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
          <img
            src="/uploads/couple_hero.png"
            alt="Search Header Couple"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Find Matches Form (Mockup 3 Left Panel) ── */}
        <div className="md:col-span-4">
          <div className="glass-card rounded-3xl p-6 border border-pink-200/60 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-pink-100">
              <h3 className="font-display text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span>🔍</span> Find Matches
              </h3>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-slate-400 hover:text-pink-600 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-5 text-left">
              {/* Basics Section */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-pink-600 tracking-wider mb-2">👤 Basics</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">I am looking for</label>
                    <select className="input-base text-xs py-2" value={filters.gender} onChange={set('gender')}>
                      <option value="F">Bride (மணப்பெண்)</option>
                      <option value="M">Groom (மணமகன்)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Min Age</label>
                      <input className="input-base text-xs py-2" type="number" placeholder="18" value={filters.min_age} onChange={set('min_age')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Max Age</label>
                      <input className="input-base text-xs py-2" type="number" placeholder="50" value={filters.max_age} onChange={set('max_age')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Religion & Caste */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-pink-600 tracking-wider mb-2">🕌 Religion &amp; Caste</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Religion</label>
                    <select className="input-base text-xs py-2" value={filters.religion_id} onChange={set('religion_id')}>
                      <option value="">Any Religion</option>
                      {meta?.religions.map((r) => <option key={r.id} value={r.id}>{lang === 'ta' ? r.name_ta : r.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Caste / Saathi</label>
                    <select className="input-base text-xs py-2" value={filters.caste_id} onChange={set('caste_id')}>
                      <option value="">Any Caste</option>
                      {meta?.castes.map((c) => <option key={c.id} value={c.id}>{lang === 'ta' ? c.name_ta : c.name_en}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-pink-600 tracking-wider mb-2">📍 Location</p>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Residing Country</label>
                  <select className="input-base text-xs py-2" value={filters.current_country_id} onChange={set('current_country_id')}>
                    <option value="">Any Country</option>
                    {meta?.countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.priority ? `★ ${c.name_en}` : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Astrology & Financials */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-pink-600 tracking-wider mb-2">✨ Astrology &amp; Lifestyle</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Zodiac / Raasi</label>
                      <select className="input-base text-xs py-2" value={filters.raasi_id} onChange={set('raasi_id')}>
                        <option value="">Any</option>
                        {meta?.raasis.map((r) => <option key={r.id} value={r.id}>{lang === 'ta' ? r.name_ta : r.name_en}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Star / Nakshatram</label>
                      <select className="input-base text-xs py-2" value={filters.star_id} onChange={set('star_id')}>
                        <option value="">Any</option>
                        {meta?.stars.map((s) => <option key={s.id} value={s.id}>{lang === 'ta' ? s.name_ta : s.name_en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Annual Income</label>
                    <select className="input-base text-xs py-2" value={filters.income_range} onChange={set('income_range')}>
                      <option value="">Any</option>
                      <option value="Under $50k">Under $50k</option>
                      <option value="$50k - $100k">$50k - $100k</option>
                      <option value="$100k - $150k">$100k - $150k</option>
                      <option value="$150k+">$150k+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Manglik / Chevvai Dosham</label>
                    <select className="input-base text-xs py-2" value={filters.manglik_status} onChange={set('manglik_status')}>
                      <option value="">Any</option>
                      <option value="no">No Dosham / Non-Manglik</option>
                      <option value="yes">Chevvai Dosham / Manglik</option>
                      <option value="dont_know">Don't Know</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Keyword Search */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-pink-600 tracking-wider mb-2">🔍 Keyword Search</p>
                <input
                  className="input-base text-xs py-2"
                  placeholder="Search job, city, or name…"
                  value={filters.q}
                  onChange={set('q')}
                />
              </div>

              <button
                type="button"
                onClick={() => runSearch(filters)}
                disabled={loading}
                className="btn-primary w-full py-3.5 text-xs font-extrabold shadow-pink-500/25 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Searching…' : 'Search Matches 🔍'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Search Results (Mockup 3 Right Panel) ── */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-800">Search Results</h2>
              {results && (
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  We found <span className="text-pink-600">{results.length}</span> matches for you
                </p>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                {activeFiltersCount} Filters Active
              </span>
            )}
          </div>

          {searchError ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-rose-200">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="font-display text-lg font-extrabold text-rose-700 mb-1">Connection Error</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-4">{searchError}</p>
              <button onClick={() => runSearch(filters)} className="btn-primary text-xs font-extrabold">
                Try Again 🔄
              </button>
            </div>
          ) : results === null || loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Finding your perfect matches…</p>
            </div>
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-3xl p-12 text-center border border-pink-100"
            >
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-lg font-extrabold text-slate-800 mb-1">No Matches Found</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Try widening your age, location, or astrology parameters to find more matches.
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-secondary text-xs mt-6 font-extrabold"
              >
                Reset Search Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {results.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
