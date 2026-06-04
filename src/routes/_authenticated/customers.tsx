import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Users as UsersIcon, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

const emptyForm = { name: "", phone: "", address: "", notes: "" };

function CustomersPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setOpen(true);
  };

  const onSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("নাম দিন"); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "আপডেট হয়েছে" : "কাস্টমার যোগ হয়েছে");
    setOpen(false);
    load();
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("মুছে ফেলা হয়েছে");
    setDeleteId(null);
    load();
  };

  const filtered = list.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-display">কাস্টমার</h1>
          <p className="text-sm text-muted-foreground">কাস্টমারদের তালিকা ও তথ্য ব্যবস্থাপনা</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4" /> নতুন কাস্টমার</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "কাস্টমার সম্পাদনা" : "নতুন কাস্টমার"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>নোট</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
              <Button onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                সংরক্ষণ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="খুঁজুন (নাম বা ফোন)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 grid place-items-center text-center gap-3">
            <UsersIcon className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো কাস্টমার পাওয়া যায়নি</p>
            <Button onClick={openNew}><Plus className="size-4" /> প্রথম কাস্টমার যোগ করুন</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <Link to="/customers/$id" params={{ id: c.id }} className="truncate hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5">
                {c.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> {c.phone}</div>}
                {c.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3.5" /> {c.address}</div>}
                {c.notes && <div className="text-xs text-muted-foreground pt-1 border-t">{c.notes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই কাস্টমার মুছে যাবে। এটি ফেরানো যাবে না।</AlertDialogDescription>
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
