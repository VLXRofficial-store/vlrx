import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, type Product } from "./products";

export type CartLine = {
  slug: string;
  size: string;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  detailed: { line: CartLine; product: Product }[];
  count: number;
  subtotal: number;
  add: (slug: string, size: string, qty?: number) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "vlxr-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const detailed = lines
      .map((line) => ({ line, product: PRODUCTS.find((p) => p.slug === line.slug) }))
      .filter((entry): entry is { line: CartLine; product: Product } => Boolean(entry.product));

    return {
      lines,
      detailed,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: detailed.reduce((sum, e) => sum + e.product.price * e.line.qty, 0),
      add: (slug, size, qty = 1) =>
        setLines((prev) => {
          const found = prev.find((l) => l.slug === slug && l.size === size);
          if (found) {
            return prev.map((l) => (l === found ? { ...l, qty: Math.min(l.qty + qty, 10) } : l));
          }
          return [...prev, { slug, size, qty }];
        }),
      setQty: (slug, size, qty) =>
        setLines((prev) =>
          prev
            .map((l) =>
              l.slug === slug && l.size === size ? { ...l, qty: Math.max(0, Math.min(qty, 10)) } : l,
            )
            .filter((l) => l.qty > 0),
        ),
      remove: (slug, size) =>
        setLines((prev) => prev.filter((l) => !(l.slug === slug && l.size === size))),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
