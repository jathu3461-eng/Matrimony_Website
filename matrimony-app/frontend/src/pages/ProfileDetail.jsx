import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function ProfileDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState(null);
  const [interestDirection, setInterestDirection] = useState(null);
  const [interestId, setInterestId] = useState(null);
  const [myProfiles, setMyProfiles] = useState([]);
  const [interestLoading, setInterestLoading] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [showMatchPanel, setShowMatchPanel] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [lifestyleResult, setLifestyleResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchProfileId, setMatchProfileId] = useState('');
  const [selectedSenderProfileId, setSelectedSenderProfileId] = useState(null);

  const load = useCallback(async () => {
    const [profileRes, metaRes] = await Promise.all([
      api.get(`/profiles/${id}`),
      api.get('/profiles/meta'),
    ]);
    const p = profileRes.data.profile;
    setProfile(p);
    setMeta(metaRes.data);
    setShortlisted(!!p.is_shortlisted);
    setInterestStatus(p.interest_status);
    setInterestDirection(p.interest_direction);
    setInterestId(p.interest_id);
  }, [id]);

  useEffect(() => {
    load();
    if (user) {
      api.get('/profiles/mine').then((res) => {
        setMyProfiles(res.data.profiles);
        if (res.data.profiles.length > 0) setSelectedSenderProfileId(res.data.profiles[0].id);
        if (res.data.profiles.length > 0) setMatchProfileId(res.data.profiles[0].id);
      }).catch(() => {});
    }
  }, [id, user, load]);

  // Build chat thread ID helper
  const getChatThreadId = () => {
    if (!myProfiles.length) return null;
    const myId = myProfiles[0].id;
    const otherId = profile?.id;
    if (!otherId) return null;
    const [lo, hi] = [myId, otherId].map(Number).sort((a, b) => a - b);
    return `${lo}-${hi}`;
  };

  const handleShortlist = async () => {
    setShortlistLoading(true);
    try {
      const res = await api.post('/interests/shortlist', { profile_id: profile.id });
      setShortlisted(res.data.shortlisted);
    } catch (err) { console.error(err); }
    finally { setShortlistLoading(false); }
  };

  const handleDirectExpressInterest = async () => {
    setInterestLoading(true);
    try {
      await api.post('/interests/send', {
        receiver_profile_id: profile.id,
      });
      setInterestStatus('pending');
      setInterestDirection('sent');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send interest';
      if (msg.includes('already')) {
        setInterestStatus('pending');
        setInterestDirection('sent');
      } else {
        alert(msg);
      }
    } finally { setInterestLoading(false); }
  };

  const handleRespondInterest = async (status) => {
    if (!interestId) return;
    setInterestLoading(true);
    try {
      await api.post(`/interests/${interestId}/respond`, { status });
      setInterestStatus(status);
    } catch (err) { console.error(err); }
    finally { setInterestLoading(false); }
  };

  const handleCalculateMatch = async () => {
    if (!matchProfileId) return;
    setMatchLoading(true);
    try {
      const [matchRes, lifestyleRes] = await Promise.all([
        api.post('/profiles/match', {
          profile_id_1: Number(matchProfileId),
          profile_id_2: profile.id,
        }),
        api.post('/profiles/lifestyle-match', {
          profile_id_1: Number(matchProfileId),
          profile_id_2: profile.id,
        }).catch(() => null),
      ]);
      setMatchResult(matchRes.data);
      if (lifestyleRes) setLifestyleResult(lifestyleRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not calculate match. Ensure both profiles have Raasi and Star set.');
    } finally { setMatchLoading(false); }
  };

  if (!profile || !meta) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-burgundy-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-burgundy-700/70 text-sm">Loading profile…</p>
      </div>
    </div>
  );

  const religion = meta.religions.find((r) => r.id === profile.religion_id)?.name_en;
  const caste = meta.castes.find((c) => c.id === profile.caste_id)?.name_en;
  const raasi = meta.raasis.find((r) => r.id === profile.raasi_id);
  const star = meta.stars.find((s) => s.id === profile.star_id);
  const bornCountry = meta.countries.find((c) => c.code === profile.born_country_id)?.name_en;
  const currentCountry = meta.countries.find((c) => c.code === profile.current_country_id)?.name_en;
  const isOwner = user && profile.owner_user_id === user.id;

  const interestButtonLabel = () => {
    if (interestStatus === 'pending' && interestDirection === 'sent') return t('interest_pending');
    if (interestStatus === 'accepted') return t('interest_accepted');
    if (interestStatus === 'rejected') return t('interest_rejected');
    return t('interest_send');
  };

  const canExpressInterest = !interestStatus && !isOwner && user && myProfiles.length > 0;
  const canRespond = interestStatus === 'pending' && interestDirection === 'received' && !isOwner;

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="grid md:grid-cols-[300px_1fr]">
          {/* Photo Column */}
          <div className="relative h-80 md:h-full bg-gradient-to-br from-burgundy-100 to-gold/20 flex items-center justify-center overflow-hidden">
            {profile.main_profile_picture && !profile.photo_blurred ? (
              <img
                src={`/uploads/${profile.main_profile_picture}`}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : profile.photo_blurred ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-burgundy-50/60">
                <div className="text-5xl mb-2">🔒</div>
                <p className="text-xs text-burgundy-700/60 text-center px-4">{t('photo_locked')}</p>
              </div>
            ) : (
              <span className="font-display text-8xl text-burgundy-700/30">{profile.name?.[0]}</span>
            )}

            {/* Verification Badge — conditional on is_verified */}
            <div className={`absolute top-4 right-4 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border ${
              profile.is_verified
                ? 'bg-gold/90 border-gold text-white'
                : 'bg-white/80 border-green-300/50 text-green-700'
            }`}>
              {profile.is_verified ? (
                <><span>✓</span> {t('verified_badge')}</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Active</>              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-3xl text-burgundy-700 mb-1">{profile.name}</h1>
                <p className="text-[#4a2a1a]/70">
                  {profile.age} yrs · {profile.height_feet}'{profile.height_inches}" · {profile.gender === 'M' ? 'Groom' : 'Bride'}
                </p>
              </div>

              {/* Action Buttons */}
              {user && !isOwner && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleShortlist}
                    disabled={shortlistLoading}
                    className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-all ${
                      shortlisted
                        ? 'bg-gold/15 border-gold/40 text-amber-800'
                        : 'border-gold/30 text-amber-800 hover:bg-gold/10'
                    }`}
                  >
                    {shortlisted ? t('shortlist_remove') : t('shortlist_add')}
                  </button>
                {/* Chat button: shown when interest is accepted */}
                  {interestStatus === 'accepted' && (
                    <button
                      onClick={() => {
                        const tid = getChatThreadId();
                        navigate(tid ? `/chat/${tid}` : '/chat');
                      }}
                      className="text-xs px-4 py-2 rounded-lg font-semibold text-white shadow transition-all"
                      style={{ background: 'linear-gradient(90deg,#f43f5e,#ec4899)' }}
                    >
                      💬 Message
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
              <InfoRow label="Education" value={profile.education} />
              <InfoRow label="Occupation" value={profile.occupation} />
              <InfoRow label="Religion" value={religion} />
              <InfoRow label="Caste / Saathi" value={caste} />
              <InfoRow label="Raasi" value={raasi?.name_en} />
              <InfoRow label="Star / Nakshatram" value={star?.name_en} />
              <InfoRow label="Born In" value={bornCountry} />
              <InfoRow label="Residing In" value={currentCountry ? `${currentCountry}${profile.city_or_state ? ', ' + profile.city_or_state : ''}` : profile.city_or_state} />
            </div>

            <h2 className="font-display text-lg text-burgundy-700 mb-2">About</h2>
            <p className="text-[#4a2a1a]/80 leading-relaxed mb-6">{profile.about_me}</p>

            {/* Horoscope Access */}
            {profile.horoscope_chart ? (
              profile.horoscope_blurred ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-gold/20 text-sm text-amber-800 mb-4">
                  <span>🔒</span> {t('horoscope_locked')}
                </div>
              ) : (
                <a href={`/uploads/${profile.horoscope_chart}`} target="_blank" rel="noreferrer" className="btn-secondary inline-block text-sm mb-4">
                  View Horoscope Chart →
                </a>
              )
            ) : null}

            {/* Express Interest Section */}
            {user && !isOwner && (
              <div className="mt-4 pt-4 border-t border-burgundy/10">
                {canExpressInterest && (
                  <button
                    onClick={handleDirectExpressInterest}
                    disabled={interestLoading}
                    className="btn-primary text-sm shadow-md"
                  >
                    {interestLoading ? 'Sending…' : `💌 ${t('interest_send')}`}
                  </button>
                )}

                {interestStatus && !canExpressInterest && !canRespond && (
                  <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-semibold ${
                    interestStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                    interestStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {interestButtonLabel()}
                  </span>
                )}

                {canRespond && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[#4a2a1a]/70">This profile sent you an interest request:</p>
                    <button onClick={() => handleRespondInterest('accepted')} disabled={interestLoading} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">Accept</button>
                    <button onClick={() => handleRespondInterest('rejected')} disabled={interestLoading} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors">Decline</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 10-Porutham Matching Panel */}
      {user && !isOwner && myProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 glass-card rounded-3xl p-8 border border-gold/20"
        >
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowMatchPanel(!showMatchPanel)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <h2 className="font-display text-2xl text-burgundy-700">{t('check_astrology_match')}</h2>
            </div>
            <span className="text-burgundy-700/60 text-xl">{showMatchPanel ? '▲' : '▼'}</span>
          </div>

          <AnimatePresence>
            {showMatchPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-6 border-t border-gold/15 pt-6">
                  <p className="text-sm text-[#4a2a1a]/70 mb-4">{t('select_profile_for_match')}</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-end mb-6">
                    <div className="flex-1">
                      <select
                        className="input-base"
                        value={matchProfileId}
                        onChange={(e) => setMatchProfileId(e.target.value)}
                      >
                        {myProfiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.gender === 'M' ? 'Groom' : 'Bride'})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCalculateMatch}
                      disabled={matchLoading}
                      className="btn-primary"
                    >
                      {matchLoading ? '…' : t('calculate_matching_score')}
                    </button>
                  </div>

                  {matchResult && (
                    <div>
                      {/* Score Dial */}
                      <div className="flex items-center gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-burgundy-50 to-gold/10 border border-gold/15">
                        <div className="relative">
                          <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5d6c8" strokeWidth="10" />
                            <circle
                              cx="60" cy="60" r="50" fill="none"
                              stroke={matchResult.score >= 7 ? '#15803d' : matchResult.score >= 5 ? '#d97706' : '#b91c1c'}
                              strokeWidth="10"
                              strokeDasharray={`${(matchResult.score / 10) * 314} 314`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
                            <span className="font-display text-4xl text-burgundy-700 font-bold leading-none">{matchResult.score}</span>
                            <span className="text-xs text-[#4a2a1a]/60">out of 10</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-display text-2xl text-burgundy-700 mb-1">{t('matching_score_out_of')}</p>
                          <p className={`text-sm font-semibold ${matchResult.score >= 7 ? 'text-green-700' : matchResult.score >= 5 ? 'text-amber-700' : 'text-red-700'}`}>
                            {matchResult.score >= 7 ? '✨ Excellent Match' : matchResult.score >= 5 ? '⚡ Good Match' : '⚠️ Low Compatibility'}
                          </p>
                          <p className="text-xs text-[#4a2a1a]/60 mt-1">{matchResult.score} of 10 Poruthams compatible</p>
                        </div>
                      </div>

                      {/* Traditional 3D Horoscope Grid */}
                      <HoroscopeGrid profile={profile} raasi={raasi} star={star} />

                      {/* Detailed Breakdown */}
                      <div className="grid sm:grid-cols-2 gap-3 mt-6">
                        {Object.entries(matchResult.details).map(([key, val]) => (
                          <div key={key} className={`p-4 rounded-xl border ${val.matched ? 'bg-green-50/60 border-green-200/50' : 'bg-red-50/40 border-red-200/40'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm ${val.matched ? '✅' : '❌'}`}>{val.matched ? '✅' : '❌'}</span>
                              <p className="text-sm font-semibold text-[#4a2a1a] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            </div>
                            <p className="text-xs text-[#4a2a1a]/70 leading-relaxed">{val.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <Link to="/search" className="inline-block mt-6 text-sm text-burgundy-700 hover:underline">← Back to Browse</Link>

    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gold/80 font-semibold">{label}</p>
      <p className="text-[#4a2a1a]/85">{value}</p>
    </div>
  );
}

// Traditional South-Indian/Sri Lankan horoscope grid layout
function HoroscopeGrid({ profile, raasi, star }) {
  const raasiName = raasi?.name_en || '—';
  const starName = star?.name_en || '—';
  const raasiId = profile.raasi_id;

  // 12 houses placed in 4x4 grid (3 per row with corners empty)
  // Standard South-Indian Kodam layout (fixed house positions)
  const GRID_POSITIONS = [
    { house: 12, row: 0, col: 0 }, { house: 1, row: 0, col: 1 }, { house: 2, row: 0, col: 2 }, { house: 3, row: 0, col: 3 },
    { house: 11, row: 1, col: 0 },                                                                 { house: 4, row: 1, col: 3 },
    { house: 10, row: 2, col: 0 },                                                                 { house: 5, row: 2, col: 3 },
    { house: 9, row: 3, col: 0 }, { house: 8, row: 3, col: 1 }, { house: 7, row: 3, col: 2 }, { house: 6, row: 3, col: 3 },
  ];

  const RAASI_NAMES = ['', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  const gridMap = {};
  GRID_POSITIONS.forEach(pos => {
    gridMap[`${pos.row}-${pos.col}`] = pos.house;
  });

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-burgundy-700 mb-3">South-Indian Horoscope Chart (Rasi: {raasiName} · Star: {starName})</p>
      <div className="grid grid-cols-4 gap-1 w-full max-w-xs mx-auto">
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => {
            const key = `${row}-${col}`;
            const houseNum = gridMap[key];
            // Center cells (rows 1-2, cols 1-2) are empty — show site name
            const isCenter = row >= 1 && row <= 2 && col >= 1 && col <= 2;
            if (isCenter) {
              if (row === 1 && col === 1) {
                return (
                  <div key={key} className="col-span-2 row-span-2 flex items-center justify-center bg-burgundy-700/5 border border-burgundy-200/40 rounded-lg p-2 text-center aspect-square" style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}>
                    <p className="font-display text-burgundy-700/50 text-sm">முகூர்த்தம்</p>
                  </div>
                );
              }
              return null;
            }
            const raasiNumForCell = ((houseNum - 1 + (raasiId - 1)) % 12) + 1;
            const isHighlighted = raasiNumForCell === raasiId;
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.05 }}
                className={`border rounded-lg p-2 flex flex-col items-center justify-center aspect-square text-center cursor-default transition-all ${
                  isHighlighted
                    ? 'bg-burgundy-700 border-burgundy-600 text-white shadow-glow'
                    : 'bg-white/50 border-burgundy-200/30 text-[#4a2a1a]'
                }`}
              >
                <p className="text-[9px] font-semibold opacity-60">{houseNum}</p>
                <p className={`text-[9px] leading-tight ${isHighlighted ? 'text-white' : 'text-burgundy-700'}`}>
                  {RAASI_NAMES[raasiNumForCell]}
                </p>
                {isHighlighted && <p className="text-[8px] opacity-80 mt-0.5">Lagna</p>}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
