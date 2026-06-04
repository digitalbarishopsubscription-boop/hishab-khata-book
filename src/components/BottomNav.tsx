import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, BookOpen, Users, Menu } from "lucide-react";

const items = [
  { title: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard },
  { title: "বিক্রয়", url: "/sales", icon: ShoppingCart },
  { title: "খাতা", url: "/khata", icon: BookOpen },
  { title: "কাস্টমার", url: "/customers", icon: Bot },
  { title: "আরও", url: "/dashboard", icon: Menu },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-elegant">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
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
      </ul>
    </nav>
  );
}
