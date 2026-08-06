import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Heart, Star, MessagesSquare, Plus, Search, Trash2, Pencil, PencilLine,
  Mail, Check, X, Clock, Briefcase, Sparkles, Building2, ShieldCheck, UserPlus,
} from 'lucide-react';
import api, { uploadsUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import ProfileCard from '../components/ProfileCard';
import { Button, Badge, Skeleton, ErrorCard, useToast } from '../components/ui';

const TABS = [
  { id: 'profiles', icon: Users, label: 'My Profiles' },
  { id: 'interests', icon: Heart, label: 'Interests' },
  { id: 'shortlists', icon: Star, label: 'Shortlist' },
  { id: 'messages', icon: MessagesSquare, label: 'Messages' },
  { id: 'brokers', icon: Building2, label: 'Brokers' },
];

function ProfileGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
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

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user && user.role === 'broker') navigate('/broker/dashboard', { replace: true });
  }, [user, navigate]);

  const [profiles, setProfiles] = useState([]);
  const [interactions, setInteractions] = useState({ sent: [], received: [], shortlists: [] });
  const [brokers, setBrokers] = useState([]);
  const [brokerBusyId, setBrokerBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('profiles');
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [profilesRes, interactionsRes, brokersRes] = await Promise.all([
        api.get('/profiles/mine'),
        api.get('/interests/my-interactions'),
        api.get('/brokers'),
      ]);
      setProfiles(profilesRes.data.profiles);
      setInteractions(interactionsRes.data);
      setBrokers(brokersRes.data.brokers);
    } catch (err) {
      console.error(err);
      setLoadError('Could not load your dashboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Delete this profile? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.delete(`/profiles/${id}`);
      setProfiles((p) => p.filter((x) => x.id !== id));
      toast.success('Profile deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete profile');
    } finally {
      setBusyId(null);
    }
  };

  const refreshInteractions = async () => {
    const res = await api.get('/interests/my-interactions');
    setInteractions(res.data);
  };

  const handleInterestResponse = async (id, status) => {
    setBusyId(id);
    try {
      const action = status === 'accepted' ? 'accept' : 'decline';
      await api.put('/interests/respond', { interest_id: id, action });
      toast.success(status === 'accepted' ? 'Interest accepted' : 'Interest declined');
    } catch (err) {
      try {
        await api.post(`/interests/${id}/respond`, { status });
        toast.success(status === 'accepted' ? 'Interest accepted' : 'Interest declined');
      } catch (e) {
        console.error(e);
        toast.error('Could not update interest');
      }
    } finally {
      setBusyId(null);
      try { await refreshInteractions(); } catch (e) { console.error(e); }
    }
  };

  const handleRemoveShortlist = async (profileId) => {
    setBusyId(profileId);
    try {
      await api.post('/interests/shortlist', { profile_id: profileId });
      toast.success('Removed from shortlist');
      await refreshInteractions();
    } catch (err) {
      toast.error('Could not update shortlist');
    } finally {
      setBusyId(null);
    }
  };

  const handleConnectBroker = async (brokerId) => {
    setBrokerBusyId(brokerId);
    try {
      const res = await api.post('/brokers/request', { broker_id: brokerId });
      toast.success(res.data?.message || 'Request sent to the broker');
      setBrokers((list) => list.map((b) => (b.id === brokerId ? { ...b, my_request_status: 'pending' } : b)));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send request');
    } finally {
      setBrokerBusyId(null);
    }
  };

  const isBroker = user?.role === 'broker';
  const pendingCount = interactions.received.filter((r) => r.status === 'pending').length;

  const STAT_CARDS = [
    { key: 'profiles', icon: Users, label: 'Profiles', value: profiles.length, onClick: () => setActiveTab('profiles') },
    { key: 'interests', icon: Heart, label: 'Interests', value: interactions.received.length, badge: pendingCount > 0 ? `${pendingCount} pending` : null, onClick: () => setActiveTab('interests') },
    { key: 'shortlists', icon: Star, label: 'Shortlisted', value: interactions.shortlists.length, onClick: () => setActiveTab('shortlists') },
    { key: 'messages', icon: MessagesSquare, label: 'Messages', value: interactions.received.filter((r) => r.status === 'accepted').length, onClick: () => navigate('/chat') },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden grad-primary">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-20%, 40%)' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative z-10">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{isBroker ? '💼' : '💖'}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {isBroker ? 'Broker Dashboard' : 'My Dashboard'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-pink-100">{user?.username}</span>!
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {isBroker
                ? `Managing ${profiles.length} / ${user?.broker_profile_limit || '∞'} client profiles`
                : 'Continue your journey to find your perfect life partner'}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {!isBroker && profiles.length > 0 ? (
              <Button onClick={() => navigate(`/profile/${profiles[0].id}/edit`)} style={{ background: 'white' }} className="!text-[var(--primary-strong)] !shadow-[0_10px_30px_-6px_rgba(255,255,255,0.5)]">
                <PencilLine className="w-4 h-4" aria-hidden="true" /> Edit Profile
              </Button>
            ) : (
              <Button onClick={() => navigate('/profile/new')} style={{ background: 'white' }} className="!text-[var(--primary-strong)] !shadow-[0_10px_30px_-6px_rgba(255,255,255,0.5)]">
                <Plus className="w-4 h-4" aria-hidden="true" /> {t('create_new_profile')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/search')} className="!border-white/60 !text-white !bg-white/10 hover:!bg-white/20">
              <Search className="w-4 h-4" aria-hidden="true" /> Browse Matches
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((s, i) => (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={s.onClick}
              className="glass-card rounded-2xl p-5 text-left hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl grad-primary flex items-center justify-center text-white mb-3 shadow">
                <s.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-2xl font-extrabold text-[var(--ink)]">{s.value}</p>
              <p className="text-xs font-semibold text-[var(--ink-faint)] mt-0.5 flex items-center gap-1.5">
                {s.label}
                {s.badge && <Badge variant="warning" className="!text-[10px] !px-2 !py-0">{s.badge}</Badge>}
              </p>
            </motion.button>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 mb-6 bg-[var(--surface-glass)] backdrop-blur p-1.5 rounded-2xl border border-[var(--border)] shadow-sm overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                  active ? 'text-white shadow-md grad-primary' : 'text-[var(--ink-faint)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]'
                }`}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
                {tab.id === 'interests' && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[var(--primary-strong)] text-[9px] font-extrabold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        {loadError ? (
          <ErrorCard
            title="Dashboard failed to load"
            message={loadError}
            onRetry={loadData}
            onDismiss={() => setLoadError('')}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-[var(--border-strong)] border-t-[var(--primary)] animate-spin" />
              <p className="text-sm text-[var(--ink-faint)] font-semibold">Loading your dashboard…</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profiles Tab */}
              {activeTab === 'profiles' && (
                profiles.length === 0 ? (
                  <div className="glass-card rounded-3xl p-16 text-center">
                    <div className="text-6xl mb-4">💑</div>
                    <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{t('no_profiles_yet')}</h3>
                    <p className="text-sm text-[var(--ink-faint)] mb-6">Create your first profile to start finding matches</p>
                    <Button onClick={() => navigate('/profile/new')} size="lg">
                      <Plus className="w-4 h-4" aria-hidden="true" /> Create Profile
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((p) => (
                      <ProfileCard
                        key={p.id}
                        profile={p}
                        actions={
                          <>
                            <Link
                              to={`/profile/${p.id}/edit`}
                              className="flex-1 flex items-center justify-center gap-1.5 text-center text-xs font-bold py-2.5 px-3 rounded-xl border border-[var(--border-strong)] text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteProfile(p.id)}
                              disabled={busyId === p.id}
                              aria-label={`Delete ${p.name}`}
                              className="text-xs px-3 py-2.5 rounded-xl border border-[var(--error-border)] text-[var(--error)] hover:bg-[var(--error-soft)] transition-all disabled:opacity-60"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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
                  <div className="glass-card rounded-3xl p-6">
                    <h3 className="font-extrabold text-[var(--ink)] text-lg mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-2xl grad-primary text-white flex items-center justify-center shadow-md">
                          <Heart className="w-4 h-4" aria-hidden="true" />
                        </span>
                        Interests Received
                      </span>
                      <Badge variant="primary">{interactions.received.length} total</Badge>
                    </h3>
                    {interactions.received.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-5xl mb-3 animate-bounce">📭</div>
                        <h4 className="font-bold text-[var(--ink)] text-base mb-1">No interest requests yet</h4>
                        <p className="text-xs text-[var(--ink-faint)] max-w-xs mx-auto">When other members express interest in your profile, their requests will appear here for you to accept or decline.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {interactions.received.map((i) => (
                          <motion.div
                            key={i.id}
                            whileHover={{ y: -2 }}
                            className="glass-card rounded-2xl p-4 border border-[var(--border)] shadow-md relative overflow-hidden flex flex-col gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-pink-200 to-rose-200 border border-[var(--border-strong)] flex items-center justify-center shadow-sm">
                                {i.sender_pic ? (
                                  <img src={uploadsUrl(i.sender_pic)} alt={i.sender_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-2xl font-bold text-[var(--primary-strong)]">{i.sender_name?.[0]?.toUpperCase()}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <Link to={`/profile/${i.sender_id}`} className="font-extrabold text-[var(--ink)] text-base hover:text-[var(--primary)] truncate block">
                                    {i.sender_name}
                                  </Link>
                                  <Badge
                                    variant={i.status === 'accepted' ? 'success' : i.status === 'pending' ? 'warning' : 'neutral'}
                                    className="!text-[10px] !px-2.5 !py-0.5 shrink-0"
                                    icon={i.status === 'accepted' ? <Check className="w-3 h-3" aria-hidden="true" /> : i.status === 'pending' ? <Clock className="w-3 h-3" aria-hidden="true" /> : <X className="w-3 h-3" aria-hidden="true" />}
                                  >
                                    {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-[var(--primary)] font-bold mt-0.5 truncate">
                                  For: {i.receiver_name}
                                </p>
                                <p className="text-xs text-[var(--ink-faint)] font-medium mt-0.5">
                                  Received {new Date(i.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            {i.message && (
                              <div className="bg-[var(--primary-soft)] border border-[var(--border)] p-3 rounded-xl text-xs text-[var(--ink-soft)] font-medium italic">
                                <span className="text-[var(--primary)] font-bold text-sm mr-1">“</span>
                                {i.message}
                                <span className="text-[var(--primary)] font-bold text-sm ml-1">”</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                              {i.status === 'pending' ? (
                                <>
                                  <Button
                                    size="sm"
                                    fullWidth
                                    loading={busyId === i.id}
                                    onClick={() => handleInterestResponse(i.id, 'accepted')}
                                    className="!bg-[linear-gradient(135deg,#10b981,#059669)] !shadow-[0_8px_25px_-4px_rgba(16,185,129,0.45)]"
                                  >
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" /> Accept Interest
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={busyId === i.id}
                                    onClick={() => handleInterestResponse(i.id, 'rejected')}
                                  >
                                    <X className="w-3.5 h-3.5" aria-hidden="true" /> Decline
                                  </Button>
                                </>
                              ) : i.status === 'accepted' ? (
                                <Button
                                  size="sm"
                                  fullWidth
                                  onClick={() => navigate('/chat')}
                                >
                                  <MessagesSquare className="w-3.5 h-3.5" aria-hidden="true" /> Send Message (Chat)
                                </Button>
                              ) : (
                                <span className="text-xs text-[var(--ink-faint)] font-medium italic">Interest declined</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent */}
                  <div className="glass-card rounded-3xl p-6">
                    <h3 className="font-bold text-[var(--ink)] text-base mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                        <Mail className="w-4 h-4 text-[var(--primary-strong)]" aria-hidden="true" />
                      </span>
                      Interests Sent
                    </h3>
                    {interactions.sent.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-4xl mb-3">📫</div>
                        <p className="text-sm text-[var(--ink-faint)]">No interest requests sent yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interactions.sent.map((i) => (
                          <div key={i.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--primary-soft)]/60 border border-[var(--border)]">
                            <div>
                              <p className="text-[10px] text-[var(--primary)] font-bold uppercase">From: {i.sender_name}</p>
                              <Link to={`/profile/${i.receiver_id}`} className="font-bold text-[var(--ink-soft)] text-sm hover:text-[var(--primary)]">{i.receiver_name}</Link>
                              <p className="text-[11px] text-[var(--ink-faint)]">{new Date(i.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge
                              variant={i.status === 'accepted' ? 'success' : i.status === 'pending' ? 'warning' : 'error'}
                              className="!text-[11px]"
                            >
                              {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                            </Badge>
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
                  <div className="glass-card rounded-3xl p-16 text-center">
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-xl font-bold text-[var(--ink)] mb-2">No profiles shortlisted yet</h3>
                    <p className="text-sm text-[var(--ink-faint)] mb-6">Browse matches and star the ones you like</p>
                    <Button size="lg" onClick={() => navigate('/search')}>
                      <Search className="w-4 h-4" aria-hidden="true" /> Browse Matches
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interactions.shortlists.map((s) => (
                      <ProfileCard
                        key={s.id}
                        profile={{ id: s.profile_id, name: s.profile_name, main_profile_picture: s.profile_pic, age: s.age, height_feet: s.height_feet, height_inches: s.height_inches, occupation: s.occupation, city_or_state: s.city_or_state }}
                        actions={
                          <Button
                            size="sm"
                            fullWidth
                            variant="soft"
                            loading={busyId === s.profile_id}
                            onClick={() => handleRemoveShortlist(s.profile_id)}
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" /> Remove from Shortlist
                          </Button>
                        }
                      />
                    ))}
                  </div>
                )
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="glass-card rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Your Messages</h3>
                  <p className="text-sm text-[var(--ink-faint)] mb-6">Chat with profiles that have accepted your interest</p>
                  <Button size="lg" onClick={() => navigate('/chat')}>
                    <Briefcase className="w-4 h-4" aria-hidden="true" /> Open Messages
                  </Button>
                </div>
              )}

              {/* Brokers Tab */}
              {activeTab === 'brokers' && (
                brokers.length === 0 ? (
                  <div className="glass-card rounded-3xl p-16 text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-xl font-bold text-[var(--ink)] mb-2">No brokers available yet</h3>
                    <p className="text-sm text-[var(--ink-faint)] mb-6">Professional brokers will appear here once they join the platform. Connect with one to get expert help finding your match.</p>
                    <Button size="lg" onClick={() => navigate('/search')}>
                      <Search className="w-4 h-4" aria-hidden="true" /> Browse Matches
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="font-extrabold text-[var(--ink)] text-lg flex items-center gap-2">
                          <span className="w-9 h-9 rounded-2xl grad-primary text-white flex items-center justify-center shadow-md">
                            <Building2 className="w-4 h-4" aria-hidden="true" />
                          </span>
                          Professional Brokers
                        </h3>
                        <p className="text-xs text-[var(--ink-faint)] font-medium mt-1">Connect with a trusted broker to manage your profile and find the right match for you.</p>
                      </div>
                      <Badge variant="primary">{brokers.length} available</Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {brokers.map((b, i) => (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          whileHover={{ y: -3 }}
                          className="glass-card rounded-3xl p-6 flex flex-col gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-md shadow-pink-500/30 shrink-0">
                              {(b.business_name || b.username)?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-[var(--ink)] truncate">{b.business_name || b.username}</h4>
                              <p className="text-[11px] text-[var(--ink-faint)] font-medium truncate">@{b.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="success" icon={<ShieldCheck className="w-3 h-3" aria-hidden="true" />}>
                              Verified Broker
                            </Badge>
                            <Badge variant="neutral" icon={<Users className="w-3 h-3" aria-hidden="true" />}>
                              {b.client_count} client{b.client_count === 1 ? '' : 's'}
                            </Badge>
                          </div>

                          <div className="mt-auto">
                            {b.my_request_status === 'accepted' ? (
                              <div className="flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <Check className="w-4 h-4" aria-hidden="true" /> Connected with this broker
                              </div>
                            ) : b.my_request_status === 'pending' ? (
                              <div className="flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="w-4 h-4" aria-hidden="true" /> Request sent — awaiting approval
                              </div>
                            ) : (
                              <Button
                                fullWidth
                                loading={brokerBusyId === b.id}
                                onClick={() => handleConnectBroker(b.id)}
                              >
                                <UserPlus className="w-4 h-4" aria-hidden="true" />
                                {b.my_request_status === 'rejected' ? 'Request Again' : 'Connect with Broker'}
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
