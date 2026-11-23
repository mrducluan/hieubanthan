"use client";
// CT-2 / Upgrade — "Chụp lòng bàn tay" ở ĐẦU trang Xem chỉ tay. Hỗ trợ tải/chụp ĐỘC LẬP HAI BÀN TAY:
// Tay Trái (Tiên Thiên · Bản tính gốc) và Tay Phải (Hậu Thiên · Hiện tại & hành động).
// Ảnh chỉ hiện bằng `blob:` trên máy (giải mã lại qua canvas — xoay đúng chiều, bỏ EXIF), KHÔNG tải lên.
// MediaPipe Hand Landmarker chạy trên trình duyệt → 21 toạ độ 2D + 3D worldLandmarks + tín hiệu đường chỉ ROI tham khảo
// → gửi `/api/chi-tay/luan-giai-hai-tay` (dự phòng `/api/chi-tay/do-tay`) sau thoả thuận `ct1`.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Camera, Check, Compass, Eye, EyeOff, Hand, ImagePlus, Loader2, RotateCcw, ShieldCheck, Sparkles, Sun, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { urlAnhSach } from "@/lib/anh-tren-may";
import { DONG_Y_CHI_TAY, ngayDongYAnhMat } from "@/lib/dong-y-anh-mat";
import type { DiemTay, DiemTay3D, KetQuaTimTay } from "@/lib/ban-tay-tu-dong";
import type { KetQuaDuongChiCV } from "@/lib/duong-chi-tay-cv";
import { datCung, datTay, useChonChiTay, type Tay } from "@/lib/chi-tay-chon";
import { usePhaiChiTay } from "@/lib/chi-tay-phai";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";
import { TheDangBanTayFuzzy, type FuzzyTayBridge } from "@/components/nhan-tuong/TheFuzzyTuong";

interface LuaChonCung { ma: string; ten: string }
export interface CungTay { ma: string; han: string; ten: string; ten_ngan?: string; vt: [number, number]; y: string; lua_chon: LuaChonCung[] }
interface NhanDo { ma: string; ten: string; y?: string; vua?: boolean }
interface SachGhiDo { ma: string; han?: string; nhom?: string; loi: string; viec?: string }
interface MucTay { ma: string; ten: string; loi: string; viec?: string; trich?: string; nguon_hien_thi?: string; nhom?: string }
interface DuongKinhDien {
  ma: string; ten: string; mat_tich_cuc: string; mat_tieu_cuc_can_chu_y: string;
  trich?: string; nguon?: string;
  tin_hieu_cv?: { do_ro?: number; chieu_dai_uoc_luong?: number; do_cong?: number };
  do_tin_cv?: string;
}
interface GoKinhDien {
  ma: string; ten: string; mat_tich_cuc: string; mat_tieu_cuc_can_chu_y: string;
  cung_dong?: string | null; han_dong?: string | null; ten_cung_dong?: string | null; vi_tri?: string | null;
  trich?: string; nguon?: string;
}
interface ChiSoMoRongItem {
  ma: string; nhom: string; ten: string;
  gia_tri: number | { dot_goc: number; dot_giua: number; dot_dau: number };
  y: string; luu_y?: string; do_tin?: string;
}
export interface KqDoTay {
  hop_le: boolean; loi: string | null; loi_nhac?: string | null; loi_chu?: string; phai?: "tay" | "hop_nhat";
  nhan?: NhanDo[]; sach_ghi?: SachGhiDo[]; cung?: CungTay[]; bo_nhom_c?: number; cau_ket?: string;
  muc?: MucTay[]; to_hop?: { ma: string; ten: string } | null; goi_y_dang?: string[];
  fuzzy_bridge?: FuzzyTayBridge | null;
  duong_kinh_dien?: DuongKinhDien[];
  bay_go_kinh_dien?: GoKinhDien[];
  chi_so_mo_rong?: ChiSoMoRongItem[];
  truong_phai?: string[];
}
interface TomTatMotTayApi {
  tay: Tay;
  hop_le: boolean;
  loi: string | null;
  loi_nhac?: string | null;
  nhan_dong?: NhanDo[];
  nhan_tay?: NhanDo[];
  cung?: CungTay[];
  fuzzy_bridge?: FuzzyTayBridge | null;
}
interface SoSanhHaiTayApi {
  chenh_rong_long: number;
  chenh_ngon_giua: number;
  chenh_tro_ap_ut: number;
  hanh_trai?: string | null;
  hanh_phai?: string | null;
  ten_hanh_trai?: string;
  ten_hanh_phai?: string;
  chuyen_dich_hanh: boolean;
  muc_tuong_dong: number;
  nhan_xet: string;
  do_tin?: string;
}
interface LuanGiaiHaiTayApi {
  tay_trai?: TomTatMotTayApi | null;
  tay_phai?: TomTatMotTayApi | null;
  so_sanh_hai_tay?: SoSanhHaiTayApi | null;
  luan_giai_dong?: KqDoTay | null;
  luan_giai_tay?: (KqDoTay & {
    duong_kinh_dien?: DuongKinhDien[];
    bay_go_kinh_dien?: GoKinhDien[];
    chi_so_mo_rong?: ChiSoMoRongItem[];
    truong_phai?: string[];
  }) | null;
  tong_hop_dong_tay?: {
    tom_tat: string;
    diem_chung: string[];
    do_tin?: { hinh_hoc?: string; bon_nguyen_to?: string; duong_chi_cv?: string };
    ghi_chu?: string;
  } | null;
}

interface TrangThaiMotTay {
  url: string | null;
  tyLe: number | null;
  diem: DiemTay[] | null;
  diem3d: DiemTay3D[] | null;
  tayMp: "Left" | "Right" | null;
  duongChi: KetQuaDuongChiCV | null;
  tim: null | "dang" | Exclude<KetQuaTimTay["trang_thai"], "xong">;
  kq: KqDoTay | null;
  loi: string | null;
}

const RONG_MOT_TAY: TrangThaiMotTay = {
  url: null, tyLe: null, diem: null, diem3d: null, tayMp: null, duongChi: null, tim: null, kq: null, loi: null,
};

const TEN_DANG: Record<string, string> = { vuong: "Tay vuông", be: "Tay bè", triet: "Tay nhiều khớp", thon: "Tay thon dài" };
const MO_TA_TAY: Record<Tay, { tieuDe: string; phuDe: string; tenNgan: string }> = {
  trai: { tieuDe: "Tay Trái", phuDe: "Tiên Thiên · Bản tính gốc", tenNgan: "tay trái" },
  phai: { tieuDe: "Tay Phải", phuDe: "Hậu Thiên · Hiện tại & hành động", tenNgan: "tay phải" },
};

const NOI: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

const LOI_TIM: Record<string, string> = {
  khong_thay: "Máy chưa thấy rõ bàn tay trong ảnh. Chụp lại: xoè tay, lòng bàn tay hướng vào máy, đủ sáng, nền trơn.",
  nhieu_tay: "Ảnh có hơn một bàn tay. Chụp lại chỉ một tay bạn muốn xem.",
  ngoai_khung: "Bàn tay chưa nằm trọn trong ảnh. Lùi máy ra một chút để thấy cả đầu các ngón và cổ tay.",
  loi: "Máy này chưa chạy được bộ tự tìm điểm mốc bàn tay (trình duyệt cũ hoặc thiếu bộ nhớ).",
};
const LOI_ANH: Record<string, string> = {
  khong_du_diem: "Chưa đủ điểm mốc để đo. Chụp lại cho thấy cả năm ngón và cổ tay.",
  mu_ban_tay: "Ảnh có vẻ là mu bàn tay. Lật tay lại cho lòng bàn tay hướng vào máy rồi chụp lại.",
  tay_nam: "Các ngón đang khép hoặc nắm lại. Xoè rộng các ngón rồi chụp lại.",
  nghieng_qua: "Bàn tay nghiêng quá. Giữ lòng bàn tay song song với máy rồi chụp lại.",
};
const loiAnh = (k: KqDoTay) => k.loi_nhac || k.loi_chu || (k.loi && LOI_ANH[k.loi]) || k.loi || LOI_ANH.khong_du_diem!;
const tenNgan = (c: CungTay) => c.ten_ngan ?? /\(([^)]+)\)\s*$/.exec(c.ten)?.[1] ?? c.ten;

const CHO_MOC_THU = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_E2E === "1";
function mocThu(tyLe: number, tay: Tay): KetQuaTimTay | null {
  if (!CHO_MOC_THU || typeof window === "undefined") return null;
  const h = (window as unknown as {
    __ctTest?: { diem?: DiemTay[]; diem_trai?: DiemTay[]; diem_phai?: DiemTay[]; ty_le?: number; trang_thai?: string };
  }).__ctTest;
  if (!h) return null;
  const ds = (tay === "trai" ? h.diem_trai : h.diem_phai) ?? h.diem;
  if (ds?.length === 21) {
    return { trang_thai: "xong", diem: ds, ty_le: h.ty_le ?? tyLe, tay_mp: tay === "trai" ? "Left" : "Right" };
  }
  return { trang_thai: (["khong_thay", "nhieu_tay", "ngoai_khung", "loi"] as const).find((t) => t === h.trang_thai) ?? "loi" };
}

function HuongDan() {
  return (
    <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-huong-dan">
      <p className="text-sm font-semibold text-fg">Chụp thế nào cho máy đo được?</p>
      <div className="mt-3 flex items-start gap-4">
        <svg viewBox="0 0 120 140" className="w-24 shrink-0" role="img" aria-label="Hình minh hoạ: bàn tay xoè, lòng bàn tay hướng vào máy, cổ tay nằm trong khung">
          <rect x="6" y="4" width="108" height="132" rx="12" className="fill-none stroke-gold/50" strokeWidth="1.5" strokeDasharray="5 4" />
          <g className="fill-surface stroke-gold" strokeWidth="1.6">
            <rect x="20" y="62" width="11" height="34" rx="5.5" transform="rotate(-40 31 92)" />
            <rect x="35" y="22" width="11" height="44" rx="5.5" transform="rotate(-12 41 66)" />
            <rect x="49" y="13" width="11" height="52" rx="5.5" />
            <rect x="63" y="20" width="11" height="46" rx="5.5" transform="rotate(10 68 66)" />
            <rect x="75" y="34" width="10" height="36" rx="5" transform="rotate(24 80 70)" />
            <rect x="34" y="58" width="52" height="56" rx="16" />
            <rect x="44" y="108" width="32" height="26" rx="4" />
          </g>
          <path d="M44 92 Q58 84 74 90 M46 80 Q60 74 78 78" className="fill-none stroke-gold/60" strokeWidth="1.2" />
          <circle cx="104" cy="16" r="6" className="fill-gold/70" />
        </svg>
        <ul className="space-y-1.5 text-xs leading-snug text-fg-muted">
          <li className="flex gap-1.5"><Hand className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Xoè tay, các ngón tách nhau.</li>
          <li className="flex gap-1.5"><Check className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Lòng bàn tay hướng thẳng vào máy.</li>
          <li className="flex gap-1.5"><Sun className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Đủ sáng, nền trơn, không loá đèn.</li>
          <li className="flex gap-1.5"><Camera className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Chụp được cả hai tay: Trái (Tiên Thiên) & Phải (Hậu Thiên).</li>
        </ul>
      </div>
    </div>
  );
}

function diemPolyline(pts: [number, number][], tyLe: number): string {
  return pts.map(([x, y]) => `${(x * tyLe * 100).toFixed(2)},${(y * 100).toFixed(2)}`).join(" ");
}

export function ChupBanTay() {
  const hs = useHoSo();
  const chon = useChonChiTay();
  const tayActive: Tay = chon.tay ?? (hs?.gioi_tinh === "nu" ? "phai" : "trai");
  const phai = usePhaiChiTay();
  const dongY = DONG_Y_CHI_TAY.use();
  const [tick, setTick] = useState(false);
  const duocChon = Boolean(dongY || tick);

  const [haiTay, setHaiTay] = useState<Record<Tay, TrangThaiMotTay>>({
    trai: { ...RONG_MOT_TAY },
    phai: { ...RONG_MOT_TAY },
  });
  const [haiTayApi, setHaiTayApi] = useState<LuanGiaiHaiTayApi | null>(null);
  const [dangDo, setDangDo] = useState(false);
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const [hienDuongChi, setHienDuongChi] = useState(true);
  const [mo, setMo] = useState<string | null>(null);

  const inChupTrai = useRef<HTMLInputElement>(null);
  const inTaiTrai = useRef<HTMLInputElement>(null);
  const inChupPhai = useRef<HTMLInputElement>(null);
  const inTaiPhai = useRef<HTMLInputElement>(null);

  const luotTim = useRef<Record<Tay, number>>({ trai: 0, phai: 0 });
  const luotApi = useRef(0);
  const urlRefs = useRef<Record<Tay, string | null>>({ trai: null, phai: null });
  const haiTayRef = useRef(haiTay);
  haiTayRef.current = haiTay;

  useEffect(() => () => {
    if (urlRefs.current.trai) URL.revokeObjectURL(urlRefs.current.trai);
    if (urlRefs.current.phai) URL.revokeObjectURL(urlRefs.current.phai);
  }, []);

  const capNhatTay = useCallback((t: Tay, patch: Partial<TrangThaiMotTay>) => {
    setHaiTay((prev) => ({ ...prev, [t]: { ...prev[t], ...patch } }));
  }, []);

  const goiDoHaiTay = useCallback(async (traiState: TrangThaiMotTay, phaiState: TrangThaiMotTay, tayUuTien: Tay) => {
    if (!DONG_Y_CHI_TAY.da()) return;
    const coTrai = Boolean(traiState.diem && traiState.tyLe);
    const coPhai = Boolean(phaiState.diem && phaiState.tyLe);
    if (!coTrai && !coPhai) {
      setHaiTayApi(null);
      return;
    }

    const l = ++luotApi.current;
    setDangDo(true);
    setLoiChung(null);

    const payloadMot = (s: TrangThaiMotTay) => ({
      ty_le: Number((s.tyLe ?? 0.75).toFixed(4)),
      diem: s.diem!,
      ...(s.diem3d ? { diem_3d: s.diem3d } : {}),
      ...(s.duongChi ? {
        duong_chi_goi_y: {
          do_ro_tong: s.duongChi.do_ro_tong,
          tam_dao: s.duongChi.tam_dao,
          tri_dao: s.duongChi.tri_dao,
          sinh_dao: s.duongChi.sinh_dao,
          do_tin: s.duongChi.do_tin,
        },
      } : {}),
    });

    const targetTay: Tay = (tayUuTien === "trai" && coTrai) || !coPhai ? "trai" : "phai";
    const stTarget = targetTay === "trai" ? traiState : phaiState;

    try {
      // Bước 1: Luôn đo từng bàn tay qua `/api/chi-tay/do-tay` để giữ trọn hợp đồng kiểm tra hợp lệ & vị trí cung
      const rDo = await fetch("/api/chi-tay/do-tay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dong_y: true,
          ...(phai === "tay" ? { phai } : {}),
          tay: targetTay,
          ...payloadMot(stTarget),
          ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}),
        }),
      });
      const dDo = (await rDo.json().catch(() => ({}))) as KqDoTay & { error?: string };
      if (l !== luotApi.current) return;
      if (!rDo.ok) throw new Error(dDo.error ?? "Máy chủ đang bận, bạn thử lại sau ít phút.");

      capNhatTay(targetTay, { kq: dDo, loi: null });

      if (dDo.hop_le) {
        ghi("chart_interacted", {
          mo_dun: "chitay", kind: "chup_tay_xong", tay: targetTay, phai,
          so_cung: dDo.cung?.length ?? 0, so_nhan: dDo.nhan?.length ?? 0, so_sach: dDo.sach_ghi?.length ?? 0,
        });
      } else {
        ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: dDo.loi ?? "khong_hop_le" });
      }

      // Bước 2: Lấy hợp nhất Đông – Tây (7 Gò, 4 Đường, Góc ngón cái, 3 đốt ngón tay, 3D) + so sánh 2 tay nếu có
      const traiHopLe = targetTay === "trai" ? dDo.hop_le : Boolean(traiState.kq?.hop_le);
      const phaiHopLe = targetTay === "phai" ? dDo.hop_le : Boolean(phaiState.kq?.hop_le);
      if (!traiHopLe && !phaiHopLe) {
        setHaiTayApi(null);
        return;
      }

      try {
        const rHop = await fetch("/api/chi-tay/luan-giai-hai-tay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dong_y: true,
            ...(coTrai && traiHopLe ? { trai: payloadMot(traiState) } : {}),
            ...(coPhai && phaiHopLe ? { phai: payloadMot(phaiState) } : {}),
            ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}),
          }),
        });
        if (l !== luotApi.current) return;
        if (rHop.ok) {
          const dHop = (await rHop.json()) as LuanGiaiHaiTayApi;
          setHaiTayApi(dHop);
        }
      } catch {
        // Không làm gián đoạn kết quả đo đơn tay nếu bước tổng hợp phụ không sẵn sàng
      }
    } catch (e) {
      if (l !== luotApi.current) return;
      setLoiChung(e instanceof Error ? e.message : "Máy chủ đang bận, bạn thử lại sau ít phút.");
      ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: "may_chu" });
    } finally {
      if (l === luotApi.current) setDangDo(false);
    }
  }, [capNhatTay, hs, phai]);

  const doiBenTay = useCallback((tu: Tay) => {
    const sang: Tay = tu === "trai" ? "phai" : "trai";
    const src = haiTayRef.current[tu];
    if (!src.url || !src.diem || !src.tyLe) return;
    if (urlRefs.current[sang]) URL.revokeObjectURL(urlRefs.current[sang]!);
    urlRefs.current[sang] = src.url;
    urlRefs.current[tu] = null;
    const chuyen: TrangThaiMotTay = { ...src, kq: null, loi: null };
    const nextTrai = sang === "trai" ? chuyen : { ...RONG_MOT_TAY };
    const nextPhai = sang === "phai" ? chuyen : { ...RONG_MOT_TAY };
    setMo(null);
    datTay(sang);
    setHaiTay({ trai: nextTrai, phai: nextPhai });
    void goiDoHaiTay(nextTrai, nextPhai, sang);
  }, [goiDoHaiTay]);

  const boMotTay = useCallback((t: Tay) => {
    luotTim.current[t]++;
    if (urlRefs.current[t]) URL.revokeObjectURL(urlRefs.current[t]!);
    urlRefs.current[t] = null;
    setMo(null);
    setLoiChung(null);
    const nextTrai = t === "trai" ? { ...RONG_MOT_TAY } : haiTayRef.current.trai;
    const nextPhai = t === "phai" ? { ...RONG_MOT_TAY } : haiTayRef.current.phai;
    setHaiTay({ trai: nextTrai, phai: nextPhai });
    if (nextTrai.diem || nextPhai.diem) {
      void goiDoHaiTay(nextTrai, nextPhai, t === "trai" ? "phai" : "trai");
    } else {
      setHaiTayApi(null);
    }
  }, [goiDoHaiTay]);

  const boTatCa = useCallback(() => {
    luotTim.current.trai++;
    luotTim.current.phai++;
    luotApi.current++;
    if (urlRefs.current.trai) URL.revokeObjectURL(urlRefs.current.trai);
    if (urlRefs.current.phai) URL.revokeObjectURL(urlRefs.current.phai);
    urlRefs.current = { trai: null, phai: null };
    setHaiTay({ trai: { ...RONG_MOT_TAY }, phai: { ...RONG_MOT_TAY } });
    setHaiTayApi(null);
    setLoiChung(null);
    setMo(null);
  }, []);

  const chonAnh = async (t: Tay, f: File | undefined) => {
    if (!f || !f.type.startsWith("image/") || !duocChon) return;
    if (!DONG_Y_CHI_TAY.da()) DONG_Y_CHI_TAY.ghi();
    const u = await urlAnhSach(f);
    if (!u) {
      capNhatTay(t, { loi: "Không mở được ảnh này. Thử ảnh khác (JPG, PNG, HEIC đã đổi sang JPG)." });
      return;
    }
    luotTim.current[t]++;
    if (urlRefs.current[t]) URL.revokeObjectURL(urlRefs.current[t]!);
    urlRefs.current[t] = u;
    datTay(t);
    setHaiTay((prev) => ({
      ...prev,
      [t]: { ...RONG_MOT_TAY, url: u },
    }));
    ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay", tay: t });
  };

  const timTay = async (t: Tay, img: HTMLImageElement) => {
    const l = ++luotTim.current[t];
    const tl = img.naturalWidth / img.naturalHeight;
    capNhatTay(t, { tyLe: tl, tim: "dang", diem: null, diem3d: null, duongChi: null, kq: null, loi: null });
    let r = mocThu(tl, t);
    if (!r) {
      try {
        const { timBanTay } = await import("@/lib/ban-tay-tu-dong");
        r = await timBanTay(img);
      } catch {
        r = { trang_thai: "loi" };
      }
    }
    if (l !== luotTim.current[t]) return;
    if (r.trang_thai !== "xong") {
      capNhatTay(t, { tim: r.trang_thai });
      ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: r.trang_thai });
      return;
    }
    const updated: TrangThaiMotTay = {
      ...haiTayRef.current[t],
      tyLe: r.ty_le,
      tim: null,
      diem: r.diem,
      diem3d: r.diem_3d ?? null,
      tayMp: r.tay_mp,
      duongChi: r.duong_chi_goi_y ?? null,
    };
    const nextTrai = t === "trai" ? updated : haiTayRef.current.trai;
    const nextPhai = t === "phai" ? updated : haiTayRef.current.phai;
    setHaiTay({ trai: nextTrai, phai: nextPhai });
    if (!DONG_Y_CHI_TAY.da()) return;
    await goiDoHaiTay(nextTrai, nextPhai, t);
  };

  // Đổi phái Đông / Tây khi đã có điểm mốc → đo lại
  const phaiTruoc = useRef(phai);
  useEffect(() => {
    if (phaiTruoc.current === phai) return;
    phaiTruoc.current = phai;
    setMo(null);
    const { trai, phai: phaiSt } = haiTayRef.current;
    if (!DONG_Y_CHI_TAY.da() || (!trai.diem && !phaiSt.diem)) return;
    void goiDoHaiTay(trai, phaiSt, tayActive);
  }, [goiDoHaiTay, phai, tayActive]);

  const theRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo || !theRef.current || window.matchMedia?.("(min-width: 1024px)").matches) return;
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    theRef.current.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "nearest" });
  }, [mo]);

  const rutDongY = () => { DONG_Y_CHI_TAY.thuHoi(); setTick(false); boTatCa(); };

  const coBatKyAnh = Boolean(haiTay.trai.url || haiTay.phai.url);
  const tayHienThi: Tay = haiTay[tayActive].url ? tayActive : haiTay.phai.url ? "phai" : "trai";
  const stActive = haiTay[tayHienThi];

  const cung = useMemo(() => (stActive.kq?.hop_le ? stActive.kq.cung ?? [] : []), [stActive.kq]);
  const dang = cung.find((c) => c.ma === mo) ?? null;
  const soDaChon = cung.filter((c) => chon.cung[c.ma]).length;
  const chonLuaChon = (c: CungTay, lc: string | null) => {
    datCung(c.ma, lc);
    if (lc) ghi("chart_interacted", { mo_dun: "chitay", kind: "cung_tay", cung: c.ma, lua_chon: lc });
  };

  const coCaHaiTayHopLe = Boolean(haiTay.trai.kq?.hop_le && haiTay.phai.kq?.hop_le);
  const kqDong = coCaHaiTayHopLe
    ? (haiTayApi?.luan_giai_dong ?? (phai !== "tay" ? stActive.kq : null))
    : (phai !== "tay" ? stActive.kq : (haiTayApi?.luan_giai_dong ?? null));
  const kqTay = phai === "tay"
    ? (haiTayApi?.luan_giai_tay ?? stActive.kq)
    : (haiTayApi?.luan_giai_tay ?? null);
  const soSanh = haiTayApi?.so_sanh_hai_tay ?? null;
  const tongHop = haiTayApi?.tong_hop_dong_tay ?? null;
  const fuzzyBridge = kqTay?.fuzzy_bridge ?? stActive.kq?.fuzzy_bridge ?? null;

  const renderSlot = (t: Tay) => {
    const st = haiTay[t];
    const isActive = t === tayActive;
    const chupRef = t === "trai" ? inChupTrai : inChupPhai;
    const taiRef = t === "trai" ? inTaiTrai : inTaiPhai;
    const cungSlot = st.kq?.hop_le ? st.kq.cung ?? [] : [];
    const roTam = Boolean(st.duongChi && st.duongChi.tam_dao.do_ro >= 0.18 && st.duongChi.polylines.tam_dao.length > 1);
    const roTri = Boolean(st.duongChi && st.duongChi.tri_dao.do_ro >= 0.18 && st.duongChi.polylines.tri_dao.length > 1);
    const roSinh = Boolean(st.duongChi && st.duongChi.sinh_dao.do_ro >= 0.18 && st.duongChi.polylines.sinh_dao.length > 1);
    const coPolyline = roTam || roTri || roSinh;

    return (
      <div
        key={t}
        data-testid={`ct-slot-${t}`}
        onClick={() => { if (tayActive !== t) datTay(t); }}
        className={cn(
          "flex flex-col rounded-2xl border p-3.5 transition-colors",
          isActive ? "border-gold/65 bg-bg/75" : "border-line/70 bg-bg/40 hover:border-gold/35",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-serif text-base font-medium text-fg">{MO_TA_TAY[t].tieuDe}</p>
            <p className="text-xs text-fg-muted">{MO_TA_TAY[t].phuDe}</p>
          </div>
          {st.kq?.hop_le ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-jade/50 bg-jade/10 px-2 py-0.5 text-[11px] text-jade">
              <Check className="size-3" aria-hidden /> Đã đo
            </span>
          ) : (
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-faint">
              {st.url ? "Đang xử lý" : "Chưa có ảnh"}
            </span>
          )}
        </div>

        {!st.url ? (
          <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line/80 bg-surface/40 px-3 py-6 text-center">
            <Hand className={cn("size-8 text-gold/70", t === "trai" && "-scale-x-100")} aria-hidden />
            <p className="mt-2 text-xs text-fg-muted">Chụp hoặc tải ảnh lòng {MO_TA_TAY[t].tenNgan}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); datTay(t); chupRef.current?.click(); }}
                disabled={!duocChon}
                data-testid={isActive ? "ct-chup" : `ct-chup-${t}`}
              >
                <Camera aria-hidden /> Chụp ảnh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); datTay(t); taiRef.current?.click(); }}
                disabled={!duocChon}
                data-testid={isActive ? "ct-tai" : `ct-tai-${t}`}
              >
                <ImagePlus aria-hidden /> Tải ảnh
              </Button>
            </div>
            {st.loi && <p className="mt-2 text-xs text-amber-500" role="alert">{st.loi}</p>}
          </div>
        ) : (
          <div className="mt-3">
            <div className="relative mx-auto w-full max-w-xs" data-testid={isActive ? "ct-khung" : `ct-khung-${t}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
              <img
                src={st.url}
                alt={`Ảnh lòng ${MO_TA_TAY[t].tenNgan} bạn chọn (chỉ hiện trên máy)`}
                draggable={false}
                className="block h-auto w-full select-none rounded-xl border border-line"
                onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight && !haiTayRef.current[t].diem) void timTay(t, i); }}
              />
              {st.diem && st.tyLe && (
                <svg
                  viewBox={`0 0 ${st.tyLe * 100} 100`}
                  className="pointer-events-none absolute inset-0 size-full"
                  aria-hidden
                  data-testid={isActive ? "ct-xuong" : `ct-xuong-${t}`}
                >
                  {NOI.map(([a, b]) => (
                    <line
                      key={`${a}-${b}`}
                      x1={st.diem![a]![0] * st.tyLe! * 100}
                      y1={st.diem![a]![1] * 100}
                      x2={st.diem![b]![0] * st.tyLe! * 100}
                      y2={st.diem![b]![1] * 100}
                      stroke="white"
                      strokeOpacity={0.42}
                      strokeWidth={0.45}
                      strokeLinecap="round"
                    />
                  ))}
                  {st.diem.map(([x, y], i) => (
                    <circle key={i} cx={x * st.tyLe! * 100} cy={y * 100} r={0.65} fill="white" fillOpacity={0.55} />
                  ))}
                  {hienDuongChi && coPolyline && st.duongChi && (
                    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} strokeOpacity={0.78}>
                      {roTam && <polyline points={diemPolyline(st.duongChi.polylines.tam_dao, st.tyLe)} stroke="#f59e0b" strokeDasharray="1.8 1.2" />}
                      {roTri && <polyline points={diemPolyline(st.duongChi.polylines.tri_dao, st.tyLe)} stroke="#38bdf8" strokeDasharray="1.8 1.2" />}
                      {roSinh && <polyline points={diemPolyline(st.duongChi.polylines.sinh_dao, st.tyLe)} stroke="#34d399" strokeDasharray="1.8 1.2" />}
                    </g>
                  )}
                </svg>
              )}
              {cungSlot.map((c) => {
                const da = Boolean(chon.cung[c.ma]);
                return (
                  <button
                    key={c.ma}
                    type="button"
                    data-testid={isActive ? "ct-cung" : `ct-cung-${t}`}
                    data-ma={c.ma}
                    aria-pressed={mo === c.ma && isActive}
                    aria-label={`${c.ten}${da ? " — đã chọn" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      datTay(t);
                      setMo(mo === c.ma && isActive ? null : c.ma);
                    }}
                    style={{ left: `${c.vt[0] * 100}%`, top: `${c.vt[1] * 100}%` }}
                    className="group absolute flex size-9 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-full border-2 font-serif text-sm leading-none shadow transition-transform motion-reduce:transition-none",
                        mo === c.ma && isActive
                          ? "scale-110 border-gold bg-gold text-bg"
                          : da
                            ? "border-jade bg-bg/85 text-jade"
                            : "border-gold/90 bg-bg/75 text-fg group-hover:scale-105",
                      )}
                      lang="zh-Hant"
                    >
                      {c.han}
                    </span>
                  </button>
                );
              })}
              {(st.tim === "dang" || dangDo) && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-bg/40" data-testid={isActive ? "ct-dang-tim" : `ct-dang-tim-${t}`}>
                  <span className="inline-flex items-center gap-2 rounded-full bg-bg/90 px-3 py-1.5 text-xs text-fg shadow">
                    <Loader2 className="size-3.5 animate-spin text-gold motion-reduce:animate-none" aria-hidden />
                    {st.tim === "dang" ? "Đang tìm điểm mốc…" : "Đang đo…"}
                  </span>
                </div>
              )}
            </div>

            {((st.tim && st.tim !== "dang") || (st.kq && !st.kq.hop_le) || st.loi) && (
              <div className="mt-2 rounded-xl border border-gold/40 bg-gold/[0.06] p-2.5 text-xs" role="alert" data-testid={isActive ? "ct-loi" : `ct-loi-${t}`}>
                <p>{st.tim && st.tim !== "dang" ? LOI_TIM[st.tim] : st.kq && !st.kq.hop_le ? loiAnh(st.kq) : st.loi}</p>
                {st.tim === "loi" && (
                  <p className="mt-1.5">
                    <a href="#tu-soi" className="font-medium text-gold underline underline-offset-2">
                      Tự soi theo hình vẽ trong sách ở dưới ↓
                    </a>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="min-h-[36px]" onClick={() => { boMotTay(t); chupRef.current?.click(); }} data-testid={isActive ? "ct-chup-lai" : `ct-chup-lai-${t}`}>
                    <RotateCcw aria-hidden /> Chụp lại
                  </Button>
                  {st.kq?.loi === "mu_ban_tay" && st.diem && (
                    <Button size="sm" variant="ghost" className="min-h-[36px] text-gold" onClick={(e) => { e.stopPropagation(); doiBenTay(t); }} data-testid={`ct-doi-ben-${t}`}>
                      <ArrowLeftRight aria-hidden /> Đổi sang ô {t === "trai" ? "Tay Phải" : "Tay Trái"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <Button size="sm" variant="ghost" className="min-h-[36px]" onClick={(e) => { e.stopPropagation(); datTay(t); chupRef.current?.click(); }}>
                <Camera aria-hidden /> Chụp lại
              </Button>
              <Button size="sm" variant="ghost" className="min-h-[36px]" onClick={(e) => { e.stopPropagation(); datTay(t); taiRef.current?.click(); }}>
                <ImagePlus aria-hidden /> Đổi ảnh
              </Button>
              <Button size="sm" variant="ghost" className="min-h-[36px]" onClick={(e) => { e.stopPropagation(); boMotTay(t); }} data-testid={isActive ? "ct-bo-anh" : `ct-bo-anh-${t}`}>
                <X aria-hidden /> Bỏ ảnh
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      aria-labelledby="chup-tay"
      data-testid="chup-ban-tay"
      className="relative mb-12 overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-4 sm:p-7"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />

      {/* 4 input tệp riêng cho 2 bàn tay; giữ data-testid chuẩn trên tay đang chọn cho e2e */}
      <input ref={inChupTrai} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden
        data-testid={tayActive === "trai" ? "ct-input-chup" : "ct-input-chup-trai"}
        onChange={(e) => { void chonAnh("trai", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={inTaiTrai} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden
        data-testid={tayActive === "trai" ? "ct-input-tai" : "ct-input-tai-trai"}
        onChange={(e) => { void chonAnh("trai", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={inChupPhai} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden
        data-testid={tayActive === "phai" ? "ct-input-chup" : "ct-input-chup-phai"}
        onChange={(e) => { void chonAnh("phai", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={inTaiPhai} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden
        data-testid={tayActive === "phai" ? "ct-input-tai" : "ct-input-tai-phai"}
        onChange={(e) => { void chonAnh("phai", e.target.files?.[0]); e.target.value = ""; }} />

      <div className="relative">
        <p className="eyebrow text-gold">Từ ảnh tay của bạn · ảnh không rời máy · Đông – Tây hợp nhất</p>
        <h2 id="chup-tay" className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
          Chụp lòng bàn tay — <span className="text-gradient-gold">đo cả hai tay & luận Đông – Tây</span>
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Máy bạn tự tìm 21 điểm mốc 2D/3D và gợi ý đường chỉ ngay trong trình duyệt. Bạn có thể chụp 1 tay hoặc cả 2 tay
          (Tay Trái Tiên Thiên &amp; Tay Phải Hậu Thiên) để so sánh và xem hợp nhất Thần Tướng Toàn Biên với Chỉ tay phương Tây.
        </p>

        {/* Thanh chọn nhanh tay đang tập trung */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Chọn tay đang xem">
            {(["trai", "phai"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => datTay(t)}
                aria-pressed={tayActive === t}
                data-testid={`ct-tay-${t}`}
                className={cn(
                  "min-h-[40px] rounded-full border px-4 text-xs sm:text-sm",
                  tayActive === t ? "border-gold/70 bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/50",
                )}
              >
                {t === "trai" ? "Tay trái (Tiên Thiên)" : "Tay phải (Hậu Thiên)"}
              </button>
            ))}
          </div>

          {coBatKyAnh && (
            <button
              type="button"
              onClick={() => setHienDuongChi((v) => !v)}
              data-testid="ct-toggle-duong-chi"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line px-3 text-xs text-fg-muted hover:border-gold/50 hover:text-fg"
            >
              {hienDuongChi ? <Eye className="size-3.5 text-gold" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
              {hienDuongChi ? "Đang hiện gợi ý 3 đường chỉ" : "Hiện gợi ý 3 đường chỉ"}
            </button>
          )}
        </div>

        {/* Thoả thuận bảo mật */}
        {!dongY ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="rounded-2xl border border-line/70 bg-bg/70 p-4" data-testid="ct-thoa-thuan">
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                <ShieldCheck className="size-4 text-gold" aria-hidden /> Thoả thuận đo bàn tay trên ảnh
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                Ảnh chỉ xử lý trên máy bạn; chỉ 21 toạ độ điểm mốc 2D/3D, tỉ lệ khung ảnh và chỉ số đường chỉ tham khảo (dạng số, không có ảnh) được gửi lên để đo, không lưu, không dùng để
                nhận ra bạn. Rút thoả thuận ở đây hoặc ở <Link href="/tai-khoan#du-lieu-cua-toi" className="text-gold underline underline-offset-2">Dữ liệu của tôi</Link> ·{" "}
                <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline underline-offset-2">Chính sách riêng tư</Link>.
              </p>
              <label className="mt-2 flex min-h-[40px] cursor-pointer items-start gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 accent-[rgb(var(--gold))]"
                  checked={tick}
                  onChange={(e) => setTick(e.target.checked)}
                  data-testid="ct-dong-y"
                />
                <span>Tôi đồng ý: ảnh chỉ xử lý trên máy tôi; chỉ 21 toạ độ điểm mốc bàn tay được gửi lên để đo, không lưu.</span>
              </label>
              {!duocChon && <p className="mt-1 text-xs text-fg-faint">Tích ô đồng ý ở trên để chụp hoặc tải ảnh.</p>}
            </div>
            <HuongDan />
          </div>
        ) : (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="ct-da-dong-y">
            <Check className="size-3.5 text-jade" aria-hidden /> Đã đồng ý đo bàn tay ngày {ngayDongYAnhMat(dongY)} (bản {DONG_Y_CHI_TAY.phienBan}).
            <button type="button" className="min-h-[32px] underline underline-offset-2 hover:text-fg" onClick={rutDongY} data-testid="ct-rut">Rút thoả thuận</button>
          </p>
        )}

        {/* Hai khung bàn tay song song */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {renderSlot("trai")}
          {renderSlot("phai")}
        </div>

        {/* Chú giải 3 đường chỉ gợi ý CV */}
        {coBatKyAnh && hienDuongChi && (haiTay.trai.duongChi || haiTay.phai.duongChi) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-muted">
            <span className="font-medium text-fg">Gợi ý đường chỉ (tham khảo):</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-amber-400" /> Tâm Đạo</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-sky-400" /> Trí Đạo</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-emerald-400" /> Sinh Đạo</span>
          </div>
        )}

        {loiChung && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200" role="alert" data-testid="ct-loi">
            {loiChung}
          </div>
        )}

        {/* Chip chọn cung của tay đang xem */}
        {cung.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Các cung trên ảnh">
            {cung.map((c) => (
              <li key={c.ma}>
                <button
                  type="button"
                  onClick={() => setMo(c.ma)}
                  aria-pressed={mo === c.ma}
                  data-testid="ct-cung-chip"
                  data-ma={c.ma}
                  className={cn(
                    "inline-flex min-h-[38px] items-center gap-1 rounded-full border px-3 text-xs",
                    mo === c.ma ? "border-gold/70 bg-gold/15 text-fg" : chon.cung[c.ma] ? "border-jade/60 text-jade" : "border-line text-fg-muted",
                  )}
                >
                  <span lang="zh-Hant" className="font-serif text-sm">{c.han}</span> {tenNgan(c)}
                  {chon.cung[c.ma] && <Check className="size-3.5" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Thẻ chi tiết cung đang chạm */}
        {dang && (
          <div ref={theRef} className="mt-4 scroll-mb-24 rounded-2xl border border-gold/40 bg-gold/[0.05] p-4" data-testid="ct-the-cung">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-fg" lang="zh-Hant">{dang.han} <span className="font-sans text-base font-medium">{dang.ten}</span></p>
              </div>
              <button type="button" onClick={() => setMo(null)} className="min-h-[36px] px-2 text-xs text-fg-muted hover:text-fg">Đóng</button>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{dang.y}</p>
            {dang.lua_chon.length > 0 && (
              <>
                <p className="mt-3 text-xs text-fg-faint">Nhìn vùng này trên ảnh (hoặc trên tay thật). Bạn thấy:</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-3" role="group" aria-label={`Bạn thấy gì ở ${dang.ten}`}>
                  {dang.lua_chon.map((lc) => {
                    const co = chon.cung[dang.ma] === lc.ma;
                    return (
                      <button
                        key={lc.ma}
                        type="button"
                        aria-pressed={co}
                        data-testid="ct-lua-chon"
                        data-ma={lc.ma}
                        onClick={() => chonLuaChon(dang, co ? null : lc.ma)}
                        className={cn(
                          "flex min-h-[42px] items-center gap-2 rounded-xl border px-3 text-left text-sm",
                          co ? "border-jade/70 bg-jade/10 text-fg" : "border-line text-fg-muted hover:border-gold/50",
                        )}
                      >
                        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", co ? "border-jade bg-jade text-bg" : "border-line")}>
                          {co && <Check className="size-3" aria-hidden />}
                        </span>
                        {lc.ten}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Kết quả hợp nhất Đông – Tây + So sánh Hai Tay */}
        {(tongHop || soSanh || kqDong?.hop_le || kqTay?.hop_le) && (
          <div className="mt-6 space-y-4" aria-live="polite">
            {tongHop && (
              <div className="rounded-2xl border border-gold/40 bg-surface/65 p-4" data-testid="ct-tong-hop-dong-tay">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                  <Sparkles className="size-3.5" aria-hidden /> Tổng hợp Chỉ Tay Đông – Tây
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{tongHop.tom_tat}</p>
                {tongHop.ghi_chu && <p className="mt-2 text-[11px] leading-relaxed text-fg-faint">{tongHop.ghi_chu}</p>}
              </div>
            )}

            {soSanh && (
              <div className="rounded-2xl border border-jade/35 bg-jade/[0.06] p-4" data-testid="ct-so-sanh-hai-tay">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">So sánh Tay Trái (Tiên Thiên) &amp; Tay Phải (Hậu Thiên)</p>
                  <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs tabular-nums text-jade">
                    Tương đồng ~{Math.round(soSanh.muc_tuong_dong * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{soSanh.nhan_xet}</p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-xl border border-line/60 bg-bg/50 p-2.5">
                    <span className="text-fg-faint">Tay Trái (Tiên Thiên)</span>
                    <p className="mt-0.5 font-medium text-fg">{soSanh.ten_hanh_trai || "Cân đối"}</p>
                  </div>
                  <div className="rounded-xl border border-line/60 bg-bg/50 p-2.5">
                    <span className="text-fg-faint">Tay Phải (Hậu Thiên)</span>
                    <p className="mt-0.5 font-medium text-fg">{soSanh.ten_hanh_phai || "Cân đối"}</p>
                  </div>
                  <div className="rounded-xl border border-line/60 bg-bg/50 p-2.5">
                    <span className="text-fg-faint">Chênh lệch tỉ lệ (Phải − Trái)</span>
                    <p className="mt-0.5 tabular-nums text-fg">
                      Lòng {soSanh.chenh_rong_long >= 0 ? "+" : ""}{soSanh.chenh_rong_long} · Ngón {soSanh.chenh_ngon_giua >= 0 ? "+" : ""}{soSanh.chenh_ngon_giua}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Cột Phương Đông */}
              <div className="space-y-3">
                {kqDong?.hop_le && (kqDong.nhan?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-nhan">
                    <p className="text-sm font-semibold text-fg">Phương Đông · Máy đo được trên ảnh</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {kqDong.nhan!.map((n) => (
                        <li key={n.ma} className={cn("flex gap-1.5", n.vua ? "text-fg-muted" : "text-fg")}>
                          <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", n.vua ? "bg-fg-faint" : "bg-gold")} />
                          <span>{n.ten}{n.y && <span className="block text-xs text-fg-muted">{n.y}</span>}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {kqDong?.hop_le && (kqDong.sach_ghi?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-sach-ghi">
                    <p className="text-sm font-semibold text-fg">Thần Tướng Toàn Biên nói gì về dáng tay này</p>
                    <ul className="mt-2 space-y-3">
                      {kqDong.sach_ghi!.map((s) => (
                        <li key={s.ma} className="text-sm leading-relaxed">
                          <p>{s.loi}</p>
                          {s.viec && <p className="mt-1 text-xs text-fg-muted"><span className="text-fg">Việc nên làm:</span> {s.viec}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {kqDong?.hop_le && (kqDong.bo_nhom_c ?? 0) > 0 && (
                  <p className="text-xs text-fg-muted">
                    {hs ? `${kqDong.bo_nhom_c} câu sách theo dáng tay này chỉ dành cho người từ 18 tuổi, nên không hiện ở đây.`
                      : `${kqDong.bo_nhom_c} câu sách theo dáng tay này chỉ hiện khi biết bạn đã đủ 18 tuổi — lưu hồ sơ (ngày sinh) để xem đủ.`}
                  </p>
                )}
              </div>

              {/* Cột Phương Tây */}
              <div className="space-y-3">
                {fuzzyBridge && <TheDangBanTayFuzzy bridge={fuzzyBridge} />}

                {kqTay?.hop_le && (kqTay.to_hop || (kqTay.goi_y_dang?.length ?? 0) > 0) && (
                  <div className="rounded-2xl border border-line/70 bg-bg/50 p-4 text-sm" data-testid="ct-to-hop">
                    {kqTay.to_hop && <p className="font-semibold text-fg">{kqTay.to_hop.ten}</p>}
                    {(kqTay.goi_y_dang?.length ?? 0) > 0 && (
                      <p className="mt-1 text-fg-muted">
                        Dáng lòng bàn tay này gần với {kqTay.goi_y_dang!.map((g) => TEN_DANG[g] ?? g).join(" hoặc ")} trong sách Cheiro.
                      </p>
                    )}
                  </div>
                )}

                {kqTay?.hop_le && (kqTay.muc?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-muc-tay">
                    <p className="text-sm font-semibold text-fg">Chỉ tay phương Tây (Cheiro · Benham)</p>
                    <ul className="mt-2 space-y-3">
                      {kqTay.muc!.map((m) => (
                        <li key={m.ma} className="text-sm leading-relaxed">
                          <p>{m.loi}</p>
                          {m.viec && <p className="mt-1 text-xs text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
                          {m.trich && (
                            <details className="mt-1 text-xs text-fg-muted">
                              <summary className="cursor-pointer">Nguyên văn</summary>
                              <p lang="en" className="mt-1 italic">“{m.trich}”</p>
                              {m.nguon_hien_thi && <p className="mt-0.5">— {m.nguon_hien_thi}</p>}
                            </details>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {kqTay?.hop_le && (kqTay.duong_kinh_dien?.length ?? 0) > 0 && (
                  <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-duong-kinh-dien">
                    <p className="text-sm font-semibold text-fg">Bốn đường chỉ kinh điển (Cheiro · Dale)</p>
                    <ul className="mt-2 space-y-2.5 text-xs leading-relaxed">
                      {kqTay.duong_kinh_dien!.map((dk) => (
                        <li key={dk.ma} className="rounded-xl border border-line/50 p-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-semibold text-fg">{dk.ten}</span>
                            {dk.tin_hieu_cv?.do_ro !== undefined ? (
                              <span className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px]",
                                dk.tin_hieu_cv.do_ro >= 0.18
                                  ? "border-gold/40 bg-gold/10 text-gold"
                                  : "border-line bg-surface/60 text-fg-faint",
                              )}>
                                {dk.tin_hieu_cv.do_ro >= 0.18
                                  ? `Độ rõ ảnh ~${Math.round(dk.tin_hieu_cv.do_ro * 100)}% (tham khảo)`
                                  : "Mờ trên ảnh · tự soi tay thật"}
                              </span>
                            ) : (
                              <span className="rounded-full border border-line bg-surface/60 px-2 py-0.5 text-[10px] text-fg-faint">
                                Tự soi trên tay thật
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-fg-muted">{dk.mat_tich_cuc}</p>
                          <p className="mt-1 text-fg-faint">{dk.mat_tieu_cuc_can_chu_y}</p>
                          {dk.trich && (
                            <details className="mt-1 text-[11px] text-fg-faint">
                              <summary className="cursor-pointer text-gold/80 hover:underline">Nguyên văn sách cổ</summary>
                              <p lang="en" className="mt-1 italic">“{dk.trich}”</p>
                              {dk.nguon && <p className="mt-0.5">— {dk.nguon}</p>}
                            </details>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Chỉ số hình học mở rộng & 3D (Góc mở ngón cái · 3 đốt ngón giữa · Độ khum 3D Minh Đường) */}
            {kqTay?.hop_le && (kqTay.chi_so_mo_rong?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-chi-so-mo-rong">
                <p className="text-sm font-semibold text-fg">Chỉ số hình học mở rộng &amp; 3D (Cheiro · Benham · Minh Đường)</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {kqTay.chi_so_mo_rong!.map((cs) => {
                    const dot = typeof cs.gia_tri === "object" && cs.gia_tri !== null ? cs.gia_tri : null;
                    return (
                      <div key={cs.ma} className="rounded-xl border border-line/60 bg-surface/40 p-3 text-xs leading-relaxed">
                        <p className="font-semibold text-fg">{cs.ten}</p>
                        {dot && (
                          <div className="mt-2">
                            <div className="flex h-2 overflow-hidden rounded-full bg-bg">
                              <span style={{ width: `${Math.round(dot.dot_dau * 100)}%` }} className="bg-sky-400" title="Đốt đầu (trực giác)" />
                              <span style={{ width: `${Math.round(dot.dot_giua * 100)}%` }} className="bg-gold" title="Đốt giữa (lý trí)" />
                              <span style={{ width: `${Math.round(dot.dot_goc * 100)}%` }} className="bg-jade" title="Đốt gốc (thực tiễn)" />
                            </div>
                            <p className="mt-1 flex justify-between text-[10px] tabular-nums text-fg-faint">
                              <span>Đầu {Math.round(dot.dot_dau * 100)}%</span>
                              <span>Giữa {Math.round(dot.dot_giua * 100)}%</span>
                              <span>Gốc {Math.round(dot.dot_goc * 100)}%</span>
                            </p>
                          </div>
                        )}
                        <p className="mt-1.5 text-fg-muted">{cs.y}</p>
                        {cs.luu_y && <p className="mt-1 text-[11px] text-fg-faint">{cs.luu_y}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Đối chiếu 7 Gò Tây Phương ↔ Bát Quái Đông Phương */}
            {kqTay?.hop_le && (kqTay.bay_go_kinh_dien?.length ?? 0) > 0 && (
              <details className="group rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-bay-go-dong-tay">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-fg">
                  <span className="inline-flex items-center gap-1.5">
                    <Compass className="size-4 text-gold" aria-hidden />
                    Đối chiếu 7 Gò Tây Phương (Cheiro · Dale) ↔ Bát Quái Đông Phương
                  </span>
                  <span className="text-xs font-normal text-gold group-open:hidden">Mở xem 7 gò ↓</span>
                  <span className="hidden text-xs font-normal text-fg-faint group-open:inline">Thu gọn ↑</span>
                </summary>
                <p className="mt-2 text-xs text-fg-muted">
                  Bảng đối chiếu vùng giải phẫu giữa 7 Gò Tây phương và Bát Quái Đông phương do ban biên tập lập để tiện tra cứu (sách cổ hai phái không ghi chéo nhau). Chạm nút “Soi” để mở đúng cung tương ứng trên ảnh tay của bạn.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {kqTay.bay_go_kinh_dien!.map((g) => {
                    const coCungTrenAnh = Boolean(g.cung_dong && cung.some((c) => c.ma === g.cung_dong));
                    return (
                      <div key={g.ma} className="flex flex-col rounded-xl border border-line/60 bg-surface/40 p-3 text-xs leading-relaxed">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-fg">{g.ten}</p>
                            {g.vi_tri && <p className="text-[11px] text-fg-faint">{g.vi_tri}</p>}
                          </div>
                          {g.han_dong && (
                            coCungTrenAnh ? (
                              <button
                                type="button"
                                onClick={() => setMo(g.cung_dong!)}
                                className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[11px] text-gold hover:bg-gold/20"
                                title={`Mở ${g.ten_cung_dong ?? ""} trên ảnh`}
                              >
                                <span lang="zh-Hant" className="font-serif">{g.han_dong}</span> · Soi
                              </button>
                            ) : (
                              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-muted">
                                <span lang="zh-Hant" className="font-serif">{g.han_dong}</span>
                              </span>
                            )
                          )}
                        </div>
                        {g.ten_cung_dong && <p className="mt-1 text-[11px] text-jade">Đông phương: {g.ten_cung_dong}</p>}
                        <p className="mt-1.5 text-fg-muted">{g.mat_tich_cuc}</p>
                        <p className="mt-1 text-fg-faint">{g.mat_tieu_cuc_can_chu_y}</p>
                        {g.trich && (
                          <details className="mt-auto pt-1.5 text-[11px] text-fg-faint">
                            <summary className="cursor-pointer text-gold/80 hover:underline">Nguyên văn</summary>
                            <p lang="en" className="mt-1 italic">“{g.trich}”</p>
                            {g.nguon && <p className="mt-0.5">— {g.nguon}</p>}
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            )}

            {soDaChon > 0 && (
              <a
                href="#tu-soi"
                className="flex min-h-[44px] items-center justify-center rounded-full bg-gold px-5 text-sm font-medium text-bg"
                data-testid="ct-den-doc"
              >
                Đã chọn {soDaChon} cung · xem sách xưa nói gì ↓
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
