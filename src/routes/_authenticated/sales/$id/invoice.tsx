import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/sales/$id/invoice")({
  head: () => ({ meta: [{ title: "ইনভয়েস — হিসাব পত্র" }] }),
  component: InvoicePage,
});

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => bn(n.toLocaleString("en-IN", { maximumFractionDigits: 2 }));

type SaleRow = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  payment_method: string;
  notes: string | null;
  sale_date: string;
};
type ItemRow = { id: string; product_name: string; quantity: number; unit_price: number; total: number };

function InvoicePage() {
  const { id } = useParams({ from: "/_authenticated/sales/$id/invoice" });
  const { user } = useAuth();
  const [sale, setSale] = useState<SaleRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: it }] = await Promise.all([
        supabase.from("sales").select("*").eq("id", id).single(),
        supabase.from("sale_items").select("*").eq("sale_id", id),
      ]);
      setSale((s as SaleRow) || null);
      setItems((it as ItemRow[]) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!sale) {
    return <div className="p-6 text-center text-muted-foreground">ইনভয়েস পাওয়া যায়নি</div>;
  }

  const ownerName = (user?.user_metadata?.owner_name as string) || "হিসাব পত্র";

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/sales"><ArrowLeft className="size-4" /> ফিরে যান</Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> প্রিন্ট
        </Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-card p-6 md:p-10 print:shadow-none print:border-0">
        <div className="flex items-start justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="হিসাব পত্র"
              className="h-12 w-auto rounded-lg bg-white p-0.5 shadow-sm"
            />
            <div>
              <div className="text-xl font-bold text-display text-foreground">হিসাব পত্র</div>
              <div className="text-sm text-muted-foreground">{ownerName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">ইনভয়েস</div>
            <div className="font-mono font-semibold">{sale.invoice_number}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {bn(new Date(sale.sale_date).toLocaleDateString("en-GB"))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">কাস্টমার</div>
            <div className="font-semibold">{sale.customer_name}</div>
            {sale.customer_phone && <div className="text-sm text-muted-foreground">{bn(sale.customer_phone)}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">পেমেন্ট</div>
            <div className="font-semibold capitalize">{sale.payment_method}</div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">পণ্য</th>
              <th className="px-3 py-2 font-medium text-right">পরিমাণ</th>
              <th className="px-3 py-2 font-medium text-right">দাম</th>
              <th className="px-3 py-2 font-medium text-right">মোট</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b">
                <td className="px-3 py-2.5">{it.product_name}</td>
                <td className="px-3 py-2.5 text-right">{fmt(Number(it.quantity))}</td>
                <td className="px-3 py-2.5 text-right">৳{fmt(Number(it.unit_price))}</td>
                <td className="px-3 py-2.5 text-right font-medium">৳{fmt(Number(it.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <Line label="সাবটোটাল" value={`৳${fmt(Number(sale.subtotal))}`} />
            <Line label="ছাড়" value={`-৳${fmt(Number(sale.discount))}`} />
            <div className="border-t my-2" />
            <Line label="মোট" value={`৳${fmt(Number(sale.total))}`} big />
            <Line label="পরিশোধিত" value={`৳${fmt(Number(sale.paid))}`} />
            <Line label="বাকি" value={`৳${fmt(Number(sale.due))}`} big tone={Number(sale.due) > 0 ? "destructive" : "success"} />
          </div>
        </div>

        {sale.notes && (
          <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
            <span className="font-medium text-foreground">নোট:</span> {sale.notes}
          </div>
        )}

        <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
          ধন্যবাদ আপনার ব্যবসার জন্য — হিসাব পত্র দিয়ে তৈরি
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, big, tone }: { label: string; value: string; big?: boolean; tone?: "destructive" | "success" }) {
  const cls = tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : "";
  return (
    <div className="flex justify-between items-center">
      <span className={big ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`${big ? "text-lg font-bold text-display" : ""} ${cls}`}>{value}</span>
    </div>
  );
}
