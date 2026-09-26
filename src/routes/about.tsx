import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — VLXR" },
      {
        name: "description",
        content:
          "VLXR was not built for everyone. Limited drops, 240GSM heavyweight cotton, born in India, built for the world.",
      },
      { property: "og:title", content: "Our Story — VLXR" },
      {
        property: "og:description",
        content: "Born in India. Built for the world. EST. 2025 — VLXR.",
      },
    ],
  }),
  component: About,
});

const VALUES = [
  { title: "RARE", text: "Limited drops only. No restocks, no mass production." },
  { title: "QUALITY", text: "240GSM heavyweight cotton on every single piece." },
  { title: "BOLD", text: "Unapologetic designs for people who move different." },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="display text-6xl sm:text-7xl">OUR STORY</h1>
      <div className="hairline-gold mt-5" />

      <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          VLXR was not built for everyone. It was built for those who think different, move
          different, and wear different.
        </p>
        <p>
          No mass production. No cheap quality. Just raw, rare, heavyweight streetwear crafted for
          the bold.
        </p>
        <p className="text-foreground">Born in India. Built for the world.</p>
        <p className="text-[0.6rem] tracking-brand text-gold">EST. 2025 — VLXR</p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.title} className="card-surface p-6">
            <h2 className="display text-3xl text-gold">{v.title}</h2>
            <p className="mt-3 text-xs text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </div>

      <Link to="/shop" className="btn-base btn-gold-outline mt-16">
        Shop the drop
      </Link>
    </div>
  );
}
