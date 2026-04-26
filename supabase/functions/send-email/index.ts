// supabase/functions/send-email/index.ts
// Supabase Edge Function — sends transactional emails via Resend
// Deploy: supabase functions deploy send-email
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Email templates ───────────────────────────────────────────
const templates = {
  welcome: (name: string) => ({
    subject: "Welcome to RevLabs! 🎬",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="font-size: 28px; margin-bottom: 8px;">Welcome to RevLabs, ${name}!</h1>
        <p style="color: #888; line-height: 1.6;">You've just joined a creative powerhouse. We build visual engines that scale — video, photo, web, and design.</p>
        <div style="margin: 32px 0;">
          <a href="https://revlabsmediahouse.com/services" style="background: #fff; color: #000; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none;">
            Explore Services →
          </a>
        </div>
        <p style="color: #555; font-size: 12px; margin-top: 40px;">RevLabs Media House · reply to this email for support</p>
      </div>
    `,
  }),

  report_submitted: (name: string, title: string) => ({
    subject: `Report Received: "${title}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Report Submitted ✅</h1>
        <p style="color: #888;">Hi ${name}, we've received your report:</p>
        <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px; border-left: 3px solid #fff;">
          <p style="font-size: 18px; font-weight: 600;">${title}</p>
        </div>
        <p style="color: #888; line-height: 1.6;">Our team will review it and update the status shortly. You can track progress in your dashboard.</p>
        <div style="margin: 24px 0;">
          <a href="https://revlabsmediahouse.com/dashboard" style="background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none;">
            View Dashboard →
          </a>
        </div>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">RevLabs Media House</p>
      </div>
    `,
  }),

  payment_success: (name: string, data: Record<string, unknown>) => ({
    subject: "Payment Confirmed — RevLabs",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Payment Confirmed ✅</h1>
        <p style="color: #888;">Hi ${name}, your payment has been verified.</p>
        <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Service</p>
          <p style="font-weight: 600; margin: 4px 0 16px;">${data.serviceType ?? "RevLabs Service"}</p>
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
          <p style="font-weight: 600; font-size: 20px; margin: 4px 0 16px;">₹${Number(data.amount).toLocaleString("en-IN")} ${data.currency}</p>
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment ID</p>
          <p style="font-family: monospace; color: #aaa; font-size: 12px; margin: 4px 0;">${data.paymentId}</p>
        </div>
        <p style="color: #888; line-height: 1.6;">Your project is now queued. We'll be in touch with next steps.</p>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">RevLabs Media House</p>
      </div>
    `,
  }),

  status_update: (name: string, title: string, status: string) => ({
    subject: `Report Update: "${title}" is now ${status}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Report Status Updated</h1>
        <p style="color: #888;">Hi ${name}, the status of your report has changed:</p>
        <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px; border-left: 3px solid #fff;">
          <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${title}</p>
          <p style="color: #aaa; text-transform: capitalize; font-size: 14px;">Status: <strong style="color: #fff;">${status}</strong></p>
        </div>
        <div style="margin: 24px 0;">
          <a href="https://revlabsmediahouse.com/dashboard" style="background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none;">
            View in Dashboard →
          </a>
        </div>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">RevLabs Media House</p>
      </div>
    `,
  }),
};

// ── Handler ───────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, name, data } = await req.json();

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let emailContent: { subject: string; html: string } | null = null;

    switch (type) {
      case "welcome":
        emailContent = templates.welcome(name);
        break;
      case "report_submitted":
        emailContent = templates.report_submitted(name, data?.title ?? "Untitled");
        break;
      case "payment_success":
        emailContent = templates.payment_success(name, data ?? {});
        break;
      case "status_update":
        emailContent = templates.status_update(name, data?.title ?? "Report", data?.status ?? "updated");
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown email type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from:    "RevLabs <noreply@revlabsmediahouse.com>",
        to:      [to],
        subject: emailContent.subject,
        html:    emailContent.html,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.json();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Email sending failed", details: err }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await resendResponse.json();
    console.log(`Email sent [${type}] → ${to}:`, result.id);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
