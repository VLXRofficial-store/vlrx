import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { draftReply } from "@/lib/reply.functions";
import { isToday, useMessages } from "@/lib/admin";
import { Stat } from "./admin.index";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: Messages,
});

const TEMPLATES = [
  "Hi! Your order is being processed and will be shipped soon. — Team VLXR",
  "Hi! Your order has been shipped. You can track it on our Track Order page. — Team VLXR",
  "Hi! Please share your order ID so we can check this for you. — Team VLXR",
  "Thanks for reaching out! We will contact you within 24 hours. — Team VLXR",
];

type Msg = { id: string; name: string; email: string; message: string; created_at: string; status: string; note: string };

function Messages() {
  const { data = [] } = useMessages();
  const [filter, setFilter] = useState("all");
  const list = data.filter((m) => filter === "all" || m.status === filter);
  return (
    <div>
      <h1 className="display text-5xl">MESSAGES</h1>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Unread" value={data.filter((m) => m.status === "new").length} />
        <Stat label="Pending reply" value={data.filter((m) => m.status === "read").length} />
        <Stat label="Resolved today" value={data.filter((m) => m.status === "resolved" && isToday(m.created_at)).length} />
      </div>
      <div className="mt-6 flex gap-4 border-b border-border">
        {["all", "new", "read", "resolved"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={cn("pb-3 text-xs font-semibold tracking-brand uppercase", filter === t ? "border-b-2 border-gold text-gold" : "text-muted-foreground")}>{t}</button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {list.map((m) => <MessageCard key={m.id} m={m} />)}
        {list.length === 0 && <p className="text-muted-foreground">No messages.</p>}
      </div>
    </div>
  );
}

function MessageCard({ m }: { m: Msg }) {
  const qc = useQueryClient();
  const draft = useServerFn(draftReply);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState(m.note);
  const [busy, setBusy] = useState(false);
  const update = async (patch: Partial<Msg>) => {
    const { error } = await supabase.from("contact_messages").update(patch).eq("id", m.id);
    if (error) toast.error("Could not update"); else qc.invalidateQueries({ queryKey: ["admin-messages"] });
  };
  const make = async () => {
    setBusy(true);
    try { setReply((await draft({ data: { name: m.name, message: m.message } })).reply); if (m.status === "new") update({ status: "read" }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not draft reply"); }
    setBusy(false);
  };
  const dot = m.status === "new" ? "🔴" : m.status === "read" ? "🟡" : "🟢";
  return (
    <div className="card-surface p-5">
      <p className="font-bold">{dot} {m.status.toUpperCase()} · {m.name} <span className="text-xs font-normal text-muted-foreground">· {m.email} · {new Date(m.created_at).toLocaleString("en-IN")}</span></p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-base btn-gold" onClick={make} disabled={busy}>{busy ? "Drafting..." : "✦ AI Draft Reply"}</button>
        <select className="border border-input bg-surface px-2 text-xs" defaultValue="" onChange={(e) => e.target.value && setReply(e.target.value)}>
          <option value="">Quick template…</option>{TEMPLATES.map((t) => <option key={t} value={t}>{t.slice(0, 40)}…</option>)}
        </select>
        {m.status === "new" && <button className="btn-base btn-silver" onClick={() => update({ status: "read" })}>Mark read</button>}
        {m.status !== "resolved" && <button className="btn-base btn-silver" onClick={() => update({ status: "resolved" })}>Resolve</button>}
      </div>
      {reply && (
        <>
          <textarea className="mt-4 h-40 w-full border border-input bg-surface p-3 text-sm text-foreground" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="mt-2 flex gap-3">
            <a className="btn-base btn-silver" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Your message to VLXR")}&body=${encodeURIComponent(reply)}`}>Send via Email</a>
            <button className="btn-base btn-silver" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copied"); }}>Copy</button>
          </div>
        </>
      )}
      <div className="mt-4 flex gap-2">
        <input className="flex-1 border border-input bg-surface px-3 py-2 text-xs text-foreground" placeholder="Internal note (only admins see this)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-base btn-silver" onClick={() => { update({ note }); toast.success("Note saved"); }}>Save note</button>
      </div>
    </div>
  );
}
