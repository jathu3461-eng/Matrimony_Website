import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
}

export default function Layout() {
  const [settings, setSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.get('/public/settings').then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollToTop />
      <Navbar siteName={settings?.site_name} siteLogo={settings?.site_logo} />
      <main className="flex-1 flex flex-col">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex-1 flex flex-col"
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
