import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, Package,
  Plus, Users, ShoppingCart, BookOpen, Receipt, Activity, Bot, Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "ড্যাশবোর্ড — হিসাব" }] }),
  component: Dashboard,
});

// Bengali numeral conversion
const bn = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const kpis = [
  { label: "আজকের বিক্রয়", value: 42500, change: "+১২.৫%", up: true, icon: ShoppingCart, tone: "primary" },
  { label: "আজকের খরচ", value: 8200, change: "-৩.২%", up: false, icon: Receipt, tone: "warning" },
  { label: "আজকের লাভ", value: 34300, change: "+১৮.৪%", up: true, icon: TrendingUp, tone: "success" },
  { label: "ক্যাশ ব্যালেন্স", value: 215000, change: "+৪.১%", up: true, icon: Wallet, tone: "gold" },
];

const toneClass: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  gold: "bg-gold/20 text-gold-foreground",
};

const quickActions = [
  { icon: Plus, label: "বিক্রয় এন্ট্রি" },
  { icon: BookOpen, label: "খাতা এন্ট্রি" },
  { icon: Users, label: "নতুন কাস্টমার" },
  { icon: Receipt, label: "খরচ যোগ" },
];

const activities = [
  { who: "রহিম মিয়া", what: "৳৫,২০০ পেমেন্ট নিয়েছেন", when: "৫ মিনিট আগে", tag: "পেমেন্ট" },
  { who: "করিম স্টোর", what: "নতুন বিক্রয় ৳১২,৮০০", when: "১৫ মিনিট আগে", tag: "বিক্রয়" },
  { who: "আবুল হোসেন", what: "৳৩,৪০০ বাকি যোগ হয়েছে", when: "১ ঘন্টা আগে", tag: "বাকি" },
  { who: "মুদি দোকান", what: "ইনভেন্টরি স্টক আপডেট", when: "২ ঘন্টা আগে", tag: "স্টক" },
];

function Dashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.owner_name as string) || "মালিক";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">আস্‌সালামু আলাইকুম 👋</p>
          <h1 className="text-display text-2xl sm:text-3xl font-bold text-foreground mt-1">{name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            আজ {bn(new Date().toLocaleDateString("en-US", { day: "numeric" }))} — এই হলো আপনার ব্যবসার অবস্থা
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full"><Bell className="size-4" /></Button>
          <Button className="hidden sm:inline-flex"><Plus className="size-4 mr-1.5" /> নতুন এন্ট্রি</Button>
        </div>
      </div>

      {/* Business Health Score banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-5 sm:p-6 text-primary-foreground shadow-elegant mb-6">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-gold/20 blur-2xl" />
        <div className="absolute -right-4 -bottom-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">ব্যবসা স্বাস্থ্য স্কোর</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-display text-5xl font-extrabold">{bn(87)}</span>
              <span className="text-sm opacity-80">/ {bn(100)}</span>
            </div>
            <div className="mt-1 text-sm opacity-90">চমৎকার — আপনার ব্যবসা ভালো অবস্থায় আছে</div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3.5 py-2.5">
            <Bot className="size-4" />
            <span className="text-sm">এআই থেকে পরামর্শ দেখুন</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-card hover:shadow-elegant transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`size-9 rounded-xl grid place-items-center ${toneClass[k.tone]}`}>
                <k.icon className="size-4.5" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.change}
              </span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-0.5 text-display text-xl sm:text-2xl font-bold text-foreground">
              ৳{bn(k.value.toLocaleString("en-IN"))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={AlertCircle}
          tone="warning"
          title="বাকি সারসংক্ষেপ"
          rows={[
            ["মোট বাকি (পাবো)", `৳${bn("৭৮,৫০০")}`],
            ["মোট দেনা (দিতে হবে)", `৳${bn("২৩,২০০")}`],
            ["আজ পরিশোধযোগ্য", `৳${bn("১২,৪০০")}`],
          ]}
        />
        <SummaryCard
          icon={Package}
          tone="primary"
          title="ইনভেন্টরি সারসংক্ষেপ"
          rows={[
            ["মোট পণ্য", bn("১৪২")],
            ["কম স্টক", bn("৭")],
            ["স্টক ভ্যালু", `৳${bn("৩,৪২,০০০")}`],
          ]}
        />
        <SummaryCard
          icon={Activity}
          tone="success"
          title="পারফরম্যান্স (এই মাস)"
          rows={[
            ["মোট বিক্রয়", `৳${bn("১২,৫০,০০০")}`],
            ["মোট লাভ", `৳${bn("২,৮৫,০০০")}`],
            ["গ্রোথ", "+১৪.২%"],
          ]}
        />
      </div>

      {/* Quick actions + recent */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl bg-card border border-border p-5 shadow-card">
          <h3 className="text-display font-semibold text-foreground mb-3">দ্রুত অ্যাকশন</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <button key={a.label} className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-secondary hover:bg-accent transition-colors text-center">
                <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
                  <a.icon className="size-4" />
                </div>
                <span className="text-xs font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-display font-semibold text-foreground">সাম্প্রতিক কার্যকলাপ</h3>
            <button className="text-xs text-primary font-medium hover:underline">সব দেখুন</button>
          </div>
          <ul className="divide-y divide-border">
            {activities.map((a, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <div className="size-9 rounded-full bg-secondary grid place-items-center text-primary font-semibold text-sm shrink-0">
                  {a.who[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{a.who}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.what}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{a.tag}</span>
                  <div className="text-[11px] text-muted-foreground mt-1">{a.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, tone, title, rows,
}: { icon: any; tone: string; title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`size-9 rounded-xl grid place-items-center ${toneClass[tone]}`}>
          <Icon className="size-4.5" />
        </div>
        <h3 className="text-display font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-semibold text-foreground">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
