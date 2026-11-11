"use client";
// NT-1 "Lá số người thân" (chủ dự án duyệt 2026-11-04) — tối đa 5 hồ sơ ngày giờ sinh của người thân / bạn bè, CHỈ trên
// máy này (localStorage `hbt.nguoi_than.v1`), để (a) xem nhanh lá số Tử vi của người đó trên /tu-vi và (b) điền sẵn
// "Xem lá số 2 người". Đổi quy tắc cũ của HopThamTuVi ("ngày sinh người kia không lưu") — giờ vẫn KHÔNG lưu, trừ khi người
// dùng tự bấm "Lưu trên máy này" và tự tích ô người đó đồng ý / mình là cha mẹ, người giám hộ (không tích sẵn).
// Không bao giờ đồng bộ tài khoản, không ghi bảng học / góp ý; chỉ gửi đi trong đúng lượt gọi engine trang đã làm.
// Trường chỉ là những gì lá số cần (không họ tên đầy đủ: "tên gọi" tuỳ chọn). Web không tính gì: ngày âm gửi nguyên cho
// engine đổi (`calendar_type: "am"`). Xoá từng người / tất cả; `xoaHoSo()` (lib/hoso) xoá luôn khoá này.
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { QUAN_HE_HOP_THAM, type ChartInputVao } from "@/app/api/tuvi/schema";
import { GIO_DAI_DIEN_KHONG_BIET, HoSo, KHOA_NGUOI_THAN, NUOC_NGOAI, SU_KIEN_NGUOI_THAN, ngayHopLe } from "@/lib/hoso";

export { KHOA_NGUOI_THAN };
export const TOI_DA_NGUOI_THAN = 5;
export type MaQuanHe = (typeof QUAN_HE_HOP_THAM)[number];
export const TEN_QUAN_HE: Record<MaQuanHe, string> = {
  nguoi_yeu: "Người yêu", vo_chong: "Vợ / chồng", ban_be: "Bạn bè", dong_nghiep: "Đồng nghiệp",
  doi_tac: "Đối tác", sep: "Sếp", cha_me_con: "Cha mẹ – con", gia_dinh: "Gia đình",
};

/** Câu cam kết lưu trữ — lời hứa về hệ thống (như "Chữ dùng chung" quy định: câu cam kết dữ liệu giữ trong code, đổi bằng PR
 *  cùng Chính sách quyền riêng tư). */
export const CAM_KET_NGUOI_THAN = "Chỉ lưu trên máy này, không gửi lên tài khoản. Xoá bất cứ lúc nào.";
export const CAM_KET_NGUOI_THAN_EN = "Stored only on this device, never sent to an account. Delete it any time.";

const Dau = z.object({
  /** Tên gọi / biệt danh tuỳ chọn — để người dùng tự nhận ra ("Mẹ", "Bé Na"); không cần họ tên đầy đủ. */
  ten_goi: z.string().trim().max(40).optional(),
  quan_he: z.enum(QUAN_HE_HOP_THAM),
  /** Ngày nhập theo lịch nào — giữ nguyên như người dùng gõ, engine đổi (web không tính). */
  lich_nhap: z.enum(["duong", "am"]),
  ngay: HoSo.shape.ngay,
  thang: HoSo.shape.thang,
  nam: HoSo.shape.nam,
  am_nhuan: z.boolean().optional(),
  gio: HoSo.shape.gio,
  /** "unknown" = không biết giờ → lá số an tạm 12:00 như hồ sơ chính. */
  do_tin_gio: z.enum(["exact", "unknown"]).optional(),
  gioi_tinh: HoSo.shape.gioi_tinh,
  noi_sinh: HoSo.shape.noi_sinh,
  vung: HoSo.shape.vung,
  lich_am: HoSo.shape.lich_am,
});
export const NguoiThan = Dau.extend({ id: z.string().regex(/^nt_[a-z0-9]{4,20}$/), tao_luc: z.string() });
export type NguoiThan = z.infer<typeof NguoiThan>;
export type NguoiThanVao = z.input<typeof Dau>;
const Kho = z.object({ v: z.literal(1), ds: z.array(NguoiThan).max(TOI_DA_NGUOI_THAN) });

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: NguoiThan[] = [];

function doc(): NguoiThan[] {
  if (typeof window === "undefined") return hienTai;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_NGUOI_THAN);
      const kq = raw ? Kho.safeParse(JSON.parse(raw)) : null;
      hienTai = kq?.success ? kq.data.ds : [];
    } catch {
      hienTai = [];
    }
  }
  return hienTai;
}
const bao = () => nghe.forEach((f) => f());

function ghiKho(ds: NguoiThan[]) {
  hienTai = ds; daDoc = true;
  try {
    if (ds.length) window.localStorage.setItem(KHOA_NGUOI_THAN, JSON.stringify({ v: 1, ds }));
    else window.localStorage.removeItem(KHOA_NGUOI_THAN);
  } catch { /* chế độ riêng tư chặn storage: vẫn dùng được trong phiên */ }
  bao();
}

function dangKy(f: () => void) {
  nghe.add(f);
  const lai = () => { daDoc = false; f(); };
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_NGUOI_THAN || e.key === null) lai(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SU_KIEN_NGUOI_THAN, lai);   // xoaHoSo() cùng tab
  return () => {
    nghe.delete(f);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SU_KIEN_NGUOI_THAN, lai);
  };
}

/** `undefined` = đang hydrate · `[]` = chưa lưu ai. */
export function useNguoiThan(): NguoiThan[] | undefined {
  return useSyncExternalStore<NguoiThan[] | undefined>(dangKy, doc, () => undefined);
}

/** Ngày có thật không (chỉ kiểm định dạng — ngày âm ≤ 30, engine kiểm tiếp). */
export function ngayNhapHopLe(v: Pick<NguoiThanVao, "lich_nhap" | "ngay" | "thang" | "nam">): boolean {
  if (v.lich_nhap === "am") return v.ngay >= 1 && v.ngay <= 30 && v.thang >= 1 && v.thang <= 12 && v.nam >= 1900 && v.nam <= 2100;
  return ngayHopLe(v.ngay, v.thang, v.nam);
}

const cungNguoi = (a: NguoiThanVao, b: NguoiThanVao) =>
  a.lich_nhap === b.lich_nhap && a.ngay === b.ngay && a.thang === b.thang && a.nam === b.nam && !!a.am_nhuan === !!b.am_nhuan
  && (a.gio ?? "") === (b.gio ?? "") && (a.gioi_tinh ?? "") === (b.gioi_tinh ?? "");

/** Người đã lưu trùng ngày giờ + giới tính (để không mời lưu lại). */
export function timNguoiThan(vao: NguoiThanVao): NguoiThan | null {
  return doc().find((x) => cungNguoi(x, vao)) ?? null;
}

export type KetQuaLuu = { ok: true; nt: NguoiThan; capNhat: boolean } | { ok: false; ly_do: "chua_dong_y" | "day" | "khong_hop_le" };

/** Lưu một người — `dongY` là ô người dùng TỰ TÍCH (không tích sẵn); thiếu thì không lưu. Trùng ngày giờ + giới tính với
 *  người đã lưu → cập nhật tên gọi / quan hệ thay vì thêm dòng mới. */
export function luuNguoiThan(vao: NguoiThanVao, dongY: boolean): KetQuaLuu {
  if (dongY !== true) return { ok: false, ly_do: "chua_dong_y" };
  const p = Dau.safeParse({ ...vao, ten_goi: vao.ten_goi?.trim() || undefined });
  if (!p.success || !ngayNhapHopLe(p.data)) return { ok: false, ly_do: "khong_hop_le" };
  if (p.data.lich_nhap === "duong" && Date.UTC(p.data.nam, p.data.thang - 1, p.data.ngay) > Date.now()) return { ok: false, ly_do: "khong_hop_le" };
  const ds = doc();
  const cu = ds.find((x) => cungNguoi(x, p.data));
  if (cu) {
    const moi = NguoiThan.parse({ ...cu, ...p.data, id: cu.id, tao_luc: cu.tao_luc });
    ghiKho(ds.map((x) => (x.id === cu.id ? moi : x)));
    return { ok: true, nt: moi, capNhat: true };
  }
  if (ds.length >= TOI_DA_NGUOI_THAN) return { ok: false, ly_do: "day" };
  const nt = NguoiThan.parse({ ...p.data, id: `nt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, tao_luc: new Date().toISOString() });
  ghiKho([...ds, nt]);
  return { ok: true, nt, capNhat: false };
}

export function xoaNguoiThan(id: string): void {
  ghiKho(doc().filter((x) => x.id !== id));
}
export function xoaTatCaNguoiThan(): void {
  ghiKho([]);
}

/** Tên hiện trên giao diện — tên gọi, không có thì nhãn quan hệ (+ năm). Không bao giờ gửi vào đo lường. */
export function tenHien(nt: Pick<NguoiThan, "ten_goi" | "quan_he" | "nam">): string {
  return nt.ten_goi || `${TEN_QUAN_HE[nt.quan_he]} · ${nt.nam}`;
}

/** Đủ để an lá số Tử vi chưa (giờ hoặc "không biết giờ", giới tính, nơi sinh). */
export function duLaSo(nt: Pick<NguoiThan, "gio" | "do_tin_gio" | "gioi_tinh" | "noi_sinh">): boolean {
  return Boolean((nt.gio || nt.do_tin_gio === "unknown") && nt.gioi_tinh && nt.noi_sinh);
}

const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (nt: Pick<NguoiThan, "ngay" | "thang" | "nam">) => `${nt.nam}-${p2(nt.thang)}-${p2(nt.ngay)}`;

/** Đầu vào lá số (giống `laSoTuHoSo`) — null nếu chưa đủ. Ngày âm gửi `calendar_type: "am"`, engine đổi. */
export function laSoNguoiThan(nt: NguoiThan | null | undefined): ChartInputVao | null {
  if (!nt || !duLaSo(nt)) return null;
  const khongBiet = nt.do_tin_gio === "unknown" || !nt.gio;
  return {
    birth_date: iso(nt), birth_time: khongBiet ? GIO_DAI_DIEN_KHONG_BIET : nt.gio!, gender: nt.gioi_tinh!, noi_sinh: nt.noi_sinh!,
    ...(nt.lich_nhap === "am" ? { calendar_type: "am" as const, ...(nt.am_nhuan ? { am_nhuan: true } : {}) } : {}),
    ...(nt.noi_sinh !== NUOC_NGOAI && nt.vung ? { vung: nt.vung } : {}),
    ...(khongBiet ? { do_tin_gio: "unknown" as const } : {}),
  };
}
