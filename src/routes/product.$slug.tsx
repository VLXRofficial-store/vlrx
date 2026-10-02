import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductVisual } from "@/components/ProductVisual";
import { SizeGuideDialog } from "@/components/SizeGuideDialog";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { productsQuery } from "@/lib/catalog";
import { PriceBlock } from "@/components/PriceBlock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const all = await context.queryClient.ensureQueryData(productsQuery);
    const product = all.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product unavailable — VLXR" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const description = `${product.name} — ${product.collection}. 240GSM heavyweight cotton, oversized fit. ${formatINR(product.price)}.`;
    return {
      meta: [
        { title: `${product.name} — VLXR` },
        { name: "description", content: description },
        { property: "og:title", content: `${product.name} — VLXR` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const navigate = useNavigate();
  const [side, setSide] = useState<"front" | "back">("front");
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    if (!size) {
      toast.error("Select a size first");
      return;
    }
    add(product.slug, size, qty);
    toast.success(`${product.name} (${size} ×${qty}) added to cart`);
    return true;
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* IMAGE */}
        <div>
          <button
            type="button"
            onClick={() => setZoom((v) => !v)}
            className="block aspect-[4/5] w-full overflow-hidden border border-border"
            aria-label="Zoom image"
          >
            <ProductVisual
              product={product}
              side={side}
              className={cn("transition-transform duration-500", zoom && "scale-150")}
            />
          </button>
          <div className="mt-4 flex gap-2">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "border px-4 py-2 text-[0.6rem] font-semibold tracking-brand uppercase transition-colors",
                  side === s
                    ? "border-gold text-gold"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
            <span className="ml-auto self-center text-[0.55rem] tracking-brand text-muted-foreground">
              TAP IMAGE TO ZOOM
            </span>
          </div>
        </div>

        {/* DETAILS */}
        <div>
          <p className="text-[0.6rem] tracking-brand text-gold">VLXR / DROP 001</p>
          <h1 className="display mt-3 text-5xl uppercase sm:text-6xl">{product.name}</h1>
          <p className="mt-2 text-sm text-gold">★★★★★ <span className="text-muted-foreground">4.9/5</span></p>
          <div className="mt-5">
            <PriceBlock price={product.price} mrp={product.mrp} size="lg" />
          </div>
          <div className="hairline-gold my-7" />

          <div className="flex items-center justify-between">
            <p className="text-[0.6rem] tracking-brand text-muted-foreground">SELECT SIZE</p>
            <SizeGuideDialog
              trigger={
                <button type="button" className="text-[0.6rem] tracking-brand text-gold underline">
                  SIZE GUIDE
                </button>
              }
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["XS", "S", "M", "L", "XL", "XXL"].map((s) => {
              const available = product.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  onClick={() => setSize(s)}
                  className={cn(
                    "h-11 w-13 min-w-11 border text-xs font-semibold tracking-widest transition-colors",
                    size === s
                      ? "border-gold text-gold"
                      : "border-border text-muted-foreground hover:border-chrome hover:text-foreground",
                    !available && "cursor-not-allowed opacity-30 line-through",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="text-[0.6rem] tracking-brand text-muted-foreground">QUANTITY</p>
            <div className="mt-3 inline-flex items-center border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="p-3 text-chrome hover:text-gold"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="p-3 text-chrome hover:text-gold"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleAdd} className="btn-base btn-silver flex-1">
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => {
                if (handleAdd()) navigate({ to: "/checkout" });
              }}
              className="btn-base btn-gold flex-1"
            >
              Buy Now
            </button>
          </div>

          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="desc">
              <AccordionTrigger className="text-xs tracking-brand uppercase">
                Description
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fabric">
              <AccordionTrigger className="text-xs tracking-brand uppercase">Fabric</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                240GSM heavyweight cotton.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-xs tracking-brand uppercase">
                Care Instructions
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Cold wash, no bleach. Dry in shade, iron inside out.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ship">
              <AccordionTrigger className="text-xs tracking-brand uppercase">Shipping</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Delivered in 8–9 working days. Free delivery inside Agra city.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Link to="/shop" className="mt-8 inline-block text-[0.6rem] tracking-brand text-gold">
            ← BACK TO ALL DROPS
          </Link>
        </div>
      </div>
    </div>
  );
}
