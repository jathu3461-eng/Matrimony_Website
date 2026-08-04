import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export default function BrokerPending() {
  const { t } = useI18n();
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-3xl p-10">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="font-display text-2xl text-burgundy-700 mb-2">{t('broker_pending_title')}</h1>
        <p className="text-[#4a2a1a]/80 font-medium mb-4">{t('broker_pending_desc')}</p>
        <p className="text-sm text-[#4a2a1a]/60 mb-6">{t('broker_pending_note')}</p>
        <Link to="/login" className="btn-secondary inline-block">{t('back_to_login')}</Link>
      </motion.div>
    </div>
  );
}
