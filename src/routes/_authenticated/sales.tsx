import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart, FileText, Loader2, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "বিক্রয় — হিসাব" }] }),
  component: SalesPage,
});

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => bn(n.toLocaleString("en-IN", { maximumFractionDigits: 2 }));

type Item = { product_name: string; quantity: number; unit_price: number };

type Sale = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  total: number;
  paid: number;
  due: number;
  payment_method: string;
  sale_date: string;
};

export type EditingSale = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  discount: number;
  paid: number;
  payment_method: string;
  notes: string | null;
  items: Item[];
};

function SalesPage() {
  const [tab, setTab] = useState<"entry" | "history">("entry");
  const [editing, setEditing] = useState<EditingSale | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const startEdit = (s: EditingSale) => {
    setEditing(s);
    setTab("entry");
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">বিক্রয়</h1>
          <p className="text-sm text-muted-foreground mt-1">নতুন বিক্রয় যোগ করুন এবং ইতিহাস দেখুন</p>
        </div>
      </header>

      <div className="inline-flex rounded-lg border bg-card p-1">
        <button
          onClick={() => { setTab("entry"); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "entry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="inline size-4 mr-1" /> {editing ? "সম্পাদনা" : "নতুন বিক্রয়"}
        </button>
        <button
          onClick={() => { setEditing(null); setTab("history"); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
            tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="inline size-4 mr-1" /> ইতিহাস
        </button>
      </div>

      {tab === "entry" ? (
        <SalesEntry
          editing={editing}
          onSaved={() => { setEditing(null); setReloadKey((k) => k + 1); setTab("history"); }}
          onCancelEdit={() => setEditing(null)}
        />
      ) : (
        <SalesHistory reloadKey={reloadKey} onEdit={startEdit} onDeleted={() => setReloadKey((k) => k + 1)} />
      )}
    </div>
  );
}

function SalesEntry({
  editing,
  onSaved,
  onCancelEdit,
}: {
  editing: EditingSale | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const { user } = useAuth();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ product_name: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setCustomer(editing.customer_name);
      setPhone(editing.customer_phone || "");
      setPaymentMethod(editing.payment_method);
      setDiscount(Number(editing.discount) || 0);
      setPaid(Number(editing.paid) || 0);
      setNotes(editing.notes || "");
      setItems(editing.items.length ? editing.items : [{ product_name: "", quantity: 1, unit_price: 0 }]);
    }
  }, [editing]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const due = Math.max(0, total - (Number(paid) || 0));

  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((p) => [...p, { product_name: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const reset = () => {
    setCustomer(""); setPhone(""); setPaymentMethod("cash"); setDiscount(0); setPaid(0); setNotes("");
    setItems([{ product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!customer.trim()) return toast.error("কাস্টমারের নাম দিন");
    const validItems = items.filter((it) => it.product_name.trim() && it.quantity > 0);
    if (validItems.length === 0) return toast.error("কমপক্ষে একটি পণ্য যোগ করুন");

    setSaving(true);
    try {
      if (editing) {
        const { error: upErr } = await supabase
          .from("sales")
          .update({
            customer_name: customer.trim(),
            customer_phone: phone.trim() || null,
            subtotal,
            discount: Number(discount) || 0,
            total,
            paid: Number(paid) || 0,
            due,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
          })
          .eq("id", editing.id);
        if (upErr) throw upErr;

        const { error: delErr } = await supabase.from("sale_items").delete().eq("sale_id", editing.id);
        if (delErr) throw delErr;

        const itemRows = validItems.map((it) => ({
          sale_id: editing.id,
          user_id: user.id,
          product_name: it.product_name.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          total: Number(it.quantity) * Number(it.unit_price),
        }));
        const { error: itemErr } = await supabase.from("sale_items").insert(itemRows);
        if (itemErr) throw itemErr;

        toast.success(`আপডেট হয়েছে — ${editing.invoice_number}`);
        reset();
        onSaved();
      } else {
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        const { data: sale, error } = await supabase
          .from("sales")
          .insert({
            user_id: user.id,
            invoice_number: invoiceNumber,
            customer_name: customer.trim(),
            customer_phone: phone.trim() || null,
            subtotal,
            discount: Number(discount) || 0,
            total,
            paid: Number(paid) || 0,
            due,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
          })
          .select()
          .single();
        if (error) throw error;

        const itemRows = validItems.map((it) => ({
          sale_id: sale.id,
          user_id: user.id,
          product_name: it.product_name.trim(),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          total: Number(it.quantity) * Number(it.unit_price),
        }));
        const { error: itemErr } = await supabase.from("sale_items").insert(itemRows);
        if (itemErr) throw itemErr;

        toast.success(`বিক্রয় সংরক্ষিত — ${invoiceNumber}`);
        reset();
        onSaved();
      }
    } catch (err: any) {
      toast.error(err.message || "সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {editing && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <div className="text-sm">
            <span className="text-muted-foreground">সম্পাদনা: </span>
            <span className="font-mono font-medium">{editing.invoice_number}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => { onCancelEdit(); reset(); }}>
            বাতিল
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">কাস্টমার তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">কাস্টমারের নাম *</label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="যেমন: রহিম মিয়া" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">মোবাইল</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="০১৭xxxxxxxx" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">পণ্য / আইটেম</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-4" /> আইটেম
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 md:col-span-6">
                <label className="text-xs text-muted-foreground mb-1 block">পণ্যের নাম</label>
                <Input
                  value={it.product_name}
                  onChange={(e) => updateItem(i, { product_name: e.target.value })}
                  placeholder="পণ্যের নাম"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">পরিমাণ</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">দাম</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.unit_price}
                  onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-3 md:col-span-1 text-sm font-semibold text-right">
                ৳{fmt((it.quantity || 0) * (it.unit_price || 0))}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">পেমেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">পেমেন্ট মাধ্যম</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="cash">ক্যাশ</option>
                <option value="bkash">বিকাশ</option>
                <option value="nagad">নগদ</option>
                <option value="rocket">রকেট</option>
                <option value="bank">ব্যাংক</option>
                <option value="due">বাকি</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ছাড় (৳)</label>
              <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">পরিশোধিত (৳)</label>
              <Input type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">নোট</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ঐচ্ছিক নোট" />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-primary text-primary-foreground p-5 space-y-2">
            <Row label="সাবটোটাল" value={`৳${fmt(subtotal)}`} />
            <Row label="ছাড়" value={`-৳${fmt(Number(discount) || 0)}`} />
            <div className="border-t border-white/20 my-2" />
            <Row label="মোট" value={`৳${fmt(total)}`} big />
            <Row label="পরিশোধিত" value={`৳${fmt(Number(paid) || 0)}`} />
            <Row label="বাকি" value={`৳${fmt(due)}`} big />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={reset} disabled={saving}>রিসেট</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {editing ? "আপডেট করুন" : "বিক্রয় সংরক্ষণ"}
        </Button>
      </div>
    </form>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={big ? "font-semibold" : "text-primary-foreground/80 text-sm"}>{label}</span>
      <span className={big ? "text-lg font-bold text-display" : "text-sm"}>{value}</span>
    </div>
  );
}

function SalesHistory({
  reloadKey,
  onEdit,
  onDeleted,
}: {
  reloadKey: number;
  onEdit: (s: EditingSale) => void;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Sale | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales")
        .select("id,invoice_number,customer_name,customer_phone,total,paid,due,payment_method,sale_date")
        .order("sale_date", { ascending: false })
        .limit(200);
      if (error) toast.error(error.message);
      setRows((data as Sale[]) || []);
      setLoading(false);
    })();
  }, [user, reloadKey]);

  const filtered = rows.filter(
    (r) =>
      r.customer_name.toLowerCase().includes(q.toLowerCase()) ||
      r.invoice_number.toLowerCase().includes(q.toLowerCase()),
  );

  const handleEdit = async (id: string) => {
    setBusyId(id);
    try {
      const { data: sale, error } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      const { data: items, error: iErr } = await supabase
        .from("sale_items")
        .select("product_name,quantity,unit_price")
        .eq("sale_id", id);
      if (iErr) throw iErr;
      onEdit({
        id: sale.id,
        invoice_number: sale.invoice_number,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone,
        discount: Number(sale.discount),
        paid: Number(sale.paid),
        payment_method: sale.payment_method,
        notes: sale.notes,
        items: (items || []).map((it: any) => ({
          product_name: it.product_name,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
    } catch (e: any) {
      toast.error(e.message || "লোড করতে সমস্যা হয়েছে");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusyId(id);
    try {
      const { error: iErr } = await supabase.from("sale_items").delete().eq("sale_id", id);
      if (iErr) throw iErr;
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("বিক্রয় মুছে ফেলা হয়েছে");
      setConfirmDelete(null);
      onDeleted();
    } catch (e: any) {
      toast.error(e.message || "মুছতে সমস্যা হয়েছে");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="ইনভয়েস বা নাম খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            কোনো বিক্রয় পাওয়া যায়নি
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2.5 font-medium">ইনভয়েস</th>
                <th className="px-3 py-2.5 font-medium">কাস্টমার</th>
                <th className="px-3 py-2.5 font-medium">তারিখ</th>
                <th className="px-3 py-2.5 font-medium text-right">মোট</th>
                <th className="px-3 py-2.5 font-medium text-right">বাকি</th>
                <th className="px-3 py-2.5 font-medium text-right">কাজ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-xs">{r.invoice_number}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{r.customer_name}</div>
                    {r.customer_phone && <div className="text-xs text-muted-foreground">{bn(r.customer_phone)}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {bn(new Date(r.sale_date).toLocaleDateString("en-GB"))}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">৳{fmt(Number(r.total))}</td>
                  <td className="px-3 py-2.5 text-right">
                    {Number(r.due) > 0 ? (
                      <span className="text-destructive font-medium">৳{fmt(Number(r.due))}</span>
                    ) : (
                      <span className="text-success">পরিশোধিত</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" title="ইনভয়েস">
                        <Link to="/sales/$id/invoice" params={{ id: r.id }}>
                          <FileText className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="সম্পাদনা"
                        onClick={() => handleEdit(r.id)}
                        disabled={busyId === r.id}
                      >
                        {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="মুছুন"
                        onClick={() => setConfirmDelete(r)}
                        disabled={busyId === r.id}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বিক্রয় মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && (
                <>
                  ইনভয়েস <span className="font-mono font-medium">{confirmDelete.invoice_number}</span> এবং এর সব আইটেম
                  স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না।
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={!!busyId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyId ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
