import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Plus, Loader2, Trash2, Phone, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "সাপ্লায়ার — হিসাব পত্র" },
      { name: "description", content: "সাপ্লায়ার প্রোফাইল ও পাওনা হিসাব রাখুন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: SuppliersPage,
});

type Supplier = { id: string; name: string; phone: string | null; address: string | null; created_at: string };

function SuppliersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("suppliers" as any).select("*").order("created_at", { ascending: false });
    setLoading(false);
    setRows((data as any) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!form.name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    const { error } = await supabase.from("suppliers" as any).insert({
      user_id: user!.id, name: form.name.trim(), phone: form.phone || null, address: form.address || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("সাপ্লায়ার যোগ হয়েছে");
    setForm({ name: "", phone: "", address: "" });
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("সরানো হয়েছে");
    load();
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">সাপ্লায়ার</h1>
          <p className="text-sm text-muted-foreground mt-1">আপনার সরবরাহকারীদের তালিকা</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> নতুন</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন সাপ্লায়ার</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={add} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "সংরক্ষণ"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="খুঁজুন..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="size-4" /> সাপ্লায়ার তালিকা</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">কোনো সাপ্লায়ার নেই</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-0.5">
                      {r.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {r.phone}</span>}
                      {r.address && <span className="flex items-center gap-1"><MapPin className="size-3" /> {r.address}</span>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
