import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Receipt, Loader2, Search, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "খরচ — হিসাব পত্র" }] }),
  component: ExpensesPage,
});

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => bn(Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));

const CATEGORIES: { value: string; label: string }[] = [
  { value: "rent", label: "ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "utility", label: "ইউটিলিটি (বিদ্যুৎ/গ্যাস/পানি)" },
  { value: "transport", label: "পরিবহন" },
  { value: "supplies", label: "সরবরাহ" },
  { value: "marketing", label: "মার্কেটিং" },
  { value: "food", label: "খাবার" },
  { value: "maintenance", label: "রক্ষণাবেক্ষণ" },
  { value: "other", label: "অন্যান্য" },
];
const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  expense_date: string;
};

function ExpensesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmDel, setConfirmDel] = useState<Expense | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState<number>(0);
  const [payment, setPayment] = useState("cash");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setRows((data ?? []) as Expense[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCategory(editing.category);
      setAmount(Number(editing.amount));
      setPayment(editing.payment_method);
      setNotes(editing.notes || "");
      setDate(editing.expense_date);
    }
  }, [editing]);

  const reset = () => {
    setEditing(null);
    setTitle(""); setCategory("other"); setAmount(0); setPayment("cash"); setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) return toast.error("খরচের শিরোনাম দিন");
    if (!(amount > 0)) return toast.error("সঠিক পরিমাণ দিন");
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("expenses").update({
          title: title.trim(), category, amount, payment_method: payment,
          notes: notes.trim() || null, expense_date: date,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("খরচ আপডেট হয়েছে");
      } else {
        const { error } = await supabase.from("expenses").insert({
          user_id: user.id, title: title.trim(), category, amount,
          payment_method: payment, notes: notes.trim() || null, expense_date: date,
        });
        if (error) throw error;
        toast.success("খরচ সংরক্ষিত হয়েছে");
      }
      reset();
      load();
    } catch (err: any) {
      toast.error(err.message || "সংরক্ষণে সমস্যা");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("expenses").delete().eq("id", confirmDel.id);
    if (error) return toast.error(error.message);
    toast.success("খরচ মুছে ফেলা হয়েছে");
    setConfirmDel(null);
    load();
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(s) || catLabel(r.category).toLowerCase().includes(s));
  }, [rows, q]);

  const totals = useMemo(() => {
    const total = filtered.reduce((a, r) => a + Number(r.amount), 0);
    const thisMonth = filtered
      .filter((r) => r.expense_date.slice(0, 7) === new Date().toISOString().slice(0, 7))
      .reduce((a, r) => a + Number(r.amount), 0);
    return { total, thisMonth };
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-display">খরচ</h1>
        <p className="text-sm text-muted-foreground mt-1">ব্যবসার সব খরচ সংরক্ষণ ও ব্যবস্থাপনা করুন</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="মোট খরচ" value={`৳${fmt(totals.total)}`} tone="destructive" />
        <Stat label="এই মাসে" value={`৳${fmt(totals.thisMonth)}`} />
        <Stat label="মোট এন্ট্রি" value={bn(filtered.length)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{editing ? "খরচ সম্পাদনা" : "নতুন খরচ"}</CardTitle>
          {editing && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <X className="size-4" /> বাতিল
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block">শিরোনাম *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: দোকান ভাড়া" />
            </div>
            <div>
              <Label className="mb-1.5 block">ক্যাটাগরি</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">পরিমাণ (৳) *</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label className="mb-1.5 block">পেমেন্ট মাধ্যম</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">ক্যাশ</SelectItem>
                  <SelectItem value="bkash">বিকাশ</SelectItem>
                  <SelectItem value="nagad">নগদ</SelectItem>
                  <SelectItem value="rocket">রকেট</SelectItem>
                  <SelectItem value="bank">ব্যাংক</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">তারিখ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block">নোট</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ঐচ্ছিক" rows={2} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {editing ? "আপডেট করুন" : "সংরক্ষণ করুন"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-display">খরচের তালিকা</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="খুঁজুন..." className="pl-9" />
        </div>

        {loading ? (
          <div className="py-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Receipt className="size-10 mx-auto mb-2 opacity-40" />
            কোনো খরচ নেই
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium">শিরোনাম</th>
                  <th className="px-3 py-2.5 font-medium">ক্যাটাগরি</th>
                  <th className="px-3 py-2.5 font-medium">তারিখ</th>
                  <th className="px-3 py-2.5 font-medium">পেমেন্ট</th>
                  <th className="px-3 py-2.5 font-medium text-right">পরিমাণ</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium">{r.title}</td>
                    <td className="px-3 py-2.5">{catLabel(r.category)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {bn(new Date(r.expense_date).toLocaleDateString("en-GB"))}
                    </td>
                    <td className="px-3 py-2.5 capitalize">{r.payment_method}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-destructive">৳{fmt(r.amount)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDel(r)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>খরচ মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDel?.title}" মুছে ফেলা হবে। এই কাজ বাতিল করা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
