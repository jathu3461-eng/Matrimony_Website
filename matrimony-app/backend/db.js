const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'matrimony.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SCHEMA
// (Written for SQLite here so the whole app runs with zero external services.
//  Column types map 1:1 onto MySQL/PostgreSQL — swap the Database driver in
//  this file for `mysql2`/`pg` + an ORM like Sequelize/Prisma to go to a real
//  server; the rest of the codebase talks to `db` through the same queries.)
// ---------------------------------------------------------------------------

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('regular','broker','admin')) DEFAULT 'regular',
  business_name TEXT,
  broker_profile_limit INTEGER DEFAULT 50,
  is_approved INTEGER NOT NULL DEFAULT 0,
  ui_language TEXT NOT NULL DEFAULT 'en' CHECK(ui_language IN ('en','ta')),
  reset_otp TEXT,
  reset_otp_expires INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_registered_for TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('M','F')),
  date_of_birth TEXT NOT NULL,
  height_feet INTEGER NOT NULL,
  height_inches INTEGER NOT NULL,
  education TEXT NOT NULL,
  occupation TEXT NOT NULL,
  religion_id INTEGER,
  caste_id INTEGER,
  sub_religion TEXT,
  raasi_id INTEGER,
  star_id INTEGER,
  born_country_id TEXT,
  current_country_id TEXT,
  city_or_state TEXT,
  main_profile_picture TEXT,
  horoscope_chart TEXT,
  about_me TEXT NOT NULL,
  blur_photo INTEGER NOT NULL DEFAULT 0,
  blur_horoscope INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','hidden')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS religions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS castes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raasis (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stars (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  priority INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  site_name TEXT DEFAULT 'Mukurtham Matrimony',
  site_logo TEXT,
  site_favicon TEXT,
  contact_number TEXT DEFAULT '+1 (416) 555-0198',
  contact_email TEXT DEFAULT 'support@mukurtham.ca',
  contact_address TEXT DEFAULT '',
  meta_title TEXT DEFAULT 'Mukurtham Matrimony - Global Sri Lankan Tamil Matches',
  meta_description TEXT DEFAULT 'Find your ideal bride or groom within the global Sri Lankan Tamil diaspora.',
  meta_keywords TEXT DEFAULT 'tamil matrimony, srilankan tamil bride, jaffna matrimony, mukurtham',
  google_analytics_id TEXT,
  color_primary TEXT DEFAULT '#800000',
  color_secondary TEXT DEFAULT '#78350f',
  color_background TEXT DEFAULT '#fafaf9'
);

CREATE TABLE IF NOT EXISTS footer_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  footer_copyright_text_en TEXT DEFAULT '© 2026 Mukurtham Matrimony. All Rights Reserved.',
  footer_copyright_text_ta TEXT DEFAULT '© 2026 முகூர்த்தம் மேட்ரிமோனி. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  footer_about_snippet_en TEXT DEFAULT 'Trusted matchmaking for the global Sri Lankan Tamil diaspora.',
  footer_about_snippet_ta TEXT DEFAULT 'உலகளாவிய இலங்கை தமிழ் சமூகத்திற்கான நம்பகமான திருமண தேடல்.',
  social_facebook TEXT,
  social_youtube TEXT,
  social_tiktok TEXT,
  social_instagram TEXT
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  target_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS shortlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, profile_id)
);

CREATE TABLE IF NOT EXISTS interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_profile_id, receiver_profile_id)
);

CREATE TABLE IF NOT EXISTS horoscope_match (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id_1 INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id_2 INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id_1, profile_id_2)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  sender_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_thread ON chat_messages(thread_id, sent_at);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'interest_received',
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Run alter tables for existing environments — all wrapped so they're safe on re-runs
const safeAlter = (sql) => { try { db.exec(sql); } catch (_) {} };

// Phase 1
safeAlter('ALTER TABLE profiles ADD COLUMN blur_photo INTEGER NOT NULL DEFAULT 0;');
safeAlter('ALTER TABLE profiles ADD COLUMN blur_horoscope INTEGER NOT NULL DEFAULT 0;');

// Phase 2 — lifestyle & verification columns
safeAlter("ALTER TABLE profiles ADD COLUMN diet TEXT NOT NULL DEFAULT 'any';");
safeAlter("ALTER TABLE profiles ADD COLUMN family_values TEXT NOT NULL DEFAULT 'moderate';");
safeAlter("ALTER TABLE profiles ADD COLUMN career_goals TEXT NOT NULL DEFAULT 'working';");
safeAlter("ALTER TABLE profiles ADD COLUMN willing_to_relocate TEXT NOT NULL DEFAULT 'open';");
safeAlter('ALTER TABLE profiles ADD COLUMN income_range TEXT;');
safeAlter("ALTER TABLE profiles ADD COLUMN manglik_status TEXT NOT NULL DEFAULT 'no';");
safeAlter('ALTER TABLE profiles ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;');

// Phase 2 — interests message field
safeAlter('ALTER TABLE interests ADD COLUMN message TEXT;');


// ---------------------------------------------------------------------------
// SEED DATA (idempotent)
// ---------------------------------------------------------------------------

function seed() {
  const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!settingsRow) db.prepare('INSERT INTO settings (id) VALUES (1)').run();

  const footerRow = db.prepare('SELECT id FROM footer_settings WHERE id = 1').get();
  if (!footerRow) db.prepare('INSERT INTO footer_settings (id) VALUES (1)').run();

  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('matrimony2026@gmail.com');
  if (!adminExists) {
    db.prepare(`INSERT INTO users (username, email, password_hash, phone_number, role, is_approved, ui_language)
                VALUES (?,?,?,?,?,?,?)`)
      .run('superadmin', 'matrimony2026@gmail.com', bcrypt.hashSync('Matrimony2026', 10), '+10000000000', 'admin', 1, 'en');
  }

  const menuCount = db.prepare('SELECT COUNT(*) c FROM menu_items').get().c;
  if (menuCount === 0) {
    const items = [
      ['Home', 'முகப்பு', '/', 1],
      ['Browse Matches', 'வரன்களைத் தேட', '/search', 2],
      ['About Us', 'எங்களைப் பற்றி', '/about', 3],
      ['Contact', 'தொடர்பு', '/contact', 4],
    ];
    const ins = db.prepare('INSERT INTO menu_items (title_en, title_ta, target_url, display_order, is_active) VALUES (?,?,?,?,1)');
    items.forEach(i => ins.run(...i));
  }

  const religionCount = db.prepare('SELECT COUNT(*) c FROM religions').get().c;
  if (religionCount === 0) {
    const rel = [
      ['Hindu', 'இந்து'], ['Christian', 'கிறிஸ்தவம்'], ['Muslim', 'இஸ்லாம்'],
      ['Buddhist', 'பௌத்தம்'], ['Other', 'மற்றவை'],
    ];
    const ins = db.prepare('INSERT INTO religions (name_en, name_ta) VALUES (?,?)');
    rel.forEach(r => ins.run(...r));
  }

  const casteCount = db.prepare('SELECT COUNT(*) c FROM castes').get().c;
  if (casteCount === 0) {
    const castes = [
      ['Vellalar', 'வெள்ளாளர்'], ['Karaiyar', 'கரையார்'], ['Mukuvar', 'முக்குவர்'],
      ['Koviyar', 'கோவியர்'], ['Vishwakarma (Kammalar)', 'விஸ்வகர்மா / கம்மாளர்'],
      ['Chettiar', 'செட்டியார்'], ['Iyer (Brahmin)', 'ஐயர்'], ['Madapalli', 'மடைப்பள்ளி'],
      ['Nattuvar', 'நட்டுவர்'], ['Maravar', 'மறவர்'], ['Intercaste / Other', 'கலப்புச் சாதி / ஏனையவை'],
      ['Not Disclosed / Any', 'சாதி தடையில்லை'],
    ];
    const ins = db.prepare('INSERT INTO castes (name_en, name_ta) VALUES (?,?)');
    castes.forEach(c => ins.run(...c));
  }

  const raasiCount = db.prepare('SELECT COUNT(*) c FROM raasis').get().c;
  if (raasiCount === 0) {
    const raasis = [
      'Aries|மேஷம்', 'Taurus|ரிஷபம்', 'Gemini|மிதுனம்', 'Cancer|கடகம்', 'Leo|சிம்மம்',
      'Virgo|கன்னி', 'Libra|துலாம்', 'Scorpio|விருச்சிகம்', 'Sagittarius|தனுசு',
      'Capricorn|மகரம்', 'Aquarius|கும்பம்', 'Pisces|மீனம்',
    ];
    const ins = db.prepare('INSERT INTO raasis (id, name_en, name_ta) VALUES (?,?,?)');
    raasis.forEach((r, idx) => { const [en, ta] = r.split('|'); ins.run(idx + 1, en, ta); });
  }

  const starCount = db.prepare('SELECT COUNT(*) c FROM stars').get().c;
  if (starCount === 0) {
    const stars = [
      'Ashwini|அசுவினி', 'Bharani|பரணி', 'Krittika|கார்த்திகை', 'Rohini|ரோகிணி',
      'Mrigashirsha|மிருகசீரிடம்', 'Ardra|திருவாதிரை', 'Punarvasu|புனர்பூசம்', 'Pushya|பூசம்',
      'Ashlesha|ஆயில்யம்', 'Magha|மகம்', 'Purva Phalguni|பூரம்', 'Uttara Phalguni|உத்திரம்',
      'Hasta|அஸ்தம்', 'Chitra|சித்திரை', 'Swati|சுவாதி', 'Visakha|விசாகம்', 'Anuradha|அனுஷம்',
      'Jyestha|கேட்டை', 'Mula|மூலம்', 'Purva Ashadha|பூராடம்', 'Uttara Ashadha|உத்திராடம்',
      'Shravana|திருவோணம்', 'Dhanishta|அவிட்டம்', 'Shatabhisha|சதயம்', 'Purva Bhadrapada|பூரட்டாதி',
      'Uttara Bhadrapada|உத்திரட்டாதி', 'Revati|ரேவதி',
    ];
    const ins = db.prepare('INSERT INTO stars (id, name_en, name_ta) VALUES (?,?,?)');
    stars.forEach((s, idx) => { const [en, ta] = s.split('|'); ins.run(idx + 1, en, ta); });
  }

  const countryCount = db.prepare('SELECT COUNT(*) c FROM countries').get().c;
  if (countryCount === 0) {
    const priority = [
      ['CA', 'Canada', 1], ['GB', 'United Kingdom', 2], ['LK', 'Sri Lanka', 3], ['IN', 'India', 4],
      ['FR', 'France', 5], ['DE', 'Germany', 6], ['CH', 'Switzerland', 7], ['AU', 'Australia', 8],
      ['NO', 'Norway', 9], ['US', 'United States', 10],
    ];
    const rest = [
      ['AF','Afghanistan'],['AL','Albania'],['DZ','Algeria'],['AD','Andorra'],['AO','Angola'],
      ['AG','Antigua and Barbuda'],['AR','Argentina'],['AM','Armenia'],['AT','Austria'],['AZ','Azerbaijan'],
      ['BS','Bahamas'],['BH','Bahrain'],['BD','Bangladesh'],['BB','Barbados'],['BY','Belarus'],
      ['BE','Belgium'],['BZ','Belize'],['BJ','Benin'],['BT','Bhutan'],['BO','Bolivia'],
      ['BA','Bosnia and Herzegovina'],['BW','Botswana'],['BR','Brazil'],['BN','Brunei'],['BG','Bulgaria'],
      ['BF','Burkina Faso'],['BI','Burundi'],['CV','Cabo Verde'],['KH','Cambodia'],['CM','Cameroon'],
      ['CF','Central African Republic'],['TD','Chad'],['CL','Chile'],['CN','China'],['CO','Colombia'],
      ['KM','Comoros'],['CG','Congo'],['CR','Costa Rica'],['HR','Croatia'],['CU','Cuba'],
      ['CY','Cyprus'],['CZ','Czechia'],['DK','Denmark'],['DJ','Djibouti'],['DM','Dominica'],
      ['DO','Dominican Republic'],['EC','Ecuador'],['EG','Egypt'],['SV','El Salvador'],['GQ','Equatorial Guinea'],
      ['ER','Eritrea'],['EE','Estonia'],['SZ','Eswatini'],['ET','Ethiopia'],['FJ','Fiji'],
      ['FI','Finland'],['GA','Gabon'],['GM','Gambia'],['GE','Georgia'],['GH','Ghana'],
      ['GR','Greece'],['GD','Grenada'],['GT','Guatemala'],['GN','Guinea'],['GW','Guinea-Bissau'],
      ['GY','Guyana'],['HT','Haiti'],['VA','Holy See'],['HN','Honduras'],['HU','Hungary'],
      ['IS','Iceland'],['ID','Indonesia'],['IR','Iran'],['IQ','Iraq'],['IE','Ireland'],
      ['IL','Israel'],['IT','Italy'],['JM','Jamaica'],['JP','Japan'],['JO','Jordan'],
      ['KZ','Kazakhstan'],['KE','Kenya'],['KI','Kiribati'],['KW','Kuwait'],['KG','Kyrgyzstan'],
      ['LA','Laos'],['LV','Latvia'],['LB','Lebanon'],['LS','Lesotho'],['LR','Liberia'],
      ['LY','Libya'],['LI','Liechtenstein'],['LT','Lithuania'],['LU','Luxembourg'],['MG','Madagascar'],
      ['MW','Malawi'],['MY','Malaysia'],['MV','Maldives'],['ML','Mali'],['MT','Malta'],
      ['MH','Marshall Islands'],['MR','Mauritania'],['MU','Mauritius'],['MX','Mexico'],['FM','Micronesia'],
      ['MD','Moldova'],['MC','Monaco'],['MN','Mongolia'],['ME','Montenegro'],['MA','Morocco'],
      ['MZ','Mozambique'],['MM','Myanmar'],['NA','Namibia'],['NR','Nauru'],['NP','Nepal'],
      ['NL','Netherlands'],['NZ','New Zealand'],['NI','Nicaragua'],['NE','Niger'],['NG','Nigeria'],
      ['KP','North Korea'],['MK','North Macedonia'],['OM','Oman'],['PK','Pakistan'],['PW','Palau'],
      ['PS','Palestine State'],['PA','Panama'],['PG','Papua New Guinea'],['PY','Paraguay'],['PE','Peru'],
      ['PH','Philippines'],['PL','Poland'],['PT','Portugal'],['QA','Qatar'],['RO','Romania'],
      ['RU','Russia'],['RW','Rwanda'],['KN','Saint Kitts and Nevis'],['LC','Saint Lucia'],
      ['VC','Saint Vincent and the Grenadines'],['WS','Samoa'],['SM','San Marino'],['ST','Sao Tome and Principe'],
      ['SA','Saudi Arabia'],['SN','Senegal'],['RS','Serbia'],['SC','Seychelles'],['SL','Sierra Leone'],
      ['SG','Singapore'],['SK','Slovakia'],['SI','Slovenia'],['SB','Solomon Islands'],['SO','Somalia'],
      ['ZA','South Africa'],['KR','South Korea'],['SS','South Sudan'],['ES','Spain'],['SD','Sudan'],
      ['SR','Suriname'],['SE','Sweden'],['SY','Syria'],['TJ','Tajikistan'],['TZ','Tanzania'],
      ['TH','Thailand'],['TL','Timor-Leste'],['TG','Togo'],['TO','Tonga'],['TT','Trinidad and Tobago'],
      ['TN','Tunisia'],['TR','Turkey'],['TM','Turkmenistan'],['TV','Tuvalu'],['UG','Uganda'],
      ['UA','Ukraine'],['AE','United Arab Emirates'],['UY','Uruguay'],['UZ','Uzbekistan'],['VU','Vanuatu'],
      ['VE','Venezuela'],['VN','Vietnam'],['YE','Yemen'],['ZM','Zambia'],['ZW','Zimbabwe'],
    ];
    const ins = db.prepare('INSERT INTO countries (code, name_en, priority) VALUES (?,?,?)');
    priority.forEach(([code, name, p]) => ins.run(code, name, p));
    rest.forEach(([code, name]) => ins.run(code, name, null));
  }
}

seed();

module.exports = db;
