// Client gọi API quản trị: JSON vào/ra, lỗi máy chủ thành Error có câu báo tiếng Việt.
export async function goiQT<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? `Lỗi ${r.status}`);
  return j;
}
