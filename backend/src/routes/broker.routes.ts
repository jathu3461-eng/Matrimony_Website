import { Router } from 'express';
import {
  getBrokerDashboard,
  getBrokerClients,
  getBrokerMatches,
  getBrokerInterests,
  getBrokerAnalytics,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBrokerProfile,
  updateBrokerProfile,
} from '../controllers/broker.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All broker routes require authentication and broker role
const brokerAuth = [authenticate, requireRole(['broker', 'admin'])];

// Profile / Agency info
router.get('/me', ...brokerAuth, apiRateLimiter, getBrokerProfile);
router.put('/me', ...brokerAuth, apiRateLimiter, updateBrokerProfile);

// Dashboard
router.get('/dashboard', ...brokerAuth, apiRateLimiter, getBrokerDashboard);

// Clients / Profiles managed
router.get('/clients', ...brokerAuth, apiRateLimiter, getBrokerClients);

// Matches / Interests
router.get('/matches', ...brokerAuth, apiRateLimiter, getBrokerMatches);
router.get('/interests', ...brokerAuth, apiRateLimiter, getBrokerInterests);

// Analytics
router.get('/analytics', ...brokerAuth, apiRateLimiter, getBrokerAnalytics);

// Appointments
router.get('/appointments', ...brokerAuth, apiRateLimiter, getAppointments);
router.post('/appointments', ...brokerAuth, apiRateLimiter, createAppointment);
router.put('/appointments/:id', ...brokerAuth, apiRateLimiter, updateAppointment);
router.delete('/appointments/:id', ...brokerAuth, apiRateLimiter, deleteAppointment);

export default router;
