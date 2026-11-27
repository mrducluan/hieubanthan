"use client";
// Cố vấn liên mảng Tam Tài (/co-van, tab "Hỏi quyết định" của /co-van-kinh-doanh) — làm lại sau review 2026-11-26:
// ba cách xem đọc riêng (không gộp mức), chỉ dùng phần miễn phí của các báo cáo nên trang miễn phí; câu về người khác,
// chuyện đã xảy ra, người dưới 16 tuổi, câu chưa rõ việc gì → chuyển hướng (engine quyết, web chỉ vẽ).
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarClock, Compass, Layers, ListChecks, ShieldAlert, Sparkles, Target } from "lucide-react";
import Link from "@/components/khung/Lien";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { KhungUngDungCoDien } from "@/components/luan-giai/CheDoDoc";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import type { Muc, UngDungCoDien } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { useHoSoNha } from "@/lib/ho-so-nha";
import { useMatBang } from "@/lib/mat-bang";
import { cn } from "@/lib/utils";
import { huongTuCuaHang, huongTuHoSoNha, type HuongChon } from "@/lib/huong-co-van";
import { HuongKhongGian, TEN_NGUON_HUONG, type NguonHuong } from "./HuongKhongGian";

interface TruTamTai {
  ma: "nhan" | "thien" | "dia";
  ten_tru: string;
  nguon: string;
  muc: Muc | null;
  nhan_muc: string | null;
  nhan_xet: string;
  hanh_dong: string;
  can_cu: string[];
  lien_ket: { ten: string; duong: string };
  ma_mau: string;
  muc_tung_mon?: { tuvi: Muc | null; battu: Muc | null };
  nhan_tung_mon?: { tuvi: string | null; battu: string | null };
}

type Nhip = "day_manh" | "can_bang" | "phong_thu";

interface KetQuaTamTai {
  an_toan_chan?: { xu_ly: string; loai: string; cau_tra_loi: string };
  chuyen_huong?: { ly_do: string; cau: string; lien_ket: { ten: string; duong: string; mach?: string }[] };
  mach?: string;
  ten_mach?: string;
  lien_ket_mach?: { ten: string; duong: string };
  hieu_cau?: {
    cau: string;
    viec: { ma: string; ten: string; khong_gian: "mat_bang" | "nha_o" | "khong" };
    kieu: string;
    khung: { nam: number; thang: number | null; mac_dinh: boolean; nhan: string };
    ghi_chu: string | null;
  };
  tra_loi?: {
    cau: string;
    nghieng: "thuan" | "can_nhac" | "chuan_bi";
    thang_hoi: { nhan: string; nhip: Nhip; cau: string } | null;
    tieu_de_dieu_kien: string;
    dieu_kien: string[];
    truoc_het: string;
    nen_giu: string;
    tieu_de_nen_giu: string;
    nhan_manh: string;
  };
  bac_dau_vao?: 1 | 2 | 3;
  lop_da_dung?: string[];
  goi_y_nang_bac?: { bac_tiep: 2 | 3; nhan: string; ly_do: string }[];
  can_bo_sung?: { loai: "mat_bang" | "nha_o"; nhan: string; ly_do: string; cach: string[] };
  ba_tru_tam_tai?: { nhan: TruTamTai; thien: TruTamTai; dia?: TruTamTai };
  bieu_do_ngu_hanh?: {
    nhat_chu: string;
    co_gio: boolean;
    hanh: { hanh_ma: string; ten: string; diem: number; ty_le: number; trang_thai: "thieu" | "vua" | "thua" }[];
  };
  thoi_gian?: {
    nam: number;
    luoi: { thang: string; nhip: Nhip }[];
    doan: { nhip: Nhip; nhan_nhip: string; nhan: string; ly_do: string; thang: string[]; thang_hoi: boolean }[];
    cach_lam: { nhip: Nhip; nhan_nhip: string; nhan: string; nen_lam: string }[];
    ngay_dep: { thang: string; ngay: string; am_lich: string; truc: string; ly_do: string }[];
  };
  doi_tac?: { tieu_de: string; vai_tro: string; hanh_manh: string; loi: string };
  ung_dung_co_dien?: UngDungCoDien;
  ket?: string;
}

const GOI_Y_DOI_SONG = [
  "Năm tới tôi có nên nghỉ việc ra làm riêng không?",
  "Đang có khoản tích luỹ nên đầu tư hay giữ tiền mặt?",
  "Gia đình định mua nhà chuyển chỗ ở cuối năm nay có thuận không?",
  "Vợ chồng dạo này hay căng thẳng vì chuyện nhỏ, làm sao hoà giải?",
  "Năm sau tôi có nên kết hôn không?",
  "Dạo này làm việc quá tải mất ngủ, nên lấy lại sức thế nào?",
];

const GOI_Y_KINH_DOANH = [
  "Quý tới có nên mở thêm chi nhánh hay giữ chắc điểm hiện tại?",
  "Tôi định hùn vốn mở quán với bạn thân, cần rào chắn điều gì?",
  "Có nên thuê mặt bằng mới để mở cửa hàng lúc này không?",
  "Đang kẹt dòng tiền công nợ, nên thu hẹp hay xoay vốn ngắn hạn?",
];

const MAU_NHIP: Record<Nhip, string> = { day_manh: "bg-jade/70", can_bang: "bg-gold/55", phong_thu: "bg-amber-400/70" };
const CHU_NHIP: Record<Nhip, string> = { day_manh: "text-jade", can_bang: "text-gold", phong_thu: "text-amber-300" };
const MAU_NGHIENG: Record<string, string> = {
  thuan: "border-jade/45 bg-jade/10 text-jade", can_nhac: "border-gold/45 bg-gold/10 text-gold", chuan_bi: "border-amber-400/45 bg-amber-500/10 text-amber-300",
};
const CHU_NGHIENG: Record<string, string> = { thuan: "Nghiêng về thuận", can_nhac: "Làm được, chọn thời điểm", chuan_bi: "Nên chuẩn bị thêm" };

function mauMuc(m: Muc | null) {
  if (m === "thuan") return "border-jade/45 bg-jade/10 text-jade";
  if (m === "can_chu_dong") return "border-amber-400/45 bg-amber-500/10 text-amber-300";
  if (m === "can_bang") return "border-gold/45 bg-gold/10 text-gold";
  return "border-line/70 bg-bg/60 text-fg-muted";
}

export function CongCoVanTamTai({ macDinhCheDo = "doi_song" }: { macDinhCheDo?: "doi_song" | "kinh_doanh" }) {
  const [cauHoi, setCauHoi] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [moBac2, setMoBac2] = useState(false);
  const [gioSinh, setGioSinh] = useState("");
  const [noiSinh, setNoiSinh] = useState("");
  const [moBac3, setMoBac3] = useState(false);
  // CV-2: hướng đã chọn trong phiên (đo / chọn / lấy từ hồ sơ). Hồ sơ cửa hàng + hồ sơ nhà trên máy tự được gửi kèm khi có.
  const [huongChon, setHuongChon] = useState<{ mat_bang?: HuongChon; nha?: HuongChon; nguon?: NguonHuong } | null>(null);
  const [doiHuong, setDoiHuong] = useState(false);
  const [nguonDia, setNguonDia] = useState<NguonHuong | null>(null);
  const hsNha = useHoSoNha();
  const hsCuaHang = useMatBang();
  const nhaHoSo = huongTuHoSoNha(hsNha);
  const cuaHangHoSo = huongTuCuaHang(hsCuaHang);
  const khungKq = useRef<HTMLDivElement | null>(null);
  const [ngaySinhDoiTac, setNgaySinhDoiTac] = useState("");
  const [gioiTinhDoiTac, setGioiTinhDoiTac] = useState<"nam" | "nu">("nu");
  const [dongYDoiTac, setDongYDoiTac] = useState(false);

  const hs = useHoSo();
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaTamTai | null>(null);

  useEffect(() => {
    if (!hs) return;
    setNgaySinh(ngaySinhIso(hs));
    if (hs.gioi_tinh === "nam" || hs.gioi_tinh === "nu") setGioiTinh(hs.gioi_tinh);
    if (hs.gio && hs.do_tin_gio !== "unknown") {
      setGioSinh(hs.gio);
      setMoBac2(true);
    }
    if (hs.noi_sinh) setNoiSinh(hs.noi_sinh);
  }, [hs]);

  async function guiCoVan(ghiDe?: { mat_bang?: HuongChon; nha?: HuongChon; nguon?: NguonHuong }) {
    if (cauHoi.trim().length < 3 || !ngaySinh || dang) return;
    const coDoiTac = moBac3 && /^\d{4}-\d{2}-\d{2}$/.test(ngaySinhDoiTac);
    if (coDoiTac && !dongYDoiTac) {
      setLoi("Cần đánh dấu người liên quan đã đồng ý cho dùng ngày sinh, hoặc xoá ngày sinh người ấy.");
      return;
    }
    setDang(true);
    setLoi(null);
    try {
      const coGio = moBac2 && /^([01]\d|2[0-3]):[0-5]\d$/.test(gioSinh.trim());
      const mb = ghiDe?.mat_bang ?? huongChon?.mat_bang ?? cuaHangHoSo;
      const nhaGui = ghiDe?.nha ?? huongChon?.nha ?? nhaHoSo;
      setNguonDia(ghiDe?.mat_bang ? (ghiDe.nguon ?? null) : huongChon?.mat_bang ? (huongChon.nguon ?? null) : cuaHangHoSo ? "ho_so_cua_hang"
        : ghiDe?.nha ? (ghiDe.nguon ?? null) : huongChon?.nha ? (huongChon.nguon ?? null) : nhaHoSo ? "ho_so_nha" : null);
      const body: Record<string, unknown> = {
        cau_hoi: cauHoi.trim(),
        ngay_sinh: ngaySinh,
        gioi_tinh: gioiTinh,
        gio_sinh: coGio ? gioSinh.trim() : null,
        do_tin_gio: coGio ? "exact" : "unknown",
        noi_sinh: coGio && noiSinh.trim() ? noiSinh.trim().slice(0, 60) : null,
        nha: nhaGui ? { do_huong: nhaGui.do_huong, vai: "nha_o", ...(nhaGui.nam_xay ? { nam_xay: nhaGui.nam_xay } : {}) } : null,
        mat_bang: mb ? { do_huong: mb.do_huong, ...(mb.nam_xay ? { nam_xay: mb.nam_xay } : {}) } : null,
        doi_tac: coDoiTac
          ? { ngay_sinh: ngaySinhDoiTac, gioi_tinh: gioiTinhDoiTac, vai_tro: macDinhCheDo === "kinh_doanh" ? "gop_von" : "nguoi_thuong", dong_y_tu_nguyen: true }
          : null,
        che_do: macDinhCheDo,
      };
      const res = await fetch("/api/co-van", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as (KetQuaTamTai & { error?: string }) | null;
      if (!res.ok || !data) {
        setLoi(data?.error ?? "Chưa tải được lời cố vấn lúc này, bạn thử lại sau ít giây nhé.");
        return;
      }
      setKq(data);
      ghi("chart_interacted", {
        mo_dun: "tam_tai", kind: "co_van_xem", ket_qua: data.an_toan_chan ? data.an_toan_chan.xu_ly : data.chuyen_huong?.ly_do ?? data.mach ?? "",
        bac: data.bac_dau_vao ?? 0, viec: data.hieu_cau?.viec.ma ?? "", co_huong: Boolean(data.ba_tru_tam_tai?.dia), can_bo_sung: data.can_bo_sung?.loai ?? "",
      });
      setDoiHuong(false);
    } catch {
      setLoi("Kết nối tạm gián đoạn, bạn kiểm tra mạng rồi thử lại nhé.");
    } finally {
      setDang(false);
    }
  }

  const dsGoiY = macDinhCheDo === "kinh_doanh" ? GOI_Y_KINH_DOANH : GOI_Y_DOI_SONG;

  return (
    <div className="space-y-8" data-testid="cong-co-van-tam-tai">
      <form
        onSubmit={(e) => { e.preventDefault(); void guiCoVan(); }}
        className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-6"
        data-testid="co-van-form"
      >
        <label htmlFor="cv-cau-hoi" className="block text-sm font-medium text-fg">
          Điều bạn đang cân nhắc hoặc sắp quyết định
        </label>
        <textarea
          id="cv-cau-hoi"
          rows={2}
          value={cauHoi}
          onChange={(e) => setCauHoi(e.target.value)}
          placeholder="Ví dụ: Năm tới tôi có nên chuyển việc không?"
          data-testid="co-van-o-cau-hoi"
          className="mt-2 w-full rounded-xl border border-line bg-bg/80 px-3.5 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-gold focus:outline-none"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="co-van-goi-y">
          {dsGoiY.map((g) => (
            <button key={g} type="button" onClick={() => setCauHoi(g)}
              className="rounded-full border border-line/70 bg-bg/50 px-3 py-1 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
              {g}
            </button>
          ))}
        </div>

        {/* BẬC 1: CHỈ CẦN NGÀY SINH & GIỚI TÍNH */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cv-ngay-sinh" className="block text-xs font-medium text-fg-muted">
              Ngày sinh dương lịch (chưa biết giờ sinh vẫn xem được)
            </label>
            <input
              id="cv-ngay-sinh"
              type="date"
              required
              min="1930-01-01"
              max="2025-12-31"
              value={ngaySinh}
              onChange={(e) => setNgaySinh(e.target.value)}
              data-testid="co-van-ngay-sinh"
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg/80 px-3 text-sm text-fg focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cv-gioi-tinh" className="block text-xs font-medium text-fg-muted">
              Giới tính
            </label>
            <select
              id="cv-gioi-tinh"
              value={gioiTinh}
              onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
              data-testid="co-van-gioi-tinh"
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg/80 px-3 text-sm text-fg focus:border-gold focus:outline-none"
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
        </div>

        {/* THANH MỞ BẬC 2 & BẬC 3 TUỲ CHỌN */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMoBac2((v) => !v)}
            data-testid="co-van-mo-bac-2"
            aria-expanded={moBac2}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              moBac2 ? "border-gold bg-gold/15 text-gold" : "border-line/80 text-fg-muted hover:text-fg",
            )}
          >
            <Layers className="size-3.5" aria-hidden />
            {moBac2 ? "Đang dùng giờ sinh (Bát tự đủ tám chữ, Tử vi)" : "+ Thêm giờ sinh (mở Bát tự đủ tám chữ và Tử vi)"}
          </button>
          <button
            type="button"
            onClick={() => setMoBac3((v) => !v)}
            data-testid="co-van-mo-bac-3"
            aria-expanded={moBac3}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              moBac3 ? "border-gold bg-gold/15 text-gold" : "border-line/80 text-fg-muted hover:text-fg",
            )}
          >
            <Layers className="size-3.5" aria-hidden />
            {moBac3 ? "Đang dùng người liên quan" : "+ Thêm đối tác / người thương (nếu việc này có người cùng làm)"}
          </button>
        </div>

        {moBac2 && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line/60 bg-bg/40 p-3.5 sm:grid-cols-2" data-testid="co-van-khung-bac-2">
            <div>
              <label htmlFor="cv-gio-sinh" className="block text-xs text-fg-muted">Giờ sinh chính xác (HH:MM)</label>
              <input
                id="cv-gio-sinh"
                type="time"
                value={gioSinh}
                onChange={(e) => setGioSinh(e.target.value)}
                data-testid="co-van-gio-sinh"
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              />
            </div>
            <div>
              <label htmlFor="cv-noi-sinh" className="block text-xs text-fg-muted">Nơi sinh</label>
              <input
                id="cv-noi-sinh"
                type="text"
                value={noiSinh}
                onChange={(e) => setNoiSinh(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              />
            </div>
          </div>
        )}

        {moBac3 && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line/60 bg-bg/40 p-3.5 sm:grid-cols-3" data-testid="co-van-khung-bac-3">
            <div>
              <label htmlFor="cv-dt-ngay" className="block text-xs text-fg-muted">Ngày sinh đối tác / người thương</label>
              <input
                id="cv-dt-ngay"
                type="date"
                min="1930-01-01"
                max="2025-12-31"
                value={ngaySinhDoiTac}
                onChange={(e) => setNgaySinhDoiTac(e.target.value)}
                data-testid="co-van-doi-tac-ngay"
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              />
            </div>
            <div>
              <label htmlFor="cv-dt-gt" className="block text-xs text-fg-muted">Giới tính người liên quan</label>
              <select
                id="cv-dt-gt"
                value={gioiTinhDoiTac}
                onChange={(e) => setGioiTinhDoiTac(e.target.value as "nam" | "nu")}
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              >
                <option value="nu">Nữ</option>
                <option value="nam">Nam</option>
              </select>
            </div>
            {ngaySinhDoiTac && (
              <label className="flex items-start gap-2 text-xs text-fg-muted sm:col-span-3">
                <input type="checkbox" checked={dongYDoiTac} onChange={(e) => setDongYDoiTac(e.target.checked)}
                  data-testid="co-van-doi-tac-dong-y" className="mt-0.5" />
                <span>Người này đã đồng ý cho dùng ngày sinh để tính. Ngày sinh chỉ gửi đi để tính rồi bỏ, không lưu, không in lại trong kết quả.</span>
              </label>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={dang || cauHoi.trim().length < 3 || !ngaySinh}
            data-testid="co-van-nut-gui"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Sparkles className="size-4" aria-hidden />
            {dang ? "Đang xem ba cách…" : "Xem ba cách nhìn"}
          </button>
          {macDinhCheDo === "doi_song" && (
            <Link href="/co-van-kinh-doanh" className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline">
              <span>Dành cho chủ cơ sở và người định góp vốn</span>
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        <p className="mt-3 text-xs text-fg-faint">Miễn phí. Không lưu câu hỏi hay ngày sinh. Hệ thống không quyết thay bạn.</p>
      </form>

      {loi && (
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="co-van-loi">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>{loi}</span>
        </div>
      )}

      {kq?.an_toan_chan && (
        <section className="rounded-2xl border border-amber-400/50 bg-surface/60 p-5" data-testid="co-van-an-toan">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldAlert className="size-4" aria-hidden /> Điều quan trọng trước tiên</p>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-fg">{kq.an_toan_chan.cau_tra_loi}</p>
        </section>
      )}

      {kq?.chuyen_huong && (
        <section className="rounded-2xl border border-line/80 bg-surface/50 p-5" data-testid="co-van-chuyen-huong" data-ly-do={kq.chuyen_huong.ly_do}>
          <p className="text-base leading-relaxed text-fg">{kq.chuyen_huong.cau}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {kq.chuyen_huong.lien_ket.map((l) => (
              <Link key={l.duong + l.ten} href={l.duong}
                className="inline-flex min-h-10 items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold hover:bg-gold/20">
                {l.ten} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}

      {kq?.ba_tru_tam_tai && kq.tra_loi && kq.hieu_cau && (
        <div className="space-y-6" data-testid="co-van-ket-qua" ref={khungKq}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="co-van-hieu-cau">
            <Target className="size-3.5 text-gold" aria-hidden />
            <span>{kq.hieu_cau.cau}</span>
          </div>
          {kq.hieu_cau.ghi_chu && (
            <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200" data-testid="co-van-ghi-chu-khung">{kq.hieu_cau.ghi_chu}</p>
          )}

          {/* CÂU TRẢ LỜI ĐỨNG ĐẦU — đúng việc, đúng khung thời gian, điều kiện và việc đầu tiên */}
          <section className="rounded-2xl border border-gold/45 bg-surface-2/50 p-5 sm:p-6" data-testid="co-van-tra-loi">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-3 py-0.5 text-[11px] font-semibold", MAU_NGHIENG[kq.tra_loi.nghieng])}>{CHU_NGHIENG[kq.tra_loi.nghieng]}</span>
              <span className="text-[11px] uppercase tracking-wider text-gold">{kq.hieu_cau.viec.ten}</span>
            </div>
            <p className="mt-3 font-serif text-xl leading-snug text-fg sm:text-2xl" data-testid="co-van-tra-loi-cau">{kq.tra_loi.cau}</p>
            {kq.tra_loi.thang_hoi && (
              <p className={cn("mt-3 rounded-xl border px-4 py-2.5 text-sm leading-relaxed", MAU_NGHIENG[kq.tra_loi.thang_hoi.nhip === "day_manh" ? "thuan" : kq.tra_loi.thang_hoi.nhip === "phong_thu" ? "chuan_bi" : "can_nhac"])}
                data-testid="co-van-thang-hoi">{kq.tra_loi.thang_hoi.cau}</p>
            )}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-fg"><ListChecks className="size-4 text-gold" aria-hidden /> {kq.tra_loi.tieu_de_dieu_kien}</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-fg-muted" data-testid="co-van-dieu-kien">
                  {kq.tra_loi.dieu_kien.map((d) => (
                    <li key={d} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden /><span>{d}</span></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-fg">Việc đầu tiên nên làm</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted" data-testid="co-van-truoc-het">{kq.tra_loi.truoc_het}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-fg">{kq.tra_loi.tieu_de_nen_giu}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.tra_loi.nen_giu}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-fg-faint">{kq.tra_loi.nhan_manh}</p>
          </section>

          {/* HƯỚNG: chỉ khi việc này đụng tới không gian — lấy từ hồ sơ trên máy, hoặc đo / chọn như ở Phong thuỷ */}
          {(kq.can_bo_sung || doiHuong) && kq.hieu_cau.viec.khong_gian !== "khong" && (
            <HuongKhongGian
              loai={(kq.can_bo_sung?.loai ?? kq.hieu_cau.viec.khong_gian) as "mat_bang" | "nha_o"}
              nhan={kq.can_bo_sung?.nhan ?? "Đổi hướng"}
              lyDo={kq.can_bo_sung?.ly_do ?? "Chọn một hướng khác để xem lại phần Địa — kết quả cập nhật ngay."}
              nhaHoSo={nhaHoSo}
              cuaHangHoSo={cuaHangHoSo}
              ngaySinh={ngaySinh}
              gioiTinh={gioiTinh}
              onChon={(h, nguon) => {
                const loai = (kq.can_bo_sung?.loai ?? kq.hieu_cau?.viec.khong_gian) as "mat_bang" | "nha_o";
                const moi = loai === "mat_bang" ? { mat_bang: h, nguon } : { nha: h, nguon };
                setHuongChon((c) => ({ ...c, ...moi }));
                setDoiHuong(false);
                void guiCoVan(moi);
              }}
            />
          )}

          {/* DÒNG THỜI GIAN — chỉ năm / khung được hỏi; tháng giống nhau gộp lại */}
          {kq.thoi_gian && (
            <section className="rounded-2xl border border-line/70 bg-surface/40 p-4 sm:p-5" data-testid="co-van-nhip-12">
              <h3 className="flex items-center gap-2 font-serif text-lg text-fg"><CalendarClock className="size-4 text-gold" aria-hidden /> Thời điểm trong {kq.hieu_cau.khung.mac_dinh ? "12 tháng tới" : `năm ${kq.thoi_gian.nam}`}</h3>
              <div className="mt-3 grid grid-cols-12 gap-1" role="img" aria-label="Nhịp từng tháng: xanh là thuận, vàng là đều nhịp, hổ phách là nên đi chậm">
                {kq.thoi_gian.luoi.map((t) => {
                  const hoi = kq.tra_loi?.thang_hoi?.nhan === t.thang;
                  return (
                    <div key={t.thang} className="text-center">
                      <div className={cn("h-7 rounded-md", MAU_NHIP[t.nhip], hoi && "ring-2 ring-fg ring-offset-2 ring-offset-bg")} />
                      <p className={cn("mt-1 text-[10px] tabular-nums", hoi ? "font-semibold text-fg" : "text-fg-faint")}>{t.thang.split("/")[0]}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-3">
                {kq.thoi_gian.cach_lam.map((c) => (
                  <div key={c.nhip} className="rounded-xl border border-line/60 bg-bg/50 p-3.5" data-testid={`co-van-nhip-${c.nhip}`}>
                    <p className={cn("text-sm font-semibold", CHU_NHIP[c.nhip])}>{c.nhan_nhip} · {c.nhan}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg">{c.nen_lam}</p>
                    <ul className="mt-2 space-y-1 text-xs text-fg-muted">
                      {kq.thoi_gian?.doan.filter((d) => d.nhip === c.nhip).map((d) => (
                        <li key={d.nhan + d.ly_do}><span className="font-medium text-fg">{d.nhan}</span>: {d.ly_do}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {kq.thoi_gian.ngay_dep.length > 0 && (
                <div className="mt-4" data-testid="co-van-ngay-dep">
                  <p className="text-sm font-medium text-fg">Ngày hợp việc trong các tháng ấy</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                    {kq.thoi_gian.ngay_dep.map((nd) => (
                      <li key={nd.ngay}><span className="font-medium text-fg">{nd.ngay}</span>{nd.am_lich ? ` (âm ${nd.am_lich})` : ""} — {nd.ly_do}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* BA CÁCH NHÌN — mỗi cách một vai khác nhau; trụ Địa chỉ có khi việc đụng tới không gian và đã có hướng */}
          <div className={cn("grid grid-cols-1 gap-4", kq.ba_tru_tam_tai.dia ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
            {([kq.ba_tru_tam_tai.nhan, kq.ba_tru_tam_tai.thien, kq.ba_tru_tam_tai.dia] as const).filter((x): x is TruTamTai => Boolean(x)).map((tru) => (
              <section key={tru.ma} className="flex flex-col rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid={`co-van-tru-${tru.ma}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-lg text-fg">{tru.ten_tru}</h3>
                  {tru.nhan_tung_mon && (tru.nhan_tung_mon.tuvi || tru.nhan_tung_mon.battu) ? (
                    <span className="flex flex-wrap gap-1">
                      {tru.nhan_tung_mon.tuvi && <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", mauMuc(tru.muc_tung_mon?.tuvi ?? null))}>Tử vi · {tru.nhan_tung_mon.tuvi}</span>}
                      {tru.nhan_tung_mon.battu && <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", mauMuc(tru.muc_tung_mon?.battu ?? null))}>Bát tự · {tru.nhan_tung_mon.battu}</span>}
                    </span>
                  ) : (
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", mauMuc(tru.muc))}>{tru.nhan_muc ?? "Không chấm mức"}</span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-fg-faint">Nguồn: {tru.nguon}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{tru.nhan_xet}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted"><span className="font-medium text-fg">Nên làm: </span>{tru.hanh_dong}</p>
                {tru.ma === "dia" && nguonDia && (
                  <p className="mt-2 text-[11px] text-fg-faint" data-testid="co-van-nguon-huong">
                    Hướng lấy từ {TEN_NGUON_HUONG[nguonDia]}.{" "}
                    <button type="button" onClick={() => setDoiHuong(true)} className="text-gold hover:underline" data-testid="co-van-doi-huong">Đổi hướng</button>
                  </p>
                )}
                {tru.can_cu.length > 0 && <ViSao canCu={tru.can_cu} />}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                  <Link href={tru.lien_ket.duong} className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline">
                    {tru.lien_ket.ten} <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                  <KiemChung loai="doi_song" mau={tru.ma_mau} phai="tam_tai" />
                </div>
              </section>
            ))}
          </div>

          {kq.doi_tac && (
            <section className="rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="co-van-doi-tac">
              <h3 className="font-serif text-lg text-fg">{kq.doi_tac.tieu_de}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.doi_tac.loi}</p>
            </section>
          )}

          {kq.bieu_do_ngu_hanh && (
            <details className="rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="co-van-ngu-hanh">
              <summary className="cursor-pointer font-serif text-lg text-fg">Năm hành trong ngày sinh · Nhật chủ {kq.bieu_do_ngu_hanh.nhat_chu}</summary>
              <p className="mt-2 text-xs text-fg-faint">{kq.bieu_do_ngu_hanh.co_gio ? "Đủ tám chữ (có giờ sinh)" : "Sáu chữ (chưa có giờ sinh)"}</p>
              <div className="mt-3 space-y-1.5">
                {kq.bieu_do_ngu_hanh.hanh.map((h) => (
                  <div key={h.hanh_ma} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-fg">{h.ten}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-line/40">
                      <span className="block h-full rounded-full bg-gold/70" style={{ width: `${Math.min(100, h.ty_le)}%` }} />
                    </span>
                    <span className="w-12 text-right tabular-nums text-fg-muted">{h.ty_le}%</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {kq.ung_dung_co_dien && <KhungUngDungCoDien u={kq.ung_dung_co_dien} />}

          {kq.goi_y_nang_bac && kq.goi_y_nang_bac.length > 0 && (
            <section className="rounded-2xl border border-line/70 bg-bg/40 p-4 text-sm" data-testid="co-van-nang-bac">
              <p className="flex items-center gap-2 font-medium text-fg"><Layers className="size-4 text-gold" aria-hidden /> Thêm dữ kiện để có thêm cách xem</p>
              <ul className="mt-2 space-y-1.5 text-xs text-fg-muted">
                {kq.goi_y_nang_bac.map((g) => <li key={g.nhan}><span className="font-medium text-fg">{g.nhan}</span> — {g.ly_do}</li>)}
              </ul>
            </section>
          )}

          {kq.lien_ket_mach && (
            <Link href={kq.lien_ket_mach.duong}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20">
              <Compass className="size-4" aria-hidden /> Xem kỹ hơn: {kq.lien_ket_mach.ten}
            </Link>
          )}
          {kq.ket && <p className="text-xs leading-relaxed text-fg-faint">{kq.ket}</p>}
        </div>
      )}
    </div>
  );
}
