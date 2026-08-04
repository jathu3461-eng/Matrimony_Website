const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { calculate10Porutham } = require('../utils/astrology');
const { calculateLifestyleCompatibility } = require('../utils/compatibility');

const router = express.Router();

function getOptionalUser(req) {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function shouldBlurMedia(viewer, profileRow) {
  if (!viewer) {
    return {
      photo: profileRow.blur_photo === 1,
      horoscope: profileRow.blur_horoscope === 1,
      interestStatus: null,
      interestId: null,
      interestDirection: null,
      isShortlisted: false
    };
  }

  if (viewer.id === profileRow.owner_user_id || viewer.role === 'admin') {
    return {
      photo: false,
      horoscope: false,
      interestStatus: null,
      interestId: null,
      interestDirection: null,
      isShortlisted: false
    };
  }

  // Fetch profiles owned by viewer to check if any have an accepted interest with this profile
  const viewerProfiles = db.prepare('SELECT id FROM profiles WHERE owner_user_id = ?').all(viewer.id);
  const viewerProfileIds = viewerProfiles.map(p => p.id);

  let interestStatus = null;
  let interestId = null;
  let interestDirection = null;
  let hasMutualAccepted = false;

  if (viewerProfileIds.length > 0) {
    const placeholders = viewerProfileIds.map(() => '?').join(',');
    const interaction = db.prepare(`
      SELECT id, sender_profile_id, receiver_profile_id, status FROM interests
      WHERE (sender_profile_id IN (${placeholders}) AND receiver_profile_id = ?)
         OR (receiver_profile_id IN (${placeholders}) AND sender_profile_id = ?)
    `).get(...viewerProfileIds, profileRow.id, ...viewerProfileIds, profileRow.id);

    if (interaction) {
      interestStatus = interaction.status;
      interestId = interaction.id;
      interestDirection = viewerProfileIds.includes(interaction.sender_profile_id) ? 'sent' : 'received';
      if (interaction.status === 'accepted') {
        hasMutualAccepted = true;
      }
    }
  }

  const isShortlisted = db.prepare('SELECT id FROM shortlists WHERE user_id = ? AND profile_id = ?')
    .get(viewer.id, profileRow.id) ? true : false;

  return {
    photo: !hasMutualAccepted && profileRow.blur_photo === 1,
    horoscope: !hasMutualAccepted && profileRow.blur_horoscope === 1,
    interestStatus,
    interestId,
    interestDirection,
    isShortlisted
  };
}


const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const photoTypes = ['.jpg', '.jpeg', '.png'];
  const horoscopeTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.fieldname === 'main_profile_picture' && !photoTypes.includes(ext)) {
    return cb(new Error('Invalid Format. Photo must be .jpg, .jpeg, or .png'));
  }
  if (file.fieldname === 'horoscope_chart' && !horoscopeTypes.includes(ext)) {
    return cb(new Error('Invalid Format. Horoscope must be .jpg, .png, or .pdf'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

function calcAge(dob) {
  const birth = new Date(dob);
  if (isNaN(birth)) return null;
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function validateProfile(body) {
  const errors = {};
  const validPostedBy = ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Client'];
  if (!validPostedBy.includes(body.profile_registered_for)) errors.profile_registered_for = 'Please select who this profile is for';
  if (!body.name || body.name.trim().length < 2) errors.name = 'Invalid Format. Full name must be at least 2 characters';
  if (!['M', 'F'].includes(body.gender)) errors.gender = 'Please select a gender';
  if (!body.date_of_birth || isNaN(new Date(body.date_of_birth))) {
    errors.date_of_birth = 'Invalid Format. Expected format: YYYY-MM-DD';
  } else {
    const age = calcAge(body.date_of_birth);
    if (age < 18) errors.date_of_birth = 'Profile must be for a person 18 years or older';
  }
  const hf = Number(body.height_feet), hi = Number(body.height_inches);
  if (isNaN(hf) || hf < 3 || hf > 7) errors.height_feet = 'Invalid. Expected a value between 3 and 7';
  if (isNaN(hi) || hi < 0 || hi > 11) errors.height_inches = 'Invalid. Expected a value between 0 and 11';
  if (!body.education || body.education.trim().length < 2) errors.education = 'Invalid Format. Please enter an education level';
  if (!body.occupation || body.occupation.trim().length < 2) errors.occupation = 'Invalid Format. Please enter an occupation';
  if (!body.about_me || body.about_me.trim().length < 50) {
    errors.about_me = `Too short. Required: minimum 50 characters (currently ${(body.about_me || '').trim().length})`;
  }
  return errors;
}

// GET /api/profiles/meta — dropdown master data for the profile form
router.get('/meta', (req, res) => {
  res.json({
    religions: db.prepare('SELECT * FROM religions').all(),
    castes: db.prepare('SELECT * FROM castes').all(),
    raasis: db.prepare('SELECT * FROM raasis ORDER BY id').all(),
    stars: db.prepare('SELECT * FROM stars ORDER BY id').all(),
    countries: db.prepare('SELECT * FROM countries ORDER BY (priority IS NULL), priority, name_en').all(),
  });
});

// GET /api/profiles/search — public browse/search with filters
router.get('/search', (req, res) => {
  const { gender, religion_id, caste_id, current_country_id, min_age, max_age,
          raasi_id, star_id, income_range, manglik_status, q } = req.query;
  let sql = `SELECT p.*, u.role as owner_role FROM profiles p JOIN users u ON u.id = p.owner_user_id WHERE p.status = 'active'`;
  const params = [];

  if (gender) { sql += ' AND p.gender = ?'; params.push(gender); }
  if (religion_id) { sql += ' AND p.religion_id = ?'; params.push(religion_id); }
  if (caste_id) { sql += ' AND p.caste_id = ?'; params.push(caste_id); }
  if (current_country_id) { sql += ' AND p.current_country_id = ?'; params.push(current_country_id); }
  if (raasi_id) { sql += ' AND p.raasi_id = ?'; params.push(raasi_id); }
  if (star_id) { sql += ' AND p.star_id = ?'; params.push(star_id); }
  if (income_range) { sql += ' AND p.income_range = ?'; params.push(income_range); }
  if (manglik_status) { sql += ' AND p.manglik_status = ?'; params.push(manglik_status); }
  if (q) { sql += ' AND (p.name LIKE ? OR p.occupation LIKE ? OR p.city_or_state LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  sql += ' ORDER BY p.created_at DESC LIMIT 100';
  let rows = db.prepare(sql).all(...params);

  const viewer = getOptionalUser(req);

  rows = rows.map(r => {
    const age = calcAge(r.date_of_birth);
    const blurState = shouldBlurMedia(viewer, r);
    return {
      ...r,
      age,
      photo_blurred: blurState.photo,
      horoscope_blurred: blurState.horoscope,
      is_shortlisted: blurState.isShortlisted,
      interest_status: blurState.interestStatus,
      interest_id: blurState.interestId,
      interest_direction: blurState.interestDirection
    };
  });

  if (min_age) rows = rows.filter(r => r.age >= Number(min_age));
  if (max_age) rows = rows.filter(r => r.age <= Number(max_age));

  res.json({ results: rows });
});

// GET /api/profiles/mine — current user's own profiles
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles WHERE owner_user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ profiles: rows.map(r => ({ ...r, age: calcAge(r.date_of_birth) })) });
});

// POST /api/profiles/match — calculate 10-Porutham match
router.post('/match', requireAuth, (req, res) => {
  const { profile_id_1, profile_id_2 } = req.body;
  if (!profile_id_1 || !profile_id_2) {
    return res.status(400).json({ error: 'Both profile IDs are required for matching' });
  }

  const p1 = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile_id_1);
  const p2 = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile_id_2);

  if (!p1 || !p2) {
    return res.status(404).json({ error: 'One or both profiles not found' });
  }

  // Ensure one of the profiles is owned by the current user
  if (p1.owner_user_id !== req.user.id && p2.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to request matches for these profiles' });
  }

  // Look up cached match
  const minId = Math.min(p1.id, p2.id);
  const maxId = Math.max(p1.id, p2.id);
  
  const cached = db.prepare('SELECT * FROM horoscope_match WHERE profile_id_1 = ? AND profile_id_2 = ?').get(minId, maxId);
  if (cached) {
    return res.json({ score: cached.score, details: JSON.parse(cached.details) });
  }

  // Perform astrology calculations
  // Match Bride to Groom. Figure out who is who:
  let bride = null;
  let groom = null;
  if (p1.gender === 'F') {
    bride = p1;
    groom = p2;
  } else {
    bride = p2;
    groom = p1;
  }

  if (!bride.raasi_id || !bride.star_id || !groom.raasi_id || !groom.star_id) {
    return res.status(400).json({ error: 'Both profiles must have a completed Zodiac and Star for matching calculations' });
  }

  const matchData = calculate10Porutham(bride.star_id, bride.raasi_id, groom.star_id, groom.raasi_id);
  if (matchData.error) {
    return res.status(400).json({ error: matchData.error });
  }

  try {
    db.prepare('INSERT INTO horoscope_match (profile_id_1, profile_id_2, score, details) VALUES (?, ?, ?, ?)')
      .run(minId, maxId, matchData.score, JSON.stringify(matchData.results));
  } catch (err) {
    // Conflict is safe to ignore or overwrite
  }

  res.json({ score: matchData.score, details: matchData.results });
});

// GET /api/profiles/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Profile not found' });

  const viewer = getOptionalUser(req);
  const blurState = shouldBlurMedia(viewer, row);

  res.json({
    profile: {
      ...row,
      age: calcAge(row.date_of_birth),
      photo_blurred: blurState.photo,
      horoscope_blurred: blurState.horoscope,
      is_shortlisted: blurState.isShortlisted,
      interest_status: blurState.interestStatus,
      interest_id: blurState.interestId,
      interest_direction: blurState.interestDirection
    }
  });
});

// POST /api/profiles — create (with broker quota enforcement)
router.post('/', requireAuth, upload.fields([
  { name: 'main_profile_picture', maxCount: 1 },
  { name: 'horoscope_chart', maxCount: 1 },
]), (req, res) => {
  const errors = validateProfile(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  if (req.user.role === 'broker') {
    if (!req.user.is_approved) return res.status(403).json({ error: 'Broker account pending admin approval' });
    const dbUser = db.prepare('SELECT broker_profile_limit FROM users WHERE id = ?').get(req.user.id);
    const count = db.prepare('SELECT COUNT(*) c FROM profiles WHERE owner_user_id = ?').get(req.user.id).c;
    if (count >= dbUser.broker_profile_limit) {
      return res.status(403).json({ error: `Broker profile limit reached (${dbUser.broker_profile_limit}). Contact admin to increase your quota.` });
    }
  }

  const b = req.body;
  const photo = req.files?.main_profile_picture?.[0]?.filename || null;
  const horoscope = req.files?.horoscope_chart?.[0]?.filename || null;

  const info = db.prepare(`
    INSERT INTO profiles (owner_user_id, profile_registered_for, name, gender, date_of_birth, height_feet, height_inches,
      education, occupation, religion_id, caste_id, sub_religion, raasi_id, star_id, born_country_id, current_country_id,
      city_or_state, main_profile_picture, horoscope_chart, about_me, blur_photo, blur_horoscope)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    req.user.id, b.profile_registered_for, b.name.trim(), b.gender, b.date_of_birth,
    Number(b.height_feet), Number(b.height_inches), b.education.trim(), b.occupation.trim(),
    b.religion_id || null, b.caste_id || null, b.sub_religion || null, b.raasi_id || null, b.star_id || null,
    b.born_country_id || null, b.current_country_id || null, b.city_or_state || null,
    photo, horoscope, b.about_me.trim(),
    Number(b.blur_photo) || 0, Number(b.blur_horoscope) || 0
  );

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ profile: { ...profile, age: calcAge(profile.date_of_birth) } });
});

// PUT /api/profiles/:id — update, owner only
router.put('/:id', requireAuth, upload.fields([
  { name: 'main_profile_picture', maxCount: 1 },
  { name: 'horoscope_chart', maxCount: 1 },
]), (req, res) => {
  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Profile not found' });
  if (existing.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this profile' });
  }

  const errors = validateProfile(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const b = req.body;
  const photo = req.files?.main_profile_picture?.[0]?.filename || existing.main_profile_picture;
  const horoscope = req.files?.horoscope_chart?.[0]?.filename || existing.horoscope_chart;

  db.prepare(`
    UPDATE profiles SET profile_registered_for=?, name=?, gender=?, date_of_birth=?, height_feet=?, height_inches=?,
      education=?, occupation=?, religion_id=?, caste_id=?, sub_religion=?, raasi_id=?, star_id=?, born_country_id=?,
      current_country_id=?, city_or_state=?, main_profile_picture=?, horoscope_chart=?, about_me=?,
      blur_photo=?, blur_horoscope=?
    WHERE id = ?
  `).run(
    b.profile_registered_for, b.name.trim(), b.gender, b.date_of_birth, Number(b.height_feet), Number(b.height_inches),
    b.education.trim(), b.occupation.trim(), b.religion_id || null, b.caste_id || null, b.sub_religion || null,
    b.raasi_id || null, b.star_id || null, b.born_country_id || null, b.current_country_id || null,
    b.city_or_state || null, photo, horoscope, b.about_me.trim(),
    Number(b.blur_photo) || 0, Number(b.blur_horoscope) || 0,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  res.json({ profile: { ...updated, age: calcAge(updated.date_of_birth) } });
});

// DELETE /api/profiles/:id
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Profile not found' });
  if (existing.owner_user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this profile' });
  }
  db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/profiles/lifestyle-match
router.post('/lifestyle-match', requireAuth, (req, res) => {
  const { profile_id_1, profile_id_2 } = req.body;
  if (!profile_id_1 || !profile_id_2) {
    return res.status(400).json({ error: 'Both profile IDs are required' });
  }
  const p1 = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile_id_1);
  const p2 = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile_id_2);
  if (!p1 || !p2) return res.status(404).json({ error: 'One or both profiles not found' });

  const result = calculateLifestyleCompatibility(p1, p2);
  res.json(result);
});

module.exports = router;
