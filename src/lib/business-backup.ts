import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";

type BackupRow = Record<string, unknown>;

function rows<T extends object>(data: T[] | null): BackupRow[] {
  return (data ?? []).map((item) => ({ ...item }));
}

export async function createBusinessBackup(userId: string) {
  const results = await Promise.all([
    supabase.from("branches").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("customers").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("employees").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("expenses").select("*").eq("user_id", userId).order("expense_date"),
    supabase.from("khata_transactions").select("*").eq("user_id", userId).order("transaction_date"),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("products").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("purchases").select("*").eq("user_id", userId).order("purchase_date"),
    supabase.from("sales").select("*").eq("user_id", userId).order("sale_date"),
    supabase.from("sale_items").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("suppliers").select("*").eq("user_id", userId).order("created_at"),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;

  const tables = [
    { name: "শাখা", data: rows(results[0].data) },
    { name: "কাস্টমার", data: rows(results[1].data) },
    { name: "কর্মচারী", data: rows(results[2].data) },
    { name: "খরচ", data: rows(results[3].data) },
    { name: "খাতা লেনদেন", data: rows(results[4].data) },
    { name: "নোটিফিকেশন", data: rows(results[5].data) },
    { name: "পণ্য ও মজুত", data: rows(results[6].data) },
    { name: "ক্রয়", data: rows(results[7].data) },
    { name: "বিক্রয়", data: rows(results[8].data) },
    { name: "বিক্রয়ের পণ্য", data: rows(results[9].data) },
    { name: "সাপ্লায়ার", data: rows(results[10].data) },
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "হিসাব পত্র";
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const table of tables) {
    const worksheet = workbook.addWorksheet(table.name);
    const headers = [...new Set(table.data.flatMap((item) => Object.keys(item)))];
    if (headers.length === 0) {
      worksheet.addRow(["কোনো তথ্য নেই"]);
      continue;
    }
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 4, 16), 32),
    }));
    for (const record of table.data) worksheet.addRow(record);
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = { from: "A1", to: `${worksheet.getColumn(headers.length).letter}1` };
    worksheet.getRow(1).font = { bold: true };
  }

  const content = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(content)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `hisab-patra-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { blob, filename };
}

export function downloadBusinessBackup(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}