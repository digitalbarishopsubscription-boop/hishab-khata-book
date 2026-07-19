import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Plus, Loader2, Trash2, MapPin, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/branches")({
  head: () => ({ meta: [{ title: "ব্রাঞ্চ — হিসাব পত্র" }] }),
  component: BranchesPage,
});

type Branch = { id: string; name: string; location: string | null; manager: string | null; phone: string | null };

function BranchesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", manager: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("branches" as any).select("*").order("created_at", { ascending: false });
    setLoading(false);
    setRows((data as any) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!form.name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    const { error } = await supabase.from("branches" as any).insert({
      user_id: user!.id,
      name: form.name.trim(),
      location: form.location || null,
      manager: form.manager || null,
      phone: form.phone || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("ব্রাঞ্চ যোগ হয়েছে");
    setForm({ name: "", location: "", manager: "", phone: "" });
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("branches" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("সরানো হয়েছে");
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-display">ব্রাঞ্চ</h1>
          <p className="text-sm text-muted-foreground mt-1">আপনার সকল শাখা</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ব্রাঞ্চ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>অবস্থান</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>ম্যানেজার</Label><Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "সংরক্ষণ"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? <div className="py-16 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
      : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">কোনো ব্রাঞ্চ নেই। নতুন ব্রাঞ্চ যোগ করুন।</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Building2 className="size-4 text-primary" />{r.name}</CardTitle>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                {r.location && <div className="flex items-center gap-2"><MapPin className="size-3.5" /> {r.location}</div>}
                {r.manager && <div className="flex items-center gap-2"><User className="size-3.5" /> {r.manager}</div>}
                {r.phone && <div className="flex items-center gap-2"><Phone className="size-3.5" /> {r.phone}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
