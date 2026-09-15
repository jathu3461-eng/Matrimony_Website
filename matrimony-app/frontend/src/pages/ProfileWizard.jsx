import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Camera, Check, FileText, GraduationCap, Heart, Landmark,
  MapPin, Ruler, Star, User, Users, Wallet, X, Save, ImagePlus, Video, Upload,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Button, Stepper, ProgressBar, Badge, ErrorCard, TextField, SelectField, TextareaField, SearchableSelect, useToast } from '../components/ui';
import { profileSteps, validateStep, POSTED_BY } from '../lib/validation';

const STEP_ICONS = { User, GraduationCap, Ruler, Heart, Wallet, Landmark, Star, MapPin, Camera, FileText, Video };

const DIET_OPTIONS = [
  { value: 'any', label: 'Any / Flexible' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'jain', label: 'Jain' },
];
const FAMILY_VALUES = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'liberal', label: 'Liberal' },
];
const CAREER_GOALS = [
  { value: 'working', label: 'Career Oriented / Working' },
  { value: 'home_maker', label: 'Home Maker' },
  { value: 'open', label: 'Flexible / Open' },
];
const RELOCATE = [
  { value: 'open', label: 'Open to Relocate' },
  { value: 'local_only', label: 'Local Only' },
  { value: 'overseas_only', label: 'Overseas Only' },
];
const INCOME_RANGE = [
  { value: 'Under $50k', label: 'Under $50k' },
  { value: '$50k - $100k', label: '$50k - $100k' },
  { value: '$100k - $150k', label: '$100k - $150k' },
  { value: '$150k+', label: '$150k+' },
];
const MANGLIK = [
  { value: 'no', label: 'No Dosham / Non-Manglik' },
  { value: 'yes', label: 'Chevvai Dosham / Manglik' },
  { value: 'dont_know', label: "Don't Know" },
];

const EMPTY_FORM = {
  profile_registered_for: 'Self', name: '', gender: '', looking_for: '', date_of_birth: '',
  height_feet: '5', height_inches: '6', height_cm: '', education: '', occupation: '',
  religion_id: '', caste_id: '', sub_religion: '', raasi_id: '', star_id: '',
  born_country_id: '', current_country_id: '', city_or_state: '', about_me: '',
  blur_photo: 0, blur_horoscope: 0,
  diet: 'any', family_values: 'moderate', career_goals: 'working',
  willing_to_relocate: 'open', income_range: '$50k - $100k', manglik_status: 'no',
};

const DRAFT_KEY_PREFIX = 'mukurtham_draft_';

function OptionSelect({ label, options, value, onChange, name, required, error, help }) {
  return (
    <SelectField
      label={label}
      options={options}
      value={value}
      name={name}
      onChange={onChange}
      required={required}
      error={error}
      help={help}
    />
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] cursor-pointer hover:border-[var(--primary-strong)] transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="mt-0.5 w-4 h-4 accent-[var(--primary)]" />
      <span>
        <span className="block text-sm font-bold text-[var(--ink)]">{label}</span>
        <span className="block text-xs text-[var(--ink-faint)] mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

function PhotoField({ label, accept, file, onFile, existing }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="input-base file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary-soft)] file:text-[var(--primary-strong)] file:font-bold file:text-xs file:px-3 file:py-1.5 file:cursor-pointer cursor-pointer"
        />
      </div>
      {file && (
        <p className="text-[11px] font-semibold text-[var(--success)] mt-1 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" aria-hidden="true" /> {file.name}
        </p>
      )}
      {!file && existing && (
        <p className="text-[11px] text-[var(--ink-faint)] mt-1 truncate">
          Current: <span className="font-semibold">{existing}</span>
        </p>
      )}
    </div>
  );
}

export default function ProfileWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const { lang, setLang } = useI18n();

  const [meta, setMeta] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(isEdit);
  const [checkingExisting, setCheckingExisting] = useState(!isEdit);
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [horoscopeFile, setHoroscopeFile] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [existingHoroscope, setExistingHoroscope] = useState(null);
  const [draftStatus, setDraftStatus] = useState('');
  const contentRef = useRef(null);
  const [userId, setUserId] = useState('anon');
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [videoDurationValid, setVideoDurationValid] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoError, setVideoError] = useState('');
  const videoRef = useRef(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;

  const stepErrors = useMemo(() => validateStep(step, form), [step, form]);
  const completion = useMemo(() => {
    let done = 0;
    profileSteps.forEach((_, i) => { if (Object.keys(validateStep(i, form)).length === 0) done += 1; });
    return Math.round((done / profileSteps.length) * 100);
  }, [form]);
  const validSteps = useMemo(
    () => profileSteps.map((_, i) => Object.keys(validateStep(i, form)).length === 0),
    [form]
  );
  const maxReachable = useMemo(() => {
    let m = 0;
    while (m < profileSteps.length && validSteps[m]) m += 1;
    return m;
  }, [validSteps]);

  useEffect(() => {
    api.get('/profiles/meta').then((res) => setMeta(res.data)).catch(() => setMeta({ religions: [], castes: [], raasis: [], stars: [], countries: [] }));
  }, []);

  useEffect(() => {
    if (isEdit) { setCheckingExisting(false); return; }
    if (!user) return;
    if (user.role !== 'regular') { setCheckingExisting(false); return; }
    api.get('/profiles/mine')
      .then((res) => {
        const list = res.data.profiles || res.data || [];
        if (list.length > 0) {
          navigate(`/profile/${list[0].id}/edit`, { replace: true });
        } else {
          setCheckingExisting(false);
        }
      })
      .catch(() => setCheckingExisting(false));
  }, [id, isEdit, user]);

  useEffect(() => {
    if (!isEdit) return;
    setLoadingProfile(true);
    api.get(`/profiles/${id}`).then((res) => {
      const p = res.data.profile;
      setForm({
        ...EMPTY_FORM,
        profile_registered_for: p.profile_registered_for || 'Self',
        name: p.name || '', gender: p.gender || '', looking_for: p.looking_for || '', date_of_birth: p.date_of_birth || '',
        height_feet: String(p.height_feet ?? '5'), height_inches: String(p.height_inches ?? '6'),
        height_cm: p.height_cm || String(Math.round(((Number(p.height_feet ?? 5) * 12 + Number(p.height_inches ?? 6)) * 2.54))),
        education: p.education || '', occupation: p.occupation || '',
        religion_id: p.religion_id ?? '', caste_id: p.caste_id ?? '', sub_religion: p.sub_religion || '',
        raasi_id: p.raasi_id ?? '', star_id: p.star_id ?? '',
        born_country_id: p.born_country_id || '', current_country_id: p.current_country_id || '',
        city_or_state: p.city_or_state || '', about_me: p.about_me || '',
        blur_photo: p.blur_photo ?? 0, blur_horoscope: p.blur_horoscope ?? 0,
        diet: p.diet || 'any', family_values: p.family_values || 'moderate',
        career_goals: p.career_goals || 'working', willing_to_relocate: p.willing_to_relocate || 'open',
        income_range: p.income_range || '$50k - $100k', manglik_status: p.manglik_status || 'no',
      });
      setExistingPhoto(p.main_profile_picture);
      setExistingHoroscope(p.horoscope_chart);
      setLoadingProfile(false);
    }).catch(() => { setLoadingProfile(false); toast.error('Could not load profile'); });
  }, [id, isEdit, toast]);

  // Check existing video status for edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get('/verification-video/status')
      .then((res) => {
        if (res.data.status) setVideoStatus(res.data.status);
      })
      .catch(() => {});
  }, [isEdit]);

  // Check existing video status for edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get('/verification-video/status')
      .then((res) => {
        if (res.data.status) setVideoStatus(res.data.status);
      })
      .catch(() => {});
  }, [isEdit]);

  // Restore draft (create mode only)
  useEffect(() => {
    if (isEdit) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setForm((f) => ({ ...f, ...draft.form }));
        setStep(Math.min(draft.step || 0, profileSteps.length - 1));
        setDraftStatus(draft.savedAt ? `Draft restored · ${draft.savedAt}` : 'Draft restored');
        toast.info('Draft restored', { duration: 4000 });
      }
    } catch { /* ignore corrupt draft */ }
  }, [draftKey, isEdit, toast]);

  // Autosave draft (create mode), debounced
  useEffect(() => {
    if (isEdit) return;
    const tId = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, step, savedAt: new Date().toLocaleTimeString() }));
        setDraftStatus(`Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch { /* storage full */ }
    }, 900);
    return () => clearTimeout(tId);
  }, [form, step, draftKey, isEdit]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setDraftStatus('');
    setForm(EMPTY_FORM);
    setStep(0);
    setTouched({});
    toast.info('Draft cleared');
  }, [draftKey, toast]);

  const set = (field) => (ev) => setForm((f) => ({ ...f, [field]: ev.target.value }));
  const blur = (field) => () => setTouched((tt) => ({ ...tt, [field]: true }));

  const cmFromFtIn = (ft, inches) => Math.round(((Number(ft) * 12 + Number(inches)) * 2.54));
  const ftInFromCm = (cm) => {
    const totalInches = Number(cm) / 2.54;
    const ft = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches % 12);
    if (inches === 12) { return { feet: String(ft + 1), inches: '0' }; }
    return { feet: String(ft), inches: String(inches) };
  };

  const focusFirstInvalid = useCallback((errs) => {
    requestAnimationFrame(() => {
      for (const f of profileSteps[step].fields) {
        if (errs[f]) {
          const el = contentRef.current?.querySelector(`[name="${f}"]`);
          if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        }
      }
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [step]);

  const markStepTouched = useCallback(() => {
    setTouched((tt) => ({ ...tt, ...Object.fromEntries(profileSteps[step].fields.map((f) => [f, true])) }));
  }, [step]);

  const goNext = () => {
    markStepTouched();
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) {
      focusFirstInvalid(errs);
      toast.error(`Please fix the highlighted fields in "${profileSteps[step].title}"`);
      return;
    }
    setStep((s) => Math.min(s + 1, profileSteps.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const goToStep = (i) => {
    if (i < step) { setStep(i); return; }
    if (i === step || (i <= maxReachable)) setStep(i);
    else toast.error(`Complete the previous steps first`);
  };

  const handleSubmit = async () => {
    const allErrors = profileSteps.map((_, i) => validateStep(i, form));
    const firstBad = allErrors.findIndex((e) => Object.keys(e).length > 0);
    if (firstBad !== -1) {
      setStep(firstBad);
      setTouched((tt) => ({ ...tt, ...Object.fromEntries(profileSteps[firstBad].fields.map((f) => [f, true])) }));
      requestAnimationFrame(() => {
        for (const f of profileSteps[firstBad].fields) {
          const el = contentRef.current?.querySelector(`[name="${f}"]`);
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); break; }
        }
      });
      toast.error(`Complete "${profileSteps[firstBad].title}" first`);
      return;
    }

    // Video validation for final step
    if (step === profileSteps.length - 1 && videoFile && !videoDurationValid && videoDuration !== null) {
      toast.error('Please fix the video duration issue before submitting.');
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('main_profile_picture', photoFile);
      if (horoscopeFile) fd.append('horoscope_chart', horoscopeFile);
      let profileId;
      if (isEdit) {
        const res = await api.put(`/profiles/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        profileId = id;
        toast.success('Profile updated successfully');
      } else {
        const res = await api.post('/profiles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        profileId = res.data.profile?.id;
        clearDraft();
        toast.success('Profile created — welcome to Mukurtham!');
      }

      // Upload verification video if selected
      if (videoFile && videoDurationValid) {
        setVideoUploading(true);
        try {
          const vfd = new FormData();
          vfd.append('verification_video', videoFile);
          await api.post('/verification-video/upload', vfd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Verification video uploaded successfully.');
        } catch (vErr) {
          const vMsg = vErr.response?.data?.message || vErr.response?.data?.error || 'Video upload failed.';
          toast.error(vMsg);
        } finally {
          setVideoUploading(false);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || Object.values(err.response?.data?.errors || {})[0] || `Could not ${isEdit ? 'update' : 'create'} profile`;
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = !meta || loadingProfile || checkingExisting;

  const StepIcon = STEP_ICONS[profileSteps[step].icon] || User;
  const stepperSteps = profileSteps.map((s) => ({ label: s.title, hint: s.hint }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grad-hero">
        <div className="flex flex-col items-center gap-3 text-[var(--ink-soft)]">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--border-strong)] border-t-[var(--primary)] animate-spin" />
          <p className="text-sm font-semibold">Loading form…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 grad-hero">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
              {isEdit ? 'Edit Profile' : 'New Profile'} · Step {step + 1} of {profileSteps.length}
            </p>
            <h1 className="font-display text-2xl font-extrabold text-[var(--ink)] mt-0.5">
              {isEdit ? 'Update your profile' : 'Tell us about yourself'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 border border-[var(--border)] bg-[var(--surface)]">
              <Save className="w-3.5 h-3.5 text-[var(--ink-faint)]" aria-hidden="true" />
              <span className="text-[11px] font-bold text-[var(--ink-soft)]">
                {draftStatus || (isEdit ? 'Save to apply changes' : 'Autosave on')}
              </span>
              {!isEdit && draftStatus && (
                <button type="button" onClick={clearDraft} className="text-[var(--ink-faint)] hover:text-[var(--error)]" aria-label="Clear draft">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* ── Sidebar ── */}
          <div className="hidden lg:block">
            <div className="glass-card p-6 sticky top-6">
              <ProgressBar value={completion} className="mb-6" />
              <Stepper vertical steps={stepperSteps} current={step} onStepClick={goToStep} />
            </div>
          </div>

          {/* ── Content ── */}
          <div className="glass-card p-6 sm:p-8" ref={contentRef}>
            {/* Mobile progress */}
            <div className="lg:hidden mb-6">
              <ProgressBar value={completion} className="mb-4" />
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {stepperSteps.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => goToStep(i)}
                    aria-current={i === step ? 'step' : undefined}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all ${
                      i === step
                        ? 'grad-primary text-white border-transparent shadow-md'
                        : i < maxReachable
                          ? 'border-[var(--border-strong)] text-[var(--ink-soft)] bg-[var(--surface)]'
                          : 'border-[var(--border)] text-[var(--ink-faint)] bg-[var(--surface-soft)]'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${i < step ? 'bg-white/25' : ''}`}>
                      {i < step ? <Check className="w-3 h-3" aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {/* Step heading */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl grad-primary flex items-center justify-center text-white shadow-lg shrink-0">
                    <StepIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
                      {isEdit ? 'Edit' : 'Step'} {step + 1} of {profileSteps.length}
                    </p>
                    <h2 className="font-display text-xl font-extrabold text-[var(--ink)] leading-tight">
                      {profileSteps[step].title}
                    </h2>
                  </div>
                  {validSteps[step] && <Badge variant="success" className="ml-auto">Complete</Badge>}
                </div>

                {serverError && (
                  <div className="mb-5">
                    <ErrorCard message={serverError} onDismiss={() => setServerError('')} />
                  </div>
                )}

                <div className="space-y-4">
                  {step === 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-[var(--ink-soft)]">Language:</span>
                        <div className="flex rounded-full border border-[var(--border)] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setLang('en')}
                            className={`px-3 py-1 text-xs font-bold transition-colors ${
                              lang === 'en' ? 'bg-[var(--primary)] text-white' : 'text-[var(--ink-soft)]'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            onClick={() => setLang('ta')}
                            className={`px-3 py-1 text-xs font-bold transition-colors ${
                              lang === 'ta' ? 'bg-[var(--primary)] text-white' : 'text-[var(--ink-soft)]'
                            }`}
                          >
                            தமிழ்
                          </button>
                        </div>
                      </div>
                      <SelectField
                        label="Profile Posted By"
                        options={POSTED_BY.map((p) => ({ value: p, label: p }))}
                        value={form.profile_registered_for}
                        onChange={set('profile_registered_for')}
                        name="profile_registered_for"
                      />
                      <TextField
                        label="Full Name"
                        placeholder="Priya Sutharsan"
                        value={form.name}
                        onChange={set('name')}
                        onBlur={blur('name')}
                        name="name"
                        error={touched.name && stepErrors.name}
                        help="Min 2 characters, letters and spaces only"
                        required
                      />
                      <div>
                        <p className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
                          Gender<span className="text-[var(--error)]"> *</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[['M', 'Groom', User], ['F', 'Bride', Users]].map(([v, label, Icon]) => (
                            <button
                              type="button"
                              key={v}
                              name="gender"
                              onClick={() => setForm((f) => ({ ...f, gender: v }))}
                              onBlur={blur('gender')}
                              aria-pressed={form.gender === v}
                              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                form.gender === v
                                  ? 'grad-primary text-white border-transparent shadow-lg'
                                  : 'border-[var(--border-strong)] text-[var(--ink-soft)] bg-[var(--surface)] hover:border-[var(--primary)]'
                              }`}
                            >
                              <Icon className="w-4 h-4" aria-hidden="true" />
                              {label}
                            </button>
                          ))}
                        </div>
                        {touched.gender && stepErrors.gender && (
                          <p className="text-[13px] font-semibold text-[var(--error)] mt-2" role="alert">{stepErrors.gender}</p>
                        )}
                      </div>
                      <div>
                        <p className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
                          Looking For
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[['M', 'Groom', User], ['F', 'Bride', Users]].map(([v, label, Icon]) => (
                            <button
                              type="button"
                              key={`looking_for-${v}`}
                              name="looking_for"
                              onClick={() => setForm((f) => ({ ...f, looking_for: v }))}
                              onBlur={blur('looking_for')}
                              aria-pressed={form.looking_for === v}
                              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                form.looking_for === v
                                  ? 'grad-primary text-white border-transparent shadow-lg'
                                  : 'border-[var(--border-strong)] text-[var(--ink-soft)] bg-[var(--surface)] hover:border-[var(--primary)]'
                              }`}
                            >
                              <Icon className="w-4 h-4" aria-hidden="true" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <TextField
                        label="Date of Birth"
                        type="date"
                        value={form.date_of_birth}
                        onChange={set('date_of_birth')}
                        onBlur={blur('date_of_birth')}
                        name="date_of_birth"
                        error={touched.date_of_birth && stepErrors.date_of_birth}
                        floating={false}
                        help="Must be 18 years or older"
                        required
                      />
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <TextField
                        label="Education Level"
                        placeholder="B.Eng in Software Engineering"
                        value={form.education}
                        onChange={set('education')}
                        onBlur={blur('education')}
                        name="education"
                        error={touched.education && stepErrors.education}
                        floating={false}
                        required
                      />
                      <TextField
                        label="Current Occupation"
                        placeholder="Senior Data Scientist"
                        value={form.occupation}
                        onChange={set('occupation')}
                        onBlur={blur('occupation')}
                        name="occupation"
                        error={touched.occupation && stepErrors.occupation}
                        floating={false}
                        required
                      />
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--ink-soft)]">Enter height in any unit — the other updates automatically.</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <TextField
                            label="cm"
                            type="number"
                            placeholder="170"
                            value={form.height_cm}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const { feet, inches } = ftInFromCm(val);
                                setForm((f) => ({ ...f, height_cm: val, height_feet: feet, height_inches: inches }));
                              } else {
                                setForm((f) => ({ ...f, height_cm: val }));
                              }
                            }}
                            name="height_cm"
                            error={touched.height_cm && stepErrors.height_cm}
                          />
                          <SelectField
                            label="Feet"
                            options={[3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} ft` }))}
                            value={form.height_feet}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({ ...f, height_feet: val, height_cm: String(cmFromFtIn(val, f.height_inches)) }));
                            }}
                            name="height_feet"
                            error={touched.height_feet && stepErrors.height_feet}
                          />
                          <SelectField
                            label="Inches"
                            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }))}
                            value={form.height_inches}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({ ...f, height_inches: val, height_cm: String(cmFromFtIn(f.height_feet, val)) }));
                            }}
                            name="height_inches"
                            error={touched.height_inches && stepErrors.height_inches}
                          />
                        </div>
                        {form.height_cm && form.height_feet && form.height_inches && (
                          <p className="text-sm font-bold text-[var(--primary)] text-center">
                            {form.height_cm} cm = {form.height_feet}'{form.height_inches}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <>
                      <OptionSelect label="Dietary Preference" options={DIET_OPTIONS} value={form.diet} onChange={set('diet')} name="diet" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <OptionSelect label="Family Values" options={FAMILY_VALUES} value={form.family_values} onChange={set('family_values')} name="family_values" />
                        <OptionSelect label="Career Goals" options={CAREER_GOALS} value={form.career_goals} onChange={set('career_goals')} name="career_goals" />
                      </div>
                      <OptionSelect label="Relocation Willingness" options={RELOCATE} value={form.willing_to_relocate} onChange={set('willing_to_relocate')} name="willing_to_relocate" />
                    </>
                  )}

                  {step === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <OptionSelect label="Annual Income Range" options={INCOME_RANGE} value={form.income_range} onChange={set('income_range')} name="income_range" />
                      <OptionSelect label="Manglik / Chevvai Dosham" options={MANGLIK} value={form.manglik_status} onChange={set('manglik_status')} name="manglik_status" />
                    </div>
                  )}

                  {step === 5 && (
                    <>
                      <SearchableSelect
                        label="Religion"
                        options={(meta.religions || []).map((r) => ({ value: String(r.id), label: lang === 'ta' ? r.name_ta : r.name_en }))}
                        value={form.religion_id}
                        onChange={(v) => setForm((f) => ({ ...f, religion_id: v }))}
                        error={touched.religion_id && stepErrors.religion_id}
                        required
                      />
                      <SearchableSelect
                        label="Caste / Saathi"
                        options={(meta.castes || []).map((c) => ({ value: String(c.id), label: lang === 'ta' ? c.name_ta : c.name_en }))}
                        value={form.caste_id}
                        onChange={(v) => setForm((f) => ({ ...f, caste_id: v }))}
                        error={touched.caste_id && stepErrors.caste_id}
                        required
                      />
                      <TextField
                        label="Sub-Religion / Sect"
                        placeholder="Saiva Siddhantam"
                        value={form.sub_religion}
                        onChange={set('sub_religion')}
                        name="sub_religion"
                        floating={false}
                      />
                    </>
                  )}

                  {step === 6 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField
                        label="Zodiac / Raasi"
                        options={(meta.raasis || []).map((r) => ({ value: String(r.id), label: lang === 'ta' ? r.name_ta : r.name_en }))}
                        value={form.raasi_id}
                        onChange={set('raasi_id')}
                        onBlur={blur('raasi_id')}
                        name="raasi_id"
                        error={touched.raasi_id && stepErrors.raasi_id}
                        required
                      />
                      <SearchableSelect
                        label="Star / Nakshatram"
                        options={(meta.stars || []).map((s) => ({ value: String(s.id), label: lang === 'ta' ? s.name_ta : s.name_en }))}
                        value={form.star_id}
                        onChange={(v) => setForm((f) => ({ ...f, star_id: v }))}
                        error={touched.star_id && stepErrors.star_id}
                        required
                      />
                    </div>
                  )}

                  {step === 7 && (
                    <>
                      <SearchableSelect
                        label="Country of Birth"
                        options={(meta.countries || []).map((c) => ({ value: c.code, label: lang === 'ta' ? c.name_ta : c.name_en }))}
                        value={form.born_country_id}
                        onChange={(v) => setForm((f) => ({ ...f, born_country_id: v }))}
                        error={touched.born_country_id && stepErrors.born_country_id}
                        required
                      />
                      <SearchableSelect
                        label="Current Country of Residence"
                        options={(meta.countries || []).map((c) => ({ value: c.code, label: lang === 'ta' ? c.name_ta : c.name_en }))}
                        value={form.current_country_id}
                        onChange={(v) => setForm((f) => ({ ...f, current_country_id: v }))}
                        error={touched.current_country_id && stepErrors.current_country_id}
                        required
                      />
                      <TextField
                        label="Current City or State"
                        placeholder="Toronto"
                        value={form.city_or_state}
                        onChange={set('city_or_state')}
                        onBlur={blur('city_or_state')}
                        name="city_or_state"
                        error={touched.city_or_state && stepErrors.city_or_state}
                        floating={false}
                        required
                      />
                    </>
                  )}

                  {step === 8 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PhotoField
                          label="Main Profile Photo (.jpg, .jpeg, .png)"
                          accept=".jpg,.jpeg,.png"
                          file={photoFile}
                          onFile={setPhotoFile}
                          existing={existingPhoto}
                        />
                        <PhotoField
                          label="Horoscope Chart (.jpg, .png, .pdf)"
                          accept=".jpg,.jpeg,.png,.pdf"
                          file={horoscopeFile}
                          onFile={setHoroscopeFile}
                          existing={existingHoroscope}
                        />
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 space-y-3">
                        <p className="text-sm font-bold text-[var(--ink)]">Privacy & Photo Settings</p>
                        <ToggleRow
                          label="Blur my photo"
                          hint="Your photo stays hidden until you accept an interest"
                          checked={form.blur_photo === 1}
                          onChange={(v) => setForm((f) => ({ ...f, blur_photo: v }))}
                        />
                        <ToggleRow
                          label="Blur my horoscope"
                          hint="Keep your horoscope private until mutual interest"
                          checked={form.blur_horoscope === 1}
                          onChange={(v) => setForm((f) => ({ ...f, blur_horoscope: v }))}
                        />
                      </div>
                    </div>
                  )}

                  {step === 9 && (
                    <>
                      <TextareaField
                        label="About Me"
                        placeholder="Hello, looking for an understanding partner who values family traditions…"
                        value={form.about_me}
                        onChange={set('about_me')}
                        onBlur={blur('about_me')}
                        name="about_me"
                        rows={6}
                        counter={2000}
                        error={touched.about_me && stepErrors.about_me}
                        help="Minimum 50 characters — tell your story, interests and what you value in a partner"
                        required
                      />
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 flex items-start gap-3">
                        <Check className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed">
                          Your profile is <strong className="text-[var(--ink)]">{completion}% complete</strong>. Review the
                          summary below before publishing.
                        </p>
                      </div>
                    </>
                  )}

                  {step === 10 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Video className="w-5 h-5 text-[var(--primary)]" />
                          <p className="text-sm font-bold text-[var(--ink)]">Profile Verification Video</p>
                        </div>
                        <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed mb-4">
                          Please upload a short video (1–3 minutes) to help our admin team verify your profile.
                          This video will only be visible to administrators.
                        </p>

                        {/* Video status for existing uploads */}
                        {videoStatus === 'APPROVED' && (
                          <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
                            <p className="text-xs font-bold text-green-700">✅ Your verification video has been approved.</p>
                          </div>
                        )}
                        {videoStatus === 'PENDING' && (
                          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mb-4">
                            <p className="text-xs font-bold text-yellow-700">⏳ Your verification video is pending admin review.</p>
                          </div>
                        )}
                        {videoStatus === 'REJECTED' && (
                          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
                            <p className="text-xs font-bold text-red-700">❌ Your verification video was rejected. Please upload a new video.</p>
                          </div>
                        )}

                        <input
                          ref={videoRef}
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setVideoError('');
                            setVideoFile(file);
                            setVideoDuration(null);
                            setVideoDurationValid(false);
                            // Check duration via HTML5 Video API
                            const url = URL.createObjectURL(file);
                            const vid = document.createElement('video');
                            vid.preload = 'metadata';
                            vid.onloadedmetadata = () => {
                              URL.revokeObjectURL(url);
                              const dur = Math.round(vid.duration);
                              setVideoDuration(dur);
                              if (dur < 60) {
                                setVideoDurationValid(false);
                                setVideoError('Video must be at least 1 minute long.');
                              } else if (dur > 180) {
                                setVideoDurationValid(false);
                                setVideoError('Video must not exceed 3 minutes.');
                              } else {
                                setVideoDurationValid(true);
                                setVideoError('');
                              }
                            };
                            vid.onerror = () => {
                              URL.revokeObjectURL(url);
                              setVideoError('Could not read video. Please select a valid video file.');
                            };
                            vid.src = url;
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => videoRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--primary)] bg-[var(--primary-soft)] py-4 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          {videoFile ? 'Replace Video' : 'Select Video (MP4, MOV, WebM)'}
                        </button>

                        {videoFile && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-[var(--ink-soft)]">
                              <strong>File:</strong> {videoFile.name}
                            </p>
                            <p className="text-xs text-[var(--ink-soft)]">
                              <strong>Size:</strong> {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                            {videoDuration !== null && (
                              <p className="text-xs">
                                <strong>Duration:</strong>{' '}
                                {Math.floor(videoDuration / 60)}:{String(videoDuration % 60).padStart(2, '0')}
                                {videoDurationValid ? (
                                  <span className="text-green-600 ml-2">✅ Valid</span>
                                ) : (
                                  <span className="text-red-500 ml-2">❌ Invalid</span>
                                )}
                              </p>
                            )}
                            {videoFile.type.startsWith('video/') && (
                              <video
                                src={URL.createObjectURL(videoFile)}
                                controls
                                className="w-full max-h-48 rounded-lg mt-2"
                              />
                            )}
                          </div>
                        )}

                        {videoError && (
                          <p className="text-xs text-red-500 mt-2 font-semibold">{videoError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="flex justify-between gap-3 mt-8">
              <Button variant="secondary" onClick={goBack} disabled={step === 0}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </Button>
              {step < profileSteps.length - 1 ? (
                <Button onClick={goNext}>
                  Continue
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={submitting || videoUploading} success={completion === 100 && !submitting && !videoUploading}>
                  {isEdit ? 'Update Profile' : 'Publish Profile'}
                  {videoUploading ? ' (Uploading video…)' : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
