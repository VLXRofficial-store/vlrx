import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getProduct, ALL_SIZES } from "./products";

const orderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().trim().email().max(255),
  address: z.string().trim().min(1).max(300),
  area: z.string().trim().max(150),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  payment_method: z.enum(["upi", "card", "netbanking"]),
  items: z
    .array(z.object({ slug: z.string().max(100), size: z.string().max(5), qty: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const items = data.items.map((i) => {
      const p = getProduct(i.slug);
      if (!p || !ALL_SIZES.includes(i.size)) throw new Error("Invalid item");
      return { slug: p.slug, name: p.name, size: i.size, qty: i.qty, price: p.price };
    });
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order_code = `VLXR${Math.floor(100000 + Math.random() * 900000)}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").insert({ ...data, items, subtotal, order_code });
    if (error) {
      console.error(error);
      throw new Error("Could not place order");
    }
    return { order_code };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ code: z.string().trim().toUpperCase().max(20), phone: z.string().regex(/^\d{10}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("orders")
      .select("order_code, status, created_at, updated_at, items, subtotal, city")
      .eq("order_code", data.code)
      .eq("phone", data.phone)
      .maybeSingle();
    return row ?? null;
  });

// Makes the caller admin ONLY if no admin exists yet (first-time setup).
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false };
    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    return { ok: true };
  });
