import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Headset, Loader2, Send, X } from "lucide-react";
import { supportChat } from "@/lib/support.functions";

type Msg = { role: "user" | "assistant"; content: string };
const HELLO: Msg = { role: "assistant", content: "Hi! Main VLXR Care hoon. Size, delivery, payment ya order ke baare mein kuch bhi poochiye." };

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chat = useServerFn(supportChat);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await chat({ data: { messages: next.slice(1).slice(-20) } });
      setMsgs([...next, { role: "assistant", content: r.reply || r.error || "Sorry, try again." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Connection problem. WhatsApp karein: +91 8817830829." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Customer care chat"
        className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-primary-foreground shadow-lg"
      >
        {open ? <X className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed bottom-40 right-3 z-50 flex h-[60vh] max-h-[480px] w-[calc(100vw-1.5rem)] max-w-sm flex-col border border-gold/40 bg-background shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="display text-xl text-gold">VLXR CARE</p>
            <p className="text-[0.6rem] text-muted-foreground">AI support · WhatsApp for order issues</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto w-fit max-w-[85%] bg-foreground px-3 py-2 text-background" : "max-w-[90%] whitespace-pre-wrap text-foreground"}>
                {m.content}
              </div>
            ))}
            {busy && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex border-t border-border">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" maxLength={2000}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
            <button disabled={busy || !input.trim()} className="px-4 text-gold disabled:opacity-40" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
