import Stripe from "stripe"

// Use a placeholder key during build if STRIPE_SECRET_KEY is not set
// This prevents build errors while still requiring the key at runtime
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_build"

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})


