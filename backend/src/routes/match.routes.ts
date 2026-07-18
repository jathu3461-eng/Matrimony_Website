import { Router } from 'express';
import { getMatches } from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Secure all match routes
router.use(authenticate);

router.get('/', getMatches);

export default router;
