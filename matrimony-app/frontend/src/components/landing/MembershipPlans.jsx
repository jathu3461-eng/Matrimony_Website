import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Diamond, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/forever',
    tagline: 'Start your love story today',
    icon: Gift,
    cta: 'Create Free Profile',
    features: [
      'Create your profile & upload photos',
      'Browse and search verified matches',
      'Express interest (3 per day)',
      'Connect with matched profiles',
      'Basic horoscope & community view',
    ],
  },
  {
    name: 'Premium',
    price: '₹999',
    period: '/month',
    tagline: 'For serious match-seekers',
    icon: Crown,
    popular: true,
    cta: 'Upgrade to Premium',
    features: [
      'Everything in Free, unlimited',
      'Verified Profile Badge',
      '10+ Porutham horoscope check',
      'AI smart match recommendations',
      'See who viewed your profile',
      'Priority chat & interest alerts',
    ],
  },
  {
    name: 'Platinum',
    price: '₹1,999',
    period: '/month',
    tagline: 'The complete experience',
    icon: Diamond,
    cta: 'Go Platinum',
    features: [
      'Everything in Premium',
      'Profile boost & top visibility',
      'Dedicated matchmaker guidance',
      'Photo unlock on mutual matches',
      'Astrology expert consultation',
      '24/7 priority support',
    ],
  },
];

export default function MembershipPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goRegister = () => navigate(user ? '/dashboard' : '/signup');

  return (
    <section className="max-w-7xl mx-auto px-5 py-16 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] mb-3 block">
          Membership Plans
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--ink)] mb-3">
          Choose Your <span className="text-gradient">Perfect Plan</span> 💍
        </h2>
        <p className="text-sm text-[var(--ink-soft)] font-medium max-w-xl mx-auto">
          Every love story deserves the right start. Pick a plan and unlock premium features designed to bring you closer to your forever.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' }}
              whileHover={{ y: -8 }}
              className={`relative glass-card rounded-[26px] p-7 lg:p-8 flex flex-col ${
                plan.popular
                  ? 'border-2 border-[var(--primary)]/70 shadow-[var(--shadow-pop)] lg:-translate-y-3 lg:scale-[1.02] bg-white'
                  : 'border border-[var(--border)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="grad-primary text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[0_8px_20px_-4px_rgba(224,19,106,0.55)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" /> Most Popular
                  </span>
                </div>
              )}

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                  plan.popular ? 'grad-primary text-white shadow-lg' : 'bg-[var(--primary-soft)] text-[var(--primary)]'
                }`}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>

              <h3 className="font-display text-lg font-extrabold text-[var(--ink)] mb-1">{plan.name}</h3>
              <p className="text-xs font-semibold text-[var(--ink-faint)] mb-5">{plan.tagline}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-extrabold text-[var(--ink)]">{plan.price}</span>
                <span className="text-xs font-bold text-[var(--ink-faint)]">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] font-semibold text-[var(--ink-soft)]">
                    <span className="mt-0.5 w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-[var(--success-soft)] border border-[var(--success)]/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[var(--success)]" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={goRegister}
                fullWidth
                variant={plan.popular ? 'primary' : 'secondary'}
                size="lg"
                className={plan.popular ? '!rounded-full' : '!rounded-full'}
              >
                {plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
