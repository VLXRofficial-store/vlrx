import { createFileRoute } from "@tanstack/react-router";
import { WHATSAPP_NUMBER } from "@/lib/products";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "Return Policy — VLXR" },
      {
        name: "description",
        content:
          "VLXR return and exchange policy: 7-day size exchange, damaged-item replacement, and how to raise a request.",
      },
      { property: "og:title", content: "Return Policy — VLXR" },
      {
        property: "og:description",
        content: "7-day size exchange and damaged-item replacement on all VLXR orders.",
      },
    ],
  }),
  component: ReturnPolicy,
});

const SECTIONS = [
  {
    title: "SIZE EXCHANGE",
    text: "Raise an exchange request within 7 days of delivery. The piece must be unworn, unwashed and carry its original tags. Exchanges depend on stock availability of the drop.",
  },
  {
    title: "DAMAGED OR WRONG ITEM",
    text: "If your order arrives damaged or incorrect, message us on WhatsApp within 48 hours with an unboxing photo or video and we will replace it at no cost.",
  },
  {
    title: "NO REFUNDS ON LIMITED DROPS",
    text: "Pieces marked LIMITED are produced in numbered runs and are eligible for size exchange only, not refunds.",
  },
  {
    title: "HOW TO RAISE A REQUEST",
    text: "Message us on WhatsApp with your order ID and reason. Our team replies within 24 hours and shares pickup or return details.",
  },
];

function ReturnPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="display text-6xl">RETURN POLICY</h1>
      <div className="hairline-gold mt-5" />
      <div className="mt-12 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-xs tracking-brand text-gold">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </section>
        ))}
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        className="btn-base btn-gold-outline mt-14"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}
