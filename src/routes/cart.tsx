import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — VLXR" },
      { name: "description", content: "Review your VLXR pieces before checkout." },
      { property: "og:title", content: "Your Cart — VLXR" },
      { property: "og:description", content: "Review your VLXR pieces before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailed, subtotal, setQty, remove } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="display text-6xl">YOUR CART</h1>
      <div className="hairline-gold mt-5" />

      {detailed.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/shop" className="btn-base btn-gold-outline mt-6">
            Shop the drop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {detailed.map(({ line, product }) => (
              <div
                key={`${line.slug}-${line.size}`}
                className="card-surface grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 p-4"
              >
                <Link
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  className="h-24 w-22 shrink-0 overflow-hidden border border-border"
                  style={{ width: "5.5rem" }}
                >
                  <ProductVisual product={product} />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="mt-1 text-[0.6rem] tracking-brand text-gold">SIZE {line.size}</p>
                  <div className="mt-3 inline-flex items-center border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="p-2 text-chrome hover:text-gold"
                      onClick={() => setQty(line.slug, line.size, line.qty - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="p-2 text-chrome hover:text-gold"
                      onClick={() => setQty(line.slug, line.size, line.qty + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => remove(line.slug, line.size)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-chrome">
                    {formatINR(product.price * line.qty)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <aside className="card-surface h-fit p-6">
            <h2 className="display text-2xl">ORDER SUMMARY</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-xs text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="hairline-gold my-4" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-gold">{formatINR(subtotal)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-base btn-gold mt-7 w-full">
              Proceed to Checkout
            </Link>
            <Link
              to="/shop"
              className="mt-4 block text-center text-[0.6rem] tracking-brand text-muted-foreground hover:text-gold"
            >
              CONTINUE SHOPPING
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
