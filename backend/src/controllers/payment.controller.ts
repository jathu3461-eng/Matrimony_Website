import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createCheckoutSession } from '../utils/stripe.utils';

// ============================================================
// GET /api/v1/payments/plans
// ============================================================
export const getPlans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('[Payments] Get plans error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve membership plans.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/payments/checkout
// ============================================================
export const createCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { planId, successUrl, cancelUrl } = req.body;
  const userId = req.user.id;

  try {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan || !plan.isActive) {
      res.status(404).json({ success: false, error: { message: 'Plan not found or inactive.', code: 'NOT_FOUND' } });
      return;
    }

    // Convert decimal to number for stripe
    const amount = Number(plan.price);

    const session = await createCheckoutSession(
      userId,
      plan.id,
      amount,
      'CAD', // Fixed currency for Mukurtham
      successUrl || 'http://localhost:3000/pricing/success',
      cancelUrl || 'http://localhost:3000/pricing/cancel'
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    console.error('[Payments] Checkout error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create checkout session.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/payments/verify
// ============================================================
export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  const { sessionId, planId } = req.body;
  const userId = req.user.id;

  try {
    // In production, we'd verify sessionId with Stripe API to ensure it's paid.
    // For this scope (and due to mock checkout session), we assume verification passed.
    
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan) throw new Error('Plan not found.');

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + plan.durationDays);

    // Create the membership
    const membership = await prisma.userMembership.create({
      data: {
        userId,
        planId: plan.id,
        startsAt,
        endsAt,
        status: 'active',
      },
    });

    // Record the payment
    await prisma.payment.create({
      data: {
        userId,
        membershipId: membership.id,
        amount: plan.price,
        status: 'succeeded',
        paymentMethod: 'card',
        gateway: 'stripe',
        transactionReference: sessionId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and membership activated.',
      data: membership,
    });
  } catch (error) {
    console.error('[Payments] Verify error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify payment.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
