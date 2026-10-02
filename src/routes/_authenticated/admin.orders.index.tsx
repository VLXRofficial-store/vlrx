import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AGRA_PINCODES, formatINR } from "@/lib/products";
import { downloadCsv, ORDER_STATUSES, useOrders, type OrderItem } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  validateSearch: (s: Record<string, unknown>): { status?: string } => ({ status: typeof s["status"] === "string" ? s["status"] : undefined }),
  component: Orders,
});

const field = "border border-input bg-surface px-3 py-2 text-sm text-foreground";

function Orders() {
  const { status: initial } = Route.useSearch();
  const qc = useQueryClient();
  const { data = [] } = useOrders();
  const [tab, setTab] = useState(initial ?? "all");
  const [q, setQ] = useState("");
  const [area, setArea] = useState("all");
  const [from, setFrom] = useState("");
  const [sel, setSel] = useState<string[]>([]);

  const list = useMemo(() => data.filter((o) => {
    const agra = AGRA_PINCODES.includes(o.pincode);
    return (tab === "all" || o.status === tab) &&
      (area === "all" || (area === "agra") === agra) &&
      (!from || new Date(o.created_at) >= new Date(from)) &&
      `${o.order_code} ${o.phone} ${o.name}`.toLowerCase().includes(q.toLowerCase());
  }), [data, tab, q, area, from]);

  const setStatus = async (ids: string[], status: string) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
    if (error) { toast.error("Update failed"); return; }
    toast.success("Status updated"); setSel([]);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div>
      <h1 className="display text-5xl">ORDERS</h1>
      <div className="mt-6 flex gap-4 overflow-x-auto border-b border-border">
        {[{ id: "all", label: "All" }, ...ORDER_STATUSES].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("whitespace-nowrap pb-3 text-xs font-semibold tracking-brand uppercase", tab === t.id ? "border-b-2 border-gold text-gold" : "text-muted-foreground")}>
            {t.label} ({t.id === "all" ? data.length : data.filter((o) => o.status === t.id).length})
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input className={field} placeholder="Order ID / phone / name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={field} value={area} onChange={(e) => setArea(e.target.value)}><option value="all">All areas</option><option value="agra">Agra</option><option value="out">Outside Agra</option></select>
        <label className="text-xs text-muted-foreground">From <input type="date" className={field} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <button className="btn-base btn-silver" onClick={() => downloadCsv("vlxr-orders.csv", [["Order", "Date", "Name", "Phone", "City", "Pincode", "Items", "Amount", "Status"], ...list.map((o) => [o.order_code, new Date(o.created_at).toLocaleString("en-IN"), o.name, o.phone, o.city, o.pincode, (o.items as OrderItem[]).map((i) => `${i.name} ${i.size}x${i.qty}`).join("; "), o.subtotal, o.status])])}>Export Excel</button>
      </div>
      {sel.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border border-gold p-3 text-sm">
          {sel.length} selected:
          <button className="btn-base btn-silver" onClick={() => setStatus(sel, "shipped")}>Mark shipped</button>
          <button className="btn-base btn-silver" onClick={() => setStatus(sel, "delivered")}>Mark delivered</button>
          <button className="btn-base btn-silver" onClick={() => setStatus(sel, "cancelled")}>Mark cancelled</button>
        </div>
      )}
      <div className="mt-6 space-y-3">
        {list.map((o) => (
          <div key={o.id} className="card-surface flex flex-wrap items-center gap-4 p-4 text-sm">
            <input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} />
            <div className="min-w-48 flex-1">
              <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-bold text-gold underline">#{o.order_code}</Link>
              <span className="text-muted-foreground"> · {new Date(o.created_at).toLocaleString("en-IN")}</span>
              <p>{o.name} · <a href={`tel:${o.phone}`} className="underline">{o.phone}</a> · {o.city}</p>
              <p className="text-muted-foreground">{(o.items as OrderItem[]).map((i) => `${i.name} (${i.size}×${i.qty})`).join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatINR(o.subtotal)}</p>
              <p className="text-xs text-muted-foreground">{AGRA_PINCODES.includes(o.pincode) ? "Free Agra delivery" : "Standard delivery"}</p>
            </div>
            <select value={o.status} onChange={(e) => setStatus([o.id], e.target.value)} className={field}>
              {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No orders found.</p>}
      </div>
    </div>
  );
}
