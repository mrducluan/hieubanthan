// BLOG-6 — tạo bài khởi tạo thành BÀI NHÁP trong CMS (gọi từ migration `bai_khoi_tao`). Không xuất bản, không ký thẩm
// định: Chủ biên đọc, sửa, bấm Xuất bản. Đã có bài cùng slug (kể cả nháp) → bỏ qua, không ghi đè chữ biên tập.
// Ảnh: 4 PNG trong ./anh tải vào Thư viện ảnh (ảnh bìa + 3 ảnh chèn sau tiêu đề mục `vi_tri`). Kho ảnh lỗi → bài vẫn tạo,
// chỗ ảnh thành đoạn "[Ảnh chưa nhập …]" (kiểm định chặn xuất bản tới khi chèn lại) — như nhập bài NotFair.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Payload, PayloadRequest } from "payload";
import { DANH_DAU_ANH, htmlSangKhoi, type NutLexical } from "../lib/html-lexical";
import type { BaiKhoiTao } from "./bai";

const THU_MUC = path.dirname(fileURLToPath(import.meta.url));
export const NGUON_ANH = "Ban biên tập Hiểu Bản Thân vẽ minh hoạ (bài khởi tạo BLOG-6)";
export const GHI_CHU = "BLOG-6: bài khởi tạo do hệ thống soạn theo khuôn bài \"Thần số học là gì\". Chủ biên đọc kỹ, sửa giọng, "
  + "thêm trải nghiệm thật (Góc nhìn) rồi mới xuất bản. Nguồn có link: bấm thử trước khi xuất bản.";

export function docBaiKhoiTao(): BaiKhoiTao[] {
  return readdirSync(THU_MUC).filter((f) => f.endsWith(".json")).sort()
    .map((f) => JSON.parse(readFileSync(path.join(THU_MUC, f), "utf8")) as BaiKhoiTao);
}

const chuCua = (n: NutLexical): string => {
  const con = (n as { children?: NutLexical[] }).children ?? [];
  return [(n as { text?: string }).text ?? "", ...con.map(chuCua)].join("");
};

const doanDanhDau = (chu: string): NutLexical => ({
  type: "paragraph", direction: "ltr", format: "", indent: 0, version: 1, textFormat: 0,
  children: [{ type: "text", text: chu, format: 0, detail: 0, mode: "normal", style: "", version: 1 }],
});

/** Chèn ảnh ngay sau tiêu đề (h2/h3) chứa `vi_tri`. id null = kho ảnh lỗi → đoạn đánh dấu đúng chỗ. */
export function chenAnh(khoi: NutLexical[], anh: { vi_tri: string; id: number | string | null; ten_tep: string; alt: string }[]) {
  const ra: NutLexical[] = [];
  for (const k of khoi) {
    ra.push(k);
    if (k.type !== "heading") continue;
    const chu = chuCua(k);
    for (const a of anh) {
      if (!a.vi_tri || a.vi_tri === "bia" || !chu.includes(a.vi_tri)) continue;
      ra.push(a.id == null
        ? doanDanhDau(`${DANH_DAU_ANH} — tải ảnh ${a.ten_tep} (alt: ${a.alt}) vào Thư viện ảnh rồi chèn thay đoạn này]`)
        : { type: "upload", relationTo: "media", value: a.id, fields: null, format: "", version: 3,
            id: Math.random().toString(16).slice(2, 14).padEnd(12, "0") });
    }
  }
  return { root: { type: "root", children: ra, direction: "ltr", format: "", indent: 0, version: 1 } };
}

async function taoAnh(payload: Payload, req: PayloadRequest | undefined, a: NonNullable<BaiKhoiTao["anh"]>[number], kho: { loi: boolean }) {
  const tep = path.join(THU_MUC, "anh", a.ten_tep);
  if (kho.loi || !existsSync(tep)) return null;
  try {
    const m = await payload.create({ collection: "media", req, filePath: tep, data: { alt: a.alt.slice(0, 160), nguon_anh: NGUON_ANH } });
    return m.id;
  } catch (e) {
    kho.loi = true;   // lỗi kho (S3 / ổ đĩa) → bỏ ảnh cho cả lượt, chữ bài vẫn tạo
    payload.logger.warn(`BLOG-6: chưa tải được ảnh ${a.ten_tep} — ${(e as Error)?.message ?? e}`);
    return null;
  }
}

export async function taoBaiKhoiTao(payload: Payload, req?: PayloadRequest): Promise<string[]> {
  const da: string[] = [];
  const kho = { loi: false };
  for (const b of docBaiKhoiTao()) {
    const co = await payload.find({ collection: "bai-viet", where: { slug: { equals: b.slug } }, draft: true, limit: 1, depth: 0, req });
    if (co.docs.length) { payload.logger.info(`BLOG-6: đã có bài ${b.slug} — bỏ qua`); continue; }
    const anh = [];
    for (const a of b.anh ?? []) anh.push({ ...a, id: await taoAnh(payload, req, a, kho) });
    const bia = anh.find((a) => a.vi_tri === "bia")?.id ?? undefined;
    const khoi = htmlSangKhoi(b.html).filter((k): k is NutLexical => k.type !== "__anh");
    await payload.create({
      collection: "bai-viet", req, draft: true, context: { boQuaLamMoi: true },
      data: {
        // Thiếu ảnh (đoạn "[Ảnh chưa nhập") thì kiểm định chặn "Gửi duyệt" → để "Đang viết" tới khi chèn ảnh.
        _status: "draft", trang_thai_duyet: anh.every((a) => a.id != null) ? "cho_duyet" : "dang_viet", ghi_chu_duyet: GHI_CHU,
        tieu_de: b.tieu_de, slug: b.slug, mang: b.mang, loai_bai: b.loai_bai,
        mo_ta_ngan: b.mo_ta_ngan, tra_loi_nhanh: b.tra_loi_nhanh,
        noi_dung: chenAnh(khoi, anh),
        hoi_dap: b.hoi_dap, nguon: b.nguon.map((n) => ({ ten: n.ten, ...(n.url ? { url: n.url } : {}) })),
        tu_khoa_chinh: b.tu_khoa_chinh, tu_khoa_phu: b.tu_khoa_phu, the: b.the,
        meta: { title: b.meta.title, description: b.meta.description, ...(bia ? { image: bia } : {}) },
        ...(bia ? { anh_bia: bia } : {}),
        ky_ten: "ban_bien_tap",
      } as never,
    });
    da.push(b.slug);
  }
  return da;
}

/** Down: xoá bài khởi tạo CHƯA từng xuất bản (Chủ biên đã đăng thì giữ) + ảnh do BLOG-6 tải lên không còn bài nào dùng. */
export async function xoaBaiKhoiTao(payload: Payload, req?: PayloadRequest): Promise<void> {
  for (const b of docBaiKhoiTao()) {
    const r = await payload.find({ collection: "bai-viet", where: { slug: { equals: b.slug } }, draft: true, limit: 1, depth: 0, req });
    const d = r.docs[0] as { id: number | string; _status?: string; publishedAt?: string | null } | undefined;
    if (d && d._status !== "published" && !d.publishedAt) await payload.delete({ collection: "bai-viet", id: d.id, req, context: { boQuaLamMoi: true } });
  }
  const conBai = await payload.count({ collection: "bai-viet", where: { slug: { in: docBaiKhoiTao().map((b) => b.slug) } }, req });
  if (conBai.totalDocs === 0) await payload.delete({ collection: "media", where: { nguon_anh: { equals: NGUON_ANH } }, req });
}

/** 2026-10-26 (chủ dự án: "bổ sung link web, QR code web cho hình ảnh bài viết"): 12 ảnh trong repo đã gắn link + QR về đúng
 *  bài. Bài khởi tạo đã nhập trước đó → thay TỆP của ảnh cũ trong Thư viện ảnh (giữ nguyên id, bài không phải sửa). Tìm theo
 *  nguồn ảnh BLOG-6 + tên tệp (Payload đổi đuôi sang .webp, có thể thêm hậu tố "-1" khi trùng tên).
 *  KHÔNG truyền `req` vào lệnh thay (như notfair.ts / chuan-hoa-notfair.ts): mỗi ảnh một giao dịch riêng — plugin kho ảnh tải
 *  tệp mới rồi XOÁ tệp cũ ngay, nên nếu dùng chung giao dịch migration, một ảnh sau lỗi kho sẽ rollback DB của các ảnh đã thay
 *  trước trong khi tệp cũ đã bị xoá → ảnh hỏng. Ảnh lỗi chỉ ghi log, ảnh khác vẫn thay. Trả {thay, loi}. */
export async function capNhatAnhKhoiTao(payload: Payload, req?: PayloadRequest): Promise<{ thay: number; loi: number }> {
  const kq = { thay: 0, loi: 0 };
  for (const b of docBaiKhoiTao()) {
    for (const a of b.anh ?? []) {
      const tep = path.join(THU_MUC, "anh", a.ten_tep);
      if (!existsSync(tep)) continue;
      const goc = a.ten_tep.replace(/\.png$/, "");
      const r = await payload.find({ collection: "media", req, depth: 0, limit: 5, overrideAccess: true,
        where: { and: [{ nguon_anh: { equals: NGUON_ANH } }, { filename: { like: goc } }] } });
      for (const m of r.docs) {
        if (!new RegExp(`^${goc}(-\\d+)?\\.[a-z]+$`).test(String(m.filename ?? ""))) continue;   // Media đổi sang .webp
        try {
          await payload.update({ collection: "media", id: m.id, overrideAccess: true, filePath: tep, data: {} });
          kq.thay++;
        } catch (e) {
          kq.loi++;
          payload.logger.warn(`Ảnh QR bài khởi tạo: chưa thay ${a.ten_tep} — ${(e as Error)?.message ?? e} (ảnh cũ giữ nguyên)`);
        }
      }
    }
  }
  return kq;
}
