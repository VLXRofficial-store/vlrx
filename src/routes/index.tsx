import { createFileRoute, Link } from "@tanstack/react-router";
import { Marquee } from "@/components/Marquee";
import { PriceBlock } from "@/components/PriceBlock";
import { ArrowRight, CreditCard, Package, Truck } from "lucide-react";
import { Marquee } from "@/components/Marquee";
import { PriceBlock } from "@/components/PriceBlock";
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--gold)_16%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-7xl py-20">
          <p className="text-[0.6rem] tracking-brand text-gold">VLXR / DROP 001 — EST. 2025</p>
          <h1 className="display mt-6 text-6xl leading-[0.9] sm:text-8xl lg:text-9xl">
            BORN TO STAND OUT.
            <br />
            <span className="text-gold">NOT FIT IN.</span>
          </h1>
          <p className="mt-6 max-w-md text-base font-light italic text-muted-foreground">
            Premium oversized streetwear for those who don't follow.
          </p>
          <div className="mt-8">
            <p className="mb-2 text-[0.6rem] tracking-brand text-muted-foreground">DROP PRICE</p>
            <PriceBlock price={1999} mrp={2499} size="lg" />
          </div>
          <div className="mt-10">
            <Link
              to="/shop"
              className="btn-base border border-foreground bg-foreground font-bold text-background hover:bg-gold hover:border-gold"
            >
              GET THE DROP <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Marquee
        className="border-y border-border bg-surface"
        items={["BORN RARE", "FEAR NONE", "VLXR", "DROP 001", "LIMITED PIECES", "WEAR DIFFERENT"]}
      />

      {/* NEW DROP */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-4xl sm:text-6xl">DROP 001 — LIVE NOW</h2>
          <Link to="/shop" className="text-[0.6rem] tracking-brand text-gold hover:underline">
            VIEW ALL
          </Link>
        </div>
        <div className="hairline-gold mt-5" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
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

      {/* BRAND STATEMENT */}
      <section className="flex min-h-[70vh] items-center justify-center border-y border-border px-5 text-center">
        <div>
          <p className="display text-5xl font-light italic leading-tight sm:text-7xl">
            Your statement
            <br />
            <span className="text-gold">before you say a word.</span>
          </p>
          <p className="mt-10 text-[0.6rem] tracking-brand text-muted-foreground">VLXR — EST. 2025</p>
        </div>
      </section>

      {/* DELIVERY INFO */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:grid-cols-3">
        {[
          { icon: Truck, title: "FREE DELIVERY", sub: "Agra City Only" },
          { icon: Package, title: "8-9 WORKING DAYS", sub: "Estimated Delivery" },
          { icon: CreditCard, title: "ONLINE PAYMENT", sub: "UPI Only — No COD" },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <Icon className="h-7 w-7 text-gold" />
            <p className="mt-4 text-sm font-bold tracking-brand">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>
    </>
  );
}
