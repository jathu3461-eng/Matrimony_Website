-- =====================================================
-- MUKURTHAM TAMIL UNICODE FIX
-- Run this in phpMyAdmin → SQL tab
-- It converts tables to utf8mb4 AND re-seeds Tamil data
-- =====================================================

-- Step 1: Convert all tables to utf8mb4
ALTER TABLE religions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE castes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE raasis CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE stars CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE countries CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE menu_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE profiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE footer_settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE shortlists CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE broker_requests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE notifications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE horoscope_match CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE refresh_tokens CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE phone_otps CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Re-seed Religions with correct Tamil
UPDATE religions SET name_ta = 'இந்து' WHERE name_en = 'Hindu';
UPDATE religions SET name_ta = 'கிறிஸ்தவம்' WHERE name_en = 'Christian';
UPDATE religions SET name_ta = 'இஸ்லாம்' WHERE name_en = 'Muslim';
UPDATE religions SET name_ta = 'பௌத்தம்' WHERE name_en = 'Buddhist';
UPDATE religions SET name_ta = 'மற்றவை' WHERE name_en = 'Other';

-- Step 3: Re-seed Castes with correct Tamil
UPDATE castes SET name_ta = 'வெள்ளாளர்' WHERE name_en = 'Vellalar';
UPDATE castes SET name_ta = 'கரையார்' WHERE name_en = 'Karaiyar';
UPDATE castes SET name_ta = 'முக்குவர்' WHERE name_en = 'Mukuvar';
UPDATE castes SET name_ta = 'கோவியர்' WHERE name_en = 'Koviyar';
UPDATE castes SET name_ta = 'விஸ்வகர்மா / கம்மாளர்' WHERE name_en = 'Vishwakarma (Kammalar)';
UPDATE castes SET name_ta = 'செட்டியார்' WHERE name_en = 'Chettiar';
UPDATE castes SET name_ta = 'ஐயர்' WHERE name_en = 'Iyer (Brahmin)';
UPDATE castes SET name_ta = 'மடைப்பள்ளி' WHERE name_en = 'Madapalli';
UPDATE castes SET name_ta = 'நட்டுவர்' WHERE name_en = 'Nattuvar';
UPDATE castes SET name_ta = 'மறவர்' WHERE name_en = 'Maravar';
UPDATE castes SET name_ta = 'கலப்புச் சாதி / ஏனையவை' WHERE name_en = 'Intercaste / Other';
UPDATE castes SET name_ta = 'சாதி தடையில்லை' WHERE name_en = 'Not Disclosed / Any';

-- Step 4: Re-seed Raasis with correct Tamil
UPDATE raasis SET name_ta = 'மேஷம்' WHERE name_en = 'Aries';
UPDATE raasis SET name_ta = 'ரிஷபம்' WHERE name_en = 'Taurus';
UPDATE raasis SET name_ta = 'மிதுனம்' WHERE name_en = 'Gemini';
UPDATE raasis SET name_ta = 'கடகம்' WHERE name_en = 'Cancer';
UPDATE raasis SET name_ta = 'சிம்மம்' WHERE name_en = 'Leo';
UPDATE raasis SET name_ta = 'கன்னி' WHERE name_en = 'Virgo';
UPDATE raasis SET name_ta = 'துலாம்' WHERE name_en = 'Libra';
UPDATE raasis SET name_ta = 'விருச்சிகம்' WHERE name_en = 'Scorpio';
UPDATE raasis SET name_ta = 'தனுசு' WHERE name_en = 'Sagittarius';
UPDATE raasis SET name_ta = 'மகரம்' WHERE name_en = 'Capricorn';
UPDATE raasis SET name_ta = 'கும்பம்' WHERE name_en = 'Aquarius';
UPDATE raasis SET name_ta = 'மீனம்' WHERE name_en = 'Pisces';

-- Step 5: Re-seed Stars with correct Tamil
UPDATE stars SET name_ta = 'அசுவினி' WHERE name_en = 'Ashwini';
UPDATE stars SET name_ta = 'பரணி' WHERE name_en = 'Bharani';
UPDATE stars SET name_ta = 'கார்த்திகை' WHERE name_en = 'Krittika';
UPDATE stars SET name_ta = 'ரோகிணி' WHERE name_en = 'Rohini';
UPDATE stars SET name_ta = 'மிருகசீரிடம்' WHERE name_en = 'Mrigashirsha';
UPDATE stars SET name_ta = 'திருவாதிரை' WHERE name_en = 'Ardra';
UPDATE stars SET name_ta = 'புனர்பூசம்' WHERE name_en = 'Punarvasu';
UPDATE stars SET name_ta = 'பூசம்' WHERE name_en = 'Pushya';
UPDATE stars SET name_ta = 'ஆயில்யம்' WHERE name_en = 'Ashlesha';
UPDATE stars SET name_ta = 'மகம்' WHERE name_en = 'Magha';
UPDATE stars SET name_ta = 'பூரம்' WHERE name_en = 'Purva Phalguni';
UPDATE stars SET name_ta = 'உத்திரம்' WHERE name_en = 'Uttara Phalguni';
UPDATE stars SET name_ta = 'அஸ்தம்' WHERE name_en = 'Hasta';
UPDATE stars SET name_ta = 'சித்திரை' WHERE name_en = 'Chitra';
UPDATE stars SET name_ta = 'சுவாதி' WHERE name_en = 'Swati';
UPDATE stars SET name_ta = 'விசாகம்' WHERE name_en = 'Visakha';
UPDATE stars SET name_ta = 'அனுஷம்' WHERE name_en = 'Anuradha';
UPDATE stars SET name_ta = 'கேட்டை' WHERE name_en = 'Jyestha';
UPDATE stars SET name_ta = 'மூலம்' WHERE name_en = 'Mula';
UPDATE stars SET name_ta = 'பூராடம்' WHERE name_en = 'Purva Ashadha';
UPDATE stars SET name_ta = 'உத்திராடம்' WHERE name_en = 'Uttara Ashadha';
UPDATE stars SET name_ta = 'திருவோணம்' WHERE name_en = 'Shravana';
UPDATE stars SET name_ta = 'அவிட்டம்' WHERE name_en = 'Dhanishta';
UPDATE stars SET name_ta = 'சதயம்' WHERE name_en = 'Shatabhisha';
UPDATE stars SET name_ta = 'பூரட்டாதி' WHERE name_en = 'Purva Bhadrapada';
UPDATE stars SET name_ta = 'உத்திரட்டாதி' WHERE name_en = 'Uttara Bhadrapada';
UPDATE stars SET name_ta = 'ரேவதி' WHERE name_en = 'Revati';

-- Step 6: Re-seed Menu Items with correct Tamil
UPDATE menu_items SET title_ta = 'முகப்பு' WHERE title_en = 'Home';
UPDATE menu_items SET title_ta = 'வரன்களைத் தேடு' WHERE title_en = 'Browse Matches';
UPDATE menu_items SET title_ta = 'எங்களைப் பற்றி' WHERE title_en = 'About Us';
UPDATE menu_items SET title_ta = 'தொடர்பு' WHERE title_en = 'Contact';

-- Step 7: Verify Tamil is now correct
SELECT '=== RELIGIONS ===' AS section;
SELECT id, name_en, name_ta FROM religions;

SELECT '=== RAASIS ===' AS section;
SELECT id, name_en, name_ta FROM raasis;

SELECT '=== STARS ===' AS section;
SELECT id, name_en, name_ta FROM stars LIMIT 5;

SELECT '=== CASTES ===' AS section;
SELECT id, name_en, name_ta FROM castes LIMIT 5;

SELECT '=== MENU ITEMS ===' AS section;
SELECT id, title_en, title_ta FROM menu_items;
