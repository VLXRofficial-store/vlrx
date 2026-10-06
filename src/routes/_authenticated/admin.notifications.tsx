import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BadgeIndianRupee, Bell, MessageSquare, Package, XCircle } from "lucide-react";
import { useAdminProducts, useMessages, useOrders, formatINRsafe } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: Notifications });

type Kind = "order" | "payment" | "low_stock" | "message" | "cancelled";
type Note = { id: string; kind: Kind; title: string; body: string; at: string; link: string };

const META: Record<Kind, { label: string; icon: typeof Bell; cls: string }> = {
  order: { label: "New order", icon: Package, cls: "text-gold" },
  payment: { label: "Payment received", icon: BadgeIndianRupee, cls: "text-success" },
  low_stock: { label: "Low stock", icon: AlertTriangle, cls: "text-gold" },
  message: { label: "New message", icon: MessageSquare, cls: "text-foreground" },
  cancelled: { label: "Cancelled", icon: XCircle, cls: "text-destructive" },
};

const READ_KEY = "vlxr-admin-notif-read";
const CLEAR_KEY = "vlxr-admin-notif-cleared";

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    o.frequency.value = 880;
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch { /* ignore */ }
}

function Notifications() {
  const qc = useQueryClient();
  const orders = useOrders().data ?? [];
  const products = useAdminProducts().data ?? [];
  const messages = useMessages().data ?? [];
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [read, setRead] = useState<string[]>([]);
  const [clearedAt, setClearedAt] = useState(0);
  const [sound, setSound] = useState(true);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    setRead(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]"));
    setClearedAt(Number(localStorage.getItem(CLEAR_KEY) ?? 0));
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    }, 20000);
    return () => clearInterval(t);
  }, [qc]);

  const notes = useMemo(() => {
    const n: Note[] = [];
    for (const o of orders) {
      const link = `/admin/orders/${o.id}`;
      n.push({ id: `o-${o.id}`, kind: "order", title: `#${o.order_code} — ${o.name}`, body: `${formatINRsafe(o.subtotal - o.discount_amount)} · ${o.city}`, at: o.created_at, link });
      if (["confirmed", "shipped", "out_for_delivery", "delivered"].includes(o.status))
        n.push({ id: `p-${o.id}`, kind: "payment", title: `Payment received #${o.order_code}`, body: `${formatINRsafe(o.subtotal - o.discount_amount)} via ${o.payment_method.toUpperCase()}`, at: o.updated_at, link });
      if (o.status === "cancelled")
        n.push({ id: `c-${o.id}`, kind: "cancelled", title: `Order cancelled #${o.order_code}`, body: o.name, at: o.updated_at, link });
    }
    for (const p of products) {
      const stock = (p.size_stock ?? {}) as Record<string, number>;
      const low = Object.entries(stock).filter(([, v]) => Number(v) < p.low_stock_alert);
      if (low.length && p.status === "active")
        n.push({ id: `s-${p.id}-${low.map(([k, v]) => k + v).join("")}`, kind: "low_stock", title: `Low stock: ${p.name}`, body: low.map(([k, v]) => `${k}: ${v}`).join(" · "), at: p.updated_at, link: `/admin/products/${p.id}` });
    }
    for (const m of messages)
      n.push({ id: `m-${m.id}`, kind: "message", title: `Message from ${m.name}`, body: m.message.slice(0, 90), at: m.created_at, link: "/admin/messages" });
    return n.filter((x) => new Date(x.at).getTime() > clearedAt).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [orders, products, messages, clearedAt]);

  // Sound alert for new orders that appear while page is open
  useEffect(() => {
    const ids = new Set(notes.filter((x) => x.kind === "order").map((x) => x.id));
    if (seen.current && sound && [...ids].some((id) => !seen.current!.has(id))) beep();
    if (orders.length) seen.current = ids;
  }, [notes, sound, orders.length]);

  const saveRead = (r: string[]) => { setRead(r); localStorage.setItem(READ_KEY, JSON.stringify(r)); };
  const list = notes.filter((x) => filter === "all" || x.kind === filter);
  const unread = notes.filter((x) => !read.includes(x.id)).length;

  return (
    <div>
      <h1 className="display text-5xl">NOTIFICATIONS</h1>
      <p className="mt-2 text-sm text-muted-foreground">{unread} unread · auto-refresh every 20 sec</p>
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {(["all", ...Object.keys(META)] as (Kind | "all")[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`border px-3 py-1.5 ${filter === k ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>
            {k === "all" ? "All" : META[k].label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-base btn-gold" onClick={() => saveRead(notes.map((x) => x.id))}>Mark all read</button>
        <button className="btn-base btn-silver" onClick={() => { const t = Date.now() - 7 * 864e5; setClearedAt(t); localStorage.setItem(CLEAR_KEY, String(t)); }}>Clear older than 7 days</button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sound for new orders</label>
      </div>
      {list.length === 0 && <p className="mt-10 text-muted-foreground">No notifications.</p>}
      <div className="mt-6 space-y-2">
        {list.map((x) => {
          const M = META[x.kind];
          const isNew = !read.includes(x.id);
          return (
            <Link key={x.id} to={x.link} onClick={() => saveRead([...read, x.id])}
              className={`card-surface flex items-start gap-3 p-4 ${isNew ? "border-l-2 border-l-gold" : "opacity-70"}`}>
              <M.icon className={`mt-0.5 h-5 w-5 shrink-0 ${M.cls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[0.6rem] tracking-brand text-muted-foreground uppercase">{M.label}</p>
                <p className="font-semibold">{x.title}</p>
                <p className="truncate text-sm text-muted-foreground">{x.body}</p>
              </div>
              <span className="shrink-0 text-[0.65rem] text-muted-foreground">{new Date(x.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
