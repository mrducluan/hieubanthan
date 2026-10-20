// ND-0 — đồng bộ sổ trang của web (GET {WEB_URL}/api/so-trang, header x-cms-bi-mat = CMS_WEBHOOK_SECRET) vào hai
// collection "Trang website" (noi-dung-trang) và "Mẫu cụm trang" (mau-cum):
//   URL mới → tạo tài liệu NHÁP trống (không có nội dung = web vẫn hiện chữ trong code);
//   URL mất → tren_web = false (không xoá — Chủ biên tự dọn);
//   cập nhật ten / nhom / o / mac_dinh (+ mẫu: bien / nguon_kb) — KHÔNG BAO GIỜ ghi ô biên tập.
// Ô hệ thống ghi thẳng bằng SQL vào bảng chính + mọi phiên bản (không qua update của Payload: update thường lấy bản NHÁP
// mới nhất làm gốc → có thể vô tình xuất bản nháp dở của biên tập viên, hoặc đẻ thêm phiên bản "có thay đổi chưa xuất bản").
// Chạy bằng Local API, context dongBo/boQuaLamMoi (không bắn webhook làm mới web cho từng tài liệu).
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { loiKetNoiWeb, webUrl } from "./web";

export type MucSoTrang = { duong: string; nhom: string; ten: string; o: string[]; mac_dinh: Record<string, unknown> };
export type MauCumSo = { mau_duong: string; nhom: string; ten: string; bien: string[]; o: string[]; nguon_kb: Record<string, unknown> };
export type SoTrang = { trang: MucSoTrang[]; mau: MauCumSo[] };
export type KetQuaDongBo = { tao: number; cap_nhat: number; go: number; mau_tao: number; mau_cap_nhat: number; mau_go: number };

export const NGU_CANH_DONG_BO = { dongBo: true, boQuaLamMoi: true, boQuaKiemDinh: true } as const;

const DUONG = /^\/(?![/\\])[^\s\\]*$/;
const MAU = /^\/(?![/\\])[a-z0-9\-/{}_]*$/;

/** Kiểm sơ sổ trang nhận từ web (không tin mù: đường dẫn phải trong site, nhóm thuộc danh sách). */
export function kiemSoTrang(d: unknown): SoTrang {
  const o = (d && typeof d === "object" ? d : {}) as { trang?: unknown; mau?: unknown };
  const nhom = new Set(["cong_cu", "tinh", "phap_ly", "chu_de", "kien_thuc", "tuoi", "la_so_mau", "blog_khung"]);
  const mang = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const doiTuong = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const trang = (Array.isArray(o.trang) ? o.trang : []).flatMap((x): MucSoTrang[] => {
    const t = doiTuong(x);
    return typeof t.duong === "string" && DUONG.test(t.duong) && typeof t.ten === "string" && nhom.has(String(t.nhom))
      ? [{ duong: t.duong, nhom: String(t.nhom), ten: t.ten.slice(0, 120), o: mang(t.o), mac_dinh: doiTuong(t.mac_dinh) }] : [];
  });
  const mau = (Array.isArray(o.mau) ? o.mau : []).flatMap((x): MauCumSo[] => {
    const t = doiTuong(x);
    return typeof t.mau_duong === "string" && MAU.test(t.mau_duong) && typeof t.ten === "string" && nhom.has(String(t.nhom))
      ? [{ mau_duong: t.mau_duong, nhom: String(t.nhom), ten: t.ten.slice(0, 120), bien: mang(t.bien), o: mang(t.o), nguon_kb: doiTuong(t.nguon_kb) }] : [];
  });
  if (!trang.length) throw new Error("Sổ trang rỗng hoặc sai định dạng.");
  return { trang, mau };
}

export async function laySoTrang(): Promise<SoTrang> {
  const bi = process.env.CMS_WEBHOOK_SECRET?.trim();
  if (!bi || !process.env.WEB_URL) throw new Error("Thiếu WEB_URL hoặc CMS_WEBHOOK_SECRET trên CMS (project Vercel cms) — thêm rồi Redeploy CMS.");
  const r = await fetch(`${webUrl()}/api/so-trang`, { headers: { "x-cms-bi-mat": bi }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!r.ok) throw new Error(loiKetNoiWeb(r.status));
  return kiemSoTrang(await r.json());
}

/** Mẫu cụm "/tu-vi/sao-o-cung/{slug}" → regex (biến {nam} 4 chữ số, {gioi} nam|nu, còn lại chữ thường/số/gạch). Cùng
 *  luật với web/lib/so-trang.ts regexMau. */
export function regexMau(mau: string): RegExp {
  const BIEN: Record<string, string> = { nam: "(\\d{4})", gioi: "(nam|nu)" };
  const thoat = mau.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  return new RegExp(`^${thoat.replace(/\{([a-z_]+)\}/g, (_, b: string) => BIEN[b] ?? "([a-z0-9-]+)")}$`);
}

/** Nhóm "ghi đè theo yêu cầu" (tài liệu tạo tay cho một URL thuộc mẫu cụm, không có trong sổ trang). */
const NHOM_GHI_DE = new Set(["kien_thuc", "tuoi", "la_so_mau"]);

/** So sâu, KHÔNG phụ thuộc thứ tự khoá: Postgres jsonb tự sắp lại khoá khi lưu (mac_dinh đọc về khác thứ tự sổ trang của
 *  web) — so bằng JSON.stringify thường thì mỗi lần đồng bộ đều "cập nhật" lại mọi tài liệu + mọi phiên bản. */
const xepKhoa = (v: unknown): unknown => Array.isArray(v) ? v.map(xepKhoa)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, xepKhoa((v as Record<string, unknown>)[k])])) : v;
const giong = (a: unknown, b: unknown) => JSON.stringify(xepKhoa(a ?? null)) === JSON.stringify(xepKhoa(b ?? null));

/** Ghi ô hệ thống vào bảng chính + mọi phiên bản của tài liệu (tên cột theo quy ước Payload: version_<tên>). */
async function ghiHeThong(payload: Payload, bang: "noi_dung_trang" | "mau_cum", id: number | string, o: Record<string, unknown>) {
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle;
  const gan = (tien: string) => sql.join(Object.entries(o).map(([k, v]) => {
    const cot = sql.identifier(`${tien}${k}`);
    if (v !== null && typeof v === "object") return sql`${cot} = ${JSON.stringify(v)}::jsonb`;
    return sql`${cot} = ${v as string | number | boolean | null}`;
  }), sql`, `);
  await db.execute(sql`UPDATE ${sql.identifier("cms")}.${sql.identifier(bang)} SET ${gan("")} WHERE id = ${id}`);
  await db.execute(sql`UPDATE ${sql.identifier("cms")}.${sql.identifier(`_${bang}_v`)} SET ${gan("version_")} WHERE parent_id = ${id}`);
}

type DocHeThong = { id: number | string; duong?: string; mau_duong?: string; nhom?: string; ten?: string; o?: unknown;
  mac_dinh?: unknown; bien?: unknown; nguon_kb?: unknown; tren_web?: boolean | null };

async function tatCa(payload: Payload, collection: "noi-dung-trang" | "mau-cum"): Promise<DocHeThong[]> {
  const r = await payload.find({ collection, limit: 0, pagination: false, depth: 0, overrideAccess: true }) as unknown as { docs: DocHeThong[] };
  return r.docs;
}

export async function dongBoSoTrang(payload: Payload, so: SoTrang): Promise<KetQuaDongBo> {
  const kq: KetQuaDongBo = { tao: 0, cap_nhat: 0, go: 0, mau_tao: 0, mau_cap_nhat: 0, mau_go: 0 };
  const ctx = { ...NGU_CANH_DONG_BO };

  // ---- mẫu cụm (trước, để ghi đè trang KB gắn được mẫu)
  const mauCo = new Map((await tatCa(payload, "mau-cum")).map((d) => [d.mau_duong!, d]));
  for (const m of so.mau) {
    const he = { nhom: m.nhom, ten: m.ten, bien: m.bien, o: m.o, nguon_kb: m.nguon_kb, tren_web: true };
    const cu = mauCo.get(m.mau_duong);
    if (!cu) {
      await payload.create({ collection: "mau-cum", draft: true, overrideAccess: true, context: ctx,
        data: { mau_duong: m.mau_duong, ...he, _status: "draft" } as never });
      kq.mau_tao++;
    } else if (Object.entries(he).some(([k, v]) => !giong(cu[k as keyof DocHeThong], v))) {
      await ghiHeThong(payload, "mau_cum", cu.id, he);
      kq.mau_cap_nhat++;
    }
  }
  const mauMoi = new Set(so.mau.map((m) => m.mau_duong));
  for (const [d, cu] of mauCo) if (!mauMoi.has(d) && cu.tren_web !== false) { await ghiHeThong(payload, "mau_cum", cu.id, { tren_web: false }); kq.mau_go++; }

  // ---- trang theo URL
  const trangCo = new Map((await tatCa(payload, "noi-dung-trang")).map((d) => [d.duong!, d]));
  for (const t of so.trang) {
    const he = { nhom: t.nhom, ten: t.ten, o: t.o, mac_dinh: t.mac_dinh, tren_web: true };
    const cu = trangCo.get(t.duong);
    if (!cu) {
      await payload.create({ collection: "noi-dung-trang", draft: true, overrideAccess: true, context: ctx,
        data: { duong: t.duong, ...he, _status: "draft" } as never });
      kq.tao++;
    } else if (Object.entries(he).some(([k, v]) => !giong(cu[k as keyof DocHeThong], v))) {
      await ghiHeThong(payload, "noi_dung_trang", cu.id, he);
      kq.cap_nhat++;
    }
  }
  // URL không còn trong sổ: tài liệu đồng bộ → gỡ; ghi đè trang KB (kien_thuc / tuoi / la_so_mau) → còn khi URL vẫn khớp một mẫu.
  const trangMoi = new Set(so.trang.map((t) => t.duong));
  const mau = so.mau.map((m) => regexMau(m.mau_duong));
  for (const [d, cu] of trangCo) {
    if (trangMoi.has(d)) continue;
    const con = NHOM_GHI_DE.has(String(cu.nhom)) && mau.some((r) => r.test(d));
    if (cu.tren_web !== con) { await ghiHeThong(payload, "noi_dung_trang", cu.id, { tren_web: con }); if (!con) kq.go++; }
  }
  return kq;
}
