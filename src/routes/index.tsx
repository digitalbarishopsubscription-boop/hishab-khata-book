import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { TrendingUp, Wallet, Users, BookOpen, Bot, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "হিসাব — বাংলায় সম্পূর্ণ ব্যবসা ব্যবস্থাপনা" },
      { name: "description", content: "খাতা, বিক্রয়, ইনভেন্টরি, এআই — এক অ্যাপেই আপনার পুরো ব্যবসা।" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-display">হি</div>
            <span className="font-bold text-lg text-display">হিসাব</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">লগইন</Link></Button>
            <Button asChild><Link to="/signup">শুরু করুন</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 to-background" />
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-success" /> বাংলায় তৈরি • মোবাইল ফার্স্ট • অফলাইন সাপোর্ট
          </div>
          <h1 className="text-display text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            আপনার ব্যবসার <span className="bg-gradient-primary bg-clip-text text-transparent">পুরো হিসাব</span><br />
            এক অ্যাপেই
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            খাতা, বিক্রয়, ক্রয়, ইনভেন্টরি, কর্মচারী, রিপোর্ট এবং এআই সহকারী — দোকানদার থেকে কর্পোরেট পর্যন্ত সবার জন্য।
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild className="shadow-elegant">
              <Link to="/signup">বিনামূল্যে শুরু করুন</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">লগইন করুন</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, title: "খাতা ও বাকি", desc: "দেনা-পাওনার পূর্ণ ট্র্যাকিং, পেমেন্ট রিমাইন্ডার সহ।" },
            { icon: TrendingUp, title: "বিক্রয় ও ক্রয়", desc: "দৈনিক বিক্রয়, ইনভয়েস ও রিটার্ন ব্যবস্থাপনা।" },
            { icon: Wallet, title: "ক্যাশ ও ব্যাংক", desc: "ক্যাশ ফ্লো, লাভ-ক্ষতি ও ব্যাংক রিকনসিলিয়েশন।" },
            { icon: Users, title: "কাস্টমার ও সাপ্লায়ার", desc: "প্রোফাইল, লেনদেন ইতিহাস ও অ্যানালিটিক্স।" },
            { icon: Bot, title: "এআই ব্যবসা সহকারী", desc: "চ্যাটে রিপোর্ট তৈরি, পরামর্শ ও সিদ্ধান্ত সহায়তা।" },
            { icon: ShieldCheck, title: "নিরাপদ ও মালিক-নিয়ন্ত্রিত", desc: "শুধু মালিকই ব্যবহারকারী যোগ করতে পারবেন।" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant transition-shadow">
              <div className="size-11 rounded-xl bg-secondary grid place-items-center text-primary mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-display text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} হিসাব। সকল অধিকার সংরক্ষিত।
      </footer>
    </div>
  );
}
