import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Layout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/public/settings').then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: settings?.color_background || '#fafaf9' }}>
      <Navbar siteName={settings?.site_name} siteLogo={settings?.site_logo} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
