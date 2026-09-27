import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductVisual } from "./ProductVisual";
import { useCart } from "@/lib/cart";
import { formatINR, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [hover, setHover] = useState(false);
  const soldOut = product.stock === 0;

  const quickAdd = () => {
    const size = product.sizes.includes("L") ? "L" : (product.sizes[0] ?? "M");
    add(product.slug, size);
    toast.success(`${product.name} (${size}) added to cart`);
  };

  return (
    <div
      className="group card-surface flex flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        <ProductVisual product={product} side={hover ? "back" : "front"} />
        {product.badge && (
          <span className="absolute left-3 top-3 border border-gold px-2 py-1 text-[0.55rem] font-bold tracking-brand text-gold">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-background/75">
            <span className="display text-2xl tracking-brand text-chrome">SOLD OUT</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className="text-[0.55rem] tracking-brand text-gold">{product.collection}</span>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="text-sm font-medium text-foreground transition-colors hover:text-gold"
        >
          {product.name}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {product.sizes.map((s) => (
            <span
              key={s}
              className="border border-border px-1.5 py-0.5 text-[0.55rem] tracking-widest text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="mt-auto text-sm font-semibold text-chrome">{formatINR(product.price)}</p>
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          className="btn-base btn-gold-outline w-full"
        >
          {soldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
