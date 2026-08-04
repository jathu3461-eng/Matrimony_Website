import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Field from '../components/Field';
import { useI18n } from '../context/I18nContext';

const POSTED_BY = ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Client'];

const STEPS = ['Basics', 'Background', 'Culture & Astrology', 'Location', 'Media & Bio'];

export default function ProfileWizard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [meta, setMeta] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(isEdit);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [horoscopeFile, setHoroscopeFile] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [existingHoroscope, setExistingHoroscope] = useState(null);

  const [form, setForm] = useState({
    profile_registered_for: 'Self', name: '', gender: '', date_of_birth: '',
    height_feet: '5', height_inches: '6', education: '', occupation: '',
    religion_id: '', caste_id: '', sub_religion: '', raasi_id: '', star_id: '',
    born_country_id: '', current_country_id: '', city_or_state: '', about_me: '',
    blur_photo: 0, blur_horoscope: 0,
    diet: 'any', family_values: 'moderate', career_goals: 'working',
    willing_to_relocate: 'open', income_range: '$50k - $100k', manglik_status: 'no',
  });

  useEffect(() => {
    api.get('/profiles/meta').then((res) => setMeta(res.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/profiles/${id}`).then((res) => {
      const p = res.data.profile;
      setForm({
        profile_registered_for: p.profile_registered_for || 'Self',
        name: p.name || '', gender: p.gender || '', date_of_birth: p.date_of_birth || '',
        height_feet: String(p.height_feet ?? '5'), height_inches: String(p.height_inches ?? '6'),
        education: p.education || '', occupation: p.occupation || '',
        religion_id: p.religion_id ?? '', caste_id: p.caste_id ?? '', sub_religion: p.sub_religion || '',
        raasi_id: p.raasi_id ?? '', star_id: p.star_id ?? '',
        born_country_id: p.born_country_id || '', current_country_id: p.current_country_id || '',
        city_or_state: p.city_or_state || '', about_me: p.about_me || '',
        blur_photo: p.blur_photo ?? 0, blur_horoscope: p.blur_horoscope ?? 0,
        diet: p.diet || 'any', family_values: p.family_values || 'moderate',
        career_goals: p.career_goals || 'working', willing_to_relocate: p.willing_to_relocate || 'open',
        income_range: p.income_range || '', manglik_status: p.manglik_status || 'no',
      });
      setExistingPhoto(p.main_profile_picture);
      setExistingHoroscope(p.horoscope_chart);
      setLoadingProfile(false);
    }).catch(() => setLoadingProfile(false));
  }, [id, isEdit]);

  const set = (field) => (ev) => setForm((f) => ({ ...f, [field]: ev.target.value }));
  const blur = (field) => () => setTouched((tt) => ({ ...tt, [field]: true }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Invalid Format. Name must be at least 2 characters';
    if (!form.gender) e.gender = 'Please select a gender';
    if (!form.date_of_birth) e.date_of_birth = 'Invalid Format. Expected format: YYYY-MM-DD';
    else {
      const age = Math.floor((Date.now() - new Date(form.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) e.date_of_birth = 'Must be 18 years or older';
    }
    if (!form.education || form.education.trim().length < 2) e.education = 'Please enter an education level';
    if (!form.occupation || form.occupation.trim().length < 2) e.occupation = 'Please enter an occupation';
    if (!form.about_me || form.about_me.trim().length < 50) {
      e.about_me = `Too short. Required: minimum 50 characters (currently ${form.about_me.trim().length})`;
    }
    return e;
  }, [form]);

  const stepFields = [
    ['name', 'gender', 'date_of_birth'],
    ['education', 'occupation'],
    [],
    [],
    ['about_me'],
  ];

  const currentStepHasErrors = stepFields[step].some((f) => errors[f]);

  const goNext = () => {
    setTouched((tt) => ({ ...tt, ...Object.fromEntries(stepFields[step].map((f) => [f, true])) }));
    if (!currentStepHasErrors) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setTouched({ name: true, gender: true, date_of_birth: true, education: true, occupation: true, about_me: true });
    if (Object.keys(errors).length) { setStep(0); return; }

    setSubmitting(true);
    setServerError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('main_profile_picture', photoFile);
      if (horoscopeFile) fd.append('horoscope_chart', horoscopeFile);
      if (isEdit) {
        await api.put(`/profiles/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/profiles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || Object.values(err.response?.data?.errors || {})[0] || `Could not ${isEdit ? 'update' : 'create'} profile`);
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_ICONS = ['👤', '💼', '🙏', '🌍', '📸'];

  if (!meta || loadingProfile) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#fff0f6,#fce4ff,#ede0ff)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading form…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(135deg,#fff0f6 0%,#fce4ff 40%,#ede0ff 70%,#e0eaff 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-5 rounded-[2rem] overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 30px 80px rgba(180,50,200,0.15)' }}
        >
          {/* ── LEFT PANEL ── */}
          <div className="hidden md:flex md:col-span-2 flex-col relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#f43f5e 0%,#ec4899 45%,#a855f7 100%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15 bg-white"
              style={{ transform: 'translate(30%,-30%)' }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(-20%,20%)' }} />

            {/* Steps sidebar */}
            <div className="relative z-10 p-8 pt-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-9 h-9 rounded-2xl bg-white/25 flex items-center justify-center text-lg">💖</div>
                <span className="text-white font-extrabold text-base">Mukurtham</span>
              </div>
              <h2 className="text-white font-extrabold text-xl mb-1">{isEdit ? 'Edit Profile' : 'Create Profile'}</h2>
              <p className="text-pink-100 text-xs mb-8">{isEdit ? 'Update your details' : 'Complete all steps to publish'}</p>

              <div className="space-y-3">
                {STEPS.map((s, i) => (
                  <div key={s} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    i === step ? 'bg-white/25 shadow' : i < step ? 'opacity-70' : 'opacity-40'
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      i < step ? 'bg-green-400 text-white' : i === step ? 'bg-white text-pink-600' : 'bg-white/20 text-white'
                    }`}>
                      {i < step ? '✓' : STEP_ICONS[i]}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">{s}</p>
                      <p className="text-pink-100 text-[10px]">{i < step ? 'Done' : i === step ? 'In Progress' : 'Upcoming'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Couple image at bottom */}
            <div className="flex-1 flex items-end">
              <img src="/uploads/couple_hero.png" alt="Couple" className="w-full object-cover object-top" style={{ maxHeight: 240, objectPosition: 'top' }} />
            </div>
          </div>

          {/* ── RIGHT PANEL: Form ── */}
          <div className="md:col-span-3 bg-white/95 backdrop-blur-xl p-7 sm:p-9">
            {/* Mobile progress bar */}
            <div className="flex items-center gap-1.5 mb-6 md:hidden">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-pink-500' : 'bg-pink-100'
                }`} />
              ))}
            </div>

            {/* Step label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
                {STEP_ICONS[step]}
              </div>
              <div>
                <p className="text-[11px] font-bold text-pink-500 uppercase tracking-wider">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h1 className="text-xl font-extrabold text-slate-800">{STEPS[step]}</h1>
              </div>
            </div>

      <motion.div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>

            {step === 0 && (
              <>
                <Field label="Profile Posted By">
                  <select className="input-base" value={form.profile_registered_for} onChange={set('profile_registered_for')}>
                    {POSTED_BY.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Full Name" error={touched.name && errors.name} formatHint="Min 2 characters, letters and spaces only">
                  <input className={`input-base ${touched.name && errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} onBlur={blur('name')} placeholder="Priya Sutharsan" />
                </Field>
                <Field label="Gender" error={touched.gender && errors.gender}>
                  <div className="flex gap-3">
                    {[['M', 'Groom'], ['F', 'Bride']].map(([v, label]) => (
                      <button type="button" key={v} onClick={() => setForm((f) => ({ ...f, gender: v }))}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.gender === v ? 'bg-burgundy-600 text-white border-burgundy-600' : 'border-burgundy/20 text-[#4a2a1a]/80'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Date of Birth" error={touched.date_of_birth && errors.date_of_birth} formatHint="YYYY-MM-DD (Must be 18 years or older)">
                  <input type="date" className={`input-base ${touched.date_of_birth && errors.date_of_birth ? 'input-error' : ''}`} value={form.date_of_birth} onChange={set('date_of_birth')} onBlur={blur('date_of_birth')} />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Height (Feet)">
                    <select className="input-base" value={form.height_feet} onChange={set('height_feet')}>
                      {[3,4,5,6,7].map((n) => <option key={n} value={n}>{n} ft</option>)}
                    </select>
                  </Field>
                  <Field label="Height (Inches)">
                    <select className="input-base" value={form.height_inches} onChange={set('height_inches')}>
                      {Array.from({ length: 12 }, (_, i) => i).map((n) => <option key={n} value={n}>{n} in</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Education Level" error={touched.education && errors.education} formatHint="e.g. B.Sc in Computer Science (Min 2 characters)">
                  <input className={`input-base ${touched.education && errors.education ? 'input-error' : ''}`} value={form.education} onChange={set('education')} onBlur={blur('education')} placeholder="B.Eng in Software Engineering" />
                </Field>
                <Field label="Current Occupation" error={touched.occupation && errors.occupation} formatHint="e.g. Software Engineer (Min 2 characters)">
                  <input className={`input-base ${touched.occupation && errors.occupation ? 'input-error' : ''}`} value={form.occupation} onChange={set('occupation')} onBlur={blur('occupation')} placeholder="Senior Data Scientist" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Dietary Preference">
                    <select className="input-base" value={form.diet} onChange={set('diet')}>
                      <option value="any">Any / Flexible</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="non_vegetarian">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="jain">Jain</option>
                    </select>
                  </Field>
                  <Field label="Family Values">
                    <select className="input-base" value={form.family_values} onChange={set('family_values')}>
                      <option value="traditional">Traditional</option>
                      <option value="moderate">Moderate</option>
                      <option value="liberal">Liberal</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Career Goals">
                    <select className="input-base" value={form.career_goals} onChange={set('career_goals')}>
                      <option value="working">Career Oriented / Working</option>
                      <option value="home_maker">Home Maker</option>
                      <option value="open">Flexible / Open</option>
                    </select>
                  </Field>
                  <Field label="Relocation Willingness">
                    <select className="input-base" value={form.willing_to_relocate} onChange={set('willing_to_relocate')}>
                      <option value="open">Open to Relocate</option>
                      <option value="local_only">Local Only</option>
                      <option value="overseas_only">Overseas Only</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Annual Income Range">
                    <select className="input-base" value={form.income_range} onChange={set('income_range')}>
                      <option value="Under $50k">Under $50k</option>
                      <option value="$50k - $100k">$50k - $100k</option>
                      <option value="$100k - $150k">$100k - $150k</option>
                      <option value="$150k+">$150k+</option>
                    </select>
                  </Field>
                  <Field label="Manglik / Chevvai Dosham">
                    <select className="input-base" value={form.manglik_status} onChange={set('manglik_status')}>
                      <option value="no">No Dosham / Non-Manglik</option>
                      <option value="yes">Chevvai Dosham / Manglik</option>
                      <option value="dont_know">Don't Know</option>
                    </select>
                  </Field>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Religion">
                  <select className="input-base" value={form.religion_id} onChange={set('religion_id')}>
                    <option value="">Select…</option>
                    {meta.religions.map((r) => <option key={r.id} value={r.id}>{r.name_en}</option>)}
                  </select>
                </Field>
                <Field label="Caste / Saathi">
                  <select className="input-base" value={form.caste_id} onChange={set('caste_id')}>
                    <option value="">Select…</option>
                    {meta.castes.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </Field>
                <Field label="Sub-Religion / Sect">
                  <input className="input-base" value={form.sub_religion} onChange={set('sub_religion')} placeholder="Saiva Siddhantam" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Zodiac / Raasi">
                    <select className="input-base" value={form.raasi_id} onChange={set('raasi_id')}>
                      <option value="">Select…</option>
                      {meta.raasis.map((r) => <option key={r.id} value={r.id}>{r.name_en}</option>)}
                    </select>
                  </Field>
                  <Field label="Star / Nakshatram">
                    <select className="input-base" value={form.star_id} onChange={set('star_id')}>
                      <option value="">Select…</option>
                      {meta.stars.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Country of Birth">
                  <select className="input-base" value={form.born_country_id} onChange={set('born_country_id')}>
                    <option value="">Select…</option>
                    {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.name_en}</option>)}
                  </select>
                </Field>
                <Field label="Current Country of Residence">
                  <select className="input-base" value={form.current_country_id} onChange={set('current_country_id')}>
                    <option value="">Select…</option>
                    {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.name_en}</option>)}
                  </select>
                </Field>
                <Field label="Current City or State">
                  <input className="input-base" value={form.city_or_state} onChange={set('city_or_state')} placeholder="Toronto" />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <Field label="Main Profile Photo (.jpg, .jpeg, .png)">
                  <input type="file" accept=".jpg,.jpeg,.png" className="input-base" onChange={(e) => setPhotoFile(e.target.files[0])} />
                  {existingPhoto && !photoFile && <p className="text-xs text-[#4a2a1a]/50 mt-1">Current: {existingPhoto}</p>}
                </Field>
                <Field label="Horoscope Chart (.jpg, .png, .pdf)">
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="input-base" onChange={(e) => setHoroscopeFile(e.target.files[0])} />
                  {existingHoroscope && !horoscopeFile && <p className="text-xs text-[#4a2a1a]/50 mt-1">Current: {existingHoroscope}</p>}
                </Field>
                <div className="flex flex-col gap-2.5 mt-2 mb-4 bg-amber-50/40 p-4 rounded-xl border border-gold/15">
                  <p className="text-sm font-semibold text-burgundy-700">Privacy & Photo Settings</p>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={form.blur_photo === 1} onChange={(e) => setForm(f => ({ ...f, blur_photo: e.target.checked ? 1 : 0 }))} />
                    <span className="text-sm text-[#4a2a1a]/85">{t('blur_photo_label')}</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-1" checked={form.blur_horoscope === 1} onChange={(e) => setForm(f => ({ ...f, blur_horoscope: e.target.checked ? 1 : 0 }))} />
                    <span className="text-sm text-[#4a2a1a]/85">{t('blur_horoscope_label')}</span>
                  </label>
                </div>
                <Field label={`About Me (${t('about_me_min')})`} error={touched.about_me && errors.about_me} formatHint="Detailed description (Min 50 characters)">
                  <textarea
                    rows={5}
                    className={`input-base ${touched.about_me && errors.about_me ? 'input-error' : ''}`}
                    value={form.about_me}
                    onChange={set('about_me')}
                    onBlur={blur('about_me')}
                    placeholder="Hello, looking for an understanding partner who values family traditions…"
                  />
                  <p className="text-xs text-[#4a2a1a]/50 mt-1">{form.about_me.trim().length} / 50 characters minimum</p>
                </Field>
              </>
            )}

          </motion.div>
        </AnimatePresence>

        {serverError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
            ⚠️ {serverError}
          </div>
        )}

        <div className="flex justify-between mt-8 gap-3">
          <motion.button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </motion.button>
          {step < STEPS.length - 1 ? (
            <motion.button
              type="button"
              onClick={goNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg"
              style={{ background: 'linear-gradient(90deg,#f43f5e,#ec4899)' }}
            >
              Continue →
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg disabled:opacity-70"
              style={{ background: 'linear-gradient(90deg,#a855f7,#ec4899)' }}
            >
              {submitting ? '⏳ Saving…' : isEdit ? '✓ Update Profile' : '🚀 Create Profile'}
            </motion.button>
          )}
        </div>
      </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
