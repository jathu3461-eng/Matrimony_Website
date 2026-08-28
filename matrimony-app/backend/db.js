require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// ─── Connection Pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'mukutmzw_dbuser',
  password: process.env.DB_PASSWORD || 'Mukurtham@2026',
  database: process.env.DB_NAME     || 'mukutmzw_matrimony',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

// ─── Helper API (mirrors better-sqlite3 interface) ────────────────────────────
const db = {
  /** Returns first matching row or null */
  async get(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },
  /** Returns all matching rows */
  async all(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  /** Runs INSERT/UPDATE/DELETE — returns { lastInsertRowid, changes } */
  async run(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  },
  /** Runs raw SQL (no params) */
  async exec(sql) {
    await pool.query(sql);
  },
  pool,
};

// ─── Schema ───────────────────────────────────────────────────────────────────
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        role ENUM('regular','broker','admin') NOT NULL DEFAULT 'regular',
        business_name TEXT,
        broker_profile_limit INT DEFAULT 50,
        is_approved TINYINT NOT NULL DEFAULT 0,
        is_banned TINYINT NOT NULL DEFAULT 0,
        ui_language ENUM('en','ta') NOT NULL DEFAULT 'en',
        reset_otp VARCHAR(10),
        reset_otp_expires BIGINT,
        last_seen_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_user_id INT NOT NULL,
        profile_registered_for TEXT NOT NULL,
        name TEXT NOT NULL,
        gender ENUM('M','F') NOT NULL,
        date_of_birth VARCHAR(20) NOT NULL,
        height_feet INT NOT NULL,
        height_inches INT NOT NULL,
        education TEXT NOT NULL,
        occupation TEXT NOT NULL,
        religion_id INT,
        caste_id INT,
        sub_religion TEXT,
        raasi_id INT,
        star_id INT,
        born_country_id VARCHAR(10),
        current_country_id VARCHAR(10),
        city_or_state TEXT,
        main_profile_picture TEXT,
        horoscope_chart TEXT,
        about_me TEXT NOT NULL,
        blur_photo TINYINT NOT NULL DEFAULT 0,
        blur_horoscope TINYINT NOT NULL DEFAULT 0,
        diet VARCHAR(20) NOT NULL DEFAULT 'any',
        family_values VARCHAR(20) NOT NULL DEFAULT 'moderate',
        career_goals VARCHAR(20) NOT NULL DEFAULT 'working',
        willing_to_relocate VARCHAR(20) NOT NULL DEFAULT 'open',
        income_range TEXT,
        manglik_status VARCHAR(10) NOT NULL DEFAULT 'no',
        is_verified TINYINT NOT NULL DEFAULT 0,
        status ENUM('active','hidden') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS religions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS castes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS raasis (
        id INT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stars (
        id INT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS countries (
        code VARCHAR(5) PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ta TEXT,
        priority INT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        site_name VARCHAR(255) DEFAULT 'Mukurtham Matrimony',
        site_logo TEXT,
        site_favicon TEXT,
        contact_number VARCHAR(50) DEFAULT '+1 (416) 555-0198',
        contact_email VARCHAR(255) DEFAULT 'support@mukurtham.ca',
        contact_address TEXT,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        google_analytics_id TEXT,
        color_primary VARCHAR(20) DEFAULT '#800000',
        color_secondary VARCHAR(20) DEFAULT '#78350f',
        color_background VARCHAR(20) DEFAULT '#fafaf9'
      );

      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT PRIMARY KEY DEFAULT 1,
        footer_copyright_text_en TEXT,
        footer_copyright_text_ta TEXT,
        footer_about_snippet_en TEXT,
        footer_about_snippet_ta TEXT,
        social_facebook TEXT,
        social_youtube TEXT,
        social_tiktok TEXT,
        social_instagram TEXT
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_ta TEXT NOT NULL,
        target_url TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active TINYINT NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS shortlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        profile_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_shortlist (user_id, profile_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS interests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_profile_id INT NOT NULL,
        receiver_profile_id INT NOT NULL,
        status ENUM('pending','accepted','rejected','declined') NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_interest (sender_profile_id, receiver_profile_id),
        FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS broker_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        broker_id INT NOT NULL,
        status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL,
        UNIQUE KEY uq_broker_request (user_id, broker_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thread_id VARCHAR(50) NOT NULL,
        sender_profile_id INT NOT NULL,
        receiver_profile_id INT NOT NULL,
        message TEXT NOT NULL,
        client_id VARCHAR(64) NULL,
        delivered_at TIMESTAMP NULL,
        read_at TIMESTAMP NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sender_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'interest_received',
        message TEXT NOT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS horoscope_match (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id_1 INT NOT NULL,
        profile_id_2 INT NOT NULL,
        score INT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_horoscope (profile_id_1, profile_id_2),
        FOREIGN KEY (profile_id_1) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id_2) REFERENCES profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at BIGINT NOT NULL,
        revoked_at BIGINT NULL,
        device_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS push_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        platform VARCHAR(10) NOT NULL DEFAULT 'ios',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_push_token (user_id, token(255)),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Index for chat thread lookups
    await conn.query(`CREATE INDEX IF NOT EXISTS idx_chat_thread ON chat_messages(thread_id, sent_at)`).catch(() => {});

    // ─── Migrations for existing databases (MySQL lacks ADD COLUMN IF NOT EXISTS) ───
    async function ensureColumn(table, column, ddl) {
      const [[row]] = await conn.query(
        `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (row.c === 0) {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
      }
    }
    async function ensureIndex(table, indexName, ddl) {
      const [[row]] = await conn.query(
        `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, indexName]
      );
      if (row.c === 0) {
        await conn.query(`CREATE ${ddl}`);
      }
    }

    await ensureColumn('chat_messages', 'client_id', 'client_id VARCHAR(64) NULL');
    await ensureColumn('chat_messages', 'delivered_at', 'delivered_at TIMESTAMP NULL');
    await ensureColumn('users', 'last_seen_at', 'last_seen_at TIMESTAMP NULL');
    await ensureColumn('users', 'is_banned', 'is_banned TINYINT NOT NULL DEFAULT 0');
    await ensureIndex('chat_messages', 'uq_chat_client_id', 'UNIQUE INDEX uq_chat_client_id ON chat_messages(client_id)');
    await ensureIndex('chat_messages', 'idx_chat_thread_id', 'INDEX idx_chat_thread_id ON chat_messages(thread_id, id)');
    await ensureIndex('refresh_tokens', 'idx_refresh_tokens_hash', 'UNIQUE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash)');
    await ensureIndex('refresh_tokens', 'idx_refresh_tokens_user', 'INDEX idx_refresh_tokens_user ON refresh_tokens(user_id)');

    await ensureColumn('users', 'email_verified', 'email_verified TINYINT NOT NULL DEFAULT 0');
    await ensureColumn('countries', 'name_ta', 'name_ta TEXT AFTER name_en');

    await seed(conn);
    console.log('✅ MySQL DB initialized');
  } finally {
    conn.release();
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
async function seed(conn) {
  // Settings row
  await conn.query('INSERT IGNORE INTO settings (id) VALUES (1)');
  await conn.query('INSERT IGNORE INTO footer_settings (id) VALUES (1)');

  // ── Admin user (create or repair password) ──────────────────────────────────
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'matrimony2026@gmail.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Matrimony2026@';
  const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 12);

  const [[adminRow]] = await conn.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (!adminRow) {
    await conn.query(
      'INSERT INTO users (username, email, password_hash, phone_number, role, is_approved, ui_language) VALUES (?,?,?,?,?,?,?)',
      ['superadmin', ADMIN_EMAIL, adminHash, '+10000000000', 'admin', 1, 'en']
    );
    console.log('✅ Admin user created:', ADMIN_EMAIL);
  } else {
    // Always sync the admin password from env on startup so it stays correct.
    await conn.query('UPDATE users SET password_hash = ?, is_approved = 1 WHERE id = ?', [adminHash, adminRow.id]);
    console.log('✅ Admin password synced for:', ADMIN_EMAIL);
  }

  // Menu items
  const [[{ c: menuCount }]] = await conn.query('SELECT COUNT(*) c FROM menu_items');
  if (menuCount === 0) {
    const items = [
      ['Home', 'முகப்பு', '/', 1],
      ['Browse Matches', 'வரன்களைத் தேட', '/search', 2],
      ['About Us', 'எங்களைப் பற்றி', '/about', 3],
      ['Contact', 'தொடர்பு', '/contact', 4],
    ];
    for (const [en, ta, url, order] of items) {
      await conn.query('INSERT INTO menu_items (title_en, title_ta, target_url, display_order, is_active) VALUES (?,?,?,?,1)', [en, ta, url, order]);
    }
  }

  // Religions
  const [[{ c: relCount }]] = await conn.query('SELECT COUNT(*) c FROM religions');
  if (relCount === 0) {
    const rel = [['Hindu','இந்து'],['Christian','கிறிஸ்தவம்'],['Muslim','இஸ்லாம்'],['Buddhist','பௌத்தம்'],['Other','மற்றவை']];
    for (const [en, ta] of rel) await conn.query('INSERT INTO religions (name_en, name_ta) VALUES (?,?)', [en, ta]);
  }

  // Castes
  const [[{ c: casteCount }]] = await conn.query('SELECT COUNT(*) c FROM castes');
  if (casteCount === 0) {
    const castes = [
      ['Vellalar','வெள்ளாளர்'],['Karaiyar','கரையார்'],['Mukuvar','முக்குவர்'],
      ['Koviyar','கோவியர்'],['Vishwakarma (Kammalar)','விஸ்வகர்மா / கம்மாளர்'],
      ['Chettiar','செட்டியார்'],['Iyer (Brahmin)','ஐயர்'],['Madapalli','மடைப்பள்ளி'],
      ['Nattuvar','நட்டுவர்'],['Maravar','மறவர்'],['Intercaste / Other','கலப்புச் சாதி / ஏனையவை'],
      ['Not Disclosed / Any','சாதி தடையில்லை'],
    ];
    for (const [en, ta] of castes) await conn.query('INSERT INTO castes (name_en, name_ta) VALUES (?,?)', [en, ta]);
  }

  // Raasis
  const [[{ c: raasiCount }]] = await conn.query('SELECT COUNT(*) c FROM raasis');
  if (raasiCount === 0) {
    const raasis = ['Aries|மேஷம்','Taurus|ரிஷபம்','Gemini|மிதுனம்','Cancer|கடகம்','Leo|சிம்மம்',
      'Virgo|கன்னி','Libra|துலாம்','Scorpio|விருச்சிகம்','Sagittarius|தனுசு',
      'Capricorn|மகரம்','Aquarius|கும்பம்','Pisces|மீனம்'];
    for (let i = 0; i < raasis.length; i++) {
      const [en, ta] = raasis[i].split('|');
      await conn.query('INSERT INTO raasis (id, name_en, name_ta) VALUES (?,?,?)', [i + 1, en, ta]);
    }
  }

  // Stars
  const [[{ c: starCount }]] = await conn.query('SELECT COUNT(*) c FROM stars');
  if (starCount === 0) {
    const stars = ['Ashwini|அசுவினி','Bharani|பரணி','Krittika|கார்த்திகை','Rohini|ரோகிணி',
      'Mrigashirsha|மிருகசீரிடம்','Ardra|திருவாதிரை','Punarvasu|புனர்பூசம்','Pushya|பூசம்',
      'Ashlesha|ஆயில்யம்','Magha|மகம்','Purva Phalguni|பூரம்','Uttara Phalguni|உத்திரம்',
      'Hasta|அஸ்தம்','Chitra|சித்திரை','Swati|சுவாதி','Visakha|விசாகம்','Anuradha|அனுஷம்',
      'Jyestha|கேட்டை','Mula|மூலம்','Purva Ashadha|பூராடம்','Uttara Ashadha|உத்திராடம்',
      'Shravana|திருவோணம்','Dhanishta|அவிட்டம்','Shatabhisha|சதயம்','Purva Bhadrapada|பூரட்டாதி',
      'Uttara Bhadrapada|உத்திரட்டாதி','Revati|ரேவதி'];
    for (let i = 0; i < stars.length; i++) {
      const [en, ta] = stars[i].split('|');
      await conn.query('INSERT INTO stars (id, name_en, name_ta) VALUES (?,?,?)', [i + 1, en, ta]);
    }
  }

  // Countries
  const priority = [['CA','Canada','கனடா',1],['GB','United Kingdom','இங்கிலாந்து',2],['LK','Sri Lanka','இலங்கை',3],['IN','India','இந்தியா',4],
    ['FR','France','பிரான்ஸ்',5],['DE','Germany','ஜெர்மனி',6],['CH','Switzerland','சுவிட்சர்லாந்து',7],['AU','Australia','ஆஸ்திரேலியா',8],
    ['NO','Norway','நார்வே',9],['US','United States','அமெரிக்கா',10]];
  const rest = [
      ['AF','Afghanistan','ஆப்கானிஸ்தான்'],['AL','Albania','அல்பேனியா'],['DZ','Algeria','அல்ஜீரியா'],['AD','Andorra','அன்டோரா'],['AO','Angola','அங்கோலா'],
      ['AG','Antigua and Barbuda','அன்டிகுவா'],['AR','Argentina','அர்ஜென்டினா'],['AM','Armenia','ஆர்மீனியா'],['AT','Austria','ஆஸ்திரியா'],['AZ','Azerbaijan','அசர்பைஜான்'],
      ['BS','Bahamas','பஹாமாஸ்'],['BH','Bahrain','பஹ்ரைன்'],['BD','Bangladesh','பங்களாதேஷ்'],['BB','Barbados','பார்படாஸ்'],['BY','Belarus','பெலாரூஸ்'],
      ['BE','Belgium','பெல்ஜியம்'],['BZ','Belize','பெலிஸ்'],['BJ','Benin','பெனின்'],['BT','Bhutan','பூட்டான்'],['BO','Bolivia','பொலிவியா'],
      ['BA','Bosnia and Herzegovina','பொஸ்னியா'],['BW','Botswana','போட்ஸ்வானா'],['BR','Brazil','பிரேசில்'],['BN','Brunei','புருனே'],['BG','Bulgaria','பல்கேரியா'],
      ['BF','Burkina Faso','புர்கினா பாசோ'],['BI','Burundi','புருண்டி'],['CV','Cabo Verde','கேப் வெர்டே'],['KH','Cambodia','கம்போடியா'],['CM','Cameroon','கேமரூன்'],
      ['CF','Central African Republic','மத்திய ஆப்ரிக்கா'],['TD','Chad','சாட்'],['CL','Chile','சிலி'],['CN','China','சீனா'],['CO','Colombia','கொலம்பியா'],
      ['KM','Comoros','கொமொரோஸ்'],['CG','Congo','காங்கோ'],['CR','Costa Rica','கோஸ்டா ரிகா'],['HR','Croatia','குரோஷியா'],['CU','Cuba','கியூபா'],
      ['CY','Cyprus','சைப்ரஸ்'],['CZ','Czechia','செக் குடியரசு'],['DK','Denmark','டென்மார்க்'],['DJ','Djibouti','ஜிபூட்டி'],['DM','Dominica','டொமினிகா'],
      ['DO','Dominican Republic','டொமினிகன்'],['EC','Ecuador','எக்குவடார்'],['EG','Egypt','எகிப்து'],['SV','El Salvador','எல் சால்வடோர்'],['GQ','Equatorial Guinea','எக்குவடோரியல் கினியா'],
      ['ER','Eritrea','எரித்திரியா'],['EE','Estonia','எஸ்டோனியா'],['SZ','Eswatini','எஸ்வாத்தினி'],['ET','Ethiopia','எத்தியோப்பியா'],['FJ','Fiji','பிஜி'],
      ['FI','Finland','பின்லாந்து'],['GA','Gabon','காபோன்'],['GM','Gambia','காம்பியா'],['GE','Georgia','ஜார்ஜியா'],['GH','Ghana','கானா'],
      ['GR','Greece','கிரீஸ்'],['GD','Grenada','கிரெனடா'],['GT','Guatemala','குவாத்தமாலா'],['GN','Guinea','கினியா'],['GW','Guinea-Bissau','கினியா-பிசாவ்'],
      ['GY','Guyana','கயானா'],['HT','Haiti','ஹெய்தி'],['VA','Holy See','வத்திக்கான்'],['HN','Honduras','ஹோண்டுராஸ்'],['HU','Hungary','ஹங்கேரி'],
      ['IS','Iceland','ஐஸ்லாந்து'],['ID','Indonesia','இந்தோனேஷியா'],['IR','Iran','ஈரான்'],['IQ','Iraq','ஈராக்'],['IE','Ireland','அயர்லாந்து'],
      ['IL','Israel','இஸ்ரேல்'],['IT','Italy','இத்தாலி'],['JM','Jamaica','ஜமைக்கா'],['JP','Japan','ஜப்பான்'],['JO','Jordan','ஜோர்டான்'],
      ['KZ','Kazakhstan','கஜகஸ்தான்'],['KE','Kenya','கென்யா'],['KI','Kiribati','கிரிபாட்டி'],['KW','Kuwait','குவைத்'],['KG','Kyrgyzstan','கிர்கிஸ்தான்'],
      ['LA','Laos','லாவோஸ்'],['LV','Latvia','லாட்வியா'],['LB','Lebanon','லெபனான்'],['LS','Lesotho','லெசோதோ'],['LR','Liberia','லைபீரியா'],
      ['LY','Libya','லிபியா'],['LI','Liechtenstein','லிச்சென்ஸ்டீன்'],['LT','Lithuania','லிதுவேனியா'],['LU','Luxembourg','லக்சம்பர்க்'],['MG','Madagascar','மடகாஸ்கர்'],
      ['MW','Malawi','மலாவி'],['MY','Malaysia','மலேசியா'],['MV','Maldives','மாலத்தீவு'],['ML','Mali','மாலி'],['MT','Malta','மால்டா'],
      ['MH','Marshall Islands','மார்ஷல் தீவுகள்'],['MR','Mauritania','மொரிட்டானியா'],['MU','Mauritius','மொரீஷியஸ்'],['MX','Mexico','மெக்ஸிகோ'],['FM','Micronesia','மைக்ரோனேஷியா'],
      ['MD','Moldova','மால்டோவா'],['MC','Monaco','மொனாக்கோ'],['MN','Mongolia','மங்கோலியா'],['ME','Montenegro','மொண்டெனேக்ரோ'],['MA','Morocco','மொராக்கோ'],
      ['MZ','Mozambique','மொசாம்பிக்'],['MM','Myanmar','மியான்மர்'],['NA','Namibia','நமீபியா'],['NR','Nauru','நவ்ரு'],['NP','Nepal','நேபாளம்'],
      ['NL','Netherlands','நெதர்லாந்து'],['NZ','New Zealand','நியூசிலாந்து'],['NI','Nicaragua','நிக்கரகுவா'],['NE','Niger','நைஜர்'],['NG','Nigeria','நைஜீரியா'],
      ['KP','North Korea','வட கொரியா'],['MK','North Macedonia','வட மாசிடோனியா'],['OM','Oman','ஓமன்'],['PK','Pakistan','பாகிஸ்தான்'],['PW','Palau','பலாவு'],
      ['PS','Palestine State','பாலஸ்தீன்'],['PA','Panama','பனாமா'],['PG','Papua New Guinea','பப்புவா'],['PY','Paraguay','பராகுவே'],['PE','Peru','பெரு'],
      ['PH','Philippines','பிலிப்பைன்ஸ்'],['PL','Poland','போலந்து'],['PT','Portugal','போர்ச்சுகல்'],['QA','Qatar','கதார்'],['RO','Romania','ருமேனியா'],
      ['RU','Russia','ரஷ்யா'],['RW','Rwanda','ருவாண்டா'],['KN','Saint Kitts and Nevis','செயின்ட் கிட்ஸ்'],['LC','Saint Lucia','செயின்ட் லூசியா'],
      ['VC','Saint Vincent and the Grenadines','செயின்ட் வின்சென்ட்'],['WS','Samoa','சமோவா'],['SM','San Marino','சான் மரினோ'],['ST','Sao Tome and Principe','சாவ் டோம்'],
      ['SA','Saudi Arabia','சவூதி அரேபியா'],['SN','Senegal','செனகல்'],['RS','Serbia','செர்பியா'],['SC','Seychelles','சீசெல்ஸ்'],['SL','Sierra Leone','சியரா லியோன்'],
      ['SG','Singapore','சிங்கப்பூர்'],['SK','Slovakia','ஸ்லோவாக்கியா'],['SI','Slovenia','ஸ்லோவேனியா'],['SB','Solomon Islands','சொலமன் தீவுகள்'],['SO','Somalia','சோமாலியா'],
      ['ZA','South Africa','தென்னாப்பிரிக்கா'],['KR','South Korea','தென் கொரியா'],['SS','South Sudan','தெற்கு சூடான்'],['ES','Spain','ஸ்பெயின்'],['SD','Sudan','சூடான்'],
      ['SR','Suriname','சுரினாம்'],['SE','Sweden','ஸ்வீடன்'],['SY','Syria','சிரியா'],['TJ','Tajikistan','தஜிகிஸ்தான்'],['TZ','Tanzania','தன்சானியா'],
      ['TH','Thailand','தாய்லாந்து'],['TL','Timor-Leste','கிழக்கு திமோர்'],['TG','Togo','டோகோ'],['TO','Tonga','டொங்கா'],['TT','Trinidad and Tobago','டிரினிடாட்'],
      ['TN','Tunisia','டுனிசியா'],['TR','Turkey','துருக்கி'],['TM','Turkmenistan','துர்க்மெனிஸ்தான்'],['TV','Tuvalu','துவாலு'],['UG','Uganda','உகாண்டா'],
      ['UA','Ukraine','உக்ரைன்'],['AE','United Arab Emirates','ஐக்கிய அரபு'],['UY','Uruguay','உருகுவே'],['UZ','Uzbekistan','உஸ்பெகிஸ்தான்'],['VU','Vanuatu','வனுவாட்டு'],
      ['VE','Venezuela','வெனிசுலா'],['VN','Vietnam','வியட்நாம்'],['YE','Yemen','யேமன்'],['ZM','Zambia','சாம்பியா'],['ZW','Zimbabwe','சிம்பாப்வே'],
    ];
    const [[{ c: countryCount }]] = await conn.query('SELECT COUNT(*) c FROM countries');
    if (countryCount === 0) {
      for (const [code, name, ta, p] of priority) await conn.query('INSERT IGNORE INTO countries (code, name_en, name_ta, priority) VALUES (?,?,?,?)', [code, name, ta, p]);
      for (const [code, name, ta] of rest) await conn.query('INSERT IGNORE INTO countries (code, name_en, name_ta, priority) VALUES (?,?,?,?)', [code, name, ta, null]);
    }
  const allCountries = [...priority, ...rest];
  for (const [code, , ta] of allCountries) {
    await conn.query('UPDATE countries SET name_ta = ? WHERE code = ? AND (name_ta IS NULL OR name_ta = \"\")', [ta, code]);
  }
}

// Start init (server.js awaits this before listen)
const dbReady = initDB().catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});

module.exports = { db, dbReady };
