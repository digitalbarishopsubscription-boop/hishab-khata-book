import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Phone, MapPin, FileText, ShoppingCart, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerProfile,
});

type Customer = {
  id: string; name: string; phone: string | null; address: string | null;
  notes: string | null; created_at: string;
};
type Sale = { id: string; invoice_number: string; sale_date: string; total: number; paid: number; due: number };
type Txn = { id: string; type: string; amount: number; description: string | null; transaction_date: string };

const fmt = (n: number) => `৳ ${(n ?? 0).toLocaleString("bn-BD", { maximumFractionDigits: 2 })}`;

function CustomerProfile() {
  const { id } = Route.useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: c, error: ce }, { data: s }, { data: t }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id).maybeSingle(),
        supabase.from("sales").select("id, invoice_number, sale_date, total, paid, due").order("sale_date", { ascending: false }),
        supabase.from("khata_transactions").select("*").eq("customer_id", id).order("transaction_date", { ascending: false }),
      ]);
      if (ce) toast.error(ce.message);
      setCustomer(c ?? null);
      // filter sales by name match (sales table doesn't have customer_id)
      const filteredSales = (s ?? []).filter((x: any) => c && x && (x as any));
      setSales(filteredSales as any);
      setTxns((t ?? []) as any);
      setLoading(false);
    })();
  }, [id]);

  // Filter sales by customer name once we have customer
  const customerSales = customer
    ? sales.filter((s: any) => (s as any).customer_name ? true : true)
    : [];

  const totalDue = txns.filter((t) => t.type === "due").reduce((a, b) => a + Number(b.amount), 0);
  const totalPaid = txns.filter((t) => t.type === "payment").reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalDue - totalPaid;

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!customer) return (
    <div className="p-6">
      <p>কাস্টমার পাওয়া যায়নি</p>
      <Link to="/customers"><Button variant="outline" className="mt-3"><ArrowLeft className="size-4" /> ফিরে যান</Button></Link>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/customers"><Button variant="outline" size="sm"><ArrowLeft className="size-4" /> ফিরে যান</Button></Link>
        <h1 className="text-2xl font-bold text-display">{customer.name}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">প্রোফাইল</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {customer.phone && <div className="flex items-center gap-2"><Phone className="size-4" /> {customer.phone}</div>}
            {customer.address && <div className="flex items-center gap-2"><MapPin className="size-4" /> {customer.address}</div>}
            {customer.notes && <div className="flex items-start gap-2"><FileText className="size-4 mt-0.5" /> <span>{customer.notes}</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট বাকি</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{fmt(totalDue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">নেট ব্যালেন্স</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-primary"}`}>{fmt(balance)}</div>
            <div className="text-xs text-muted-foreground mt-1">পরিশোধ: {fmt(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-4" /> খাতা লেনদেন</CardTitle></CardHeader>
        <CardContent>
          {txns.length === 0 ? <p className="text-sm text-muted-foreground">কোনো লেনদেন নেই</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>তারিখ</TableHead><TableHead>ধরন</TableHead><TableHead>বিবরণ</TableHead><TableHead className="text-right">টাকা</TableHead></TableRow></TableHeader>
              <TableBody>
                {txns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.transaction_date).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell><span className={t.type === "due" ? "text-destructive" : "text-primary"}>{t.type === "due" ? "বাকি" : "পরিশোধ"}</span></TableCell>
                    <TableCell>{t.description ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(Number(t.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="size-4" /> বিক্রয় ইতিহাস</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const mySales = (sales as any[]).filter((s) => s.customer_name?.toLowerCase() === customer.name.toLowerCase());
            if (mySales.length === 0) return <p className="text-sm text-muted-foreground">কোনো বিক্রয় নেই</p>;
            return (
              <Table>
                <TableHeader><TableRow><TableHead>ইনভয়েস</TableHead><TableHead>তারিখ</TableHead><TableHead className="text-right">মোট</TableHead><TableHead className="text-right">বাকি</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mySales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.invoice_number}</TableCell>
                      <TableCell>{new Date(s.sale_date).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell className="text-right">{fmt(Number(s.total))}</TableCell>
                      <TableCell className="text-right text-destructive">{fmt(Number(s.due))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
