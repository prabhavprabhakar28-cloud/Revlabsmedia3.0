// supabase/functions/razorpay-webhook/index.ts
// Supabase Edge Function — verifies Razorpay webhook signature and updates payment status
// Deploy: supabase functions deploy razorpay-webhook
// Register this URL in Razorpay Dashboard → Webhooks

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-razorpay-signature, content-type",
};

/**
 * Verifies Razorpay HMAC SHA256 signature.
 * DO NOT trust payment success without this check.
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === signature;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret    = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

  // ── 1. Verify signature ───────────────────────────────────
  const isValid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    console.error("Invalid Razorpay webhook signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Use service role client (bypasses RLS for webhook) ─
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = event.event as string;
  const payload   = (event.payload as Record<string, unknown>);

  // ── 3. Handle payment.captured (success) ─────────────────
  if (eventType === "payment.captured") {
    const paymentEntity = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
    const orderId       = paymentEntity.order_id as string;
    const paymentId     = paymentEntity.id as string;

    const { error } = await supabase
      .from("payments")
      .update({
        status:             "paid",
        provider_payment_id: paymentId,
        updated_at:         new Date().toISOString(),
      })
      .eq("provider_order_id", orderId);

    if (error) {
      console.error("DB update error:", error);
      return new Response(JSON.stringify({ error: "DB update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch payment + user for email notification
    const { data: payment } = await supabase
      .from("payments")
      .select("*, profiles(full_name, email)")
      .eq("provider_order_id", orderId)
      .single();

    if (payment?.profiles) {
      // Call email Edge Function
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          type:  "payment_success",
          to:    payment.profiles.email,
          name:  payment.profiles.full_name,
          data: {
            amount:      payment.amount,
            currency:    payment.currency,
            serviceType: payment.service_type,
            paymentId,
          },
        }),
      });
    }

    console.log(`Payment captured: ${paymentId} for order ${orderId}`);
  }

  // ── 4. Handle payment.failed ──────────────────────────────
  if (eventType === "payment.failed") {
    const paymentEntity = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
    const orderId = paymentEntity.order_id as string;

    await supabase
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("provider_order_id", orderId);

    console.log(`Payment failed for order ${orderId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
