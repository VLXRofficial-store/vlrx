import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BarChart3, Bell, Home, Image, Layers, LogOut, MessageSquare, Package, Settings, Shirt, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSetupChecklist } from "@/components/AdminSetupChecklist";
import { useMessages, useOrders } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — VLXR" },
      { name: "description", content: "Manage VLXR products, orders and messages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: Home, exact: true },
  { to: "/admin/products", label: "Products", icon: Shirt },
  { to: "/admin/orders", label: "Orders", icon: Package },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/media", label: "Media", icon: Image },
  { to: "/admin/collections", label: "Collections", icon: Layers },
  { to: "/admin/discounts", label: "Discounts", icon: Tag },
  { to: "/admin/notifications", label: "Alerts", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  // Auto logout after 2 hours without activity
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(t); t = setTimeout(signOut, 2 * 60 * 60 * 1000); };
    reset();
    window.addEventListener("click", reset);
    window.addEventListener("keydown", reset);
    return () => { clearTimeout(t); window.removeEventListener("click", reset); window.removeEventListener("keydown", reset); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (role.isLoading) return <p className="px-5 py-20 text-center text-muted-foreground">Loading…</p>;
  if (!role.data)
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="display text-4xl">NOT AN ADMIN</h1>
        <p className="mt-4 text-sm text-muted-foreground">Signed in as {user.email}. Finish the steps below to get admin access.</p>
        <div className="mt-6 text-left"><AdminSetupChecklist /></div>
        <button className="mt-4 text-xs text-muted-foreground underline" onClick={signOut}>Sign out</button>
      </div>
    );

  return <Shell onSignOut={signOut} />;
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
  const orders = useOrders();
  const messages = useMessages();
  const badges: Record<string, number> = {
    "/admin/orders": (orders.data ?? []).filter((o) => o.status === "placed").length,
    "/admin/messages": (messages.data ?? []).filter((m) => m.status === "new").length,
  };
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-5 pb-24 pt-8 lg:pb-12">
      <aside className="hidden w-52 shrink-0 lg:block">
        <p className="display text-3xl text-gold">VLXR ADMIN</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "!border-gold !text-gold" }}>
              <n.icon className="h-4 w-4" /> {n.label}
              {badges[n.to] ? <span className="ml-auto bg-gold px-1.5 text-[0.6rem] font-bold text-primary-foreground">{badges[n.to]}</span> : null}
            </Link>
          ))}
          <button onClick={onSignOut} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border bg-background lg:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }}
            className="relative flex min-w-[68px] flex-1 flex-col items-center gap-1 py-2 text-[0.55rem] text-muted-foreground"
            activeProps={{ className: "!text-gold" }}>
            <n.icon className="h-5 w-5" />{n.label}
            {badges[n.to] ? <span className="absolute right-3 top-1 bg-gold px-1 text-[0.5rem] font-bold text-primary-foreground">{badges[n.to]}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
