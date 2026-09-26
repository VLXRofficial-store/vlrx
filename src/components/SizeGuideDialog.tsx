import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SIZE_CHART } from "@/lib/products";

export function SizeGuideDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display text-3xl text-foreground">SIZE GUIDE</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[0.6rem] tracking-brand text-gold">
                <th className="py-3 pr-4 font-semibold">SIZE</th>
                <th className="py-3 pr-4 font-semibold">CHEST</th>
                <th className="py-3 pr-4 font-semibold">LENGTH</th>
                <th className="py-3 font-semibold">SHOULDER</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-semibold text-chrome">{row.size}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.chest}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.length}</td>
                  <td className="py-3 text-muted-foreground">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Oversized fit. Size down if you prefer a regular fit.
        </p>
      </DialogContent>
    </Dialog>
  );
}
