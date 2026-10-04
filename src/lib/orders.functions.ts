import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  discount_code: z.string().trim().toUpperCase().max(30).optional(),
});

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
async function evalDiscount(admin: Admin, code: string, subtotal: number) {
  const { data: d } = await admin.from("discount_codes").select("*").eq("code", code).maybeSingle();
  if (!d || !d.active) return { ok: false as const, error: "Invalid or inactive code" };
  if (d.expires_at && new Date(d.expires_at) < new Date()) return { ok: false as const, error: "This code has expired" };
  if (d.max_uses != null && d.used_count >= d.max_uses) return { ok: false as const, error: "This code has reached its usage limit" };
  if (subtotal < d.min_order) return { ok: false as const, error: `Minimum order ₹${d.min_order} for this code` };
  const amount = Math.min(subtotal, d.kind === "percent" ? Math.round((subtotal * d.value) / 100) : d.value);
  return { ok: true as const, amount, id: d.id, used: d.used_count };
}

export const checkDiscount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().toUpperCase().min(1).max(30), subtotal: z.number().int().min(0) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await evalDiscount(supabaseAdmin, data.code, data.subtotal);
    return r.ok ? { ok: true, amount: r.amount, error: null } : { ok: false, amount: 0, error: r.error };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("products")
      .select("slug,name,price,size_stock,status")
      .in("slug", data.items.map((i) => i.slug));
    const items = data.items.map((i) => {
      const p = rows?.find((r) => r.slug === i.slug && r.status === "active");
      const stock = (p?.size_stock ?? {}) as Record<string, number>;
      if (!p || (stock[i.size] ?? 0) < i.qty) throw new Error(`Sorry, ${p?.name ?? "item"} size ${i.size} is out of stock`);
      return { slug: p.slug, name: p.name, size: i.size, qty: i.qty, price: p.price };
    });
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order_code = `VLXR${Math.floor(100000 + Math.random() * 900000)}`;
    const { discount_code, ...rest } = data;
    let discount_amount = 0;
    if (discount_code) {
      const r = await evalDiscount(supabaseAdmin, discount_code, subtotal);
      if (!r.ok) throw new Error(r.error);
      discount_amount = r.amount;
      await supabaseAdmin.from("discount_codes").update({ used_count: r.used + 1 }).eq("id", r.id);
    }
    const { error } = await supabaseAdmin.from("orders").insert({
      ...rest, items, subtotal: subtotal - discount_amount, order_code,
      discount_code: discount_code ?? null, discount_amount,
    });
    if (error) {
      console.error(error);
      throw new Error("Could not place order");
    }
    for (const i of items) {
      const p = rows!.find((r) => r.slug === i.slug)!;
      const stock = { ...(p.size_stock as Record<string, number>) };
      stock[i.size] = Math.max(0, (stock[i.size] ?? 0) - i.qty);
      p.size_stock = stock;
      await supabaseAdmin.from("products").update({ size_stock: stock }).eq("slug", i.slug);
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
    if ((count ?? 0) > 0) return { ok: false, reason: "taken" as const };
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) {
      console.error("claimAdmin insert failed", error);
      return { ok: false, reason: "error" as const };
    }
    return { ok: true, reason: null };
  });

// Public: only tells whether first-time admin setup is already done (no user data).
export const getAdminSetupState = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { adminExists: (count ?? 0) > 0 };
});
