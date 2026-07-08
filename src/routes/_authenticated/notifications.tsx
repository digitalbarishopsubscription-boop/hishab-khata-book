import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Loader2, Check, Trash2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "নোটিফিকেশন — হিসাব" }] }),
  component: NotificationsPage,
});

type Notif = { id: string; title: string; body: string | null; kind: string; read: boolean; created_at: string };

function NotificationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("notifications" as any).select("*").order("created_at", { ascending: false });
    setLoading(false);
    setRows((data as any) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ read: true }).eq("id", id);
    load();
  };
  const markAll = async () => {
    await supabase.from("notifications" as any).update({ read: true }).eq("read", false);
    toast.success("সব পঠিত হিসেবে চিহ্নিত");
    load();
  };
  const del = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    load();
  };

  const unread = rows.filter((r) => !r.read).length;
  const bn = (n: number) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display flex items-center gap-2">
            <Bell className="size-6 text-primary" /> নোটিফিকেশন
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{bn(unread)} টি অপঠিত</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={markAll}><Check className="size-4" /> সব পঠিত</Button>}
      </header>

      {loading ? <div className="py-16 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
      : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          <Bell className="size-10 mx-auto mb-3 opacity-40" />
          কোনো নোটিফিকেশন নেই
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => {
            const Icon = n.kind === "warning" ? AlertTriangle : n.kind === "success" ? CheckCircle2 : Info;
            const color = n.kind === "warning" ? "text-amber-600" : n.kind === "success" ? "text-emerald-600" : "text-primary";
            return (
              <div key={n.id} className={`rounded-lg border p-3 flex gap-3 ${n.read ? "bg-muted/30" : "bg-card"}`}>
                <Icon className={`size-5 shrink-0 ${color} mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("bn-BD")}</div>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.read && <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}><Check className="size-4" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => del(n.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
