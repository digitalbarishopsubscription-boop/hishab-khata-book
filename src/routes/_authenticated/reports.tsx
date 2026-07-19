import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Loader2, ShoppingCart, ShoppingBag, Receipt, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "রিপোর্ট — হিসাব পত্র" }] }),
  component: ReportsPage,
});

const bn = (n: number) => String(Math.round(n)).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState({ sales: 0, salesCount: 0, purchases: 0, purchasesCount: 0, expenses: 0, customers: 0, products: 0 });
  const [byCategory, setByCategory] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [s, p, e, c, prod] = await Promise.all([
        supabase.from("sales" as any).select("total"),
        supabase.from("purchases" as any).select("total"),
        supabase.from("expenses").select("amount, category"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("products" as any).select("id", { count: "exact", head: true }),
      ]);
      const sum = (rows: any, key: string) => (rows.data ?? []).reduce((a: number, r: any) => a + Number(r[key] || 0), 0);
      setD({
        sales: sum(s, "total"),
        salesCount: (s.data as any)?.length ?? 0,
        purchases: sum(p, "total"),
        purchasesCount: (p.data as any)?.length ?? 0,
        expenses: sum(e, "amount"),
        customers: c.count ?? 0,
        products: prod.count ?? 0,
      });
      const cat: Record<string, number> = {};
      ((e.data as any) ?? []).forEach((r: any) => { cat[r.category] = (cat[r.category] ?? 0) + Number(r.amount || 0); });
      setByCategory(Object.entries(cat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  const max = Math.max(1, ...byCategory.map((c) => c.value));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-display flex items-center gap-2"><BarChart3 className="size-6 text-primary" /> রিপোর্ট</h1>
        <p className="text-sm text-muted-foreground mt-1">সম্পূর্ণ ব্যবসার পরিসংখ্যান</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={ShoppingCart} label="বিক্রয়" primary={`৳${bn(d.sales)}`} sub={`${bn(d.salesCount)} টি`} />
        <Tile icon={ShoppingBag} label="ক্রয়" primary={`৳${bn(d.purchases)}`} sub={`${bn(d.purchasesCount)} টি`} />
        <Tile icon={Receipt} label="খরচ" primary={`৳${bn(d.expenses)}`} sub="সর্বমোট" />
        <Tile icon={Users} label="কাস্টমার" primary={bn(d.customers)} sub={`${bn(d.products)} পণ্য`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ক্যাটাগরি অনুযায়ী খরচ</CardTitle></CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">কোনো খরচ নেই</div>
          ) : (
            <div className="space-y-3">
              {byCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1"><span>{c.name}</span><span className="font-medium">৳{bn(c.value)}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.value / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ icon: Icon, label, primary, sub }: { icon: any; label: string; primary: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4 text-primary" /> {label}</div>
      <div className="text-xl font-bold text-display mt-2">{primary}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
