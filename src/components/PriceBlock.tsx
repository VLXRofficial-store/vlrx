import { formatINR } from "@/lib/products";
import { cn } from "@/lib/utils";

export function PriceBlock({ price, mrp, size = "sm" }: { price: number; mrp: number; size?: "sm" | "lg" }) {
  const save = mrp - price;
  return (
    <div className={cn("flex flex-wrap items-center", size === "lg" ? "gap-3" : "gap-2")}>
      <span className={cn("text-destructive line-through", size === "lg" ? "text-lg" : "text-xs")}>
        {formatINR(mrp)}
      </span>
      <span className={cn("font-bold text-foreground", size === "lg" ? "display text-5xl" : "text-base")}>
        {formatINR(price)}
      </span>
      {save > 0 && (
        <span
          className={cn(
            "rounded-full bg-success/15 font-bold text-success",
            size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[0.55rem]",
          )}
        >
          ✦ YOU SAVE {formatINR(save)}
        </span>
      )}
    </div>
  );
}
