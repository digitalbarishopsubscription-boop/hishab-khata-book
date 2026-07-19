import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, BookOpen, Users, Menu,
  Truck, ShoppingBag, Package, FileText, Receipt, Wallet,
  UserCog, Building2, BarChart3, Bot, Bell, Crown, Shield, Settings,
  HandCoins, LogOut,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";

const primary = [
  { title: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard },
  { title: "বিক্রয়", url: "/sales", icon: ShoppingCart },
  { title: "খাতা", url: "/khata", icon: BookOpen },
  { title: "কাস্টমার", url: "/customers", icon: Users },
];

const moreGroups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "মূল",
    items: [{ title: "এআই সহকারী", url: "/ai-assistant", icon: Bot }],
  },
  {
    label: "ব্যবসায়িক",
    items: [
      { title: "সাপ্লায়ার", url: "/suppliers", icon: Truck },
      { title: "পেমেন্ট গ্রহণ", url: "/payments", icon: HandCoins },
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

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-elegant">
      <ul className="grid grid-cols-5">
        {primary.map((it) => {
          const active = pathname === it.url;
          return (
            <li key={it.title}>
              <Link
                to={it.url}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <it.icon className="size-5" />
                {it.title}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              >
                <Menu className="size-5" />
                আরও
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-96 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="হিসাব পত্র"
                    className="h-8 w-auto rounded-lg bg-white p-0.5 shadow-sm"
                  />
                  <span className="text-display">হিসাব পত্র</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                {moreGroups.map((g) => (
                  <div key={g.label}>
                    <div className="px-1 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {g.label}
                    </div>
                    <ul className="space-y-1">
                      {g.items.map((item) => {
                        const active = pathname === item.url;
                        return (
                          <li key={item.title}>
                            <Link
                              to={item.url}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                                active
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground/80 hover:bg-accent/60"
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
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2.5 px-2 py-2">
                    <div className="size-9 rounded-full bg-gold grid place-items-center text-gold-foreground font-bold text-sm">
                      {user?.email?.[0]?.toUpperCase() ?? "M"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user?.user_metadata?.owner_name ?? "মালিক"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="p-1.5 rounded-md hover:bg-accent"
                      title="লগআউট"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
