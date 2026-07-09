import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia' as any,
});

/**
 * Create a mock checkout session for testing environments when real keys aren't provided.
 */
export const createCheckoutSession = async (
  userId: number,
  planId: number,
  amount: number,
  currency: string,
  successUrl: string,
  cancelUrl: string
) => {
  // Check if we are running with a mock key
  if (STRIPE_SECRET_KEY.includes('mock')) {
    console.log('[Stripe Mock] Creating mock checkout session');
    return {
      id: `cs_test_mock_${Date.now()}`,
      url: `${successUrl}?session_id=cs_test_mock_${Date.now()}`, // Auto-redirect to success for dev
    };
  }

  // Create real Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'Mukurtham Premium Membership',
            description: `Plan ID: ${planId}`,
          },
          unit_amount: amount * 100, // Stripe expects amounts in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      planId: planId.toString(),
    },
  });

  return session;
};
