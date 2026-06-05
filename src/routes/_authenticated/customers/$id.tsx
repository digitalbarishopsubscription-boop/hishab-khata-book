import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Phone, MapPin, FileText, BookOpen } from "lucide-react";
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
type Sale = {
  id: string; invoice_number: string; sale_date: string;
  total: number; paid: number; due: number; payment_method: string;
};
type Txn = { id: string; type: string; amount: number; description: string | null; transaction_date: string };

type LedgerEntry = {
  date: string;
  kind: "cash_sale" | "due_sale" | "khata_due" | "payment";
  label: string;
  amount: number; // positive = added to purchase/due; negative = payment
  ref?: string;
};

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
        supabase.from("sales")
          .select("id, invoice_number, sale_date, total, paid, due, payment_method")
          .eq("customer_id", id)
          .order("sale_date", { ascending: false }),
        supabase.from("khata_transactions").select("*").eq("customer_id", id).order("transaction_date", { ascending: false }),
      ]);
      if (ce) toast.error(ce.message);
      setCustomer(c ?? null);
      setSales((s ?? []) as Sale[]);
      setTxns((t ?? []) as Txn[]);
      setLoading(false);
    })();
  }, [id]);

  const stats = useMemo(() => {
    const totalPurchaseSales = sales.reduce((a, b) => a + Number(b.total), 0);
    const paidInSales = sales.reduce((a, b) => a + Number(b.paid), 0);
    const dueFromSales = sales.reduce((a, b) => a + Number(b.due), 0);

    const khataDue = txns.filter((t) => t.type === "due").reduce((a, b) => a + Number(b.amount), 0);
    const khataPayment = txns.filter((t) => t.type === "payment").reduce((a, b) => a + Number(b.amount), 0);

    const totalPurchase = totalPurchaseSales + khataDue;
    const totalPayments = paidInSales + khataPayment;
    const currentDue = Math.max(0, dueFromSales + khataDue - khataPayment);

    return { totalPurchase, totalPayments, currentDue };
  }, [sales, txns]);

  const ledger: LedgerEntry[] = useMemo(() => {
    const rows: LedgerEntry[] = [];
    for (const s of sales) {
      const isCash = Number(s.due) === 0;
      rows.push({
        date: s.sale_date,
        kind: isCash ? "cash_sale" : "due_sale",
        label: `${isCash ? "ক্যাশ বিক্রয়" : "বাকি বিক্রয়"} — ${s.invoice_number}`,
        amount: Number(s.total),
        ref: s.id,
      });
      if (!isCash && Number(s.paid) > 0) {
        rows.push({
          date: s.sale_date,
          kind: "payment",
          label: `আংশিক পরিশোধ — ${s.invoice_number}`,
          amount: -Number(s.paid),
        });
      }
    }
    for (const t of txns) {
      if (t.type === "due") {
        rows.push({
          date: t.transaction_date,
          kind: "khata_due",
          label: `খাতা বাকি${t.description ? ` — ${t.description}` : ""}`,
          amount: Number(t.amount),
        });
      } else {
        rows.push({
          date: t.transaction_date,
          kind: "payment",
          label: `পেমেন্ট গ্রহণ${t.description ? ` — ${t.description}` : ""}`,
          amount: -Number(t.amount),
        });
      }
    }
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, txns]);

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

      <div className="grid md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">প্রোফাইল</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1.5">
            {customer.phone && <div className="flex items-center gap-2"><Phone className="size-4" /> {customer.phone}</div>}
            {customer.address && <div className="flex items-center gap-2"><MapPin className="size-4" /> {customer.address}</div>}
            {customer.notes && <div className="flex items-start gap-2"><FileText className="size-4 mt-0.5" /> <span>{customer.notes}</span></div>}
            {!customer.phone && !customer.address && !customer.notes && <span className="text-muted-foreground">—</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট কেনাকাটা</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(stats.totalPurchase)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট পরিশোধ</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{fmt(stats.totalPayments)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">বর্তমান বাকি</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${stats.currentDue > 0 ? "text-destructive" : "text-success"}`}>{fmt(stats.currentDue)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-4" /> সম্পূর্ণ লেনদেন</CardTitle></CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">কোনো লেনদেন নেই</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>তারিখ</TableHead>
                <TableHead>বিবরণ</TableHead>
                <TableHead>ধরন</TableHead>
                <TableHead className="text-right">টাকা</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ledger.map((e, i) => {
                  const isPayment = e.amount < 0;
                  const badge: Record<LedgerEntry["kind"], string> = {
                    cash_sale: "ক্যাশ বিক্রয়",
                    due_sale: "বাকি বিক্রয়",
                    khata_due: "খাতা বাকি",
                    payment: "পেমেন্ট",
                  };
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell>{e.label}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isPayment ? "bg-success/15 text-success" : e.kind === "cash_sale" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {badge[e.kind]}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isPayment ? "text-success" : ""}`}>
                        {isPayment ? `- ${fmt(Math.abs(e.amount))}` : `+ ${fmt(e.amount)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
