import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COLLECTIONS, PRODUCTS, type Collection, type Product } from "./products";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

type Row = {
  slug: string;
  name: string;
  collection: string;
  description: string;
  mrp: number;
  price: number;
  size_stock: unknown;
  badges: string[];
  front_image: string | null;
  back_image: string | null;
  extra_images: string[];
};

export function rowToProduct(r: Row): Product {
  const stock = (r.size_stock ?? {}) as Record<string, number>;
  const sizes = SIZE_ORDER.filter((s) => (stock[s] ?? 0) > 0);
  return {
    slug: r.slug,
    name: r.name,
    collection: r.collection as Collection,
    price: r.price,
    mrp: r.mrp,
    sizes,
    stock: Object.values(stock).reduce((a, b) => a + (Number(b) || 0), 0),
    badge: r.badges.includes("LIMITED") ? "LIMITED" : undefined,
    badges: r.badges,
    description: r.description,
    frontImage: r.front_image ?? undefined,
    backImage: r.back_image ?? undefined,
    extraImages: r.extra_images,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("slug,name,collection,description,mrp,price,size_stock,badges,front_image,back_image,extra_images")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error || !data) return PRODUCTS;
  return data.map(rowToProduct);
}

export const productsQuery = queryOptions({ queryKey: ["catalog"], queryFn: fetchProducts, staleTime: 30_000 });

export function useCatalog() {
  return useQuery(productsQuery).data ?? [];
}

export type CollectionRow = { id: string; title: string; description: string; banner_image: string | null; display_order: number; visible: boolean };
/** Visible collections ordered for the storefront; falls back to static list. */
export function useCollections() {
  const q = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("*").eq("visible", true).order("display_order");
      if (error) throw error;
      return data as CollectionRow[];
    },
  });
  return (q.data ?? COLLECTIONS.map((c, i) => ({ id: c.id, title: c.title, description: c.blurb, banner_image: null, display_order: i, visible: true }))).map((c) => ({
    id: c.id as Collection, title: c.title, blurb: c.description, banner: c.banner_image,
  }));
}
