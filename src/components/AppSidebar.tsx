import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Truck, BookOpen, ShoppingCart, ShoppingBag,
  Package, FileText, Receipt, Wallet, UserCog, Building2, BarChart3,
  Bot, Bell, Crown, Shield, Settings, LogOut, HandCoins,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const groups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "মূল",
    items: [
      { title: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard },
      { title: "এআই সহকারী", url: "/ai-assistant", icon: Bot },
    ],
  },
  {
    label: "ব্যবসায়িক",
    items: [
      { title: "কাস্টমার", url: "/customers", icon: Users },
      { title: "সাপ্লায়ার", url: "/suppliers", icon: Truck },
      { title: "খাতা ও বাকি", url: "/khata", icon: BookOpen },
      { title: "পেমেন্ট গ্রহণ", url: "/payments", icon: HandCoins },
      { title: "বিক্রয়", url: "/sales", icon: ShoppingCart },
      { title: "ক্রয়", url: "/purchases", icon: ShoppingBag },
      { title: "ইনভেন্টরি", url: "/inventory", icon: Package },
      { title: "ইনভয়েস", url: "/invoices", icon: FileText },
      { title: "খরচ", url: "/expenses", icon: Receipt },
      { title: "আর্থিক", url: "/finance", icon: Wallet },
    ],
  },
  {
    label: "ব্যবস্থাপনা",
    items: [
      { title: "কর্মচারী", url: "/employees", icon: UserCog },
      { title: "ব্রাঞ্চ", url: "/branches", icon: Building2 },
      { title: "রিপোর্ট", url: "/reports", icon: BarChart3 },
      { title: "নোটিফিকেশন", url: "/notifications", icon: Bell },
      { title: "CEO কন্ট্রোল", url: "/ceo", icon: Crown },
      { title: "রোল ও অনুমতি", url: "/roles", icon: Shield },
      { title: "সেটিংস", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="হিসাব পত্র"
            className="h-10 w-auto rounded-lg bg-white p-0.5 shadow-sm"
          />
          <div>
            <div className="font-bold text-display leading-none">হিসাব পত্র</div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-0.5">ব্যবসা ব্যবস্থাপনা</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              {g.label}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = pathname === item.url;
                return (
                  <li key={item.title}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="size-9 rounded-full bg-gold grid place-items-center text-gold-foreground font-bold text-sm">
            {user?.email?.[0]?.toUpperCase() ?? "M"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.user_metadata?.owner_name ?? "মালিক"}</div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">{user?.email}</div>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-md hover:bg-sidebar-accent" title="লগআউট">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
