import { createFileRoute, Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/products";
import { isToday, statusLabel, totalStock, useAdminProducts, useOrders, type OrderItem } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-surface p-4">
      <p className="text-[0.6rem] tracking-brand text-muted-foreground uppercase">{label}</p>
      <p className="display mt-1 text-2xl text-gold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const oq = useOrders();
  const orders = oq.data ?? [];
  const products = useAdminProducts().data ?? [];
  const live = orders.filter((o) => o.status !== "cancelled");
  const today = live.filter((o) => isToday(o.created_at));
  const sum = (a: typeof orders) => a.reduce((s, o) => s + o.subtotal, 0);
  const low = products.filter((p) => totalStock(p.size_stock) < p.low_stock_alert).length;

  if (oq.isLoading) return <p className="py-20 text-center text-muted-foreground">Loading…</p>;
  if (oq.error) return <p className="py-20 text-center text-destructive">Could not load orders: {String((oq.error as Error).message)}</p>;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  return (
    <div>
      <h1 className="display text-5xl">DASHBOARD</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Today orders" value={today.length} />
        <Stat label="Today revenue" value={formatINR(sum(today))} />
        <Stat label="Total orders (all)" value={orders.length} />
        <Stat label="Active orders" value={live.length} />
        <Stat label="Cancelled orders" value={cancelled} />
        <Stat label="Total revenue (excl. cancelled)" value={formatINR(sum(live))} />
        <Stat label="Pending orders" value={orders.filter((o) => o.status === "placed").length} />
        <Stat label="Low stock" value={low} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/admin/products/$id" params={{ id: "new" }} className="btn-base btn-gold">+ Add new product</Link>
        <Link to="/admin/orders" search={{ status: "placed" }} className="btn-base btn-silver">Pending orders</Link>
        <Link to="/admin/messages" className="btn-base btn-silver">Customer messages</Link>
        <Link to="/admin/reports" className="btn-base btn-silver">View reports</Link>
      </div>
      <h2 className="display mt-10 text-3xl">RECENT ORDERS</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[0.6rem] tracking-brand text-muted-foreground uppercase">
            <tr><th className="py-2">Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Time</th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="py-3"><Link to="/admin/orders/$id" params={{ id: o.id }} className="text-gold underline">#{o.order_code}</Link></td>
                <td>{o.name}</td>
                <td className="text-muted-foreground">{(o.items as OrderItem[]).map((i) => `${i.name} (${i.size})`).join(", ")}</td>
                <td>{formatINR(o.subtotal)}</td>
                <td>{statusLabel(o.status)}</td>
                <td className="text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="py-6 text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
