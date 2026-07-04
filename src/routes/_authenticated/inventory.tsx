import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Loader2, Trash2, Pencil, List, Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "ইনভেন্টরি — হিসাব" }] }),
  component: InventoryPage,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  purchase_price: number;
  sale_price: number;
  description: string | null;
};

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => `৳${bn(n.toLocaleString("en-IN", { maximumFractionDigits: 2 }))}`;

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unit: "pcs",
  stock: "0",
  low_stock_threshold: "5",
  purchase_price: "0",
  sale_price: "0",
  description: "",
};

function InventoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"entry" | "list">("entry");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalStockValue = products.reduce((s, p) => s + Number(p.stock) * Number(p.purchase_price), 0);
    const lowStock = products.filter((p) => Number(p.stock) <= Number(p.low_stock_threshold)).length;
    return { totalItems, totalStockValue, lowStock };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onSave = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("পণ্যের নাম দিন");
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit || "pcs",
      stock: Number(form.stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      description: form.description.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "পণ্য আপডেট হয়েছে" : "পণ্য যোগ হয়েছে");
    resetForm();
    load();
    setTab("list");
  };

  const onEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      category: p.category ?? "",
      unit: p.unit,
      stock: String(p.stock),
      low_stock_threshold: String(p.low_stock_threshold),
      purchase_price: String(p.purchase_price),
      sale_price: String(p.sale_price),
      description: p.description ?? "",
    });
    setTab("entry");
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("পণ্য মুছে ফেলা হয়েছে");
    load();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 grid place-items-center text-white">
          <Package className="size-5" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">ইনভেন্টরি</h1>
          <p className="text-xs text-muted-foreground">পণ্য ও স্টক ব্যবস্থাপনা</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "entry" | "list")}>
        <TabsList>
          <TabsTrigger value="entry" className="gap-1.5">
            <Plus className="size-4" /> {editingId ? "সম্পাদনা" : "নতুন পণ্য"}
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="size-4" /> পণ্যের তালিকা
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editingId ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>পণ্যের নাম *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="যেমন: চাল ২৫ কেজি" />
                </div>
                <div className="space-y-1.5">
                  <Label>SKU / কোড</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="ঐচ্ছিক" />
                </div>
                <div className="space-y-1.5">
                  <Label>ক্যাটাগরি</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="যেমন: খাদ্য" />
                </div>
                <div className="space-y-1.5">
                  <Label>একক</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / kg / ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label>বর্তমান স্টক</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>লো-স্টক সীমা</Label>
                  <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>ক্রয় মূল্য (৳)</Label>
                  <Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>বিক্রয় মূল্য (৳)</Label>
                  <Input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>বিবরণ</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>বাতিল</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-3 grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">মোট পণ্য</div>
                <div className="text-lg lg:text-2xl font-bold mt-1">{bn(stats.totalItems)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">স্টক মূল্য</div>
                <div className="text-lg lg:text-2xl font-bold mt-1">{fmt(stats.totalStockValue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="size-3" /> লো-স্টক</div>
                <div className="text-lg lg:text-2xl font-bold mt-1 text-destructive">{bn(stats.lowStock)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-muted-foreground" />
                <Input placeholder="পণ্য খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">কোন পণ্য নেই</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead className="text-right">স্টক</TableHead>
                      <TableHead className="text-right">ক্রয়</TableHead>
                      <TableHead className="text-right">বিক্রয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const low = Number(p.stock) <= Number(p.low_stock_threshold);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="font-medium">{p.name}</div>
                            {p.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.category ?? "—"}</TableCell>
                          <TableCell className={`text-right font-medium ${low ? "text-destructive" : ""}`}>
                            {bn(p.stock)} {p.unit}
                          </TableCell>
                          <TableCell className="text-right">{fmt(Number(p.purchase_price))}</TableCell>
                          <TableCell className="text-right">{fmt(Number(p.sale_price))}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => onEdit(p)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}>
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পণ্য মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই কাজটি ফিরিয়ে আনা যাবে না।</AlertDialogDescription>
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
