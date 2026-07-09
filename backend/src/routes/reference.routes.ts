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

export default router;
