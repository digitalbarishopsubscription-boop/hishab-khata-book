import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShoppingBag, Loader2, Trash2, Pencil, List, Search,
} from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/purchases")({
  head: () => ({ meta: [{ title: "ক্রয় — হিসাব পত্র" }] }),
  component: PurchasesPage,
});

type Purchase = {
  id: string;
  supplier_name: string;
  supplier_phone: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  paid: number;
  due: number;
  payment_method: string;
  notes: string | null;
  purchase_date: string;
};

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => `৳${bn(n.toLocaleString("en-IN", { maximumFractionDigits: 2 }))}`;

const emptyForm = {
  supplier_name: "",
  supplier_phone: "",
  item_name: "",
  quantity: "1",
  unit_price: "0",
  paid: "0",
  payment_method: "cash",
  notes: "",
};

function PurchasesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"entry" | "history">("entry");
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .order("purchase_date", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => {
    const qty = Number(form.quantity) || 0;
    const up = Number(form.unit_price) || 0;
    return qty * up;
  }, [form.quantity, form.unit_price]);

  const totals = useMemo(() => {
    let t = 0, p = 0, d = 0;
    for (const r of rows) { t += Number(r.total); p += Number(r.paid); d += Number(r.due); }
    return { t, p, d };
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.supplier_name.toLowerCase().includes(s) ||
      r.item_name.toLowerCase().includes(s) ||
      (r.supplier_phone ?? "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };

  const startEdit = (r: Purchase) => {
    setEditId(r.id);
    setForm({
      supplier_name: r.supplier_name,
      supplier_phone: r.supplier_phone ?? "",
      item_name: r.item_name,
      quantity: String(r.quantity),
      unit_price: String(r.unit_price),
      paid: String(r.paid),
      payment_method: r.payment_method,
      notes: r.notes ?? "",
    });
    setTab("entry");
  };

  const onSave = async () => {
    if (!user) return;
    if (!form.supplier_name.trim()) { toast.error("সাপ্লায়ারের নাম দিন"); return; }
    if (!form.item_name.trim()) { toast.error("পণ্যের নাম দিন"); return; }
    const qty = Number(form.quantity);
    const up = Number(form.unit_price);
    const paid = Number(form.paid) || 0;
    if (!qty || qty <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
    if (up < 0) { toast.error("সঠিক দাম দিন"); return; }
    const tot = qty * up;
    const due = Math.max(tot - paid, 0);
    setSaving(true);
    const payload = {
      user_id: user.id,
      supplier_name: form.supplier_name.trim(),
      supplier_phone: form.supplier_phone.trim() || null,
      item_name: form.item_name.trim(),
      quantity: qty,
      unit_price: up,
      total: tot,
      paid,
      due,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
    };
    const { error } = editId
      ? await supabase.from("purchases").update(payload).eq("id", editId)
      : await supabase.from("purchases").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "আপডেট হয়েছে" : "ক্রয় যোগ হয়েছে");
    resetForm();
    setTab("history");
    load();
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("purchases").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("মুছে ফেলা হয়েছে");
    setDeleteId(null);
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">ক্রয়</h1>
          <p className="text-sm text-muted-foreground mt-1">সাপ্লায়ার থেকে পণ্য ক্রয়ের হিসাব</p>
        </div>
      </header>

      <div className="inline-flex rounded-lg border bg-card p-1">
        <button
          onClick={() => setTab("entry")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "entry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="inline size-4 mr-1" /> {editId ? "সম্পাদনা" : "নতুন ক্রয়"}
        </button>
        <button
          onClick={() => { resetForm(); setTab("history"); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="inline size-4 mr-1" /> ইতিহাস
        </button>
      </div>

      {tab === "entry" ? (
        <Card>
          <CardHeader><CardTitle>{editId ? "ক্রয় সম্পাদনা" : "নতুন ক্রয় এন্ট্রি"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>সাপ্লায়ারের নাম *</Label><Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={form.supplier_phone} onChange={(e) => setForm({ ...form, supplier_phone: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>পণ্যের নাম *</Label><Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></div>
              <div><Label>পরিমাণ</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label>একক দাম (৳)</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
              <div>
                <Label>পেমেন্ট মাধ্যম</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">নগদ</SelectItem>
                    <SelectItem value="bkash">বিকাশ</SelectItem>
                    <SelectItem value="nagad">নগদ (মোবাইল)</SelectItem>
                    <SelectItem value="bank">ব্যাংক</SelectItem>
                    <SelectItem value="due">বাকি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>পরিশোধিত (৳)</Label><Input type="number" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>নোট</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div><div className="text-xs text-muted-foreground">মোট</div><div className="text-lg font-bold text-display">{fmt(total)}</div></div>
              <div><div className="text-xs text-muted-foreground">পরিশোধিত</div><div className="text-lg font-bold text-display text-green-600">{fmt(Number(form.paid) || 0)}</div></div>
              <div><div className="text-xs text-muted-foreground">বাকি</div><div className="text-lg font-bold text-display text-destructive">{fmt(Math.max(total - (Number(form.paid) || 0), 0))}</div></div>
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
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">মোট ক্রয়</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display">{fmt(totals.t)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">পরিশোধিত</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display text-green-600">{fmt(totals.p)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">বাকি</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-display text-destructive">{fmt(totals.d)}</CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>ক্রয়ের ইতিহাস</CardTitle>
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute left-2.5 top-2.5" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="সাপ্লায়ার/পণ্য খুঁজুন" className="pl-8 w-64" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <div className="py-10 grid place-items-center text-center gap-3">
                  <ShoppingBag className="size-10 text-muted-foreground" />
                  <p className="text-muted-foreground">কোনো ক্রয় নেই</p>
                  <Button onClick={() => setTab("entry")}><Plus className="size-4" /> নতুন ক্রয়</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>সাপ্লায়ার</TableHead>
                      <TableHead>পণ্য</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead className="text-right">মোট</TableHead>
                      <TableHead className="text-right">বাকি</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.purchase_date).toLocaleDateString("bn-BD")}</TableCell>
                        <TableCell className="font-medium">{r.supplier_name}{r.supplier_phone && <div className="text-xs text-muted-foreground">{r.supplier_phone}</div>}</TableCell>
                        <TableCell>{r.item_name}</TableCell>
                        <TableCell className="text-right">{bn(r.quantity)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(Number(r.total))}</TableCell>
                        <TableCell className={`text-right font-semibold ${Number(r.due) > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(Number(r.due))}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(r)}><Pencil className="size-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
                          </div>
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
            <AlertDialogDescription>এই ক্রয় এন্ট্রি মুছে যাবে।</AlertDialogDescription>
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
