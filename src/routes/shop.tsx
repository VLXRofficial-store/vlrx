import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ALL_SIZES, COLLECTIONS, PRODUCTS, type Collection } from "@/lib/products";
import { cn } from "@/lib/utils";

type ShopSearch = { collection?: Collection };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    collection: ["HERITAGE", "STREET", "GENESIS"].includes(String(search.collection))
      ? (search.collection as Collection)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All Drops — Shop VLXR Premium Streetwear" },
      {
        name: "description",
        content:
          "Shop every VLXR drop: Heritage, Street and Genesis heavyweight 240GSM tees in sizes XS to XXL.",
      },
      { property: "og:title", content: "All Drops — Shop VLXR" },
      {
        property: "og:description",
        content: "Every VLXR drop in one place. Limited runs, 240GSM heavyweight cotton.",
      },
    ],
  }),
  component: Shop,
});

const PRICE_FILTERS = [
  { id: "all", label: "All Prices", test: () => true },
  { id: "low", label: "Under ₹2,500", test: (p: number) => p < 2500 },
  { id: "high", label: "₹2,500+", test: (p: number) => p >= 2500 },
] as const;

function Shop() {
  const { collection: initialCollection } = Route.useSearch();
  const [collection, setCollection] = useState<Collection | "ALL">(initialCollection ?? "ALL");
  const [size, setSize] = useState<string | "ALL">("ALL");
  const [price, setPrice] = useState<(typeof PRICE_FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    const priceTest = PRICE_FILTERS.find((f) => f.id === price)!.test;
    return PRODUCTS.filter(
      (p) =>
        (collection === "ALL" || p.collection === collection) &&
        (size === "ALL" || p.sizes.includes(size)) &&
        priceTest(p.price),
    );
  }, [collection, size, price]);

  const chip = (active: boolean) =>
    cn(
      "border px-3 py-1.5 text-[0.6rem] font-semibold tracking-brand uppercase transition-colors",
      active
        ? "border-gold bg-gold text-primary-foreground"
        : "border-border text-muted-foreground hover:border-gold hover:text-gold",
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <h1 className="display text-6xl sm:text-7xl">ALL DROPS</h1>
      <div className="hairline-gold mt-5" />

      <div className="mt-10 space-y-5">
        <div>
          <p className="mb-2 text-[0.55rem] tracking-brand text-gold">COLLECTION</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(collection === "ALL")} onClick={() => setCollection("ALL")}>
              All
            </button>
            {COLLECTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={chip(collection === c.id)}
                onClick={() => setCollection(c.id)}
              >
                {c.id}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.55rem] tracking-brand text-gold">SIZE</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(size === "ALL")} onClick={() => setSize("ALL")}>
              All
            </button>
            {ALL_SIZES.map((s) => (
              <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.55rem] tracking-brand text-gold">PRICE</p>
          <div className="flex flex-wrap gap-2">
            {PRICE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={chip(price === f.id)}
                onClick={() => setPrice(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Nothing matches those filters yet.
        </p>
      )}
    </div>
  );
}
