import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const signature = (await headers()).get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature/secret" }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // MVP: acknowledge events. We'll expand to update Order status later.
  if (event.type === "checkout.session.completed") {
    // noop for now
  }

  return NextResponse.json({ received: true })
}


