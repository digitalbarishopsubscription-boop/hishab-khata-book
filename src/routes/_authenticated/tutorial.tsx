import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Loader2, TrendingUp, Users, Package, ShoppingCart, Receipt, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/tutorial")({
  head: () => ({
    meta: [
      { title: "CEO কন্ট্রোল — হিসাব পত্র" },
      { name: "description", content: "পুরো ব্যবসার উচ্চস্তরের নিয়ন্ত্রণ ও সূচক এক জায়গায়।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: CeoPage,
});

const bn = (n: number) => String(Math.round(n)).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function CeoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [k, setK] = useState({ sales: 0, purchases: 0, expenses: 0, customers: 0, products: 0, employees: 0, branches: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [s, p, e, c, pr, em, br] = await Promise.all([
        supabase.from("sales" as any).select("total"),
        supabase.from("purchases" as any).select("total"),
        supabase.from("expenses").select("amount"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("products" as any).select("id", { count: "exact", head: true }),
        supabase.from("employees" as any).select("id", { count: "exact", head: true }),
        supabase.from("branches" as any).select("id", { count: "exact", head: true }),
      ]);
      const sum = (r: any, key: string) => (r.data ?? []).reduce((a: number, x: any) => a + Number(x[key] || 0), 0);
      setK({
        sales: sum(s, "total"), purchases: sum(p, "total"), expenses: sum(e, "amount"),
        customers: c.count ?? 0, products: pr.count ?? 0, employees: em.count ?? 0, branches: br.count ?? 0,
      });
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  const profit = k.sales - k.purchases - k.expenses;
  const margin = k.sales > 0 ? (profit / k.sales) * 100 : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-gold grid place-items-center text-gold-foreground">
          <Crown className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">CEO কন্ট্রোল সেন্টার</h1>
          <p className="text-sm text-muted-foreground mt-1">সর্বোচ্চ স্তরের ব্যবসায়িক নিয়ন্ত্রণ</p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border p-5 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="text-xs text-muted-foreground">নিট লাভ</div>
          <div className={`text-3xl font-bold text-display mt-2 ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>৳{bn(Math.abs(profit))}</div>
          <div className="text-xs text-muted-foreground mt-1">মার্জিন: {bn(margin)}%</div>
        </div>
        <div className="rounded-xl border p-5">
          <div className="text-xs text-muted-foreground">মোট আয়</div>
          <div className="text-3xl font-bold text-display mt-2">৳{bn(k.sales)}</div>
          <div className="text-xs text-muted-foreground mt-1"><TrendingUp className="size-3 inline" /> বিক্রয় থেকে</div>
        </div>
        <div className="rounded-xl border p-5">
          <div className="text-xs text-muted-foreground">মোট ব্যয়</div>
          <div className="text-3xl font-bold text-display mt-2">৳{bn(k.purchases + k.expenses)}</div>
          <div className="text-xs text-muted-foreground mt-1">ক্রয় + খরচ</div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="size-4" /> সংগঠন</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Chip icon={Users} label="কাস্টমার" value={k.customers} />
          <Chip icon={Package} label="পণ্য" value={k.products} />
          <Chip icon={ShoppingCart} label="কর্মচারী" value={k.employees} />
          <Chip icon={Receipt} label="ব্রাঞ্চ" value={k.branches} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">দ্রুত অ্যাকশন</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link to="/reports" className="rounded-lg border p-3 hover:bg-accent text-sm font-medium">📊 বিস্তারিত রিপোর্ট</Link>
          <Link to="/finance" className="rounded-lg border p-3 hover:bg-accent text-sm font-medium">💰 আর্থিক বিশ্লেষণ</Link>
          <Link to="/roles" className="rounded-lg border p-3 hover:bg-accent text-sm font-medium">🛡 রোল ও অনুমতি</Link>
          <Link to="/settings" className="rounded-lg border p-3 hover:bg-accent text-sm font-medium">⚙️ সেটিংস</Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Chip({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 flex items-center gap-3">
      <div className="size-9 rounded-md bg-primary/10 grid place-items-center text-primary"><Icon className="size-4" /></div>
      <div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-display">{bn(value)}</div>
      </div>
    </div>
  );
}
