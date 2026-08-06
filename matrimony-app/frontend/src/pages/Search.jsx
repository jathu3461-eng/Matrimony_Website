import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, RotateCcw, Users, Sparkles } from 'lucide-react';
import api from '../api';
import { useI18n } from '../context/I18nContext';
import ProfileCard from '../components/ProfileCard';
import { Button, Badge, Skeleton, ErrorCard, SelectField, TextField } from '../components/ui';

const DEFAULT_FILTERS = {
  gender: 'F', religion_id: '', caste_id: '', current_country_id: '',
  min_age: '', max_age: '', raasi_id: '', star_id: '',
  income_range: '', manglik_status: '', q: '',
};

function ResultsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="glass-card rounded-3xl overflow-hidden p-0">
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Search() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    gender: searchParams.get('gender') || 'F',
  }));

  useEffect(() => {
    api.get('/profiles/meta').then((res) => setMeta(res.data)).catch((err) => console.error(err));
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
    setFilters((f) => ({ ...f, [field]: ev.target.value }));
  };

  const handleClearFilters = () => {
    const cleared = { ...DEFAULT_FILTERS, gender: filters.gender };
    setFilters(cleared);
    runSearch(cleared);
  };

  const sectionLabel = (icon, text) => (
    <p className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold text-[var(--primary)] tracking-wider mb-2">
      <span>{icon}</span> {text}
    </p>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Top Header Panel ── */}
      <div className="rounded-3xl overflow-hidden mb-8 grad-hero border border-[var(--border)] shadow-[var(--shadow-elevated)] flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 md:p-12 relative">
        <div className="max-w-lg text-left z-10">
          <Badge variant="primary" icon={<Sparkles className="w-3 h-3" aria-hidden="true" />} className="mb-3">
            Premium Matchmaking
          </Badge>
          <h1 className="font-display text-4xl font-extrabold text-[var(--ink)] leading-tight mb-2">
            Search Your <span className="text-gradient">Perfect Match</span>
          </h1>
          <p className="text-sm font-semibold text-[var(--ink-soft)]">Your happy story begins here. Discover verified profiles matching your criteria. 💕</p>
        </div>
        <div className="w-full md:w-80 h-48 mt-6 md:mt-0 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
          <img
            src="/uploads/couple_hero.png"
            alt="Search Header Couple"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.search-hero-fallback')) {
                const div = document.createElement('div');
                div.className = 'search-hero-fallback absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50 flex items-center justify-center';
                div.innerHTML = '<svg width="120" height="120" viewBox="0 0 200 200" fill="none"><circle cx="70" cy="80" r="35" fill="#f8d0b0"/><path d="M35 70 C45 50 95 50 105 70 C85 55 55 55 35 70Z" fill="#1f110b"/><circle cx="70" cy="105" r="25" fill="#e11d48"/><circle cx="130" cy="80" r="32" fill="#fae2cd"/><path d="M105 68 C115 50 145 50 155 68 C140 55 120 55 105 68Z" fill="#120703"/><circle cx="130" cy="105" r="25" fill="#f43f5e"/><path d="M70 120 Q100 140 130 120" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/></svg>';
                parent.appendChild(div);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/60 via-rose-100/40 to-pink-50/60 pointer-events-none" />
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Filters ── */}
        <div className="md:col-span-4">
          <div className="glass-card rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <h3 className="font-display text-lg font-extrabold text-[var(--ink)] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" /> Find Matches
              </h3>
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs font-bold text-[var(--ink-faint)] hover:text-[var(--primary)] transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> Clear All
              </button>
            </div>

            <div className="space-y-5 text-left">
              <div>
                {sectionLabel('👤', 'Basics')}
                <div className="space-y-3">
                  <SelectField
                    label="I am looking for"
                    value={filters.gender}
                    onChange={set('gender')}
                    options={[
                      { value: 'F', label: 'Bride (மணப்பெண்)' },
                      { value: 'M', label: 'Groom (மணமகன்)' },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="Min Age"
                      type="number"
                      placeholder="18"
                      value={filters.min_age}
                      onChange={set('min_age')}
                    />
                    <TextField
                      label="Max Age"
                      type="number"
                      placeholder="50"
                      value={filters.max_age}
                      onChange={set('max_age')}
                    />
                  </div>
                </div>
              </div>

              <div>
                {sectionLabel('🕌', 'Religion & Caste')}
                <div className="space-y-3">
                  <SelectField
                    label="Religion"
                    value={filters.religion_id}
                    onChange={set('religion_id')}
                    placeholder="Any Religion"
                    options={(meta?.religions || []).map((r) => ({ value: String(r.id), label: lang === 'ta' ? r.name_ta : r.name_en }))}
                  />
                  <SelectField
                    label="Caste / Saathi"
                    value={filters.caste_id}
                    onChange={set('caste_id')}
                    placeholder="Any Caste"
                    options={(meta?.castes || []).map((c) => ({ value: String(c.id), label: lang === 'ta' ? c.name_ta : c.name_en }))}
                  />
                </div>
              </div>

              <div>
                {sectionLabel('📍', 'Location')}
                <SelectField
                  label="Residing Country"
                  value={filters.current_country_id}
                  onChange={set('current_country_id')}
                  placeholder="Any Country"
                  options={(meta?.countries || []).map((c) => ({
                    value: String(c.code),
                    label: c.priority ? `★ ${c.name_en}` : c.name_en,
                  }))}
                />
              </div>

              <div>
                {sectionLabel('✨', 'Astrology & Lifestyle')}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="Raasi"
                      value={filters.raasi_id}
                      onChange={set('raasi_id')}
                      placeholder="Any"
                      options={(meta?.raasis || []).map((r) => ({ value: String(r.id), label: lang === 'ta' ? r.name_ta : r.name_en }))}
                    />
                    <SelectField
                      label="Star"
                      value={filters.star_id}
                      onChange={set('star_id')}
                      placeholder="Any"
                      options={(meta?.stars || []).map((s) => ({ value: String(s.id), label: lang === 'ta' ? s.name_ta : s.name_en }))}
                    />
                  </div>
                  <SelectField
                    label="Annual Income"
                    value={filters.income_range}
                    onChange={set('income_range')}
                    placeholder="Any"
                    options={[
                      { value: 'Under $50k', label: 'Under $50k' },
                      { value: '$50k - $100k', label: '$50k - $100k' },
                      { value: '$100k - $150k', label: '$100k - $150k' },
                      { value: '$150k+', label: '$150k+' },
                    ]}
                  />
                  <SelectField
                    label="Manglik / Chevvai Dosham"
                    value={filters.manglik_status}
                    onChange={set('manglik_status')}
                    placeholder="Any"
                    options={[
                      { value: 'no', label: 'No Dosham / Non-Manglik' },
                      { value: 'yes', label: 'Chevvai Dosham / Manglik' },
                      { value: 'dont_know', label: "Don't Know" },
                    ]}
                  />
                </div>
              </div>

              <div>
                {sectionLabel('🔍', 'Keyword Search')}
                <TextField
                  label="Search job, city, or name…"
                  value={filters.q}
                  onChange={set('q')}
                  icon={<SearchIcon className="w-4 h-4" aria-hidden="true" />}
                />
              </div>

              <Button
                fullWidth
                size="lg"
                loading={loading}
                onClick={() => runSearch(filters)}
                className="mt-2"
              >
                <SearchIcon className="w-4 h-4" aria-hidden="true" /> Search Matches
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Results ── */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[var(--ink)]">Search Results</h2>
              {results && (
                <p className="text-xs text-[var(--ink-faint)] font-bold mt-0.5">
                  We found <span className="text-[var(--primary)]">{results.length}</span> matches for you
                </p>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="primary" icon={<SlidersHorizontal className="w-3 h-3" aria-hidden="true" />}>
                {activeFiltersCount} Filters Active
              </Badge>
            )}
          </div>

          {searchError ? (
            <ErrorCard
              title="Connection Error"
              message={searchError}
              onRetry={() => runSearch(filters)}
            />
          ) : results === null || loading ? (
            <ResultsSkeleton />
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-3xl p-12 text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto bg-[var(--primary-soft)] mb-4">
                <Users className="w-8 h-8 text-[var(--primary)]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-extrabold text-[var(--ink)] mb-1">No Matches Found</h3>
              <p className="text-xs text-[var(--ink-faint)] font-medium max-w-sm mx-auto leading-relaxed">
                Try widening your age, location, or astrology parameters to find more matches.
              </p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={handleClearFilters}>
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset Search Filters
              </Button>
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
