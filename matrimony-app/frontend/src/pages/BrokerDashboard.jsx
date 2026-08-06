import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Heart,
  Star,
  MessagesSquare,
  Plus,
  Search,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Pencil,
  Trash2,
  ShieldCheck,
  Check,
  Clock,
  TrendingUp,
  UserCheck,
  Briefcase,
  Mail,
  Gauge,
  Sparkles,
  ArrowRight,
  Crown,
} from 'lucide-react';
import api, { uploadsUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import { Button, Badge, Skeleton, ErrorCard, useToast } from '../components/ui';

const NAV_ITEMS = [
  { key: 'overview', path: '/broker/dashboard', label: 'Overview', icon: LayoutDashboard, desc: 'Portfolio at a glance' },
  { key: 'profiles', path: '/broker/profiles', label: 'Client Profiles', icon: Users, desc: 'Manage client portfolios' },
  { key: 'interests', path: '/broker/interests', label: 'Interests', icon: Heart, desc: 'Requests sent & received' },
  { key: 'shortlist', path: '/broker/shortlist', label: 'Shortlist', icon: Star, desc: 'Saved matches' },
  { key: 'messages', path: '/broker/messages', label: 'Messages', icon: MessagesSquare, desc: 'Chat with matches' },
];

const SECTION_FROM_PATH = (path) => {
  const found = NAV_ITEMS.find((n) => n.path === path);
  return found ? found.key : 'overview';
};

const SECTION_META = Object.fromEntries(NAV_ITEMS.map((n) => [n.key, n]));

export default function BrokerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [interactions, setInteractions] = useState({ sent: [], received: [], shortlists: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const section = SECTION_FROM_PATH(location.pathname);
  const activeMeta = SECTION_META[section];

  useEffect(() => {
    if (user && user.role !== 'broker') navigate('/dashboard');
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [profilesRes, interactionsRes] = await Promise.all([
        api.get('/profiles/mine'),
        api.get('/interests/my-interactions'),
      ]);
      setProfiles(profilesRes.data.profiles);
      setInteractions(interactionsRes.data);
    } catch (err) {
      console.error(err);
      setLoadError('Could not load your broker dashboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshInteractions = async () => {
    try {
      const res = await api.get('/interests/my-interactions');
      setInteractions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Delete this client profile? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.delete(`/profiles/${id}`);
      setProfiles((p) => p.filter((x) => x.id !== id));
      toast.success('Client profile deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete profile');
    } finally {
      setBusyId(null);
    }
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
      await refreshInteractions();
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const quota = user?.broker_profile_limit || 0;
  const usedPct = quota > 0 ? Math.min(100, Math.round((profiles.length / quota) * 100)) : 0;
  const pendingCount = interactions.received.filter((r) => r.status === 'pending').length;
  const acceptedCount = interactions.received.filter((r) => r.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf5f8] via-[#faf0f4] to-[#fde7f0]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-[#3a0d28] via-[#580e2e] to-[#7e1040] text-white z-40">
        <SidebarContent user={user} section={section} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 flex flex-col bg-gradient-to-b from-[#3a0d28] via-[#580e2e] to-[#7e1040] text-white z-50 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent user={user} section={section} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-pink-100/80 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight truncate">
                {activeMeta?.label || 'Broker'}
              </h1>
              <p className="hidden sm:block text-[11px] font-semibold text-pink-500">{activeMeta?.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Broker Portal
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-display font-extrabold text-white shadow-md shadow-pink-500/30">
                {(user?.username || 'B')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user?.username || 'Broker'}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {loadError ? (
            <ErrorCard
              title="Broker dashboard failed to load"
              message={loadError}
              onRetry={loadData}
              onDismiss={() => setLoadError('')}
            />
          ) : loading ? (
            <DashboardSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {section === 'overview' && (
                  <Overview
                    user={user}
                    profiles={profiles}
                    interactions={interactions}
                    quota={quota}
                    usedPct={usedPct}
                    pendingCount={pendingCount}
                    acceptedCount={acceptedCount}
                    navigate={navigate}
                    setSection={(s) => navigate(SECTION_META[s].path)}
                  />
                )}
                {section === 'profiles' && (
                  <ClientProfiles
                    profiles={profiles}
                    quota={quota}
                    usedPct={usedPct}
                    busyId={busyId}
                    onDelete={handleDeleteProfile}
                    navigate={navigate}
                  />
                )}
                {section === 'interests' && (
                  <InterestsSection
                    interactions={interactions}
                    busyId={busyId}
                    onRespond={handleInterestResponse}
                    navigate={navigate}
                  />
                )}
                {section === 'shortlist' && (
                  <ShortlistSection
                    items={interactions.shortlists}
                    busyId={busyId}
                    onRemove={handleRemoveShortlist}
                    navigate={navigate}
                  />
                )}
                {section === 'messages' && <MessagesSection navigate={navigate} acceptedCount={acceptedCount} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Shared building blocks ──────────────────────────────────────────────── */

function SidebarContent({ user, section, onLogout, onNavigate }) {
  const active = (key) =>
    key === section
      ? 'bg-white/15 text-white shadow-lg shadow-black/10 ring-1 ring-white/20'
      : 'text-pink-100/70 hover:text-white hover:bg-white/10';

  return (
    <>
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 8 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xl shadow-lg shadow-pink-500/40"
          >
            💼
          </motion.div>
          <div>
            <span className="font-display text-lg font-extrabold text-white tracking-tight leading-none">
              Mukurtham
            </span>
            <span className="block text-[9px] font-bold text-pink-300 tracking-[0.25em] uppercase mt-1">
              Broker Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Broker chip */}
      <div className="mx-5 mt-5 rounded-2xl bg-white/10 border border-white/10 p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center font-display font-extrabold text-white shrink-0">
          {(user?.username || 'B')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.username || 'Broker'}</p>
          <p className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <Crown className="w-3 h-3" /> Professional Broker
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 mt-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-pink-200/50">
          Manage
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === section;
          return (
            <Link
              key={item.key}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${active(item.key)}`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-pink-300' : ''}`} />
              {item.label}
              {isActive && (
                <motion.span layoutId="broker-nav-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-4 pb-6 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-pink-100/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
          View Website
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, badge, onClick, accent = 'grad-primary', delay = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-left hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-white mb-3 shadow`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-2xl font-extrabold text-[var(--ink)]">{value}</p>
      <p className="text-xs font-semibold text-[var(--ink-faint)] mt-0.5 flex items-center gap-1.5">
        {label}
        {badge && <Badge variant="warning" className="!text-[10px] !px-2 !py-0">{badge}</Badge>}
      </p>
    </motion.button>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl grad-primary text-white flex items-center justify-center shadow-md shadow-pink-500/30">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ emoji, title, subtitle, ctaLabel, onCta }) {
  return (
    <div className="glass-card rounded-3xl p-14 text-center">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--ink-faint)] mb-6">{subtitle}</p>
      {ctaLabel && (
        <Button size="lg" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */

function Overview({ user, profiles, interactions, quota, usedPct, pendingCount, acceptedCount, navigate, setSection }) {
  const received = [...interactions.received].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);

  const STATS = [
    { icon: Users, label: 'Client Profiles', value: profiles.length, accent: 'bg-gradient-to-tr from-pink-500 to-rose-500', onClick: () => setSection('profiles') },
    { icon: Gauge, label: 'Quota Used', value: `${usedPct}%`, badge: quota ? `${profiles.length} of ${quota}` : null, accent: 'bg-gradient-to-tr from-amber-500 to-orange-500', onClick: () => setSection('profiles') },
    { icon: Heart, label: 'Interests', value: interactions.received.length, badge: pendingCount > 0 ? `${pendingCount} pending` : null, accent: 'bg-gradient-to-tr from-fuchsia-500 to-pink-500', onClick: () => setSection('interests') },
    { icon: Star, label: 'Shortlisted', value: interactions.shortlists.length, accent: 'bg-gradient-to-tr from-violet-500 to-purple-500', onClick: () => setSection('shortlist') },
    { icon: UserCheck, label: 'Accepted', value: acceptedCount, accent: 'bg-gradient-to-tr from-emerald-500 to-teal-500', onClick: () => setSection('interests') },
  ];

  const QUICK_ACTIONS = [
    { icon: Plus, label: 'New Client Profile', desc: 'Register a new profile for a client', accent: 'from-pink-500 to-rose-500', onClick: () => navigate('/profile/new') },
    { icon: Search, label: 'Browse Matches', desc: 'Find matches across the community', accent: 'from-violet-500 to-purple-500', onClick: () => navigate('/search') },
    { icon: MessagesSquare, label: 'Open Messages', desc: 'Chat with accepted matches', accent: 'from-emerald-500 to-teal-500', onClick: () => navigate('/chat') },
    { icon: Star, label: 'View Shortlist', desc: 'Review saved profiles', accent: 'from-amber-500 to-orange-500', onClick: () => setSection('shortlist') },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl grad-primary shadow-[0_20px_50px_-16px_rgba(224,19,106,0.45)]">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-white" style={{ transform: 'translate(35%, -45%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-25%, 45%)' }} />
        <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💼</span>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Professional Broker Dashboard</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-pink-100">{user?.username}</span>!
          </h1>
          <p className="text-white/80 text-sm mt-1.5 max-w-xl">
            {user?.business_name ? `${user.business_name} — ` : ''}Manage your client portfolio, review interests and grow your matrimony business.
          </p>

          {/* Quota meter */}
          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-white/90 mb-1.5">
              <span>Profile quota used</span>
              <span>{profiles.length} of {quota || '∞'}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usedPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${usedPct >= 90 ? 'bg-red-400' : usedPct >= 70 ? 'bg-amber-300' : 'bg-white'}`}
              />
            </div>
            <p className="text-[10px] text-white/70 font-medium mt-1.5">
              {quota && profiles.length >= quota ? 'Quota reached — contact the admin to upgrade your plan.' : `${quota - profiles.length} profile slots remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.06} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              whileHover={{ y: -3 }}
              onClick={a.onClick}
              className="glass-card rounded-2xl p-5 text-left hover:shadow-[var(--shadow-elevated)] transition-all cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${a.accent} text-white flex items-center justify-center mb-3 shadow`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-extrabold text-[var(--ink)]">{a.label}</p>
              <p className="text-[11px] text-[var(--ink-faint)] font-medium mt-0.5">{a.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-[var(--ink)] text-lg flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[var(--primary-strong)]" aria-hidden="true" />
            </span>
            Recent Interest Requests
          </h3>
          {interactions.received.length > 0 && (
            <button
              onClick={() => setSection('interests')}
              className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-strong)] flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {received.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-sm text-[var(--ink-faint)] font-medium">No interest requests yet. When members express interest in your client profiles, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {received.map((i) => (
              <div key={i.id} className="flex items-center gap-4 py-3.5">
                <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-pink-200 to-rose-200 border border-[var(--border-strong)] flex items-center justify-center shadow-sm">
                  {i.sender_pic ? (
                    <img src={uploadsUrl(i.sender_pic)} alt={i.sender_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-[var(--primary-strong)]">{i.sender_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[var(--ink)] text-sm truncate">{i.sender_name}</p>
                    <Badge
                      variant={i.status === 'accepted' ? 'success' : i.status === 'pending' ? 'warning' : 'neutral'}
                      className="!text-[10px] !px-2 !py-0.5 shrink-0"
                    >
                      {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--ink-faint)] font-medium mt-0.5 truncate">
                    For: {i.receiver_name} · {new Date(i.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Client Profiles ─────────────────────────────────────────────────────── */

function ClientProfiles({ profiles, quota, usedPct, busyId, onDelete, navigate }) {
  const verifiedCount = profiles.filter((p) => p.is_verified).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Users}
        title="Client Profiles"
        subtitle={`${verifiedCount} verified · ${profiles.length - verifiedCount} pending verification`}
        action={
          <Button onClick={() => navigate('/profile/new')}>
            <Plus className="w-4 h-4" aria-hidden="true" /> New Client Profile
          </Button>
        }
      />

      {/* Quota bar */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-soft)] mb-2">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" /> Quota usage
          </span>
          <span>{profiles.length} of {quota || '∞'} profiles</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usedPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`h-full rounded-full ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-400' : 'grad-primary'}`}
          />
        </div>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          emoji="💼"
          title="No client profiles yet"
          subtitle="Create your first client profile to start building your portfolio."
          ctaLabel="Create Client Profile"
          onCta={() => navigate('/profile/new')}
        />
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
                    onClick={() => onDelete(p.id)}
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
      )}
    </div>
  );
}

/* ── Interests ───────────────────────────────────────────────────────────── */

function InterestsSection({ interactions, busyId, onRespond, navigate }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Heart}
        title="Interests"
        subtitle="Manage interest requests for your client profiles"
      />
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
              <p className="text-xs text-[var(--ink-faint)] max-w-xs mx-auto">When other members express interest in your client profiles, their requests will appear here for you to accept or decline.</p>
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
                      <p className="text-xs text-[var(--primary)] font-bold mt-0.5 truncate">For: {i.receiver_name}</p>
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
                          onClick={() => onRespond(i.id, 'accepted')}
                          className="!bg-[linear-gradient(135deg,#10b981,#059669)] !shadow-[0_8px_25px_-4px_rgba(16,185,129,0.45)]"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" /> Accept Interest
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === i.id}
                          onClick={() => onRespond(i.id, 'rejected')}
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" /> Decline
                        </Button>
                      </>
                    ) : i.status === 'accepted' ? (
                      <Button size="sm" fullWidth onClick={() => navigate('/chat')}>
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
          <h3 className="font-extrabold text-[var(--ink)] text-lg mb-4 flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
              <Mail className="w-4 h-4 text-[var(--primary-strong)]" aria-hidden="true" />
            </span>
            Interests Sent
          </h3>
          {interactions.sent.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-3">📫</div>
              <p className="text-sm text-[var(--ink-faint)]">No interest requests sent yet. Browse matches to start connecting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.sent.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--primary-soft)]/60 border border-[var(--border)]">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[var(--primary)] font-bold uppercase">From: {i.sender_name}</p>
                    <Link to={`/profile/${i.receiver_id}`} className="font-bold text-[var(--ink-soft)] text-sm hover:text-[var(--primary)] truncate block">{i.receiver_name}</Link>
                    <p className="text-[11px] text-[var(--ink-faint)]">{new Date(i.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge
                    variant={i.status === 'accepted' ? 'success' : i.status === 'pending' ? 'warning' : 'error'}
                    className="!text-[11px] shrink-0"
                  >
                    {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shortlist ───────────────────────────────────────────────────────────── */

function ShortlistSection({ items, busyId, onRemove, navigate }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Star}
        title="Shortlist"
        subtitle="Profiles you have saved for your clients"
      />
      {items.length === 0 ? (
        <EmptyState
          emoji="⭐"
          title="No profiles shortlisted yet"
          subtitle="Browse matches and star the ones you like to keep them handy."
          ctaLabel="Browse Matches"
          onCta={() => navigate('/search')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s) => (
            <ProfileCard
              key={s.id}
              profile={{ id: s.profile_id, name: s.profile_name, main_profile_picture: s.profile_pic, age: s.age, height_feet: s.height_feet, height_inches: s.height_inches, occupation: s.occupation, city_or_state: s.city_or_state }}
              actions={
                <Button
                  size="sm"
                  fullWidth
                  variant="soft"
                  loading={busyId === s.profile_id}
                  onClick={() => onRemove(s.profile_id)}
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" /> Remove from Shortlist
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Messages ────────────────────────────────────────────────────────────── */

function MessagesSection({ navigate, acceptedCount }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={MessagesSquare}
        title="Messages"
        subtitle="Chat with members who accepted your interests"
      />
      <div className="glass-card rounded-3xl p-14 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Your Messages</h3>
        <p className="text-sm text-[var(--ink-faint)] mb-2">
          {acceptedCount > 0
            ? `You have ${acceptedCount} accepted match${acceptedCount > 1 ? 'es' : ''} to connect with.`
            : 'Once members accept your interests, you can start chatting with them here.'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" onClick={() => navigate('/chat')}>
            <Briefcase className="w-4 h-4" aria-hidden="true" /> Open Messages
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/search')}>
            <Search className="w-4 h-4" aria-hidden="true" /> Find New Matches
          </Button>
        </div>
      </div>
    </div>
  );
}
