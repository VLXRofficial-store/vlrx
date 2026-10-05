import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

const field = "mt-2 w-full border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-gold";

function Settings() {
  const { user } = Route.useRouteContext();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw) return toast.error("Enter your current password");
    if (newPw.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("New passwords do not match");
    if (newPw === oldPw) return toast.error("New password must be different from the old one");
    setBusy(true);
    // Verify the old password first.
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: oldPw });
    if (authErr) { setBusy(false); return toast.error("Current password is wrong"); }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    toast.success("Password changed");
  };

  return (
    <div className="max-w-md">
      <h1 className="display text-5xl">SETTINGS</h1>
      <p className="mt-2 text-sm text-muted-foreground">Admin account: {user.email} (only one admin is allowed)</p>
      <form onSubmit={change} className="card-surface mt-6 p-6">
        <h2 className="display text-2xl">CHANGE PASSWORD</h2>
        <label className="mt-4 block text-[0.6rem] tracking-brand text-muted-foreground">CURRENT PASSWORD
          <input type="password" className={field} value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
        </label>
        <label className="mt-4 block text-[0.6rem] tracking-brand text-muted-foreground">NEW PASSWORD
          <input type="password" className={field} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="mt-4 block text-[0.6rem] tracking-brand text-muted-foreground">CONFIRM NEW PASSWORD
          <input type="password" className={field} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
        </label>
        <button className="btn-base btn-gold mt-6 w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </div>
  );
}
