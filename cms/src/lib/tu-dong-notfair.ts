// BLOG-9d — tự nhập bài NotFair MỚI vào CMS (cron ngày của web gọi POST /api/bai-viet/tu-dong-notfair).
// Mỗi bài mới: nhập thành NHÁP → chuẩn hoá SEO (bìa CMS vẽ, bỏ ảnh NotFair có chữ, hỏi đáp, ảnh minh hoạ) → chữ ký
// "Tác giả: <hồ sơ duc-luan>" khi có hồ sơ (chủ dự án chốt cho bài NotFair, BLOG-9) → BLOG-10 (chủ dự án chốt 2026-11-10,
// thay "không tự xuất bản" của BLOG-9d): TỰ XUẤT BẢN khi bản nháp đạt điểm kiểm định ≥ ngưỡng, không lỗi chặn, không trùng
// ≥ 50 % với bài khác, kho ảnh không lỗi (bìa NotFair có chữ sai dấu đã được vẽ lại). Không đạt → giữ nháp "Gửi duyệt" như cũ.
// Bài tự xuất bản giữ trạng thái duyệt "Gửi duyệt" (máy xuất bản, CHƯA phải Chủ biên duyệt) → bảng điều khiển vẫn nhắc đọc;
// Chủ biên mở bài, sửa, bấm Xuất bản lại là thành "Đã duyệt". Web ẩn bài NotFair chưa có bản CMS đã xuất bản khỏi danh sách
// / sitemap / RSS (BLOG-9d phía web), nên bản thô không lộ ra danh sách.
// Giới hạn thời gian + số bài mỗi lượt (hàm Vercel có trần thời gian) — bài còn lại để lượt sau.
import type { Payload, PayloadRequest } from "payload";
import { kiemDinhBai } from "../kiem-dinh/kiem-dinh";
import { chuanHoaMotBai, type KetQuaBai } from "./chuan-hoa-notfair";
import { coKhoaNotFair, dsNotFair, nhapBaiNotFair } from "./notfair";
import { kiemTrung } from "./trung-lap";

export type KetQuaTuDong = {
  co_nguon: boolean;
  moi: { slug: string; id: number | string; diem: number; xuat_ban?: boolean; ly_do?: string; loi?: string }[];
  con_lai: number;
};

/** Ngưỡng điểm kiểm định để máy tự xuất bản (env `NOTFAIR_TU_XUAT_BAN_DIEM`, kẹp 50–100). `NOTFAIR_TU_XUAT_BAN=0` tắt hẳn
 *  (quay về BLOG-9d: chỉ nhập nháp). */
export function nguongTuXuatBan(env: Record<string, string | undefined> = process.env): number | null {
  if (env.NOTFAIR_TU_XUAT_BAN === "0") return null;
  const n = Number(env.NOTFAIR_TU_XUAT_BAN_DIEM);
  return Number.isFinite(n) && env.NOTFAIR_TU_XUAT_BAN_DIEM?.trim() ? Math.min(100, Math.max(50, Math.round(n))) : 85;
}

/** BLOG-10: xuất bản bản nháp mới nhất của bài NotFair vừa chuẩn hoá nếu đủ điều kiện. Không đạt → giữ nháp, trả lý do. */
export async function tuXuatBanNeuDat(payload: Payload, req: PayloadRequest | undefined, id: number | string,
  chuanHoa: Pick<KetQuaBai, "kho_loi">, nguong = nguongTuXuatBan()): Promise<{ xuat_ban: boolean; ly_do?: string }> {
  if (nguong == null) return { xuat_ban: false, ly_do: "tắt tự xuất bản" };
  if (chuanHoa.kho_loi) return { xuat_ban: false, ly_do: `kho ảnh lỗi: ${chuanHoa.kho_loi}`.slice(0, 200) };
  const bai = await payload.findByID({ collection: "bai-viet", id, draft: true, depth: 0, overrideAccess: true, req }) as never as
    Record<string, unknown> & { ghi_chu_duyet?: string | null };
  const kd = kiemDinhBai(bai as never);
  if (kd.loi_chan.length) return { xuat_ban: false, ly_do: `lỗi chặn: ${kd.loi_chan.map((m) => m.thong_diep).join(" · ")}`.slice(0, 200) };
  if (kd.diem < nguong) return { xuat_ban: false, ly_do: `điểm ${kd.diem} < ${nguong}` };
  // Trùng ≥ 50 % với bài khác: Chủ biên phải gộp (BLOG-9) — xét như cộng tác viên (trùng nhiều = chặn).
  const trung = (await kiemTrung(payload, bai as never, { id, congTacVien: true })).filter((m) => m.chan);
  if (trung.length) return { xuat_ban: false, ly_do: `trùng nội dung: ${trung.map((m) => m.thong_diep).join(" · ")}`.slice(0, 200) };
  const ghiChu = [`BLOG-10: máy tự xuất bản ${new Date().toISOString().slice(0, 10)} (điểm ${kd.diem} ≥ ${nguong}). `
    + "Chủ biên đọc lại; sửa xong bấm Xuất bản là thành \"Đã duyệt\", bài có vấn đề thì chuyển về nháp (Bỏ xuất bản).",
  bai.ghi_chu_duyet ?? ""].filter(Boolean).join("\n").slice(0, 2000);
  try {
    await payload.update({ collection: "bai-viet", id, overrideAccess: true, req, context: { giuSlugGoc: true },
      data: { _status: "published", ghi_chu_duyet: ghiChu } as never });
    return { xuat_ban: true };
  } catch (e) {
    return { xuat_ban: false, ly_do: String((e as Error)?.message ?? e).slice(0, 200) };
  }
}

/** Nháp NotFair trong CMS chưa từng xuất bản, chưa bị Chủ biên đánh dấu "Cần sửa" / gộp ("Đã duyệt") — nháp cron đã nhập
 *  trước BLOG-10 (chờ duyệt tay) hoặc lần trước chưa đạt. Bài Chủ biên đã Bỏ xuất bản (có phiên bản xuất bản) không động tới. */
export const DA_THU = "BLOG-10: chưa tự xuất bản";

export async function nhapChuaXuatBan(payload: Payload, req: PayloadRequest | undefined,
  { thuLai = false } = {}): Promise<{ id: number | string; slug: string }[]> {
  const ds = await payload.find({ collection: "bai-viet", draft: true, overrideAccess: true, depth: 0, pagination: false, req,
    where: { and: [{ nguon_goc: { equals: "notfair" } }, { _status: { equals: "draft" } },
      { trang_thai_duyet: { in: ["dang_viet", "cho_duyet"] } }] },
    select: { slug: true, ghi_chu_duyet: true } as never });
  const kq: { id: number | string; slug: string }[] = [];
  for (const d of ds.docs as unknown as { id: number | string; slug?: string; ghi_chu_duyet?: string | null }[]) {
    // Đã thử mà chưa đạt (ghi chú lý do) → cron bỏ qua, không thử lại mỗi ngày; migration / nút chạy tay thì thử lại.
    if (!thuLai && String(d.ghi_chu_duyet ?? "").includes(DA_THU)) continue;
    const v = await payload.findVersions({ collection: "bai-viet", overrideAccess: true, limit: 1, depth: 0, req,
      where: { and: [{ parent: { equals: d.id } }, { "version._status": { equals: "published" } }] } });
    if (!v.totalDocs) kq.push({ id: d.id, slug: String(d.slug ?? "") });
  }
  return kq;
}

/** Ghi lý do chưa tự xuất bản vào "Ghi chú của Chủ biên" (một lần) — Chủ biên biết vì sao bài còn là nháp. */
async function ghiChuaXuatBan(payload: Payload, req: PayloadRequest | undefined, id: number | string, ly_do: string) {
  const b = await payload.findByID({ collection: "bai-viet", id, draft: true, depth: 0, overrideAccess: true, req }) as { ghi_chu_duyet?: string | null };
  const cu = String(b.ghi_chu_duyet ?? "");
  if (cu.includes(`${DA_THU}: ${ly_do}`)) return;
  await payload.update({ collection: "bai-viet", id, draft: true, overrideAccess: true, req, context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: { ghi_chu_duyet: [`${DA_THU}: ${ly_do} — sửa rồi bấm Xuất bản tay.`, cu.replace(new RegExp(`^${DA_THU}[^\\n]*\\n?`), "")]
      .filter(Boolean).join("\n").slice(0, 2000) } as never });
}

/** Cron ngày (`toiDa` nhỏ) và migration lúc deploy (`thuLai`, không giới hạn số bài) dùng chung. */
export async function tuDongNotFair(payload: Payload, req: PayloadRequest | undefined,
  { hanMs = 25_000, toiDa = 2, bayGio = () => Date.now(), thuLai = false } = {}): Promise<KetQuaTuDong> {
  // Chưa đọc được NotFair → bỏ phần nhập bài mới, vẫn xử lý nháp đã nhập.
  const coNguon = coKhoaNotFair();
  const bat = bayGio();
  const ds = coNguon ? await dsNotFair() : [];
  // Bài đã có trong CMS (slug hoặc slug gốc nằm trong slug_cu) → bỏ, không gọi NotFair lại.
  const da = !ds.length ? { docs: [] as unknown[] } : await payload.find({ collection: "bai-viet", draft: true, overrideAccess: true, depth: 0, pagination: false,
    where: { or: [{ slug: { in: ds.map((p) => p.slug) } }, { slug_cu: { in: ds.map((p) => p.slug) } }] },
    select: { slug: true, slug_cu: true } as never });
  const co = new Set(da.docs.flatMap((d) => [String((d as { slug?: string }).slug ?? ""), ...(((d as { slug_cu?: string[] }).slug_cu) ?? [])]));
  const chua = ds.filter((p) => !co.has(p.slug));
  const tacGia = (await payload.find({ collection: "tac-gia", where: { slug: { equals: "duc-luan" } }, limit: 1, depth: 0,
    overrideAccess: true })).docs[0]?.id ?? null;
  const moi: KetQuaTuDong["moi"] = [];
  const conGio = () => moi.length < toiDa && bayGio() - bat <= hanMs;
  const xuLy = async (slug: string, id: number | string) => {
    const c = await chuanHoaMotBai(payload, req, id);
    const xb = await tuXuatBanNeuDat(payload, req, id, c);
    // Kho ảnh lỗi là lỗi tạm (sửa kho xong lượt sau làm lại) → không ghi chú, cron còn thử lại.
    if (!xb.xuat_ban && xb.ly_do && xb.ly_do !== "tắt tự xuất bản" && !xb.ly_do.startsWith("kho ảnh lỗi")) await ghiChuaXuatBan(payload, req, id, xb.ly_do).catch(() => {});
    moi.push({ slug, id, diem: c.diem_sau, xuat_ban: xb.xuat_ban, ...(xb.ly_do ? { ly_do: xb.ly_do } : {}) });
  };
  for (const p of chua) {
    if (!conGio()) break;
    try {
      const n = await nhapBaiNotFair(payload, req as PayloadRequest, p.slug, { heThong: true });
      if (n.da_co) continue;
      if (tacGia != null) {
        await payload.update({ collection: "bai-viet", id: n.id, draft: true, overrideAccess: true, req,
          context: { giuSlugGoc: true, boQuaLamMoi: true }, data: { ky_ten: "tac_gia", tac_gia: tacGia } as never });
      }
      await xuLy(p.slug, n.id);
    } catch (e) {
      moi.push({ slug: p.slug, id: "", diem: 0, loi: String((e as Error)?.message ?? e).slice(0, 200) });
    }
  }
  const soMoi = moi.length;
  // BLOG-10: nháp NotFair cũ chưa xuất bản (cron đã nhập trước khi có tự xuất bản, hoặc lần trước chưa đạt) — chuẩn hoá lại
  // (vẽ ảnh còn thiếu, điền nguồn…) rồi xuất bản nếu đạt. Bài vừa nhập ở trên đã xử lý thì bỏ.
  const daXuLy = new Set(moi.map((m) => String(m.id)));
  const cu = (await nhapChuaXuatBan(payload, req, { thuLai })).filter((b) => !daXuLy.has(String(b.id)));
  let conCu = cu.length;
  for (const b of cu) {
    if (!conGio()) break;
    conCu--;
    try { await xuLy(b.slug, b.id); }
    catch (e) { moi.push({ slug: b.slug, id: b.id, diem: 0, loi: String((e as Error)?.message ?? e).slice(0, 200) }); }
  }
  return { co_nguon: coNguon, moi, con_lai: Math.max(0, chua.length - soMoi) + conCu };
}
