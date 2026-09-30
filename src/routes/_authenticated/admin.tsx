import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin } from "@/lib/orders.functions";
import { draftReply } from "@/lib/reply.functions";
import { formatINR } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — VLXR" },
      { name: "description", content: "Manage VLXR orders and messages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const STATUSES = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];
type Item = { name: string; size: string; qty: number; price: number };

function Admin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const claim = useServerFn(claimAdmin);
  const [tab, setTab] = useState<"orders" | "messages">("orders");

  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
  });
  const orders = useQuery({
    queryKey: ["orders"],
    enabled: role.data === true,
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const messages = useQuery({
    queryKey: ["messages"],
    enabled: role.data === true,
    queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  if (role.isLoading) return <p className="px-5 py-20 text-center text-muted-foreground">Loading…</p>;

  if (!role.data)
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="display text-4xl">NOT AN ADMIN</h1>
        <p className="mt-4 text-sm text-muted-foreground">Signed in as {user.email}. If this is the first setup, claim admin access.</p>
        <button
          className="btn-base btn-gold mt-6 w-full"
          onClick={async () => {
            const r = await claim();
            if (r.ok) {
              toast.success("You are now the admin");
              qc.invalidateQueries({ queryKey: ["is-admin"] });
            } else toast.error("An admin already exists.");
          }}
        >
          Claim Admin Access
        </button>
        <button className="mt-4 text-xs underline text-muted-foreground" onClick={signOut}>Sign out</button>
      </div>
    );

  const revenue = (orders.data ?? []).filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.subtotal, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-5xl">ADMIN</h1>
        <button className="btn-base btn-silver" onClick={signOut}>Sign out</button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Orders" value={String(orders.data?.length ?? 0)} />
        <Stat label="Revenue" value={formatINR(revenue)} />
        <Stat label="Messages" value={String(messages.data?.length ?? 0)} />
      </div>
      <div className="mt-8 flex gap-6 border-b border-border">
        {(["orders", "messages"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("pb-3 text-xs font-semibold tracking-brand uppercase", tab === t ? "border-b-2 border-gold text-gold" : "text-muted-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {orders.data?.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
          {orders.data?.map((o) => (
            <div key={o.id} className="card-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">#{o.order_code} · {formatINR(o.subtotal)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")} · {o.payment_method.toUpperCase()}</p>
                </div>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="border border-input bg-surface px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <p className="mt-3 text-sm">{o.name} · {o.phone} · {o.email}</p>
              <p className="text-sm text-muted-foreground">{o.address}, {o.area}, {o.city}, {o.state} – {o.pincode}</p>
              <ul className="mt-2 text-sm text-muted-foreground">
                {(o.items as Item[]).map((i, k) => <li key={k}>{i.name} · {i.size} × {i.qty}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <div className="mt-6 space-y-4">
          {messages.data?.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
          {messages.data?.map((m) => (
            <MessageCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ m }: { m: { id: string; name: string; email: string; message: string; created_at: string } }) {
  const draft = useServerFn(draftReply);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const make = async () => {
    setBusy(true);
    try { setReply((await draft({ data: { name: m.name, message: m.message } })).reply); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not draft reply"); }
    setBusy(false);
  };
  return (
    <div className="card-surface p-5">
      <p className="font-bold">{m.name} <span className="text-xs font-normal text-muted-foreground">· {m.email} · {new Date(m.created_at).toLocaleString("en-IN")}</span></p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
      <button className="btn-base btn-gold mt-4" onClick={make} disabled={busy}>{busy ? "Drafting..." : "✦ Draft Reply"}</button>
      {reply && (
        <>
          <textarea className="mt-4 h-40 w-full border border-input bg-surface p-3 text-sm text-foreground" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="mt-2 flex gap-3">
            <a className="btn-base btn-silver" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Your message to VLXR")}&body=${encodeURIComponent(reply)}`}>Send via Email</a>
            <button className="btn-base btn-silver" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copied"); }}>Copy</button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-[0.6rem] tracking-brand text-muted-foreground uppercase">{label}</p>
      <p className="display mt-1 text-2xl text-gold">{value}</p>
    </div>
  );
}
