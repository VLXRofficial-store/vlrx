import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") {
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
      </form>
    </div>
  );
}
