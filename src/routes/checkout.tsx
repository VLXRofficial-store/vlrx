import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { checkDiscount, placeOrder } from "@/lib/orders.functions";
import { useCart } from "@/lib/cart";
import { AGRA_PINCODES, formatINR } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — VLXR" },
      { name: "description", content: "Secure checkout for your VLXR order. Online payments only." },
      { property: "og:title", content: "Checkout — VLXR" },
      { property: "og:description", content: "Secure checkout for your VLXR order." },
    ],
  }),
  component: Checkout,
});

type Form = {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY: Form = { name: "", phone: "", email: "", address: "", area: "", city: "", state: "", pincode: "" };
const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Debit / Credit Card", sub: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", sub: "All major Indian banks" },
];

function Checkout() {
  const { detailed, subtotal, clear } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pinValid = /^\d{6}$/.test(form.pincode);
  const isAgra = AGRA_PINCODES.includes(form.pincode);

  const validate = (keys: (keyof Form)[]) => {
    const e: Partial<Record<keyof Form, string>> = {};
    for (const k of keys) if (!form[k].trim()) e[k] = "Required";
    if (keys.includes("phone") && form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (keys.includes("email") && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (keys.includes("pincode") && form.pincode && !pinValid) e.pincode = "Enter a 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const place = useServerFn(placeOrder);
  const check = useServerFn(checkDiscount);
  const [code, setCode] = useState("");
  const [disc, setDisc] = useState<{ code: string; amount: number } | null>(null);
  const applyCode = async () => {
    if (!code.trim()) return;
    const r = await check({ data: { code, subtotal } });
    if (r.ok) { setDisc({ code: code.trim().toUpperCase(), amount: r.amount }); toast.success(`Code applied — you save ${formatINR(r.amount)}`); }
    else { setDisc(null); toast.error(r.error ?? "Invalid code"); }
  };
  const total = subtotal - (disc?.amount ?? 0);
  const pay = async () => {
    setPaying(true);
    try {
      // Payment gateway not connected yet — order is saved as "placed".
      const res = await place({
        data: {
          ...form,
          payment_method: method as "upi" | "card" | "netbanking",
          ...(disc ? { discount_code: disc.code } : {}),
          items: detailed.map(({ line }) => ({ slug: line.slug, size: line.size, qty: line.qty })),
        },
      });
      setOrderId(res.order_code);
      clear();
      setStep(4);
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Could not place order. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (step === 4 && orderId) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="display text-6xl text-gold">ORDER CONFIRMED!</h1>
        <p className="mt-6 text-lg">Thank you for choosing VLXR</p>
        <p className="mt-3 text-sm text-muted-foreground">Your order will be delivered in 8–9 working days.</p>
        <p className="mt-8 text-xs tracking-brand text-chrome">ORDER ID: #{orderId}</p>
        <p className="mt-4 text-sm text-muted-foreground">We will contact you on {form.phone} for updates.</p>
        <Link to="/shop" className="btn-base btn-gold mt-10">Continue Shopping</Link>
      </div>
    );
  }

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="display text-5xl">CHECKOUT</h1>
        <p className="mt-4 text-sm text-muted-foreground">Your cart is empty.</p>
        <Link to="/shop" className="btn-base btn-gold-outline mt-6">Shop the drop</Link>
      </div>
    );
  }

  const input = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-[0.6rem] tracking-brand text-muted-foreground">
      {label} *
      <input
        {...props}
        value={form[k]}
        onChange={(e) => set(k, props.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value)}
        className={cn(
          "mt-2 w-full border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold",
          errors[k] ? "border-destructive" : "border-input",
        )}
      />
      {errors[k] && <span className="mt-1 block text-xs normal-case tracking-normal text-destructive">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex gap-2 text-[0.55rem] tracking-brand">
        {["DETAILS", "ADDRESS", "PAYMENT"].map((s, i) => (
          <span key={s} className={cn("border-b-2 pb-2 pr-3", step >= i + 1 ? "border-gold text-gold" : "border-border text-muted-foreground")}>
            0{i + 1} {s}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          {step === 1 && (
            <div className="space-y-5">
              <h1 className="display text-5xl">YOUR DETAILS</h1>
              {input("name", "FULL NAME", { maxLength: 80 })}
              {input("phone", "MOBILE NUMBER", { inputMode: "numeric", maxLength: 10, placeholder: "10-digit number" })}
              {input("email", "EMAIL ADDRESS", { type: "email", maxLength: 120 })}
              <button type="button" className="btn-base btn-gold w-full" onClick={() => validate(["name", "phone", "email"]) && setStep(2)}>
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h1 className="display text-5xl">DELIVERY ADDRESS</h1>
              {input("address", "COMPLETE ADDRESS (HOUSE / FLAT NO.)", { maxLength: 200 })}
              {input("area", "AREA / COLONY", { maxLength: 120 })}
              <div className="grid gap-5 sm:grid-cols-2">
                {input("city", "CITY", { maxLength: 60 })}
                {input("state", "STATE", { maxLength: 60 })}
              </div>
              {input("pincode", "PINCODE", { inputMode: "numeric", maxLength: 6 })}

              {pinValid &&
                (isAgra ? (
                  <div className="border border-success bg-success/10 p-4 text-sm">
                    <p className="font-semibold text-success">✅ FREE DELIVERY — Agra City</p>
                    <p className="mt-1 text-muted-foreground">Estimated: 8–9 Working Days</p>
                  </div>
                ) : (
                  <div className="border border-warning bg-warning/10 p-4 text-sm">
                    <p className="font-semibold text-warning">⚠️ DELIVERY INFORMATION</p>
                    <p className="mt-2 text-muted-foreground">
                      You are outside Agra city. Extra delivery charges will apply. Our team will contact you on your
                      mobile number to confirm charges before processing your order.
                    </p>
                    <p className="mt-2 text-muted-foreground">Estimated: 8–9 Working Days</p>
                  </div>
                ))}

              <div className="flex gap-3">
                <button type="button" className="btn-base btn-silver" onClick={() => setStep(1)}>Back</button>
                <button
                  type="button"
                  className="btn-base btn-gold flex-1"
                  onClick={() => validate(["address", "area", "city", "state", "pincode"]) && setStep(3)}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h1 className="display text-5xl">PAYMENT METHOD</h1>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "card-surface flex w-full items-center justify-between p-5 text-left transition-colors",
                    method === m.id && "border-gold",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.sub}</span>
                  </span>
                  <span className={cn("h-4 w-4 shrink-0 rounded-full border", method === m.id ? "border-gold bg-gold" : "border-border")} />
                </button>
              ))}
              <div className="border border-destructive p-4 text-sm">
                <p className="font-semibold text-destructive">❌ CASH ON DELIVERY NOT AVAILABLE</p>
                <p className="mt-1 text-muted-foreground">We accept Online Payments Only</p>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-base btn-silver" onClick={() => setStep(2)} disabled={paying}>Back</button>
                <button type="button" className="btn-base btn-gold flex-1" onClick={pay} disabled={paying}>
                  {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing</> : `Pay Now ${formatINR(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="card-surface h-fit p-6">
          <h2 className="display text-2xl">ORDER SUMMARY</h2>
          <div className="mt-5 space-y-3 text-sm">
            {detailed.map(({ line, product }) => (
              <div key={`${line.slug}-${line.size}`} className="flex justify-between gap-3">
                <span className="min-w-0 text-muted-foreground">{product.name} · {line.size} ×{line.qty}</span>
                <span className="shrink-0">{formatINR(product.price * line.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-xs">{pinValid ? (isAgra ? "FREE" : "To be confirmed") : "Calculated next"}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DISCOUNT CODE"
                className="min-w-0 flex-1 border border-input bg-surface px-3 py-2 text-xs uppercase outline-none focus:border-gold" />
              <button type="button" onClick={applyCode} className="btn-base btn-silver !px-4 !py-2 text-xs">Apply</button>
            </div>
            {disc && (
              <div className="flex justify-between text-success">
                <span>Discount ({disc.code})</span><span>−{formatINR(disc.amount)}</span>
              </div>
            )}
            <div className="hairline-gold my-3" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-gold">{formatINR(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
