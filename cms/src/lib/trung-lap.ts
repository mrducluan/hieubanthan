// CG-6 phía máy chủ: so bài với mọi bài khác trong CMS + vân tay kho tri thức (scripts/van-tay-kb.mjs dựng lúc build).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Payload } from "payload";
import type { MucKiem } from "../kiem-dinh/kiem-dinh";
import { danhGiaTrung, giaiMaVanTay, vanBai, vanTay, type BaiSo } from "../kiem-dinh/trung-lap";

let kbDem: Map<string, Set<number>> | null = null;

/** Đọc một lần mỗi tiến trình. Thiếu tệp (chưa chạy script) → bỏ phần so kho tri thức, không làm hỏng việc lưu bài. */
export function vanTayKb(): Map<string, Set<number>> {
  if (kbDem) return kbDem;
  kbDem = new Map();
  try {
    const t = JSON.parse(readFileSync(join(process.cwd(), "src/kiem-dinh/van-tay-kb.json"), "utf8")) as { nguon?: Record<string, string> };
    for (const [k, v] of Object.entries(t.nguon ?? {})) kbDem.set(k, giaiMaVanTay(v));
  } catch {
    console.warn("[trung-lap] không đọc được van-tay-kb.json — bỏ qua so với kho tri thức");
  }
  return kbDem;
}

type BaiVao = { tra_loi_nhanh?: unknown; noi_dung?: unknown; hoi_dap?: unknown };

export async function kiemTrung(payload: Payload, bai: BaiVao, opts: { id?: number | string | null; congTacVien: boolean }): Promise<MucKiem[]> {
  const van = vanBai(bai);
  const moi = vanTay(van);
  if (moi.size < 20) return [];
  const ds = await payload.find({
    collection: "bai-viet", overrideAccess: true, depth: 0, pagination: false,
    where: opts.id != null ? { id: { not_equals: opts.id } } : {},
    select: { tieu_de: true, slug: true, tra_loi_nhanh: true, noi_dung: true, hoi_dap: true, _status: true },
  });
  const khac: BaiSo[] = ds.docs.map((d) => {
    const b = d as { id: number | string; tieu_de?: string; slug?: string; _status?: string } & BaiVao;
    return { id: b.id, tieu_de: b.tieu_de ?? "", slug: b.slug ?? "", xuat_ban: b._status === "published", van_tay: vanTay(vanBai(b)) };
  });
  return danhGiaTrung(moi, khac, vanTayKb(), { congTacVien: opts.congTacVien, van });
}
