import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "পেমেন্ট গ্রহণ — হিসাব পত্র" },
      { name: "description", content: "গ্রাহকের পেমেন্ট গ্রহণ ও রেকর্ড সংরক্ষণ করুন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: PaymentsPage,
});

type Customer = { id: string; name: string };
type Payment = {
  id: string; customer_id: string | null; customer_name: string;
  amount: number; description: string | null; transaction_date: string;
};

const fmt = (n: number) => `৳ ${(n ?? 0).toLocaleString("bn-BD", { maximumFractionDigits: 2 })}`;

function PaymentsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customer_id: "", customer_name: "", amount: "", description: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: t, error }, { data: c }] = await Promise.all([
      supabase.from("khata_transactions").select("*").eq("type", "payment").order("transaction_date", { ascending: false }),
      supabase.from("customers").select("id, name").order("name"),
    ]);
    if (error) toast.error(error.message);
    setList((t ?? []) as any);
    setCustomers((c ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const total = useMemo(() => list.reduce((a, b) => a + Number(b.amount), 0), [list]);
  const filtered = list.filter((p) =>
    p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const openNew = () => { setForm({ customer_id: "", customer_name: "", amount: "", description: "" }); setOpen(true); };

  const onSave = async () => {
    if (!user) return;
    const amount = parseFloat(form.amount);
    if (!form.customer_name.trim()) { toast.error("কাস্টমার নাম দিন"); return; }
    if (!amount || amount <= 0) { toast.error("সঠিক টাকা দিন"); return; }
    setSaving(true);
    const { error } = await supabase.from("khata_transactions").insert({
      user_id: user.id,
      customer_id: form.customer_id || null,
      customer_name: form.customer_name.trim(),
      type: "payment",
      amount,
      description: form.description.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("পেমেন্ট গ্রহণ সম্পন্ন");
    setOpen(false);
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
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-display">পেমেন্ট গ্রহণ</h1>
          <p className="text-sm text-muted-foreground">কাস্টমার থেকে গৃহীত পেমেন্ট</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="size-4" /> নতুন পেমেন্ট</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>পেমেন্ট গ্রহণ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>কাস্টমার নির্বাচন</Label>
                <Select
                  value={form.customer_id || "manual"}
                  onValueChange={(v) => {
                    if (v === "manual") setForm({ ...form, customer_id: "", customer_name: "" });
                    else {
                      const c = customers.find((x) => x.id === v);
                      setForm({ ...form, customer_id: v, customer_name: c?.name ?? "" });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">— নাম লিখুন —</SelectItem>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>কাস্টমার নাম *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><Label>টাকার পরিমাণ *</Label><Input type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>বিবরণ</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
              <Button onClick={onSave} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট গৃহীত পেমেন্ট</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold text-primary">{fmt(total)}</div></CardContent>
      </Card>

      <Input placeholder="খুঁজুন (নাম বা বিবরণ)" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 grid place-items-center text-center gap-3">
          <HandCoins className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">কোনো পেমেন্ট নেই</p>
          <Button onClick={openNew}><Plus className="size-4" /> প্রথম পেমেন্ট যোগ করুন</Button>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>তারিখ</TableHead><TableHead>কাস্টমার</TableHead><TableHead>বিবরণ</TableHead>
              <TableHead className="text-right">টাকা</TableHead><TableHead className="w-12"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.transaction_date).toLocaleDateString("bn-BD")}</TableCell>
                  <TableCell className="font-medium">{p.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description ?? "-"}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{fmt(Number(p.amount))}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই পেমেন্ট মুছে যাবে।</AlertDialogDescription>
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
