import { Router } from 'express';
import prisma from '../config/db';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

/**
 * @route   GET /api/v1/reference/religions
 * @desc    Fetch all religions with Tamil and English names
 * @access  Public
 */
router.get('/religions', apiRateLimiter, async (_, res: Response) => {
  const religions = await prisma.religion.findMany({ orderBy: { nameEn: 'asc' } });
  res.json({ success: true, data: religions });
});

/**
 * @route   GET /api/v1/reference/castes
 * @desc    Fetch castes optionally filtered by religion
 * @access  Public
 */
router.get('/castes', apiRateLimiter, async (req, res: Response) => {
  const religionId = req.query.religionId ? parseInt(req.query.religionId as string) : undefined;
  const castes = await prisma.caste.findMany({
    where: religionId ? { religionId } : {},
    orderBy: { nameEn: 'asc' },
    include: { religion: { select: { nameEn: true, nameTa: true } } },
  });
  res.json({ success: true, data: castes });
});

/**
 * @route   GET /api/v1/reference/raasis
 * @desc    Fetch all 12 Raasi signs
 * @access  Public
 */
router.get('/raasis', apiRateLimiter, async (_, res: Response) => {
  const raasis = await prisma.raasi.findMany({ orderBy: { id: 'asc' } });
  res.json({ success: true, data: raasis });
});

/**
 * @route   GET /api/v1/reference/stars
 * @desc    Fetch all 27 Nakshatram stars
 * @access  Public
 */
router.get('/stars', apiRateLimiter, async (_, res: Response) => {
  const stars = await prisma.star.findMany({ orderBy: { id: 'asc' } });
  res.json({ success: true, data: stars });
});

/**
 * @route   GET /api/v1/reference/countries
 * @desc    Fetch all countries sorted by diaspora priority, then alphabetically
 * @access  Public
 */
router.get('/countries', apiRateLimiter, async (_, res: Response) => {
  const countries = await prisma.country.findMany({
    orderBy: [{ priority: 'asc' }, { nameEn: 'asc' }],
  });
  res.json({ success: true, data: countries });
});

/**
 * @route   GET /api/v1/reference/settings
 * @desc    Fetch public site settings (name, colors, SEO meta, footer)
 * @access  Public
 */
router.get('/settings', apiRateLimiter, async (_, res: Response) => {
  const settings = await prisma.setting.findMany();
  // Convert list to key-value object for easy frontend consumption
  const settingsMap = settings.reduce(
    (acc: Record<string, string>, setting: { key: string; value: string }) => ({
      ...acc,
      [setting.key]: setting.value,
    }),
    {} as Record<string, string>
  );
  res.json({ success: true, data: settingsMap });
});

/**
 * @route   GET /api/v1/reference/menu-items
 * @desc    Fetch active dynamic navigation menu items in display order
 * @access  Public
 */
router.get('/menu-items', apiRateLimiter, async (_, res: Response) => {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  res.json({ success: true, data: items });
});

/**
 * @route   GET /api/v1/reference/states?countryId=:id
 * @desc    Fetch states/provinces for a given country
 * @access  Public
 */
router.get('/states', apiRateLimiter, async (req, res: Response) => {
  const countryId = parseInt(req.query.countryId as string);
  if (!countryId || isNaN(countryId)) {
    res.status(400).json({ success: false, error: { message: 'countryId is required' } });
    return;
  }
  const states = await prisma.state.findMany({
    where: { countryId },
    orderBy: { nameEn: 'asc' },
    select: { id: true, nameEn: true, nameTa: true, countryId: true },
  });
  res.json({ success: true, data: states });
});

/**
 * @route   GET /api/v1/reference/cities?stateId=:id
 * @desc    Fetch cities for a given state
 * @access  Public
 */
router.get('/cities', apiRateLimiter, async (req, res: Response) => {
  const stateId = parseInt(req.query.stateId as string);
  if (!stateId || isNaN(stateId)) {
    res.status(400).json({ success: false, error: { message: 'stateId is required' } });
    return;
  }
  const cities = await prisma.city.findMany({
    where: { stateId },
    orderBy: { nameEn: 'asc' },
    select: { id: true, nameEn: true, nameTa: true, stateId: true },
  });
  res.json({ success: true, data: cities });
});

/**
 * @route   GET /api/v1/reference/mother-tongues
 * @desc    Fetch all mother tongues
 * @access  Public
 */
router.get('/mother-tongues', apiRateLimiter, async (_, res: Response) => {
  const tongues = await prisma.motherTongue.findMany({ orderBy: { nameEn: 'asc' } });
  res.json({ success: true, data: tongues });
});

/**
 * @route   GET /api/v1/reference/education-categories
 * @desc    Fetch all education categories
 * @access  Public
 */
router.get('/education-categories', apiRateLimiter, async (_, res: Response) => {
  const cats = await prisma.educationCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ success: true, data: cats });
});

/**
 * @route   GET /api/v1/reference/occupation-categories
 * @desc    Fetch all occupation categories with details
 * @access  Public
 */
router.get('/occupation-categories', apiRateLimiter, async (_, res: Response) => {
  const cats = await prisma.occupationCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { details: { orderBy: { nameEn: 'asc' } } },
  });
  res.json({ success: true, data: cats });
});

/**
 * @route   GET /api/v1/reference/all
 * @desc    Return all static reference data needed for the profile wizard in one call
 * @access  Public
 */
router.get('/all', apiRateLimiter, async (_, res: Response) => {
  const [religions, raasis, stars, countries, motherTongues, educationCategories, occupationCategories] =
    await Promise.all([
      prisma.religion.findMany({ orderBy: { nameEn: 'asc' } }),
      prisma.raasi.findMany({ orderBy: { numeralCode: 'asc' } }),
      prisma.star.findMany({ orderBy: { numeralCode: 'asc' } }),
      prisma.country.findMany({ orderBy: [{ priority: 'asc' }, { nameEn: 'asc' }] }),
      prisma.motherTongue.findMany({ orderBy: { nameEn: 'asc' } }),
      prisma.educationCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.occupationCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { details: { orderBy: { nameEn: 'asc' } } },
      }),
    ]);
  res.json({ success: true, data: { religions, raasis, stars, countries, motherTongues, educationCategories, occupationCategories } });
});

export default router;

