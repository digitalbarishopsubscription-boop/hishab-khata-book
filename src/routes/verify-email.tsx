import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "ইমেইল যাচাই করুন — হিসাব পত্র" },
      { name: "description", content: "অ্যাকাউন্ট চালু করতে আপনার ইমেইলে পাঠানো যাচাই লিংকে ক্লিক করুন।" },
      { property: "og:title", content: "ইমেইল যাচাই করুন — হিসাব পত্র" },
      { property: "og:description", content: "অ্যাকাউন্ট চালু করতে আপনার ইমেইলে পাঠানো যাচাই লিংকে ক্লিক করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = useSearch({ from: "/verify-email" });
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("যাচাই ইমেইল আবার পাঠানো হয়েছে।");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="হিসাব পত্র" className="mx-auto h-14 w-auto rounded-xl bg-white p-1 shadow-sm" />

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-8 text-primary" />
          </div>
          <h1 className="mt-6 text-display text-2xl font-bold text-foreground">আপনার ইমেইল চেক করুন</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            আমরা{" "}
            {email ? <span className="font-medium text-foreground">{email}</span> : "আপনার ইমেইল"}{" "}
            ঠিকানায় একটি যাচাই লিংক পাঠিয়েছি। লিংকে ক্লিক করলেই আপনার অ্যাকাউন্ট চালু হয়ে যাবে।
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            ইমেইল না পেলে স্প্যাম বা প্রমোশন ফোল্ডার দেখুন।
          </p>

          {email && (
            <Button variant="outline" className="mt-6 w-full" onClick={resend} disabled={sending}>
              {sending && <Loader2 className="size-4 mr-2 animate-spin" />} আবার ইমেইল পাঠান
            </Button>
          )}

          <Link
            to="/login"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
