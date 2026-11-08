import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, BookOpen, Users, Menu,
  Truck, ShoppingBag, Package, FileText, Receipt, Wallet,
  UserCog, Building2, BarChart3, Bot, Bell, GraduationCap, Settings,
  HandCoins, LogOut, Download, FileSpreadsheet, LoaderCircle, type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { createBusinessBackup, downloadBusinessBackup } from "@/lib/business-backup";
import { toast } from "sonner";

const primary = [
  { title: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard },
  { title: "বিক্রয়", url: "/sales", icon: ShoppingCart },
  { title: "খাতা", url: "/khata", icon: BookOpen },
  { title: "কাস্টমার", url: "/customers", icon: Users },
];

const moreItems: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "এআই সহকারী", url: "/ai-assistant", icon: Bot },
  { title: "সাপ্লায়ার", url: "/suppliers", icon: Truck },
  { title: "পেমেন্ট গ্রহণ", url: "/payments", icon: HandCoins },
  { title: "ক্রয়", url: "/purchases", icon: ShoppingBag },
  { title: "ইনভেন্টরি", url: "/inventory", icon: Package },
  { title: "ইনভয়েস", url: "/invoices", icon: FileText },
  { title: "খরচ", url: "/expenses", icon: Receipt },
  { title: "আর্থিক", url: "/finance", icon: Wallet },
  { title: "কর্মচারী", url: "/employees", icon: UserCog },
  { title: "ব্রাঞ্চ", url: "/branches", icon: Building2 },
  { title: "রিপোর্ট", url: "/reports", icon: BarChart3 },
  { title: "নোটিফিকেশন", url: "/notifications", icon: Bell },
  { title: "টিউটোরিয়াল", url: "/tutorial", icon: GraduationCap },
  { title: "সেটিংস", url: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backup, setBackup] = useState<{ blob: Blob; filename: string } | null>(null);
  const { user, signOut } = useAuth();
  const moreActive = moreItems.some((item) => pathname === item.url || pathname.startsWith(`${item.url}/`));

  return (
    <nav
      aria-label="মোবাইল নেভিগেশন"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="pointer-events-auto mx-auto grid h-[4.5rem] max-w-md grid-cols-5 overflow-hidden rounded-2xl border border-primary/15 bg-card/80 px-1.5 shadow-elegant backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
        {primary.map((it) => {
          const active = pathname === it.url || pathname.startsWith(`${it.url}/`);
          return (
            <li key={it.title} className="flex items-center justify-center">
              <Link
                to={it.url}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-[3.75rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/12 text-primary shadow-sm ring-1 ring-inset ring-primary/15"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                )}
              >
                <it.icon className={cn("size-5 transition-transform duration-200", active && "scale-110")} />
                <span className="truncate">{it.title}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex items-center justify-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                aria-label="আরও অপশন"
                className={cn(
                  "relative h-[3.75rem] w-full min-w-0 flex-col gap-1 rounded-xl px-0 text-[11px] font-medium",
                  moreActive
                    ? "bg-primary/12 text-primary shadow-sm ring-1 ring-inset ring-primary/15 hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                )}
              >
                <Menu className={cn("size-5 transition-transform duration-200", moreActive && "scale-110")} />
                <span>আরও</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[100dvh] w-full max-w-none overflow-y-auto rounded-t-2xl p-4 sm:p-6">
              <SheetHeader className="mb-5 pr-10 text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="হিসাব পত্র"
                    className="h-8 w-auto rounded-lg bg-white p-0.5 shadow-sm"
                  />
                  <span className="text-display">আরও অপশন</span>
                </SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3">
                {moreItems.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex aspect-[1.65] min-h-16 flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 text-center transition-colors",
                        active
                          ? "border-primary/40 bg-accent text-accent-foreground"
                          : "border-border text-foreground hover:bg-accent/60",
                      )}
                    >
                      <item.icon className="size-6 text-primary" />
                      <span className="text-xs font-medium leading-snug">{item.title}</span>
                    </Link>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto min-h-16 aspect-[1.65] flex-col gap-2 whitespace-normal rounded-xl border border-border px-2 text-center"
                  disabled={backupLoading || !user}
                  onClick={async () => {
                    if (!user) return;
                    setBackupLoading(true);
                    setBackup(null);
                    try {
                      setBackup(await createBusinessBackup(user.id));
                      toast.success("Excel ব্যাকআপ তৈরি হয়েছে");
                    } catch {
                      toast.error("ব্যাকআপ তৈরি করা যায়নি। আবার চেষ্টা করুন।");
                    } finally {
                      setBackupLoading(false);
                    }
                  }}
                >
                  {backupLoading ? <LoaderCircle className="size-6 animate-spin" /> : <FileSpreadsheet className="size-6 text-primary" />}
                  <span className="text-xs font-medium leading-snug">
                    {backupLoading ? "তৈরি হচ্ছে…" : "ব্যাকআপ ফাইল"}
                  </span>
                </Button>
              </div>
              {backup ? (
                <Button
                  type="button"
                  className="mt-3 w-full"
                  onClick={() => downloadBusinessBackup(backup.blob, backup.filename)}
                >
                  <Download />
                  Excel ফাইল ডাউনলোড করুন
                </Button>
              ) : null}
              <div className="mt-5 border-t border-border pt-3">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="লগআউট"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
