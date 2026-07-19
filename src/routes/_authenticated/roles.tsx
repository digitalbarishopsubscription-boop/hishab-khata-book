import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, UserPlus, Trash2, Loader2, Users, Crown, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [{ title: "রোল ও অনুমতি — হিসাব পত্র" }] }),
  component: RolesPage,
});

type AppRole = "admin" | "moderator" | "user";
type RoleRow = { id: string; user_id: string; role: AppRole; created_at: string };

const ROLE_META: Record<AppRole, { label: string; desc: string; color: string }> = {
  admin: { label: "অ্যাডমিন", desc: "সব ফিচারে সম্পূর্ণ অ্যাক্সেস", color: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300" },
  moderator: { label: "মডারেটর", desc: "কন্টেন্ট ও লেনদেন পরিচালনা", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  user: { label: "ইউজার", desc: "সাধারণ ব্যবহারকারী", color: "bg-muted text-muted-foreground" },
};

const PERMISSIONS: { name: string; admin: boolean; moderator: boolean; user: boolean }[] = [
  { name: "বিক্রয় ও ইনভয়েস দেখা",     admin: true,  moderator: true,  user: true  },
  { name: "বিক্রয় যোগ ও সম্পাদনা",     admin: true,  moderator: true,  user: false },
  { name: "ক্রয় ও ইনভেন্টরি পরিচালনা", admin: true,  moderator: true,  user: false },
  { name: "খরচ পরিচালনা",                admin: true,  moderator: true,  user: false },
  { name: "খাতা/বাকি পরিচালনা",         admin: true,  moderator: true,  user: false },
  { name: "কাস্টমার পরিচালনা",          admin: true,  moderator: true,  user: true  },
  { name: "রিপোর্ট দেখা",               admin: true,  moderator: true,  user: false },
  { name: "রোল ও অনুমতি পরিচালনা",     admin: true,  moderator: false, user: false },
  { name: "সেটিংস পরিবর্তন",            admin: true,  moderator: false, user: false },
];

function RolesPage() {
  const { user } = useAuth();
  const [myRoles, setMyRoles] = useState<AppRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState<{ user_id: string; role: AppRole }>({ user_id: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<RoleRow | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return;
    const rows = (data ?? []) as RoleRow[];
    setAllRoles(rows);
    const mine = rows.filter((r) => r.user_id === user.id).map((r) => r.role);
    setMyRoles(mine);
    setIsAdmin(mine.includes("admin"));
  };
  useEffect(() => { load(); }, [user]);

  const addRole = async () => {
    if (!addForm.user_id.trim()) return toast.error("User ID দিন");
    setSaving(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: addForm.user_id.trim(), role: addForm.role,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("রোল যোগ হয়েছে");
    setAddForm({ user_id: "", role: "user" });
    load();
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", confirmDel.id);
    if (error) return toast.error(error.message);
    toast.success("রোল সরানো হয়েছে");
    setConfirmDel(null);
    load();
  };

  const counts = useMemo(() => {
    const c = { admin: 0, moderator: 0, user: 0 } as Record<AppRole, number>;
    allRoles.forEach((r) => { c[r.role] = (c[r.role] ?? 0) + 1; });
    return c;
  }, [allRoles]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-display">রোল ও অনুমতি</h1>
        <p className="text-sm text-muted-foreground mt-1">ব্যবহারকারীদের ভূমিকা ও অনুমতি ব্যবস্থাপনা</p>
      </header>

      {/* My roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-primary" /> আপনার রোল
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {myRoles.length === 0 ? (
              <span className="text-sm text-muted-foreground">কোনো রোল বরাদ্দ নেই</span>
            ) : (
              myRoles.map((r) => (
                <Badge key={r} className={ROLE_META[r].color} variant="secondary">{ROLE_META[r].label}</Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Crown} label="অ্যাডমিন" value={counts.admin} />
        <Stat icon={Shield} label="মডারেটর" value={counts.moderator} />
        <Stat icon={Users} label="ইউজার" value={counts.user} />
      </div>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">অনুমতি ম্যাট্রিক্স</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-3 py-2 font-medium">অনুমতি</th>
                <th className="px-3 py-2 font-medium">অ্যাডমিন</th>
                <th className="px-3 py-2 font-medium">মডারেটর</th>
                <th className="px-3 py-2 font-medium">ইউজার</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.name} className="border-b last:border-0">
                  <td className="px-3 py-2.5">{p.name}</td>
                  <td className="px-3 py-2.5 text-center"><Cell on={p.admin} /></td>
                  <td className="px-3 py-2.5 text-center"><Cell on={p.moderator} /></td>
                  <td className="px-3 py-2.5 text-center"><Cell on={p.user} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Admin management */}
      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="size-4" /> নতুন রোল বরাদ্দ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                <div>
                  <Label className="mb-1.5 block">User ID (UUID)</Label>
                  <Input
                    placeholder="যেমন: 3f0a…"
                    value={addForm.user_id}
                    onChange={(e) => setAddForm({ ...addForm, user_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">রোল</Label>
                  <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">অ্যাডমিন</SelectItem>
                      <SelectItem value="moderator">মডারেটর</SelectItem>
                      <SelectItem value="user">ইউজার</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addRole} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                    যোগ করুন
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                User ID পেতে: ব্যবহারকারী প্রোফাইল থেকে UUID কপি করুন।
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">সকল রোল বরাদ্দ</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
              ) : allRoles.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">কোনো রোল বরাদ্দ নেই</div>
              ) : (
                <div className="space-y-2">
                  {allRoles.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-mono text-muted-foreground truncate">{r.user_id}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={ROLE_META[r.role].color} variant="secondary">
                            {ROLE_META[r.role].label}
                          </Badge>
                          {r.user_id === user?.id && (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">আপনি</span>
                          )}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDel(r)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
          শুধুমাত্র অ্যাডমিন ব্যবহারকারীরা অন্যদের রোল পরিচালনা করতে পারেন।
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>রোল সরাবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই ব্যবহারকারী থেকে "{confirmDel && ROLE_META[confirmDel.role].label}" রোল সরানো হবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>সরান</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  const bn = (n: number) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold text-display">{bn(value)}</div>
      </div>
    </div>
  );
}

function Cell({ on }: { on: boolean }) {
  return on
    ? <CheckCircle2 className="size-4 text-success inline" />
    : <XCircle className="size-4 text-muted-foreground/40 inline" />;
}
