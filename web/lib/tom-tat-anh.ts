// SEO-O (chủ dự án giao 2026-11-10): ảnh tóm tắt có chữ thật cho trang năm / lịch / tuổi / ngày tốt — Google Hình ảnh
// không lấy hình SVG vẽ trong trang, trước đó các trang này không có một <img> nào.
// MỘT nguồn: cùng hàm dựng "ý chính" từ dữ liệu ENGINE cho cả ảnh (`/og/tom-tat`) lẫn alt + chú thích trên trang →
// chữ trong ảnh và alt luôn khớp nhau. Chỉ dữ liệu công khai của năm / ngày / năm sinh (không dữ liệu cá nhân).
import { cuoiHoiCongKhai, dmy, duongCuoiHoi, duongNam, duongNamTuoi, duongSinhCon, namCongKhai, namTheoTuoiCongKhai, sinhConCongKhai } from "@/lib/nam";
import {
  duongHanNam, duongLamNha, duongLamNhaNam, duongSaoHanNam, duongXongDatNam, hanNamCongKhai, lamNhaCongKhai,
  lamNhaNamCongKhai, saoHanNamCongKhai, xongDatNamCongKhai,
} from "@/lib/tuoi-dan-gian";
import { duongLichAm, lichNamCongKhai } from "@/lib/lich-am";
import { duongNgay, duongThang, ngayTotCongKhai, thangCongKhai } from "@/lib/hoang-lich";

export const KIEU_TOM_TAT = ["nam", "lich_am", "lam_nha", "lam_nha_tuoi", "xong_dat", "sao_han", "huong_xau", "sinh_con",
  "cuoi_hoi", "tuoi", "thang", "ngay"] as const;
export type KieuTomTat = (typeof KIEU_TOM_TAT)[number];
export interface ThamSoTomTat { kieu: KieuTomTat; nam?: number; ns?: number; thang?: number; ngay?: string }
export interface TomTatAnh {
  /** Dòng nhỏ trên cùng (nhóm). */ nhan: string;
  tieuDe: string;
  /** 3–6 ý, mỗi ý ≤ ~70 ký tự. */ dong: string[];
  duong: string;
  alt: string;
}

const gon = (ds: string[], n: number) => (ds.length > n ? `${ds.slice(0, n).join(", ")}…` : ds.join(", "));
const ngayVn = (iso: string) => dmy(iso);

/** alt ≤ 300 ký tự: tiêu đề + các ý (câu thật, không nhồi từ khoá). */
function taoAlt(tieuDe: string, dong: string[]): string {
  const cham = (x: string) => (/[.?!…]$/.test(x) ? x : `${x}.`);
  let s = cham(tieuDe);
  for (const d of dong) {
    if ((s + " " + d).length > 298) break;
    s += ` ${cham(d.replace(/[.\s]+$/, ""))}`;
  }
  return s;
}

function xong(nhan: string, tieuDe: string, dong: string[], duong: string): TomTatAnh {
  const ds = dong.filter(Boolean).slice(0, 6);
  return { nhan, tieuDe, dong: ds, duong, alt: taoAlt(tieuDe, ds) };
}

export function thamSoTuUrl(sp: URLSearchParams): ThamSoTomTat | null {
  const kieu = sp.get("kieu") as KieuTomTat | null;
  if (!kieu || !(KIEU_TOM_TAT as readonly string[]).includes(kieu)) return null;
  const so = (k: string, a: number, b: number) => {
    const v = Number(sp.get(k));
    return Number.isInteger(v) && v >= a && v <= b ? v : undefined;
  };
  const ngay = sp.get("ngay") ?? undefined;
  return { kieu, nam: so("nam", 1901, 2098), ns: so("ns", 1900, 2100), thang: so("thang", 1, 12),
    ngay: ngay && /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : undefined };
}

/** Đường dẫn ảnh (cùng tham số) — trang và JSON-LD dùng. */
export function urlAnhTomTat(t: ThamSoTomTat): string {
  const q = new URLSearchParams({ kieu: t.kieu });
  if (t.nam) q.set("nam", String(t.nam));
  if (t.ns) q.set("ns", String(t.ns));
  if (t.thang) q.set("thang", String(t.thang));
  if (t.ngay) q.set("ngay", t.ngay);
  return `/og/tom-tat?${q.toString()}`;
}

/** Dựng ý chính từ engine; engine lỗi / thiếu tham số → null (trang ẩn ảnh, route trả ảnh dự phòng). */
export async function tomTatAnh(t: ThamSoTomTat): Promise<TomTatAnh | null> {
  const { kieu, nam: n, ns, thang } = t;
  try {
    switch (kieu) {
      case "nam": {
        if (!n) return null;
        const d = await namCongKhai(n);
        if (!d) return null;
        return xong("Năm " + n, `Năm ${n} ${d.can_chi}: năm con gì, mệnh gì?`, [
          `Năm con ${d.con_giap}, mệnh ${d.nap_am.ten} (hành ${d.nap_am.hanh})`,
          `Tết Nguyên đán: ${ngayVn(d.tet)}`,
          d.thang_nhuan ? `Âm lịch có tháng ${d.thang_nhuan} nhuận (13 tháng)` : "Âm lịch không có tháng nhuận (12 tháng)",
          d.tam_tai?.tuoi?.length ? `Tam tai: tuổi ${d.tam_tai.tuoi.join(", ")}` : "",
          `Năm tuổi: tuổi ${d.nam_tuoi} · tuổi xung: ${d.xung}`,
          d.tuoi_hop?.length ? `Tuổi hợp năm: ${d.tuoi_hop.join(", ")}` : "",
        ], duongNam(n));
      }
      case "lich_am": {
        if (!n) return null;
        const d = await lichNamCongKhai(n);
        if (!d) return null;
        const le = Object.fromEntries((d.le ?? []).map((x) => [x.ma, x]));
        return xong("Lịch âm", `Lịch âm ${n} (${d.can_chi})`, [
          `Mùng 1 Tết: ${ngayVn(d.tet)}`,
          `Năm âm lịch có ${d.thang.length} tháng${d.so_ngay ? `, ${d.so_ngay} ngày` : ""}`,
          d.thang_nhuan ? `Nhuận tháng ${d.thang_nhuan}` : "Không có tháng nhuận",
          le.gio_to ? `Giỗ Tổ Hùng Vương (10/3 âm): ${ngayVn(le.gio_to.duong)}` : "",
          le.trung_thu ? `Tết Trung thu (15/8 âm): ${ngayVn(le.trung_thu.duong)}` : "",
          le.giao_thua ? `Giao thừa: ${ngayVn(le.giao_thua.duong)}` : `Tết năm sau: ${ngayVn(d.tet_sau)}`,
        ], duongLichAm(n));
      }
      case "lam_nha": {
        if (!n) return null;
        const d = await lamNhaNamCongKhai(n);
        if (!d) return null;
        const thuan = d.ds.filter((x) => x.thuan).map((x) => `${x.can_chi} ${x.nam_sinh}`);
        return xong("Tuổi làm nhà", `Tuổi nào làm nhà năm ${n} ${d.can_chi}?`, [
          `${d.so_thuan}/${d.ds.length} tuổi (sinh 1960–2005) không phạm Kim lâu, Hoang ốc xấu, Tam tai`,
          thuan.length ? `Tuổi thuận: ${gon(thuan, 3)}` : "Không tuổi nào trong bảng thuận cả ba điều",
          thuan.length > 3 ? `Thêm: ${gon(thuan.slice(3), 3)}` : "",
          `Ba điều kiêng: Kim lâu, Hoang ốc, Tam tai (tính theo tuổi mụ)`,
          "Phạm thì dân gian hay mượn tuổi người khác đứng làm",
        ], duongLamNhaNam(n));
      }
      case "lam_nha_tuoi": {
        if (!n || !ns) return null;
        const d = await lamNhaCongKhai(n, ns);
        if (!d) return null;
        return xong("Tuổi làm nhà", `Tuổi ${d.can_chi} ${ns} làm nhà năm ${n}`, [
          `Tuổi mụ năm ${n}: ${d.tuoi_mu}`,
          d.kim_lau ? `Phạm ${d.kim_lau.ten}` : "Không phạm Kim lâu",
          `Hoang ốc: ${d.hoang_oc.ten}${d.hoang_oc.tot ? " (tốt)" : " (xấu)"}`,
          d.tam_tai ? `Tam tai: ${d.tam_tai.ten}` : "Không trong Tam tai",
          d.ket_luan.ma === "thuan" ? `Năm ${n}: thuận cả ba điều` : `Năm ${n}: dân gian thường cân nhắc`,
          d.nam_thuan?.length ? `Năm thuận gần nhất: ${d.nam_thuan.slice(0, 3).map((x) => x.nam).join(", ")}` : "",
        ], duongLamNha(n, ns));
      }
      case "xong_dat": {
        if (!n) return null;
        const d = await xongDatNamCongKhai(n);
        if (!d) return null;
        const m = d.mung_mot;
        return xong("Xông đất", `Xông đất Tết ${n} ${d.nam.can_chi}`, [
          `Mùng 1 Tết: ${ngayVn(m.ngay)}, ngày ${m.can_chi}`,
          `Giờ hoàng đạo: ${m.gio_hoang_dao.slice(0, 4).map((g) => `${g.chi} ${g.khung}`).join(", ")}`,
          `Hỷ thần ${m.huong.hy_than} · Tài thần ${m.huong.tai_than}`,
          d.nen_tranh.length ? `Nên tránh: ${d.nen_tranh.join("; ")}` : "",
          "Tra tuổi hợp theo năm sinh gia chủ (1960–2005)",
        ], duongXongDatNam(n));
      }
      case "sao_han": {
        if (!n) return null;
        const d = await saoHanNamCongKhai(n);
        if (!d) return null;
        const theo = (sao: string, gioi: "nam" | "nu") => d.ds.filter((x) => x[gioi] === sao).map((x) => String(x.nam_sinh));
        const dong = (["La Hầu", "Kế Đô", "Thái Bạch"] as const).flatMap((s) => [
          theo(s, "nam").length ? `${s} (nam): ${gon(theo(s, "nam"), 5)}` : "",
          theo(s, "nu").length ? `${s} (nữ): ${gon(theo(s, "nu"), 5)}` : "",
        ]).filter(Boolean);
        return xong("Sao hạn", `Sao hạn năm ${n} ${d.can_chi} theo năm sinh`, dong, duongSaoHanNam(n));
      }
      case "huong_xau": {
        if (!n) return null;
        const d = await hanNamCongKhai(n);
        if (!d) return null;
        return xong("Hướng xấu năm", `Hướng xấu năm ${n} ${d.can_chi}`,
          d.huong_tranh.map((h) => `${h.ten}: hướng ${h.phuong}${h.chi?.length ? ` (${h.chi.join(", ")})` : ""}`), duongHanNam(n));
      }
      case "sinh_con": {
        if (!n) return null;
        const d = await sinhConCongKhai(n);
        if (!d) return null;
        const hop = d.ds.filter((x) => x.nhom === "hop").map((x) => `${x.can_chi} ${x.nam_sinh}`);
        return xong("Sinh con", `Sinh con năm ${n} ${d.con.can_chi}`, [
          `Con mệnh ${d.con.nap_am} (hành ${d.con.hanh})`,
          `Sinh từ ${ngayVn(d.con.tu)} đến ${ngayVn(d.con.den)} (theo Tết)`,
          `Tuổi bố mẹ hợp con theo địa chi: ${d.chi_hop.join(", ")}`,
          `Tuổi xung với con: ${d.chi_xung}`,
          hop.length ? `Ví dụ tuổi hợp: ${gon(hop, 3)}` : "",
        ], duongSinhCon(n));
      }
      case "cuoi_hoi": {
        if (!n) return null;
        const d = await cuoiHoiCongKhai(n);
        if (!d) return null;
        const duoc = d.ds.filter((x) => x.duoc).map((x) => `${x.can_chi} ${x.nam_sinh}`);
        const pham = d.ds.filter((x) => !x.duoc).map((x) => String(x.nam_sinh));
        return xong("Cưới hỏi", `Cưới năm ${n} ${d.can_chi}: tuổi nào hợp?`, [
          `${d.so_duoc}/${d.ds.length} tuổi cô dâu không phạm Kim lâu`,
          duoc.length ? `Không phạm: ${gon(duoc, 3)}` : "",
          pham.length ? `Phạm Kim lâu (sinh năm): ${gon(pham, 6)}` : "",
          "Kim lâu tính theo tuổi mụ của cô dâu",
        ], duongCuoiHoi(n));
      }
      case "tuoi": {
        if (!n || !ns) return null;
        const d = await namTheoTuoiCongKhai(n, ns);
        if (!d) return null;
        return xong("Tử vi theo tuổi", `Tuổi ${d.nguoi.can_chi} ${ns} năm ${n}`, [
          `Mệnh ${d.nguoi.nap_am} (hành ${d.nguoi.hanh}), tuổi mụ ${d.tuoi_mu}`,
          ...d.diem_nhan.slice(0, 3).map((x) => x.tieu_de),
          d.sao.nam || d.sao.nu ? `Sao hạn: nam ${d.sao.nam?.ten ?? "—"}, nữ ${d.sao.nu?.ten ?? "—"}` : "",
        ], duongNamTuoi(n, ns));
      }
      case "thang": {
        if (!n || !thang) return null;
        const d = await thangCongKhai(n, thang);
        if (!d) return null;
        const tt = d.tom_tat;
        return xong("Ngày tốt", `Ngày tốt tháng ${thang}/${n}`, [
          tt ? `${tt.so_hoang_dao} ngày hoàng đạo, ${tt.so_dep} ngày đẹp` : "",
          d.thang_am ? `Âm lịch: ${d.thang_am}` : "",
          ...(d.theo_viec ?? []).filter((v) => v.dep_nhat).slice(0, 4).map((v) => `${v.viec.ten}: ${ngayVn(v.dep_nhat!.ngay)} (${v.so_ngay} ngày hợp)`),
        ], duongThang(n, thang));
      }
      case "ngay": {
        if (!t.ngay) return null;
        const d = await ngayTotCongKhai(t.ngay);
        if (!d) return null;
        return xong("Ngày tốt", `Ngày ${ngayVn(d.ngay)} tốt hay xấu?`, [
          `${d.thu}, âm lịch ${d.am.chu}, ngày ${d.can_chi.ngay}`,
          `${d.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} (${d.than.ten}) · trực ${d.truc.ten}`,
          d.nghi.length ? `Nên: ${gon(d.nghi.map((x) => x.ten), 3)}` : "",
          d.ky.length ? `Kiêng: ${gon(d.ky.map((x) => x.ten), 3)}` : "",
          `Giờ hoàng đạo: ${d.gio_hoang_dao.slice(0, 4).map((g) => g.chi).join(", ")}`,
          `Xung tuổi ${d.xung_tuoi.ten}`,
        ], duongNgay(d.ngay));
      }
    }
  } catch { return null; }
  return null;
}
