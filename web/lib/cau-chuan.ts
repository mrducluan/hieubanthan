// HD-CS đợt 3 — danh mục câu hỏi chuẩn theo mảng do engine công bố (`/v1/hoi/cau-chuan`), cache 1 giờ. Dùng để: ký thẻ chia
// sẻ câu trả lời (chỉ câu trong danh mục), và điền sẵn câu hỏi khi người nhận thẻ mở trang (?cau=). Engine lỗi → danh mục rỗng
// (không ký thẻ, không điền sẵn) — không bao giờ tin câu từ link.
const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function cauChuan(): Promise<Record<string, string[]>> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/hoi/cau-chuan`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, next: { revalidate: 3600 },
    });
    if (!r.ok) return {};
    const d = (await r.json().catch(() => null)) as { cau?: Record<string, unknown> } | null;
    const ra: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(d?.cau ?? {})) if (Array.isArray(v)) ra[k] = v.filter((x): x is string => typeof x === "string").slice(0, 50);
    return ra;
  } catch {
    return {};
  }
}
