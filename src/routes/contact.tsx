import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Get In Touch — VLXR" },
      {
        name: "description",
        content:
          "Contact VLXR on WhatsApp, Instagram or email. Based in Agra, India. We reply within 24 hours.",
      },
      { property: "og:title", content: "Get In Touch — VLXR" },
      { property: "og:description", content: "WhatsApp, Instagram or email — we reply within 24 hours." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; email?: string; message?: string } = {};
    if (!form.name.trim() || form.name.length > 100) next.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.message.trim().length < 10 || form.message.length > 2000) next.message = "Tell us a little more (10–2000 chars)";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    });
    if (error) {
      toast.error("Could not send. Please try WhatsApp.");
      return;
    }
    toast.success("Message sent! We reply within 24 hours.");
    setForm({ name: "", email: "", message: "" });
  };

  const field =
    "mt-2 w-full border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gold";

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="display text-6xl sm:text-7xl">GET IN TOUCH</h1>
      <div className="hairline-gold mt-5" />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="card-surface p-6">
          <h2 className="display text-2xl">SEND A MESSAGE</h2>
          <label className="mt-6 block text-[0.6rem] tracking-brand text-muted-foreground">
            NAME *
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
          </label>
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}

          <label className="mt-5 block text-[0.6rem] tracking-brand text-muted-foreground">
            EMAIL *
            <input
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
            />
          </label>
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}

          <label className="mt-5 block text-[0.6rem] tracking-brand text-muted-foreground">
            MESSAGE *
            <textarea
              rows={5}
              className={field}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="How can we help?"
            />
          </label>
          {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}

          <button type="submit" className="btn-base btn-gold mt-7 w-full">
            Send
          </button>
          <p className="mt-4 text-[0.6rem] tracking-brand text-muted-foreground">
            WE REPLY WITHIN 24 HOURS
          </p>
        </form>

        <aside className="space-y-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="card-surface flex items-center gap-3 p-5 transition-colors hover:border-gold"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-gold" />
            <span className="min-w-0 text-xs tracking-brand uppercase">WhatsApp us</span>
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="card-surface flex items-center gap-3 p-5 transition-colors hover:border-gold"
          >
            <Instagram className="h-4 w-4 shrink-0 text-gold" />
            <span className="min-w-0 text-xs tracking-brand uppercase">@vlxr</span>
          </a>
          <div className="card-surface flex items-center gap-3 p-5">
            <Mail className="h-4 w-4 shrink-0 text-gold" />
            <span className="min-w-0 text-xs tracking-brand uppercase">Use the form</span>
          </div>
          <div className="card-surface flex items-center gap-3 p-5">
            <MapPin className="h-4 w-4 shrink-0 text-gold" />
            <span className="min-w-0 text-xs tracking-brand uppercase">Agra, India</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
