import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products";
import { BADGES, downloadCsv, totalStock, useAdminProducts } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: ProductsList,
});

const field = "border border-input bg-surface px-3 py-2 text-sm text-foreground";

function ProductsList() {
  const qc = useQueryClient();
  const { data = [] } = useAdminProducts();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const [priceEdit, setPriceEdit] = useState<{ id: string; name: string; mrp: number; price: number } | null>(null);

  const list = useMemo(
    () => data.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) && (status === "all" || p.status === status)),
    [data, q, status],
  );
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };

  const update = async (ids: string[], patch: Record<string, unknown>) => {
    const { error } = await supabase.from("products").update({ ...patch, updated_at: new Date().toISOString() }).in("id", ids);
    if (error) toast.error("Save failed: " + error.message); else { toast.success("Saved"); refresh(); }
  };
  const remove = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) toast.error(error.message); else { toast.success("Deleted"); setSel([]); refresh(); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-5xl">PRODUCTS</h1>
        <Link to="/admin/products/$id" params={{ id: "new" }} className="btn-base btn-gold">+ Add new product</Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className={field} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
        </select>
        <button className="btn-base btn-silver" onClick={() => downloadCsv("vlxr-products.csv", [["Name", "Collection", "MRP", "Price", "Stock", "Status"], ...data.map((p) => [p.name, p.collection, p.mrp, p.price, totalStock(p.size_stock), p.status])])}>Export</button>
      </div>
      {sel.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-gold p-3 text-sm">
          <span>{sel.length} selected:</span>
          <button className="btn-base btn-silver" onClick={() => update(sel, { status: "active" })}>Set Active</button>
          <button className="btn-base btn-silver" onClick={() => update(sel, { status: "draft" })}>Set Draft</button>
          <select className={field} defaultValue="" onChange={(e) => { if (e.target.value) update(sel, { badges: [e.target.value] }); }}>
            <option value="">Apply badge…</option>{BADGES.map((b) => <option key={b}>{b}</option>)}
          </select>
          <button className="btn-base btn-silver text-destructive" onClick={() => remove(sel)}>Delete</button>
        </div>
      )}
      <div className="mt-6 space-y-3">
        {list.map((p) => (
          <div key={p.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
            <input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} />
            <div className="h-16 w-14 overflow-hidden bg-surface">
              {p.front_image ? <img src={p.front_image} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[0.5rem] text-gold">VLXR</span>}
            </div>
            <div className="min-w-40 flex-1">
              <p className="font-bold">{p.name}</p>
              <p className="text-[0.6rem] tracking-brand text-gold">{p.collection} · <span className="uppercase text-muted-foreground">{p.status}</span> {p.badges.join(" · ")}</p>
            </div>
            <button className="text-left text-sm" title="Quick price change" onClick={() => setPriceEdit({ id: p.id, name: p.name, mrp: p.mrp, price: p.price })}>
              <span className="text-destructive line-through">{formatINR(p.mrp)}</span> <b>{formatINR(p.price)}</b> ✎
            </button>
            <span className="text-sm">Stock: <b>{totalStock(p.size_stock)}</b></span>
            <div className="flex gap-2 text-xs">
              <Link to="/admin/products/$id" params={{ id: p.id }} className="underline">Edit</Link>
              <Link to="/product/$slug" params={{ slug: p.slug }} target="_blank" className="underline">View</Link>
              <button className="text-destructive underline" onClick={() => remove([p.id])}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No products.</p>}
      </div>

      {priceEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5" onClick={() => setPriceEdit(null)}>
          <div className="card-surface w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="display text-2xl">QUICK PRICE EDIT</h3>
            <p className="mt-1 text-sm text-muted-foreground">{priceEdit.name}</p>
            <label className="mt-4 block text-xs">MRP ₹<input type="number" className={`${field} mt-1 w-full`} value={priceEdit.mrp} onChange={(e) => setPriceEdit({ ...priceEdit, mrp: +e.target.value })} /></label>
            <label className="mt-3 block text-xs">Drop price ₹<input type="number" className={`${field} mt-1 w-full`} value={priceEdit.price} onChange={(e) => setPriceEdit({ ...priceEdit, price: +e.target.value })} /></label>
            <div className="mt-5 flex gap-2">
              <button className="btn-base btn-gold" onClick={async () => {
                if (priceEdit.price <= 0 || priceEdit.price > priceEdit.mrp) { toast.error("Drop price must be between 1 and MRP"); return; }
                await update([priceEdit.id], { mrp: priceEdit.mrp, price: priceEdit.price }); setPriceEdit(null);
              }}>Save</button>
              <button className="btn-base btn-silver" onClick={() => setPriceEdit(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
