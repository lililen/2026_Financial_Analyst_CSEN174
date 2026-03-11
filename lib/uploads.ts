import type { ScoreResult } from "@/lib/scoring/scoreTypes";

export type Totals = {
  rent: number;
  groceries: number;
  food: number;
  shopping: number;
  entertainment: number;
  other: number;
};

export type UploadRecord = {
  id: string;
  month: number;
  year: number;
  monthLabel: string;
  categoryTotals: Totals;
  financialScoreResult: ScoreResult;
  uploadedAt: string;
};

const UPLOADS_KEY = "fh_uploads";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadAll(): Record<string, UploadRecord[]> {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(UPLOADS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, UploadRecord[]>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(UPLOADS_KEY, JSON.stringify(data));
}

export function getUserUploads(email: string): UploadRecord[] {
  const data = loadAll();
  const list = data[email];
  return Array.isArray(list) ? list : [];
}

export function hasUploadForMonth(email: string, month: number, year: number): boolean {
  const list = getUserUploads(email);
  return list.some((u) => u.month === month && u.year === year);
}

export function saveUserUpload(
  email: string,
  record: Omit<UploadRecord, "id" | "uploadedAt">,
  options?: { replaceExisting?: boolean }
): void {
  const data = loadAll();
  let list = data[email] ?? [];
  if (options?.replaceExisting) {
    list = list.filter((u) => !(u.month === record.month && u.year === record.year));
  }
  const full: UploadRecord = {
    ...record,
    id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    uploadedAt: new Date().toISOString(),
  };
  list.unshift(full);
  data[email] = list;
  saveAll(data);
}

export function clearAllUploads() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(UPLOADS_KEY);
}
