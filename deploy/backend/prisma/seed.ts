import { PrismaClient, ProfileRegisteredFor, Gender, FileType, MembershipStatus, PaymentStatus, NotificationType, ReportStatus } from '../../backend/prisma-client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  const roles = ['admin', 'moderator', 'broker', 'user', 'super_admin', 'support'];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  console.log('Seeding religions...');
  const hindu = await prisma.religion.upsert({
    where: { nameEn: 'Hindu' },
    update: {},
    create: { nameEn: 'Hindu', nameTa: 'இந்து' }
  });
  const christian = await prisma.religion.upsert({
    where: { nameEn: 'Christian' },
    update: {},
    create: { nameEn: 'Christian', nameTa: 'கிறிஸ்தவம்' }
  });
  const islam = await prisma.religion.upsert({
    where: { nameEn: 'Islam' },
    update: {},
    create: { nameEn: 'Islam', nameTa: 'இஸ்லாம்' }
  });

  console.log('Seeding castes (SL Tamil Castes)...');
  const castes = [
    { nameEn: 'Vellalar', nameTa: 'வெள்ளாளர்', religionId: hindu.id },
    { nameEn: 'Karaiyar', nameTa: 'கரையார்', religionId: hindu.id },
    { nameEn: 'Mukuvar', nameTa: 'முக்குவர்', religionId: hindu.id },
    { nameEn: 'Koviyar', nameTa: 'கோவியர்', religionId: hindu.id },
    { nameEn: 'Vishwakarma (Kammalar)', nameTa: 'விஸ்வகர்மா / கம்மாளர்', religionId: hindu.id },
    { nameEn: 'Chettiar', nameTa: 'செட்டியார்', religionId: hindu.id },
    { nameEn: 'Iyer (Brahmin)', nameTa: 'ஐயர்', religionId: hindu.id },
    { nameEn: 'Madapalli', nameTa: 'மடைப்பள்ளி', religionId: hindu.id },
    { nameEn: 'Nattuvar', nameTa: 'நட்டுவர்', religionId: hindu.id },
    { nameEn: 'Maravar', nameTa: 'மறவர்', religionId: hindu.id },
    { nameEn: 'Intercaste / Other', nameTa: 'கலப்புச் சாதி / ஏனையவை', religionId: hindu.id },
    { nameEn: 'Not Disclosed / Any', nameTa: 'சாதி தடையில்லை / குறிப்பிட விரும்பவில்லை', religionId: hindu.id }
  ];

  for (const caste of castes) {
    await prisma.caste.upsert({
      where: {
        religionId_nameEn: {
          religionId: caste.religionId,
          nameEn: caste.nameEn,
        }
      },
      update: {},
      create: caste,
    });
  }

  console.log('Seeding Raasis...');
  const raasis = [
    { nameEn: 'Aries', nameTa: 'மேஷம்', numeralCode: 1 },
    { nameEn: 'Taurus', nameTa: 'ரிஷபம்', numeralCode: 2 },
    { nameEn: 'Gemini', nameTa: 'மிதுனம்', numeralCode: 3 },
    { nameEn: 'Cancer', nameTa: 'கடகம்', numeralCode: 4 },
    { nameEn: 'Leo', nameTa: 'சிம்மம்', numeralCode: 5 },
    { nameEn: 'Virgo', nameTa: 'கன்னி', numeralCode: 6 },
    { nameEn: 'Libra', nameTa: 'துலாம்', numeralCode: 7 },
    { nameEn: 'Scorpio', nameTa: 'விருச்சிகம்', numeralCode: 8 },
    { nameEn: 'Sagittarius', nameTa: 'தனுசு', numeralCode: 9 },
    { nameEn: 'Capricorn', nameTa: 'மகரம்', numeralCode: 10 },
    { nameEn: 'Aquarius', nameTa: 'கும்பம்', numeralCode: 11 },
    { nameEn: 'Pisces', nameTa: 'மீனம்', numeralCode: 12 }
  ];
  for (const raasi of raasis) {
    await prisma.raasi.upsert({
      where: { nameEn: raasi.nameEn },
      update: {},
      create: raasi
    });
  }

  console.log('Seeding Nakshatrams (Stars)...');
  const stars = [
    { nameEn: 'Ashwini', nameTa: 'அசுவினி', numeralCode: 1 },
    { nameEn: 'Bharani', nameTa: 'பரணி', numeralCode: 2 },
    { nameEn: 'Krittika', nameTa: 'கார்த்திகை', numeralCode: 3 },
    { nameEn: 'Rohini', nameTa: 'ரோகிணி', numeralCode: 4 },
    { nameEn: 'Mrigashirsha', nameTa: 'மிருகசீரிடம்', numeralCode: 5 },
    { nameEn: 'Ardra', nameTa: 'திருவாதிரை', numeralCode: 6 },
    { nameEn: 'Punarvasu', nameTa: 'புனர்பூசம்', numeralCode: 7 },
    { nameEn: 'Pushya', nameTa: 'பூசம்', numeralCode: 8 },
    { nameEn: 'Ashlesha', nameTa: 'ஆயில்யம்', numeralCode: 9 },
    { nameEn: 'Magha', nameTa: 'மகம்', numeralCode: 10 },
    { nameEn: 'Purva Phalguni (Pooradam)', nameTa: 'பூரம்', numeralCode: 11 },
    { nameEn: 'Uttara Phalguni (Uthiram)', nameTa: 'உத்திரம்', numeralCode: 12 },
    { nameEn: 'Hasta', nameTa: 'அஸ்தம்', numeralCode: 13 },
    { nameEn: 'Chitra', nameTa: 'சித்திரை', numeralCode: 14 },
    { nameEn: 'Swati', nameTa: 'சுவாதி', numeralCode: 15 },
    { nameEn: 'Visakha', nameTa: 'விசாகம்', numeralCode: 16 },
    { nameEn: 'Anuradha', nameTa: 'அனுஷம்', numeralCode: 17 },
    { nameEn: 'Jyestha', nameTa: 'கேட்டை', numeralCode: 18 },
    { nameEn: 'Mula', nameTa: 'மூலம்', numeralCode: 19 },
    { nameEn: 'Purva Ashadha', nameTa: 'பூராடம்', numeralCode: 20 },
    { nameEn: 'Uttara Ashadha', nameTa: 'உத்திராடம்', numeralCode: 21 },
    { nameEn: 'Shravana', nameTa: 'திருவோணம்', numeralCode: 22 },
    { nameEn: 'Dhanishta', nameTa: 'அவிட்டம்', numeralCode: 23 },
    { nameEn: 'Shatabhisha', nameTa: 'சதயம்', numeralCode: 24 },
    { nameEn: 'Purva Bhadrapada', nameTa: 'பூரட்டாதி', numeralCode: 25 },
    { nameEn: 'Uttara Bhadrapada', nameTa: 'உத்திரட்டாதி', numeralCode: 26 },
    { nameEn: 'Revati', nameTa: 'ரேவதி', numeralCode: 27 }
  ];
  for (const star of stars) {
    await prisma.star.upsert({
      where: { nameEn: star.nameEn },
      update: {},
      create: star
    });
  }

  console.log('Seeding Priority Countries...');
  const countries = [
    { iso2: 'CA', iso3: 'CAN', nameEn: 'Canada', nameTa: 'கனடா', priority: 1 },
    { iso2: 'GB', iso3: 'GBR', nameEn: 'United Kingdom', nameTa: 'ஐக்கிய இராச்சியம்', priority: 2 },
    { iso2: 'LK', iso3: 'LKA', nameEn: 'Sri Lanka', nameTa: 'இலங்கை', priority: 3 },
    { iso2: 'IN', iso3: 'IND', nameEn: 'India', nameTa: 'இந்தியா', priority: 4 },
    { iso2: 'FR', iso3: 'FRA', nameEn: 'France', nameTa: 'பிரான்ஸ்', priority: 5 },
    { iso2: 'DE', iso3: 'DEU', nameEn: 'Germany', nameTa: 'ஜெர்மனி', priority: 6 },
    { iso2: 'CH', iso3: 'CHE', nameEn: 'Switzerland', nameTa: 'சுவிட்சர்லாந்து', priority: 7 },
    { iso2: 'AU', iso3: 'AUS', nameEn: 'Australia', nameTa: 'ஆஸ்திரேலியா', priority: 8 },
    { iso2: 'NO', iso3: 'NOR', nameEn: 'Norway', nameTa: 'நோர்வே', priority: 9 },
    { iso2: 'US', iso3: 'USA', nameEn: 'United States', nameTa: 'அமெரிக்கா', priority: 10 },
    { iso2: 'AF', iso3: 'AFG', nameEn: 'Afghanistan', nameTa: 'ஆப்கானிஸ்தான்', priority: 999 },
    { iso2: 'AL', iso3: 'ALB', nameEn: 'Albania', nameTa: 'அல்பேனியா', priority: 999 }
  ];
  for (const country of countries) {
    await prisma.country.upsert({
      where: { iso2: country.iso2 },
      update: {},
      create: country
    });
  }

  console.log('Seeding System Settings...');
  const defaultSettings = [
    { key: 'site_name', value: 'Mukurtham Matrimony' },
    { key: 'contact_number', value: '+1 (416) 555-0198' },
    { key: 'contact_email', value: 'support@mukurtham.ca' },
    { key: 'contact_address', value: 'Toronto, Ontario, Canada' },
    { key: 'meta_title', value: 'Mukurtham Matrimony - Global Sri Lankan Tamil Matches' },
    { key: 'meta_description', value: 'Find your ideal bride or groom within the global Sri Lankan Tamil diaspora. Trusted matchmaking for Canada, UK, and Sri Lanka.' },
    { key: 'meta_keywords', value: 'tamil, matrimony, srilankan tamil bride, jaffna matrimony, mukurtham' },
    { key: 'color_primary', value: '#800000' },
    { key: 'color_secondary', value: '#78350f' },
    { key: 'color_background', value: '#fafaf9' },
    { key: 'footer_copyright_text', value: '{"en": "© 2026 Mukurtham Matrimony. All Rights Reserved.", "ta": "© 2026 முகூர்த்தம் வரன் தேடல். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."}' },
    { key: 'footer_about_snippet', value: 'Mukurtham Matrimony is the world\'s leading matchmaking service for Sri Lankan and diaspora Tamil communities.' }
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
