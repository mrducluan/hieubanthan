// MH-1 — hình minh hoạ SVG cho trang kiến thức. Dữ liệu (`minh_hoa`) do engine quyết định (quẻ nào 6 hào gì, cung
// thứ mấy, thập thần quan hệ gì với nhật chủ…); ở đây CHỈ VẼ — không tự suy ra kiến thức. SVG nội dòng: nhẹ, nét
// ở mọi kích thước, không tải ảnh ngoài (hợp CSP), có <title> + aria-label cho trình đọc màn hình và máy tìm kiếm.
import type { ReactNode } from "react";
import { duongQr, maHoaQr, type MaQr } from "@/lib/qr";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";

export type MinhHoaDuLieu =
  | { kieu: "so"; so: number; so_cai: boolean; so_goc: number }
  | { kieu: "que"; so: number; hao: number[] }
  | { kieu: "cap_so"; a: number; b: number }
  | { kieu: "sao"; ten: string; ten_han: string; ngu_hanh: string }
  | { kieu: "cung"; chi_so: number; vong: string[] }
  | { kieu: "sao_cung"; ten: string; ten_han: string; ngu_hanh: string; chi_so: number; vong: string[] }
  | { kieu: "hoa_cung"; hoa: string; chi_so: number; vong: string[] }
  | { kieu: "menh"; hanh: string; nap_am: string; han: string; can_chi: string }
  | { kieu: "thap_than"; ten: string; quan_he: "dong_hanh" | "ta_sinh" | "ta_khac" | "khac_ta" | "sinh_ta"; cung_am_duong: boolean }
  | { kieu: "nhat_chu"; can: string; hanh: string; duong: boolean }
  | { kieu: "tiet_khi"; kinh_do: number; ten: string; tiet: boolean }
  | { kieu: "dau_hieu"; nhom: "ngoai_canh" | "hinh_nha" | "trong_nha"; phong: string[]; veto: boolean; tot: boolean; ten: string };

// Màu ngũ hành theo token giao diện (KB ghi cả "Hoả/Hỏa", "Thuỷ/Thủy").
// Lớp Tailwind viết đủ (không ghép chuỗi) để trình biên dịch CSS thấy được.
const MAU_HANH: Record<string, { nen: string; vien: string }> = {
  "Kim": { nen: "fill-fg/15", vien: "stroke-fg" }, "Mộc": { nen: "fill-jade/20", vien: "stroke-jade" },
  "Thủy": { nen: "fill-moon/20", vien: "stroke-moon" }, "Thuỷ": { nen: "fill-moon/20", vien: "stroke-moon" },
  "Hỏa": { nen: "fill-cinnabar/20", vien: "stroke-cinnabar" }, "Hoả": { nen: "fill-cinnabar/20", vien: "stroke-cinnabar" },
  "Thổ": { nen: "fill-gold/20", vien: "stroke-gold" },
};
const mauHanh = (h: string) => MAU_HANH[h.split("/")[0]!.trim()] ?? { nen: "fill-gold/20", vien: "stroke-gold" };

function Khung({ nhan, children, rong = 320, cao = 240, sang = false }: { nhan: string; children: ReactNode; rong?: number; cao?: number; sang?: boolean }) {
  // `sang` (Y5, chủ dự án 2026-10-26: "hình minh hoạ nền sáng lên"): nền giấy sáng như ảnh blog (.anh-sang), không sao lấp lánh.
  // Khung chỉ vẽ hình + chú thích; <figure> và dải link + QR do MinhHoa bọc ngoài (theo `kieu`).
  return (
    <>
      <svg viewBox={`0 0 ${rong} ${cao}`} role="img" aria-label={nhan} className="mx-auto block h-auto w-full max-w-md">
        <title>{nhan}</title>
        {!sang && <><Sao x={24} y={22} r={1.6} /><Sao x={rong - 30} y={30} r={1.2} /><Sao x={rong - 52} y={cao - 26} r={1.4} />
          <Sao x={40} y={cao - 40} r={1} /><Sao x={rong / 2 + 96} y={18} r={0.9} /></>}
        {children}
      </svg>
      <figcaption className={sang ? "mt-2 text-center text-xs text-[#5b5470]" : "mt-2 text-center text-xs text-fg-faint"}>{nhan}</figcaption>
    </>
  );
}

/** Dải chân hình: link + mã QR về đúng trang (chủ dự án 2026-10-26: "bổ sung link web, QR code web cho hình ảnh bài viết") —
 *  ai chụp màn hình / lưu hình vẫn quét về được bài. QR tự vẽ (lib/qr.ts), nền sáng ở cả hai giao diện để máy quét đọc được. */
function ChanHinh({ duong, sang }: { duong: string; sang: boolean }) {
  const url = `${GOC_QR}${duong}`;
  let qr: MaQr;
  try { qr = maHoaQr(url); } catch { return null; }
  const n = qr.kichThuoc + 8;                    // cạnh = số ô × 2px → mỗi ô sắc nét kể cả màn hình thường, chụp màn hình vẫn quét được
  return (
    <div className={`mt-3 flex items-center justify-center gap-3 border-t pt-3 ${sang ? "border-[#b8892b]/30" : "border-line/50"}`} data-testid="minh-hoa-qr">
      <svg viewBox={`0 0 ${n} ${n}`} width={n * 2} height={n * 2} shapeRendering="crispEdges" role="img" aria-label={`Mã QR mở ${TEN_MIEN}${duong}`}
        className={`shrink-0 rounded-md ${sang ? "ring-1 ring-[#b8892b]/40" : ""}`}>
        <rect width={n} height={n} fill="#f4efe2" />
        <path d={duongQr(qr, 4)} fill="#0a0a17" />
      </svg>
      <div className="min-w-0 text-left leading-tight">
        <a href={duong} className={`block text-sm font-semibold ${sang ? "text-[#2a2540]" : "text-fg"}`}>{TEN_MIEN}</a>
        <span className={`block break-all text-[0.7rem] ${sang ? "text-[#5b5470]" : "text-fg-faint"}`}>{TEN_MIEN}{duong}</span>
        <span className={`block text-[0.7rem] ${sang ? "text-[#9a6f1c]" : "text-gold"}`}>Quét để mở bài này</span>
      </div>
    </div>
  );
}

function Sao({ x, y, r }: { x: number; y: number; r: number }) {
  return <circle cx={x} cy={y} r={r} className="animate-twinkle fill-fg/70" />;
}

const diem = (cx: number, cy: number, r: number, goc: number) =>
  [cx + r * Math.cos(goc), cy + r * Math.sin(goc)] as const;

// ---------------------------------------------------------------- số: đa giác/ngôi sao N đỉnh quanh con số
function HinhSo({ so, so_cai, so_goc }: { so: number; so_cai: boolean; so_goc: number }) {
  const cx = 160, cy = 120, r = 82;
  const n = so_goc;                               // số cái vẽ theo số gốc (engine trả: 11→2, 22→4, 33→6)
  const dinh = Array.from({ length: Math.max(n, 1) }, (_, i) => diem(cx, cy, r, -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1)));
  const buoc = n >= 5 ? Math.floor((n - 1) / 2) : 1;
  const duong = n >= 3 ? dinh.map((_, i) => dinh[(i * buoc) % n]!).map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z" : "";
  return (
    <Khung nhan={`Số ${so} trong thần số học${so_cai ? " — số cái" : ""}`}>
      <circle cx={cx} cy={cy} r={r + 14} className="fill-none stroke-gold/25" strokeWidth={1} />
      {so_cai && <circle cx={cx} cy={cy} r={r + 22} className="fill-none stroke-moon/40" strokeWidth={1} strokeDasharray="2 5" />}
      {duong && <path d={duong} className="fill-gold/5 stroke-gold/60" strokeWidth={1.2} />}
      {n === 2 && <line x1={dinh[0]![0]} y1={dinh[0]![1]} x2={dinh[1]![0]} y2={dinh[1]![1]} className="stroke-gold/60" strokeWidth={1.2} />}
      {dinh.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} className="fill-gold" />)}
      <text x={cx} y={cy + 22} textAnchor="middle" className="fill-fg font-serif" fontSize={so >= 10 ? 58 : 66}>{so}</text>
    </Khung>
  );
}

// ---------------------------------------------------------------- cặp số: hai vòng giao nhau (phần chung = chỗ dễ hoà)
function HinhCapSo({ a, b }: { a: number; b: number }) {
  return (
    <Khung nhan={`Số chủ đạo ${a} và ${b} — hai vòng giao nhau: phần chung là chỗ dễ hoà`}>
      <circle cx={125} cy={118} r={70} className="fill-gold/10 stroke-gold/70" strokeWidth={1.4} />
      <circle cx={195} cy={118} r={70} className="fill-moon/10 stroke-moon/70" strokeWidth={1.4} />
      <text x={100} y={136} textAnchor="middle" className="fill-gold font-serif" fontSize={52}>{a}</text>
      <text x={220} y={136} textAnchor="middle" className="fill-moon font-serif" fontSize={52}>{b}</text>
      <text x={160} y={122} textAnchor="middle" className="fill-fg-muted" fontSize={20}>✦</text>
    </Khung>
  );
}

// ---------------------------------------------------------------- quẻ: 6 hào (hào 1 dưới cùng)
function HinhQue({ so, hao }: { so: number; hao: number[] }) {
  const x0 = 100, rong = 120, cao = 12, khe = 10, y0 = 42;
  return (
    <Khung nhan={`Hình quẻ ${so} Kinh Dịch — sáu hào, đọc từ dưới lên`}>
      <circle cx={160} cy={120} r={104} className="fill-none stroke-gold/20" strokeWidth={1} />
      {[...hao].reverse().map((h, i) => {
        const y = y0 + i * (cao + khe);
        return h ? <rect key={i} x={x0} y={y} width={rong} height={cao} rx={2} className="fill-gold" />
          : <g key={i}><rect x={x0} y={y} width={rong * 0.42} height={cao} rx={2} className="fill-gold/80" />
            <rect x={x0 + rong * 0.58} y={y} width={rong * 0.42} height={cao} rx={2} className="fill-gold/80" /></g>;
      })}
      {hao.map((_, i) => (
        <text key={i} x={x0 - 14} y={y0 + (5 - i) * (cao + khe) + 10} textAnchor="end" className="fill-fg-faint" fontSize={9}>{i + 1}</text>
      ))}
    </Khung>
  );
}

// ---------------------------------------------------------------- sao: ngôi sao 8 cánh, tên chữ Hán, màu ngũ hành
function HinhSaoTuVi({ ten, ten_han, ngu_hanh }: { ten: string; ten_han: string; ngu_hanh: string }) {
  const cx = 160, cy = 112;
  const canh = Array.from({ length: 16 }, (_, i) => diem(cx, cy, i % 2 ? 34 : 86, -Math.PI / 2 + (Math.PI * i) / 8));
  const d = canh.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
  const mau = mauHanh(ngu_hanh);
  return (
    <Khung nhan={`Sao ${ten} (${ten_han}), hành ${ngu_hanh}`}>
      <path d={d} className={`${mau.nen} ${mau.vien}`} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={30} className="fill-bg stroke-gold/50" strokeWidth={1} />
      <text x={cx} y={cy + 9} textAnchor="middle" className="fill-fg" fontSize={24} style={{ fontFamily: "var(--font-han), serif" }}>{ten_han}</text>
      <text x={cx} y={222} textAnchor="middle" className="fill-fg-muted" fontSize={12}>{`${ten} · ${ngu_hanh}`}</text>
    </Khung>
  );
}

// ---------------------------------------------------------------- cung: vòng 12 cung, tô cung đang đọc
function HinhCung({ chi_so, vong, giua, nhan }: { chi_so: number; vong: string[]; giua?: ReactNode; nhan?: string }) {
  const cx = 160, cy = 120, r = 90;
  return (
    <Khung nhan={nhan ?? `Cung ${vong[chi_so]} — vị trí trong vòng 12 cung Tử vi`}>
      <circle cx={cx} cy={cy} r={r} className="fill-none stroke-gold/25" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r - 34} className="fill-none stroke-gold/15" strokeWidth={1} />
      {vong.map((ten, i) => {
        const g = -Math.PI / 2 + (2 * Math.PI * i) / vong.length;
        const [x, y] = diem(cx, cy, r - 17, g);
        const [x1, y1] = diem(cx, cy, r - 34, g - Math.PI / vong.length);
        const [x2, y2] = diem(cx, cy, r, g - Math.PI / vong.length);
        const chon = i === chi_so;
        return (
          <g key={ten}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-gold/20" strokeWidth={1} />
            {chon && <rect x={x - 24} y={y - 10} width={48} height={18} rx={9} className="fill-gold/20 stroke-gold" strokeWidth={1.2} />}
            <text x={x} y={y + 3} textAnchor="middle" fontSize={chon ? 8.5 : 7.5}
              className={chon ? "fill-gold font-semibold" : "fill-fg-faint"}>{ten}</text>
          </g>
        );
      })}
      {giua ?? <text x={cx} y={cy + 6} textAnchor="middle" className="fill-fg font-serif" fontSize={17}>{vong[chi_so]}</text>}
    </Khung>
  );
}

// ---------------------------------------------------------------- SEO-H: sao ở cung — vòng 12 cung + sao ở giữa
function HinhSaoCung({ ten, ten_han, ngu_hanh, chi_so, vong }: { ten: string; ten_han: string; ngu_hanh: string; chi_so: number; vong: string[] }) {
  const cx = 160, cy = 120;
  const mau = mauHanh(ngu_hanh);
  return (
    <HinhCung chi_so={chi_so} vong={vong} nhan={`Sao ${ten} (${ten_han}) ở cung ${vong[chi_so]} — vòng 12 cung Tử vi`} giua={
      <>
        <circle cx={cx} cy={cy} r={34} strokeWidth={1.2} className={`${mau.nen} ${mau.vien}`} />
        <text x={cx} y={cy + 2} textAnchor="middle" className="fill-fg" fontSize={19} style={{ fontFamily: "var(--font-han), serif" }}>{ten_han}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="fill-fg-muted" fontSize={8.5}>{ten}</text>
      </>
    } />
  );
}

// ---------------------------------------------------------------- SEO-I: tứ hoá ở cung — vòng 12 cung + chữ hoá ở giữa
const HOA_HAN: Record<string, string> = { "Lộc": "祿", "Quyền": "權", "Khoa": "科", "Kỵ": "忌" };
const HOA_MAU: Record<string, string> = { "Lộc": "fill-jade/20 stroke-jade", "Quyền": "fill-gold/20 stroke-gold",
  "Khoa": "fill-moon/20 stroke-moon", "Kỵ": "fill-cinnabar/20 stroke-cinnabar" };
function HinhHoaCung({ hoa, chi_so, vong }: { hoa: string; chi_so: number; vong: string[] }) {
  const cx = 160, cy = 120;
  return (
    <HinhCung chi_so={chi_so} vong={vong} nhan={`Hoá ${hoa} (化${HOA_HAN[hoa] ?? ""}) ở cung ${vong[chi_so]} — vòng 12 cung Tử vi`} giua={
      <>
        <circle cx={cx} cy={cy} r={34} strokeWidth={1.2} className={HOA_MAU[hoa] ?? "fill-gold/20 stroke-gold"} />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-fg" fontSize={22} style={{ fontFamily: "var(--font-han), serif" }}>{`化${HOA_HAN[hoa] ?? ""}`}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" className="fill-fg-muted" fontSize={8.5}>{`Hoá ${hoa}`}</text>
      </>
    } />
  );
}

// ---------------------------------------------------------------- ngũ hành: vòng tương sinh + sao tương khắc
const HANH = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];   // thứ tự tương sinh

function VongNguHanh({ sang, nhan_rieng, nhan_giua, theo_hanh = true }: { sang: number; nhan_rieng?: string[]; nhan_giua: ReactNode; theo_hanh?: boolean }) {
  const cx = 160, cy = 120, r = 78;
  const p = HANH.map((_, i) => diem(cx, cy, r, -Math.PI / 2 + (2 * Math.PI * i) / 5));
  return (
    <>
      <circle cx={cx} cy={cy} r={r} className="fill-none stroke-jade/30" strokeWidth={1} strokeDasharray="3 4" />
      {p.map((a, i) => { const b = p[(i + 2) % 5]!; return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="stroke-cinnabar/25" strokeWidth={1} />; })}
      {p.map(([x, y], i) => {
        const chon = i === sang;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={chon ? 24 : 18} strokeWidth={chon ? 1.6 : 1}
              className={!chon ? "fill-surface stroke-line" : theo_hanh ? `${mauHanh(HANH[i]!).nen} ${mauHanh(HANH[i]!).vien}` : "fill-gold/20 stroke-gold"} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={chon ? 11 : 10} className={chon ? "fill-fg font-semibold" : "fill-fg-muted"}>
              {nhan_rieng?.[i] ?? HANH[i]}
            </text>
          </g>
        );
      })}
      {nhan_giua}
    </>
  );
}

const QH_THU_TU: Record<string, number> = { dong_hanh: 0, ta_sinh: 1, ta_khac: 2, khac_ta: 3, sinh_ta: 4 };
const QH_NHAN = ["Ta (đồng hành)", "Ta sinh", "Ta khắc", "Khắc ta", "Sinh ta"];

function HinhThapThan({ ten, quan_he, cung_am_duong }: { ten: string; quan_he: string; cung_am_duong: boolean }) {
  return (
    <Khung nhan={`${ten}: ${QH_NHAN[QH_THU_TU[quan_he] ?? 0]!.toLowerCase()}, ${cung_am_duong ? "cùng" : "khác"} âm dương với nhật chủ`}>
      <VongNguHanh sang={QH_THU_TU[quan_he] ?? 0} theo_hanh={false} nhan_rieng={["Ta", "Ta sinh", "Ta khắc", "Khắc ta", "Sinh ta"]}
        nhan_giua={<>
          <text x={160} y={118} textAnchor="middle" className="fill-gold font-serif" fontSize={15}>{ten}</text>
          <text x={160} y={134} textAnchor="middle" className="fill-fg-faint" fontSize={9}>{cung_am_duong ? "cùng âm dương" : "khác âm dương"}</text>
        </>} />
    </Khung>
  );
}

function HinhNhatChu({ can, hanh, duong }: { can: string; hanh: string; duong: boolean }) {
  const i = HANH.indexOf(hanh === "Hoả" ? "Hỏa" : hanh === "Thuỷ" ? "Thủy" : hanh);
  return (
    <Khung nhan={`Nhật chủ ${can} — hành ${hanh} ${duong ? "dương" : "âm"} trong vòng ngũ hành`}>
      <VongNguHanh sang={i < 0 ? 0 : i} nhan_giua={<>
        <text x={160} y={120} textAnchor="middle" className="fill-gold font-serif" fontSize={20}>{can}</text>
        <text x={160} y={136} textAnchor="middle" className="fill-fg-faint" fontSize={9}>{`${hanh} ${duong ? "dương" : "âm"}`}</text>
      </>} />
    </Khung>
  );
}

// ---------------------------------------------------------------- SEO-J: mệnh nạp âm — hành sáng trong vòng ngũ hành
function HinhMenh({ hanh, nap_am, han, can_chi }: { hanh: string; nap_am: string; han: string; can_chi: string }) {
  const i = HANH.indexOf(hanh === "Hoả" ? "Hỏa" : hanh === "Thuỷ" ? "Thủy" : hanh);
  return (
    <Khung nhan={`Tuổi ${can_chi}, mệnh ${nap_am} (${han}) — hành ${hanh} trong vòng ngũ hành`}>
      <VongNguHanh sang={i < 0 ? 0 : i} nhan_giua={<>
        <text x={160} y={118} textAnchor="middle" className="fill-gold" fontSize={18} style={{ fontFamily: "var(--font-han), serif" }}>{han}</text>
        <text x={160} y={134} textAnchor="middle" className="fill-fg-faint" fontSize={8.5}>{can_chi}</text>
      </>} />
    </Khung>
  );
}

// ---------------------------------------------------------------- KH-BL: tiết khí — vị trí Mặt Trời trên vòng hoàng đạo
// Engine trả kinh độ Mặt Trời (bội 15°); Hạ chí (90°) ở trên, Đông chí (270°) ở dưới, Xuân phân (0°) bên phải.
function HinhTietKhi({ kinh_do, ten, tiet }: { kinh_do: number; ten: string; tiet: boolean }) {
  const cx = 160, cy = 120, r = 82;
  const diem = (kd: number, rr = r) => [cx + rr * Math.cos((kd * Math.PI) / 180), cy - rr * Math.sin((kd * Math.PI) / 180)] as const;
  const [sx, sy] = diem(kinh_do);
  const MOC: [number, string][] = [[0, "Xuân phân"], [90, "Hạ chí"], [180, "Thu phân"], [270, "Đông chí"]];
  return (
    <Khung nhan={`Tiết ${ten}: Mặt Trời ở kinh độ hoàng đạo ${kinh_do}° (${tiet ? "tiết mở đầu tháng" : "trung khí"})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-gold/40" strokeWidth={1.2} />
      {Array.from({ length: 24 }, (_, k) => {
        const [x1, y1] = diem(k * 15, r - 4), [x2, y2] = diem(k * 15, r + 4);
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className={k % 2 ? "stroke-fg-faint" : "stroke-gold/70"} strokeWidth={k % 6 ? 1 : 2} />;
      })}
      {MOC.map(([kd, n]) => {
        const [x, y] = diem(kd, r + 16);
        return <text key={n} x={x} y={y + 3} textAnchor="middle" className="fill-fg-faint" fontSize={8}>{n}</text>;
      })}
      <line x1={cx} y1={cy} x2={sx} y2={sy} className="stroke-gold" strokeWidth={1.4} strokeDasharray="3 3" />
      <circle cx={sx} cy={sy} r={9} className="fill-gold" />
      <circle cx={cx} cy={cy} r={3} className="fill-moon" />
      <text x={cx} y={cy + 22} textAnchor="middle" className="fill-fg" fontSize={12}>{ten}</text>
      <text x={cx} y={cy + 36} textAnchor="middle" className="fill-fg-faint" fontSize={8.5}>{kinh_do}°</text>
    </Khung>
  );
}

// ---------------------------------------------------------------- Y5 dấu hiệu nhà ở: mặt bằng nhà + phòng hay gặp
// Engine trả nhóm dấu hiệu (ngoại cảnh / hình nhà / trong nhà), tên phòng hay gặp, cờ "xử lý trước" / "dấu hiệu tốt".
// Nền giấy sáng (Khung `sang`) → màu viết thẳng mã hex tối, không dùng token giao diện tối.
const GIAY = { muc: "#2a2540", mo: "#7a7290", vang: "#b8892b", ngoc: "#2f8f74", son: "#c0533a", nen: "#f6f0e2", phong: "#fbe9c0" };
function HinhDauHieu({ nhom, phong, veto, tot, ten }: { nhom: string; phong: string[]; veto: boolean; tot: boolean; ten: string }) {
  const vien = tot ? GIAY.ngoc : veto ? GIAY.vang : GIAY.muc;
  // Nhà chữ L: khuyết góc trên phải; còn lại hình chữ nhật. Cửa luôn ở cạnh dưới (mặt trước).
  const nha = nhom === "hinh_nha" ? "M70,50 H190 V110 H250 V190 H70 Z" : "M70,50 H250 V190 H70 Z";
  const yPhong = nhom === "hinh_nha" ? 128 : 100;
  return (
    <Khung sang nhan={`${ten} — ${tot ? "dấu hiệu tốt" : veto ? "nên xử lý trước" : "dấu hiệu cần để ý"}${phong.length ? `, hay gặp ở ${phong.join(", ").toLowerCase()}` : ""}`}>
      {nhom === "hinh_nha" && <path d="M190,50 H250 V110 H190 Z" fill="none" stroke={GIAY.son} strokeOpacity={0.6} strokeWidth={1.2} strokeDasharray="3 4" />}
      <path d={nha} fill="#ffffff" fillOpacity={0.7} stroke={vien} strokeWidth={2} />
      <line x1={140} y1={190} x2={180} y2={190} stroke={GIAY.nen} strokeWidth={5} />
      <text x={160} y={204} textAnchor="middle" fill={GIAY.mo} fontSize={8}>cửa chính</text>
      {nhom === "ngoai_canh" && <>
        <path d="M160,236 V214" stroke={GIAY.son} strokeOpacity={0.7} strokeWidth={10} strokeLinecap="round" />
        <path d="M60,40 Q40,120 60,200 M260,40 Q280,120 260,200" fill="none" stroke={GIAY.ngoc} strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="2 5" />
      </>}
      {phong.map((p, i) => {
        // Ô phòng chia đều bề ngang nhà, căn giữa; tên phòng ngắt hai dòng để không tràn ô.
        const w = Math.min(64, (160 - (phong.length - 1) * 8) / phong.length);
        const x = 160 - (phong.length * w + (phong.length - 1) * 8) / 2 + i * (w + 8);
        const tu = p.split(" ");
        const dong = tu.length > 2 ? [tu.slice(0, Math.ceil(tu.length / 2)).join(" "), tu.slice(Math.ceil(tu.length / 2)).join(" ")] : [p];
        return (
          <g key={p}>
            <rect x={x} y={yPhong} width={w} height={36} rx={6} fill={GIAY.phong} stroke={GIAY.vang} strokeWidth={1} />
            <text x={x + w / 2} y={yPhong + (dong.length > 1 ? 15 : 21)} textAnchor="middle" fill={GIAY.muc} fontSize={7.5}>
              {dong.map((d, j) => <tspan key={d} x={x + w / 2} dy={j ? 9 : 0}>{d}</tspan>)}
            </text>
          </g>
        );
      })}
      {(veto || tot) && <text x={160} y={38} textAnchor="middle" fill={tot ? GIAY.ngoc : GIAY.vang} fontSize={10} fontWeight={600}>{tot ? "✓ dấu hiệu tốt" : "! nên xử lý trước"}</text>}
    </Khung>
  );
}

export function MinhHoa({ mh, duong }: { mh?: MinhHoaDuLieu | null; duong?: string }) {
  if (!mh) return null;
  const hinh = (() => {
    switch (mh.kieu) {
      case "so": return <HinhSo {...mh} />;
      case "que": return <HinhQue {...mh} />;
      case "cap_so": return <HinhCapSo {...mh} />;
      case "sao": return <HinhSaoTuVi {...mh} />;
      case "cung": return <HinhCung {...mh} />;
      case "sao_cung": return <HinhSaoCung {...mh} />;
      case "hoa_cung": return <HinhHoaCung {...mh} />;
      case "menh": return <HinhMenh {...mh} />;
      case "thap_than": return <HinhThapThan {...mh} />;
      case "nhat_chu": return <HinhNhatChu {...mh} />;
      case "dau_hieu": return <HinhDauHieu {...mh} />;
      case "tiet_khi": return <HinhTietKhi {...mh} />;
      default: return null;
    }
  })();
  if (!hinh) return null;
  const sang = mh.kieu === "dau_hieu";
  return (
    <figure className={sang ? "relative mt-6 overflow-hidden rounded-2xl border border-gold/50 bg-[#f6f0e2] p-4 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.65)]"
      : "glass relative mt-6 overflow-hidden rounded-2xl p-4"} data-testid="minh-hoa">
      {hinh}
      {duong?.startsWith("/") && <ChanHinh duong={duong} sang={sang} />}
    </figure>
  );
}
