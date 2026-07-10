import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

const SYSTEM_PROMPT =
  "আপনি একজন সহায়ক বাংলা ভাষী ব্যবসা পরামর্শদাতা। বাংলাদেশি ছোট ও মাঝারি ব্যবসার মালিকদের বিক্রয়, খরচ, ইনভেন্টরি, কাস্টমার ব্যবস্থাপনা ও আর্থিক পরিকল্পনায় সংক্ষিপ্ত, ব্যবহারিক পরামর্শ দিন। উত্তর সবসময় বাংলায় দিন।";

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("rate_limited: অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
      if (res.status === 402) throw new Error("credits_exhausted: এআই ক্রেডিট শেষ হয়েছে।");
      throw new Error(`AI gateway error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content ?? "দুঃখিত, উত্তর দিতে পারলাম না।";
    return { reply };
  });
