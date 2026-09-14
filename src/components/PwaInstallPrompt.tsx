import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "hishab-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-28 z-50 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96">
      <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-elegant backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Download className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">অ্যাপ ইনস্টল করুন</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              হোম স্ক্রিনে যোগ করুন — ইন্টারনেট ছাড়াও খুলবে।
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={install}>ইনস্টল করুন</Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>পরে</Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="বন্ধ করুন"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
