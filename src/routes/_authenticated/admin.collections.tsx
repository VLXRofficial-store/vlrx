import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage, useAdminCollections, useAdminProducts } from "@/lib/admin";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/collections")({ component: Collections });

const field = "w-full border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-gold";

function Collections() {
  const q = useAdminCollections();
  const products = useAdminProducts().data ?? [];
  const qc = useQueryClient();
  const [newId, setNewId] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-collections"] }); qc.invalidateQueries({ queryKey: ["collections"] }); };

  const add = async () => {
    const id = newId.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-");
    if (!id) { toast.error("Enter a collection name"); return; }
    const { error } = await supabase.from("collections").insert({ id, title: `VLXR ${id}`, display_order: (q.data?.length ?? 0) + 1 });
    if (error) { toast.error(error.code === "23505" ? "Collection already exists" : error.message); return; }
    setNewId("");
    toast.success("Collection added");
    refresh();
  };

  return (
    <div>
      <h1 className="display text-5xl">COLLECTIONS</h1>
      <div className="mt-6 flex gap-3">
        <input className={field} placeholder="New collection id, e.g. SUMMER" value={newId} onChange={(e) => setNewId(e.target.value)} />
        <button className="btn-base btn-gold shrink-0" onClick={add}>+ Add new collection</button>
      </div>
      {q.isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
      <div className="mt-6 space-y-4">
        {(q.data ?? []).map((c) => (
          <CollectionCard key={c.id} c={c} count={products.filter((p) => p.collection === c.id).length} onSaved={refresh} />
        ))}
      </div>
    </div>
  );
}

function CollectionCard({ c, count, onSaved }: { c: Tables<"collections">; count: number; onSaved: () => void }) {
  const [f, setF] = useState(c);
  const [busy, setBusy] = useState(false);
  const save = async (patch?: Partial<typeof f>) => {
    const next = { ...f, ...patch };
    setBusy(true);
    const { error } = await supabase.from("collections").update({
      title: next.title, description: next.description, banner_image: next.banner_image,
      display_order: next.display_order, visible: next.visible,
    }).eq("id", c.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setF(next);
    toast.success("Saved");
    onSaved();
  };
  const del = async () => {
    if (count > 0) { toast.error("Move its products to another collection first"); return; }
    if (!confirm(`Delete ${c.title}?`)) return;
    const { error } = await supabase.from("collections").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    onSaved();
  };
  return (
    <div className="card-surface grid gap-4 p-4 md:grid-cols-[180px_1fr]">
      <label className="relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border text-xs text-muted-foreground">
        {f.banner_image ? <img src={f.banner_image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : "Upload banner"}
        <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          try { await save({ banner_image: await uploadProductImage(file) }); } catch (err) { toast.error((err as Error).message); }
        }} />
      </label>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.6rem] tracking-brand text-gold">{c.id}</span>
          <span className="text-xs text-muted-foreground">{count} products</span>
          <Link to="/admin/products" className="text-xs text-gold underline">View products</Link>
          <label className="ml-auto flex items-center gap-2 text-xs">
            <input type="checkbox" checked={f.visible} onChange={(e) => save({ visible: e.target.checked })} />
            {f.visible ? "Shown on website" : "Hidden"}
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
          <input className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Name" />
          <input className={field} type="number" value={f.display_order} onChange={(e) => setF({ ...f, display_order: Number(e.target.value) })} title="Display order" />
        </div>
        <textarea className={field} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" />
        <div className="flex gap-3">
          <button className="btn-base btn-gold" disabled={busy} onClick={() => save()}>Save</button>
          {f.banner_image && <button className="btn-base btn-silver" onClick={() => save({ banner_image: null })}>Remove banner</button>}
          <button className="ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={del}>Delete</button>
        </div>
      </div>
    </div>
  );
}
