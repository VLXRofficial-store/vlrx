import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, getAdminSetupState } from "@/lib/orders.functions";
import { cn } from "@/lib/utils";

type Props = {
  /** Email that tried to sign in but is not confirmed yet (from the login form). */
  pendingEmail?: string | null;
  /** Called when the user should go to the create-account form. */
  onCreateAccount?: () => void;
};

export function AdminSetupChecklist({ pendingEmail, onCreateAccount }: Props) {
  const qc = useQueryClient();
  const claim = useServerFn(claimAdmin);
  const fetchState = useServerFn(getAdminSetupState);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      setConfirmed(!!data.user?.email_confirmed_at);
      setReady(true);
    });
  }, []);

  const setup = useQuery({ queryKey: ["admin-setup-state"], queryFn: () => fetchState() });
  const role = useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: userId!, _role: "admin" });
      return !!data;
    },
  });

  const signedIn = !!userId;
  const isAdmin = role.data === true;
  const emailDone = signedIn && confirmed;
  const adminTaken = setup.data?.adminExists === true && !isAdmin;

  const resend = async () => {
    const target = pendingEmail || email;
    if (!target) { toast.error("Enter your email in the form first"); return; }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent — check inbox and spam.");
  };

  const doClaim = async () => {
    setBusy(true);
    const r = await claim();
    setBusy(false);
    if (r.ok) {
      toast.success("You are now the admin");
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["admin-setup-state"] });
    } else if (r.reason === "taken") toast.error("An admin already exists for this store.");
    else toast.error("Could not claim admin. Please try again.");
  };

  if (!ready) return null;

  const steps = [
    {
      done: signedIn || !!pendingEmail,
      title: "Create your admin account",
      detail: signedIn ? `Signed in as ${email}` : pendingEmail ? `Account found: ${pendingEmail}` : "Use your own real email.",
    },
    {
      done: emailDone,
      title: "Confirm your email",
      detail: emailDone ? "Email confirmed" : "Click the link we emailed you, then sign in.",
    },
    {
      done: isAdmin,
      title: "Claim admin access",
      detail: isAdmin ? "You are the store admin" : adminTaken ? "Another account is already the admin." : "One click — only the first account can claim it.",
    },
  ];

  let next: React.ReactNode = null;
  if (isAdmin) {
    next = <Link to="/admin" className="btn-base btn-gold w-full">Open Admin Panel</Link>;
  } else if (!signedIn && !pendingEmail) {
    next = (
      <button type="button" className="btn-base btn-gold w-full" onClick={onCreateAccount}>
        Next: Create account
      </button>
    );
  } else if (!emailDone) {
    next = (
      <button type="button" className="btn-base btn-gold w-full" onClick={resend}>
        Next: Resend confirmation email
      </button>
    );
  } else if (!adminTaken) {
    next = (
      <button type="button" className="btn-base btn-gold w-full" onClick={doClaim} disabled={busy}>
        {busy ? "Claiming..." : "Next: Claim Admin Access"}
      </button>
    );
  }

  return (
    <div className="card-surface p-6">
      <p className="text-[0.6rem] font-semibold tracking-brand text-gold uppercase">Admin setup checklist</p>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                s.done ? "border-success bg-success text-background" : "border-border text-muted-foreground",
              )}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", s.done ? "text-foreground" : "text-muted-foreground")}>
                {i + 1}. {s.title}
              </p>
              <p className="text-xs text-muted-foreground">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {next && <div className="mt-6">{next}</div>}
    </div>
  );
}
