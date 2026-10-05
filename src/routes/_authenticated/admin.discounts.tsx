import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDiscounts, useOrders } from "@/lib/admin";
import { formatINR } from "@/lib/products";
import { Stat } from "./admin.index";

export const Route = createFileRoute("/_authenticated/admin/discounts")({ component: Discounts });

const field = "w-full border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-gold";
const EMPTY = { code: "", kind: "percent", value: 10, min_order: 0, max_uses: "", expires_at: "" };

function Discounts() {
  const q = useDiscounts();
  const orders = useOrders().data ?? [];
  const qc = useQueryClient();
  const [f, setF] = useState(EMPTY);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-discounts"] });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) { toast.error("Code: 3-30 letters/numbers"); return; }
    if (f.value <= 0 || (f.kind === "percent" && f.value > 90)) { toast.error("Percent must be 1-90"); return; }
    const { error } = await supabase.from("discount_codes").insert({
      code, kind: f.kind, value: f.value, min_order: f.min_order,
      max_uses: f.max_uses ? Number(f.max_uses) : null,
      expires_at: f.expires_at ? new Date(f.expires_at + "T23:59:59").toISOString() : null,
    });
    if (error) { toast.error(error.code === "23505" ? "Code already exists" : error.message); return; }
    toast.success("Code created");
    setF(EMPTY);
    refresh();
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  const used = orders.filter((o) => o.discount_code && o.status !== "cancelled");
  const codes = q.data ?? [];
  const top = [...codes].sort((a, b) => b.used_count - a.used_count)[0];

  return (
    <div>
      <h1 className="display text-5xl">DISCOUNT CODES</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Most used" value={top && top.used_count ? `${top.code} (${top.used_count})` : "—"} />
        <Stat label="Revenue from discounted orders" value={formatINR(used.reduce((s, o) => s + o.subtotal, 0))} />
        <Stat label="Total savings given" value={formatINR(used.reduce((s, o) => s + o.discount_amount, 0))} />
      </div>

      <form onSubmit={create} className="card-surface mt-6 grid gap-3 p-4 sm:grid-cols-3">
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">CODE<input className={field} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="DROP10" /></label>
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">TYPE
          <select className={field} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="percent">Percentage %</option><option value="fixed">Fixed ₹</option>
          </select>
        </label>
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">VALUE {f.kind === "percent" ? "(%)" : "(₹)"}<input type="number" min={1} className={field} value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></label>
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">MIN ORDER (₹)<input type="number" min={0} className={field} value={f.min_order} onChange={(e) => setF({ ...f, min_order: Number(e.target.value) })} /></label>
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">USAGE LIMIT (blank = unlimited)<input type="number" min={1} className={field} value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} /></label>
        <label className="text-[0.6rem] tracking-brand text-muted-foreground">EXPIRY DATE<input type="date" className={field} value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></label>
        <button className="btn-base btn-gold sm:col-span-3">Create code</button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[0.6rem] tracking-brand text-muted-foreground uppercase">
            <tr><th className="py-2">Code</th><th>Discount</th><th>Min</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {codes.map((d) => {
              const expired = d.expires_at && new Date(d.expires_at) < new Date();
              return (
                <tr key={d.id} className="border-t border-border">
                  <td className="py-3 font-bold text-gold">{d.code}</td>
                  <td>{d.kind === "percent" ? `${d.value}%` : formatINR(d.value)}</td>
                  <td>{formatINR(d.min_order)}</td>
                  <td>{d.used_count}</td>
                  <td>{d.max_uses == null ? "∞" : Math.max(0, d.max_uses - d.used_count)}</td>
                  <td className={expired ? "text-destructive" : "text-muted-foreground"}>{d.expires_at ? new Date(d.expires_at).toLocaleDateString("en-IN") : "Never"}</td>
                  <td>
                    <button onClick={() => toggle(d.id, !d.active)} className={d.active ? "text-success" : "text-muted-foreground"}>
                      {d.active ? "● Active" : "○ Inactive"}
                    </button>
                  </td>
                  <td><button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => del(d.id)}>Delete</button></td>
                </tr>
              );
            })}
            {codes.length === 0 && <tr><td colSpan={8} className="py-6 text-muted-foreground">No codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
