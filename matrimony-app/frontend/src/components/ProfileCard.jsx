import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

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
        receiver_profile_id: receiverId 
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
      className="glass-card rounded-3xl overflow-hidden flex flex-col cursor-pointer relative group border border-pink-200/50 shadow-lg shadow-pink-500/5"
    >
      {/* 3D Verification & Status Badge */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Active Profile
        </span>

        {profile.is_verified ? (
          <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-200">
            ✓ Verified
          </span>
        ) : (
          <span className="bg-white/80 backdrop-blur text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ID Pending
          </span>
        )}
      </div>

      <Link to={`/profile/${profile.id}`} className="block relative z-10">
        {/* Card Header / Image Section */}
        <div className="h-56 bg-gradient-to-br from-pink-100 via-rose-100 to-amber-100 flex items-center justify-center overflow-hidden relative">
          {profile.main_profile_picture && !profile.blur_photo ? (
            <img
              src={`/uploads/${profile.main_profile_picture}`}
              alt={profile.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : profile.blur_photo ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-pink-50/80 p-4">
              <span className="text-4xl mb-1">🔒</span>
              <p className="text-[10px] font-bold text-pink-700 text-center">Photo blurred until mutual match</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {profile.gender === 'F' ? (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-5xl">👧🏽</span>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-400 to-sky-300 flex items-center justify-center shadow-lg border-4 border-white">
                  <span className="text-5xl">👦🏽</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-5 bg-white/90">
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-display text-lg font-bold text-slate-800 truncate">{profile.name}</h3>
            {profile.is_verified && <span className="text-xs text-amber-500 font-bold" title="Verified Profile">✓</span>}
          </div>

          <p className="text-xs font-semibold text-slate-600 mb-1">
            {profile.age ? `${profile.age} yrs` : 'Age N/A'} · {profile.height_feet}'{profile.height_inches}" · {profile.city_or_state || 'Diaspora'}
          </p>

          <p className="text-xs text-pink-600 font-bold mb-3 truncate">{profile.occupation}</p>

          {/* Interest Chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Action Buttons: Shortlist & Express Interest */}
      {actions ? (
        <div className="px-4 pb-4 flex gap-2 z-10 relative bg-white/90">
          {actions}
        </div>
      ) : (
        <div className="px-4 pb-4 flex gap-2 z-10 relative bg-white/90">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleShortlist}
            disabled={shortlistLoading}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
              isShortlisted
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <span>{isShortlisted ? '⭐' : '☆'}</span>
            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExpressInterest}
            disabled={interestLoading || interestStatus === 'pending' || interestStatus === 'declined' || interestStatus === 'rejected'}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1 transition-all ${
              interestStatus === 'accepted'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                : interestStatus === 'pending'
                ? 'bg-pink-100 text-pink-700 border border-pink-200 cursor-not-allowed'
                : interestStatus === 'declined' || interestStatus === 'rejected'
                ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                : 'text-white'
            }`}
            style={!interestStatus ? { background: 'linear-gradient(90deg, #f43f5e, #ec4899)' } : {}}
          >
            <span>
              {interestStatus === 'accepted' ? '💬' : interestStatus === 'pending' ? '⏳' : interestStatus === 'declined' || interestStatus === 'rejected' ? '✕' : '💖'}
            </span>
            <span>
              {interestLoading
                ? 'Sending…'
                : interestStatus === 'accepted'
                ? 'Send Message'
                : interestStatus === 'pending'
                ? 'Sent (Pending)'
                : interestStatus === 'declined' || interestStatus === 'rejected'
                ? 'Declined'
                : 'Interest'}
            </span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
