import { calculateCompatibility } from '../utils/aiMatch.utils';

// ============================================================
// aiMatch.utils.ts — Integration/Unit Tests
// ============================================================

const baseGroom = {
  id: 1,
  gender: 'M',
  dateOfBirth: new Date('1993-05-14'),
  heightFeet: 5,
  heightInches: 10,
  religionId: 1,
  casteId: 1,
  raasiId: 3,
  starId: 7,
  currentCountryId: 1,
  cityOrState: 'Toronto',
  currentCountry: { name: 'Canada' },
  religion: { nameEn: 'Hindu' },
  caste: { nameEn: 'Vellalar' },
};

const baseBride = {
  id: 2,
  gender: 'F',
  dateOfBirth: new Date('1996-08-20'),
  heightFeet: 5,
  heightInches: 4,
  religionId: 1,
  casteId: 1,
  raasiId: 5,
  starId: 8,
  currentCountryId: 1,
  cityOrState: 'Toronto',
  currentCountry: { name: 'Canada' },
  religion: { nameEn: 'Hindu' },
  caste: { nameEn: 'Vellalar' },
};

describe('AI Compatibility Score Calculator', () => {
  it('should return a score between 0 and 100', () => {
    const result = calculateCompatibility(baseGroom, baseBride);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should award location highlights when both live in same country', () => {
    const result = calculateCompatibility(baseGroom, baseBride);
    const hasLocationHighlight = result.highlights.some(h =>
      h.toLowerCase().includes('same country') || h.toLowerCase().includes('canada')
    );
    expect(hasLocationHighlight).toBe(true);
  });

  it('should award cultural highlights when religion and caste match', () => {
    const result = calculateCompatibility(baseGroom, baseBride);
    const hasCulturalHighlight = result.highlights.some(h =>
      h.toLowerCase().includes('cultural')
    );
    expect(hasCulturalHighlight).toBe(true);
  });

  it('should penalise large age differences', () => {
    const elderGroom = { ...baseGroom, dateOfBirth: new Date('1970-01-01') };
    const result = calculateCompatibility(elderGroom, baseBride);
    const hasFlag = result.flags.some(f => f.toLowerCase().includes('age'));
    expect(hasFlag).toBe(true);
  });

  it('should flag long-distance matches across different countries', () => {
    const ukBride = { ...baseBride, currentCountryId: 2, currentCountry: { name: 'United Kingdom' } };
    const result = calculateCompatibility(baseGroom, ukBride);
    const hasDistanceFlag = result.flags.some(f => f.toLowerCase().includes('distance'));
    expect(hasDistanceFlag).toBe(true);
  });

  it('should return highlight and flag arrays (never undefined)', () => {
    const result = calculateCompatibility(baseGroom, baseBride);
    expect(Array.isArray(result.highlights)).toBe(true);
    expect(Array.isArray(result.flags)).toBe(true);
  });
});
