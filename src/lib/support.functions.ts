import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are "VLXR Care", the customer support assistant for VLXR — a premium oversized streetwear brand from Agra, India.
Facts: All tees MRP ₹2,499, Drop Price ₹1,999 (save ₹500). Payment: UPI/online only, NO cash on delivery.
Delivery: 8-9 working days across India; FREE delivery in Agra (pincodes 282001-282010).
Exchange: 7-day size exchange. No refunds on LIMITED pieces. Fabric: 240GSM heavyweight cotton, oversized fit, cold wash only.
Customers can track orders on the "Track Order" page using order ID + phone number.
For anything you cannot solve (order problems, damaged items, payments), ask them to WhatsApp +91 8817830829 or use the Contact page.
Never invent order statuses or details. Reply in the customer's language (Hindi / Hinglish / English). Keep replies short (under 80 words), friendly and confident.`;

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(30),
});

export const supportChat = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });
    if (!res.ok || !res.body) {
      const msg =
        res.status === 429 ? "Bahut saare messages aa rahe hain — thodi der baad try kijiye."
        : res.status === 402 || res.status === 403 ? "Chat support abhi available nahi hai. WhatsApp karein: +91 8817830829."
        : "Kuch gadbad ho gayi. WhatsApp karein: +91 8817830829.";
      return { reply: "", error: msg };
    }
    // Consume the SSE stream server-side and return the final text.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch { /* ignore partial */ }
      }
    }
    if (!text.trim()) return { reply: "", error: "Jawab nahi mil paya. WhatsApp karein: +91 8817830829." };
    return { reply: text.trim(), error: null };
  });
