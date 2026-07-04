import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User, Lock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

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

  useEffect(() => {
    const m = (user?.user_metadata ?? {}) as Record<string, string>;
    setProfile({
      owner_name: m.owner_name ?? "",
      business_name: m.business_name ?? "",
      phone: m.phone ?? "",
      address: m.address ?? "",
    });
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

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-display">সেটিংস</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার প্রোফাইল ও ব্যবসার তথ্য ব্যবস্থাপনা করুন</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="profile"><User className="size-4 mr-1.5" />প্রোফাইল</TabsTrigger>
          <TabsTrigger value="business"><Building2 className="size-4 mr-1.5" />ব্যবসা</TabsTrigger>
          <TabsTrigger value="security"><Lock className="size-4 mr-1.5" />সিকিউরিটি</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
