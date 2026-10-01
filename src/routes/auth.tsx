import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminSetupChecklist } from "@/components/AdminSetupChecklist";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login — VLXR" },
      { name: "description", content: "Sign in to the VLXR admin panel." },
      { property: "og:title", content: "Admin Login — VLXR" },
      { property: "og:description", content: "VLXR store admin sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        setPendingEmail(email);
        toast.error("Email not confirmed yet — open the link we emailed you, or resend it below.");
      } else if (/invalid login/i.test(error.message)) {
        toast.error("Wrong email or password. Use 'Forgot password?' to set a new one.");
      } else toast.error(error.message);
      return;
    }
    if (mode === "up") {
      setPendingEmail(email);
      toast.success("Account created. Check your email to confirm, then sign in.");
      setMode("in");
      return;
    }
    navigate({ to: "/admin" });
  };

  const field =
    "mt-2 w-full border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-gold";

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="display text-5xl">{mode === "in" ? "ADMIN LOGIN" : "CREATE ADMIN"}</h1>
      <div className="hairline-gold mt-5" />
      <form onSubmit={submit} className="card-surface mt-10 p-6">
        <label className="block text-[0.6rem] tracking-brand text-muted-foreground">
          EMAIL
          <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-5 block text-[0.6rem] tracking-brand text-muted-foreground">
          PASSWORD
          <input type="password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn-base btn-gold mt-6 w-full" disabled={busy}>
          {mode === "in" ? "Sign In" : "Create Account"}
        </button>
        <button type="button" className="mt-4 w-full text-xs text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "First time? Create admin account" : "Already have an account? Sign in"}
        </button>
        {mode === "in" && (
          <button
            type="button"
            className="mt-3 w-full text-xs text-gold underline"
            onClick={async () => {
              if (!email) { toast.error("Enter your email first"); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
              if (error) toast.error(error.message);
              else toast.success("Reset link sent — check your email.");
            }}
          >
            Forgot password?
          </button>
        )}
      </form>
      <div className="mt-6">
        <AdminSetupChecklist pendingEmail={pendingEmail} onCreateAccount={() => setMode("up")} />
      </div>
    </div>
  );
}
