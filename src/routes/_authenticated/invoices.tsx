import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({ meta: [{ title: "ইনভয়েস — হিসাব" }] }),
  component: InvoicesPage,
});

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => bn(Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));

type Row = {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  paid: number;
  due: number;
  sale_date: string;
};

function InvoicesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sales")
        .select("id,invoice_number,customer_name,total,paid,due,sale_date")
        .order("sale_date", { ascending: false });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) => r.invoice_number.toLowerCase().includes(s) || r.customer_name.toLowerCase().includes(s),
    );
  }, [rows, q]);

  const totals = useMemo(() => {
    const t = filtered.reduce((a, r) => a + Number(r.total), 0);
    const d = filtered.reduce((a, r) => a + Number(r.due), 0);
    return { t, d };
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">ইনভয়েস</h1>
          <p className="text-sm text-muted-foreground mt-1">সব বিক্রয়ের ইনভয়েস দেখুন ও প্রিন্ট করুন</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="মোট ইনভয়েস" value={bn(filtered.length)} />
        <Stat label="মোট বিক্রয়" value={`৳${fmt(totals.t)}`} />
        <Stat label="বকেয়া" value={`৳${fmt(totals.d)}`} tone={totals.d > 0 ? "destructive" : "success"} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ইনভয়েস নম্বর বা কাস্টমার খুঁজুন"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-16 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="size-10 mx-auto mb-2 opacity-40" />
          কোনো ইনভয়েস পাওয়া যায়নি
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2.5 font-medium">ইনভয়েস</th>
                <th className="px-3 py-2.5 font-medium">কাস্টমার</th>
                <th className="px-3 py-2.5 font-medium">তারিখ</th>
                <th className="px-3 py-2.5 font-medium text-right">মোট</th>
                <th className="px-3 py-2.5 font-medium text-right">বাকি</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono font-medium">{r.invoice_number}</td>
                  <td className="px-3 py-2.5">{r.customer_name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {bn(new Date(r.sale_date).toLocaleDateString("en-GB"))}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">৳{fmt(r.total)}</td>
                  <td className={`px-3 py-2.5 text-right font-medium ${Number(r.due) > 0 ? "text-destructive" : "text-success"}`}>
                    ৳{fmt(r.due)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/sales/$id/invoice" params={{ id: r.id }}>
                        <Eye className="size-4" /> দেখুন
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "destructive" | "success" }) {
  const cls = tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : "";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold text-display mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
