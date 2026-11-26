"use client";
// Chặng 2 — Cổng Cố vấn Liên mảng Tam Tài (Nhân · Thiên · Địa, 0% ngõ cụt qua 3 Bậc đầu vào, Giao diện 5 Khối Trực Quan).
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarClock, Compass, Layers, LockKeyhole, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import Link from "@/components/khung/Lien";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { CongTacCheDoDoc, KhungUngDungCoDien } from "@/components/luan-giai/CheDoDoc";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import type { BaoCaoDoiSong, Muc, UngDungCoDien } from "@/components/luan-giai/kieu";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

interface TruTamTai {
  ma: "nhan" | "thien" | "dia";
  ten_tru: string;
  vai_tro: string;
  muc: Muc;
  nhan_muc: string;
  nhan_xet: string;
  hanh_dong: string;
  can_cu: string[];
}

interface KetQuaTamTai extends BaoCaoDoiSong {
  an_toan_chan?: { xu_ly: string; loai: string; cau_tra_loi: string } | null;
  mach?: string;
  ten_mach?: string;
  bac_dau_vao?: 1 | 2 | 3;
  lop_da_dung?: string[];
  goi_y_nang_bac?: { bac_tiep: 2 | 3; nhan: string; ly_do: string }[];
  ket_luan_5_giay?: {
    nhip: "thuan_mo" | "chuan_bi_chac" | "giu_phong_thu";
    nhan_nhip: string;
    cau_ket_luan: string;
    diem_tua_chinh: string;
    diem_can_giu: string;
    ma_mau: string;
  };
  ba_tru_tam_tai?: { nhan: TruTamTai; thien: TruTamTai; dia: TruTamTai };
  bieu_do_ngu_hanh?: {
    nhat_chu: string;
    co_gio: boolean;
    hanh: { hanh_ma: string; ten: string; diem: number; ty_le: number; trang_thai: "thieu" | "vua" | "thua" }[];
  };
  nhip_12_thang?: { thang: string; nhip: "day_manh" | "can_bang" | "phong_thu"; nhan_nhip: string; goi_y?: string; khoa?: boolean }[];
  ngay_dep_30_ngay?: { ngay: string; am_lich: string; truc: string; ly_do: string }[];
  ung_dung_co_dien?: UngDungCoDien;
}

const GOI_Y_DOI_SONG = [
  "Năm tới tôi có nên nghỉ việc ra làm riêng không?",
  "Đang có khoản tích luỹ nên đầu tư hay giữ tiền mặt?",
  "Gia đình định mua nhà chuyển chỗ ở cuối năm nay có thuận không?",
  "Vợ chồng dạo này hay căng thẳng vì chuyện nhỏ làm sao hoà giải?",
  "Mình mới bước qua đổ vỡ tình cảm, bao giờ thuận mở lòng lại?",
  "Dạo này làm việc quá tải mất ngủ nên lấy lại sức bền thế nào?",
];

const GOI_Y_KINH_DOANH = [
  "Quý tới có nên mở thêm chi nhánh hay giữ chắc điểm hiện tại?",
  "Tôi định hùn vốn mở quán với bạn thân cần rào chắn điều gì?",
  "Mặt bằng hướng Nam xây năm 2024 có hợp mở cửa hàng lúc này không?",
  "Đang kẹt dòng tiền công nợ nên thu hẹp hay xoay vốn ngắn hạn?",
];

function mauMuc(m: Muc) {
  if (m === "thuan") return "border-jade/45 bg-jade/10 text-jade";
  if (m === "can_chu_dong") return "border-amber-400/45 bg-amber-500/10 text-amber-300";
  return "border-gold/45 bg-gold/10 text-gold";
}

function mauNhipKetLuan(n: "thuan_mo" | "chuan_bi_chac" | "giu_phong_thu") {
  if (n === "thuan_mo") return "border-jade/50 bg-jade/10 text-jade";
  if (n === "giu_phong_thu") return "border-amber-400/50 bg-amber-500/10 text-amber-300";
  return "border-gold/50 bg-gold/10 text-gold";
}

export function CongCoVanTamTai({ macDinhCheDo = "doi_song" }: { macDinhCheDo?: "doi_song" | "kinh_doanh" }) {
  const [cauHoi, setCauHoi] = useState(macDinhCheDo === "kinh_doanh" ? GOI_Y_KINH_DOANH[0]! : GOI_Y_DOI_SONG[0]!);
  const [ngaySinh, setNgaySinh] = useState("1990-05-15");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [moBac2, setMoBac2] = useState(false);
  const [gioSinh, setGioSinh] = useState("");
  const [noiSinh, setNoiSinh] = useState("ha-noi");
  const [moBac3, setMoBac3] = useState(false);
  const [doHuong, setDoHuong] = useState("");
  const [namXay, setNamXay] = useState("2024");
  const [ngaySinhDoiTac, setNgaySinhDoiTac] = useState("");
  const [gioiTinhDoiTac, setGioiTinhDoiTac] = useState<"nam" | "nu">("nu");

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

  async function guiCoVan(moKhoa = false) {
    if (cauHoi.trim().length < 3 || !ngaySinh || dang) return;
    setDang(true);
    setLoi(null);
    try {
      const coGio = moBac2 && /^([01]\d|2[0-3]):[0-5]\d$/.test(gioSinh.trim());
      const huongNum = moBac3 && doHuong.trim() !== "" ? Number(doHuong) : null;
      const namXayNum = moBac3 && namXay.trim() !== "" ? Number(namXay) : null;
      const body: Record<string, unknown> = {
        cau_hoi: cauHoi.trim(),
        ngay_sinh: ngaySinh,
        gioi_tinh: gioiTinh,
        gio_sinh: coGio ? gioSinh.trim() : null,
        do_tin_gio: coGio ? "exact" : "unknown",
        noi_sinh: coGio ? noiSinh : null,
        nha: huongNum !== null && !Number.isNaN(huongNum) && huongNum >= 0 && huongNum < 360
          ? { do_huong: huongNum, ...(namXayNum && namXayNum >= 1864 && namXayNum <= 2043 ? { nam_xay: namXayNum } : {}) }
          : null,
        doi_tac: moBac3 && /^\d{4}-\d{2}-\d{2}$/.test(ngaySinhDoiTac)
          ? { ngay_sinh: ngaySinhDoiTac, gioi_tinh: gioiTinhDoiTac, vai_tro: macDinhCheDo === "kinh_doanh" ? "gop_von" : "nguoi_thuong" }
          : null,
        che_do: macDinhCheDo,
      };
      const res = await fetch("/api/co-van", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(moKhoa ? { "x-mo-khoa": "1" } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as (KetQuaTamTai & { error?: string }) | null;
      if (!res.ok || !data) {
        setLoi(data?.error ?? "Chưa tải được lời cố vấn lúc này, bạn thử lại sau ít giây nhé.");
        return;
      }
      setKq(data);
    } catch {
      setLoi("Kết nối tạm gián đoạn, bạn kiểm tra mạng rồi thử lại nhé.");
    } finally {
      setDang(false);
    }
  }

  const dsGoiY = macDinhCheDo === "kinh_doanh" ? GOI_Y_KINH_DOANH : GOI_Y_DOI_SONG;

  return (
    <div className="space-y-8" data-testid="cong-co-van-tam-tai">
      {/* FORM NHẬP THÍCH NGHI 3 BẬC (0% NGÕ CỤT) */}
      <form
        onSubmit={(e) => { e.preventDefault(); void guiCoVan(false); }}
        className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-6"
        data-testid="co-van-form"
      >
        <label htmlFor="cv-cau-hoi" className="block text-sm font-medium text-fg">
          Điều bạn đang trăn trở hoặc sắp quyết định
        </label>
        <textarea
          id="cv-cau-hoi"
          rows={2}
          value={cauHoi}
          onChange={(e) => setCauHoi(e.target.value)}
          placeholder="Ví dụ: Năm tới tôi có nên chuyển việc không? Hoặc có nên hùn vốn mở quán với bạn?"
          data-testid="co-van-o-cau-hoi"
          className="mt-2 w-full rounded-xl border border-line bg-bg/80 px-3.5 py-2.5 text-base text-fg placeholder:text-fg-faint focus:border-gold focus:outline-none"
        />

        <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="co-van-goi-y">
          {dsGoiY.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setCauHoi(g)}
              className="rounded-full border border-line/70 bg-bg/50 px-3 py-1 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg"
            >
              {g}
            </button>
          ))}
        </div>

        {/* BẬC 1: CHỈ CẦN NGÀY SINH & GIỚI TÍNH */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cv-ngay-sinh" className="block text-xs font-medium text-fg-muted">
              Bậc 1 · Ngày sinh dương lịch (chưa biết giờ sinh vẫn xem được ngay)
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
            {moBac2 ? "Đang bật Bậc 2: Giờ sinh (Tứ trụ & Tử vi)" : "+ Thêm Giờ sinh (Bậc 2 · mở Tử vi & Kỵ chuyển Kỵ)"}
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
            <Compass className="size-3.5" aria-hidden />
            {moBac3 ? "Đang bật Bậc 3: Hướng nhà / Đối tác" : "+ Thêm Hướng nhà hoặc Ngày sinh Đối tác (Bậc 3 · Vận 9)"}
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
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line/60 bg-bg/40 p-3.5 sm:grid-cols-2 lg:grid-cols-4" data-testid="co-van-khung-bac-3">
            <div>
              <label htmlFor="cv-do-huong" className="block text-xs text-fg-muted">Độ la bàn cửa/mặt bằng (0–359°)</label>
              <input
                id="cv-do-huong"
                type="number"
                min={0}
                max={359.9}
                step="0.1"
                placeholder="VD: 180"
                value={doHuong}
                onChange={(e) => setDoHuong(e.target.value)}
                data-testid="co-van-do-huong"
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              />
            </div>
            <div>
              <label htmlFor="cv-nam-xay" className="block text-xs text-fg-muted">Năm xây/nhập trạch</label>
              <input
                id="cv-nam-xay"
                type="number"
                min={1864}
                max={2043}
                value={namXay}
                onChange={(e) => setNamXay(e.target.value)}
                data-testid="co-van-nam-xay"
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg"
              />
            </div>
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
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={dang}
            data-testid="co-van-nut-gui"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Sparkles className="size-4" aria-hidden />
            {dang ? "Đang tổng hợp 3 trụ Tam Tài…" : "Phân tích Tam Tài (Nhân · Thiên · Địa)"}
          </button>
          {macDinhCheDo === "doi_song" && (
            <Link href="/co-van-kinh-doanh" className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline">
              <span>Dành cho Chủ cơ sở &amp; Co-founder (Bàn cờ E2EE)</span>
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </form>

      {loi && (
        <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="co-van-loi">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>{loi}</span>
        </div>
      )}

      {/* CỔNG AN TOÀN KHỦNG HOẢNG / TỪ CHỐI */}
      {kq?.an_toan_chan && (
        <section className="rounded-2xl border border-amber-400/50 bg-surface/60 p-5" data-testid="co-van-an-toan">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
            <p className="text-base leading-relaxed text-fg">{kq.an_toan_chan.cau_tra_loi}</p>
          </div>
        </section>
      )}

      {/* GIAO DIỆN 5 KHỐI TRỰC QUAN KHI CÓ KẾT QUẢ */}
      {kq && !kq.an_toan_chan && kq.ket_luan_5_giay && kq.ba_tru_tam_tai && (
        <div className="space-y-6" data-testid="co-van-ket-qua">
          {/* KHỐI 1: KẾT LUẬN THẲNG 5 GIÂY + CÔNG TẮC 2 CHẾ ĐỘ + KIỂM CHỨNG */}
          <section className="rounded-2xl border border-gold/45 bg-surface/50 p-5 sm:p-6" data-testid="co-van-khoi-1-ket-luan">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                  Bậc {kq.bac_dau_vao}/3 · {kq.ten_mach}
                </span>
                <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", mauNhipKetLuan(kq.ket_luan_5_giay.nhip))}>
                  {kq.ket_luan_5_giay.nhan_nhip}
                </span>
              </div>
              <CongTacCheDoDoc moDun="tam_tai" nho />
            </div>

            <h2 className="mt-4 font-serif text-2xl leading-snug text-fg">{kq.ket_luan_5_giay.cau_ket_luan}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-jade/30 bg-jade/5 p-3.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-jade">Điểm tựa chính để triển khai</p>
                <p className="mt-1 leading-relaxed text-fg-muted">{kq.ket_luan_5_giay.diem_tua_chinh}</p>
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-3.5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">Ranh giới cần giữ chắc</p>
                <p className="mt-1 leading-relaxed text-fg-muted">{kq.ket_luan_5_giay.diem_can_giu}</p>
              </div>
            </div>

            {kq.lop_da_dung && kq.lop_da_dung.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {kq.lop_da_dung.map((lop) => (
                  <span key={lop} className="rounded-md border border-line/60 bg-bg/50 px-2 py-0.5 text-[11px] text-fg-faint">
                    ✓ {lop}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-line/60 pt-3">
              <KiemChung loai="doi_song" mau={kq.ket_luan_5_giay.ma_mau} phai="tam_tai" cauHoi="Tổng hợp 3 mặt này sát với tình huống của bạn?" />
            </div>
          </section>

          {/* KHỐI 2: BA TRỤ TAM TÀI PHÂN VAI TRỰC GIAO (NHÂN · THIÊN · ĐỊA) */}
          <section aria-label="Ba trụ Tam Tài" className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="co-van-khoi-2-ba-tru">
            {([kq.ba_tru_tam_tai.nhan, kq.ba_tru_tam_tai.thien, kq.ba_tru_tam_tai.dia] as const).map((tru) => (
              <div key={tru.ma} className="flex flex-col justify-between rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg text-fg">{tru.ten_tru}</h3>
                    <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium", mauMuc(tru.muc))}>
                      {tru.nhan_muc}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-fg-faint">{tru.vai_tro}</p>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{tru.nhan_xet}</p>
                  <p className="mt-2.5 rounded-xl border border-line/60 bg-bg/50 p-3 text-xs leading-relaxed text-fg">
                    <span className="font-semibold text-gold">Việc nên làm: </span>{tru.hanh_dong}
                  </p>
                </div>
                <div className="mt-3">
                  <ViSao canCu={tru.can_cu} nho />
                </div>
              </div>
            ))}
          </section>

          {/* KHỐI 3: DẢI NHỊP 12 THÁNG TỚI & NGÀY ĐẸP 30 NGÀY */}
          {kq.nhip_12_thang && kq.nhip_12_thang.length > 0 && (
            <section className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-5" data-testid="co-van-khoi-3-nhip-12-thang">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-gold" aria-hidden />
                  <h3 className="font-serif text-xl text-fg">Dải nhịp 12 tháng tới (Tiến · Giữ · Rà soát)</h3>
                </div>
                {kq.nhip_12_thang.some((m) => m.khoa) && (
                  <span className="inline-flex items-center gap-1 text-xs text-gold">
                    <LockKeyhole className="size-3.5" aria-hidden /> Mở trọn bài bên dưới để xem gợi ý chi tiết từng tháng &amp; ngày đẹp
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {kq.nhip_12_thang.map((th) => (
                  <div key={th.thang} className="rounded-xl border border-line/70 bg-bg/60 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold text-fg">{th.thang}</span>
                      <span className={cn("h-2 w-2 rounded-full",
                        th.nhip === "day_manh" ? "bg-jade" : th.nhip === "phong_thu" ? "bg-amber-400" : "bg-gold")} />
                    </div>
                    <p className={cn("mt-1 font-medium",
                      th.nhip === "day_manh" ? "text-jade" : th.nhip === "phong_thu" ? "text-amber-300" : "text-gold")}>
                      {th.nhan_nhip}
                    </p>
                    {th.goi_y && <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-fg-muted">{th.goi_y}</p>}
                  </div>
                ))}
              </div>

              {kq.ngay_dep_30_ngay && kq.ngay_dep_30_ngay.length > 0 && (
                <div className="mt-4 border-t border-line/60 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">3 Ngày thuận hành động trong 30 ngày tới (Hoàng lịch)</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {kq.ngay_dep_30_ngay.map((nd) => (
                      <div key={nd.ngay} className="rounded-lg border border-line/60 bg-bg/50 px-3 py-2 text-xs">
                        <p className="font-semibold text-fg">{nd.ngay} <span className="font-normal text-fg-faint">(ÂL {nd.am_lich} · Trực {nd.truc})</span></p>
                        {nd.ly_do && <p className="mt-0.5 text-fg-muted">{nd.ly_do}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* KHỐI 4: BIỂU ĐỒ 5 HÀNH NỘI LỰC & KHUNG ỨNG DỤNG CỔ ĐIỂN / VẬN 9 */}
          {kq.bieu_do_ngu_hanh && (
            <section className="rounded-2xl border border-line/80 bg-surface/40 p-4 sm:p-5" data-testid="co-van-khoi-4-ngu-hanh">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-xl text-fg">Cấu trúc 5 Hành Nội lực · Nhật chủ {kq.bieu_do_ngu_hanh.nhat_chu}</h3>
                <span className="text-xs text-fg-faint">
                  {kq.bieu_do_ngu_hanh.co_gio ? "Đủ Tứ Trụ (8 chữ)" : "Tam Trụ chuẩn (6 chữ — không gán giả giờ sinh)"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {kq.bieu_do_ngu_hanh.hanh.map((h) => (
                  <div key={h.hanh_ma} className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 text-xs">
                    <span className="font-medium text-fg">{h.ten}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                      <div
                        className={cn("h-full rounded-full",
                          h.trang_thai === "thieu" ? "bg-amber-400" : h.trang_thai === "thua" ? "bg-gold" : "bg-jade")}
                        style={{ width: `${Math.max(6, Math.min(100, h.ty_le))}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-fg-muted">
                      {h.ty_le}% ({h.trang_thai === "thieu" ? "cần bù" : h.trang_thai === "thua" ? "dồi dào" : "cân bằng"})
                    </span>
                  </div>
                ))}
              </div>
              <KhungUngDungCoDien u={kq.ung_dung_co_dien} />
            </section>
          )}

          {/* KHỐI 5: GỢI Ý NÂNG BẬC 1 CHẠM & BÁO CÁO ĐẦY ĐỦ 4 CHƯƠNG */}
          <section className="space-y-4" data-testid="co-van-khoi-5-nang-bac">
            {kq.goi_y_nang_bac && kq.goi_y_nang_bac.length > 0 && (
              <div className="rounded-2xl border border-dashed border-gold/45 bg-gold/5 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  <UserCheck className="size-4" aria-hidden /> Tăng độ sâu phân tích cho quyết định này
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {kq.goi_y_nang_bac.map((gy) => (
                    <button
                      key={gy.nhan}
                      type="button"
                      onClick={() => {
                        if (gy.bac_tiep === 2) setMoBac2(true);
                        else setMoBac3(true);
                        document.getElementById("cv-cau-hoi")?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="rounded-xl border border-line/70 bg-bg/70 p-3 text-left text-xs transition-colors hover:border-gold"
                    >
                      <p className="font-semibold text-fg">{gy.nhan}</p>
                      <p className="mt-0.5 text-fg-muted">{gy.ly_do}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kq.chuong.length > 0 && (
              <div className="rounded-2xl border border-line/70 bg-surface/30 p-4 sm:p-6">
                <BaoCaoDoiSongView
                  bc={kq}
                  ten={kq.ten_mach ?? "quyết định của bạn"}
                  phanKhoa={kq.so_khoa ? (
                    <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
                      <p className="font-medium text-fg">Còn {kq.so_khoa} chương chuyên sâu (Nhịp 12 tháng, Ngày đẹp &amp; Đòn bẩy không gian) đang khoá.</p>
                      <button
                        type="button"
                        onClick={() => void guiCoVan(true)}
                        data-testid="co-van-mo-khoa-sao"
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-bg"
                      >
                        <LockKeyhole className="size-3.5" aria-hidden /> Mở toàn bộ báo cáo Cố vấn Tam Tài
                      </button>
                    </div>
                  ) : undefined}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
