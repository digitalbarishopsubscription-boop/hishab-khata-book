import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCog, Plus, Loader2, Trash2, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "কর্মচারী — হিসাব পত্র" },
      { name: "description", content: "কর্মচারীর তথ্য, বেতন ও দায়িত্ব ব্যবস্থাপনা করুন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: EmployeesPage,
});

type Employee = { id: string; name: string; role: string | null; phone: string | null; salary: number; active: boolean; join_date: string };

const bn = (n: number) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function EmployeesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", salary: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("employees" as any).select("*").order("created_at", { ascending: false });
    setLoading(false);
    setRows((data as any) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!form.name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    const { error } = await supabase.from("employees" as any).insert({
      user_id: user!.id,
      name: form.name.trim(),
      role: form.role || null,
      phone: form.phone || null,
      salary: Number(form.salary) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("কর্মচারী যোগ হয়েছে");
    setForm({ name: "", role: "", phone: "", salary: "" });
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("employees" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("সরানো হয়েছে");
    load();
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const totalSalary = rows.reduce((s, r) => s + Number(r.salary || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">কর্মচারী</h1>
          <p className="text-sm text-muted-foreground mt-1">টিম ও বেতন ব্যবস্থাপনা</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন কর্মচারী</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>পদবি</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>বেতন (৳)</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "সংরক্ষণ"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">মোট কর্মচারী</div>
          <div className="text-2xl font-bold text-display mt-1">{bn(rows.length)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">মাসিক বেতন</div>
          <div className="text-2xl font-bold text-display mt-1">৳{bn(totalSalary)}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="খুঁজুন..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="size-4" /> সকল কর্মচারী</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="py-8 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
          : filtered.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">কোনো কর্মচারী নেই</div>
          : <div className="space-y-2">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      {r.role && <Badge variant="secondary">{r.role}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                      {r.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {r.phone}</span>}
                      <span>বেতন: ৳{bn(Number(r.salary))}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ))}
            </div>}
        </CardContent>
      </Card>
    </div>
  );
}
