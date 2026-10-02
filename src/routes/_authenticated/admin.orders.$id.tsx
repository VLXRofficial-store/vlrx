import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AGRA_PINCODES, formatINR } from "@/lib/products";
import { ORDER_STATUSES, useOrders, type OrderItem } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: OrderDetail,
});

const field = "w-full border border-input bg-surface px-3 py-2 text-sm text-foreground";

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useOrders();
  const o = data?.find((x) => x.id === id);
  const [status, setStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  useEffect(() => { if (o) { setStatus(o.status); setTracking(o.tracking_number); setCourier(o.courier); } }, [o]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!o) return <p>Order not found. <Link to="/admin/orders" className="text-gold underline">Back</Link></p>;

  const save = async () => {
    const { error } = await supabase.from("orders").update({ status, tracking_number: tracking, courier, updated_at: new Date().toISOString() }).eq("id", o.id);
    if (error) toast.error("Save failed"); else { toast.success("Order updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };
  const idx = ORDER_STATUSES.findIndex((s) => s.id === o.status);
  const wa = `https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name}, update on your VLXR order #${o.order_code}: `)}`;
  const Block = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <section className="card-surface p-5"><h2 className="text-[0.6rem] tracking-brand text-gold uppercase">{t}</h2><div className="mt-2 text-sm">{children}</div></section>
  );

  return (
    <div className="max-w-3xl space-y-4 print:text-black">
      <Link to="/admin/orders" className="text-xs text-muted-foreground underline print:hidden">← All orders</Link>
      <h1 className="display text-4xl">ORDER #{o.order_code}</h1>
      <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
      <Block t="Customer">
        <p>{o.name}</p><p>{o.phone} · {o.email}</p>
        <div className="mt-2 flex gap-2 print:hidden">
          <a href={`tel:${o.phone}`} className="btn-base btn-silver">Call</a>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-base btn-silver">WhatsApp</a>
        </div>
      </Block>
      <Block t="Delivery address">
        <p>{o.address}{o.area ? `, ${o.area}` : ""}</p><p>{o.city}, {o.state} – {o.pincode}</p>
        <p className="mt-1">{AGRA_PINCODES.includes(o.pincode) ? "Delivery: FREE ✅" : "Delivery: Standard"}</p>
      </Block>
      <Block t="Products">
        {(o.items as OrderItem[]).map((i, k) => <p key={k}>{i.name} · Size {i.size} · Qty {i.qty} · {formatINR(i.price * i.qty)}</p>)}
        <p className="mt-2 font-bold">Total {formatINR(o.subtotal)}</p>
      </Block>
      <Block t="Payment"><p>Method: {o.payment_method.toUpperCase()} · Status: Pending (payment gateway not connected yet)</p></Block>
      <Block t="Timeline">
        {ORDER_STATUSES.filter((s) => s.id !== "cancelled").map((s, k) => (
          <p key={s.id}>{o.status !== "cancelled" && k <= idx ? "✅" : "⬜"} {s.label}</p>
        ))}
        {o.status === "cancelled" && <p className="text-destructive">❌ Cancelled</p>}
      </Block>
      <Block t="Tracking & status">
        <div className="grid gap-3 sm:grid-cols-3 print:hidden">
          <input className={field} placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <input className={field} placeholder="Courier partner" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <p className="hidden print:block">Tracking: {tracking} {courier}</p>
      </Block>
      <div className="flex gap-3 print:hidden">
        <button className="btn-base btn-gold" onClick={save}>Save</button>
        <button className="btn-base btn-silver" onClick={() => window.print()}>Print order</button>
      </div>
    </div>
  );
}
