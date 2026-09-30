import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — VLXR" },
      { name: "description", content: "Set a new password for your VLXR admin account." },
      { property: "og:title", content: "Reset Password — VLXR" },
      { property: "og:description", content: "Set a new VLXR admin password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/admin" });
  };
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display text-5xl">NEW PASSWORD</h1>
      <div className="hairline-gold mt-5" />
      <form onSubmit={submit} className="card-surface mt-10 p-6">
        <label className="block text-[0.6rem] tracking-brand text-muted-foreground">
          NEW PASSWORD
          <input type="password" required className="mt-2 w-full border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-gold" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn-base btn-gold mt-6 w-full" disabled={busy}>Update Password</button>
      </form>
    </div>
  );
}
