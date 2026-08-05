import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useI18n } from '../context/I18nContext';

export default function Footer() {
  const [footer, setFooter] = useState(null);
  const { lang } = useI18n();

  useEffect(() => {
    api.get('/public/footer-settings').then((res) => setFooter(res.data.footer_settings)).catch(() => {});
  }, []);

  const socials = footer ? [
    { key: 'social_facebook', label: 'Facebook', icon: '🔵' },
    { key: 'social_instagram', label: 'Instagram', icon: '📸' },
    { key: 'social_youtube', label: 'YouTube', icon: '▶️' },
    { key: 'social_tiktok', label: 'TikTok', icon: '🎵' },
  ].filter((s) => footer[s.key]) : [];

  return (
    <footer className="mt-28 bg-gradient-to-b from-slate-900 via-[#3d0a2a] to-[#240414] text-white pt-16 pb-10 border-t border-pink-500/20 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xl shadow-lg">
                💖
              </div>
              <span className="font-display text-2xl font-extrabold text-white tracking-tight">
                Mukurtham Matrimony
              </span>
            </div>
            <p className="text-sm text-pink-100/70 leading-relaxed mb-6 max-w-sm">
              {footer ? (lang === 'ta' ? footer.footer_about_snippet_ta : footer.footer_about_snippet_en) : 'Trusted matchmaking platform for the global Sri Lankan Tamil diaspora. Loved for happiness, verified for safety.'}
            </p>

            {/* App Store Download Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 flex items-center gap-3 hover:bg-white/15 transition-all cursor-pointer">
                <span className="text-2xl">▶️</span>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-pink-200/60 font-semibold">GET IT ON</p>
                  <p className="text-xs font-bold text-white">Google Play</p>
                </div>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 flex items-center gap-3 hover:bg-white/15 transition-all cursor-pointer">
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-pink-200/60 font-semibold">DOWNLOAD ON THE</p>
                  <p className="text-xs font-bold text-white">App Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-base font-bold text-pink-300 mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-pink-100/70 font-medium">
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">About Us</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Careers</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Success Stories</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Press &amp; Media</Link></li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="font-display text-base font-bold text-pink-300 mb-4">Help &amp; Support</h4>
            <ul className="space-y-2.5 text-xs text-pink-100/70 font-medium">
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">How It Works</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Safety Tips</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* For Members */}
          <div>
            <h4 className="font-display text-base font-bold text-pink-300 mb-4">For Members</h4>
            <ul className="space-y-2.5 text-xs text-pink-100/70 font-medium">
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Premium Membership</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">10-Porutham Match</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Broker Portal</Link></li>
              <li><Link to="/search" className="hover:text-pink-400 transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-pink-100/50">
          <p>{footer ? (lang === 'ta' ? footer.footer_copyright_text_ta : footer.footer_copyright_text_en) : '© 2026 Mukurtham Matrimony. All Rights Reserved.'}</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-pink-500 animate-pulse text-sm">💖</span> for your eternal happiness
          </p>

          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s) => (
                <a key={s.key} href={footer[s.key]} target="_blank" rel="noreferrer" className="text-pink-200/80 hover:text-pink-400 transition-colors text-sm">
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
