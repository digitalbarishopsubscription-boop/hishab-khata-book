import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, BookOpen, ArrowDownCircle, ArrowUpCircle, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/khata")({
  component: KhataPage,
});

type Customer = { id: string; name: string };
type Txn = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  type: string;
  amount: number;
  description: string | null;
  transaction_date: string;
};

const fmt = (n: number) => `৳ ${n.toLocaleString("bn-BD", { maximumFractionDigits: 2 })}`;

function KhataPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"entry" | "history">("entry");
  const [txns, setTxns] = useState<Txn[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    type: "due" as "due" | "payment",
    amount: "",
    description: "",
  });

  const load = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      supabase.from("khata_transactions").select("*").order("transaction_date", { ascending: false }),
      supabase.from("customers").select("id,name").order("name"),
    ]);
    if (t.error) toast.error(t.error.message);
    setTxns(t.data ?? []);
    setCustomers(c.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    let due = 0, paid = 0;
    for (const t of txns) {
      if (t.type === "due") due += Number(t.amount);
      else paid += Number(t.amount);
    }
    return { due, paid, balance: due - paid };
  }, [txns]);

  const perCustomer = useMemo(() => {
    const map = new Map<string, { name: string; balance: number }>();
    for (const t of txns) {
      const key = t.customer_id ?? `name:${t.customer_name}`;
      const entry = map.get(key) ?? { name: t.customer_name, balance: 0 };
      entry.balance += t.type === "due" ? Number(t.amount) : -Number(t.amount);
      map.set(key, entry);
    }
    return Array.from(map.values()).filter((e) => e.balance !== 0).sort((a, b) => b.balance - a.balance);
  }, [txns]);

  const resetForm = () => setForm({ customer_id: "", customer_name: "", type: "due", amount: "", description: "" });

  const onSave = async () => {
    if (!user) return;
    const name = form.customer_id
      ? customers.find((c) => c.id === form.customer_id)?.name ?? ""
      : form.customer_name.trim();
    if (!name) { toast.error("কাস্টমার সিলেক্ট বা নাম দিন"); return; }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
    setSaving(true);
    const { error } = await supabase.from("khata_transactions").insert({
      user_id: user.id,
      customer_id: form.customer_id || null,
      customer_name: name,
      type: form.type,
      amount: amt,
      description: form.description.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("যোগ হয়েছে");
    resetForm();
    setTab("history");
    load();
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("khata_transactions").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("মুছে ফেলা হয়েছে");
    setDeleteId(null);
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">খাতা ও বাকি</h1>
          <p className="text-sm text-muted-foreground mt-1">বাকি ও পরিশোধের হিসাব</p>
        </div>
      </header>

      <div className="inline-flex rounded-lg border bg-card p-1">
        <button
          onClick={() => setTab("entry")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "entry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="inline size-4 mr-1" /> নতুন এন্ট্রি
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="inline size-4 mr-1" /> ইতিহাস
        </button>
      </div>

      {tab === "entry" ? (
        <Card>
          <CardHeader><CardTitle>খাতা এন্ট্রি</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>ধরন</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "due" | "payment" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due">বাকি (যোগ)</SelectItem>
                    <SelectItem value="payment">পরিশোধ (পেয়েছি)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>কাস্টমার</Label>
                <Select value={form.customer_id || "manual"} onValueChange={(v) => setForm({ ...form, customer_id: v === "manual" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">— ম্যানুয়াল নাম —</SelectItem>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!form.customer_id && (
                <div className="md:col-span-2"><Label>কাস্টমারের নাম</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              )}
              <div><Label>পরিমাণ (৳)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>বিবরণ</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>রিসেট</Button>
              <Button onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">মোট বাকি</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display">{fmt(totals.due)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">মোট পরিশোধ</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display">{fmt(totals.paid)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">নেট বাকি</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display text-primary">{fmt(totals.balance)}</CardContent></Card>
          </div>

          {perCustomer.length > 0 && (
            <Card>
              <CardHeader><CardTitle>কাস্টমার অনুযায়ী বাকি</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>নাম</TableHead><TableHead className="text-right">বাকি</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {perCustomer.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className={`text-right font-semibold ${p.balance > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(p.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>সব লেনদেন</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
              ) : txns.length === 0 ? (
                <div className="py-10 grid place-items-center text-center gap-3">
                  <BookOpen className="size-10 text-muted-foreground" />
                  <p className="text-muted-foreground">কোনো এন্ট্রি নেই</p>
                  <Button onClick={() => setTab("entry")}><Plus className="size-4" /> নতুন এন্ট্রি</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>কাস্টমার</TableHead>
                      <TableHead>ধরন</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead>বিবরণ</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txns.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString("bn-BD")}</TableCell>
                        <TableCell className="font-medium">
                          {t.customer_id ? (
                            <Link to="/customers/$id" params={{ id: t.customer_id }} className="hover:text-primary">{t.customer_name}</Link>
                          ) : t.customer_name}
                        </TableCell>
                        <TableCell>
                          {t.type === "due" ? (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs"><ArrowUpCircle className="size-3.5" /> বাকি</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs"><ArrowDownCircle className="size-3.5" /> পরিশোধ</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(Number(t.amount))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.description}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই এন্ট্রি মুছে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
