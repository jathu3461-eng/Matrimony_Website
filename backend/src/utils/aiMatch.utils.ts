/**
 * Mock AI Matching Engine Utility
 * Evaluates compatibility based on age, height, location, education, occupation and horoscopes.
 * Returns a score out of 100 and a list of matching highlights.
 */

export interface CompatibilityScore {
  score: number;
  highlights: string[];
  flags: string[];
}

export const calculateCompatibility = (profileA: any, profileB: any): CompatibilityScore => {
  let score = 50; // Base score
  const highlights: string[] = [];
  const flags: string[] = [];

  // Age Difference Check
  const ageA = new Date().getFullYear() - new Date(profileA.dateOfBirth).getFullYear();
  const ageB = new Date().getFullYear() - new Date(profileB.dateOfBirth).getFullYear();
  const ageDiff = Math.abs(ageA - ageB);

  if (ageDiff <= 5) {
    score += 15;
    highlights.push('Ideal age difference');
  } else if (ageDiff > 10) {
    score -= 10;
    flags.push('Significant age difference');
  }

  // Location Match
  if (profileA.currentCountryId === profileB.currentCountryId) {
    score += 15;
    highlights.push(`Both live in ${profileA.currentCountry?.name || 'the same country'}`);
    
    if (profileA.cityOrState.toLowerCase() === profileB.cityOrState.toLowerCase()) {
      score += 5;
      highlights.push('Live in the same city/state');
    }
  } else {
    flags.push('Long distance (Different countries)');
  }

  // Religion & Caste
  if (profileA.religionId === profileB.religionId) {
    score += 10;
    if (profileA.casteId === profileB.casteId) {
      score += 10;
      highlights.push('Same cultural background');
    }
  }

  // Astrological Compatibility (Mock Matrix for Nakshatra/Raasi)
  // In a real scenario, this would use a complex 36-points (Porutham) chart
  if (profileA.starId && profileB.starId) {
    const starDiff = Math.abs(profileA.starId - profileB.starId);
    if (starDiff % 2 !== 0) {
      score += 15;
      highlights.push('Excellent astrological alignment');
    } else {
      score -= 5;
      flags.push('Average astrological compatibility');
    }
  }

  // Height Match (Assuming Profile A is Groom and Profile B is Bride)
  if (profileA.gender !== profileB.gender) {
    const groom = profileA.gender === 'M' ? profileA : profileB;
    const bride = profileA.gender === 'F' ? profileA : profileB;
    
    const groomHeightInches = (groom.heightFeet * 12) + groom.heightInches;
    const brideHeightInches = (bride.heightFeet * 12) + bride.heightInches;

    if (groomHeightInches >= brideHeightInches) {
      score += 5;
    }
  }

  // Normalize score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    highlights,
    flags,
  };
};
