import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { COLLECTIONS, PRODUCTS } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VLXR — Premium Streetwear | Born Rare" },
      {
        name: "description",
        content:
          "VLXR: limited-drop premium streetwear in 240GSM heavyweight cotton. Shop the new drop — Heritage, Street and Genesis collections.",
      },
      { property: "og:title", content: "VLXR — Premium Streetwear | Born Rare" },
      {
        property: "og:description",
        content: "Limited drops. 240GSM heavyweight cotton. Born Rare. EST. 2025.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden px-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,10,10,0.9))]" />
        <div className="relative mx-auto w-full max-w-7xl py-24">
          <p className="text-[0.6rem] tracking-brand text-gold">EST. 2025 — AGRA, INDIA</p>
          <h1 className="display mt-6 text-[22vw] leading-[0.82] text-gradient-chrome sm:text-[16vw] lg:text-[13rem]">
            VLXR
          </h1>
          <p className="mt-4 text-xs tracking-brand text-chrome sm:text-sm">PREMIUM STREETWEAR</p>
          <p className="mt-6 max-w-md text-2xl text-muted-foreground sm:text-3xl">
            <span className="display text-foreground">Born Rare</span>
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop" className="btn-base btn-gold-outline">
              Shop Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW DROP */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-5xl sm:text-6xl">NEW DROP</h2>
          <Link to="/shop" className="text-[0.6rem] tracking-brand text-gold hover:underline">
            VIEW ALL
          </Link>
        </div>
        <div className="hairline-gold mt-5" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="display text-5xl sm:text-6xl">COLLECTIONS</h2>
        <div className="hairline-gold mt-5" />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ collection: c.id }}
              className="card-surface group relative flex min-h-56 flex-col justify-end overflow-hidden p-6 transition-colors hover:border-gold"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.07),transparent_60%)]" />
              <span className="display relative text-3xl text-chrome transition-colors group-hover:text-gold">
                {c.title}
              </span>
              <p className="relative mt-2 text-xs text-muted-foreground">{c.blurb}</p>
              <span className="relative mt-4 text-[0.55rem] tracking-brand text-gold">
                EXPLORE →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <h2 className="display text-5xl leading-none sm:text-7xl">
            NOT A TREND.
            <br />
            <span className="text-gold">A LEGACY.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
            VLXR is built in small, numbered runs for people who refuse to blend in. Heavyweight
            240GSM cotton, uncompromising cuts, and graphics that don't chase the feed. No mass
            production. No restocks.
          </p>
          <p className="mt-10 text-[0.6rem] tracking-brand text-chrome">EST. 2025</p>
        </div>
      </section>
    </>
  );
}
