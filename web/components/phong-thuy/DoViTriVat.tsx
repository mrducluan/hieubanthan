"use client";
// VT-1 + SD-1 — "Đứng giữa nhà, chĩa điện thoại" (+ sơ đồ nhà theo tỉ lệ khi dùng máy tính), nhiều tầng.
// Web CHỈ đọc cảm biến / điểm chạm rồi gửi số thô (mẫu la bàn, toạ độ 0..1) lên `/api/phongthuy/vi-tri-vat`: máy chủ tính toán
// lấy trung bình góc, trừ nhiễu theo trục nhà, đổi ra phương / sơn, xét Cửa – Chủ – Bếp từng tầng, du niên với mệnh, sao
// Huyền Không, TÂM NHÀ (`khung.tam`) và DẤU HIỆU GỢI Ý từ sơ đồ (`dau_hieu_goi_y`). Web không tự suy dấu hiệu, không tự tính tâm
// nhà chữ L, không đổi phía cửa ra độ la bàn.
// Kích thước phòng / phía cửa máy tự vẽ mặc định KHÔNG được gửi đi và không lưu — chỉ khi người dùng tự kéo giãn, bấm +/−
// hoặc bấm "Xoay cửa" (cờ `tu_dat_kt` / `tu_dat_cua`). Số đo & sơ đồ chỉ lưu TRÊN MÁY (hồ sơ nhà) khi người dùng bấm Lưu.
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Check, Compass, Crosshair, ImagePlus, Layers, Minus, Plus, RotateCw, Ruler, Sun, Trash2, Undo2, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { KetQuaTamYeu, SachTamYeu, type TamYeuRes } from "@/components/phong-thuy/TamYeuCuaChuBep";
import { KetQuaNhieuLop, type NhieuLopRes } from "@/components/phong-thuy/NhaNhieuLop";
import { NHAN_MUC, type Muc } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha, type HoSoNha, type HuongCuaKhung, type LoaiVat } from "@/lib/ho-so-nha";
import {
  PHONG_CO_CUA,
  dichDiem,
  tinhHopPhong,
  viTriTuongDoi,
  xoayHuongCua,
  type HopPhongKhung,
} from "@/lib/mat-bang-khung";
import { layQuayLai, ngheQuayLai, veCauTraLoi } from "@/lib/quay-lai-hoi-gi";
import { daiTai, doiCao, doiSan, hopLe, keoMep, khoiVe, themSan, xoaSan, TOI_DA_SAN, type Dai } from "@/lib/san-gieng-troi";
import { giaiMa, nguonSuKien, type SuKienTho } from "@/lib/la-kinh/hop-nhat";
import { tenTheo, type TenHien } from "@/lib/ten-hien";
import { cn } from "@/lib/utils";

type DoVat = {
  mau?: number[];
  diem?: [number, number];
  sai_so?: number;
  /** Chỉ có khi người dùng TỰ chỉnh (kèm cờ) — giá trị máy vẽ mặc định không nằm ở đây. */
  kich_thuoc?: [number, number];
  huong_cua?: HuongCuaKhung;
  tu_dat_kt?: boolean;
  tu_dat_cua?: boolean;
};
type TangDo = Partial<Record<LoaiVat, DoVat>>;
type MoiTang = Record<number, TangDo>;
type BoCuc = NonNullable<HoSoNha["bo_cuc"]>;

interface VatKq {
  loai: LoaiVat; ten: string; nguon: "la_ban" | "khung"; do: number; do_do: number; phuong: string; quai: string; son: string;
  sat_ranh_8: string | null; chua_on_dinh: boolean; canh_bao: string[];
  du_nien_menh?: { du_nien: string; cat: boolean }; sao?: { van: number; son: number; huong: number };
}
/** TY-2 gói 2 (chỉ tầng 1, khi có sân và cửa chính có điểm): engine đo Cửa – Chủ – Bếp từ giữa từng sân như sách Tam Yếu. */
interface TheoSan {
  so_lop: number; lop_chu: number | null;
  quai: { cua: string; chu: string | null; bep: string | null };
  huong: { cua?: string | null; chu?: string | null; bep?: string | null };
  san_do: { cua?: number; chu?: number; bep?: number };
  ghi_chu: string; tam_yeu: TamYeuRes; nhieu_lop?: NhieuLopRes;
}
interface GoiY { ma: string; hoi: string; tang: number; can: string[]; nen_xu_ly_truoc: boolean; trang?: string | null }
interface ViTriKq {
  lech: { do: number | null; ap_dung: boolean; nhieu_manh: boolean; loi: string };
  tang: { so: number; cua_tang: string; vat: VatKq[]; ghi_chu_cua?: string; chua_du?: string; tam_yeu?: TamYeuRes; theo_san?: TheoSan }[];
  luu_y_tham_khao: string;
  huyen_khong?: { van: number; cuc: string; cuc_ten?: string };
  ten_hien?: TenHien;
  /** SD-1 (chỉ khi có sơ đồ): tâm nhà 0..1 và dấu hiệu gợi ý — do máy chủ tính. */
  khung?: { tam: [number, number] };
  dau_hieu_goi_y?: GoiY[];
}

const VAT_TANG = (so: number): LoaiVat[] =>
  so === 1 ? ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "ban_cong"] : ["cau_thang", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"];
const THOI_GIAN_GHI = 1200;            // ms lấy mẫu mỗi lần ghi
const TOI_DA_MAU = 30;                 // giữ ≤ 30 mẫu / vật (đủ để máy chủ lấy trung bình, hồ sơ máy nhẹ)
const LUOI_N = 4;                      // lưới bỏ phần không xây (nhà chữ L…)
const TOI_DA_HOAN_TAC = 15;
const BUOC_PHIM = 0.25;                // mét mỗi lần bấm mũi tên (Shift: 1 m)
const RANH_8 = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

/** Màu từng loại phòng trên bản vẽ (nền tối) — không dùng đỏ; chữ trong hộp luôn là màu chữ chính có viền nền. */
const MAU_PHONG: Record<LoaiVat, { fill: string; stroke: string }> = {
  cua_chinh: { fill: "rgba(234, 179, 8, 0.22)", stroke: "rgb(250, 204, 21)" },
  phong_ngu_chinh: { fill: "rgba(99, 102, 241, 0.22)", stroke: "rgb(165, 180, 252)" },
  bep: { fill: "rgba(202, 160, 96, 0.22)", stroke: "rgb(222, 190, 140)" },
  ve_sinh: { fill: "rgba(20, 184, 166, 0.22)", stroke: "rgb(94, 234, 212)" },
  ban_tho: { fill: "rgba(192, 132, 252, 0.22)", stroke: "rgb(216, 180, 254)" },
  cau_thang: { fill: "rgba(148, 163, 184, 0.22)", stroke: "rgb(203, 213, 225)" },
  ban_cong: { fill: "rgba(56, 189, 248, 0.16)", stroke: "rgb(125, 211, 252)" },
};

type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

function gocManHinh(): number {
  try {
    const a = window.screen?.orientation?.angle;
    if (typeof a === "number") return a;
    const cu = (window as unknown as { orientation?: unknown }).orientation;
    return typeof cu === "number" ? cu : 0;
  } catch { return 0; }
}
/** Độ rung của dãy mẫu gần nhất (chênh lớn nhất so với mẫu đầu, theo vòng) — chỉ để hiện chỉ báo, máy chủ mới chấm. */
function doRung(ds: number[]): number {
  if (ds.length < 2) return 0;
  const goc = ds[0]!;
  return Math.max(...ds.map((d) => Math.abs(((d - goc + 540) % 360) - 180)));
}
const thuGon = (ds: number[]) => (ds.length <= TOI_DA_MAU ? ds : Array.from({ length: TOI_DA_MAU }, (_, i) => ds[Math.floor((i * ds.length) / TOI_DA_MAU)]!));
const lam1 = (n: number) => Math.round(n * 10) / 10;
const lam3 = (n: number) => Math.round(n * 1000) / 1000;

/** Hồ sơ → trạng thái: kích thước / phía cửa không có cờ "tự chỉnh" là giá trị máy tự điền của bản cũ → bỏ. */
function chuanVat(v: DoVat): DoVat {
  const { kich_thuoc, huong_cua, tu_dat_kt, tu_dat_cua, ...con } = v;
  return {
    ...con,
    ...(tu_dat_kt && kich_thuoc ? { kich_thuoc, tu_dat_kt: true } : {}),
    ...(tu_dat_cua && huong_cua ? { huong_cua, tu_dat_cua: true } : {}),
  };
}

// ---- số đo các tầng + dải sân / giếng trời + lịch sử hoàn tác: MỘT reducer thuần (StrictMode gọi hai lần vẫn ra cùng kết quả)
type AnhSoDo = { doTang: MoiTang; san: Dai[] };
type SoDo = AnhSoDo & { lichSu: AnhSoDo[] };
type ViecSoDo =
  | { loai: "nap"; doTang: MoiTang; san: Dai[] }
  | { loai: "sua"; tang: number; sua: (t: TangDo) => TangDo; hoanTac: boolean }
  | { loai: "san"; sua: (ds: Dai[]) => Dai[]; hoanTac: boolean }
  | { loai: "hoan_tac" };
const ghiLichSu = (s: SoDo, hoanTac: boolean) =>
  (hoanTac ? [...s.lichSu.slice(-(TOI_DA_HOAN_TAC - 1)), { doTang: s.doTang, san: s.san }] : s.lichSu);
function soDoReducer(s: SoDo, v: ViecSoDo): SoDo {
  if (v.loai === "nap") return { doTang: v.doTang, san: v.san, lichSu: [] };
  if (v.loai === "hoan_tac") {
    const cuoi = s.lichSu[s.lichSu.length - 1];
    return cuoi ? { ...cuoi, lichSu: s.lichSu.slice(0, -1) } : s;
  }
  if (v.loai === "san") {
    const moi = v.sua(s.san);
    if (moi === s.san || JSON.stringify(moi) === JSON.stringify(s.san)) return s;
    return { doTang: s.doTang, san: moi, lichSu: ghiLichSu(s, v.hoanTac) };
  }
  const cu = s.doTang[v.tang] ?? {};
  const moi = v.sua(cu);
  if (moi === cu) return s;
  return { doTang: { ...s.doTang, [v.tang]: moi }, san: s.san, lichSu: ghiLichSu(s, v.hoanTac) };
}
/** Nhãn mức (Thuận lợi / Cân bằng / Cần lưu ý) theo ngôn ngữ — như KetQuaTamYeu. */
const mucChu = (m: Muc, en: boolean, c: (k: string) => string) => (en ? c(m === "can_chu_dong" ? "sd.luu_y" : `sd.${m}`) : NHAN_MUC[m]);
const AUTO_MS = 400;                  // chờ sau lần chỉnh cuối rồi mới tự tính lại

/** Ký hiệu cánh cửa + cung mở 90° trên cạnh tương ứng của hộp phòng. `tam` = máy tạm đặt (người dùng chưa chọn phía) → vẽ mờ, nét đứt. */
function KyHieuCua({ hop, mau, strokeW, tam }: { hop: HopPhongKhung; mau: string; strokeW: number; tam: boolean }) {
  const { x0, y0, w, h, cx, cy, huongCua } = hop;
  const banKinh = Math.min(0.85, Math.max(0.32, Math.min(w, h) * 0.42));
  // Bản lề (hx, hy), đầu cánh mở (lx, ly), đầu khung cửa đối diện (ex, ey), cung quét 90° từ đầu cánh về đầu khung.
  let hx: number, hy: number, lx: number, ly: number, ex: number, ey: number;
  if (huongCua === "truoc") {
    hx = cx - banKinh / 2; hy = y0; ex = cx + banKinh / 2; ey = y0; lx = hx; ly = y0 - banKinh;
  } else if (huongCua === "sau") {
    hx = cx + banKinh / 2; hy = y0 + h; ex = cx - banKinh / 2; ey = y0 + h; lx = hx; ly = y0 + h + banKinh;
  } else if (huongCua === "phai") {
    hx = x0 + w; hy = cy - banKinh / 2; ex = x0 + w; ey = cy + banKinh / 2; lx = x0 + w + banKinh; ly = hy;
  } else {
    hx = x0; hy = cy + banKinh / 2; ex = x0; ey = cy - banKinh / 2; lx = x0 - banKinh; ly = hy;
  }
  const dut = `${strokeW * 2} ${strokeW * 1.5}`;
  if (tam) {
    return (
      <g pointerEvents="none" opacity={0.4} data-cua="tam">
        <line x1={hx} y1={hy} x2={lx} y2={ly} stroke={mau} strokeWidth={strokeW * 0.9} strokeDasharray={dut} />
        <path d={`M ${lx} ${ly} A ${banKinh} ${banKinh} 0 0 1 ${ex} ${ey}`} fill="none" stroke={mau} strokeWidth={strokeW * 0.7} strokeDasharray={dut} />
      </g>
    );
  }
  return (
    <g pointerEvents="none" data-cua="tu_dat">
      {/* Khoảng hở tường tại vị trí cửa */}
      <line x1={hx} y1={hy} x2={ex} y2={ey} stroke="rgb(var(--bg))" strokeWidth={strokeW * 2.2} strokeLinecap="butt" />
      {/* Cánh cửa mở 90° */}
      <line x1={hx} y1={hy} x2={lx} y2={ly} stroke={mau} strokeWidth={strokeW * 1.4} strokeLinecap="round" />
      <path d={`M ${lx} ${ly} A ${banKinh} ${banKinh} 0 0 1 ${ex} ${ey}`} fill="none" stroke={mau} strokeWidth={strokeW * 0.9} strokeDasharray={dut} />
    </g>
  );
}

/** Lời báo không có chữ có dấu tiếng Việt (bản Anh chỉ hiện lời như vậy). */
const hetKhongDau = (s: string) => !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);

export function DoViTriVat({ sinh }: { sinh?: { birth_date: string; gender: "nam" | "nu"; moc_nam?: string } | null }) {
  const { c, en } = useChuPT();
  const hoSo = useHoSoNha();
  const huongNha = hoSo?.huong_do ?? null;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const henVe = useSyncExternalStore(ngheQuayLai, layQuayLai, () => null);

  const [cheDo, setCheDo] = useState<"la_ban" | "khung">("la_ban");
  const [soTang, setSoTang] = useState(1);
  const [tang, setTang] = useState(1);
  const [{ doTang, san, lichSu }, giao] = useReducer(soDoReducer, { doTang: {}, san: [], lichSu: [] });
  const [truc, setTruc] = useState<number[] | null>(null);
  /** `tuLuoiCu` (TY-2 đợt 2): khung chuyển từ lưới vẽ tay cũ — mỗi ô 1 m, chưa phải số đo thật; sửa kích thước là gỡ cờ. */
  const [khung, setKhung] = useState<{ rong: number; sau: number; luoi: boolean[][] | null; tuLuoiCu?: boolean }>({ rong: 5, sau: 15, luoi: null });
  // TY-2 đợt 2: ảnh bản vẽ / mặt bằng (chụp hoặc chọn từ máy) đặt DƯỚI sơ đồ để chạm theo — blob trên trình duyệt,
  // không gửi đi, không lưu (tải lại trang là mất).
  // Vẽ lên <canvas> bằng createImageBitmap — không tạo đường dẫn ảnh nào (không blob:, không src).
  const [anhNen, setAnhNen] = useState<{ anh: ImageBitmap; xoay: number; mo: number } | null>(null);
  const canvasAnh = useRef<HTMLCanvasElement>(null);
  useEffect(() => () => { anhNen?.anh.close(); }, [anhNen?.anh]);
  const chonAnhNen = (f: File | undefined) => {
    if (!f) { setAnhNen(null); return; }
    createImageBitmap(f)
      .then((anh) => { if (song.current) setAnhNen({ anh, xoay: 0, mo: 0.55 }); else anh.close(); })
      .catch(() => setAnhNen(null));
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "anh_mat_bang_nen", cach: "khung" });
  };
  useEffect(() => {
    const cv = canvasAnh.current;
    if (!cv || !anhNen) return;
    const { anh, xoay } = anhNen;
    const dung = xoay % 180 !== 0;
    cv.width = dung ? anh.height : anh.width;
    cv.height = dung ? anh.width : anh.height;
    const g = cv.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, cv.width, cv.height);
    g.save();
    g.translate(cv.width / 2, cv.height / 2);
    g.rotate((xoay * Math.PI) / 180);
    g.drawImage(anh, -anh.width / 2, -anh.height / 2);
    g.restore();
  }, [anhNen]);

  const [dangDat, setDangDat] = useState<LoaiVat>("cua_chinh");
  const [dangChon, setDangChon] = useState<LoaiVat | null>(null);
  const [tieuDiem, setTieuDiem] = useState<LoaiVat | null>(null);
  const [boLuoi, setBoLuoi] = useState(false);
  /** TY-2 gói 2: đang đánh dấu sân / giếng trời (chỉ tầng 1, sơ đồ tỉ lệ) và dải đang chọn. */
  const [cheDoSan, setCheDoSan] = useState(false);
  const [sanChon, setSanChon] = useState<number | null>(null);
  const [baoSan, setBaoSan] = useState<string | null>(null);
  const [hienCuuCung, setHienCuuCung] = useState(true);
  /** Câu trả lời Có / Không cho dấu hiệu gợi ý (theo mã). Bỏ trống = chưa trả lời = không lưu. */
  const [traLoi, setTraLoi] = useState<Record<string, boolean>>({});
  /** Tâm nhà máy chủ trả, kèm khoá lưới lúc tính — lưới đổi thì tâm này hết dùng được. */
  const [tamMay, setTamMay] = useState<{ khoa: string; tam: [number, number] } | null>(null);
  const [du18, setDu18] = useState(false);
  const [kq, setKq] = useState<ViTriKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTinh, setDangTinh] = useState(false);
  const [daLuu, setDaLuu] = useState(false);
  /** "Thử dời bếp": đã có kết quả thì mọi chỉnh sửa tự tính lại (chờ AUTO_MS). `cu` = kết quả đang hiện thuộc số đo trước. */
  const tuDong = useRef(false);
  const [phienBan, setPhienBan] = useState(0);
  const [cu, setCu] = useState(false);
  const [truocSau, setTruocSau] = useState<{ phan: "tang" | "san"; truoc: Muc; sau: Muc } | null>(null);
  const daNap = useRef(false);
  const song = useRef(true);
  const luotXem = useRef(0);
  const hen = useRef<Set<number>>(new Set());

  // Kéo dời / kéo giãn phòng trên SVG (một mục hoàn tác cho mỗi lần kéo)
  const keoRef = useRef<
    | { loai: LoaiVat; kieu: "move"; dx: number; dy: number; daLuuUndo: boolean; con: number }
    | { loai: LoaiVat; kieu: "resize"; x0: number; y0: number; daLuuUndo: boolean; con: number }
    | { kieu: "san"; i: number; mep: "tren" | "duoi" | null; dy: number; daLuuUndo: boolean; con: number }
    | null
  >(null);
  const phimRef = useRef<{ loai: string; luc: number } | null>(null);

  // la bàn
  const [bat, setBat] = useState(false);
  const [doSong, setDoSong] = useState<number | null>(null);
  const [nghieng, setNghieng] = useState(false);
  const [dangGhi, setDangGhi] = useState<LoaiVat | "truc" | null>(null);
  const mauSong = useRef<number[]>([]);
  const saiSo = useRef<number | undefined>(undefined);
  const gom = useRef<number[] | null>(null);
  const huy = useRef<(() => void) | null>(null);

  const henGio = useCallback((f: () => void, ms: number) => {
    const id = window.setTimeout(() => { hen.current.delete(id); if (song.current) f(); }, ms);
    hen.current.add(id);
  }, []);

  // Máy không la bàn / máy tính → mặc định khung tỉ lệ.
  useEffect(() => {
    try {
      const coCam = "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;
      if (!coCam) setCheDo("khung");
    } catch { setCheDo("khung"); }
  }, []);

  // Nạp số đo đã lưu (một lần).
  useEffect(() => {
    if (daNap.current || !hoSo) return;
    daNap.current = true;
    const sanLuu = [...(hoSo.khung?.san ?? [])].sort((a, b) => a[0] - b[0]) as Dai[];
    if (hoSo.tang_do?.length || sanLuu.length) {
      giao({
        loai: "nap",
        doTang: Object.fromEntries((hoSo.tang_do ?? []).map((t) => [t.so,
          Object.fromEntries(Object.entries(t.vat).map(([k, v]) => [k, chuanVat(v as DoVat)])) as TangDo])),
        san: hopLe(sanLuu) ? sanLuu : [],
      });
      if (hoSo.tang_do?.length) setSoTang(Math.max(...hoSo.tang_do.map((t) => t.so)));
    }
    if (hoSo.truc_mau) setTruc(hoSo.truc_mau);
    if (hoSo.khung) {
      setKhung({ rong: hoSo.khung.rong, sau: hoSo.khung.sau, luoi: hoSo.khung.luoi?.map((r) => [...r].map((x) => x === "1")) ?? null,
        ...(hoSo.khung.tu_luoi_cu ? { tuLuoiCu: true } : {}) });
      if (hoSo.khung.luoi) setBoLuoi(true);
    }
  }, [hoSo]);

  // Rời trang: gỡ cảm biến, huỷ hẹn giờ, đánh dấu để các lượt đang chờ không ghi trạng thái nữa.
  useEffect(() => {
    song.current = true;
    const dsHen = hen.current;
    return () => {
      song.current = false;
      huy.current?.(); huy.current = null;
      dsHen.forEach((id) => window.clearTimeout(id));
      dsHen.clear();
    };
  }, []);

  /** Mọi thay đổi số đo: kết quả đang hiện thành "cũ" (mờ, chưa lưu được) và — khi đã có kết quả — tự tính lại sau AUTO_MS. */
  const doiSoDo = useCallback(() => { setCu(true); setDaLuu(false); setLoi(null); setBaoSan(null); setPhienBan((n) => n + 1); }, []);
  const suaTang = useCallback((so: number, sua: (t: TangDo) => TangDo, hoanTac = true) => {
    doiSoDo();
    giao({ loai: "sua", tang: so, sua, hoanTac });
  }, [doiSoDo]);

  const suaSan = useCallback((sua: (ds: Dai[]) => Dai[], hoanTac = true) => {
    doiSoDo();
    giao({ loai: "san", sua, hoanTac });
  }, [doiSoDo]);

  const hoanTac = () => {
    if (!lichSu.length) return;
    doiSoDo();
    giao({ loai: "hoan_tac" });
  };

  const batLaBan = useCallback(async () => {
    setLoi(null);
    if (!("DeviceOrientationEvent" in window)) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); return; }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      let duoc = false;
      try { duoc = (await DOE.requestPermission()) === "granted"; } catch { duoc = false; }
      if (!song.current) return;                       // rời trang trong lúc hộp xin quyền còn mở
      if (!duoc) { setLoi(c("dv.quyen")); return; }
    }
    if (huy.current) return;                           // đã nghe rồi
    // Cùng bộ giải mã với la bàn đo hướng nhà (lib/la-kinh): nghe CẢ HAI loại sự kiện, chỉ đọc sự kiện tuyệt đối / iOS —
    // sự kiện tương đối (alpha tính từ lúc mở trang) bị bỏ, đọc vào là lệch tuỳ ý so với Bắc.
    const coTuyetDoi = "ondeviceorientationabsolute" in window;
    let nhan = false;
    let daThayTuyetDoi = false;
    const nghe = (ev: Event) => {
      const e = ev as unknown as SuKienTho;
      const nguon = nguonSuKien(ev.type, e, daThayTuyetDoi);
      if (!nguon) return;
      if (ev.type === "deviceorientationabsolute") daThayTuyetDoi = true;
      const m = giaiMa(e, nguon === "tuyet_doi", gocManHinh());
      if (!m) return;
      nhan = true;
      setDoSong(m.do);
      setNghieng(m.nghieng);
      if (m.nghieng) return;
      mauSong.current = [...mauSong.current.slice(-19), m.do];
      if (m.saiSo != null) saiSo.current = m.saiSo;
      gom.current?.push(m.do);
    };
    if (coTuyetDoi) window.addEventListener("deviceorientationabsolute", nghe);
    window.addEventListener("deviceorientation", nghe);
    huy.current = () => {
      window.removeEventListener("deviceorientationabsolute", nghe);
      window.removeEventListener("deviceorientation", nghe);
    };
    setBat(true);
    henGio(() => { if (!nhan) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); } }, 2500);
  }, [c, henGio]);

  const ghiMau = (cho: LoaiVat | "truc") => {
    if (!bat || dangGhi) return;
    const tangGhi = tang;
    gom.current = [];
    setDangGhi(cho);
    henGio(() => {
      const ds = gom.current ?? [];
      gom.current = null;
      setDangGhi(null);
      if (!ds.length) return;
      const mau = thuGon(ds.map(lam1));
      const ss = saiSo.current;
      if (cho === "truc") { doiSoDo(); setTruc(mau); }
      else suaTang(tangGhi, (t) => ({ ...t, [cho]: { mau, ...(ss != null ? { sai_so: ss } : {}) } }));
      try { navigator.vibrate?.(30); } catch { /* không hỗ trợ */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho, cach: "la_ban" });
    }, THOI_GIAN_GHI);
  };

  const doHienTai = useMemo(() => doTang[tang] ?? {}, [doTang, tang]);

  const xoaVat = (l: LoaiVat) => {
    if (!doHienTai[l]) return;
    suaTang(tang, (t) => {
      if (!t[l]) return t;
      const m = { ...t };
      delete m[l];
      return m;
    });
    if (dangChon === l) setDangChon(null);
    setDangDat(l);
  };

  const xoaTangHienTai = () => {
    if (!Object.keys(doHienTai).length) return;
    suaTang(tang, (t) => (Object.keys(t).length ? {} : t));
    setDangChon(null);
    setDangDat(VAT_TANG(tang)[0]!);
  };

  const suaVat = (l: LoaiVat, sua: (cu: DoVat) => DoVat, coHoanTac = true) =>
    suaTang(tang, (t) => (t[l] ? { ...t, [l]: sua(t[l]!) } : t), coHoanTac);

  // ---- sơ đồ theo tỉ lệ
  // Lưới bỏ phần không xây: 4×4 khi vẽ mới; sơ đồ chuyển từ lưới cũ giữ đúng số hàng / cột đã vẽ.
  const nHang = khung.luoi?.length ?? LUOI_N, nCot = khung.luoi?.[0]?.length ?? LUOI_N;
  const svgRef = useRef<SVGSVGElement>(null);
  const toaDoSvg = (ev: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return {
      mx: Math.min(khung.rong, Math.max(0, p.x)),
      my: Math.min(khung.sau, Math.max(0, p.y)),
      x: Math.min(1, Math.max(0, p.x / khung.rong)),
      y: Math.min(1, Math.max(0, p.y / khung.sau)),
    };
  };

  const datDiem = (ev: React.PointerEvent<SVGSVGElement>) => {
    const pt = toaDoSvg(ev);
    if (!pt) return;
    const { x, y } = pt;
    if (cheDoSan && tang === 1) {
      // Chạm chỗ trống → thêm một dải ~1,2 m giữa tại điểm chạm; chạm trúng dải cũ (khi dải không bắt được sự kiện) → chọn.
      const trung = daiTai(san, y);
      if (trung >= 0) { setSanChon(trung); return; }
      if (san.length >= TOI_DA_SAN) { setBaoSan(c("dv.san.toi_da")); return; }
      const r = themSan(san, y, khung.sau);
      if (!r) { setBaoSan(c("dv.san.het_cho")); return; }
      suaSan(() => r.ds);
      setSanChon(r.i);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_san_them", so_san: r.ds.length });
      return;
    }
    if (boLuoi) {
      const r = Math.min(nHang - 1, Math.floor(y * nHang)), col = Math.min(nCot - 1, Math.floor(x * nCot));
      const l = khung.luoi ?? Array.from({ length: nHang }, () => Array<boolean>(nCot).fill(true));
      setKhung({ ...khung, luoi: l.map((row, i) => row.map((v, j) => (i === r && j === col ? !v : v))) });
      doiSoDo();
      return;
    }
    const loai = dangDat;
    const diem: [number, number] = [lam3(x), lam3(y)];
    // Đặt / đặt lại vị trí: giữ kích thước, phía cửa người dùng đã tự chỉnh; KHÔNG điền giá trị mặc định vào số đo.
    suaTang(tang, (t) => {
      const { mau: _m, sai_so: _s, ...giu } = chuanVat(t[loai] ?? {});
      void _m; void _s;
      return { ...t, [loai]: { ...giu, diem } };
    });
    setDangChon(loai);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho: loai, cach: "khung" });
    const ds = VAT_TANG(tang);
    const tiep = ds[ds.indexOf(loai) + 1];
    if (tiep && !doHienTai[tiep]) setDangDat(tiep);
  };

  /** Dải sân: kéo cả dải (mep = null) hoặc một mép (trên / dưới). Chỉ khi đang ở chế độ sân. */
  const batDauKeoSan = (ev: React.PointerEvent<SVGElement>, i: number, mep: "tren" | "duoi" | null) => {
    if (!cheDoSan || !san[i]) return;
    ev.stopPropagation();
    const pt = toaDoSvg(ev);
    if (!pt) return;
    setSanChon(i);
    keoRef.current = { kieu: "san", i, mep, dy: pt.y - san[i]![0], daLuuUndo: false, con: ev.pointerId };
    try { svgRef.current?.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const batDauKeo = (ev: React.PointerEvent<SVGGElement>, loai: LoaiVat, hop: HopPhongKhung) => {
    // Đang bỏ ô không xây, hoặc đang cầm một chỗ CHƯA đặt → để sự kiện nổi lên SVG (đặt chỗ mới ngay tại điểm chạm).
    if (boLuoi || !doHienTai[dangDat]?.diem) return;
    ev.stopPropagation();
    const pt = toaDoSvg(ev);
    if (!pt) return;
    setDangChon(loai);
    setDangDat(loai);
    keoRef.current = { loai, kieu: "move", dx: pt.mx - hop.cx, dy: pt.my - hop.cy, daLuuUndo: false, con: ev.pointerId };
    try { svgRef.current?.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const batDauResize = (ev: React.PointerEvent<SVGRectElement>, loai: LoaiVat, hop: HopPhongKhung) => {
    if (boLuoi) return;
    ev.stopPropagation();
    setDangChon(loai);
    setDangDat(loai);
    keoRef.current = { loai, kieu: "resize", x0: hop.x0, y0: hop.y0, daLuuUndo: false, con: ev.pointerId };
    try { svgRef.current?.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const diChuyenKeo = (ev: React.PointerEvent<SVGSVGElement>) => {
    const k = keoRef.current;
    if (!k || k.con !== ev.pointerId) return;
    const pt = toaDoSvg(ev);
    if (!pt) return;
    const lanDau = !k.daLuuUndo;
    k.daLuuUndo = true;
    if (k.kieu === "san") {
      const { i, mep, dy } = k;
      suaSan((ds) => (mep ? keoMep(ds, i, mep, pt.y, khung.sau) : doiSan(ds, i, pt.y - dy, khung.sau)), lanDau);
      return;
    }
    if (k.kieu === "move") {
      const diem: [number, number] = [
        lam3(Math.min(1, Math.max(0, (pt.mx - k.dx) / khung.rong))),
        lam3(Math.min(1, Math.max(0, (pt.my - k.dy) / khung.sau))),
      ];
      suaVat(k.loai, (v) => ({ ...v, diem }), lanDau);
    } else {
      const nw = lam1(Math.min(khung.rong, Math.max(0.6, pt.mx - k.x0)));
      const nh = lam1(Math.min(khung.sau, Math.max(0.5, pt.my - k.y0)));
      const diem: [number, number] = [
        lam3(Math.min(1, Math.max(0, (k.x0 + nw / 2) / khung.rong))),
        lam3(Math.min(1, Math.max(0, (k.y0 + nh / 2) / khung.sau))),
      ];
      suaVat(k.loai, (v) => ({ ...v, kich_thuoc: [nw, nh], tu_dat_kt: true, diem }), lanDau);
    }
  };

  /** Thả tay sau khi kéo: lần tự tính lại trong lúc kéo đã bị hoãn → hẹn lại một lần. */
  const xongKeo = () => {
    const k = keoRef.current;
    keoRef.current = null;
    if (k?.daLuuUndo) setPhienBan((n) => n + 1);
  };
  const ketThucKeo = (ev: React.PointerEvent<SVGSVGElement>) => {
    const k = keoRef.current;
    if (!k || k.con !== ev.pointerId) return;
    xongKeo();
    try { svgRef.current?.releasePointerCapture(ev.pointerId); } catch { /* đã nhả */ }
  };

  const phimTrenSan = (ev: React.KeyboardEvent<SVGGElement>, i: number) => {
    const buoc = (ev.shiftKey ? 1 : BUOC_PHIM) / khung.sau;
    const d = ev.key === "ArrowUp" ? -buoc : ev.key === "ArrowDown" ? buoc : 0;
    if (d) {
      ev.preventDefault();
      const nay = Date.now();
      const moi = !phimRef.current || phimRef.current.loai !== `san${i}` || nay - phimRef.current.luc > 1500;
      phimRef.current = { loai: `san${i}`, luc: nay };
      suaSan((ds) => (ds[i] ? doiSan(ds, i, ds[i]![0] + d, khung.sau) : ds), moi);
      setSanChon(i);
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); phimRef.current = null; xoaDaiSan(i); return; }
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSanChon(i); }
  };
  const xoaDaiSan = (i: number) => {
    suaSan((ds) => xoaSan(ds, i));
    setSanChon(null);
  };

  const phimTrenHop = (ev: React.KeyboardEvent<SVGGElement>, loai: LoaiVat) => {
    const buoc = ev.shiftKey ? 1 : BUOC_PHIM;
    const dich: Record<string, [number, number]> = { ArrowLeft: [-buoc, 0], ArrowRight: [buoc, 0], ArrowUp: [0, -buoc], ArrowDown: [0, buoc] };
    const d = dich[ev.key];
    if (d) {
      ev.preventDefault();
      // Một tràng phím liên tiếp trên cùng một phòng = một mục hoàn tác.
      const nay = Date.now();
      const moi = !phimRef.current || phimRef.current.loai !== loai || nay - phimRef.current.luc > 1500;
      phimRef.current = { loai, luc: nay };
      suaVat(loai, (v) => (v.diem ? { ...v, diem: dichDiem(v.diem, d[0], d[1], khung.rong, khung.sau) } : v), moi);
      setDangChon(loai);
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); phimRef.current = null; xoaVat(loai); return; }
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setDangChon(loai); setDangDat(loai); setBoLuoi(false); }
  };

  const luoiGui = useMemo(() => {
    if (!khung.luoi || khung.luoi.every((r) => r.every(Boolean))) return undefined;
    return khung.luoi.map((r) => r.map((v) => (v ? "1" : "0")).join(""));
  }, [khung.luoi]);
  const khoaLuoi = luoiGui ? luoiGui.join("|") : "";

  const coGi = Object.values(doTang).some((t) => Object.keys(t).length > 0);
  const coDiemNao = Object.entries(doTang).some(([so, t]) => Number(so) <= soTang && Object.values(t).some((v) => v?.diem));

  const hopCacPhong = useMemo(() => (Object.entries(doHienTai) as [LoaiVat, DoVat][])
    .filter(([, v]) => v.diem)
    .map(([loai, v]) => ({ loai, v, hop: tinhHopPhong(loai, v.diem!, khung.rong, khung.sau, v.kich_thuoc, v.huong_cua) })),
  [doHienTai, khung.rong, khung.sau]);

  // Tâm nhà trên bản vẽ: nhà chữ nhật = chính giữa (hiển nhiên); nhà bỏ ô → CHỈ dùng tâm máy chủ đã trả cho đúng lưới này.
  const tamVe: [number, number] | null = !luoiGui ? [0.5, 0.5] : tamMay && tamMay.khoa === khoaLuoi ? tamMay.tam : null;

  const kqRef = useRef<ViTriKq | null>(null);
  useEffect(() => { kqRef.current = kq; }, [kq]);

  const xem = async (nguon: "nut" | "tu_dong" = "nut") => {
    const luot = ++luotXem.current;
    setDangTinh(true); setLoi(null);
    const tangGui = Object.entries(doTang)
      .map(([so, t]) => ({
        so: Number(so),
        vat: (Object.entries(t) as [LoaiVat, DoVat][]).filter(([, v]) => v.mau || v.diem)
          .map(([loai, v]) => (v.diem
            ? {
                loai, diem: v.diem,
                // CHỈ gửi thứ người dùng tự chỉnh — hộp / cửa máy vẽ mặc định không phải dữ kiện.
                ...(v.tu_dat_kt && v.kich_thuoc ? { kich_thuoc: v.kich_thuoc } : {}),
                ...(v.tu_dat_cua && v.huong_cua ? { huong_cua: v.huong_cua } : {}),
              }
            : { loai, mau: v.mau!, ...(v.sai_so != null ? { sai_so: v.sai_so } : {}) })),
      }))
      .filter((t) => t.vat.length && t.so <= soTang);
    const coDiem = tangGui.some((t) => t.vat.some((v) => "diem" in v));
    try {
      const r = await postJson<ViTriKq>("/api/phongthuy/vi-tri-vat", {
        tang: tangGui,
        ...(huongNha != null ? { huong_nha_do: huongNha } : {}),
        ...(truc ? { truc_mau: truc } : {}),
        ...(coDiem ? { khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}),
          ...(cheDo === "khung" && san.length ? { san } : {}) } } : {}),
        ...(hoSo?.nam_xay ? { nam_xay: hoSo.nam_xay } : {}),
        ...(sinh ? { sinh } : {}),
        ...(du18 ? { du_18: true } : {}),
      });
      if (!song.current || luot !== luotXem.current) return;
      // "Thử dời bếp": so mức Cửa – Chủ – Bếp tầng 1 (và đo theo sân) với kết quả trước — đổi thì báo nhẹ.
      const truoc = kqRef.current?.tang.find((t) => t.so === 1);
      const sau = r.tang.find((t) => t.so === 1);
      let doi: { phan: "tang" | "san"; truoc: Muc; sau: Muc } | null = null;
      if (nguon === "tu_dong") {
        for (const [phan, a, b] of [
          ["san", truoc?.theo_san?.tam_yeu.ket_luan?.muc, sau?.theo_san?.tam_yeu.ket_luan?.muc],
          ["tang", truoc?.tam_yeu?.ket_luan?.muc, sau?.tam_yeu?.ket_luan?.muc],
        ] as const) {
          if (a && b && a !== b) { doi = { phan, truoc: a, sau: b }; break; }
        }
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_tu_tinh", so_tang: tangGui.length, cach: coDiem ? "khung" : "la_ban", co_san: san.length > 0 });
        if (doi) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_truoc_sau", phan: doi.phan, truoc: doi.truoc, sau: doi.sau });
      }
      setTruocSau(doi);
      setKq(r);
      setCu(false);
      tuDong.current = true;
      const tam = r.khung?.tam;
      if (coDiem && Array.isArray(tam) && tam.length === 2 && tam.every((n) => typeof n === "number" && n >= 0 && n <= 1)) {
        setTamMay({ khoa: khoaLuoi, tam: [tam[0], tam[1]] });
      }
      if (nguon === "nut") {
        ghi("chart_interacted", {
          mo_dun: "phongthuy", kind: "vi_tri_xem", so_tang: tangGui.length, co_truc: Boolean(truc), cach: coDiem ? "khung" : "la_ban",
          so_goi_y: r.dau_hieu_goi_y?.length ?? 0, so_san: cheDo === "khung" ? san.length : 0,
        });
      }
    } catch (e) {
      if (!song.current || luot !== luotXem.current) return;
      // Máy chủ tự viết lời báo (vd một chỗ nằm đúng tâm nhà). Bản Anh: lời Việt thì thay bằng câu chung của bảng chữ.
      // Kết quả đang hiện không còn đúng với số đo mới → ẩn; lần chỉnh sau vẫn tự tính lại.
      if (nguon === "tu_dong") { setKq(null); setTruocSau(null); }
      const tb = e instanceof Error ? e.message : "";
      setLoi(/trùng tâm|tâm nhà/i.test(tb) ? c("dv.loi_trung_tam") : tb && (!en || hetKhongDau(tb)) ? tb : c("dv.loi"));
    } finally {
      if (song.current && luot === luotXem.current) setDangTinh(false);
    }
  };

  // du18 đổi → tính lại để hiện / ẩn nhóm C
  useEffect(() => { if (kq) void xem(); }, [du18]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Thử dời bếp": đã có kết quả → mỗi lần chỉnh (thả tay sau khi kéo, phím mũi tên, thêm / bỏ) tự tính lại sau AUTO_MS.
  // Đang kéo dở thì không gửi; thả tay sẽ hẹn lại (xongKeo).
  useEffect(() => {
    if (!tuDong.current || phienBan === 0) return;
    const id = window.setTimeout(() => {
      if (!song.current || keoRef.current) return;
      if (!coGi) { setKq(null); setTruocSau(null); return; }
      void xem("tu_dong");
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [phienBan]); // eslint-disable-line react-hooks/exhaustive-deps

  const goiY = kq?.dau_hieu_goi_y;

  const luu = () => {
    if (cu || dangTinh) return;
    const t1 = kq?.tang.find((t) => t.so === 1);
    // TY-2 gói 2: số lớp + dãy nhà chính do ENGINE đếm từ các sân → hồ sơ nhà (Tam Yếu, Nhà của bạn dùng chung).
    const ts = t1?.theo_san;
    const nhieuLop = ts && ts.so_lop >= 2 ? { so_lop: ts.so_lop, ...(ts.lop_chu ? { lop_chu: ts.lop_chu } : {}) } : null;
    const viTri: Record<string, string> = {};
    for (const v of t1?.vat ?? []) if (v.loai !== "cau_thang" && v.loai !== "ban_cong") viTri[v.loai] = v.phuong;
    const b: BoCuc = hoSo?.bo_cuc ?? {};
    // Dấu hiệu: chỉ ghi câu người dùng ĐÃ trả lời. Có → vào danh sách dấu hiệu; Không → khai rõ không có.
    // Mã từng do sơ đồ thêm (tu_so_do) mà nay không còn được gợi ý + xác nhận thì gỡ — mã tích tay ở Khảo sát không đụng.
    let boCucMoi: BoCuc | null = null;
    if (Array.isArray(goiY)) {
      const co = goiY.filter((g) => traLoi[g.ma] === true).map((g) => g.ma);
      const khong = goiY.filter((g) => traLoi[g.ma] === false).map((g) => g.ma);
      const tuSoDoCu = b.tu_so_do ?? [];
      const dauCu = b.dau_hieu ?? [];
      const dau = [...new Set([...dauCu.filter((m) => !(tuSoDoCu.includes(m) && !co.includes(m))), ...co])].filter((m) => !khong.includes(m));
      const khaiKhong = [...new Set([...(b.khai_khong ?? []).filter((m) => !co.includes(m)), ...khong])];
      const tuSoDo = co.filter((m) => tuSoDoCu.includes(m) || !dauCu.includes(m));
      const tuAnh = (b.tu_anh ?? []).filter((m) => dau.includes(m));
      const daXuLy = (b.da_xu_ly ?? []).filter((m) => !co.includes(m));
      boCucMoi = {
        ...b,
        dau_hieu: dau.length ? dau : undefined,
        khai_khong: khaiKhong.length ? khaiKhong : undefined,
        tu_so_do: tuSoDo.length ? tuSoDo : undefined,
        tu_anh: tuAnh.length ? tuAnh : undefined,
        da_xu_ly: daXuLy.length ? daXuLy : undefined,
      };
    }
    if (Object.keys(viTri).length) boCucMoi = { ...(boCucMoi ?? b), vi_tri: { ...(b.vi_tri ?? {}), ...viTri } };
    try {
      luuHoSoNha({
        tang_do: Object.entries(doTang).filter(([so, t]) => Number(so) <= soTang && Object.keys(t).length)
          .map(([so, t]) => ({ so: Number(so), vat: t })),
        ...(truc ? { truc_mau: truc } : {}),
        // Khung nhà chỉ lưu khi người dùng thật sự dùng sơ đồ (không ghi 5 × 15 mặc định vào hồ sơ).
        ...(coDiemNao ? { khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}), ...(khung.tuLuoiCu ? { tu_luoi_cu: true } : {}),
          ...(san.length ? { san } : {}) } } : {}),
        // Bỏ hết sân đã lưu → số lớp từng suy từ sân cũng hết đúng.
        ...(nhieuLop ? { nhieu_lop: nhieuLop } : !san.length && hoSo?.khung?.san?.length ? { nhieu_lop: undefined } : {}),
        ...(boCucMoi ? { bo_cuc: boCucMoi } : {}),
      });
      setDaLuu(true);
      ghi("chart_interacted", {
        mo_dun: "phongthuy", kind: "vi_tri_luu",
        so_co: (goiY ?? []).filter((g) => traLoi[g.ma] === true).length,
        so_khong: (goiY ?? []).filter((g) => traLoi[g.ma] === false).length,
        so_san: san.length, so_lop: nhieuLop?.so_lop ?? 0,
      });
    } catch { /* chế độ riêng tư */ }
  };

  const tenKq = tenTheo(kq?.ten_hien, en);
  const vatTang = VAT_TANG(tang);
  const rung = doRung(mauSong.current);
  const mucRung = rung <= 3 ? "on_dinh" : rung <= 8 ? "hoi_rung" : "nhieu";

  const chonHienTai = dangChon && doHienTai[dangChon]?.diem ? dangChon : null;
  const mucChon = chonHienTai ? hopCacPhong.find((x) => x.loai === chonHienTai) ?? null : null;
  const hopChon = mucChon?.hop ?? null;
  const coCuaChon = Boolean(chonHienTai && PHONG_CO_CUA.includes(chonHienTai));
  const donViSvg = Math.max(khung.rong, khung.sau);
  const strokeCoBan = donViSvg / 180;
  const idLuoi = `luoi-1m-${uid}`, idBien = `bien-nha-${uid}`, idSan = `san-${uid}`;

  const doiKichThuoc = (chieu: 0 | 1, buoc: number) => {
    if (!chonHienTai || !hopChon) return;
    const tran = chieu === 0 ? khung.rong : khung.sau;
    const cu: [number, number] = [hopChon.w, hopChon.h];
    cu[chieu] = lam1(Math.min(tran, Math.max(0.5, cu[chieu] + buoc)));
    suaVat(chonHienTai, (v) => ({ ...v, kich_thuoc: cu, tu_dat_kt: true }));
  };

  const nutCheDo = "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs";

  return (
    <section id="vi-tri-vat" aria-labelledby="vi-tri-vat-ten" data-testid="vi-tri-vat" className="glass rounded-2xl p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-gold">{c("dv.nhan")}</p>
      <h2 id="vi-tri-vat-ten" className="mt-1 font-serif text-xl text-fg sm:text-2xl">{c("dv.ten")}</h2>
      <p className="mt-1 text-sm text-fg-muted"><ChuB chu={c("dv.mo_ta")} /></p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={c("dv.ten")}>
        {([["la_ban", c("dv.cach_la_ban"), Compass], ["khung", c("dv.cach_khung"), Ruler]] as const).map(([m, nhan, Icon]) => (
          <button key={m} type="button" aria-pressed={cheDo === m} data-testid={`vi-tri-cach-${m}`} onClick={() => setCheDo(m)}
            className={cn(nutCheDo, cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            <Icon className="size-3.5 text-gold" aria-hidden /> {nhan}
          </button>
        ))}
      </div>

      {/* Tầng */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" role="group" aria-label={c("dv.tang_ghi_chu")}>
        <Layers className="size-3.5 text-gold" aria-hidden />
        {Array.from({ length: soTang }, (_, i) => i + 1).map((so) => (
          <button key={so} type="button" aria-pressed={tang === so} data-testid={`vi-tri-tang-${so}`}
            onClick={() => { setTang(so); setDangDat(VAT_TANG(so)[0]!); setDangChon(null); if (so !== 1) { setCheDoSan(false); setSanChon(null); } }}
            className={cn("min-h-[36px] rounded-full border px-3 py-1", tang === so ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            {c("dv.tang", { so: String(so) })}
          </button>
        ))}
        {soTang < 6 && (
          <button type="button" data-testid="vi-tri-them-tang" onClick={() => { setSoTang(soTang + 1); setTang(soTang + 1); setDangDat("cau_thang"); setDangChon(null); setCheDoSan(false); setSanChon(null); }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-fg-muted hover:text-fg">
            <Plus className="size-3.5" aria-hidden /> {c("dv.them_tang")}
          </button>
        )}
        {soTang > 1 && <span className="text-fg-faint">{c("dv.tang_ghi_chu")}</span>}
      </div>

      {cheDo === "la_ban" ? (
        <div className="mt-4 space-y-3">
          {!bat ? (
            <button type="button" data-testid="vi-tri-bat" onClick={() => void batLaBan()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25">
              <Compass className="size-4" aria-hidden /> {c("dv.bat")}
            </button>
          ) : (
            <div className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm">
              <p className="text-fg">{c("dv.dang_chi", { do: doSong == null ? "—" : String(Math.round(doSong)) })}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs">
                <span className="cham-muc size-2 rounded-full" data-muc={mucRung === "on_dinh" ? "thuan" : mucRung === "hoi_rung" ? "can_bang" : "can_chu_dong"} />
                {c(`dv.${mucRung}`)}
              </p>
              {nghieng && <p className="mt-1 text-xs text-fg-muted">{c("dv.dung_nghieng")}</p>}
            </div>
          )}
          <p className="text-xs text-fg-muted">{c("dv.cam_may")}</p>

          {tang === 1 && (
            <div className="rounded-xl border border-line/70 bg-surface/30 p-3 text-sm">
              <p className="font-medium text-fg">{c("dv.truc")}</p>
              <p className="mt-0.5 text-xs text-fg-muted">{c("dv.truc_hd")}</p>
              <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau("truc")} data-testid="vi-tri-ghi-truc"
                className="mt-2 inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-fg disabled:opacity-50">
                {dangGhi === "truc" ? c("dv.dang_ghi") : truc ? <><Check className="size-3.5 text-jade" aria-hidden /> {c("dv.da_truc")}</> : c("dv.ghi_truc")}
              </button>
            </div>
          )}

          <p className="text-sm text-fg">{c("dv.vat_hd")}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {vatTang.map((l) => {
              const v = doHienTai[l];
              return (
                <li key={l} className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-surface/40 p-2.5">
                  <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau(l)} data-testid={`vi-tri-ghi-${l}`}
                    className="min-h-[40px] flex-1 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-left text-sm text-fg disabled:opacity-50">
                    {dangGhi === l ? c("dv.dang_ghi") : v?.mau ? c("dv.da_ghi", { vat: c(`dv.ten.${l}`), do: String(Math.round(v.mau[0]!)) }) : c("dv.ghi", { vat: c(`dv.ten.${l}`) })}
                  </button>
                  {v && <button type="button" onClick={() => xoaVat(l)} aria-label={`${c("dv.xoa")} ${c(`dv.ten.${l}`)}`} className="inline-flex size-9 items-center justify-center text-fg-faint hover:text-fg"><Trash2 className="size-4" aria-hidden /></button>}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {huongNha == null && <p className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm text-fg-muted" data-testid="vi-tri-can-huong">{c("dv.can_huong")}</p>}
          <p className="text-xs text-fg-muted">{c("dv.khung_hd")}</p>

          {/* Kích thước nhà & tuỳ chọn sơ đồ */}
          <div className="flex flex-wrap items-end gap-3 text-sm">
            {(["rong", "sau"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-xs text-fg-muted">
                {c(`dv.${k}`)}
                <input type="number" min={1} max={200} step={0.5} value={khung[k]} data-testid={`vi-tri-${k}`}
                  onChange={(e) => { const n = Number(e.target.value); if (n > 0 && n <= 200) { setKhung({ ...khung, [k]: n, tuLuoiCu: false }); doiSoDo(); } }}
                  className="w-24 rounded-lg border border-line bg-bg/40 px-2 py-1.5 text-sm text-fg" />
              </label>
            ))}
            <label className="inline-flex min-h-[36px] items-center gap-2 text-xs text-fg">
              <input type="checkbox" checked={boLuoi} onChange={(e) => { setBoLuoi(e.target.checked); if (e.target.checked) { setCheDoSan(false); setSanChon(null); } }} data-testid="vi-tri-bo-luoi" />
              {c("dv.khong_vuong")}
            </label>
            <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg">
              <ImagePlus className="size-3.5" aria-hidden /> {anhNen ? c("dv.anh_doi") : c("dv.anh_dat")}
              <input type="file" accept="image/*" className="sr-only" aria-label={c("dv.anh_aria")} data-testid="vi-tri-anh-nen"
                onChange={(e) => { chonAnhNen(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <button type="button" aria-pressed={hienCuuCung} data-testid="vi-tri-luoi-cuu-cung" onClick={() => setHienCuuCung((x) => !x)}
              className={cn("inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                hienCuuCung ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              <Crosshair className="size-3.5" aria-hidden /> {c("dv.luoi_cuu_cung")}
            </button>
          </div>

          {khung.tuLuoiCu && <p className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs text-fg-muted" data-testid="vi-tri-tu-luoi-cu"><ChuB chu={c("dv.tu_luoi_cu")} /></p>}
          {anhNen && (
            <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="vi-tri-anh-dieu-khien">
              <button type="button" onClick={() => setAnhNen((a) => a && { ...a, xoay: (a.xoay + 90) % 360 })} aria-label={c("dv.anh_xoay_aria")}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg"><RotateCw className="size-3.5" aria-hidden /> {c("dv.anh_xoay")}</button>
              <label className="inline-flex items-center gap-1.5 text-fg-muted">{c("dv.anh_ro")}
                <input type="range" min={0.2} max={0.9} step={0.05} value={anhNen.mo} aria-label={c("dv.anh_ro_aria")}
                  onChange={(e) => setAnhNen((a) => a && { ...a, mo: Number(e.target.value) })} className="w-20 accent-[rgb(var(--gold))]" /></label>
              <button type="button" onClick={() => chonAnhNen(undefined)} className="min-h-[36px] text-fg-faint hover:text-fg">{c("dv.anh_bo")}</button>
              <span className="text-fg-faint">{c("dv.anh_tren_may")}</span>
            </div>
          )}

          {/* Chọn chỗ đang đặt + bỏ nhanh từng chỗ + Hoàn tác / Xoá tầng */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-fg-muted">{c("dv.dang_dat")}</span>
              {vatTang.map((l) => {
                const daDat = Boolean(doHienTai[l]?.diem);
                const dangActive = dangDat === l && !boLuoi && !cheDoSan;
                return (
                  <span key={l} className={cn(
                    "inline-flex min-h-[36px] items-center rounded-full border transition-colors",
                    dangActive ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg",
                    daDat && "font-medium",
                  )}>
                    <button type="button" aria-pressed={dangActive} data-testid={`vi-tri-dat-${l}`}
                      onClick={() => { setDangDat(l); setBoLuoi(false); setCheDoSan(false); setSanChon(null); if (daDat) setDangChon(l); }}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 py-1">
                      <span className="size-2 rounded-sm" style={{ backgroundColor: MAU_PHONG[l].stroke }} aria-hidden />
                      {c(`dv.ten.${l}`)}{daDat ? " ✓" : ""}
                    </button>
                    {daDat && (
                      <button type="button" data-testid={`vi-tri-xoa-chip-${l}`} onClick={() => xoaVat(l)}
                        aria-label={`${c("dv.xoa")} ${c(`dv.ten.${l}`)}`}
                        className="inline-flex size-9 items-center justify-center rounded-full text-fg-faint hover:bg-surface/80 hover:text-fg">
                        <X className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={!lichSu.length} onClick={hoanTac} data-testid="vi-tri-hoan-tac"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-40">
                <Undo2 className="size-3.5" aria-hidden /> {c("dv.hoan_tac")}
              </button>
              <button type="button" disabled={!Object.keys(doHienTai).length} onClick={xoaTangHienTai} data-testid="vi-tri-xoa-tang"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-40">
                <Trash2 className="size-3.5" aria-hidden /> {c("dv.xoa_tang")}
              </button>
            </div>
          </div>

          {/* TY-2 gói 2: sân / giếng trời — chỉ tầng 1 (sách đo theo sân của dãy nhà trệt) */}
          {tang === 1 && (
            <div className="space-y-1.5">
              <button type="button" aria-pressed={cheDoSan} data-testid="vi-tri-che-do-san"
                onClick={() => { setCheDoSan((x) => !x); setBoLuoi(false); setSanChon(null); setDangChon(null); setBaoSan(null); }}
                className={cn("inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                  cheDoSan ? "border-jade bg-jade/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                <Sun className="size-3.5 text-jade" aria-hidden /> {c("dv.san.nut")}{san.length ? ` (${san.length})` : ""}
              </button>
              {cheDoSan && <p className="text-[11px] text-fg-muted" data-testid="vi-tri-san-hd">{c("dv.san.hd")}</p>}
              {baoSan && <p className="text-[11px] text-fg-muted" role="status" data-testid="vi-tri-san-bao">{baoSan}</p>}
            </div>
          )}

          <p className="text-[11px] text-fg-faint">{cheDoSan ? c("dv.san.phim") : <>{c("dv.meo_keo")} {c("dv.phim")}</>}</p>

          {/* Sơ đồ nhà theo tỉ lệ */}
          <div className="mx-auto w-full max-w-lg rounded-2xl border border-line/60 bg-bg/50 p-3 sm:p-4">
            <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-gold">
              ▲ {c("dv.mat_truoc")}{huongNha != null ? ` · ${Math.round(huongNha)}°` : ""} · {khung.rong}m × {khung.sau}m
            </p>
            <div className="relative mx-auto" style={{ aspectRatio: `${khung.rong} / ${khung.sau}`, width: `min(100%, calc(62vh * ${khung.rong / khung.sau}))` }}>
            {anhNen && (
              <canvas ref={canvasAnh} aria-hidden data-testid="vi-tri-anh-canvas" data-xoay={anhNen.xoay}
                className="pointer-events-none absolute inset-0 size-full object-contain" style={{ opacity: anhNen.mo }} />
            )}
            <svg ref={svgRef} viewBox={`0 0 ${khung.rong} ${khung.sau}`} preserveAspectRatio="xMidYMid meet" data-testid="vi-tri-khung"
              className="relative block size-full touch-none select-none overflow-visible"
              onPointerDown={datDiem}
              onPointerMove={diChuyenKeo}
              onPointerUp={ketThucKeo}
              onPointerCancel={ketThucKeo}
              onLostPointerCapture={xongKeo}
              role="group" aria-label={c("dv.so_do_aria")}>
              <defs>
                <pattern id={idLuoi} width="1" height="1" patternUnits="userSpaceOnUse">
                  <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgb(var(--line) / 0.25)" strokeWidth={strokeCoBan * 0.45} />
                </pattern>
                <clipPath id={idBien}><rect x={0} y={0} width={khung.rong} height={khung.sau} /></clipPath>
                <pattern id={idSan} width={donViSvg / 28} height={donViSvg / 28} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1={0} y1={0} x2={0} y2={donViSvg / 28} stroke="rgb(var(--jade) / 0.45)" strokeWidth={strokeCoBan * 0.8} />
                </pattern>
              </defs>

              {/* Nền & lưới 1 m */}
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill={anhNen ? "rgb(var(--surface) / 0.12)" : "rgb(var(--surface) / 0.55)"} />
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill={`url(#${idLuoi})`} pointerEvents="none" />

              {/* Ô không xây (nhà chữ L…) */}
              {khung.luoi && khung.luoi.map((row, i) => row.map((v, j) => !v ? (
                <rect key={`${i}-${j}`} x={(j * khung.rong) / nCot} y={(i * khung.sau) / nHang} width={khung.rong / nCot} height={khung.sau / nHang}
                  fill="rgb(var(--bg))" stroke="rgb(var(--line) / 0.5)" strokeWidth={strokeCoBan * 0.6} pointerEvents="none" />
              ) : null))}

              {/* Lưới (4×4, hoặc đúng cỡ lưới cũ) khi đang bỏ phần không xây */}
              {boLuoi && (
                <g stroke="rgb(var(--gold) / 0.45)" strokeWidth={strokeCoBan * 0.7} strokeDasharray={`${strokeCoBan * 3} ${strokeCoBan * 2}`} pointerEvents="none">
                  {Array.from({ length: nCot - 1 }, (_, i) => i + 1).map((i) => <line key={`c${i}`} x1={(i * khung.rong) / nCot} y1={0} x2={(i * khung.rong) / nCot} y2={khung.sau} />)}
                  {Array.from({ length: nHang - 1 }, (_, i) => i + 1).map((i) => <line key={`h${i}`} x1={0} y1={(i * khung.sau) / nHang} x2={khung.rong} y2={(i * khung.sau) / nHang} />)}
                </g>
              )}

              {/* TY-2 gói 2: dải sân / giếng trời + nhãn "Lớp n" (chỉ là hình vẽ — số lớp thật do máy chủ đếm) */}
              {tang === 1 && san.length > 0 && khoiVe(san).map(([a, b], i) => {
                const h = (b - a) * khung.sau;
                const fs = Math.max(0.22, Math.min(0.42, h * 0.35, donViSvg / 28));
                return h >= fs * 1.8 ? (
                  <text key={`lop${i}`} x={strokeCoBan * 3} y={a * khung.sau + fs * 1.25} fontSize={fs} fill="rgb(var(--fg-muted))"
                    opacity={0.75} pointerEvents="none" data-testid={`vi-tri-lop-ve-${i + 1}`}
                    style={{ paintOrder: "stroke", stroke: "rgb(var(--bg) / 0.8)", strokeWidth: fs * 0.2 }}>
                    {c("dv.san.lop", { so: String(i + 1) })}
                  </text>
                ) : null;
              })}
              {tang === 1 && san.map(([a, b], i) => {
                const y0 = a * khung.sau, h = (b - a) * khung.sau;
                const chon = cheDoSan && sanChon === i;
                const fs = Math.max(0.22, Math.min(0.45, h * 0.55, donViSvg / 26));
                const tay = Math.max(0.3, donViSvg / 34);
                const rongTay = Math.min(khung.rong * 0.5, 2.4);
                return (
                  <g key={`san${i}`} data-testid={`vi-tri-san-${i + 1}`} role="button" tabIndex={cheDoSan ? 0 : -1} aria-pressed={chon}
                    aria-label={c("dv.san.aria", { so: String(i + 1), tu: String(lam1(y0)), den: String(lam1(b * khung.sau)) })}
                    className={cn("outline-none", cheDoSan && "cursor-grab active:cursor-grabbing")}
                    style={{ pointerEvents: cheDoSan ? "auto" : "none" }}
                    onPointerDown={(e) => batDauKeoSan(e, i, null)}
                    onKeyDown={(e) => phimTrenSan(e, i)}>
                    <rect x={0} y={y0} width={khung.rong} height={h} fill="rgb(var(--jade) / 0.08)" />
                    <rect x={0} y={y0} width={khung.rong} height={h} fill={`url(#${idSan})`}
                      stroke={chon ? "rgb(var(--gold))" : "rgb(var(--jade) / 0.7)"} strokeWidth={chon ? strokeCoBan * 1.4 : strokeCoBan * 0.7}
                      strokeDasharray={chon ? undefined : `${strokeCoBan * 3} ${strokeCoBan * 2}`} />
                    {h >= fs * 1.3 && (
                      <text x={khung.rong - strokeCoBan * 3} y={y0 + h / 2 + fs * 0.35} textAnchor="end" fontSize={fs} fontWeight={600}
                        fill="rgb(var(--fg))" pointerEvents="none" style={{ paintOrder: "stroke", stroke: "rgb(var(--bg) / 0.85)", strokeWidth: fs * 0.2 }}>
                        {c("dv.san.nhan", { so: String(i + 1) })}
                      </text>
                    )}
                    {chon && (["tren", "duoi"] as const).map((mep) => {
                      const yM = mep === "tren" ? y0 : y0 + h;
                      return (
                        <g key={mep}>
                          <rect x={(khung.rong - rongTay) / 2 - tay} y={yM - tay} width={rongTay + tay * 2} height={tay * 2} fill="transparent"
                            className="cursor-ns-resize" data-testid={`vi-tri-san-mep-${mep}`} onPointerDown={(e) => batDauKeoSan(e, i, mep)} />
                          <rect x={(khung.rong - rongTay) / 2} y={yM - tay * 0.3} width={rongTay} height={tay * 0.6} rx={tay * 0.3}
                            fill="rgb(var(--gold))" stroke="rgb(var(--bg))" strokeWidth={strokeCoBan * 0.5} pointerEvents="none" />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Đo theo sân (engine): mỗi chỗ nối nét đứt về giữa sân dùng để đo — chỉ vẽ lại số máy chủ trả */}
              {tang === 1 && !cu && (() => {
                const ts = kq?.tang.find((t) => t.so === 1)?.theo_san;
                if (!ts) return null;
                return (
                  <g pointerEvents="none" data-testid="vi-tri-san-do">
                    {([["cua", "cua_chinh", -1], ["chu", "phong_ngu_chinh", 0], ["bep", "bep", 1]] as const).map(([k, loai, lech]) => {
                      const sd = ts.san_do[k];
                      const d = san[(sd ?? 0) - 1];
                      const p = doTang[1]?.[loai]?.diem;
                      if (!sd || !d || !p) return null;
                      const tx = khung.rong / 2 + lech * Math.min(0.5, khung.rong / 8), ty = ((d[0] + d[1]) / 2) * khung.sau;
                      return (
                        <g key={k} data-testid={`vi-tri-san-do-${k}`}>
                          <line x1={tx} y1={ty} x2={p[0] * khung.rong} y2={p[1] * khung.sau} stroke={MAU_PHONG[loai].stroke}
                            strokeOpacity={0.7} strokeWidth={strokeCoBan * 0.7} strokeDasharray={`${strokeCoBan * 2} ${strokeCoBan * 1.5}`} />
                          <circle cx={tx} cy={ty} r={strokeCoBan * 1.8} fill={MAU_PHONG[loai].stroke} stroke="rgb(var(--bg))" strokeWidth={strokeCoBan * 0.5} />
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Tâm nhà (máy chủ trả với nhà bỏ ô) + 8 tia ranh phương theo hướng nhà đã đo — chỉ là hình vẽ; phương từng chỗ do máy chủ chốt */}
              {hienCuuCung && tamVe && (
                <g pointerEvents="none" opacity={0.7} data-testid="vi-tri-tam" data-nguon={luoiGui ? "may_chu" : "giua"}>
                  {huongNha != null && RANH_8.map((deg) => {
                    const rad = ((deg - huongNha) * Math.PI) / 180;       // mặt trên bản vẽ = mặt trước nhà
                    const tx = tamVe[0] * khung.rong, ty = tamVe[1] * khung.sau;
                    const R = donViSvg * 1.5;
                    return (
                      <line key={deg} x1={tx} y1={ty} x2={tx + Math.sin(rad) * R} y2={ty - Math.cos(rad) * R}
                        stroke="rgb(var(--gold) / 0.22)" strokeWidth={strokeCoBan * 0.45} clipPath={`url(#${idBien})`} />
                    );
                  })}
                  <circle cx={tamVe[0] * khung.rong} cy={tamVe[1] * khung.sau} r={strokeCoBan * 2.2} fill="none" stroke="rgb(var(--gold) / 0.75)" strokeWidth={strokeCoBan * 0.7} />
                  <circle cx={tamVe[0] * khung.rong} cy={tamVe[1] * khung.sau} r={strokeCoBan * 0.7} fill="rgb(var(--gold))" />
                </g>
              )}

              {/* Tường bao */}
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill="none" stroke="rgb(var(--gold) / 0.75)" strokeWidth={strokeCoBan * 1.2} pointerEvents="none" />

              {/* Hộp từng chỗ + ký hiệu cửa + tay kéo chỉnh kích thước */}
              {hopCacPhong.map(({ loai, v, hop }) => {
                const mau = MAU_PHONG[loai];
                const isSelected = chonHienTai === loai;
                const fontSize = Math.max(0.28, Math.min(0.62, Math.min(hop.w * 0.24, hop.h * 0.32, donViSvg / 24)));
                const handleSize = Math.max(0.26, Math.min(0.5, donViSvg / 32));
                const hienKt = Boolean(v.tu_dat_kt) && hop.h >= fontSize * 2.6 && hop.w >= fontSize * 3.2;
                const vt = viTriTuongDoi(v.diem!);
                return (
                  <g key={loai} data-testid={`vi-tri-hop-${loai}`} tabIndex={0} role="button"
                    aria-label={c("dv.hop_aria", { vat: c(`dv.ten.${loai}`), doc: c(`dv.vt.doc.${vt.doc}`), ngang: c(`dv.vt.ngang.${vt.ngang}`) })}
                    aria-pressed={isSelected}
                    className={cn("outline-none", !boLuoi && !cheDoSan && "cursor-grab active:cursor-grabbing")}
                    style={cheDoSan ? { pointerEvents: "none", opacity: 0.55 } : undefined}
                    onPointerDown={(e) => batDauKeo(e, loai, hop)}
                    onKeyDown={(e) => phimTrenHop(e, loai)}
                    onFocus={(e) => { let ban = true; try { ban = e.currentTarget.matches(":focus-visible"); } catch { /* trình duyệt cũ */ } if (ban) setTieuDiem(loai); }}
                    onBlur={() => setTieuDiem((x) => (x === loai ? null : x))}>
                    <rect x={hop.x0} y={hop.y0} width={hop.w} height={hop.h} rx={strokeCoBan * 1.5}
                      fill={mau.fill}
                      stroke={isSelected ? "rgb(var(--gold))" : mau.stroke}
                      strokeWidth={isSelected ? strokeCoBan * 1.6 : strokeCoBan * 0.95} />
                    {tieuDiem === loai && (
                      <rect x={hop.x0 - strokeCoBan * 2} y={hop.y0 - strokeCoBan * 2} width={hop.w + strokeCoBan * 4} height={hop.h + strokeCoBan * 4}
                        rx={strokeCoBan * 2.5} fill="none" stroke="rgb(var(--fg))" strokeWidth={strokeCoBan * 0.9}
                        strokeDasharray={`${strokeCoBan * 3} ${strokeCoBan * 2}`} pointerEvents="none" data-testid={`vi-tri-tieu-diem-${loai}`} />
                    )}
                    {PHONG_CO_CUA.includes(loai) && <KyHieuCua hop={hop} mau={mau.stroke} strokeW={strokeCoBan} tam={!v.tu_dat_cua} />}
                    <text x={hop.cx} y={hienKt ? hop.cy - fontSize * 0.25 : hop.cy + fontSize * 0.34}
                      textAnchor="middle" fontSize={fontSize} fontWeight={600}
                      fill="rgb(var(--fg))" pointerEvents="none"
                      style={{ paintOrder: "stroke", stroke: "rgb(var(--bg) / 0.85)", strokeWidth: fontSize * 0.22 }}>
                      {c(`dv.tat.${loai}`)}
                    </text>
                    {hienKt && (
                      <text x={hop.cx} y={hop.cy + fontSize * 0.95}
                        textAnchor="middle" fontSize={fontSize * 0.68}
                        fill="rgb(var(--fg))" pointerEvents="none"
                        style={{ paintOrder: "stroke", stroke: "rgb(var(--bg) / 0.85)", strokeWidth: fontSize * 0.16 }}>
                        {hop.w}×{hop.h}m
                      </text>
                    )}
                    {isSelected && !boLuoi && !cheDoSan && (
                      <g>
                        <rect
                          x={hop.x0 + hop.w - handleSize * 1.1}
                          y={hop.y0 + hop.h - handleSize * 1.1}
                          width={handleSize * 2.2}
                          height={handleSize * 2.2}
                          fill="transparent"
                          className="cursor-nwse-resize"
                          data-testid={`vi-tri-resize-${loai}`}
                          onPointerDown={(e) => batDauResize(e, loai, hop)}
                        />
                        <rect
                          x={hop.x0 + hop.w - handleSize / 2}
                          y={hop.y0 + hop.h - handleSize / 2}
                          width={handleSize}
                          height={handleSize}
                          rx={handleSize * 0.2}
                          fill="rgb(var(--gold))"
                          stroke="rgb(var(--bg))"
                          strokeWidth={strokeCoBan * 0.6}
                          pointerEvents="none"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
            </div>
            {hienCuuCung && !tamVe && <p className="mt-2 text-center text-[11px] text-fg-muted" data-testid="vi-tri-tam-can-xem">{c("dv.tam_can_xem")}</p>}
          </div>

          {/* Sân đang chọn: rộng theo chiều sâu (±0,5 m), bỏ */}
          {cheDoSan && sanChon != null && san[sanChon] && (
            <div data-testid="vi-tri-san-chon" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-jade/50 bg-surface/60 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Sun className="size-3.5 text-jade" aria-hidden />
                <span className="font-medium text-fg">{c("dv.san.nhan", { so: String(sanChon + 1) })}</span>
                <span className="text-fg-muted">{c("dv.san.cao")}</span>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-line bg-bg/40 px-0.5">
                  <button type="button" aria-label={c("dv.san.hep")} data-testid="vi-tri-san-cao-giam" onClick={() => suaSan((ds) => doiCao(ds, sanChon, -0.5, khung.sau))}
                    className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface"><Minus className="size-3" aria-hidden /></button>
                  <span className="min-w-[3rem] text-center font-medium text-fg" data-testid="vi-tri-san-cao">{lam1((san[sanChon]![1] - san[sanChon]![0]) * khung.sau)}m</span>
                  <button type="button" aria-label={c("dv.san.rong")} data-testid="vi-tri-san-cao-tang" onClick={() => suaSan((ds) => doiCao(ds, sanChon, 0.5, khung.sau))}
                    className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface"><Plus className="size-3" aria-hidden /></button>
                </span>
              </div>
              <button type="button" data-testid="vi-tri-san-xoa" onClick={() => xoaDaiSan(sanChon)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
                <Trash2 className="size-3.5" aria-hidden /> {c("dv.xoa")}
              </button>
            </div>
          )}

          {/* Chỗ đang chọn: phía cửa (chỉ phía trên bản vẽ — không đổi ra độ), kích thước, bỏ */}
          {!cheDoSan && chonHienTai && hopChon && mucChon && (
            <div data-testid="vi-tri-chinh-phong" className="rounded-xl border border-gold/40 bg-surface/60 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: MAU_PHONG[chonHienTai].stroke }} aria-hidden />
                  <span className="font-medium text-fg">{c(`dv.ten.${chonHienTai}`)}</span>
                  {coCuaChon && mucChon.v.tu_dat_cua && (
                    <span className="rounded-full border border-line bg-bg/50 px-2 py-0.5 text-fg-muted" data-testid="vi-tri-huong-cua-nhan">
                      {c("dv.cua_mo", { huong: c(`dv.cua_huong.${hopChon.huongCua}`) })}
                    </span>
                  )}
                </div>
                <button type="button" data-testid="vi-tri-xoa-chon" onClick={() => xoaVat(chonHienTai)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
                  <Trash2 className="size-3.5" aria-hidden /> {c("dv.xoa")}
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {coCuaChon && (
                  <button type="button" data-testid="vi-tri-xoay-cua"
                    onClick={() => {
                      // Mỗi lần bấm xoay sang phía kế; từ lần bấm đầu, phía cửa là điều người dùng tự chọn (vẽ nét liền, được gửi đi).
                      const ke = xoayHuongCua(hopChon.huongCua);
                      suaVat(chonHienTai, (v) => ({ ...v, huong_cua: ke, tu_dat_cua: true }));
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25">
                    <RotateCw className="size-3.5" aria-hidden /> {c("dv.xoay_cua")}
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg-muted">{c("dv.kich_thuoc_phong")}</span>
                  {([[0, "rong", hopChon.w], [1, "sau", hopChon.h]] as const).map(([chieu, ten, gia], i) => (
                    <span key={ten} className="inline-flex items-center gap-1">
                      {i === 1 && <span className="text-fg-faint" aria-hidden>×</span>}
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-line bg-bg/40 px-0.5">
                        <button type="button" aria-label={c("dv.giam", { chieu: c(`dv.${ten}`) })} data-testid={`vi-tri-phong-${ten}-giam`}
                          onClick={() => doiKichThuoc(chieu, -0.5)}
                          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface"><Minus className="size-3" aria-hidden /></button>
                        <span className="min-w-[3rem] text-center font-medium text-fg" data-testid={`vi-tri-phong-${ten}`}>{gia}m</span>
                        <button type="button" aria-label={c("dv.tang_len", { chieu: c(`dv.${ten}`) })} data-testid={`vi-tri-phong-${ten}-tang`}
                          onClick={() => doiKichThuoc(chieu, 0.5)}
                          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface"><Plus className="size-3" aria-hidden /></button>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              {coCuaChon && !mucChon.v.tu_dat_cua && <p className="mt-2 text-fg-faint" data-testid="vi-tri-cua-chua-dat">{c("dv.cua_chua_dat")}</p>}
            </div>
          )}
        </div>
      )}

      {loi && <p className="mt-3 text-sm text-fg-muted" role="status" data-testid="vi-tri-loi">{loi}</p>}

      <div className="mt-4">
        <button type="button" disabled={!coGi || dangTinh} onClick={() => void xem()} data-testid="vi-tri-xem"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50">
          {dangTinh ? c("dv.dang_tinh") : c("dv.xem")}
        </button>
      </div>

      {kq && (
        <div className={cn("mt-5 space-y-5 transition-opacity motion-reduce:transition-none", cu && "opacity-60")} data-testid="vi-tri-ket-qua"
          data-cu={cu ? "1" : "0"} aria-busy={cu || dangTinh}>
          <p className="text-xs text-fg-muted" aria-live="polite">{kq.lech.loi}</p>
          <p className="text-[11px] text-fg-faint" data-testid="vi-tri-tu-cap-nhat" aria-live="polite">
            {cu ? c("dv.dang_cap_nhat") : c("dv.tu_cap_nhat")}
          </p>
          {truocSau && !cu && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-fg" data-testid="vi-tri-truoc-sau" role="status">
              <span className="text-fg-muted">{c(truocSau.phan === "san" ? "dv.ts.san" : "dv.ts.tang")}</span>
              <span>{c("dv.ts.truoc_sau", { truoc: mucChu(truocSau.truoc, en, c), sau: mucChu(truocSau.sau, en, c) })}</span>
              {lichSu.length > 0 && (
                <button type="button" onClick={hoanTac} data-testid="vi-tri-truoc-sau-hoan-tac" className="min-h-9 text-gold underline underline-offset-2">
                  {c("dv.hoan_tac")}
                </button>
              )}
            </p>
          )}
          {kq.tang.map((t) => (
            <div key={t.so} className="space-y-3" data-testid={`vi-tri-kq-tang-${t.so}`}>
              <h3 className="text-base font-medium text-fg">{c("dv.tang", { so: String(t.so) })}</h3>
              {t.ghi_chu_cua && <p className="text-xs text-fg-faint">{t.ghi_chu_cua}</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.vat.map((v) => (
                  <li key={v.loai} className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" data-testid={`vi-tri-vat-${v.loai}`}>
                    <p className="font-medium text-fg">{v.ten} · {c("dv.phia", { huong: tenKq("huong", v.phuong) })}</p>
                    <p className="text-xs text-fg-muted">{Math.round(v.do)}° · {c("dv.son", { son: tenKq("son", v.son) })}</p>
                    {v.du_nien_menh && (
                      <p className="mt-1 text-xs"><span className="chip-muc rounded-full border px-2 py-0.5" data-muc={v.du_nien_menh.cat ? "thuan" : "can_chu_dong"}>
                        {c("dv.voi_menh", { du_nien: tenKq("du_nien", v.du_nien_menh.du_nien) })}</span></p>
                    )}
                    {v.sao && <p className="mt-1 text-xs text-fg-muted">{c("dv.sao", { van: String(v.sao.van), son: String(v.sao.son), huong: String(v.sao.huong) })}</p>}
                    {v.canh_bao.map((x, i) => <p key={i} className="mt-1 text-xs text-fg-muted">{x}</p>)}
                  </li>
                ))}
              </ul>
              {t.tam_yeu ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-fg">{c("dv.ket_qua_tang", { so: String(t.so) })}</p>
                  <KetQuaTamYeu kq={t.tam_yeu} />
                </div>
              ) : t.chua_du ? <p className="text-xs text-fg-faint">{t.chua_du}</p> : null}
              {t.theo_san && (
                <div className="space-y-3 rounded-xl border border-jade/40 bg-jade/[0.04] p-3" data-testid="vi-tri-theo-san">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-fg"><Sun className="size-4 text-jade" aria-hidden /> {c("dv.san.tieu_de")}</p>
                  <p className="text-xs text-fg-muted">{t.theo_san.ghi_chu}</p>
                  <ul className="flex flex-wrap gap-1.5 text-xs">
                    <li className="rounded-full border border-line bg-bg/40 px-2.5 py-1 text-fg" data-testid="vi-tri-theo-san-so-lop">{c("dv.san.so_lop", { so: String(t.theo_san.so_lop) })}</li>
                    <li className="rounded-full border border-line bg-bg/40 px-2.5 py-1 text-fg" data-testid="vi-tri-theo-san-lop-chu">
                      {t.theo_san.lop_chu ? c("dv.san.lop_chu", { so: String(t.theo_san.lop_chu) }) : c("dv.san.lop_chu_chua")}
                    </li>
                  </ul>
                  <ul className="grid gap-1.5 text-xs sm:grid-cols-3">
                    {([["cua", "cua_chinh"], ["chu", "phong_ngu_chinh"], ["bep", "bep"]] as const).map(([k, loai]) => {
                      const h = t.theo_san!.huong[k];
                      const sd = t.theo_san!.san_do[k];
                      return h ? (
                        <li key={k} className="rounded-lg border border-line/70 bg-surface/40 px-2.5 py-1.5" data-testid={`vi-tri-theo-san-${k}`}>
                          <span className="font-medium text-fg">{c(`dv.ten.${loai}`)}</span>
                          <span className="text-fg-muted"> · {c("dv.phia", { huong: tenKq("huong", h) })}</span>
                          {sd ? <span className="block text-fg-faint">{c("dv.san.do_tu", { so: String(sd) })}</span> : null}
                        </li>
                      ) : null;
                    })}
                  </ul>
                  <KetQuaTamYeu kq={t.theo_san.tam_yeu} />
                  {t.theo_san.nhieu_lop && <KetQuaNhieuLop nl={t.theo_san.nhieu_lop} />}
                </div>
              )}
            </div>
          ))}

          {/* SD-1: dấu hiệu máy chủ gợi ý từ sơ đồ — người dùng trả lời Có / Không, bấm Lưu mới ghi */}
          {goiY && goiY.length > 0 && (
            <div data-testid="vi-tri-goi-y" className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm">
              <p className="font-medium text-fg">{c("dv.gy.tieu_de")}</p>
              <ul className="mt-2 space-y-2">
                {goiY.map((g) => {
                  const tl = traLoi[g.ma];
                  const dat = (gia: boolean) => {
                    setTraLoi((cu) => {
                      if (cu[g.ma] === gia) { const m = { ...cu }; delete m[g.ma]; return m; }     // bấm lại = bỏ trả lời
                      return { ...cu, [g.ma]: gia };
                    });
                    setDaLuu(false);
                    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_goi_y", ma: g.ma, co: gia ? 1 : 0 });
                  };
                  return (
                    <li key={g.ma} className="rounded-lg border border-line/60 bg-surface/40 px-3 py-2" data-testid={`vi-tri-gy-${g.ma}`}>
                      <p className="text-fg">
                        {g.hoi}
                        {soTang > 1 && <span className="ml-1.5 text-xs text-fg-faint">({c("dv.tang", { so: String(g.tang) })})</span>}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <button type="button" aria-pressed={tl === true} onClick={() => dat(true)} data-testid={`vi-tri-gy-co-${g.ma}`}
                          className={cn("inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1", tl === true ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                          <Check className="size-3" aria-hidden /> {c("dv.gy.co")}
                        </button>
                        <button type="button" aria-pressed={tl === false} onClick={() => dat(false)} data-testid={`vi-tri-gy-khong-${g.ma}`}
                          className={cn("inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1", tl === false ? "border-moon bg-moon/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                          <X className="size-3" aria-hidden /> {c("dv.gy.khong")}
                        </button>
                        {g.nen_xu_ly_truoc && <span className="rounded-full border border-gold/50 px-2 py-0.5 text-gold" data-testid={`vi-tri-gy-truoc-${g.ma}`}>{c("dv.gy.truoc")}</span>}
                        {typeof g.trang === "string" && g.trang.startsWith("/") && !g.trang.startsWith("//") && (
                          <Link href={g.trang} className="inline-flex min-h-9 items-center text-gold underline">{c("dv.gy.doc_ky")}</Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-fg-faint">{c("dv.gy.ghi_chu")}</p>
            </div>
          )}

          {kq.tang.find((t) => t.tam_yeu)?.tam_yeu ? (
            <SachTamYeu kq={kq.tang.find((t) => t.tam_yeu)!.tam_yeu!} coNamSinh={Boolean(sinh)} du18={du18} onDu18={setDu18} />
          ) : <p className="text-[11px] leading-relaxed text-fg-faint">{kq.luu_y_tham_khao}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={luu} data-testid="vi-tri-luu" disabled={cu || dangTinh}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25 disabled:opacity-50">
              {daLuu ? <><Check className="size-3.5" aria-hidden /> {c("dv.da_luu")}</> : c("dv.luu")}
            </button>
            {daLuu && henVe && (
              <button type="button" onClick={() => { veCauTraLoi(); }} data-testid="vi-tri-ve-cau-tra-loi"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 py-1 font-medium text-fg hover:border-gold/60">
                {c("dv.ve_cau_tra_loi")}
              </button>
            )}
            <span className="text-fg-faint">{c("dv.luu_ghi_chu")}</span>
          </div>
        </div>
      )}
    </section>
  );
}
