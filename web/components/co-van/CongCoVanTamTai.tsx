"use client";
// Cố vấn liên mảng Tam Tài (/co-van, tab "Hỏi quyết định" của /co-van-kinh-doanh) — làm lại sau review 2026-11-26:
// ba cách xem đọc riêng (không gộp mức), chỉ dùng phần miễn phí của các báo cáo nên trang miễn phí; câu về người khác,
// chuyện đã xảy ra, người dưới 16 tuổi, câu chưa rõ việc gì → chuyển hướng (engine quyết, web chỉ vẽ).
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarClock, Compass, Layers, ShieldAlert, Sparkles } from "lucide-react";
import Link from "@/components/khung/Lien";
import { SoDoTamTaiSvg, SongNhip12ThangSvg, type NhipThangTamTai, type TruTamTai } from "@/components/co-van/SoDoTamTaiSvg";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { KhungUngDungCoDien } from "@/components/luan-giai/CheDoDoc";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import type { Muc, UngDungCoDien } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

interface KetQuaTamTai {
  an_toan_chan?: { xu_ly: string; loai: string; cau_tra_loi: string };
  chuyen_huong?: { ly_do: string; cau: string; lien_ket: { ten: string; duong: string; mach?: string }[] };
  mach?: string;
  ten_mach?: string;
  lien_ket_mach?: { ten: string; duong: string };
  bac_dau_vao?: 1 | 2 | 3;
  lop_da_dung?: string[];
  goi_y_nang_bac?: { bac_tiep: 2 | 3; nhan: string; ly_do: string }[];
  tong_quan?: { cau: string; nen_giu: string; tieu_de_nen_giu: string };
  ba_tru_tam_tai?: { nhan: TruTamTai; thien: TruTamTai; dia: TruTamTai };
  bieu_do_ngu_hanh?: {
    nhat_chu: string;
    co_gio: boolean;
    hanh: { hanh_ma: string; ten: string; diem: number; ty_le: number; trang_thai: "thieu" | "vua" | "thua" }[];
  };
  nhip_12_thang?: NhipThangTamTai[];
  ngay_dep_30_ngay?: { ngay: string; am_lich: string; truc: string; ly_do: string }[];
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
  const [doHuong, setDoHuong] = useState("");
  const [namXay, setNamXay] = useState("");
  const [ngaySinhDoiTac, setNgaySinhDoiTac] = useState("");
  const [gioiTinhDoiTac, setGioiTinhDoiTac] = useState<"nam" | "nu">("nu");
  const [dongYDoiTac, setDongYDoiTac] = useState(false);

  const hs = useHoSo();
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaTamTai | null>(null);
  const [chonThangIdx, setChonThangIdx] = useState(0);

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

  async function guiCoVan() {
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
      const huongNum = moBac3 && doHuong.trim() !== "" ? Number(doHuong) : null;
      const namXayNum = moBac3 && namXay.trim() !== "" ? Number(namXay) : null;
      const body: Record<string, unknown> = {
        cau_hoi: cauHoi.trim(),
        ngay_sinh: ngaySinh,
        gioi_tinh: gioiTinh,
        gio_sinh: coGio ? gioSinh.trim() : null,
        do_tin_gio: coGio ? "exact" : "unknown",
        noi_sinh: coGio && noiSinh.trim() ? noiSinh.trim().slice(0, 60) : null,
        nha: huongNum !== null && !Number.isNaN(huongNum) && huongNum >= 0 && huongNum < 360
          ? { do_huong: huongNum, ...(namXayNum && namXayNum >= 1864 && namXayNum <= 2043 ? { nam_xay: namXayNum } : {}) }
          : null,
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
      setChonThangIdx(0);
      ghi("chart_interacted", {
        mo_dun: "tam_tai", kind: "co_van_xem", ket_qua: data.an_toan_chan ? data.an_toan_chan.xu_ly : data.chuyen_huong?.ly_do ?? data.mach ?? "",
        bac: data.bac_dau_vao ?? 0,
      });
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
            <Compass className="size-3.5" aria-hidden />
            {moBac3 ? "Đang dùng hướng nhà / người liên quan" : "+ Thêm hướng nhà hoặc người liên quan"}
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
              <label htmlFor="cv-nam-xay" className="block text-xs text-fg-muted">Năm xây (nếu biết)</label>
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
            {ngaySinhDoiTac && (
              <label className="flex items-start gap-2 text-xs text-fg-muted sm:col-span-2 lg:col-span-4">
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

      {kq?.ba_tru_tam_tai && kq.tong_quan && (
        <div className="space-y-6" data-testid="co-van-ket-qua">
          <section className="rounded-2xl border border-gold/40 bg-surface-2/40 p-5">
            <p className="text-xs uppercase tracking-wider text-gold">{kq.ten_mach}</p>
            <p className="mt-2 text-base leading-relaxed text-fg" data-testid="co-van-tong-quan">{kq.tong_quan.cau}</p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              <span className="font-medium text-fg">{kq.tong_quan.tieu_de_nen_giu}: </span>{kq.tong_quan.nen_giu}
            </p>
            {kq.lop_da_dung && kq.lop_da_dung.length > 0 && (
              <p className="mt-3 text-xs text-fg-faint">Đã dùng: {kq.lop_da_dung.join(" · ")}</p>
            )}
          </section>

          <SoDoTamTaiSvg
            tenMach={kq.ten_mach}
            baTru={kq.ba_tru_tam_tai}
            onChonTru={(ma) => ghi("chart_interacted", { mo_dun: "tam_tai", kind: "chon_dinh_tam_tai", tru: ma })}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {([kq.ba_tru_tam_tai.nhan, kq.ba_tru_tam_tai.thien, kq.ba_tru_tam_tai.dia] as const).map((tru) => (
              <section key={tru.ma} className="flex flex-col rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid={`co-van-tru-${tru.ma}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-lg text-fg">{tru.ten_tru}</h3>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", mauMuc(tru.muc))}>
                    {tru.nhan_muc ?? "Không chấm mức"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-fg-faint">Nguồn: {tru.nguon}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{tru.nhan_xet}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted"><span className="font-medium text-fg">Nên làm: </span>{tru.hanh_dong}</p>
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

          {kq.nhip_12_thang && kq.nhip_12_thang.length > 0 && (
            <section className="rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="co-van-nhip-12">
              <h3 className="flex items-center gap-2 font-serif text-lg text-fg"><CalendarClock className="size-4 text-gold" aria-hidden /> 12 tháng tới</h3>
              <SongNhip12ThangSvg
                danhSach={kq.nhip_12_thang}
                chonIndex={chonThangIdx}
                onChonThang={(idx) => {
                  setChonThangIdx(idx);
                  ghi("chart_interacted", { mo_dun: "tam_tai", kind: "chon_nhip_thang", thang: kq.nhip_12_thang?.[idx]?.thang ?? "" });
                }}
              />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {kq.nhip_12_thang.map((th, idx) => (
                  <button
                    key={th.thang}
                    type="button"
                    onClick={() => setChonThangIdx(idx)}
                    aria-pressed={chonThangIdx === idx}
                    className={cn(
                      "rounded-lg border bg-bg/60 p-2.5 text-left text-xs transition-colors",
                      chonThangIdx === idx ? "border-gold ring-1 ring-gold/60" : "border-line/60 hover:border-gold/40",
                    )}
                  >
                    <p className="font-semibold text-fg">{th.thang}</p>
                    <p className={cn("mt-0.5", th.nhip === "day_manh" ? "text-jade" : th.nhip === "phong_thu" ? "text-amber-300" : "text-gold")}>{th.nhan_nhip}</p>
                    {th.goi_y && <p className="mt-1 leading-snug text-fg-muted">{th.goi_y}</p>}
                  </button>
                ))}
              </div>
              {kq.ngay_dep_30_ngay && kq.ngay_dep_30_ngay.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-fg">Ngày hợp việc trong 30 ngày tới</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                    {kq.ngay_dep_30_ngay.map((nd) => (
                      <li key={nd.ngay}><span className="font-medium text-fg">{nd.ngay}</span>{nd.am_lich ? ` (âm ${nd.am_lich})` : ""}{nd.ly_do ? ` — ${nd.ly_do}` : ""}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {kq.bieu_do_ngu_hanh && (
            <section className="rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="co-van-ngu-hanh">
              <h3 className="font-serif text-lg text-fg">Năm hành trong ngày sinh · Nhật chủ {kq.bieu_do_ngu_hanh.nhat_chu}</h3>
              <p className="mt-0.5 text-xs text-fg-faint">{kq.bieu_do_ngu_hanh.co_gio ? "Đủ tám chữ (có giờ sinh)" : "Sáu chữ (chưa có giờ sinh)"}</p>
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
            </section>
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
