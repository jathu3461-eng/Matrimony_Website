import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, MessagesSquare, Lock, ShieldCheck } from 'lucide-react';
import api, { uploadsUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button, Badge } from './ui';

export default function ProfileCard({ profile, actions, onShortlistChange }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isShortlisted, setIsShortlisted] = useState(Boolean(profile.is_shortlisted));
  const [shortlistLoading, setShortlistLoading] = useState(false);

  // Mouse-tilt reactive values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    rotateX.set((-deltaY / rect.height) * 10);
    rotateY.set((deltaX / rect.width) * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleToggleShortlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setShortlistLoading(true);
    try {
      const res = await api.post('/interests/shortlist', { profile_id: profile.id });
      setIsShortlisted(res.data.shortlisted);
      if (onShortlistChange) onShortlistChange(profile.id, res.data.shortlisted);
    } catch (err) {
      console.error(err);
    } finally {
      setShortlistLoading(false);
    }
  };

  const [interestStatus, setInterestStatus] = useState(profile.interest_status || null);
  const [interestLoading, setInterestLoading] = useState(false);

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (interestStatus === 'accepted') {
      navigate('/chat');
      return;
    }
    if (interestStatus === 'pending' || interestStatus === 'declined' || interestStatus === 'rejected') {
      return;
    }

    const receiverId = profile?.id || profile?.user_id;
    if (!receiverId) {
      alert("Error: Target profile ID is missing or invalid!");
      return;
    }

    setInterestLoading(true);
    try {
      const res = await api.post('/interests/send', {
        receiver_id: receiverId,
        receiver_profile_id: receiverId,
      });
      if (res.data.alreadySent) {
        setInterestStatus(res.data.status || 'pending');
      } else {
        setInterestStatus('pending');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadySent) {
        setInterestStatus(data?.status || 'pending');
      } else {
        const errorMsg = data?.message || data?.error || 'Failed to send interest';
        if (errorMsg.includes('already')) {
          setInterestStatus('pending');
        } else {
          alert(`Failed to send interest: ${errorMsg}`);
        }
      }
    } finally {
      setInterestLoading(false);
    }
  };

  const tags = profile.gender === 'F'
    ? ['Doctor', 'Music', 'Cooking', 'Travel']
    : ['Software Engineer', 'Gaming', 'Fitness', 'Movies'];

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6 }}
      className="glass-card rounded-3xl overflow-hidden flex flex-col cursor-pointer relative group shadow-[var(--shadow-elevated)]"
    >
      {/* 3D Verification & Status Badge */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Active Profile
        </span>

        {profile.is_verified ? (
          <span className="bg-[var(--primary)] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verified
          </span>
        ) : (
          <span className="bg-white/80 backdrop-blur text-[var(--ink-soft)] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ID Pending
          </span>
        )}
      </div>

      <Link to={`/profile/${profile.id}`} className="block relative z-10">
        <div className="h-56 bg-gradient-to-br from-pink-100 via-rose-100 to-pink-100 flex items-center justify-center overflow-hidden relative">
          {profile.main_profile_picture && !profile.blur_photo ? (
            <img
              src={uploadsUrl(profile.main_profile_picture)}
              alt={profile.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.parentNode) {
                  e.target.parentNode.innerHTML = `<div class="flex flex-col items-center justify-center"><div class="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-lg border-4 border-white"><span class="text-5xl">${profile.gender === 'F' ? '👧🏽' : '👦🏽'}</span></div></div>`;
                }
              }}
            />
          ) : profile.blur_photo ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-pink-50/80 p-4">
              <Lock className="w-8 h-8 text-[var(--primary-strong)] mb-1" aria-hidden="true" />
              <p className="text-[10px] font-bold text-[var(--primary-strong)] text-center">Photo blurred until mutual match</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {profile.gender === 'F' ? (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-5xl">👧🏽</span>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-300 to-rose-200 flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-5xl">👦🏽</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-5 bg-[var(--surface-glass)]">
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-display text-lg font-bold text-[var(--ink)] truncate">{profile.name}</h3>
            {profile.is_verified && <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" aria-label="Verified Profile" />}
          </div>

          <p className="text-xs font-semibold text-[var(--ink-soft)] mb-1">
            {profile.age ? `${profile.age} yrs` : 'Age N/A'} · {profile.height_feet}'{profile.height_inches}" · {profile.city_or_state || 'Diaspora'}
          </p>

          <p className="text-xs text-[var(--primary)] font-bold mb-3 truncate">{profile.occupation}</p>

          {/* Interest Chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="primary" className="!bg-[var(--primary-soft)]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>

      {/* Action Buttons: Shortlist & Express Interest */}
      {actions ? (
        <div className="px-4 pb-4 flex gap-2 z-10 relative bg-[var(--surface-glass)]">
          {actions}
        </div>
      ) : (
        <div className="px-4 pb-4 flex gap-2 z-10 relative bg-[var(--surface-glass)]">
          <Button
            size="sm"
            fullWidth
            variant={isShortlisted ? 'soft' : 'secondary'}
            loading={shortlistLoading}
            onClick={handleToggleShortlist}
          >
            {isShortlisted ? <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> : <Star className="w-3.5 h-3.5" aria-hidden="true" />}
            {isShortlisted ? 'Shortlisted' : 'Shortlist'}
          </Button>

          <Button
            size="sm"
            fullWidth
            loading={interestLoading}
            disabled={interestStatus === 'pending' || interestStatus === 'declined' || interestStatus === 'rejected'}
            onClick={handleExpressInterest}
            className={
              interestStatus === 'accepted'
                ? '!bg-[linear-gradient(135deg,#10b981,#059669)] !shadow-[0_8px_25px_-4px_rgba(16,185,129,0.45)]'
                : interestStatus === 'pending'
                ? '!bg-[var(--primary-soft)] !text-[var(--primary-strong)]'
                : interestStatus === 'declined' || interestStatus === 'rejected'
                ? '!bg-[var(--surface-muted)] !text-[var(--ink-faint)]'
                : ''
            }
          >
            {interestStatus === 'accepted' ? (
              <MessagesSquare className="w-3.5 h-3.5" aria-hidden="true" />
            ) : interestStatus === 'pending' || interestStatus === 'declined' || interestStatus === 'rejected' ? (
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {interestLoading
              ? 'Sending…'
              : interestStatus === 'accepted'
              ? 'Send Message'
              : interestStatus === 'pending'
              ? 'Sent (Pending)'
              : interestStatus === 'declined' || interestStatus === 'rejected'
              ? 'Declined'
              : 'Interest'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
