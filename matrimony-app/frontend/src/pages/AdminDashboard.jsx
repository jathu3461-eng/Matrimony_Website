import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BadgeCheck,
  Settings,
  ListOrdered,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Mail,
  Phone,
  Users,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  Heart,
  RefreshCw,
  Star,
  Crown,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { key: 'overview', path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, desc: 'Platform snapshot' },
  { key: 'brokers', path: '/admin/brokers', label: 'Broker Approvals', icon: Building2, desc: 'Approve broker accounts' },
  { key: 'profiles', path: '/admin/profiles', label: 'Profile Verification', icon: BadgeCheck, desc: 'Verify member profiles' },
  { key: 'settings', path: '/admin/settings', label: 'Site Settings', icon: Settings, desc: 'Brand & contact details' },
  { key: 'menu', path: '/admin/menu', label: 'Menu Editor', icon: ListOrdered, desc: 'Navigation menu items' },
];

const SECTION_FROM_PATH = (path) => {
  const found = NAV_ITEMS.find((n) => n.path === path);
  return found ? found.key : 'overview';
};

const SECTION_META = Object.fromEntries(NAV_ITEMS.map((n) => [n.key, n]));

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const section = SECTION_FROM_PATH(location.pathname);
  const activeMeta = SECTION_META[section];

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
  }, [section]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f9] via-[#fdf2f7] to-[#ffe4ef]">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-[#3d0a2a] via-[#5c0a2f] to-[#8a0f45] text-white z-40">
        <SidebarContent user={user} section={section} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile drawer ── */}
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
              className="lg:hidden fixed inset-y-0 left-0 w-72 flex flex-col bg-gradient-to-b from-[#3d0a2a] via-[#5c0a2f] to-[#8a0f45] text-white z-50 shadow-2xl"
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

      {/* ── Main column ── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-pink-100/80 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                {activeMeta?.label || 'Admin'}
              </h1>
              <p className="hidden sm:block text-[11px] font-semibold text-pink-500">{activeMeta?.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-display font-extrabold text-white shadow-md shadow-pink-500/30">
                {(user?.username || 'A')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-tight">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {section === 'overview' && <Overview stats={stats} />}
              {section === 'brokers' && <BrokerApprovals />}
              {section === 'profiles' && <ProfilesVerification />}
              {section === 'settings' && <SiteSettings />}
              {section === 'menu' && <MenuEditor />}
            </motion.div>
          </AnimatePresence>
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
            💖
          </motion.div>
          <div>
            <span className="font-display text-lg font-extrabold text-white tracking-tight leading-none">
              Mukurtham
            </span>
            <span className="block text-[9px] font-bold text-pink-300 tracking-[0.25em] uppercase mt-1">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Admin chip */}
      <div className="mx-5 mt-5 rounded-2xl bg-white/10 border border-white/10 p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center font-display font-extrabold text-white shrink-0">
          {(user?.username || 'A')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.username || 'Admin'}</p>
          <p className="flex items-center gap-1 text-[10px] font-bold text-pink-300 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" /> Super Admin
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
                <motion.span layoutId="nav-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-300" />
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

function StatCard({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-white border border-pink-100/80 p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-slate-800 tracking-tight">{value ?? '—'}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────── */

function Overview({ stats }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const cards = stats
    ? [
        { icon: Users, label: 'Total Users', value: stats.totalUsers, accent: 'from-pink-500 to-rose-500' },
        { icon: Building2, label: 'Brokers', value: stats.totalBrokers, accent: 'from-fuchsia-500 to-pink-500' },
        { icon: Clock, label: 'Pending Approvals', value: stats.pendingBrokers, accent: 'from-amber-400 to-orange-500' },
        { icon: Heart, label: 'Member Profiles', value: stats.totalProfiles, accent: 'from-rose-500 to-red-400' },
        { icon: BadgeCheck, label: 'Verified Profiles', value: stats.verifiedProfiles || 0, accent: 'from-emerald-500 to-teal-500' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3d0a2a] via-[#8a0f45] to-[#e0136a] text-white p-6 sm:p-8 shadow-elevated">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-pink-200 text-[11px] font-bold uppercase tracking-[0.22em]">
            <Sparkles className="w-4 h-4" /> Admin Overview
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, Admin 👋
          </h2>
          <p className="mt-1.5 text-sm text-pink-100/80 font-medium">{today}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/15 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/15 border border-white/15">
              <Crown className="w-3.5 h-3.5 text-amber-300" /> Secure admin session active
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <StatCard key={c.label} {...c} delay={i * 0.06} />
        ))}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="rounded-2xl bg-white border border-pink-100/80 p-6 shadow-card"
      >
        <h3 className="font-display text-lg font-extrabold text-slate-800">Quick Actions</h3>
        <p className="text-xs text-slate-400 font-medium">Jump straight into the most common admin tasks.</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <QuickAction
            icon={UserCheck}
            title="Review Broker Applications"
            subtitle="Approve or reject pending broker registrations"
            to="/admin/brokers"
            accent="from-fuchsia-500 to-pink-500"
          />
          <QuickAction
            icon={BadgeCheck}
            title="Verify Member Profiles"
            subtitle="Confirm identity and mark profiles as verified"
            to="/admin/profiles"
            accent="from-rose-500 to-red-400"
          />
          <QuickAction
            icon={Settings}
            title="Update Site Settings"
            subtitle="Branding, contact info, SEO and analytics"
            to="/admin/settings"
            accent="from-pink-500 to-rose-500"
          />
          <QuickAction
            icon={ListOrdered}
            title="Edit Navigation Menu"
            subtitle="Manage the menu items shown across the site"
            to="/admin/menu"
            accent="from-amber-400 to-orange-500"
          />
        </div>
      </motion.div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, subtitle, to, accent }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-pink-100 bg-gradient-to-br from-[#fff8fb] to-[#fff0f6] hover:shadow-elevated hover:-translate-y-0.5 transition-all"
    >
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-700">{title}</p>
        <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

/* ── Broker Approvals ────────────────────────────────────────────────────── */

function BrokerApprovals() {
  const [view, setView] = useState('pending');
  const [pending, setPending] = useState(null);
  const [all, setAll] = useState(null);

  const load = () => {
    api.get('/admin/brokers/pending').then((res) => setPending(res.data.brokers)).catch(() => setPending([]));
    api.get('/admin/brokers/all').then((res) => setAll(res.data.brokers)).catch(() => setAll([]));
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => { await api.post(`/admin/brokers/${id}/approve`); load(); };
  const reject = async (id) => { if (confirm('Reject this broker application?')) { await api.post(`/admin/brokers/${id}/reject`); load(); } };
  const setQuota = async (id, value) => { await api.put(`/admin/brokers/${id}/quota`, { broker_profile_limit: Number(value) }); load(); };

  return (
    <div className="space-y-5 pb-12">
      {/* Sub-tabs */}
      <div className="inline-flex p-1 rounded-2xl bg-pink-100/70 border border-pink-200/60">
        {['pending', 'all'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              view === v ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-500/70 hover:text-pink-600'
            }`}
          >
            {v === 'pending' ? 'Pending Approvals' : 'All Brokers'}
          </button>
        ))}
      </div>

      {view === 'pending' && (
        <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-pink-100/80 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-800">Broker Applications</h3>
              <p className="text-[11px] text-slate-400 font-medium">Accounts waiting for your approval</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              {pending === null ? '…' : pending.length} pending
            </span>
          </div>

          {pending === null ? (
            <div className="p-10 text-center text-slate-400 text-sm font-medium">Loading applications…</div>
          ) : pending.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="mt-3 text-sm font-bold text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 font-medium">No pending broker applications right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-pink-50">
              {pending.map((b) => (
                <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center font-display font-extrabold text-pink-700 shrink-0">
                      {(b.business_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 truncate">
                        {b.business_name} <span className="text-xs font-semibold text-slate-400">@{b.username}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-3 mt-0.5">
                        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {b.email}</span>
                        <span className="hidden sm:inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {b.phone_number}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approve(b.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => reject(b.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'all' && (
        <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-pink-100/80">
            <h3 className="font-display text-base font-extrabold text-slate-800">All Brokers</h3>
            <p className="text-[11px] text-slate-400 font-medium">Registered broker accounts and their profile quota</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-pink-50 bg-pink-50/40">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Profile Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {(all || []).map((b) => (
                  <tr key={b.id} className="hover:bg-pink-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-slate-700">{b.business_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">@{b.username}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-500 font-medium">{b.email}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{b.phone_number}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {b.is_approved === 1 ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Approved</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <QuotaInput value={b.broker_profile_limit} onSave={(v) => setQuota(b.id, v)} />
                    </td>
                  </tr>
                ))}
                {all && all.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">No brokers registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function QuotaInput({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-700">{value}</span>
        <button
          onClick={() => { setVal(value); setEditing(true); }}
          className="text-[11px] font-bold text-pink-600 hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 px-2 py-1 text-sm font-bold text-slate-700 rounded-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
      <button
        onClick={() => { onSave(val); setEditing(false); }}
        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
      >
        Save
      </button>
      <button onClick={() => setEditing(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
        Cancel
      </button>
    </div>
  );
}

/* ── Profile Verification ────────────────────────────────────────────────── */

function ProfilesVerification() {
  const [profiles, setProfiles] = useState(null);

  const load = () => api.get('/admin/profiles').then((res) => setProfiles(res.data.profiles)).catch(() => setProfiles([]));
  useEffect(() => { load(); }, []);

  const toggleVerify = async (p) => {
    if (p.is_verified) await api.post(`/admin/profiles/${p.id}/unverify`);
    else await api.post(`/admin/profiles/${p.id}/verify`);
    load();
  };

  return (
    <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card overflow-hidden pb-12">
      <div className="px-5 py-4 border-b border-pink-100/80">
        <h3 className="font-display text-base font-extrabold text-slate-800">Profile Verification</h3>
        <p className="text-[11px] text-slate-400 font-medium">
          Verify government ID and authenticity for platform user profiles.
        </p>
      </div>

      {profiles === null ? (
        <div className="p-10 text-center text-slate-400 text-sm font-medium">Loading profiles…</div>
      ) : profiles.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm font-medium">No profiles found.</div>
      ) : (
        <div className="divide-y divide-pink-50">
          {profiles.map((p) => (
            <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center font-display font-extrabold text-pink-800 shrink-0">
                  {(p.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-700">{p.name}</p>
                    {p.is_verified === 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <BadgeCheck className="w-3 h-3" /> ID Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Owner: {p.username} ({p.role}) · DOB: {p.date_of_birth}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleVerify(p)}
                className={`shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  p.is_verified
                    ? 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30 hover:scale-[1.02]'
                }`}
              >
                {p.is_verified ? <><RefreshCw className="w-4 h-4" /> Remove Verification</> : <><BadgeCheck className="w-4 h-4" /> Verify ID</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Site Settings ───────────────────────────────────────────────────────── */

function SiteSettings() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/public/settings').then((res) => setSettings(res.data.settings)); }, []);

  const set = (field) => (ev) => setSettings((s) => ({ ...s, [field]: ev.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card p-10 text-center text-slate-400 text-sm font-medium">Loading settings…</div>;
  }

  const groups = [
    {
      title: 'Brand & Identity',
      desc: 'How your matrimony site presents itself.',
      fields: [
        ['site_name', 'Site Name'],
        ['contact_number', 'Contact Phone'],
        ['contact_email', 'Contact Email'],
      ],
    },
    {
      title: 'SEO & Analytics',
      desc: 'Help search engines understand your platform.',
      fields: [
        ['meta_title', 'Meta Title'],
        ['meta_description', 'Meta Description'],
        ['meta_keywords', 'Meta Keywords'],
      ],
      wide: ['meta_description', 'meta_keywords'],
    },
    {
      title: 'Theme Colors',
      desc: 'Primary accent colors used across the site.',
      fields: [
        ['color_primary', 'Primary Color'],
        ['color_secondary', 'Secondary Color'],
        ['color_background', 'Background Color'],
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card overflow-hidden max-w-3xl">
        {groups.map((group) => (
          <div key={group.title} className="px-6 py-6 border-b border-pink-50">
            <h3 className="font-display text-base font-extrabold text-slate-800">{group.title}</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-5">{group.desc}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {group.fields.map(([key, label]) => (
                <div key={key} className={group.wide?.includes(key) ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-shadow"
                    value={settings[key] || ''}
                    onChange={set(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="px-6 py-5 flex items-center gap-3 bg-pink-50/40">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Menu Editor ─────────────────────────────────────────────────────────── */

function MenuEditor() {
  const [items, setItems] = useState(null);
  const [newItem, setNewItem] = useState({ title_en: '', title_ta: '', target_url: '', display_order: 0 });

  const load = () => api.get('/admin/menu-items').then((res) => setItems(res.data.menu_items)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!newItem.title_en || !newItem.title_ta || !newItem.target_url) return;
    await api.post('/admin/menu-items', newItem);
    setNewItem({ title_en: '', title_ta: '', target_url: '', display_order: 0 });
    load();
  };

  const toggleActive = async (item) => {
    await api.put(`/admin/menu-items/${item.id}`, { ...item, is_active: !item.is_active });
    load();
  };

  const remove = async (id) => { await api.delete(`/admin/menu-items/${id}`); load(); };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-shadow';

  return (
    <div className="space-y-5 pb-12 max-w-3xl">
      <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/80">
          <h3 className="font-display text-base font-extrabold text-slate-800">Navigation Menu</h3>
          <p className="text-[11px] text-slate-400 font-medium">Items shown in the site navigation</p>
        </div>
        {items === null ? (
          <div className="p-10 text-center text-slate-400 text-sm font-medium">Loading menu…</div>
        ) : (
          <div className="divide-y divide-pink-50">
            {items.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700">
                    {item.title_en} <span className="font-medium text-slate-400">/ {item.title_ta}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {item.target_url} · order {item.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(item)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                      item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => remove(item.id)} className="text-[11px] font-bold text-rose-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="p-10 text-center text-slate-400 text-sm font-medium">No menu items yet.</div>}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-pink-100/80 shadow-card p-6">
        <h3 className="font-display text-base font-extrabold text-slate-800">Add Menu Item</h3>
        <p className="text-[11px] text-slate-400 font-medium mb-5">Create a new navigation entry</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">English title</label>
            <input className={inputCls} placeholder="Home" value={newItem.title_en} onChange={(e) => setNewItem((n) => ({ ...n, title_en: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Tamil title</label>
            <input className={inputCls} placeholder="முகப்பு" value={newItem.title_ta} onChange={(e) => setNewItem((n) => ({ ...n, title_ta: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Target URL</label>
            <input className={inputCls} placeholder="/target-url" value={newItem.target_url} onChange={(e) => setNewItem((n) => ({ ...n, target_url: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Display order</label>
            <input className={inputCls} type="number" placeholder="0" value={newItem.display_order} onChange={(e) => setNewItem((n) => ({ ...n, display_order: Number(e.target.value) }))} />
          </div>
        </div>
        <button
          onClick={addItem}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all"
        >
          <Star className="w-4 h-4" /> Add Item
        </button>
      </div>
    </div>
  );
}
