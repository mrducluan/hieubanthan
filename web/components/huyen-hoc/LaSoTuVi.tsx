"use client";
// VZ-2 — Lá số Tử vi vẽ bằng SVG theo bố cục giấy truyền thống (vòng 12 cung 4×4, giữa là thông tin).
// Chỉ VẼ dữ liệu engine: sao, độ sáng, tứ hoá, vòng Trường sinh/Bác sĩ/Thái tuế, Tuần/Triệt, lớp vận hạn.
// Tô màu theo ngũ hành của sao; bấm một cung → nổi tam phương tứ chính (tam hợp + xung chiếu).
import { forwardRef, useId, useMemo, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import {
  AN_TAP_DIEU, HANH_SAO, NEO, TEN_HOA_MA, VI_TRI, hoaHanDangBat, nhomSao, tachTuTru, tamPhuong,
  type HoaHan, type MaHoa, type NhomSao,
} from "@/lib/tuvi-hien-thi";
import type { GiaoDien } from "@/lib/giao-dien-la-so";
import { tenGon, useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";

/** EN-ALL GĐ 4: chữ lá số (lib/chu/tu-vi.ts) + tên hiển thị mã (ten_hien) — bản Việt: đúng chữ cũ, mã hiện nguyên. */
type ChuLS = ReturnType<typeof useChuTuVi>;

type CungT = LaSoOutputT["cung"][number];

const W = 250;          // bề rộng một ô (đơn vị viewBox)
const H = 275;          // chiều cao một ô
const DONG = 16.5;      // khoảng dòng phụ tinh
const MAU_HANH: Record<string, string> = {
  "Kim": "var(--ls-kim)", "Mộc": "var(--ls-moc)", "Thủy": "var(--ls-thuy)", "Hỏa": "var(--ls-hoa)", "Thổ": "var(--ls-tho)",
};
const MAU_NHOM: Record<NhomSao, string> = {
  cat: "var(--ls-cat)", sat: "var(--ls-sat)", dao_hoa: "var(--ls-dao)", trung: "var(--ls-mo)",
};
const MAU_HOA: Record<string, string> = {
  "Lộc": "var(--ls-moc)", "Quyền": "var(--ls-hoa)", "Khoa": "var(--ls-thuy)", "Kỵ": "var(--ls-ky)",
};
const SINH_TOT = new Set(["Trường Sinh", "Quan Đới", "Lâm Quan", "Đế Vượng"]);
const SINH_XAU = new Set(["Suy", "Bệnh", "Tử", "Mộ", "Tuyệt"]);

interface DongSao { ten: string; mau: string; dam?: boolean; nghieng?: boolean }

export type PhaiDoSang = "nam" | "trung";
type SaoT = CungT["chinh_tinh"][number];
/** Độ sáng hiển thị: Nam phái dùng bảng lối Việt (chính tinh + phụ tinh có luận); phái Trung dùng iztro. */
/** Vòng Thái Tuế: Nam phái dùng tên sách Việt (Thái Tuế, Thiếu Dương…), phái Trung giữ tên iztro. */
export function tenThaiTue(c: { tue_tien: string; thai_tue_nam_phai?: string | null }, phai: PhaiDoSang): string {
  return phai === "nam" ? (c.thai_tue_nam_phai ?? c.tue_tien) : c.tue_tien;
}

export function doSang(s: SaoT, phai: PhaiDoSang, laChinh: boolean): string | null {
  if (phai === "nam") return laChinh ? s.do_sang_nam_phai ?? s.do_sang : s.do_sang_nam_phai ?? null;
  return s.do_sang;
}

function dongSaoCot(c: CungT, phai: PhaiDoSang, tc: ChuLS): { trai: DongSao[]; phai: DongSao[] } {
  const trai: DongSao[] = [];
  const phaiCot: DongSao[] = [];
  // Tứ hoá sinh niên (của chính tinh lẫn phụ tinh) đứng đầu cột: Lộc/Quyền/Khoa trái, Kỵ phải.
  for (const s of [...c.chinh_tinh, ...c.phu_tinh]) {
    if (!s.tu_hoa) continue;
    const d = { ten: tc.c("ls.hoa", { hoa: tc.hoa(s.tu_hoa) }), mau: MAU_HOA[s.tu_hoa] ?? "var(--ls-chu)", dam: true };
    (s.tu_hoa === "Kỵ" ? phaiCot : trai).push(d);
  }
  for (const s of c.phu_tinh) {
    const g = nhomSao(s.ten, s.loai);
    const ds = doSang(s, phai, false);
    const tat = tc.tat(ds), tenS = tenGon(tc.ten("sao", s.ten));   // ô chật: bỏ chú giải trong ngoặc của tên Anh
    const ten = tat ? `${tenS} (${tat})` : tenS;
    const d = { ten, mau: s.ten in HANH_SAO ? MAU_HANH[HANH_SAO[s.ten]!]! : MAU_NHOM[g], dam: true };
    (g === "sat" ? phaiCot : trai).push(d);
  }
  const daCo = new Set(c.phu_tinh.map((s) => s.ten));
  const phu = [c.bac_si, c.tue_tien, ...c.tap_dieu.filter((t) => !AN_TAP_DIEU.has(t))];
  for (const t of phu) {
    if (daCo.has(t)) continue;   // iztro có sao trùng tên giữa vòng Thái tuế và tạp diệu (vd Thiên Đức)
    daCo.add(t);
    const g = nhomSao(t);
    const ds = phai === "nam" ? c.do_sang_phu?.[t] : undefined;
    const hien = tenGon(tc.ten("sao", t === c.tue_tien ? tenThaiTue(c, phai) : t));     // TV-LICH: tên vòng Thái Tuế theo phái
    const tat = tc.tat(ds);
    const d = { ten: tat ? `${hien} (${tat})` : hien, mau: MAU_NHOM[g] };
    (g === "sat" || g === "trung" ? phaiCot : trai).push(d);
  }
  return { trai, phai: phaiCot };
}

// UX v3 M5 — lớp "vừa khung" trên điện thoại: KhungLaSo (`group/ls`, data-gon="1" khi chưa phóng to, < 640px) ẩn lớp
// chi tiết (`.ls-chi-tiet`: phụ tinh, can chi, tuổi, vòng Trường sinh, nhãn hạn, Tuần/Triệt, dòng nhỏ khung giữa) và hiện
// lớp gọn (`.ls-gon`: tên cung + chính tinh + mức sáng, chữ ≥ 25 đơn vị ≈ 9px ở 390px). Lớp gọn mặc định `display="none"`
// → ảnh tải về (tai-anh-svg chép SVG, không mang stylesheet trang) vẫn là bản đầy đủ như cũ; máy tính / phóng to không đổi.
const CHI_TIET = "ls-chi-tiet max-sm:group-data-[gon=1]/ls:hidden";
const GON = "ls-gon max-sm:group-data-[gon=1]/ls:inline";
const CO_GON = 27;          // cỡ chữ lớp gọn (đơn vị viewBox) — 1000 đơn vị ≈ 343px ở màn 375px → ~9.3px (390px: 9.7px)
const RONG_GON = 226;       // bề rộng tối đa một dòng trong ô (W − lề)
/** Ép dòng gọn không tràn ô: ước bề rộng theo số ký tự; dài quá thì textLength co lại vừa RONG_GON. */
function vuaO(chu: string, co: number, rong = RONG_GON): { textLength?: number; lengthAdjust?: "spacingAndGlyphs" } {
  return chu.length * co * 0.56 > rong ? { textLength: rong, lengthAdjust: "spacingAndGlyphs" } : {};
}

// TV-HOA-HAN — huy hiệu tứ hoá của lớp hạn (đại hạn "ĐH" / năm xem "Năm"): khung VIỀN ĐỨT, chữ màu theo hoá — khác hẳn
// "Hoá Lộc…" sinh niên (chữ đậm, không khung). Kỵ màu hổ phách (--ls-ky-han), không đỏ. Chính tinh: huy hiệu đứng ngay sau
// tên sao (đủ chỗ) hoặc dòng nhỏ ngay dưới; phụ tinh: một dòng "ĐH Khoa · Văn Xương" dưới chính tinh.
const MAU_HOA_HAN: Record<MaHoa, string> = {
  loc: "var(--ls-moc)", quyen: "var(--ls-hoa)", khoa: "var(--ls-thuy)", ky: "var(--ls-ky-han)",
};
const CO_HUY = 11.5;
const CO_HUY_NHO = 10;      // thử cỡ nhỏ hơn trước khi đẩy huy hiệu xuống dòng dưới (đỡ đẩy cột phụ tinh)
const nhanLop = (b: HoaHan, t: ChuLS) => t.c(b.lop === "dh" ? "ls.huy_dh" : "ls.huy_ln");   // NHAN_LOP_HAN, theo ngôn ngữ
const chuHuy = (b: HoaHan, coSao: boolean, t: ChuLS) => `${t.hoa(TEN_HOA_MA[b.hoa])}${coSao ? ` · ${t.ten("sao", b.sao)}` : ""}`;
/** Bề rộng ước của một huy hiệu (đơn vị viewBox) — như vuaO: theo số ký tự. */
function rongHuy(b: HoaHan, co: number, coSao: boolean, t: ChuLS): number {
  return (nhanLop(b, t).length + 1 + chuHuy(b, coSao, t).length) * co * 0.58 + co;
}
function HuyHan({ b, x, y, co = CO_HUY, coSao = false, t }: { b: HoaHan; x: number; y: number; co?: number; coSao?: boolean; t: ChuLS }) {
  const w = rongHuy(b, co, coSao, t);
  const h = co * 1.45;
  const mau = MAU_HOA_HAN[b.hoa];
  return (
    <g transform={`translate(${x},${y})`} data-hoa-han={`${b.lop}-${b.hoa}`}>
      <rect x={0} y={-co * 1.04} width={w} height={h} rx={h / 2} fill="var(--ls-o)" stroke={mau} strokeWidth={1.2} strokeDasharray="3 2.4" />
      <text x={w / 2} y={0} textAnchor="middle" fontSize={co} fontWeight={700} fill={mau}>
        <tspan fontSize={co * 0.82} fontWeight={600} fill="var(--ls-mo)">{nhanLop(b, t)} </tspan>{chuHuy(b, coSao, t)}
      </text>
    </g>
  );
}
/** Một hàng huy hiệu canh giữa tại tâm `cx`. */
function HangHuy({ ds, cx, y, co = CO_HUY, coSao = false, t }: { ds: HoaHan[]; cx: number; y: number; co?: number; coSao?: boolean; t: ChuLS }) {
  const rong = ds.map((b) => rongHuy(b, co, coSao, t));
  const tong = rong.reduce((a, b) => a + b, 0) + (ds.length - 1) * 5;
  let x = cx - tong / 2;
  return <>{ds.map((b, k) => { const el = <HuyHan key={`${b.lop}${b.hoa}`} b={b} x={x} y={y} co={co} coSao={coSao} t={t} />; x += rong[k]! + 5; return el; })}</>;
}
const loiHoaHan = (ds: HoaHan[], t: ChuLS) => ds.map((b) => t.c("ls.aria_han_muc", { lop: t.c(b.lop === "dh" ? "ls.aria_dh" : "ls.aria_ln"), sao: t.ten("sao", b.sao), hoa: t.hoa(TEN_HOA_MA[b.hoa]) })).join(", ");

function catDong(ds: DongSao[], toiDa: number, t: ChuLS): DongSao[] {
  if (ds.length <= toiDa) return ds;
  return [...ds.slice(0, toiDa - 1), { ten: t.c("ls.them_sao", { so: String(ds.length - toiDa + 1) }), mau: "var(--ls-mo)", nghieng: true }];
}

interface Props {
  ls: LaSoOutputT;
  vanHan?: VanHanOutputT | null;
  lop?: { dai_han: boolean; luu_nien: boolean };
  giaoDien: GiaoDien;
  ten?: string | null;
  gioSinh?: string | null;
  chon: string;
  onChon: (chi: string) => void;
  phaiDoSang?: PhaiDoSang;
}

export const LaSoTuVi = forwardRef<SVGSVGElement, Props>(function LaSoTuVi(
  { ls, vanHan, lop = { dai_han: false, luu_nien: false }, giaoDien, ten, gioSinh, chon, onChon, phaiDoSang = "nam" }, ref,
) {
  const [di, setDi] = useState<string | null>(null);
  const t = useChuTuVi();
  const tenC = (ma: string) => t.ten("cung", ma);
  const giam = useReducedMotion();
  const idTieuDe = useId();
  const dangXem = di ?? chon;
  const tp = useMemo(() => tamPhuong(dangXem), [dangXem]);
  const chiSo = (chi: string) => ls.cung.findIndex((c) => c.chi === chi);
  const tru = tachTuTru(ls.tu_tru);
  const cungThan = ls.cung.find((c) => c.la_than)?.ten;
  const hoaHan = useMemo(() => hoaHanDangBat(vanHan, lop), [vanHan, lop]);

  const neo = (chi: string): [number, number] => {
    const [x, y] = NEO[chi]!;
    return [x * W, y * H];
  };
  const [x0, y0] = neo(dangXem);
  const duongTamHop = [dangXem, ...tp.tam_hop].map(neo);
  const [xx, yx] = neo(tp.xung);

  const phim = (chi: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChon(chi); }
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${4 * W} ${4 * H}`}
      className={`la-so la-so-${giaoDien} block h-auto w-full select-none`}
      role="group"
      aria-labelledby={idTieuDe}
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      <title id={idTieuDe}>{t.c("ls.tieu_de", { cua: ten ? t.c("ls.cua", { ten }) : "" })}</title>
      <rect x={0} y={0} width={4 * W} height={4 * H} rx={18} fill="var(--ls-nen)" />

      {/* ---------- Phần giữa: hoa văn bát quái + thông tin ---------- */}
      <g aria-hidden>
        <rect x={W + 6} y={H + 6} width={2 * W - 12} height={2 * H - 12} rx={12} fill="var(--ls-giua)" stroke="var(--ls-vien)" />
        <BatQuai cx={2 * W} cy={2 * H + 18} r={205} />
        <text x={3 * W - 20} y={H + 200} fill="var(--ls-han)" fontSize={30}
          style={{ fontFamily: "var(--font-han), serif", writingMode: "vertical-rl", letterSpacing: "0.3em" }}>紫微斗數</text>
        {/* Tam phương tứ chính */}
        <motion.polygon key={`th-${dangXem}`} points={duongTamHop.map((p) => p.join(",")).join(" ")}
          fill="var(--ls-nhan-nen)" stroke="var(--ls-nhan)" strokeOpacity={0.55} strokeWidth={1.4} strokeLinejoin="round"
          initial={giam ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} />
        <motion.line key={`x-${dangXem}`} x1={x0} y1={y0} x2={xx} y2={yx} stroke="var(--ls-sat)" strokeOpacity={0.6} strokeWidth={1.3}
          strokeDasharray="6 6" initial={giam ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
      </g>
      <ThongTinGiua ls={ls} vanHan={vanHan} ten={ten} gioSinh={gioSinh} tru={tru} cungThan={cungThan} t={t} />

      {/* ---------- 12 cung ---------- */}
      {ls.cung.map((c, i) => {
        const [r, col] = VI_TRI[c.chi] ?? [0, 0];
        const x = col * W;
        const y = r * H;
        const laChon = c.chi === dangXem;
        const laTamPhuong = tp.tam_hop.includes(c.chi);
        const laXung = tp.xung === c.chi;
        const { trai, phai } = dongSaoCot(c, phaiDoSang, t);
        const yChinh = 62;
        // TV-HOA-HAN: hoá của lớp hạn rơi vào cung này → xếp chỗ cho huy hiệu (sau tên sao, hoặc dòng nhỏ ngay dưới).
        const hhCung = hoaHan.filter((b) => b.chi_so === i);
        const hhPhu = hhCung.filter((b) => !b.chinh_tinh);
        let yTiep = yChinh;
        const dongChinh = c.chinh_tinh.map((s) => {
          const d = doSang(s, phaiDoSang, true);
          const tat = t.tat(d);
          const huy = hhCung.filter((b) => b.chinh_tinh && b.sao === s.ten);
          const rongSao = t.ten("sao", s.ten).length * 19 * 0.56 + (tat ? 4 * 14 * 0.56 : 0);
          // Hai huy hiệu (ĐH + Năm) không vừa cạnh tên sao ở cỡ thường → thử cỡ nhỏ trước khi xuống dòng.
          const rongDs = (co: number) => huy.reduce((a, b) => a + rongHuy(b, co, false, t) + 5, 0);
          const coHuy = huy.length && rongSao + 6 + rongDs(CO_HUY) > RONG_GON ? CO_HUY_NHO : CO_HUY;
          const rongHuyDs = rongDs(coHuy);
          const canhNhau = huy.length > 0 && rongSao + 6 + rongHuyDs <= RONG_GON;
          const y0 = yTiep;
          yTiep = y0 + (huy.length && !canhNhau ? 18 + 23 : 25);
          return { s, tat, huy, coHuy: canhNhau ? coHuy : CO_HUY, canhNhau, y: y0, rongSao, rongHuyDs,
            xSao: canhNhau ? W / 2 - (rongSao + 6 + rongHuyDs - 5) / 2 : W / 2 };
        });
        if (!c.chinh_tinh.length) yTiep = yChinh + 25;
        // Huy hiệu hoá theo hạn của phụ tinh: xếp chung hàng khi vừa (mỗi hàng ≤ RONG_GON) — mỗi hàng chỉ đẩy cột phụ tinh 17.
        const hangPhu: HoaHan[][] = [];
        for (const b of hhPhu) {
          const hang = hangPhu[hangPhu.length - 1];
          const rong = (ds: HoaHan[]) => ds.reduce((a, x) => a + rongHuy(x, CO_HUY, true, t) + 5, -5);
          if (hang && rong([...hang, b]) <= RONG_GON) hang.push(b); else hangPhu.push([b]);
        }
        const yPhuHuy = hangPhu.map((_, k) => yTiep - 4 + k * 17);
        const yCot = yTiep + 4 + hangPhu.length * 17;
        const coLuu = lop.luu_nien && vanHan;
        const tenDhMa = lop.dai_han && vanHan ? vanHan.dai_han.ten_cung[i] : null;
        const tenLnMa = lop.luu_nien && vanHan ? vanHan.luu_nien.ten_cung[i] : null;
        // EN-ALL: tên cung Anh dài ("Property Palace") → ở đáy ô bỏ chữ " Palace" (bản Việt không đổi).
        const tenDh = tenDhMa ? tenC(tenDhMa).replace(/ Palace$/, "") : null;
        const tenLn = tenLnMa ? tenC(tenLnMa).replace(/ Palace$/, "") : null;
        const tienDh = t.c("ls.tien_to_dh"), tienLn = t.c("ls.tien_to_ln");
        const tsHien = t.ten("truong_sinh", c.truong_sinh);
        // Đáy ô: "ĐH.<cung>" trái · vòng Trường sinh giữa · "L.<cung>" phải. Ước bề rộng (như vuaO); không vừa một hàng thì
        // Trường sinh dời sang khoảng trống còn lại, vẫn không vừa → lên một dòng riêng ngay trên (sao lưu lên thêm một dòng).
        const rongChu = (t: string, co: number) => t.length * co * 0.6;
        const bienTrai = tenDh ? 16 + rongChu(`${tienDh}${tenDh}`, 11.5) + 8 : 16;
        const bienPhai = tenLn ? W - 16 - rongChu(`${tienLn}${tenLn}`, 11.5) - 8 : W - 16;
        const rongTs = rongChu(tsHien, 14);
        const xTs = W / 2 - rongTs / 2 >= bienTrai && W / 2 + rongTs / 2 <= bienPhai ? W / 2
          : bienPhai - bienTrai >= rongTs ? (bienTrai + bienPhai) / 2 : null;
        const tsRieng = xTs === null;
        const yLuu = H - (tsRieng ? 56 : 40);
        const dayCot = coLuu ? yLuu - 18 : H - (tsRieng ? 56 : 40);
        const toiDa = Math.floor((dayCot - yCot) / DONG) + 1;
        const luuSao = coLuu ? vanHan.luu_nien.sao[i] ?? [] : [];
        const laDh = lop.dai_han && vanHan?.dai_han.chi_so === i;
        // TV-DT: tuổi còn trong đồng hạn → ô của cung đồng hạn mang nhãn "Đồng hạn", không gọi là đại hạn.
        const nhanDh = t.c(vanHan?.dai_han.dong_han ? "ls.dong_han" : "ls.dai_han");
        const nhanLn = t.c("ls.luu_nien"), nhanTh = t.c("ls.tieu_han");
        const laLn = lop.luu_nien && vanHan?.luu_nien.chi_so === i;
        const laTh = lop.luu_nien && vanHan?.tieu_han.chi_so === i;
        // EN-ALL: tên cung Anh dài → đầu ô bỏ chữ " PALACE" và co chữ vừa khoảng giữa nhãn can chi và tuổi (bản Việt như cũ).
        const nhan = [(t.en ? tenC(c.ten).replace(/ Palace$/, "") : tenC(c.ten)).toUpperCase(), c.la_than ? t.c("ls.than") : null].filter(Boolean).join(" · ");
        const chinh = c.chinh_tinh.map((s) => `${t.ten("sao", s.ten)}${doSang(s, phaiDoSang, true) ? ` ${t.ten("do_sang", doSang(s, phaiDoSang, true))}` : ""}${s.tu_hoa ? t.c("ls.aria_hoa", { hoa: t.hoa(s.tu_hoa) }) : ""}`).join(", ");
        return (
          <g key={c.chi} transform={`translate(${x},${y})`} role="button" tabIndex={0}
            aria-pressed={c.chi === chon}
            aria-label={t.c("ls.aria_cung", { cung: tenC(c.ten), than: c.la_than ? t.c("ls.aria_than") : "", can: t.ten("can", c.can), chi: t.ten("chi", c.chi),
              tu: String(c.dai_han.tu_tuoi), den: String(c.dai_han.den_tuoi), chinh: chinh || t.c("ls.vo_chinh_dieu"), han: hhCung.length ? t.c("ls.aria_han", { ds: loiHoaHan(hhCung, t) }) : "" })}
            onClick={() => onChon(c.chi)} onKeyDown={phim(c.chi)}
            onMouseEnter={() => setDi(c.chi)} onMouseLeave={() => setDi(null)}
            onFocus={() => setDi(c.chi)} onBlur={() => setDi(null)}
            className="cursor-pointer outline-none">
            <rect x={4} y={4} width={W - 8} height={H - 8} rx={12}
              fill={c.la_menh ? "var(--ls-menh-nen)" : laTamPhuong || laChon ? "var(--ls-o-sang)" : "var(--ls-o)"}
              stroke={laChon ? "var(--ls-nhan)" : laXung ? "var(--ls-sat)" : laTamPhuong ? "var(--ls-nhan-mo)" : "var(--ls-vien)"}
              strokeWidth={laChon ? 2.6 : laTamPhuong || laXung ? 1.6 : 1}
              strokeDasharray={laXung && !laChon ? "6 5" : undefined} />
            <g className={CHI_TIET}>
            {(laDh || laLn || laTh) && (
              <g>
                {[laDh && nhanDh, laLn && nhanLn, laTh && nhanTh].filter(Boolean).map((n, k, ds) => (
                  <g key={String(n)} transform={`translate(${W / 2 - (ds.length * 74 - 4) / 2 + k * 74},${r === 0 ? 1 : -6})`}
                    data-nhan-han={n === nhanDh ? "dai_han" : n === nhanLn ? "luu_nien" : "tieu_han"}>
                    <rect width={70} height={16} rx={8} fill={n === nhanDh ? "var(--ls-thuy)" : n === nhanLn ? "var(--ls-nhan)" : "var(--ls-mo)"} />
                    <text x={35} y={11.8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ls-nen)" {...(t.en ? vuaO(String(n).toUpperCase(), 10.5, 62) : {})}>{String(n).toUpperCase()}</text>
                  </g>
                ))}
              </g>
            )}
            {/* Đầu ô: can chi · tên cung · tuổi đại hạn */}
            <text x={16} y={30} fontSize={13} fill="var(--ls-mo)">{/* Bản Anh: 3 chữ đầu của can (Jia/Ji, Geng/Gui không trùng) + chi gọn ("You", bỏ chú giải trong ngoặc). */}
              {t.en ? `${t.ten("can", c.can).slice(0, 3)}.${tenGon(t.ten("chi", c.chi))}` : `${c.can.charAt(0)}.${c.chi}`}</text>
            <text x={W / 2} y={30} textAnchor="middle" fontSize={c.la_than ? 13.5 : 15} fontWeight={700} letterSpacing="0.04em"
              fill={c.la_menh ? "var(--ls-nhan)" : "var(--ls-chu)"} {...(t.en ? vuaO(nhan, c.la_than ? 13.5 : 15, 100) : {})}>{nhan}</text>
            <text x={W - 16} y={30} textAnchor="end" fontSize={15} fontWeight={600} fill="var(--ls-chu)">{c.dai_han.tu_tuoi}</text>
            {/* Chính tinh */}
            {c.chinh_tinh.length ? dongChinh.map(({ s, tat, huy, coHuy, canhNhau, y: yS, xSao, rongSao, rongHuyDs }) => (
              <g key={s.ten}>
                <text x={xSao} y={yS} textAnchor={canhNhau ? "start" : "middle"} fontSize={19} fontWeight={650}
                  fill={MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"]}>
                  {t.ten("sao", s.ten)}
                  {tat ? <tspan fontSize={14} fontWeight={500} fill="var(--ls-mo)"> ({tat})</tspan> : null}
                </text>
                {huy.length > 0 && (canhNhau
                  ? <HangHuy ds={huy} cx={xSao + rongSao + 6 + (rongHuyDs - 5) / 2} y={yS - 2} co={coHuy} t={t} />
                  : <HangHuy ds={huy} cx={W / 2} y={yS + 18} t={t} />)}
              </g>
            )) : <text x={W / 2} y={yChinh} textAnchor="middle" fontSize={14} fontStyle="italic" fill="var(--ls-mo)">{t.c("ls.vo_chinh_dieu")}</text>}
            {hangPhu.map((ds, k) => <HangHuy key={ds.map((b) => `${b.lop}${b.hoa}`).join()} ds={ds} cx={W / 2} y={yPhuHuy[k]!} coSao t={t} />)}
            {/* Hai cột phụ tinh */}
            {catDong(trai, toiDa, t).map((d, k) => (
              <text key={`t${k}`} x={16} y={yCot + k * DONG} fontSize={13} fill={d.mau} fontWeight={d.dam ? 600 : 400} fontStyle={d.nghieng ? "italic" : undefined}>{d.ten}</text>
            ))}
            {catDong(phai, toiDa, t).map((d, k) => (
              <text key={`p${k}`} x={W - 16} y={yCot + k * DONG} textAnchor="end" fontSize={13} fill={d.mau} fontWeight={d.dam ? 600 : 400} fontStyle={d.nghieng ? "italic" : undefined}>{d.ten}</text>
            ))}
            {/* Sao lưu niên */}
            {luuSao.length > 0 && (
              <text x={W / 2} y={yLuu} textAnchor="middle" fontSize={12} fontStyle="italic" fill="var(--ls-luu)">
                {luuSao.slice(0, 4).map((x) => tenGon(t.ten("sao", x))).join(" · ")}
              </text>
            )}
            {/* Đáy ô: tên cung đại hạn · vòng Trường sinh · tên cung lưu niên */}
            {(
              <>
                {tenDh && <text x={16} y={H - 20} fontSize={11.5} fontWeight={600} fill="var(--ls-thuy)">{tienDh}{tenDh}</text>}
                <text x={xTs ?? W / 2} y={tsRieng ? H - 37 : H - 20} textAnchor="middle" fontSize={14} fontWeight={600}
                  fill={SINH_TOT.has(c.truong_sinh) ? "var(--ls-moc)" : SINH_XAU.has(c.truong_sinh) ? "var(--ls-sat)" : "var(--ls-tho)"}>
                  {tsHien}
                </text>
                {tenLn && <text x={W - 16} y={H - 20} textAnchor="end" fontSize={11.5} fontWeight={600} fill="var(--ls-nhan)">{tienLn}{tenLn}</text>}
              </>
            )}
            </g>
            <OGon c={c} phai={phaiDoSang} t={t} hh={hhCung.filter((b) => b.chinh_tinh)} han={([[laDh, nhanDh, "dh"], [laLn, nhanLn, "ln"], [laTh, nhanTh, "th"]] as const).filter(([co]) => co).map(([, n, ma]) => ({ n, ma }))} />
          </g>
        );
      })}

      {/* Tuần / Triệt đóng giữa hai cung (lối Việt) */}
      {ls.tuan_triet && <g className={CHI_TIET}><TuanTriet tt={ls.tuan_triet} chiSo={chiSo} t={t} /></g>}
    </svg>
  );
});

/** Lớp gọn của một ô (chỉ hiện ở điện thoại khi lá số đang vừa khung — xem CHI_TIET / GON). */
function OGon({ c, phai, han, hh, t }: { c: CungT; phai: PhaiDoSang; han: { n: string; ma: "dh" | "ln" | "th" }[]; hh: HoaHan[]; t: ChuLS }) {
  const ten = `${t.ten("cung", c.ten).replace(/ Palace$/, "")}${c.la_than ? t.c("ls.than_gon") : ""}`;
  // TV-HOA-HAN: vừa khung chỉ hiện huy hiệu của CHÍNH TINH — một hàng ngay dưới tên sao.
  let yTiep = 96;
  const dong = c.chinh_tinh.map((s) => {
    const y = yTiep;
    const huy = hh.filter((b) => b.sao === s.ten);
    yTiep += huy.length ? 31 + 36 : 36;
    return { s, y, huy };
  });
  return (
    <g className={GON} display="none" aria-hidden>
      <text x={W / 2} y={40} textAnchor="middle" fontSize={CO_GON} fontWeight={700}
        fill={c.la_menh ? "var(--ls-nhan)" : "var(--ls-chu)"} {...vuaO(ten, CO_GON)}>{ten}</text>
      {c.chinh_tinh.length ? dong.map(({ s, y, huy }) => {
        const d = doSang(s, phai, true);
        const tat = t.tat(d), tenS = t.ten("sao", s.ten);
        const chu = `${tenS}${tat ? ` (${tat})` : ""}`;
        return (
          <g key={s.ten}>
            <text x={W / 2} y={y} textAnchor="middle" fontSize={CO_GON + 1} fontWeight={650}
              fill={MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"]} {...vuaO(chu, CO_GON + 1)}>
              {tenS}{tat && <tspan fontWeight={500} fill="var(--ls-mo)"> ({tat})</tspan>}
            </text>
            {huy.length > 0 && <HuyGon ds={huy} y={y + 31} t={t} />}
          </g>
        );
      }) : <text x={W / 2} y={96} textAnchor="middle" fontSize={CO_GON} fontStyle="italic" fill="var(--ls-mo)">{t.c("ls.vo_chinh_dieu")}</text>}
      {han.map(({ n, ma }, k) => (
        <text key={ma} x={W / 2} y={H - 22 - (han.length - 1 - k) * 32} textAnchor="middle" fontSize={CO_GON} fontWeight={700}
          fill={ma === "dh" ? "var(--ls-thuy)" : ma === "ln" ? "var(--ls-nhan)" : "var(--ls-mo)"}>{n}</text>
      ))}
    </g>
  );
}

/** Huy hiệu hoá theo hạn ở lớp gọn: MỘT dòng chữ cỡ như lớp gọn (≥ 9px ở 375px — e2e di-dong), dài thì co ngang vừa ô
 *  như dòng chính tinh (vuaO); khung viền đứt bao cả dòng. */
function HuyGon({ ds, y, t }: { ds: HoaHan[]; y: number; t: ChuLS }) {
  const chu = ds.map((b) => `${nhanLop(b, t)} ${t.hoa(TEN_HOA_MA[b.hoa])}`).join(" · ");
  const vua = vuaO(chu, CO_GON, RONG_GON - 20);
  const rong = (vua.textLength ?? chu.length * CO_GON * 0.56) + 20;
  return (
    <g data-hoa-han-gon={ds.map((b) => `${b.lop}-${b.hoa}`).join(" ")}>
      <rect x={W / 2 - rong / 2} y={y - CO_GON * 0.95} width={rong} height={CO_GON * 1.3} rx={CO_GON * 0.65} fill="var(--ls-o)"
        stroke={ds.length === 1 ? MAU_HOA_HAN[ds[0]!.hoa] : "var(--ls-mo)"} strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={W / 2} y={y} textAnchor="middle" fontSize={CO_GON} fontWeight={700} {...vua}>
        {ds.map((b, k) => (
          <tspan key={`${b.lop}${b.hoa}`}>
            {k > 0 && <tspan fill="var(--ls-mo)"> · </tspan>}
            <tspan fill="var(--ls-mo)" fontWeight={600}>{nhanLop(b, t)} </tspan>
            <tspan fill={MAU_HOA_HAN[b.hoa]}>{t.hoa(TEN_HOA_MA[b.hoa])}</tspan>
          </tspan>
        ))}
      </text>
    </g>
  );
}

// Tuần/Triệt đóng trên ĐƯỜNG RANH hai cung (lối Việt). Nhãn đặt ở MÉP NGOÀI của đường ranh — hai cung cạnh nhau theo hàng
// (Ngọ–Mùi trên, Tý–Sửu dưới): sát mép trên / dưới lá số; theo cột (Dần–Mão, Thìn–Tỵ trái; Thân–Dậu, Tuất–Hợi phải): sát
// mép trái / phải. Đặt giữa đường ranh (cách cũ) đè lên dòng phụ tinh, nhãn ĐẠI HẠN/LƯU NIÊN hoặc dòng đáy ô.
const TT_CAO = 15;
function TuanTriet({ tt, chiSo, t }: { tt: { tuan: string[]; triet: string[] }; chiSo: (c: string) => number; t: ChuLS }) {
  const trung = tt.tuan.join() === tt.triet.join();
  const muc = trung ? [{ nhan: t.c("ls.tuan_triet"), cap: tt.tuan }] : [{ nhan: t.c("ls.tuan"), cap: tt.tuan }, { nhan: t.c("ls.triet"), cap: tt.triet }];
  return (
    <g aria-hidden>
      {muc.map(({ nhan, cap }) => {
        const [a, b] = cap;
        if (!a || !b || chiSo(a) < 0 || !VI_TRI[a] || !VI_TRI[b]) return null;
        const [ra, ca] = VI_TRI[a]!;
        const [rb, cb] = VI_TRI[b]!;
        // "Tuần · Triệt" (hai vòng trùng cặp cung) dùng chữ nhỏ hơn để không chạm nhãn ĐẠI HẠN/LƯU NIÊN của ô dưới.
        const co = trung ? 10.5 : 11.5;
        const rong = nhan.length * (trung ? 6 : 7.2) + (trung ? 12 : 16);
        let x: number, y: number;
        if (ra === rb) {                       // cùng hàng → đường ranh dọc
          x = ((ca + cb) / 2 + 0.5) * W;
          y = ra === 0 ? TT_CAO / 2 : 4 * H - TT_CAO / 2 + 0.5;   // nằm trên dòng can chi / dưới dòng đáy ô
        } else {                               // cùng cột → đường ranh ngang
          y = ((ra + rb) / 2 + 0.5) * H;
          x = ca === 0 ? rong / 2 + 1 : 4 * W - rong / 2 - 1;
        }
        return (
          <g key={nhan} transform={`translate(${x},${y})`} data-tuan-triet={nhan}>
            <rect x={-rong / 2} y={-TT_CAO / 2} width={rong} height={TT_CAO} rx={5} fill="var(--ls-tt-nen)" />
            <text y={co * 0.36} textAnchor="middle" fontSize={co} fontWeight={700} letterSpacing={trung ? "0.02em" : "0.05em"} fill="var(--ls-tt-chu)">{nhan}</text>
          </g>
        );
      })}
    </g>
  );
}

function ThongTinGiua({ ls, vanHan, ten, gioSinh, tru, cungThan, t }: {
  ls: LaSoOutputT; vanHan?: VanHanOutputT | null; ten?: string | null; gioSinh?: string | null; tru: string[]; cungThan?: string; t: ChuLS;
}) {
  const [y, m, d] = ls.duong_lich_goc.split("-");
  const al = ls.am_lich;
  // [khoá chữ nhãn, giá trị] — dòng "Bản mệnh" và "Cục" in đậm (so theo khoá, không theo chữ).
  const dong: [string, string][] = [
    ["ls.duong_lich", `${d}/${m}/${y}${gioSinh ? ` · ${gioSinh}` : ""}`],
    ["ls.am_lich", `${al.ngay}/${al.thang}${al.nhuan ? t.c("ls.nhuan") : ""}/${al.nam} · ${ls.gio}`],
  ];
  if (ls.am_duong) dong.push(["ls.am_duong", t.c("ls.am_duong_ly", { nhan: ls.am_duong.nhan, ly: ls.am_duong.ly })]);
  if (ls.menh_nap_am) dong.push(["ls.ban_menh", t.ten("nap_am", ls.menh_nap_am.ten)]);
  dong.push(["ls.cuc", `${t.ten("cuc", ls.ngu_hanh_cuc)}${ls.menh_cuc ? ` · ${ls.menh_cuc}` : ""}`]);
  dong.push(["ls.menh_chu", t.c("ls.than_chu", { menh: t.ten("sao", ls.menh_chu), than: t.ten("sao", ls.than_chu) })]);
  if (cungThan) dong.push(["ls.than_cu", t.ten("cung", cungThan)]);
  if (vanHan) dong.push(["ls.nam_xem", t.c("ls.nam_xem_chu", { nam: String(vanHan.nam_xem), can_chi: vanHan.can_chi_nam_xem, tuoi: String(vanHan.tuoi_mu) })]);
  const nhanTru = ["ls.tru_nam", "ls.tru_thang", "ls.tru_ngay", "ls.tru_gio"].map((k) => t.c(k));
  const x0 = W + 40;
  return (
    <g aria-hidden>
      <text x={2 * W} y={H + 58} textAnchor="middle" fontSize={13} letterSpacing="0.3em" fill="var(--ls-mo)" className={CHI_TIET}>{t.c("ls.nhan_giua")}</text>
      <text x={2 * W} y={H + 96} textAnchor="middle" fontSize={ten && ten.length > 22 ? 24 : 30} fill="var(--ls-nhan)"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{ten || `${t.ten("can", ls.can_chi_nam.can)} ${t.ten("chi", ls.can_chi_nam.chi)}`}</text>
      {/* Lớp gọn (điện thoại, vừa khung): tứ trụ 2×2 chữ lớn, bỏ các dòng nhỏ */}
      {tru.length === 4 && (
        <g className={GON} display="none">
          {tru.map((t, k) => {
            const chu = `${nhanTru[k]} ${t}`;
            return <text key={k} x={W + 125 + (k % 2) * 250} y={H + 170 + Math.floor(k / 2) * 46} textAnchor="middle"
              fontSize={CO_GON} fontWeight={600} fill="var(--ls-chu)" {...vuaO(chu, CO_GON)}>{chu}</text>;
          })}
        </g>
      )}
      <g className={CHI_TIET}>
      {/* Tứ trụ năm-tháng-ngày-giờ */}
      {tru.length === 4 && tru.map((t, k) => (
        <g key={k} transform={`translate(${W + 68 + k * 112},${H + 136})`}>
          <text x={0} textAnchor="middle" fontSize={11.5} letterSpacing="0.12em" fill="var(--ls-mo)">{nhanTru[k]!.toUpperCase()}</text>
          <text x={0} y={26} textAnchor="middle" fontSize={18} fontWeight={600} fill="var(--ls-chu)">{t}</text>
        </g>
      ))}
      <line x1={x0} x2={3 * W - 40} y1={H + 184} y2={H + 184} stroke="var(--ls-vien)" />
      {dong.map(([k, v], i) => (
        <g key={k} transform={`translate(${x0},${H + 216 + i * 33})`}>
          <text fontSize={14} fill="var(--ls-mo)">{t.c(k)}</text>
          <text x={118} fontSize={15.5} fontWeight={k === "ls.ban_menh" || k === "ls.cuc" ? 600 : 500} fill="var(--ls-chu)" {...(t.en ? vuaO(v, 15.5, 2 * W - 80 - 118) : {})}>{v}</text>
        </g>
      ))}
      {/* EN-ALL: chú giải chữ viết tắt độ sáng (bản Anh dùng chữ đầu pinyin, người đọc chưa quen) — cả hai giao diện. */}
      {t.en && <g data-testid="chu-giai-do-sang" fontSize={12.5} fill="var(--ls-mo)" textAnchor="middle">
        <text x={2 * W} y={3 * H - 40} {...vuaO(t.c("ls.chu_giai_ds_1"), 12.5, 2 * W - 40)}>{t.c("ls.chu_giai_ds_1")}</text>
        <text x={2 * W} y={3 * H - 22} {...vuaO(t.c("ls.chu_giai_ds_2"), 12.5, 2 * W - 40)}>{t.c("ls.chu_giai_ds_2")}</text>
      </g>}
      </g>
    </g>
  );
}

// Hoa văn nền: hình bát giác + 8 quẻ Tiên thiên (Càn trên cùng), rất mờ.
const QUE_TIEN_THIEN = [
  [1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
];
function BatQuai({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const goc = (k: number) => (k * Math.PI) / 4 - Math.PI / 2;
  const dinh = Array.from({ length: 8 }, (_, k) => [cx + r * Math.cos(goc(k) + Math.PI / 8), cy + r * Math.sin(goc(k) + Math.PI / 8)]);
  return (
    <g opacity={0.5} stroke="var(--ls-hoa-van)" fill="none">
      <polygon points={dinh.map((p) => p.join(",")).join(" ")} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={r * 0.62} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.3} strokeWidth={0.8} strokeDasharray="2 5" />
      {QUE_TIEN_THIEN.map((hao, k) => {
        const a = goc(k);
        const rr = r * 0.8;
        const px = cx + rr * Math.cos(a);
        const py = cy + rr * Math.sin(a);
        const deg = (a * 180) / Math.PI + 90;
        return (
          <g key={k} transform={`translate(${px},${py}) rotate(${deg})`} strokeWidth={5} strokeLinecap="butt">
            {hao.map((h, j) => (h
              ? <line key={j} x1={-22} x2={22} y1={(j - 1) * 11} y2={(j - 1) * 11} />
              : <g key={j}><line x1={-22} x2={-5} y1={(j - 1) * 11} y2={(j - 1) * 11} /><line x1={5} x2={22} y1={(j - 1) * 11} y2={(j - 1) * 11} /></g>))}
          </g>
        );
      })}
    </g>
  );
}
