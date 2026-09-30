import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const draftReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().max(200), message: z.string().max(5000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You write short, warm, professional customer replies for VLXR, a premium streetwear brand from Agra. Facts: all tees MRP ₹2,499, drop price ₹1,999. UPI only, no COD. Delivery 8-9 working days, free in Agra (282001-282010). 7-day size exchange, no refunds on LIMITED pieces. WhatsApp +91 8817830829. Reply in the same language the customer used (Hindi/Hinglish/English). Sign off as 'Team VLXR'. Do not invent order details.",
          },
          { role: "user", content: `Customer ${data.name} wrote:\n${data.message}\n\nDraft a reply.` },
        ],
      }),
    });
    if (!res.ok) throw new Error(res.status === 429 ? "Too many requests, try again shortly." : res.status === 402 ? "AI credits exhausted." : "Could not draft reply.");
    const j = await res.json();
    return { reply: String(j.choices?.[0]?.message?.content ?? "") };
  });
