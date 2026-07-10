import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bot, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { aiChat } from "@/lib/api/ai-chat.functions";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  head: () => ({ meta: [{ title: "এআই সহকারী — হিসাব" }] }),
  component: AiPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "আমার এই মাসের বিক্রয় কেমন?",
  "খরচ কমানোর উপায় বলো",
  "নতুন কাস্টমার কীভাবে বাড়াবো?",
  "ইনভেন্টরি ম্যানেজমেন্টের টিপস দাও",
];

function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "আসসালামু আলাইকুম! আমি আপনার এআই ব্যবসা সহকারী। ব্যবসা সংক্রান্ত যেকোনো প্রশ্ন করুন।" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await aiChat({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: e?.message?.includes("credits_exhausted")
          ? "এআই ক্রেডিট শেষ। কর্মক্ষেত্রে ক্রেডিট যোগ করুন।"
          : e?.message?.includes("rate_limited")
          ? "অনেক অনুরোধ! একটু পর আবার চেষ্টা করুন।"
          : "এআই সেবায় সমস্যা হচ্ছে। আবার চেষ্টা করুন।",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-2rem)]">
      <header className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground">
          <Bot className="size-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-display">এআই সহকারী</h1>
          <p className="text-xs text-muted-foreground">আপনার ব্যক্তিগত ব্যবসা পরামর্শদাতা</p>
        </div>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`size-8 rounded-full grid place-items-center shrink-0 ${
                m.role === "user" ? "bg-gold text-gold-foreground" : "bg-primary text-primary-foreground"
              }`}>
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center"><Bot className="size-4" /></div>
              <div className="bg-muted rounded-2xl px-4 py-2.5"><Loader2 className="size-4 animate-spin" /></div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="p-3 border-t flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="আপনার প্রশ্ন লিখুন..."
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
