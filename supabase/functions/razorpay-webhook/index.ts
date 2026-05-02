// supabase/functions/razorpay-webhook/index.ts
// Supabase Edge Function — verifies Razorpay webhook and syncs payment state.
// Deploy: supabase functions deploy razorpay-webhook
// Register URL in Razorpay Dashboard → Settings → Webhooks:
//   https://raqfhhrytwregsuwwirk.supabase.co/functions/v1/razorpay-webhook
// Events to enable: payment.captured, payment.failed, refund.processed

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-razorpay-signature, content-type",
};

/**
 * Verifies Razorpay HMAC SHA256 webhook signature.
 * Never trust payment success without this check.
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

/**
 * Insert an audit log entry (best-effort, don't fail webhook on audit errors).
 */
async function insertAuditLog(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  entityId: string,
  userId: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      event_type:  eventType,
      entity_type: "payment",
      entity_id:   entityId,
      user_id:     userId,
      metadata,
    });
  } catch (e) {
    console.error("[audit_log] insert failed:", e);
  }
}

/**
 * Insert an in-app notification for a user (best-effort).
 */
async function insertNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id:    userId,
      type,
      title,
      message,
      related_id: relatedId,
    });
  } catch (e) {
    console.error("[notifications] insert failed:", e);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret    = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

  // ── 1. Verify signature ──────────────────────────────────────
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isValid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    console.error("Invalid Razorpay webhook signature — possible spoofing attempt");
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

  // ── 2. Service role client (bypasses RLS for webhook operations) ──
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = event.event as string;
  const payload   = (event.payload as Record<string, unknown>);

  console.log(`[webhook] Received event: ${eventType}`);

  // ── 3. payment.captured → mark as paid ──────────────────────
  if (eventType === "payment.captured") {
    const paymentEntity = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
    const orderId   = paymentEntity.order_id as string;
    const paymentId = paymentEntity.id as string;

    // Update payment record
    const { data: updatedRows, error: updateError } = await supabase
      .from("payments")
      .update({
        status:              "paid",
        provider_payment_id: paymentId,
        updated_at:          new Date().toISOString(),
      })
      .eq("provider_order_id", orderId)
      .select("*, profiles(id, full_name, email)");

    if (updateError) {
      console.error("[payment.captured] DB update error:", updateError.message);
      return new Response(JSON.stringify({ error: "DB update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payment = updatedRows?.[0];
    const userId  = payment?.user_id as string | null;

    // Audit log
    await insertAuditLog(supabase, "payment_captured", payment?.id ?? orderId, userId, {
      orderId, paymentId,
      amount:   paymentEntity.amount,
      currency: paymentEntity.currency,
    });

    // In-app notification for client
    if (userId) {
      await insertNotification(
        supabase,
        userId,
        "payment_success",
        "Payment Successful!",
        `Your payment of $${Number(payment?.amount ?? 0).toLocaleString()} for "${payment?.service_type || 'RevLabs Service'}" has been confirmed.`,
        payment?.id ?? orderId
      );
    }

    // Email notification
    if (payment?.profiles) {
      const profiles = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles;
      if (profiles?.email) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type:  "payment_success",
            to:    profiles.email,
            name:  profiles.full_name || "there",
            data: {
              amount:      payment.amount,
              currency:    payment.currency,
              serviceType: payment.service_type,
              paymentId,
            },
          }),
        }).catch(e => console.error("[email] send failed:", e));
      }
    }

    console.log(`[payment.captured] ✓ Payment ${paymentId} for order ${orderId} marked as paid`);
  }

  // ── 4. payment.failed ────────────────────────────────────────
  if (eventType === "payment.failed") {
    const paymentEntity = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
    const orderId = paymentEntity.order_id as string;

    const { data: updatedRows } = await supabase
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("provider_order_id", orderId)
      .select("id, user_id, amount, service_type");

    const payment = updatedRows?.[0];

    await insertAuditLog(supabase, "payment_failed", payment?.id ?? orderId, payment?.user_id ?? null, {
      orderId,
      errorCode:        paymentEntity.error_code,
      errorDescription: paymentEntity.error_description,
    });

    if (payment?.user_id) {
      await insertNotification(
        supabase,
        payment.user_id,
        "payment_failed",
        "Payment Failed",
        `Your payment for "${payment.service_type || 'RevLabs Service'}" could not be processed. Please try again.`,
        payment.id
      );
    }

    console.log(`[payment.failed] Payment failed for order ${orderId}`);
  }

  // ── 5. refund.processed ──────────────────────────────────────
  if (eventType === "refund.processed") {
    const refundEntity  = (payload.refund as Record<string, unknown>).entity as Record<string, unknown>;
    const paymentId     = refundEntity.payment_id as string;

    const { data: updatedRows } = await supabase
      .from("payments")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("provider_payment_id", paymentId)
      .select("id, user_id, amount, service_type");

    const payment = updatedRows?.[0];

    await insertAuditLog(supabase, "refund_processed", payment?.id ?? paymentId, payment?.user_id ?? null, {
      paymentId,
      refundId:     refundEntity.id,
      refundAmount: refundEntity.amount,
    });

    if (payment?.user_id) {
      await insertNotification(
        supabase,
        payment.user_id,
        "refund_processed",
        "Refund Processed",
        `A refund for "${ payment.service_type || 'RevLabs Service'}" has been processed successfully.`,
        payment.id
      );
    }

    console.log(`[refund.processed] Refund for payment ${paymentId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status:  200,
    headers: { "Content-Type": "application/json" },
  });
});
