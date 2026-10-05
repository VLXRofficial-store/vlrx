import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage, useAdminProducts } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/media")({ component: Media });

const BUCKET = "product-images";

function Media() {
  const qc = useQueryClient();
  const products = useAdminProducts().data ?? [];
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const files = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const items = (data ?? []).filter((f) => f.id);
      if (!items.length) return [];
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(items.map((f) => f.name), 60 * 60 * 24 * 365 * 10);
      return items.map((f, i) => ({
        name: f.name,
        size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
        created: f.created_at,
        url: signed?.[i]?.signedUrl ?? "",
      }));
    },
  });

  const usedBy = (name: string) =>
    products.filter((p) => [p.front_image, p.back_image, ...(p.extra_images ?? [])].some((u) => u?.includes(encodeURIComponent(name)) || u?.includes(name)));

  const list = useMemo(
    () =>
      (files.data ?? []).filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) &&
          (product === "all" || (product === "none" ? usedBy(f.name).length === 0 : usedBy(f.name).some((p) => p.id === product))),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files.data, search, product, products],
  );

  const upload = async (fl: FileList | null) => {
    if (!fl?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(fl)) await uploadProductImage(f);
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (names: string[]) => {
    if (!names.length || !confirm(`Delete ${names.length} image(s)? Products using them will lose the photo.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove(names);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setSelected([]);
    qc.invalidateQueries({ queryKey: ["media"] });
  };

  const field = "border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-gold";

  return (
    <div>
      <h1 className="display text-5xl">MEDIA LIBRARY</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className={`${field} min-w-0 flex-1`} placeholder="Search filename…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={field} value={product} onChange={(e) => setProduct(e.target.value)}>
          <option value="all">All products</option>
          <option value="none">Not used</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label className="btn-base btn-gold cursor-pointer">
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
        </label>
        {selected.length > 0 && (
          <button className="btn-base btn-silver" onClick={() => remove(selected)}>Delete selected ({selected.length})</button>
        )}
      </div>
      {files.isLoading && <p className="mt-10 text-muted-foreground">Loading…</p>}
      {files.error && <p className="mt-10 text-destructive">Could not load images.</p>}
      {!files.isLoading && list.length === 0 && <p className="mt-10 text-muted-foreground">No images found.</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((f) => (
          <div key={f.name} className="card-surface overflow-hidden">
            <div className="relative aspect-square bg-surface">
              <img src={f.url} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
              <input type="checkbox" className="absolute left-2 top-2 h-4 w-4 accent-[var(--gold)]" checked={selected.includes(f.name)}
                onChange={(e) => setSelected((s) => (e.target.checked ? [...s, f.name] : s.filter((x) => x !== f.name)))} />
            </div>
            <div className="space-y-1 p-2 text-[0.65rem]">
              <p className="truncate" title={f.name}>{f.name}</p>
              <p className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB · {f.created ? new Date(f.created).toLocaleDateString("en-IN") : ""}</p>
              <p className="truncate text-gold">{usedBy(f.name).map((p) => p.name).join(", ") || "Not used"}</p>
              <div className="flex gap-3 pt-1">
                <button className="flex items-center gap-1 hover:text-gold" onClick={() => { navigator.clipboard.writeText(f.url); toast.success("URL copied"); }}>
                  <Copy className="h-3 w-3" /> Copy URL
                </button>
                <button className="flex items-center gap-1 hover:text-destructive" onClick={() => remove([f.name])}>
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
