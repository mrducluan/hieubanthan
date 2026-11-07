// BLOG-9d — tự nhập bài NotFair MỚI vào CMS (cron ngày của web gọi POST /api/bai-viet/tu-dong-notfair).
// Mỗi bài mới: nhập thành NHÁP → chuẩn hoá SEO (bìa CMS vẽ, bỏ ảnh NotFair có chữ, hỏi đáp, ảnh minh hoạ) → chữ ký
// "Tác giả: <hồ sơ duc-luan>" khi có hồ sơ (chủ dự án chốt cho bài NotFair, BLOG-9). KHÔNG xuất bản: Chủ biên đọc rồi bấm
// Xuất bản. Web ẩn bài NotFair chưa có bản CMS đã xuất bản khỏi danh sách / sitemap / RSS (BLOG-9d phía web), nên bản thô
// không lộ ra danh sách trong lúc chờ duyệt.
// Giới hạn thời gian + số bài mỗi lượt (hàm Vercel có trần thời gian) — bài còn lại để lượt sau.
import type { Payload, PayloadRequest } from "payload";
import { chuanHoaMotBai } from "./chuan-hoa-notfair";
import { coKhoaNotFair, dsNotFair, nhapBaiNotFair } from "./notfair";

export type KetQuaTuDong = { co_nguon: boolean; moi: { slug: string; id: number | string; diem: number; loi?: string }[]; con_lai: number };

export async function tuDongNotFair(payload: Payload, req: PayloadRequest,
  { hanMs = 25_000, toiDa = 2, bayGio = () => Date.now() } = {}): Promise<KetQuaTuDong> {
  if (!coKhoaNotFair()) return { co_nguon: false, moi: [], con_lai: 0 };
  const bat = bayGio();
  const ds = await dsNotFair();
  // Bài đã có trong CMS (slug hoặc slug gốc nằm trong slug_cu) → bỏ, không gọi NotFair lại.
  const da = await payload.find({ collection: "bai-viet", draft: true, overrideAccess: true, depth: 0, pagination: false,
    where: { or: [{ slug: { in: ds.map((p) => p.slug) } }, { slug_cu: { in: ds.map((p) => p.slug) } }] },
    select: { slug: true, slug_cu: true } as never });
  const co = new Set(da.docs.flatMap((d) => [String((d as { slug?: string }).slug ?? ""), ...(((d as { slug_cu?: string[] }).slug_cu) ?? [])]));
  const chua = ds.filter((p) => !co.has(p.slug));
  const tacGia = (await payload.find({ collection: "tac-gia", where: { slug: { equals: "duc-luan" } }, limit: 1, depth: 0,
    overrideAccess: true })).docs[0]?.id ?? null;
  const moi: KetQuaTuDong["moi"] = [];
  for (const p of chua) {
    if (moi.length >= toiDa || bayGio() - bat > hanMs) break;
    try {
      const n = await nhapBaiNotFair(payload, req, p.slug, { heThong: true });
      if (n.da_co) continue;
      if (tacGia != null) {
        await payload.update({ collection: "bai-viet", id: n.id, draft: true, overrideAccess: true, req,
          context: { giuSlugGoc: true, boQuaLamMoi: true }, data: { ky_ten: "tac_gia", tac_gia: tacGia } as never });
      }
      const c = await chuanHoaMotBai(payload, req, n.id);
      moi.push({ slug: p.slug, id: n.id, diem: c.diem_sau });
    } catch (e) {
      moi.push({ slug: p.slug, id: "", diem: 0, loi: String((e as Error)?.message ?? e).slice(0, 200) });
    }
  }
  return { co_nguon: true, moi, con_lai: Math.max(0, chua.length - moi.length) };
}
