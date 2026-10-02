import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUSES = [
  { id: "placed", label: "Pending" },
  { id: "confirmed", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
] as const;
export const statusLabel = (s: string) => ORDER_STATUSES.find((x) => x.id === s)?.label ?? s;

export const BADGES = ["LIMITED", "NEW DROP", "BESTSELLER", "SOLD OUT", "TRENDING", "COMING SOON"];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export type OrderItem = { slug?: string; name: string; size: string; qty: number; price: number };

export function useOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
export function useMessages() {
  return useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export const totalStock = (s: unknown) =>
  Object.values((s ?? {}) as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0);

export const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();

export async function uploadProductImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
  if (!/image\/(jpeg|png|webp)/.test(file.type)) throw new Error("Only JPG, PNG or WEBP");
  const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, "-")}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Upload failed: " + error.message);
  const { data, error: e2 } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw new Error("Could not get image link");
  return data.signedUrl;
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}
