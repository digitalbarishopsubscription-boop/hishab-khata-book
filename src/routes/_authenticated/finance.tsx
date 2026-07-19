import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "আর্থিক — হিসাব পত্র" }] }),
  component: FinancePage,
});

const bn = (n: number) => String(Math.round(n)).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function FinancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sales: 0, purchases: 0, expenses: 0, received: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [s, p, e, pay] = await Promise.all([
        supabase.from("sales" as any).select("total"),
        supabase.from("purchases" as any).select("total"),
        supabase.from("expenses").select("amount"),
        supabase.from("payments" as any).select("amount"),
      ]);
      const sum = (rows: any, key: string) => (rows.data ?? []).reduce((a: number, r: any) => a + Number(r[key] || 0), 0);
      setStats({
        sales: sum(s, "total"),
        purchases: sum(p, "total"),
        expenses: sum(e, "amount"),
        received: sum(pay, "amount"),
      });
      setLoading(false);
    })();
  }, [user]);

  const profit = stats.sales - stats.purchases - stats.expenses;
  const cashIn = stats.received;
  const cashOut = stats.purchases + stats.expenses;

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-display">আর্থিক সারসংক্ষেপ</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার ব্যবসার আয়-ব্যয় ও লাভের চিত্র</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Kpi icon={TrendingUp} label="মোট বিক্রয়" value={stats.sales} color="text-emerald-600" />
        <Kpi icon={TrendingDown} label="মোট ক্রয়" value={stats.purchases} color="text-rose-600" />
        <Kpi icon={Wallet} label="মোট খরচ" value={stats.expenses} color="text-amber-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">নগদ প্রবাহ</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="size-4 text-emerald-600" /> নগদ আসছে</div>
            <div className="text-2xl font-bold text-display mt-2 text-emerald-600">৳{bn(cashIn)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownRight className="size-4 text-rose-600" /> নগদ যাচ্ছে</div>
            <div className="text-2xl font-bold text-display mt-2 text-rose-600">৳{bn(cashOut)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">নিট লাভ / ক্ষতি</CardTitle></CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold text-display ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ৳{bn(Math.abs(profit))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {profit >= 0 ? "আপনার ব্যবসা লাভে চলছে" : "সাবধান — ব্যয় আয়ের চেয়ে বেশি"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`size-4 ${color}`} /> {label}</div>
      <div className="text-2xl font-bold text-display mt-2">৳{bn(value)}</div>
    </div>
  );
}
