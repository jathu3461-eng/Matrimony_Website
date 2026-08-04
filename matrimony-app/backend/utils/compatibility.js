/**
 * AI Lifestyle & Values Compatibility Calculator
 * Returns a 0-100 percentage score and per-dimension breakdown.
 *
 * Dimensions (each 0-25 points):
 *  1. Diet Compatibility
 *  2. Family Values
 *  3. Career Goals
 *  4. Relocation Willingness
 */

const DIET_COMPAT = {
  vegan:     { vegan: 25, vegetarian: 18, jain: 22, any: 12, non_vegetarian: 0 },
  vegetarian:{ vegan: 18, vegetarian: 25, jain: 22, any: 15, non_vegetarian: 5 },
  jain:      { vegan: 22, vegetarian: 22, jain: 25, any: 12, non_vegetarian: 0 },
  any:       { vegan: 12, vegetarian: 15, jain: 12, any: 25, non_vegetarian: 22 },
  non_vegetarian:{ vegan: 0, vegetarian: 5, jain: 0, any: 22, non_vegetarian: 25 },
};

const FAMILY_COMPAT = {
  traditional:{ traditional: 25, moderate: 15, liberal: 5 },
  moderate:   { traditional: 15, moderate: 25, liberal: 18 },
  liberal:    { traditional: 5,  moderate: 18, liberal: 25 },
};

const CAREER_COMPAT = {
  working:    { working: 25, home_maker: 12, open: 20 },
  home_maker: { working: 12, home_maker: 25, open: 20 },
  open:       { working: 20, home_maker: 20, open: 25 },
};

const RELOCATE_COMPAT = {
  open:          { open: 25, local_only: 15, overseas_only: 18 },
  local_only:    { open: 15, local_only: 25, overseas_only: 0  },
  overseas_only: { open: 18, local_only: 0,  overseas_only: 25 },
};

function safe(val, fallback) {
  return val || fallback;
}

function calculateLifestyleCompatibility(p1, p2) {
  const d1 = safe(p1.diet, 'any');
  const d2 = safe(p2.diet, 'any');
  const f1 = safe(p1.family_values, 'moderate');
  const f2 = safe(p2.family_values, 'moderate');
  const c1 = safe(p1.career_goals, 'open');
  const c2 = safe(p2.career_goals, 'open');
  const r1 = safe(p1.willing_to_relocate, 'open');
  const r2 = safe(p2.willing_to_relocate, 'open');

  const dietScore       = (DIET_COMPAT[d1]?.[d2] ?? 12);
  const familyScore     = (FAMILY_COMPAT[f1]?.[f2] ?? 15);
  const careerScore     = (CAREER_COMPAT[c1]?.[c2] ?? 20);
  const relocateScore   = (RELOCATE_COMPAT[r1]?.[r2] ?? 18);

  const total = dietScore + familyScore + careerScore + relocateScore; // max 100

  const dietLabel       = dietScore >= 22 ? 'Excellent' : dietScore >= 15 ? 'Good' : 'Low';
  const familyLabel     = familyScore >= 22 ? 'Excellent' : familyScore >= 15 ? 'Good' : 'Low';
  const careerLabel     = careerScore >= 22 ? 'Excellent' : careerScore >= 15 ? 'Good' : 'Low';
  const relocateLabel   = relocateScore >= 22 ? 'Excellent' : relocateScore >= 15 ? 'Good' : 'Low';

  return {
    score: total,
    grade: total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Fair' : 'Low',
    dimensions: {
      diet:      { score: dietScore,     max: 25, label: dietLabel,     a: d1, b: d2 },
      family:    { score: familyScore,   max: 25, label: familyLabel,   a: f1, b: f2 },
      career:    { score: careerScore,   max: 25, label: careerLabel,   a: c1, b: c2 },
      relocate:  { score: relocateScore, max: 25, label: relocateLabel, a: r1, b: r2 },
    },
  };
}

module.exports = { calculateLifestyleCompatibility };
