"use client";
// VZ-2 — Lá số Tử vi vẽ bằng SVG theo bố cục giấy truyền thống (vòng 12 cung 4×4, giữa là thông tin).
// Chỉ VẼ dữ liệu engine: sao, độ sáng, tứ hoá, vòng Trường sinh/Bác sĩ/Thái tuế, Tuần/Triệt, lớp vận hạn.
// Tô màu theo ngũ hành của sao; bấm một cung → nổi tam phương tứ chính (tam hợp + xung chiếu).
import { forwardRef, useId, useMemo, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import {
  AN_TAP_DIEU, DO_SANG_TAT, HANH_SAO, NEO, VI_TRI, nhomSao, tachTuTru, tamPhuong, type NhomSao,
} from "@/lib/tuvi-hien-thi";
import type { GiaoDien } from "@/lib/giao-dien-la-so";

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

function dongSaoCot(c: CungT, phai: PhaiDoSang): { trai: DongSao[]; phai: DongSao[] } {
  const trai: DongSao[] = [];
  const phaiCot: DongSao[] = [];
  // Tứ hoá sinh niên (của chính tinh lẫn phụ tinh) đứng đầu cột: Lộc/Quyền/Khoa trái, Kỵ phải.
  for (const s of [...c.chinh_tinh, ...c.phu_tinh]) {
    if (!s.tu_hoa) continue;
    const d = { ten: `Hoá ${s.tu_hoa}`, mau: MAU_HOA[s.tu_hoa] ?? "var(--ls-chu)", dam: true };
    (s.tu_hoa === "Kỵ" ? phaiCot : trai).push(d);
  }
  for (const s of c.phu_tinh) {
    const g = nhomSao(s.ten, s.loai);
    const ds = doSang(s, phai, false);
    const ten = ds && DO_SANG_TAT[ds] ? `${s.ten} (${DO_SANG_TAT[ds]})` : s.ten;
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
    const hien = t === c.tue_tien ? tenThaiTue(c, phai) : t;     // TV-LICH: tên vòng Thái Tuế theo phái
    const d = { ten: ds && DO_SANG_TAT[ds] ? `${hien} (${DO_SANG_TAT[ds]})` : hien, mau: MAU_NHOM[g] };
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

function catDong(ds: DongSao[], toiDa: number): DongSao[] {
  if (ds.length <= toiDa) return ds;
  return [...ds.slice(0, toiDa - 1), { ten: `+${ds.length - toiDa + 1} sao`, mau: "var(--ls-mo)", nghieng: true }];
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
  const giam = useReducedMotion();
  const idTieuDe = useId();
  const dangXem = di ?? chon;
  const tp = useMemo(() => tamPhuong(dangXem), [dangXem]);
  const chiSo = (chi: string) => ls.cung.findIndex((c) => c.chi === chi);
  const tru = tachTuTru(ls.tu_tru);
  const cungThan = ls.cung.find((c) => c.la_than)?.ten;

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
      <title id={idTieuDe}>{`Lá số Tử vi ${ten ? `của ${ten}` : ""} — 12 cung`}</title>
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
      <ThongTinGiua ls={ls} vanHan={vanHan} ten={ten} gioSinh={gioSinh} tru={tru} cungThan={cungThan} />

      {/* ---------- 12 cung ---------- */}
      {ls.cung.map((c, i) => {
        const [r, col] = VI_TRI[c.chi] ?? [0, 0];
        const x = col * W;
        const y = r * H;
        const laChon = c.chi === dangXem;
        const laTamPhuong = tp.tam_hop.includes(c.chi);
        const laXung = tp.xung === c.chi;
        const { trai, phai } = dongSaoCot(c, phaiDoSang);
        const yChinh = 62;
        const soChinh = Math.max(1, c.chinh_tinh.length);
        const yCot = yChinh + soChinh * 25 + 4;
        const coLuu = lop.luu_nien && vanHan;
        const toiDa = Math.floor((H - (coLuu ? 58 : 40) - yCot) / DONG) + 1;
        const luuSao = coLuu ? vanHan.luu_nien.sao[i] ?? [] : [];
        const tenDh = lop.dai_han && vanHan ? vanHan.dai_han.ten_cung[i] : null;
        const tenLn = lop.luu_nien && vanHan ? vanHan.luu_nien.ten_cung[i] : null;
        const laDh = lop.dai_han && vanHan?.dai_han.chi_so === i;
        const laLn = lop.luu_nien && vanHan?.luu_nien.chi_so === i;
        const laTh = lop.luu_nien && vanHan?.tieu_han.chi_so === i;
        const nhan = [c.ten.toUpperCase(), c.la_than ? "THÂN" : null].filter(Boolean).join(" · ");
        const chinh = c.chinh_tinh.map((s) => `${s.ten}${doSang(s, phaiDoSang, true) ? ` ${doSang(s, phaiDoSang, true)}` : ""}${s.tu_hoa ? ` hoá ${s.tu_hoa}` : ""}`).join(", ");
        return (
          <g key={c.chi} transform={`translate(${x},${y})`} role="button" tabIndex={0}
            aria-pressed={c.chi === chon}
            aria-label={`Cung ${c.ten}${c.la_than ? " (Thân cư)" : ""}, ${c.can} ${c.chi}, đại hạn ${c.dai_han.tu_tuoi}–${c.dai_han.den_tuoi}: ${chinh || "vô chính diệu"}`}
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
                {[laDh && "Đại hạn", laLn && "Lưu niên", laTh && "Tiểu hạn"].filter(Boolean).map((t, k, ds) => (
                  <g key={String(t)} transform={`translate(${W / 2 - (ds.length * 74 - 4) / 2 + k * 74},${r === 0 ? 1 : -6})`}>
                    <rect width={70} height={16} rx={8} fill={t === "Đại hạn" ? "var(--ls-thuy)" : t === "Lưu niên" ? "var(--ls-nhan)" : "var(--ls-mo)"} />
                    <text x={35} y={11.8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ls-nen)">{String(t).toUpperCase()}</text>
                  </g>
                ))}
              </g>
            )}
            {/* Đầu ô: can chi · tên cung · tuổi đại hạn */}
            <text x={16} y={30} fontSize={13} fill="var(--ls-mo)">{c.can.charAt(0)}.{c.chi}</text>
            <text x={W / 2} y={30} textAnchor="middle" fontSize={c.la_than ? 13.5 : 15} fontWeight={700} letterSpacing="0.04em"
              fill={c.la_menh ? "var(--ls-nhan)" : "var(--ls-chu)"}>{nhan}</text>
            <text x={W - 16} y={30} textAnchor="end" fontSize={15} fontWeight={600} fill="var(--ls-chu)">{c.dai_han.tu_tuoi}</text>
            {/* Chính tinh */}
            {c.chinh_tinh.length ? c.chinh_tinh.map((s, k) => (
              <text key={s.ten} x={W / 2} y={yChinh + k * 25} textAnchor="middle" fontSize={19} fontWeight={650}
                fill={MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"]}>
                {s.ten}
                {(() => { const d = doSang(s, phaiDoSang, true); return d && DO_SANG_TAT[d] ? <tspan fontSize={14} fontWeight={500} fill="var(--ls-mo)"> ({DO_SANG_TAT[d]})</tspan> : null; })()}
              </text>
            )) : <text x={W / 2} y={yChinh} textAnchor="middle" fontSize={14} fontStyle="italic" fill="var(--ls-mo)">vô chính diệu</text>}
            {/* Hai cột phụ tinh */}
            {catDong(trai, toiDa).map((d, k) => (
              <text key={`t${k}`} x={16} y={yCot + k * DONG} fontSize={13} fill={d.mau} fontWeight={d.dam ? 600 : 400} fontStyle={d.nghieng ? "italic" : undefined}>{d.ten}</text>
            ))}
            {catDong(phai, toiDa).map((d, k) => (
              <text key={`p${k}`} x={W - 16} y={yCot + k * DONG} textAnchor="end" fontSize={13} fill={d.mau} fontWeight={d.dam ? 600 : 400} fontStyle={d.nghieng ? "italic" : undefined}>{d.ten}</text>
            ))}
            {/* Sao lưu niên */}
            {luuSao.length > 0 && (
              <text x={W / 2} y={H - 40} textAnchor="middle" fontSize={12} fontStyle="italic" fill="var(--ls-luu)">
                {luuSao.slice(0, 4).join(" · ")}
              </text>
            )}
            {/* Đáy ô: tên cung đại hạn · vòng Trường sinh · tên cung lưu niên */}
            {(
              <>
                {tenDh && <text x={16} y={H - 20} fontSize={11.5} fontWeight={600} fill="var(--ls-thuy)">ĐH.{tenDh}</text>}
                <text x={W / 2} y={H - 20} textAnchor="middle" fontSize={14} fontWeight={600}
                  fill={SINH_TOT.has(c.truong_sinh) ? "var(--ls-moc)" : SINH_XAU.has(c.truong_sinh) ? "var(--ls-sat)" : "var(--ls-tho)"}>
                  {c.truong_sinh}
                </text>
                {tenLn && <text x={W - 16} y={H - 20} textAnchor="end" fontSize={11.5} fontWeight={600} fill="var(--ls-nhan)">L.{tenLn}</text>}
              </>
            )}
            </g>
            <OGon c={c} phai={phaiDoSang} han={[laDh && "Đại hạn", laLn && "Lưu niên", laTh && "Tiểu hạn"].filter((t): t is string => Boolean(t))} />
          </g>
        );
      })}

      {/* Tuần / Triệt đóng giữa hai cung (lối Việt) */}
      {ls.tuan_triet && <g className={CHI_TIET}><TuanTriet tt={ls.tuan_triet} chiSo={chiSo} /></g>}
    </svg>
  );
});

/** Lớp gọn của một ô (chỉ hiện ở điện thoại khi lá số đang vừa khung — xem CHI_TIET / GON). */
function OGon({ c, phai, han }: { c: CungT; phai: PhaiDoSang; han: string[] }) {
  const ten = `${c.ten}${c.la_than ? " · Thân" : ""}`;
  return (
    <g className={GON} display="none" aria-hidden>
      <text x={W / 2} y={40} textAnchor="middle" fontSize={CO_GON} fontWeight={700}
        fill={c.la_menh ? "var(--ls-nhan)" : "var(--ls-chu)"} {...vuaO(ten, CO_GON)}>{ten}</text>
      {c.chinh_tinh.length ? c.chinh_tinh.map((s, k) => {
        const d = doSang(s, phai, true);
        const tat = d ? DO_SANG_TAT[d] : undefined;
        const chu = `${s.ten}${tat ? ` (${tat})` : ""}`;
        return (
          <text key={s.ten} x={W / 2} y={96 + k * 36} textAnchor="middle" fontSize={CO_GON + 1} fontWeight={650}
            fill={MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"]} {...vuaO(chu, CO_GON + 1)}>
            {s.ten}{tat && <tspan fontWeight={500} fill="var(--ls-mo)"> ({tat})</tspan>}
          </text>
        );
      }) : <text x={W / 2} y={96} textAnchor="middle" fontSize={CO_GON} fontStyle="italic" fill="var(--ls-mo)">vô chính diệu</text>}
      {han.map((t, k) => (
        <text key={t} x={W / 2} y={H - 22 - (han.length - 1 - k) * 32} textAnchor="middle" fontSize={CO_GON} fontWeight={700}
          fill={t === "Đại hạn" ? "var(--ls-thuy)" : t === "Lưu niên" ? "var(--ls-nhan)" : "var(--ls-mo)"}>{t}</text>
      ))}
    </g>
  );
}

function TuanTriet({ tt, chiSo }: { tt: { tuan: string[]; triet: string[] }; chiSo: (c: string) => number }) {
  const giua = (cap: string[]): [number, number] | null => {
    const [a, b] = cap;
    if (!a || !b || chiSo(a) < 0) return null;
    const [ra, ca] = VI_TRI[a]!;
    const [rb, cb] = VI_TRI[b]!;
    return [((ca + cb) / 2 + 0.5) * W, ((ra + rb) / 2 + 0.5) * H];
  };
  const trung = tt.tuan.join() === tt.triet.join();
  const muc = trung
    ? [{ nhan: "Tuần · Triệt", p: giua(tt.tuan) }]
    : [{ nhan: "Tuần", p: giua(tt.tuan) }, { nhan: "Triệt", p: giua(tt.triet) }];
  return (
    <g aria-hidden>
      {muc.map(({ nhan, p }) => p && (
        <g key={nhan} transform={`translate(${p[0]},${p[1]})`}>
          <rect x={-(nhan.length * 4.6 + 14)} y={-12} width={nhan.length * 9.2 + 28} height={24} rx={6} fill="var(--ls-tt-nen)" />
          <text y={5} textAnchor="middle" fontSize={13} fontWeight={700} letterSpacing="0.05em" fill="var(--ls-tt-chu)">{nhan}</text>
        </g>
      ))}
    </g>
  );
}

function ThongTinGiua({ ls, vanHan, ten, gioSinh, tru, cungThan }: {
  ls: LaSoOutputT; vanHan?: VanHanOutputT | null; ten?: string | null; gioSinh?: string | null; tru: string[]; cungThan?: string;
}) {
  const [y, m, d] = ls.duong_lich_goc.split("-");
  const al = ls.am_lich;
  const dong: [string, string][] = [
    ["Dương lịch", `${d}/${m}/${y}${gioSinh ? ` · ${gioSinh}` : ""}`],
    ["Âm lịch", `${al.ngay}/${al.thang}${al.nhuan ? " (nhuận)" : ""}/${al.nam} · ${ls.gio}`],
  ];
  if (ls.am_duong) dong.push(["Âm dương", `${ls.am_duong.nhan} · âm dương ${ls.am_duong.ly} lý`]);
  if (ls.menh_nap_am) dong.push(["Bản mệnh", ls.menh_nap_am.ten]);
  dong.push(["Cục", `${ls.ngu_hanh_cuc}${ls.menh_cuc ? ` · ${ls.menh_cuc}` : ""}`]);
  dong.push(["Mệnh chủ", `${ls.menh_chu} · Thân chủ ${ls.than_chu}`]);
  if (cungThan) dong.push(["Thân cư", cungThan]);
  if (vanHan) dong.push(["Năm xem", `${vanHan.nam_xem} ${vanHan.can_chi_nam_xem} · ${vanHan.tuoi_mu} tuổi`]);
  const nhanTru = ["Năm", "Tháng", "Ngày", "Giờ"];
  const x0 = W + 40;
  return (
    <g aria-hidden>
      <text x={2 * W} y={H + 58} textAnchor="middle" fontSize={13} letterSpacing="0.3em" fill="var(--ls-mo)" className={CHI_TIET}>LÁ SỐ TỬ VI</text>
      <text x={2 * W} y={H + 96} textAnchor="middle" fontSize={ten && ten.length > 22 ? 24 : 30} fill="var(--ls-nhan)"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{ten || `${ls.can_chi_nam.can} ${ls.can_chi_nam.chi}`}</text>
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
          <text fontSize={14} fill="var(--ls-mo)">{k}</text>
          <text x={118} fontSize={15.5} fontWeight={k === "Bản mệnh" || k === "Cục" ? 600 : 500} fill="var(--ls-chu)">{v}</text>
        </g>
      ))}
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
