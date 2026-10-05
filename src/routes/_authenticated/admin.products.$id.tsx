import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCollections } from "@/lib/admin";
import { BADGES, SIZES, uploadProductImage } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: ProductForm,
});

const field = "mt-1 w-full border border-input bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-gold";
const label = "block text-[0.6rem] tracking-brand text-muted-foreground uppercase";

const empty = {
  name: "", slug: "", collection: "STREET", short_description: "", description: "",
  mrp: 2499, price: 1999, size_stock: { XS: 10, S: 15, M: 20, L: 20, XL: 15, XXL: 10 } as Record<string, number>,
  low_stock_alert: 5, badges: [] as string[], status: "active",
  front_image: "" as string | null, back_image: "" as string | null, extra_images: [] as string[],
  fabric: "240GSM Heavyweight Cotton", care: "Cold wash only", fit: "oversized", seo_title: "", seo_description: "",
};

function ImageSlot({ title, value, onChange }: { title: string; value: string | null; onChange: (v: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadProductImage(f)); toast.success("Photo uploaded"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  };
  return (
    <div className="border border-dashed border-border p-3"
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
      <p className={label}>{title}</p>
      {value ? (
        <div className="relative mt-2">
          <img src={value} alt="" className="aspect-[4/5] w-full object-cover" />
          <button type="button" className="absolute right-2 top-2 bg-background px-2 text-xs text-destructive" onClick={() => onChange(null)}>Delete</button>
        </div>
      ) : (
        <label className="mt-2 flex aspect-[4/5] cursor-pointer flex-col items-center justify-center text-center text-xs text-muted-foreground">
          {busy ? "Uploading…" : <>📸 Drag & drop or tap<br />JPG/PNG/WEBP, max 5MB</>}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}

function ProductForm() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [loading, setLoading] = useState(!isNew);
  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isNew) return;
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setF({ ...empty, ...data, size_stock: (data.size_stock ?? {}) as Record<string, number> });
      setLoading(false);
    });
  }, [id, isNew]);

  const save = async (status: string) => {
    if (!f.name.trim()) { toast.error("Product name is required"); return; }
    if (f.price <= 0 || f.price > f.mrp) { toast.error("Drop price must be between 1 and MRP"); return; }
    if (status === "active" && !f.front_image) { toast.error("Front image is required to publish"); return; }
    const slug = f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const row = { ...f, slug, status, updated_at: new Date().toISOString() };
    const { error } = isNew ? await supabase.from("products").insert(row) : await supabase.from("products").update(row).eq("id", id);
    if (error) { toast.error(/duplicate/.test(error.message) ? "A product with this name already exists" : error.message); return; }
    toast.success(status === "active" ? "Published on website" : "Saved");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
    navigate({ to: "/admin/products" });
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  const save$ = f.mrp - f.price;
  const total = Object.values(f.size_stock).reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="display text-5xl">{isNew ? "ADD PRODUCT" : "EDIT PRODUCT"}</h1>

      <section className="card-surface space-y-4 p-5">
        <h2 className="display text-xl text-gold">BASIC INFO</h2>
        <label className={label}>Product name *<input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className={label}>Collection *
          <select className={field} value={f.collection} onChange={(e) => set("collection", e.target.value)}>
            {COLLECTIONS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <label className={label}>Short description<textarea className={field} rows={2} value={f.short_description} onChange={(e) => set("short_description", e.target.value)} /></label>
        <label className={label}>Full description<textarea className={field} rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
      </section>

      <section className="card-surface p-5">
        <h2 className="display text-xl text-gold">PRICING</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className={label}>MRP ₹ *<input type="number" className={field} value={f.mrp} onChange={(e) => set("mrp", +e.target.value)} /></label>
          <label className={label}>Drop price ₹ *<input type="number" className={field} value={f.price} onChange={(e) => set("price", +e.target.value)} /></label>
        </div>
        {save$ > 0 && <p className="mt-3 text-sm text-success">Customer saves ₹{save$} ({Math.round((save$ / f.mrp) * 100)}%)</p>}
      </section>

      <section className="card-surface p-5">
        <h2 className="display text-xl text-gold">PHOTOS</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ImageSlot title="Front image *" value={f.front_image} onChange={(v) => set("front_image", v)} />
          <ImageSlot title="Back image" value={f.back_image} onChange={(v) => set("back_image", v)} />
        </div>
        <p className={`${label} mt-5`}>Extra photos (up to 4)</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {f.extra_images.map((u, i) => (
            <div key={u} className="relative">
              <img src={u} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/80 px-1 text-[0.6rem]">
                <button type="button" onClick={() => { const old = f.front_image; set("front_image", u); set("extra_images", f.extra_images.map((x, k) => (k === i ? old ?? "" : x)).filter(Boolean)); }}>Set main</button>
                <button type="button" className="text-destructive" onClick={() => set("extra_images", f.extra_images.filter((_, k) => k !== i))}>Delete</button>
              </div>
            </div>
          ))}
          {f.extra_images.length < 4 && <ImageSlot title="Add photo" value={null} onChange={(v) => v && set("extra_images", [...f.extra_images, v])} />}
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="display text-xl text-gold">SIZE & STOCK</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SIZES.map((s) => (
            <label key={s} className={label}>{s}
              <input type="number" min={0} className={field} value={f.size_stock[s] ?? 0}
                onChange={(e) => set("size_stock", { ...f.size_stock, [s]: Math.max(0, +e.target.value) })} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm">Total stock: <b>{total}</b> · 0 = size hidden on website</p>
        <label className={`${label} mt-3 max-w-xs`}>Low stock alert below<input type="number" className={field} value={f.low_stock_alert} onChange={(e) => set("low_stock_alert", +e.target.value)} /></label>
      </section>

      <section className="card-surface p-5">
        <h2 className="display text-xl text-gold">LABELS & STATUS</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {BADGES.map((b) => (
            <label key={b} className="flex items-center gap-2">
              <input type="checkbox" checked={f.badges.includes(b)} onChange={(e) => set("badges", e.target.checked ? [...f.badges, b] : f.badges.filter((x) => x !== b))} />{b}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Current status: <b className="uppercase">{f.status}</b></p>
      </section>

      <section className="card-surface space-y-4 p-5">
        <h2 className="display text-xl text-gold">DETAILS & SEO</h2>
        <label className={label}>Fabric<input className={field} value={f.fabric} onChange={(e) => set("fabric", e.target.value)} /></label>
        <label className={label}>Care<input className={field} value={f.care} onChange={(e) => set("care", e.target.value)} /></label>
        <label className={label}>Fit
          <select className={field} value={f.fit} onChange={(e) => set("fit", e.target.value)}><option value="oversized">Oversized</option><option value="regular">Regular</option></select>
        </label>
        <label className={label}>SEO title ({f.seo_title.length}/60)<input maxLength={60} className={field} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} /></label>
        <label className={label}>SEO description ({f.seo_description.length}/160)<textarea maxLength={160} className={field} value={f.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></label>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="btn-base btn-gold" onClick={() => save("active")}>Save & publish</button>
        <button className="btn-base btn-silver" onClick={() => save("draft")}>Save draft</button>
        {!isNew && <button className="btn-base btn-silver" onClick={() => save("archived")}>Archive</button>}
        <Link to="/admin/products" className="btn-base btn-silver">Cancel</Link>
      </div>
    </div>
  );
}
