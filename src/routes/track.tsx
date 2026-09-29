import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trackOrder } from "@/lib/orders.functions";
import { formatINR } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — VLXR" },
      { name: "description", content: "Track your VLXR order status with your order ID and phone number." },
      { property: "og:title", content: "Track Your Order — VLXR" },
      { property: "og:description", content: "Check where your VLXR drop is right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Track,
});

const STEPS = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered"];
const LABEL: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type Result = Awaited<ReturnType<typeof trackOrder>>;

function Track() {
  const fn = useServerFn(trackOrder);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | undefined>(undefined);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^\d{10}$/.test(phone) || !code.trim()) return setErr("Enter your order ID and 10-digit phone number");
    setLoading(true);
    try {
      setResult(await fn({ data: { code, phone } }));
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "mt-2 w-full border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-gold";
  const idx = result ? STEPS.indexOf(result.status) : -1;

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <h1 className="display text-5xl sm:text-6xl">TRACK ORDER</h1>
      <div className="hairline-gold mt-5" />
      <form onSubmit={submit} className="card-surface mt-10 p-6">
        <label className="block text-[0.6rem] tracking-brand text-muted-foreground">
          ORDER ID
          <input className={field} value={code} onChange={(e) => setCode(e.target.value)} placeholder="VLXR123456" />
        </label>
        <label className="mt-5 block text-[0.6rem] tracking-brand text-muted-foreground">
          PHONE NUMBER
          <input className={field} value={phone} inputMode="numeric" maxLength={10} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" />
        </label>
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
        <button className="btn-base btn-gold mt-6 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
        </button>
      </form>

      {result === null && <p className="mt-8 text-center text-sm text-muted-foreground">No order found. Check your order ID and phone.</p>}
      {result && (
        <div className="card-surface mt-8 p-6">
          <p className="text-xs tracking-brand text-muted-foreground">ORDER #{result.order_code}</p>
          <p className="display mt-2 text-3xl text-gold">{LABEL[result.status] ?? result.status}</p>
          {result.status !== "cancelled" && (
            <ol className="mt-6 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className={cn("h-3 w-3 rounded-full border", i <= idx ? "border-gold bg-gold" : "border-border")} />
                  <span className={i <= idx ? "text-foreground" : "text-muted-foreground"}>{LABEL[s]}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-6 text-sm text-muted-foreground">Total: {formatINR(result.subtotal)} · Delivery in 8–9 working days</p>
        </div>
      )}
    </div>
  );
}
