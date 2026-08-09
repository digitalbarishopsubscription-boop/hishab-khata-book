import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.union([z.string(), z.array(z.any())]),
  tool_call_id: z.string().optional(),
  name: z.string().optional(),
  tool_calls: z.any().optional(),
});


const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

export type PendingAction = {
  id: string;
  tool: string;
  label: string;
  args: Record<string, any>;
};

// ---------- Tool definitions ----------
const READ_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_business_summary",
      description: "চলতি মাসের বিক্রয়, খরচ, লাভ, বকেয়া, প্রোডাক্ট ও লো-স্টক সংখ্যার সারসংক্ষেপ।",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_sales",
      description: "সাম্প্রতিক বিক্রয় তালিকা।",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "সর্বোচ্চ কতটি (ডিফল্ট ১০)" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description: "প্রোডাক্ট তালিকা। low_stock_only=true দিলে কেবল কম স্টকের প্রোডাক্ট।",
      parameters: {
        type: "object",
        properties: {
          low_stock_only: { type: "boolean" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_expenses",
      description: "সাম্প্রতিক খরচ তালিকা।",
      parameters: {
        type: "object",
        properties: { limit: { type: "number" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_customers",
      description: "কাস্টমার তালিকা।",
      parameters: {
        type: "object",
        properties: { limit: { type: "number" }, search: { type: "string" } },
        additionalProperties: false,
      },
    },
  },
] as const;

const WRITE_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_expense",
      description: "নতুন খরচ রেকর্ড যোগ করার প্রস্তাব (মালিকের অনুমোদন লাগবে)।",
      parameters: {
        type: "object",
        required: ["title", "category", "amount", "payment_method"],
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          amount: { type: "number" },
          payment_method: { type: "string", description: "cash / bkash / bank ইত্যাদি" },
          notes: { type: "string" },
          expense_date: { type: "string", description: "YYYY-MM-DD" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_customer",
      description: "নতুন কাস্টমার যোগ করার প্রস্তাব।",
      parameters: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          notes: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_product",
      description: "নতুন প্রোডাক্ট/ইনভেন্টরি আইটেম যোগ করার প্রস্তাব।",
      parameters: {
        type: "object",
        required: ["name", "unit", "stock", "purchase_price", "sale_price"],
        properties: {
          name: { type: "string" },
          unit: { type: "string", description: "pcs, kg, litre ইত্যাদি" },
          stock: { type: "number" },
          purchase_price: { type: "number" },
          sale_price: { type: "number" },
          sku: { type: "string" },
          category: { type: "string" },
          low_stock_threshold: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_stock",
      description: "প্রোডাক্টের স্টক পরিবর্তনের প্রস্তাব।",
      parameters: {
        type: "object",
        required: ["product_id", "new_stock"],
        properties: {
          product_id: { type: "string" },
          new_stock: { type: "number" },
          reason: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_khata",
      description: "বাকি/পেমেন্ট এন্ট্রির প্রস্তাব।",
      parameters: {
        type: "object",
        required: ["customer_name", "type", "amount"],
        properties: {
          customer_name: { type: "string" },
          type: { type: "string", enum: ["due", "paid"], description: "due=বাকি দিলেন, paid=টাকা নিলেন" },
          amount: { type: "number" },
          description: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
] as const;

const WRITE_TOOL_NAMES = new Set(WRITE_TOOLS.map((t) => t.function.name));

const ACTION_LABELS: Record<string, string> = {
  add_expense: "নতুন খরচ যোগ",
  add_customer: "নতুন কাস্টমার যোগ",
  add_product: "নতুন প্রোডাক্ট যোগ",
  adjust_stock: "স্টক পরিবর্তন",
  record_khata: "খাতা এন্ট্রি",
};

const SYSTEM_PROMPT = `আপনি একজন বাংলা ভাষী ব্যবসা সহকারী — বাংলাদেশি ছোট/মাঝারি ব্যবসার মালিকের ব্যক্তিগত সহকারী।
আপনার কাছে ব্যবসার ডেটা পড়ার এবং লেখার টুল আছে।

নিয়মাবলি:
১. ব্যবসার তথ্য (বিক্রয়, খরচ, ইনভেন্টরি, কাস্টমার) সম্পর্কে প্রশ্ন হলে আগে প্রাসঙ্গিক read tool ব্যবহার করে সঠিক তথ্য নিন, তারপর উত্তর দিন — অনুমান করবেন না।
২. কোনো নতুন এন্ট্রি (খরচ, কাস্টমার, প্রোডাক্ট, স্টক, খাতা) যোগ/পরিবর্তনের জন্য উপযুক্ত write tool কল করুন। এগুলো সরাসরি সংরক্ষিত হবে না — মালিকের অনুমোদনের জন্য প্রস্তাব হিসেবে দেখানো হবে।
৩. উত্তর সবসময় বাংলায়, সংক্ষিপ্ত ও ব্যবহারিক।
৪. সংখ্যা বাংলা সংখ্যায় দেখান যেখানে সম্ভব। টাকার অংক "৳" চিহ্নসহ।`;

// ---------- Tool executor (read only) ----------
async function runReadTool(name: string, args: any, supabase: any, userId: string) {
  const bn = (n: any) => Number(n ?? 0);
  switch (name) {
    case "get_business_summary": {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const iso = monthStart.toISOString();
      const [sales, expenses, products, dues] = await Promise.all([
        supabase.from("sales").select("total,due,paid").gte("created_at", iso).eq("user_id", userId),
        supabase.from("expenses").select("amount").gte("created_at", iso).eq("user_id", userId),
        supabase.from("products").select("id,stock,low_stock_threshold").eq("user_id", userId),
        supabase.from("sales").select("due").eq("user_id", userId),
      ]);
      const salesTotal = (sales.data ?? []).reduce((s: number, r: any) => s + bn(r.total), 0);
      const expenseTotal = (expenses.data ?? []).reduce((s: number, r: any) => s + bn(r.amount), 0);
      const totalDues = (dues.data ?? []).reduce((s: number, r: any) => s + bn(r.due), 0);
      const lowStock = (products.data ?? []).filter((p: any) => bn(p.stock) <= bn(p.low_stock_threshold)).length;
      return {
        month_sales_total: salesTotal,
        month_expense_total: expenseTotal,
        month_profit: salesTotal - expenseTotal,
        total_customer_dues: totalDues,
        product_count: (products.data ?? []).length,
        low_stock_count: lowStock,
      };
    }
    case "list_recent_sales": {
      const { data } = await supabase.from("sales").select("id,invoice_number,customer_name,total,due,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(args?.limit ?? 10);
      return data ?? [];
    }
    case "list_products": {
      let q = supabase.from("products").select("id,name,stock,unit,sale_price,low_stock_threshold").eq("user_id", userId);
      const { data } = await q.limit(args?.limit ?? 50);
      let rows = data ?? [];
      if (args?.low_stock_only) rows = rows.filter((p: any) => bn(p.stock) <= bn(p.low_stock_threshold));
      return rows;
    }
    case "list_expenses": {
      const { data } = await supabase.from("expenses").select("id,title,category,amount,expense_date")
        .eq("user_id", userId).order("expense_date", { ascending: false }).limit(args?.limit ?? 15);
      return data ?? [];
    }
    case "list_customers": {
      let q = supabase.from("customers").select("id,name,phone").eq("user_id", userId);
      if (args?.search) q = q.ilike("name", `%${args.search}%`);
      const { data } = await q.limit(args?.limit ?? 30);
      return data ?? [];
    }
  }
  return { error: "unknown tool" };
}

// ---------- Main chat function ----------
export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { supabase, userId } = context;
    const tools = [...READ_TOOLS, ...WRITE_TOOLS];
    const convo: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages];

    // Loop: execute read tool calls, stop on write tool calls (request approval).
    for (let step = 0; step < 5; step++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: convo,
          tools,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) throw new Error("rate_limited: অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
        if (res.status === 402) throw new Error("credits_exhausted: এআই ক্রেডিট শেষ হয়েছে।");
        throw new Error(`AI gateway error ${res.status}: ${text}`);
      }
      const json = (await res.json()) as any;
      const msg = json.choices?.[0]?.message;
      if (!msg) return { reply: "দুঃখিত, উত্তর দিতে পারলাম না।", pendingActions: [] as PendingAction[] };

      const toolCalls = msg.tool_calls as any[] | undefined;
      if (!toolCalls || toolCalls.length === 0) {
        return { reply: msg.content ?? "", pendingActions: [] as PendingAction[] };
      }

      // Separate reads vs writes
      const writes = toolCalls.filter((tc) => WRITE_TOOL_NAMES.has(tc.function?.name));
      if (writes.length > 0) {
        const pendingActions: PendingAction[] = writes.map((tc) => {
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments ?? "{}"); } catch {}
          return {
            id: tc.id ?? Math.random().toString(36).slice(2),
            tool: tc.function.name,
            label: ACTION_LABELS[tc.function.name] ?? tc.function.name,
            args,
          };
        });
        return {
          reply: msg.content?.trim() || "নিচের পরিবর্তনগুলো প্রস্তাব করছি — অনুমোদন করলে সংরক্ষিত হবে।",
          pendingActions,
        };
      }

      // Execute read tools and continue
      convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });
      for (const tc of toolCalls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments ?? "{}"); } catch {}
        const result = await runReadTool(tc.function.name, args, supabase, userId);
        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result),
        });
      }
    }
    return { reply: "অনেক ধাপ ঘুরে ফেললাম — অনুগ্রহ করে প্রশ্নটি আরেকটু সুনির্দিষ্ট করুন।", pendingActions: [] };
  });

// ---------- Execute approved action ----------
const ExecInput = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()),
});

export const executeAiAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExecInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { tool, args } = data;

    switch (tool) {
      case "add_expense": {
        const { error } = await supabase.from("expenses").insert({
          user_id: userId,
          title: args.title,
          category: args.category,
          amount: Number(args.amount),
          payment_method: args.payment_method,
          notes: args.notes ?? null,
          expense_date: args.expense_date ?? new Date().toISOString().slice(0, 10),
        });
        if (error) throw new Error(error.message);
        return { ok: true, message: "খরচ যোগ হয়েছে।" };
      }
      case "add_customer": {
        const { error } = await supabase.from("customers").insert({
          user_id: userId,
          name: args.name,
          phone: args.phone ?? null,
          address: args.address ?? null,
          notes: args.notes ?? null,
        });
        if (error) throw new Error(error.message);
        return { ok: true, message: "কাস্টমার যোগ হয়েছে।" };
      }
      case "add_product": {
        const { error } = await supabase.from("products").insert({
          user_id: userId,
          name: args.name,
          unit: args.unit,
          stock: Number(args.stock),
          purchase_price: Number(args.purchase_price),
          sale_price: Number(args.sale_price),
          sku: args.sku ?? null,
          category: args.category ?? null,
          low_stock_threshold: Number(args.low_stock_threshold ?? 5),
        });
        if (error) throw new Error(error.message);
        return { ok: true, message: "প্রোডাক্ট যোগ হয়েছে।" };
      }
      case "adjust_stock": {
        const { error } = await supabase.from("products")
          .update({ stock: Number(args.new_stock) })
          .eq("id", args.product_id).eq("user_id", userId);
        if (error) throw new Error(error.message);
        return { ok: true, message: "স্টক আপডেট হয়েছে।" };
      }
      case "record_khata": {
        const { error } = await supabase.from("khata_transactions").insert({
          user_id: userId,
          customer_name: args.customer_name,
          type: args.type,
          amount: Number(args.amount),
          description: args.description ?? null,
          transaction_date: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        return { ok: true, message: "খাতা এন্ট্রি সংরক্ষিত।" };
      }
    }
    throw new Error("অজানা অ্যাকশন");
  });
