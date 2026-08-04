import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TABS = ['Broker Approvals', 'Profiles Verification', 'Site Settings', 'Menu Editor'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
  }, [tab]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="bg-gradient-to-r from-burgundy-700 to-[#5c0000] text-white px-6 py-5 flex items-center justify-between">
        <h1 className="font-display text-2xl">Admin Dashboard</h1>
        <button onClick={handleLogout} className="text-sm bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-lg transition-colors">Logout</button>
      </div>

      {stats && (
        <div className="max-w-6xl mx-auto px-5 pt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Brokers" value={stats.totalBrokers} />
          <StatCard label="Pending Brokers" value={stats.pendingBrokers} />
          <StatCard label="Total Profiles" value={stats.totalProfiles} />
          <StatCard label="Verified Profiles" value={stats.verifiedProfiles || 0} />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 pt-6">
        <div className="flex gap-2 mb-6 border-b border-burgundy/15 overflow-x-auto">
          {TABS.map((tName, i) => (
            <button
              key={tName}
              onClick={() => setTab(i)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === i ? 'border-burgundy-600 text-burgundy-700' : 'border-transparent text-[#4a2a1a]/50 hover:text-burgundy-700'
              }`}
            >
              {tName}
            </button>
          ))}
        </div>

        {tab === 0 && <BrokerApprovals />}
        {tab === 1 && <ProfilesVerification />}
        {tab === 2 && <SiteSettings />}
        {tab === 3 && <MenuEditor />}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-2xl font-display text-burgundy-700">{value}</p>
      <p className="text-xs text-[#4a2a1a]/60">{label}</p>
    </div>
  );
}

function BrokerApprovals() {
  const [brokers, setBrokers] = useState(null);

  const load = () => api.get('/admin/brokers/pending').then((res) => setBrokers(res.data.brokers));
  useEffect(() => { load(); }, []);

  const approve = async (id) => { await api.post(`/admin/brokers/${id}/approve`); load(); };
  const reject = async (id) => { if (confirm('Reject this broker application?')) { await api.post(`/admin/brokers/${id}/reject`); load(); } };

  if (brokers === null) return <p className="text-[#4a2a1a]/50">Loading…</p>;
  if (brokers.length === 0) return <div className="glass-card rounded-2xl p-8 text-center text-[#4a2a1a]/60">No pending broker applications.</div>;

  return (
    <div className="space-y-3 pb-12">
      {brokers.map((b) => (
        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#4a2a1a]">{b.business_name} <span className="text-xs text-[#4a2a1a]/50">@{b.username}</span></p>
            <p className="text-sm text-[#4a2a1a]/60">{b.email} · {b.phone_number}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(b.id)} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">Approve</button>
            <button onClick={() => reject(b.id)} className="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">Reject</button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProfilesVerification() {
  const [profiles, setProfiles] = useState(null);

  const load = () => api.get('/admin/profiles').then((res) => setProfiles(res.data.profiles));
  useEffect(() => { load(); }, []);

  const toggleVerify = async (p) => {
    if (p.is_verified) {
      await api.post(`/admin/profiles/${p.id}/unverify`);
    } else {
      await api.post(`/admin/profiles/${p.id}/verify`);
    }
    load();
  };

  if (profiles === null) return <p className="text-[#4a2a1a]/50">Loading profiles…</p>;

  return (
    <div className="space-y-3 pb-12">
      <p className="text-xs text-[#4a2a1a]/60 mb-2">Verify government ID and authenticity for platform user profiles.</p>
      {profiles.map((p) => (
        <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burgundy-100 to-gold/20 flex items-center justify-center font-display text-burgundy-700">
              {p.name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#4a2a1a]">{p.name}</p>
                {p.is_verified === 1 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    ✓ ID Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4a2a1a]/60">
                Owner: {p.username} ({p.role}) · DOB: {p.date_of_birth}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleVerify(p)}
            className={`text-xs px-4 py-2 rounded-lg font-semibold transition-colors ${
              p.is_verified
                ? 'border border-amber-300 text-amber-800 hover:bg-amber-50'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {p.is_verified ? 'Remove Verification' : 'Verify ID ✓'}
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function SiteSettings() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get('/public/settings').then((res) => setSettings(res.data.settings)); }, []);

  const set = (field) => (ev) => setSettings((s) => ({ ...s, [field]: ev.target.value }));

  const save = async () => {
    await api.put('/admin/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <p className="text-[#4a2a1a]/50">Loading…</p>;

  const fields = [
    ['site_name', 'Site Name'], ['contact_number', 'Contact Phone'], ['contact_email', 'Contact Email'],
    ['meta_title', 'Meta Title'], ['meta_description', 'Meta Description'], ['meta_keywords', 'Meta Keywords'],
    ['color_primary', 'Primary Color'], ['color_secondary', 'Secondary Color'], ['color_background', 'Background Color'],
  ];

  return (
    <div className="glass-card rounded-2xl p-6 mb-12 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(([key, label]) => (
          <div key={key} className={key === 'meta_description' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-semibold text-[#4a2a1a]/70 mb-1">{label}</label>
            <input className="input-base" value={settings[key] || ''} onChange={set(key)} />
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-primary mt-6">Save Changes</button>
      {saved && <span className="ml-3 text-sm text-green-700">Saved ✓</span>}
    </div>
  );
}

function MenuEditor() {
  const [items, setItems] = useState(null);
  const [newItem, setNewItem] = useState({ title_en: '', title_ta: '', target_url: '', display_order: 0 });

  const load = () => api.get('/admin/menu-items').then((res) => setItems(res.data.menu_items));
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

  if (items === null) return <p className="text-[#4a2a1a]/50">Loading…</p>;

  return (
    <div className="max-w-2xl pb-12">
      <div className="glass-card rounded-2xl p-4 mb-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-burgundy/10 py-2 last:border-0">
            <div>
              <p className="text-sm font-medium text-[#4a2a1a]">{item.title_en} <span className="text-[#4a2a1a]/40">/ {item.title_ta}</span></p>
              <p className="text-xs text-[#4a2a1a]/50">{item.target_url} · order {item.display_order}</p>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => toggleActive(item)} className={`text-xs px-2.5 py-1 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {item.is_active ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => remove(item.id)} className="text-xs text-red-600 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-burgundy-700 mb-3">Add Menu Item</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="input-base" placeholder="English title" value={newItem.title_en} onChange={(e) => setNewItem((n) => ({ ...n, title_en: e.target.value }))} />
          <input className="input-base" placeholder="Tamil title" value={newItem.title_ta} onChange={(e) => setNewItem((n) => ({ ...n, title_ta: e.target.value }))} />
          <input className="input-base" placeholder="/target-url" value={newItem.target_url} onChange={(e) => setNewItem((n) => ({ ...n, target_url: e.target.value }))} />
          <input className="input-base" type="number" placeholder="Display order" value={newItem.display_order} onChange={(e) => setNewItem((n) => ({ ...n, display_order: Number(e.target.value) }))} />
        </div>
        <button onClick={addItem} className="btn-primary">Add Item</button>
      </div>
    </div>
  );
}
