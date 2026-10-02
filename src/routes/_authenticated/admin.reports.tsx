import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AGRA_PINCODES, formatINR } from "@/lib/products";
import { downloadCsv, useOrders, type OrderItem } from "@/lib/admin";
import { Stat } from "./admin.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: Reports,
});

const RANGES = [
  { id: "today", label: "Today", days: 1 },
  { id: "week", label: "This week", days: 7 },
  { id: "month", label: "This month", days: 30 },
  { id: "all", label: "All time", days: 100000 },
];

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <div className="card-surface p-5">
      <p className="text-[0.6rem] tracking-brand text-gold uppercase">{title}</p>
      <div className="mt-3 space-y-2">
        {data.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-muted-foreground">{k}</span>
            <div className="h-3 flex-1 bg-surface"><div className="h-3 bg-gold" style={{ width: `${(v / max) * 100}%` }} /></div>
            <span className="w-16 text-right">{v}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
      </div>
    </div>
  );
}

function Reports() {
  const { data = [] } = useOrders();
  const [range, setRange] = useState("month");
  const days = RANGES.find((r) => r.id === range)!.days;
  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (days - 1));
  const inRange = data.filter((o) => new Date(o.created_at) >= since);
  const live = inRange.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.subtotal, 0);

  const group = (fn: (o: (typeof live)[number]) => [string, number][]) => {
    const m = new Map<string, number>();
    live.forEach((o) => fn(o).forEach(([k, v]) => m.set(k, (m.get(k) ?? 0) + v)));
    return [...m.entries()];
  };
  const daily = group((o) => [[new Date(o.created_at).toLocaleDateString("en-IN"), o.subtotal]]).slice(0, 14);
  const items = (o: (typeof live)[number]) => o.items as OrderItem[];
  const bySize = group((o) => items(o).map((i) => [i.size, i.qty]));
  const byProduct = group((o) => items(o).map((i) => [i.name, i.qty])).sort((a, b) => b[1] - a[1]);
  const productRev = group((o) => items(o).map((i) => [i.name, i.price * i.qty]));
  const byArea = group((o) => [[AGRA_PINCODES.includes(o.pincode) ? "Agra" : "Outside Agra", 1]]);

  return (
    <div>
      <h1 className="display text-5xl">REPORTS</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} className={cn("border px-3 py-1.5 text-xs", range === r.id ? "border-gold text-gold" : "border-border text-muted-foreground")}>{r.label}</button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Revenue" value={formatINR(revenue)} />
        <Stat label="Orders" value={live.length} />
        <Stat label="Avg order" value={formatINR(live.length ? Math.round(revenue / live.length) : 0)} />
        <Stat label="Cancelled" value={inRange.length - live.length} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Bars title="Daily revenue (₹)" data={daily} />
        <Bars title="Size-wise units" data={bySize} />
        <Bars title="Agra vs outside (orders)" data={byArea} />
        <div className="card-surface p-5">
          <p className="text-[0.6rem] tracking-brand text-gold uppercase">Top products</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {byProduct.map(([n, u]) => (
                <tr key={n} className="border-t border-border"><td className="py-2">{n}</td><td>{u} sold</td><td className="text-right">{formatINR(productRev.find((p) => p[0] === n)?.[1] ?? 0)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-base btn-silver" onClick={() => downloadCsv("vlxr-orders.csv", [["Order", "Date", "Name", "Amount", "Status"], ...inRange.map((o) => [o.order_code, o.created_at, o.name, o.subtotal, o.status])])}>Export orders</button>
        <button className="btn-base btn-silver" onClick={() => downloadCsv("vlxr-customers.csv", [["Name", "Phone", "Email", "City"], ...[...new Map(data.map((o) => [o.phone, o])).values()].map((o) => [o.name, o.phone, o.email, o.city])])}>Export customers</button>
        <button className="btn-base btn-silver" onClick={() => window.print()}>Print report</button>
      </div>
    </div>
  );
}
