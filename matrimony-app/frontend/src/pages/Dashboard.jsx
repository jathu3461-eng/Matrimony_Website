import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import ProfileCard from '../components/ProfileCard';

const TABS = [
  { id: 'profiles', icon: '👤', label: 'My Profiles' },
  { id: 'interests', icon: '💌', label: 'Interests' },
  { id: 'shortlists', icon: '⭐', label: 'Shortlist' },
  { id: 'messages', icon: '💬', label: 'Messages' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [interactions, setInteractions] = useState({ sent: [], received: [], shortlists: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profiles');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, interactionsRes] = await Promise.all([
        api.get('/profiles/mine'),
        api.get('/interests/my-interactions'),
      ]);
      setProfiles(profilesRes.data.profiles);
      setInteractions(interactionsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteProfile = async (id) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    await api.delete(`/profiles/${id}`);
    setProfiles((p) => p.filter((x) => x.id !== id));
  };

  const handleInterestResponse = async (id, status) => {
    try {
      const action = status === 'accepted' ? 'accept' : 'decline';
      await api.put('/interests/respond', { interest_id: id, action });
      const res = await api.get('/interests/my-interactions');
      setInteractions(res.data);
    } catch (err) {
      console.error(err);
      try {
        await api.post(`/interests/${id}/respond`, { status });
        const res = await api.get('/interests/my-interactions');
        setInteractions(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemoveShortlist = async (profileId) => {
    try {
      await api.post('/interests/shortlist', { profile_id: profileId });
      const res = await api.get('/interests/my-interactions');
      setInteractions(res.data);
    } catch (err) { console.error(err); }
  };

  const isBroker = user?.role === 'broker';
  const pendingCount = interactions.received.filter((r) => r.status === 'pending').length;

  const STAT_CARDS = [
    { icon: '👤', label: 'Profiles', value: profiles.length, color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
    { icon: '💌', label: 'Interests', value: interactions.received.length, color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50' },
    { icon: '⭐', label: 'Shortlisted', value: interactions.shortlists.length, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
    { icon: '💬', label: 'Messages', value: interactions.received.filter(r => r.status === 'accepted').length, color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50' },
  ];

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(150deg, #fff5f8 0%, #fdf0ff 50%, #f0f4ff 100%)' }}>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg, #f43f5e 0%, #ec4899 40%, #a855f7 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 bg-white"
          style={{ transform: 'translate(30%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-white"
          style={{ transform: 'translate(-20%, 40%)' }} />

        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative z-10">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{isBroker ? '💼' : '💖'}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {isBroker ? 'Broker Dashboard' : 'My Dashboard'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-pink-100">{user?.username}</span>! 👋
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {isBroker
                ? `Managing ${profiles.length} / ${user?.broker_profile_limit || '∞'} client profiles`
                : 'Continue your journey to find your perfect life partner'}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/profile/new')}
              className="flex items-center gap-2 bg-white text-pink-600 font-extrabold text-sm px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              ➕ {t('create_new_profile')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-5 py-3 rounded-2xl border border-white/30 transition-all"
            >
              🔍 Browse Matches
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`${s.bg} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-all cursor-pointer`}
              onClick={() => s.label === 'Messages' ? navigate('/chat') : setActiveTab(TABS[i].id)}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-lg mb-3 shadow`}>
                {s.icon}
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
              {s.label === 'Interests' && pendingCount > 0 && (
                <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  {pendingCount} pending
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 mb-6 bg-white/80 backdrop-blur p-1.5 rounded-2xl border border-pink-100 shadow-sm overflow-x-auto">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center
                ${activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'}`}
              style={activeTab === tab.id
                ? { background: 'linear-gradient(90deg,#f43f5e,#ec4899)' }
                : {}}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'interests' && pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-pink-600 text-[9px] font-extrabold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500" />
              <p className="text-sm text-slate-500 font-semibold">Loading your dashboard…</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* Profiles Tab */}
              {activeTab === 'profiles' && (
                profiles.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-pink-100 shadow-sm">
                    <div className="text-6xl mb-4">💑</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">{t('no_profiles_yet')}</h3>
                    <p className="text-sm text-slate-400 mb-6">Create your first profile to start finding matches</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/profile/new')}
                      className="px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-lg"
                      style={{ background: 'linear-gradient(90deg,#f43f5e,#ec4899)' }}>
                      ➕ Create Profile
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((p) => (
                      <ProfileCard key={p.id} profile={p}
                        actions={
                          <>
                            <Link to={`/profile/${p.id}/edit`}
                              className="flex-1 text-center text-xs font-bold py-2 px-3 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 transition-all">
                              ✏️ Edit
                            </Link>
                            <button onClick={() => handleDeleteProfile(p.id)}
                              className="text-xs px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                              🗑️
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                )
              )}

              {/* Interests Tab */}
              {activeTab === 'interests' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Received */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-pink-100/80 shadow-lg shadow-pink-500/5">
                    <h3 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md">💌</span>
                        Interests Received
                      </span>
                      <span className="text-xs bg-pink-100 text-pink-700 font-bold px-3 py-1 rounded-full">
                        {interactions.received.length} total
                      </span>
                    </h3>
                    {interactions.received.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-5xl mb-3 animate-bounce">📭</div>
                        <h4 className="font-bold text-slate-700 text-base mb-1">No interest requests yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">When other members express interest in your profile, their requests will appear here for you to accept or decline.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {interactions.received.map((i) => (
                          <motion.div
                            key={i.id}
                            whileHover={{ y: -2 }}
                            className="glass-card rounded-2xl p-4 border border-pink-100 bg-white/90 shadow-md relative overflow-hidden flex flex-col gap-3"
                          >
                            {/* Top header row: Sender info */}
                            <div className="flex items-start gap-3">
                              {/* Photo */}
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-pink-200 to-purple-200 border border-pink-200 flex items-center justify-center shadow-sm">
                                {i.sender_pic ? (
                                  <img src={`/uploads/${i.sender_pic}`} alt={i.sender_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-2xl font-bold text-pink-600">{i.sender_name?.[0]?.toUpperCase()}</span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <Link to={`/profile/${i.sender_id}`} className="font-extrabold text-slate-800 text-base hover:text-pink-600 truncate block">
                                    {i.sender_name}
                                  </Link>
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                    i.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    i.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}>
                                    {i.status === 'accepted' ? '✓ Accepted' : i.status === 'pending' ? '⏳ Pending' : '✕ Declined'}
                                  </span>
                                </div>
                                <p className="text-xs text-pink-600 font-bold mt-0.5 truncate">
                                  For: {i.receiver_name}
                                </p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                  Received {new Date(i.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            {/* Message box */}
                            {i.message && (
                              <div className="bg-pink-50/70 border border-pink-100 p-3 rounded-xl text-xs text-slate-700 font-medium italic relative">
                                <span className="text-pink-400 font-bold text-sm mr-1">“</span>
                                {i.message}
                                <span className="text-pink-400 font-bold text-sm ml-1">”</span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              {i.status === 'pending' ? (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleInterestResponse(i.id, 'accepted')}
                                    className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                    style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
                                  >
                                    <span>✓</span>
                                    <span>Accept Interest</span>
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleInterestResponse(i.id, 'rejected')}
                                    className="py-2 px-4 rounded-xl text-xs font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <span>✕</span>
                                    <span>Decline</span>
                                  </motion.button>
                                </>
                              ) : i.status === 'accepted' ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => navigate('/chat')}
                                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                  style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #ec4899 100%)' }}
                                >
                                  <span>💬</span>
                                  <span>Send Message (Chat)</span>
                                </motion.button>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium italic">Interest declined</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent */}
                  <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">📤</span>
                      Interests Sent
                    </h3>
                    {interactions.sent.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-4xl mb-3">📫</div>
                        <p className="text-sm text-slate-400">No interest requests sent yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interactions.sent.map((i) => (
                          <div key={i.id} className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                            <div>
                              <p className="text-[10px] text-purple-500 font-bold uppercase">From: {i.sender_name}</p>
                              <Link to={`/profile/${i.receiver_id}`} className="font-bold text-slate-700 text-sm hover:text-purple-600">{i.receiver_name}</Link>
                              <p className="text-[11px] text-slate-400">{new Date(i.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-[11px] px-2.5 py-1.5 rounded-full font-bold ${
                              i.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              i.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                              {i.status === 'accepted' ? '✓ Accepted' : i.status === 'pending' ? '⏳ Pending' : '✕ Declined'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shortlists Tab */}
              {activeTab === 'shortlists' && (
                interactions.shortlists.length === 0 ? (
                  <div className="bg-white rounded-3xl p-16 text-center border border-amber-100 shadow-sm">
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No profiles shortlisted yet</h3>
                    <p className="text-sm text-slate-400 mb-6">Browse matches and star the ones you like</p>
                    <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/search')}
                      className="px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-lg"
                      style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)' }}>
                      🔍 Browse Matches
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interactions.shortlists.map((s) => (
                      <ProfileCard key={s.id}
                        profile={{ id: s.profile_id, name: s.profile_name, main_profile_picture: s.profile_pic, age: s.age, height_feet: s.height_feet, height_inches: s.height_inches, occupation: s.occupation, city_or_state: s.city_or_state }}
                        actions={
                          <button onClick={() => handleRemoveShortlist(s.profile_id)}
                            className="w-full text-xs py-2 border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold rounded-xl transition-all">
                            ✕ Remove from Shortlist
                          </button>
                        }
                      />
                    ))}
                  </div>
                )
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="bg-white rounded-3xl p-12 text-center border border-teal-100 shadow-sm">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Your Messages</h3>
                  <p className="text-sm text-slate-400 mb-6">Chat with profiles that have accepted your interest</p>
                  <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/chat')}
                    className="px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-lg"
                    style={{ background: 'linear-gradient(90deg,#f43f5e,#ec4899)' }}>
                    Open Messages
                  </motion.button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
