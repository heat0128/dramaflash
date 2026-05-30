import Stripe from 'stripe'

// Falls back to a placeholder so the app can build/run before payments are configured.
// Real charges only work once STRIPE_SECRET_KEY is set in the environment.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_placeholder_not_configured',
  {
    apiVersion: '2024-09-30.acacia',
    typescript: true
  }
)
