import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bot, Send, Loader2, User, Check, X, ShieldCheck, Mic, Square, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { aiChat, executeAiAction, transcribeAudio, type PendingAction } from "@/lib/api/ai-chat.functions";
import { startRecording, blobToBase64, fileToDataUrl, type VoiceRecorder } from "@/lib/audio-recorder";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/ai-assistant")({
  head: () => ({ meta: [{ title: "এআই সহকারী — হিসাব পত্র" }] }),
  component: AiPage,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  actions?: PendingAction[];
  actionStatus?: Record<string, "pending" | "approved" | "rejected" | "running">;
};


const SUGGESTIONS = [
  "এই মাসের বিক্রয়, খরচ ও লাভ দেখাও",
  "কোন প্রোডাক্টের স্টক কম?",
  "৫০০ টাকা দোকান ভাড়া খরচ যোগ করো",
  "নতুন কাস্টমার করিম, ফোন 01700000000",
];

const FIELD_LABELS: Record<string, string> = {
  title: "শিরোনাম", category: "ক্যাটাগরি", amount: "পরিমাণ", payment_method: "পেমেন্ট",
  notes: "নোট", expense_date: "তারিখ", name: "নাম", phone: "ফোন", address: "ঠিকানা",
  unit: "একক", stock: "স্টক", purchase_price: "ক্রয়মূল্য", sale_price: "বিক্রয়মূল্য",
  sku: "SKU", low_stock_threshold: "লো-স্টক সীমা", product_id: "প্রোডাক্ট আইডি",
  new_stock: "নতুন স্টক", reason: "কারণ", customer_name: "কাস্টমার", type: "ধরন",
  description: "বিবরণ",
};

function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "আসসালামু আলাইকুম! আমি আপনার এআই ব্যবসা সহকারী। ব্যবসার তথ্য জিজ্ঞেস করুন — এবং আপনার অনুমতিতে খরচ, কাস্টমার, প্রোডাক্ট বা স্টকও আপডেট করতে পারি।" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  const scrollDown = () =>
    setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);

  const pickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (!file.type.startsWith("image/")) {
        toast.error("শুধু ছবি ফাইল যোগ করা যাবে");
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("ছবিটি অনেক বড় (সর্বোচ্চ ৮MB)");
        continue;
      }
      picked.push(await fileToDataUrl(file));
    }
    if (picked.length) setAttachments((a) => [...a, ...picked].slice(0, 4));
  };

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setTranscribing(true);
      try {
        const rec = recorderRef.current;
        recorderRef.current = null;
        const blob = await rec!.stop();
        const audioBase64 = await blobToBase64(blob);
        const { text } = await transcribeAudio({ data: { audioBase64, mimeType: "audio/wav" } });
        if (text.trim()) setInput((v) => (v ? `${v} ${text.trim()}` : text.trim()));
        else toast.error("কিছু শোনা যায়নি — আবার চেষ্টা করুন");
      } catch (e: any) {
        toast.error(e?.message?.includes("credits_exhausted") ? "এআই ক্রেডিট শেষ।" : "ভয়েস রূপান্তর ব্যর্থ হয়েছে");
      } finally {
        setTranscribing(false);
      }
      return;
    }
    try {
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch {
      toast.error("মাইক্রোফোন অনুমতি প্রয়োজন");
    }
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    const imgs = text ? [] : attachments;
    if ((!q && imgs.length === 0) || loading) return;
    const outgoing: Msg = { role: "user", content: q, images: imgs };
    const next = [...messages, outgoing];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setLoading(true);
    scrollDown();
    try {
      const { reply, pendingActions } = await aiChat({
        data: {
          messages: next.map((m) =>
            m.images?.length
              ? {
                  role: m.role,
                  content: [
                    { type: "text", text: m.content || "এই ছবিটি দেখে সাহায্য করুন।" },
                    ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
                  ],
                }
              : { role: m.role, content: m.content },
          ),
        },
      });
      const status: Record<string, "pending"> = {};
      (pendingActions ?? []).forEach((a) => (status[a.id] = "pending"));

      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply, actions: pendingActions, actionStatus: status },
      ]);
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
      scrollDown();
    }
  };

  const setActionStatus = (msgIdx: number, actionId: string, s: "pending" | "approved" | "rejected" | "running") => {
    setMessages((m) =>
      m.map((msg, i) =>
        i === msgIdx
          ? { ...msg, actionStatus: { ...(msg.actionStatus ?? {}), [actionId]: s } }
          : msg,
      ),
    );
  };

  const approve = async (msgIdx: number, action: PendingAction) => {
    setActionStatus(msgIdx, action.id, "running");
    try {
      const { message } = await executeAiAction({ data: { tool: action.tool, args: action.args } });
      toast.success(message ?? "সংরক্ষিত");
      setActionStatus(msgIdx, action.id, "approved");
    } catch (e: any) {
      toast.error(e?.message ?? "সংরক্ষণ ব্যর্থ");
      setActionStatus(msgIdx, action.id, "pending");
    }
  };

  const reject = (msgIdx: number, action: PendingAction) => {
    setActionStatus(msgIdx, action.id, "rejected");
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-2rem)]">
      <header className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground">
          <Bot className="size-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-display">এআই সহকারী</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3" /> মালিকের অনুমোদন ছাড়া কোনো পরিবর্তন হবে না
          </p>
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
              <div className="max-w-[85%] space-y-2">
                {m.content && (
                  <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {m.content}
                  </div>
                )}
                {m.actions?.map((a) => {
                  const status = m.actionStatus?.[a.id] ?? "pending";
                  return (
                    <div key={a.id} className="rounded-xl border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-display">{a.label}</div>
                        {status === "approved" && <span className="text-xs text-success">✓ অনুমোদিত</span>}
                        {status === "rejected" && <span className="text-xs text-muted-foreground">✕ বাতিল</span>}
                      </div>
                      <div className="space-y-0.5 text-xs mb-3">
                        {Object.entries(a.args).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-muted-foreground min-w-[90px]">{FIELD_LABELS[k] ?? k}:</span>
                            <span className="font-medium break-all">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      {status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approve(i, a)} className="flex-1">
                            <Check className="size-3.5" /> অনুমোদন
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => reject(i, a)} className="flex-1">
                            <X className="size-3.5" /> বাতিল
                          </Button>
                        </div>
                      )}
                      {status === "running" && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" /> সংরক্ষণ হচ্ছে…
                        </div>
                      )}
                    </div>
                  );
                })}
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
            placeholder="যেমন: আজকের বিক্রয় কত? / ৩০০ টাকা যাতায়াত খরচ যোগ করো"
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
