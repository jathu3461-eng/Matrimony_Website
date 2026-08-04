// 10-Porutham Horoscope Matching Score Calculator
// Based on traditional South-Indian / Sri Lankan Tamil astrology rules

const STARS = [
  "", "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Visakha", "Anuradha", "Jyestha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const RAASIS = [
  "", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Ganam classification: 1 = Deva, 2 = Manusha, 3 = Rakshasa
const GANAMS = {
  1: 1, 5: 1, 7: 1, 8: 1, 13: 1, 15: 1, 17: 1, 22: 1, 27: 1, // Deva
  2: 2, 4: 2, 6: 2, 11: 2, 12: 2, 20: 2, 21: 2, 25: 2, 26: 2, // Manusha
  3: 3, 9: 3, 10: 3, 14: 3, 16: 3, 18: 3, 19: 3, 23: 3, 24: 3  // Rakshasa
};

const GANAM_NAMES = { 1: "Deva", 2: "Manusha", 3: "Rakshasa" };

// Yoni animals
const YONI_ANIMALS = {
  1: "Horse", 24: "Horse",
  2: "Elephant", 27: "Elephant",
  3: "Sheep", 8: "Sheep",
  4: "Snake", 5: "Snake",
  6: "Dog", 19: "Dog",
  7: "Cat", 9: "Cat",
  10: "Rat", 11: "Rat",
  12: "Cow", 26: "Cow",
  13: "Buffalo", 15: "Buffalo",
  14: "Tiger", 16: "Tiger",
  17: "Deer", 18: "Deer",
  20: "Monkey", 22: "Monkey",
  21: "Mongoose",
  23: "Lion", 25: "Lion"
};

// Enemy animal pairs
const ANIMAL_ENEMIES = [
  ["Snake", "Mongoose"],
  ["Cat", "Rat"],
  ["Elephant", "Lion"],
  ["Horse", "Buffalo"],
  ["Cow", "Tiger"],
  ["Dog", "Deer"],
  ["Monkey", "Sheep"]
];

// Rajju classification (1-5)
const RAJJUS = {
  // Padha (Foot)
  1: 1, 9: 1, 10: 1, 18: 1, 19: 1, 27: 1,
  // Ooru (Thigh)
  2: 2, 8: 2, 11: 2, 17: 2, 20: 2, 26: 2,
  // Nabhi (Navel)
  3: 3, 7: 3, 12: 3, 16: 3, 21: 3, 25: 3,
  // Kanda (Neck)
  4: 4, 6: 4, 13: 4, 15: 4, 22: 4, 24: 4,
  // Siras (Head)
  5: 5, 14: 5, 23: 5
};

const RAJJU_NAMES = {
  1: "Padha (Foot)",
  2: "Ooru (Thigh)",
  3: "Nabhi (Navel)",
  4: "Kanda (Neck)",
  5: "Siras (Head)"
};

// Vedhai incompatibility pairs (indices 1-27)
const VEDHAI_PAIRS = [
  [1, 18], [2, 17], [3, 16], [4, 15], [6, 22], [7, 21], [8, 20], [9, 19], [10, 27], [11, 26], [12, 25], [13, 24],
  [5, 14], [14, 23], [5, 23] // Siras loop
];

// Raasi Lord mapping
const RAASI_LORDS = {
  1: "Mars", 8: "Mars",
  2: "Venus", 7: "Venus",
  3: "Mercury", 6: "Mercury",
  4: "Moon",
  5: "Sun",
  9: "Jupiter", 12: "Jupiter",
  10: "Saturn", 11: "Saturn"
};

// Friendship lookup: friendly/neutral/enemy
const LORD_FRIENDSHIPS = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"], neutrals: ["Mercury"] },
  Moon: { friends: ["Sun", "Mercury"], enemies: [], neutrals: ["Mars", "Jupiter", "Venus", "Saturn"] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"], neutrals: ["Venus", "Saturn"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"], neutrals: ["Mars", "Jupiter", "Saturn"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"], neutrals: ["Saturn"] },
  Venus: { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"], neutrals: ["Mars", "Jupiter"] },
  Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"], neutrals: ["Jupiter"] }
};

// Vasya mapping
const VASYA_MAP = {
  1: [5, 8],
  2: [4, 7],
  3: [6],
  4: [8, 9],
  5: [7],
  6: [3, 12],
  7: [6, 10],
  8: [4],
  9: [12],
  10: [1, 11],
  11: [1],
  12: [10]
};

function calculate10Porutham(brideStar, brideRaasi, groomStar, groomRaasi) {
  // Normalize inputs to integers
  const bStar = parseInt(brideStar);
  const bRaasi = parseInt(brideRaasi);
  const gStar = parseInt(groomStar);
  const gRaasi = parseInt(groomRaasi);

  if (!bStar || !bRaasi || !gStar || !gRaasi) {
    return { error: "Invalid astrology values provided" };
  }

  const results = {};
  let score = 0;

  // Star distance
  const starDist = ((gStar - bStar + 27) % 27) + 1;
  const raasiDist = ((gRaasi - bRaasi + 12) % 12) + 1;

  // 1. Dinam
  const dinamRem = starDist % 9;
  const isDinamMatched = [2, 4, 6, 8, 0].includes(dinamRem) || starDist === 12 || starDist === 27;
  results.dinam = {
    matched: isDinamMatched,
    points: isDinamMatched ? 1 : 0,
    desc: isDinamMatched
      ? "Dinam Matches: Good health, prosperity, and longevity."
      : "Dinam does not match. Traditional indicators warn of health challenges."
  };
  if (isDinamMatched) score++;

  // 2. Ganam
  const bGanam = GANAMS[bStar];
  const gGanam = GANAMS[gStar];
  let isGanamMatched = false;
  if (bGanam === gGanam) {
    isGanamMatched = true;
  } else if ((bGanam === 1 && gGanam === 2) || (bGanam === 2 && gGanam === 1)) {
    isGanamMatched = true; // Deva & Manusha match
  } else if (bGanam === 2 && gGanam === 3) {
    isGanamMatched = false; // Manusha & Rakshasa is not ideal
  }
  results.ganam = {
    matched: isGanamMatched,
    points: isGanamMatched ? 1 : 0,
    desc: `Ganam Compatibility: Bride is ${GANAM_NAMES[bGanam]}, Groom is ${GANAM_NAMES[gGanam]}. ${
      isGanamMatched ? "Matched. Balanced temperaments." : "Not Matched. Potential personality clashes."
    }`
  };
  if (isGanamMatched) score++;

  // 3. Mahendram
  const isMahendramMatched = [4, 7, 10, 13, 16, 19, 22, 25].includes(starDist);
  results.mahendram = {
    matched: isMahendramMatched,
    points: isMahendramMatched ? 1 : 0,
    desc: isMahendramMatched
      ? "Mahendram Matches: Assures children, well-being, and financial growth."
      : "Mahendram does not match."
  };
  if (isMahendramMatched) score++;

  // 4. Stree Deergham
  const isStreeDeerghamMatched = starDist > 13;
  results.streeDeergham = {
    matched: isStreeDeerghamMatched,
    points: isStreeDeerghamMatched ? 1 : 0,
    desc: isStreeDeerghamMatched
      ? "Stree Deergham Matches: Long life, wealth, and continuous prosperity for the bride."
      : "Stree Deergham does not match (Distance between stars is less than or equal to 13)."
  };
  if (isStreeDeerghamMatched) score++;

  // 5. Yoni
  const bAnimal = YONI_ANIMALS[bStar];
  const gAnimal = YONI_ANIMALS[gStar];
  let isYoniMatched = true;
  let yoniDesc = "Yoni Matches: Excellent physical and sexual compatibility.";
  if (bAnimal === gAnimal) {
    isYoniMatched = true;
    yoniDesc = `Yoni Matches: Perfect physical compatibility (Same animal: ${bAnimal}).`;
  } else {
    // Check enemies
    const isEnemy = ANIMAL_ENEMIES.some(
      ([e1, e2]) => (bAnimal === e1 && gAnimal === e2) || (bAnimal === e2 && gAnimal === e1)
    );
    if (isEnemy) {
      isYoniMatched = false;
      yoniDesc = `Yoni Mismatch: Hostile animal match (${bAnimal} vs ${gAnimal}). Leads to marital friction.`;
    } else {
      yoniDesc = `Yoni Matches: Friendly physical compatibility (${bAnimal} & ${gAnimal}).`;
    }
  }
  results.yoni = {
    matched: isYoniMatched,
    points: isYoniMatched ? 1 : 0,
    desc: yoniDesc
  };
  if (isYoniMatched) score++;

  // 6. Raasi
  const isRaasiMatched = [1, 7, 9, 10, 11, 12].includes(raasiDist) && raasiDist !== 6 && raasiDist !== 8;
  results.raasi = {
    matched: isRaasiMatched,
    points: isRaasiMatched ? 1 : 0,
    desc: isRaasiMatched
      ? `Raasi Matches: Happy relationship, family expansion, and mutual affinity (Distance: ${raasiDist}).`
      : `Raasi does not match. Shashtashtakam (6-8) or Dwirdwadasam (2-12) relationship detected (Distance: ${raasiDist}).`
  };
  if (isRaasiMatched) score++;

  // 7. Raasi Adhipathi
  const bLord = RAASI_LORDS[bRaasi];
  const gLord = RAASI_LORDS[gRaasi];
  let isLordMatched = false;
  if (bLord === gLord) {
    isLordMatched = true;
  } else {
    // Check if friendly/neutral
    const bRelations = LORD_FRIENDSHIPS[bLord];
    const gRelations = LORD_FRIENDSHIPS[gLord];
    const bFriendlyToG = bRelations.friends.includes(gLord) || bRelations.neutrals.includes(gLord);
    const gFriendlyToB = gRelations.friends.includes(bLord) || gRelations.neutrals.includes(bLord);
    isLordMatched = bFriendlyToG && gFriendlyToB;
  }
  results.raasiAdhipathi = {
    matched: isLordMatched,
    points: isLordMatched ? 1 : 0,
    desc: `Raasi Adhipathi Compatibility: Bride's Lord (${bLord}) & Groom's Lord (${gLord}). ${
      isLordMatched ? "Friendly/Neutral match." : "Incompatible ruling planets."
    }`
  };
  if (isLordMatched) score++;

  // 8. Vasya
  const bVasya = VASYA_MAP[bRaasi] || [];
  const gVasya = VASYA_MAP[gRaasi] || [];
  const isVasyaMatched = bVasya.includes(gRaasi) || gVasya.includes(bRaasi);
  results.vasya = {
    matched: isVasyaMatched,
    points: isVasyaMatched ? 1 : 0,
    desc: isVasyaMatched
      ? "Vasya Matches: Strong psychological attraction and deep mutual affection."
      : "Vasya does not match."
  };
  if (isVasyaMatched) score++;

  // 9. Rajju
  const bRajju = RAJJUS[bStar];
  const gRajju = RAJJUS[gStar];
  const isRajjuMatched = bRajju !== gRajju;
  results.rajju = {
    matched: isRajjuMatched,
    points: isRajjuMatched ? 1 : 0,
    desc: isRajjuMatched
      ? `Rajju Matches: Bride is ${RAJJU_NAMES[bRajju]}, Groom is ${RAJJU_NAMES[gRajju]}.`
      : `Rajju Mismatch (Rajju Dosham): Both stars are in the same Rajju: ${RAJJU_NAMES[bRajju]}. This is traditionally considered unfavorable for marital longevity.`
  };
  if (isRajjuMatched) score++;

  // 10. Vedhai
  const isVedhaiMatched = !VEDHAI_PAIRS.some(
    ([s1, s2]) => (bStar === s1 && gStar === s2) || (bStar === s2 && gStar === s1)
  );
  results.vedhai = {
    matched: isVedhaiMatched,
    points: isVedhaiMatched ? 1 : 0,
    desc: isVedhaiMatched
      ? "Vedhai Matches: Freedom from afflictions and negative forces."
      : "Vedhai Mismatch: Afflicted match. Traditional sources advise avoiding due to obstacles."
  };
  if (isVedhaiMatched) score++;

  return {
    score,
    results
  };
}

module.exports = {
  calculate10Porutham,
  STARS,
  RAASIS
};
