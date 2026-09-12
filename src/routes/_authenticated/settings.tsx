import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User, Lock, Building2, Shield, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "সেটিংস — হিসাব পত্র" },
      { name: "description", content: "প্রোফাইল, ব্যবসা ও নিরাপত্তা সেটিংস পরিবর্তন করুন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: SettingsPage,
});

type AppRole = "admin" | "moderator" | "user";
type RoleRow = { id: string; user_id: string; role: AppRole; created_at: string };

function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [profile, setProfile] = useState({
    owner_name: "",
    business_name: "",
    phone: "",
    address: "",
  });
  const [pw, setPw] = useState({ next: "", confirm: "" });

  // Roles
  const [myRoles, setMyRoles] = useState<AppRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleRow[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [addForm, setAddForm] = useState<{ user_id: string; role: AppRole }>({ user_id: "", role: "user" });
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    const m = (user?.user_metadata ?? {}) as Record<string, string>;
    setProfile({
      owner_name: m.owner_name ?? "",
      business_name: m.business_name ?? "",
      phone: m.phone ?? "",
      address: m.address ?? "",
    });
  }, [user]);

  const loadRoles = async () => {
    if (!user) return;
    setRolesLoading(true);
    const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    setRolesLoading(false);
    if (error) return;
    const rows = (data ?? []) as RoleRow[];
    setAllRoles(rows);
    const mine = rows.filter((r) => r.user_id === user.id).map((r) => r.role);
    setMyRoles(mine);
    setIsAdmin(mine.includes("admin"));
  };

  useEffect(() => {
    loadRoles();
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: profile });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("তথ্য সংরক্ষণ করা হয়েছে");
  };

  const changePassword = async () => {
    if (pw.next.length < 6) return toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    if (pw.next !== pw.confirm) return toast.error("পাসওয়ার্ড মিলছে না");
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwSaving(false);
    if (error) return toast.error(error.message);
    setPw({ next: "", confirm: "" });
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
  };

  const addRole = async () => {
    if (!addForm.user_id.trim()) return toast.error("User ID দিন");
    setAddSaving(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: addForm.user_id.trim(),
      role: addForm.role,
    });
    setAddSaving(false);
    if (error) return toast.error(error.message);
    toast.success("রোল যোগ হয়েছে");
    setAddForm({ user_id: "", role: "user" });
    loadRoles();
  };

  const removeRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("রোল সরানো হয়েছে");
    loadRoles();
  };

  const roleColor = (r: AppRole) =>
    r === "admin" ? "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300" :
    r === "moderator" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300" :
    "bg-muted text-muted-foreground";

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-display">সেটিংস</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার প্রোফাইল ও ব্যবসার তথ্য ব্যবস্থাপনা করুন</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile"><User className="size-4 mr-1.5" />প্রোফাইল</TabsTrigger>
          <TabsTrigger value="business"><Building2 className="size-4 mr-1.5" />ব্যবসা</TabsTrigger>
          <TabsTrigger value="security"><Lock className="size-4 mr-1.5" />সিকিউরিটি</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="size-4 mr-1.5" />রোল</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>ইমেইল</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label>মালিকের নাম</Label>
              <Input
                value={profile.owner_name}
                onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })}
                placeholder="আপনার নাম"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>ফোন</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="mt-1.5"
              />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4 mr-1.5" />সংরক্ষণ করুন</>}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-5">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>ব্যবসার নাম</Label>
              <Input
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                placeholder="আপনার দোকান/ব্যবসার নাম"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>ঠিকানা</Label>
              <Textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="ব্যবসার ঠিকানা"
                rows={3}
                className="mt-1.5"
              />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4 mr-1.5" />সংরক্ষণ করুন</>}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>নতুন পাসওয়ার্ড</Label>
              <Input
                type="password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <Button onClick={changePassword} disabled={pwSaving} className="w-full">
              {pwSaving ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4 mr-1.5" />পাসওয়ার্ড পরিবর্তন</>}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-5 space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <div>
                <div className="font-semibold">আপনার রোল</div>
                <div className="text-xs text-muted-foreground">এই অ্যাকাউন্টে বরাদ্দকৃত অনুমতি</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {myRoles.length === 0 ? (
                <span className="text-sm text-muted-foreground">কোন রোল বরাদ্দ নেই</span>
              ) : (
                myRoles.map((r) => (
                  <Badge key={r} className={roleColor(r)} variant="secondary">{r}</Badge>
                ))
              )}
            </div>
          </div>

          {isAdmin ? (
            <>
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="font-semibold flex items-center gap-1.5"><UserPlus className="size-4" /> নতুন রোল বরাদ্দ</div>
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                  <Input
                    placeholder="User ID (UUID)"
                    value={addForm.user_id}
                    onChange={(e) => setAddForm({ ...addForm, user_id: e.target.value })}
                  />
                  <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="moderator">moderator</SelectItem>
                      <SelectItem value="user">user</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addRole} disabled={addSaving}>
                    {addSaving ? <Loader2 className="size-4 animate-spin" /> : "যোগ করুন"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">User ID সেই ব্যবহারকারীর প্রোফাইল থেকে পাবেন।</p>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <div className="font-semibold mb-3">সকল রোল ({allRoles.length})</div>
                {rolesLoading ? (
                  <div className="py-6 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
                ) : allRoles.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">কোন রোল নেই</div>
                ) : (
                  <div className="space-y-2">
                    {allRoles.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-mono text-muted-foreground truncate">{r.user_id}</div>
                          <Badge className={`${roleColor(r.role)} mt-1`} variant="secondary">{r.role}</Badge>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeRole(r.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
              শুধুমাত্র admin ব্যবহারকারীরা অন্যদের রোল পরিচালনা করতে পারেন।
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
