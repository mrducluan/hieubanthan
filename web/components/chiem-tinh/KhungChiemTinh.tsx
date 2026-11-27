"use client";
// Chặng 4.2 — Khung tương tác trang /chiem-tinh: Bản đồ sao Natal & Vận hạn · Cầu nối Đông–Tây · Synastry 2 người.
import { useEffect, useState } from "react";
import { ArrowUpRight, Compass, Globe2, Orbit, Sparkles, Users } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";
import { BanDoSaoSvg, type GocChieuBieuDo, type HanhTinhBieuDo } from "./BanDoSaoSvg";

interface HanhTinhChiTiet extends HanhTinhBieuDo {
  cung_ma: string;
  cung_ky_hieu: string;
  nha: number | null;
  diem_sang: string;
  nen_de_y: string;
  viec_ung_dung: string;
  y_nha?: string | null;
}

interface KetQuaBanDo {
  chuyen_huong_tuoi?: { tuoi: number; thong_bao: string };
  phuong_phap_lich?: string;
  co_gio_sinh?: boolean;
  dau_vao?: { ngay_sinh: string; gio_sinh?: string | null; ten_noi: string; utc_offset: number };
  he_nha?: { ma: string; ten: string; giai_thich: string; canh_bao_vi_do_cao: boolean };
  truc?: {
    asc: { kinh_do: number; do_cung: number; cung_ten: string; dien_giai: string };
    mc: { kinh_do: number; do_cung: number; cung_ten: string; dien_giai: string };
  } | null;
  nha?: { so: number; kinh_do: number; do_cung: number; cung_ten: string; cung_ky_hieu: string; ten_nha: string }[] | null;
  ghi_chu_mat_trang?: string | null;
  hanh_tinh?: HanhTinhChiTiet[];
  goc_chieu?: (GocChieuBieuDo & { ten_diem_1: string; ten_diem_2: string; ten_loai: string; sai_so: number; cach_doc: string })[];
  phan_bo_nguyen_to?: { lua: number; dat: number; khi: number; nuoc: number };
  van_han?: {
    ngay_xem: string;
    tuoi_nam: number;
    saturn_return: { ten: string; y_nghia: string; viec_nen_lam: string[]; goc_lech_tho_tinh: number };
    jupiter_return: { dien_giai: string };
    solar_return: { nam: number; thoi_diem_utc: string; nha_mat_troi_solar_return?: number | null; giai_thich: string };
    transit_noi_bat: { ten_transit: string; ten_natal: string; ten_loai: string; sai_so: number; cach_doc: string }[];
  };
  cau_noi_dong_tay?: {
    nguyen_tac: { tieu_de: string; giai_thich: string };
    tom_tat_phuong_dong: string;
    tom_tat_phuong_tay: string;
    bon_chieu: { ma: string; ten: string; phuong_dong: string; phuong_tay: string }[];
  } | null;
}

interface KetQuaSynastry {
  ranh_gioi: { dong_y: string; khong_cham_diem: string };
  cac_chieu_tuong_tac: {
    ma: string;
    ten: string;
    goi_y_ung_xu: string;
    goc_chieu: { nguoi_a: string; nguoi_b: string; ten_loai: string; sai_so: number; cach_doc: string }[];
  }[];
}

export function KhungChiemTinh() {
  const hs = useHoSo();
  const [tab, setTab] = useState<"ban_do" | "cau_noi" | "hop_doi">("ban_do");
  const [ngaySinh, setNgaySinh] = useState("1997-03-15");
  const [gioSinh, setGioSinh] = useState("09:30");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [noiSinh, setNoiSinh] = useState("ha-noi");
  const [heNha, setHeNha] = useState<"whole_sign" | "placidus">("whole_sign");

  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaBanDo | null>(null);
  const [htChon, setHtChon] = useState<string | null>("mat_troi");

  // Synastry state
  const [nsDoiTac, setNsDoiTac] = useState("");
  const [gioDoiTac, setGioDoiTac] = useState("");
  const [dongYDoiTac, setDongYDoiTac] = useState(false);
  const [dangTaiSyn, setDangTaiSyn] = useState(false);
  const [loiSyn, setLoiSyn] = useState<string | null>(null);
  const [kqSyn, setKqSyn] = useState<KetQuaSynastry | null>(null);

  useEffect(() => {
    if (!hs) return;
    setNgaySinh(ngaySinhIso(hs));
    if (hs.gio && hs.do_tin_gio !== "unknown") setGioSinh(hs.gio);
    if (hs.gioi_tinh === "nam" || hs.gioi_tinh === "nu") setGioiTinh(hs.gioi_tinh);
  }, [hs]);

  async function lapBanDo(e: React.FormEvent) {
    e.preventDefault();
    setDangTai(true);
    setLoi(null);
    try {
      const res = await fetch("/api/chiem-tinh/ban-do", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ngay_sinh: ngaySinh,
          gio_sinh: gioSinh || null,
          gioi_tinh: gioiTinh,
          noi_sinh: noiSinh || "ha-noi",
          he_nha: heNha,
          kem_cau_noi_dong_tay: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? "Chưa lập được bản đồ sao lúc này.");
        return;
      }
      setKq(body as KetQuaBanDo);
    } catch {
      setLoi("Mất kết nối tạm thời.");
    } finally {
      setDangTai(false);
    }
  }

  async function soiSynastry(e: React.FormEvent) {
    e.preventDefault();
    if (!dongYDoiTac) {
      setLoiSyn("Vui lòng tích xác nhận người liên quan đã tự nguyện đồng ý chia sẻ ngày sinh.");
      return;
    }
    setDangTaiSyn(true);
    setLoiSyn(null);
    try {
      const res = await fetch("/api/chiem-tinh/hop-doi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nguoi_a: { ngay_sinh: ngaySinh, gio_sinh: gioSinh || null, noi_sinh: noiSinh || "ha-noi" },
          nguoi_b: { ngay_sinh: nsDoiTac, gio_sinh: gioDoiTac || null, noi_sinh: "ha-noi" },
          dong_y_tu_nguyen: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoiSyn(body.error ?? "Chưa đối chiếu được hai bản đồ sao.");
        return;
      }
      setKqSyn(body as KetQuaSynastry);
    } catch {
      setLoiSyn("Mất kết nối tạm thời.");
    } finally {
      setDangTaiSyn(false);
    }
  }

  const chiTietChon = kq?.hanh_tinh?.find((p) => p.ma === htChon) ?? kq?.hanh_tinh?.[0] ?? null;

  return (
    <div className="space-y-6" data-testid="khung-chiem-tinh">
      {/* FORM LẬP BẢN ĐỒ SAO GỐC */}
      <form onSubmit={lapBanDo} className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="ct-ngay-sinh" className="block text-xs font-medium text-fg-muted">Ngày sinh dương lịch</label>
            <input
              id="ct-ngay-sinh"
              data-testid="ct-ngay-sinh"
              type="date"
              value={ngaySinh}
              onChange={(e) => setNgaySinh(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            />
          </div>
          <div>
            <label htmlFor="ct-gio-sinh" className="block text-xs font-medium text-fg-muted">Giờ sinh (để trống nếu chưa biết)</label>
            <input
              id="ct-gio-sinh"
              data-testid="ct-gio-sinh"
              type="time"
              value={gioSinh}
              onChange={(e) => setGioSinh(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            />
          </div>
          <div>
            <label htmlFor="ct-noi-sinh" className="block text-xs font-medium text-fg-muted">Nơi sinh (tỉnh VN hoặc mã quốc tế)</label>
            <select
              id="ct-noi-sinh"
              value={noiSinh}
              onChange={(e) => setNoiSinh(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            >
              <option value="ha-noi">Hà Nội (21.03°B, 105.85°Đ)</option>
              <option value="tp-ho-chi-minh">TP Hồ Chí Minh (10.78°B, 106.70°Đ)</option>
              <option value="da-nang">Đà Nẵng (16.07°B, 108.21°Đ)</option>
              <option value="hai-phong">Hải Phòng (20.86°B, 106.68°Đ)</option>
              <option value="can-tho">Cần Thơ (10.03°B, 105.78°Đ)</option>
              <option value="us-san_jose">San Jose, Hoa Kỳ</option>
              <option value="au-sydney">Sydney, Úc</option>
            </select>
          </div>
          <div>
            <label htmlFor="ct-he-nha" className="block text-xs font-medium text-fg-muted">Hệ chia 12 Nhà</label>
            <select
              id="ct-he-nha"
              data-testid="ct-he-nha"
              value={heNha}
              onChange={(e) => setHeNha(e.target.value as "whole_sign" | "placidus")}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            >
              <option value="whole_sign">Whole Sign (Trọn cung cổ điển)</option>
              <option value="placidus">Placidus (Bán cung ngày đêm)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={dangTai || !ngaySinh}
              data-testid="ct-nut-lap"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50"
            >
              <Orbit className="size-4" aria-hidden />
              {dangTai ? "Đang tính lịch…" : "Lập Bản đồ sao"}
            </button>
          </div>
        </div>
        {loi && <p role="alert" className="text-xs text-amber-300">{loi}</p>}
      </form>

      {/* THANH CHUYỂN 3 CHẾ ĐỘ */}
      <div className="flex flex-wrap gap-2 border-b border-line/70 pb-3" role="tablist" aria-label="Chế độ Chiêm tinh">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ban_do"}
          data-testid="tab-ct-ban-do"
          onClick={() => setTab("ban_do")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "ban_do" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Sparkles className="size-4" aria-hidden /> Bản đồ sao &amp; Vận hạn Transit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cau_noi"}
          data-testid="tab-ct-cau-noi"
          onClick={() => setTab("cau_noi")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "cau_noi" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Globe2 className="size-4" aria-hidden /> Cầu nối Đông – Tây (Bát tự · Tử vi)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "hop_doi"}
          data-testid="tab-ct-hop-doi"
          onClick={() => setTab("hop_doi")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "hop_doi" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Users className="size-4" aria-hidden /> Tương tác 2 Bản đồ sao (Synastry)
        </button>
      </div>

      {kq?.chuyen_huong_tuoi && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong_tuoi.thong_bao}
        </div>
      )}

      {/* TAB 1: BẢN ĐỒ SAO & TRANSIT */}
      {tab === "ban_do" && kq?.hanh_tinh && (
        <div className="space-y-6" data-testid="ct-ket-qua-ban-do">
          {kq.ghi_chu_mat_trang && (
            <div className="rounded-xl border border-gold/35 bg-gold/5 p-3.5 text-xs text-fg-muted" data-testid="ct-ghi-chu-mat-trang">
              {kq.ghi_chu_mat_trang}
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <BanDoSaoSvg
                hanhTinh={kq.hanh_tinh}
                gocChieu={kq.goc_chieu ?? []}
                ascKinhDo={kq.truc?.asc.kinh_do ?? null}
                mcKinhDo={kq.truc?.mc.kinh_do ?? null}
                nha={kq.nha}
                dangChon={htChon}
                onChonHanhTinh={setHtChon}
              />
              {kq.phuong_phap_lich && (
                <p className="mt-2.5 text-center text-[11px] text-fg-faint">{kq.phuong_phap_lich}</p>
              )}
            </div>

            <div className="space-y-4 lg:col-span-7">
              {kq.truc && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs">
                    <p className="font-semibold text-gold">Cung Mọc (Ascendant) · {kq.truc.asc.cung_ten} ({kq.truc.asc.do_cung}°)</p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{kq.truc.asc.dien_giai}</p>
                  </div>
                  <div className="rounded-xl border border-jade/40 bg-jade/5 p-3.5 text-xs">
                    <p className="font-semibold text-jade">Thiên Đỉnh (MC) · {kq.truc.mc.cung_ten} ({kq.truc.mc.do_cung}°)</p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{kq.truc.mc.dien_giai}</p>
                  </div>
                </div>
              )}

              {chiTietChon && (
                <div className="rounded-2xl border border-gold/45 bg-surface/50 p-4 text-sm" data-testid="ct-chi-tiet-hanh-tinh">
                  <p className="font-semibold text-gold">
                    {chiTietChon.ky_hieu} {chiTietChon.ten} tại {chiTietChon.cung_ky_hieu} {chiTietChon.cung_ten} ({chiTietChon.do_cung}°)
                    {chiTietChon.nghich_hanh ? " · Nghịch hành (R)" : ""}
                    {chiTietChon.nha ? ` · Nhà ${chiTietChon.nha}` : ""}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg">{chiTietChon.diem_sang}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{chiTietChon.nen_de_y}</p>
                  <p className="mt-1 text-xs font-medium text-jade">{chiTietChon.viec_ung_dung}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {kq.hanh_tinh.map((p) => (
                  <button
                    key={p.ma}
                    type="button"
                    onClick={() => setHtChon(p.ma)}
                    className={cn(
                      "rounded-xl border p-2.5 text-left text-xs transition-colors",
                      htChon === p.ma ? "border-gold bg-gold/15 text-fg" : "border-line/70 bg-bg/45 text-fg-muted hover:text-fg",
                    )}
                  >
                    <p className="font-semibold text-fg">{p.ky_hieu} {p.ten}</p>
                    <p className="mt-0.5 text-[11px] text-gold">
                      {p.cung_ten} {p.do_cung}° {p.nghich_hanh ? "(R)" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VẬN HẠN TRANSIT & SATURN / SOLAR RETURN */}
          {kq.van_han && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line/80 bg-surface/35 p-5 md:grid-cols-2" data-testid="ct-van-han">
              <div className="space-y-2 text-xs">
                <p className="font-semibold uppercase tracking-wider text-gold">Chu kỳ Thổ tinh &amp; Vòng tuổi Mặt Trời</p>
                <p className="text-sm font-semibold text-fg">{kq.van_han.saturn_return.ten}</p>
                <p className="leading-relaxed text-fg-muted">{kq.van_han.saturn_return.y_nghia}</p>
                <ul className="space-y-1 text-fg-muted">
                  {kq.van_han.saturn_return.viec_nen_lam.map((v, idx) => (
                    <li key={idx}>• {v}</li>
                  ))}
                </ul>
                <p className="pt-2 text-[11px] text-fg-faint">
                  Solar Return {kq.van_han.solar_return.nam}: {kq.van_han.solar_return.thoi_diem_utc}
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <p className="font-semibold uppercase tracking-wider text-jade">Góc chiếu Transit đang kích hoạt</p>
                <p className="text-fg-muted">{kq.van_han.jupiter_return.dien_giai}</p>
                <ul className="space-y-2 pt-1">
                  {kq.van_han.transit_noi_bat.slice(0, 4).map((t, idx) => (
                    <li key={idx} className="rounded-lg border border-line/60 bg-bg/45 p-2.5">
                      <span className="font-semibold text-fg">{t.ten_transit} {t.ten_loai} {t.ten_natal}</span>{" "}
                      <span className="text-gold">(orb {t.sai_so}°)</span>
                      <p className="mt-0.5 text-fg-muted">{t.cach_doc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CẦU NỐI ĐÔNG – TÂY */}
      {tab === "cau_noi" && (
        <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6" data-testid="ct-cau-noi-dong-tay">
          {!kq?.cau_noi_dong_tay ? (
            <p className="text-sm text-fg-muted">Bấm «Lập Bản đồ sao» phía trên để mở đối chiếu song song Đông – Tây.</p>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">Độc quyền Hiểu Bản Thân · Không gộp điểm liên môn</p>
                <h2 className="mt-1 text-xl font-semibold text-fg">{kq.cau_noi_dong_tay.nguyen_tac.tieu_de}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.cau_noi_dong_tay.nguyen_tac.giai_thich}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs">
                  <p className="font-semibold text-gold">Toạ độ Phương Đông của bạn</p>
                  <p className="mt-1 text-fg">{kq.cau_noi_dong_tay.tom_tat_phuong_dong}</p>
                </div>
                <div className="rounded-xl border border-jade/40 bg-jade/5 p-3.5 text-xs">
                  <p className="font-semibold text-jade">Toạ độ Phương Tây của bạn</p>
                  <p className="mt-1 text-fg">{kq.cau_noi_dong_tay.tom_tat_phuong_tay}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {kq.cau_noi_dong_tay.bon_chieu.map((c) => (
                  <div key={c.ma} className="rounded-xl border border-line/70 bg-bg/50 p-4 text-xs">
                    <p className="text-sm font-semibold text-fg">{c.ten}</p>
                    <p className="mt-2 leading-relaxed text-fg-muted"><b className="text-gold">Phương Đông:</b> {c.phuong_dong}</p>
                    <p className="mt-1.5 leading-relaxed text-fg-muted"><b className="text-jade">Phương Tây:</b> {c.phuong_tay}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <Link href="/tu-vi" className="inline-flex items-center gap-1 text-gold hover:underline">
                  Mở Lá số Tử vi 12 cung <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
                <Link href="/bat-tu" className="inline-flex items-center gap-1 text-gold hover:underline">
                  Mở Bát tự Tứ trụ <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
                <Link href="/co-van" className="inline-flex items-center gap-1 text-jade hover:underline">
                  Hỏi Cố vấn Tam Tài <Compass className="size-3.5" aria-hidden />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SYNASTRY 2 BẢN ĐỒ SAO */}
      {tab === "hop_doi" && (
        <div className="space-y-5 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6" data-testid="ct-hop-doi-synastry">
          <form onSubmit={soiSynastry} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-fg">Đối chiếu Tương tác 2 Bản đồ sao (Synastry)</h2>
              <p className="mt-1 text-xs text-fg-muted">
                Không chấm điểm phần trăm hợp – khắc; chỉ ra các kênh đồng điệu tự nhiên và cách lắng nghe nhau giữa hai người trưởng thành (từ đủ 16 tuổi).
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="syn-ns-b" className="block text-xs text-fg-muted">Ngày sinh người liên quan</label>
                <input
                  id="syn-ns-b"
                  data-testid="syn-ngay-sinh-b"
                  type="date"
                  value={nsDoiTac}
                  onChange={(e) => setNsDoiTac(e.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
                />
              </div>
              <div>
                <label htmlFor="syn-gio-b" className="block text-xs text-fg-muted">Giờ sinh (tuỳ chọn)</label>
                <input
                  id="syn-gio-b"
                  type="time"
                  value={gioDoiTac}
                  onChange={(e) => setGioDoiTac(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={dangTaiSyn || !nsDoiTac}
                  data-testid="syn-nut-soi"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-semibold text-bg hover:opacity-90 disabled:opacity-50"
                >
                  {dangTaiSyn ? "Đang đối chiếu…" : "Đối chiếu 5 chiều tương tác"}
                </button>
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
              <input
                type="checkbox"
                data-testid="syn-dong-y"
                checked={dongYDoiTac}
                onChange={(e) => setDongYDoiTac(e.target.checked)}
                className="rounded border-line accent-gold"
              />
              Tôi xác nhận người liên quan đã tự nguyện đồng ý chia sẻ ngày sinh để cùng xem đối chiếu (không lưu máy chủ).
            </label>
            {loiSyn && <p role="alert" className="text-xs text-amber-300">{loiSyn}</p>}
          </form>

          {kqSyn && (
            <div className="space-y-3 pt-2" data-testid="syn-ket-qua">
              <p className="text-xs text-fg-faint">{kqSyn.ranh_gioi.khong_cham_diem}</p>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {kqSyn.cac_chieu_tuong_tac.map((c) => (
                  <div key={c.ma} className="rounded-xl border border-line/70 bg-bg/50 p-4 text-xs">
                    <p className="font-semibold text-gold">{c.ten}</p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{c.goi_y_ung_xu}</p>
                    {c.goc_chieu.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-line/50 pt-2 text-fg">
                        {c.goc_chieu.map((g, i) => (
                          <li key={i}>• {g.nguoi_a} {g.ten_loai} {g.nguoi_b} (orb {g.sai_so}°)</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
