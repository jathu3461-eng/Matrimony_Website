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
  const [[{ c: countryCount }]] = await conn.query('SELECT COUNT(*) c FROM countries');
  if (countryCount === 0) {
    const priority = [['CA','Canada',1],['GB','United Kingdom',2],['LK','Sri Lanka',3],['IN','India',4],
      ['FR','France',5],['DE','Germany',6],['CH','Switzerland',7],['AU','Australia',8],
      ['NO','Norway',9],['US','United States',10]];
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
    for (const [code, name, p] of priority) await conn.query('INSERT IGNORE INTO countries (code, name_en, priority) VALUES (?,?,?)', [code, name, p]);
    for (const [code, name] of rest) await conn.query('INSERT IGNORE INTO countries (code, name_en, priority) VALUES (?,?,?)', [code, name, null]);
  }
}

// Start init (server.js awaits this before listen)
const dbReady = initDB().catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});

module.exports = { db, dbReady };
