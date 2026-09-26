import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

/**
 * Placeholder product visual until real photography is uploaded.
 * Renders a studio-style dark panel with the VLXR mark; `side` changes the
 * composition so front/back hover swaps read as two different views.
 */
export function ProductVisual({
  product,
  side = "front",
  className,
}: {
  product: Product;
  side?: "front" | "back";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-surface",
        className,
      )}
      aria-label={`${product.name} — ${side} view`}
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.08),transparent_65%)]" />
      {side === "front" ? (
        <div className="relative flex flex-col items-center gap-3">
          <span className="display text-4xl text-chrome sm:text-5xl">VLXR</span>
          <span className="text-[0.55rem] tracking-brand text-gold">
            {product.collection}
          </span>
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-2 px-6 text-center">
          <span className="display text-5xl text-gold sm:text-6xl">VLXR</span>
          <span className="text-[0.55rem] tracking-brand text-muted-foreground">BORN RARE</span>
          <span className="mt-2 text-[0.5rem] tracking-brand text-chrome">EST. 2025</span>
        </div>
      )}
      <span className="absolute bottom-3 right-3 text-[0.5rem] tracking-brand text-muted-foreground">
        {side}
      </span>
    </div>
  );
}
