import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Plus, Pencil, Trash2, Users as UsersIcon, Phone, MapPin, Search, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "গ্রাহক তালিকা — হিসাব পত্র" },
      { name: "description", content: "গ্রাহক খুঁজুন, ফিল্টার করুন ও প্রোফাইল দেখুন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
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
  const navigate = useNavigate();
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
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setOpen(true);
  };

  const onSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("নাম দিন");
      return;
    }

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
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(editing ? "আপডেট হয়েছে" : "কাস্টমার যোগ হয়েছে");
    setOpen(false);
    load();
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleteId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("মুছে ফেলা হয়েছে");
    setDeleteId(null);
    load();
  };

  const filtered = list.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search),
  );

  const openProfile = (id: string) => {
    navigate({ to: "/customers/$id", params: { id } });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-display">কাস্টমার</h1>
          <p className="text-sm text-muted-foreground">কাস্টমারদের তালিকা ও তথ্য ব্যবস্থাপনা</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="size-4" /> নতুন কাস্টমার
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "কাস্টমার সম্পাদনা" : "নতুন কাস্টমার"}</DialogTitle>
              <DialogDescription>
                কাস্টমারের মৌলিক তথ্য সংরক্ষণ করুন যাতে পরবর্তী বিক্রয় ও বাকি হিসাব তার প্রোফাইলে দেখা যায়।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>নাম *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>ফোন</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>ঠিকানা</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>নোট</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                বাতিল
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                সংরক্ষণ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        <Input
          placeholder="খুঁজুন (নাম বা ফোন)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-2xl border-primary/20 bg-card pl-10 shadow-card focus-visible:ring-primary"
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 grid place-items-center text-center gap-3">
            <UsersIcon className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো কাস্টমার পাওয়া যায়নি</p>
            <Button onClick={openNew}>
              <Plus className="size-4" /> প্রথম কাস্টমার যোগ করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => openProfile(c.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProfile(c.id);
                }
              }}
              className="group cursor-pointer overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/10 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elegant focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to="/customers/$id"
                        params={{ id: c.id }}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate text-base font-bold text-foreground transition-colors hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        প্রোফাইল দেখুন <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(event) => event.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {c.phone && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-muted-foreground">
                    <Phone className="size-3.5 text-primary" /> {c.phone}
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" /> {c.address}
                  </div>
                )}
                {c.notes && <div className="rounded-xl border border-primary/10 bg-card/80 px-3 py-2 text-xs text-muted-foreground">{c.notes}</div>}
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