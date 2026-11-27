"use client";
// Chặng 4.2 & Chặng 5 — Khung tương tác song ngữ (VI / EN) cho /chiem-tinh & /en/astrology:
//   - Vòng đơn Natal ↔ Vòng đôi Bi-Wheel Natal × Transit (chọn ngày xem vận hạn trực tiếp)
//   - Ma trận Lưới Góc Chiếu 13×13, Bản đồ 4 Nguyên tố × 3 Phẩm chất & Phẩm giá cổ điển Ptolemy, Đường thời gian Chu kỳ Đời
//   - Cầu nối Đông – Tây (đặt cạnh Bát tự & Tử vi, không gộp điểm CD-1)
//   - Tương tác 2 Bản đồ sao: Vòng đôi Góc chiếu chéo (Synastry) ↔ Bản đồ Điểm giữa (Composite Midpoint), bắt buộc đồng ý.
import { useEffect, useState } from "react";
import { ArrowUpRight, Compass, Globe2, Orbit, Sparkles, Users } from "lucide-react";
import Link from "@/components/khung/Lien";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { ChonNuocThanhPho } from "@/components/hoso/ChonNuocThanhPho";
import { useDanhSachTinh } from "@/lib/dia-ly";
import { ngaySinhIso, NUOC_NGOAI, useHoSo } from "@/lib/hoso";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { cn } from "@/lib/utils";
import { BanDoSaoSvg, type GocChieuBieuDo, type GocChieuCheoBieuDo, type HanhTinhBieuDo } from "./BanDoSaoSvg";
import { NutChiaSeBanDoSao, NutChiaSeHopDoiSao } from "./NutChiaSeSao";
import {
  HeTrucQuanChiemTinh,
  type GocChieuDayDu,
  type MocChuKyDoi,
  type OHanhTinhMaTran,
} from "./HeTrucQuanChiemTinh";

interface HanhTinhChiTiet extends HanhTinhBieuDo {
  cung_ma: string;
  cung_ky_hieu: string;
  nha: number | null;
  pham_gia?: { ma: string; ten: string; giai_thich: string } | null;
  diem_sang: string;
  nen_de_y: string;
  viec_ung_dung: string;
  y_nha?: string | null;
}

interface KetQuaBanDo {
  chuyen_huong_tuoi?: { tuoi: number; thong_bao: string };
  phuong_phap_lich?: string;
  nguon_pham_gia?: string | null;
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
  goc_chieu?: GocChieuDayDu[];
  tat_ca_goc_chieu?: GocChieuDayDu[];
  phan_bo_nguyen_to?: { lua: number; dat: number; khi: number; nuoc: number };
  phan_bo_pham_chat?: { thong_linh: number; kien_dinh: number; linh_hoat: number };
  ma_tran_nguyen_to_pham_chat?: OHanhTinhMaTran[][];
  van_han?: {
    ngay_xem: string;
    tuoi_nam: number;
    saturn_return: { ten: string; y_nghia: string; viec_nen_lam: string[]; goc_lech_tho_tinh: number };
    jupiter_return: { dien_giai: string };
    solar_return: { nam: number; thoi_diem_utc: string; nha_mat_troi_solar_return?: number | null; giai_thich: string };
    transit_noi_bat: {
      transit: string;
      natal: string;
      ten_transit: string;
      ten_natal: string;
      ten_loai: string;
      sai_so: number;
      tinh_chat?: "thuan_nhip" | "co_xat_truong_thanh" | "hoi_tu";
      cach_doc: string;
    }[];
    hanh_tinh_transit?: HanhTinhBieuDo[];
    moc_chu_ky_doi?: MocChuKyDoi[];
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
  vong_synastry?: {
    hanh_tinh_a: HanhTinhBieuDo[];
    hanh_tinh_b: HanhTinhBieuDo[];
    goc_cheo: {
      ma_a: string;
      ma_b: string;
      nguoi_a: string;
      nguoi_b: string;
      loai: string;
      ten_loai: string;
      sai_so: number;
      tinh_chat: "thuan_nhip" | "co_xat_truong_thanh" | "hoi_tu";
      cach_doc: string;
    }[];
  };
  ban_do_composite?: {
    khong_cham_diem: boolean;
    co_du_gio_hai_nguoi: boolean;
    mat_trang_khuyet_gio: boolean;
    gioi_thieu: string;
    luu_y_khuyet_gio?: string | null;
    sac_thai_mat_troi_chung: string;
    truc?: {
      asc: { kinh_do: number; do_cung: number; cung_ten: string };
      mc: { kinh_do: number; do_cung: number; cung_ten: string };
    } | null;
    nha?: { so: number; kinh_do: number; cung_ten: string; cung_ky_hieu: string; ten_nha: string }[] | null;
    hanh_tinh: (HanhTinhBieuDo & { cung_ma: string; cung_ky_hieu: string; nha: number | null })[];
    goc_chieu: (GocChieuBieuDo & { ten_diem_1: string; ten_diem_2: string; ten_loai: string; sai_so: number; cach_doc: string })[];
  };
}

interface NoiSinhChon { tinh: string; ngoai: string; vung: "" | "north" | "south" }
type NguoiThe = { ngay_sinh: string; gio_sinh: string | null; noi_sinh: string; vung_vn?: "north" | "south" };

const NOI_TRONG: NoiSinhChon = { tinh: "", ngoai: "", vung: "" };

function maNoiSinh(n: NoiSinhChon): string | null {
  if (n.tinh === NUOC_NGOAI) return n.ngoai && !n.ngoai.includes("/") ? n.ngoai : null;
  return n.tinh || null;
}

function ONoiSinhCT({ id, nhan, giaTri, doi, en }: {
  id: string; nhan: string; giaTri: NoiSinhChon; doi: (n: NoiSinhChon) => void; en: boolean;
}) {
  const { tinh, loi, thuLai } = useDanhSachTinh();
  const tinhChon = tinh?.find((t) => t.ma === giaTri.tinh);
  return (
    <div className="space-y-2">
      <label htmlFor={`${id}-tinh`} className="block text-xs font-medium text-fg-muted">{nhan}</label>
      <select
        id={`${id}-tinh`}
        data-testid={`${id}-chon-noi`}
        value={giaTri.tinh}
        onChange={(e) => doi({ ...NOI_TRONG, tinh: e.target.value })}
        disabled={!tinh && !loi}
        className="h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
      >
        <option value="">{tinh ? (en ? "Select birthplace" : "Chọn nơi sinh") : (en ? "Loading…" : "Đang tải…")}</option>
        <option value={NUOC_NGOAI}>{en ? "Born outside Vietnam" : "Sinh ở nước ngoài"}</option>
        {tinh?.map((t) => <option key={t.ma} value={t.ma}>{t.ten}</option>)}
      </select>
      {loi && (
        <button type="button" onClick={thuLai} className="text-xs text-amber-300 underline">
          {loi} {en ? "Retry" : "Thử lại"}
        </button>
      )}
      {giaTri.tinh === NUOC_NGOAI && (
        <ChonNuocThanhPho id={id} giaTri={giaTri.ngoai} doi={(ma) => doi({ ...giaTri, ngoai: ma })} />
      )}
      {tinhChon && tinhChon.vung === null && (
        <select
          aria-label={en ? "North or South of the 17th parallel?" : "Nơi sinh thuộc phía nào của vĩ tuyến 17"}
          value={giaTri.vung}
          onChange={(e) => doi({ ...giaTri, vung: e.target.value as NoiSinhChon["vung"] })}
          className="h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
        >
          <option value="">{en ? "North or South of 17th parallel?" : "Phía Bắc hay Nam vĩ tuyến 17?"}</option>
          <option value="north">{en ? "North" : "Phía Bắc"}</option>
          <option value="south">{en ? "South" : "Phía Nam"}</option>
        </select>
      )}
    </div>
  );
}

export function KhungChiemTinh() {
  const { ngonNgu } = useNgonNgu();
  const en = ngonNgu === "en";
  const hs = useHoSo();
  const [tab, setTab] = useState<"ban_do" | "cau_noi" | "hop_doi">("ban_do");
  const [cheDoVong, setCheDoVong] = useState<"natal" | "biwheel">("natal");
  const [cheDoHopDoi, setCheDoHopDoi] = useState<"synastry" | "composite">("synastry");

  const [ngaySinh, setNgaySinh] = useState("1997-03-15");
  const [gioSinh, setGioSinh] = useState("09:30");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [noiSinh, setNoiSinh] = useState<NoiSinhChon>(NOI_TRONG);
  const [heNha, setHeNha] = useState<"whole_sign" | "placidus">("whole_sign");
  const [ngayXem, setNgayXem] = useState("");

  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaBanDo | null>(null);
  const [htChon, setHtChon] = useState<string | null>("mat_troi");
  const [capGocChon, setCapGocChon] = useState<[string, string] | null>(null);

  // Synastry & Composite state
  const [nsDoiTac, setNsDoiTac] = useState("");
  const [gioDoiTac, setGioDoiTac] = useState("");
  const [noiDoiTac, setNoiDoiTac] = useState<NoiSinhChon>(NOI_TRONG);
  const [dongYDoiTac, setDongYDoiTac] = useState(false);
  const [dangTaiSyn, setDangTaiSyn] = useState(false);
  const [loiSyn, setLoiSyn] = useState<string | null>(null);
  const [kqSyn, setKqSyn] = useState<KetQuaSynastry | null>(null);
  const [vaoBanDo, setVaoBanDo] = useState<{ nguoi: NguoiThe; gioiTinh: "nam" | "nu" } | null>(null);
  const [vaoSyn, setVaoSyn] = useState<{ a: NguoiThe; b: NguoiThe } | null>(null);

  useEffect(() => { if (window.location.hash === "#hop-doi") setTab("hop_doi"); }, []);

  const loiNoiSinh = en
    ? "Please select a birthplace (for births outside Vietnam, pick a city from the suggestions) so time zone and coordinates are exact."
    : "Hãy chọn nơi sinh (sinh ở nước ngoài thì chọn thành phố trong gợi ý) để tính đúng giờ và vị trí.";

  useEffect(() => {
    if (!hs) return;
    setNgaySinh(ngaySinhIso(hs));
    if (hs.gio && hs.do_tin_gio !== "unknown") setGioSinh(hs.gio);
    if (hs.gioi_tinh === "nam" || hs.gioi_tinh === "nu") setGioiTinh(hs.gioi_tinh);
    if (hs.noi_sinh) {
      setNoiSinh({
        tinh: hs.noi_sinh,
        ngoai: hs.noi_sinh === NUOC_NGOAI ? (hs.mui_gio ?? "") : "",
        vung: hs.noi_sinh !== NUOC_NGOAI && hs.vung ? hs.vung : "",
      });
    }
  }, [hs]);

  async function goiBanDo(ngayXemTuyChon?: string) {
    const ma = maNoiSinh(noiSinh);
    if (!ma) { setLoi(loiNoiSinh); return; }
    setDangTai(true);
    setLoi(null);
    try {
      const nx = (ngayXemTuyChon ?? ngayXem).trim();
      const res = await fetch(urlTheoNgonNgu("/api/chiem-tinh/ban-do"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(en ? { "x-ngon-ngu": "en" } : {}),
        },
        body: JSON.stringify({
          ngay_sinh: ngaySinh,
          gio_sinh: gioSinh || null,
          gioi_tinh: gioiTinh,
          noi_sinh: ma,
          ...(noiSinh.vung ? { vung_vn: noiSinh.vung } : {}),
          he_nha: heNha,
          ...(nx ? { ngay_xem: nx } : {}),
          kem_cau_noi_dong_tay: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? (en ? "Could not compute the birth chart right now." : "Chưa lập được bản đồ sao lúc này."));
        return;
      }
      const duLieu = body as KetQuaBanDo;
      setKq(duLieu);
      setVaoBanDo({
        nguoi: { ngay_sinh: ngaySinh, gio_sinh: gioSinh || null, noi_sinh: ma, ...(noiSinh.vung ? { vung_vn: noiSinh.vung } : {}) },
        gioiTinh,
      });
      if (duLieu.van_han?.ngay_xem && !ngayXem) setNgayXem(duLieu.van_han.ngay_xem);
    } catch {
      setLoi(en ? "Temporary connection issue." : "Mất kết nối tạm thời.");
    } finally {
      setDangTai(false);
    }
  }

  function lapBanDo(e: React.FormEvent) {
    e.preventDefault();
    void goiBanDo();
  }

  async function soiSynastry(e: React.FormEvent) {
    e.preventDefault();
    if (!dongYDoiTac) {
      setLoiSyn(
        en
          ? "Please confirm that the other person has voluntarily consented to sharing their birth date."
          : "Vui lòng tích xác nhận người liên quan đã tự nguyện đồng ý chia sẻ ngày sinh.",
      );
      return;
    }
    const maA = maNoiSinh(noiSinh);
    const maB = maNoiSinh(noiDoiTac);
    if (!maA || !maB) { setLoiSyn(loiNoiSinh); return; }
    setDangTaiSyn(true);
    setLoiSyn(null);
    try {
      const res = await fetch(urlTheoNgonNgu("/api/chiem-tinh/hop-doi"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(en ? { "x-ngon-ngu": "en" } : {}),
        },
        body: JSON.stringify({
          nguoi_a: { ngay_sinh: ngaySinh, gio_sinh: gioSinh || null, noi_sinh: maA },
          nguoi_b: { ngay_sinh: nsDoiTac, gio_sinh: gioDoiTac || null, noi_sinh: maB },
          dong_y_tu_nguyen: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoiSyn(body.error ?? (en ? "Could not compare the two charts right now." : "Chưa đối chiếu được hai bản đồ sao."));
        return;
      }
      setKqSyn(body as KetQuaSynastry);
      setVaoSyn({
        a: { ngay_sinh: ngaySinh, gio_sinh: gioSinh || null, noi_sinh: maA },
        b: { ngay_sinh: nsDoiTac, gio_sinh: gioDoiTac || null, noi_sinh: maB },
      });
    } catch {
      setLoiSyn(en ? "Temporary connection issue." : "Mất kết nối tạm thời.");
    } finally {
      setDangTaiSyn(false);
    }
  }

  const chiTietChon = kq?.hanh_tinh?.find((p) => p.ma === htChon) ?? kq?.hanh_tinh?.[0] ?? null;
  const gocCheoTransit: GocChieuCheoBieuDo[] =
    kq?.van_han?.transit_noi_bat?.map((t) => ({
      diem_ngoai: t.transit,
      diem_trong: t.natal,
      tinh_chat: t.tinh_chat ?? "hoi_tu",
    })) ?? [];

  return (
    <div className="space-y-6" data-testid="khung-chiem-tinh">
      {/* FORM LẬP BẢN ĐỒ SAO GỐC */}
      <form onSubmit={lapBanDo} className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="ct-ngay-sinh" className="block text-xs font-medium text-fg-muted">
              {en ? "Solar birth date" : "Ngày sinh dương lịch"}
            </label>
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
            <label htmlFor="ct-gio-sinh" className="block text-xs font-medium text-fg-muted">
              {en ? "Birth time (leave blank if unknown)" : "Giờ sinh (để trống nếu chưa biết)"}
            </label>
            <input
              id="ct-gio-sinh"
              data-testid="ct-gio-sinh"
              type="time"
              value={gioSinh}
              onChange={(e) => setGioSinh(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            />
          </div>
          <ONoiSinhCT id="ct" nhan={en ? "Birthplace" : "Nơi sinh"} giaTri={noiSinh} doi={setNoiSinh} en={en} />
          <div>
            <label htmlFor="ct-he-nha" className="block text-xs font-medium text-fg-muted">
              {en ? "House system" : "Hệ chia 12 Nhà"}
            </label>
            <select
              id="ct-he-nha"
              data-testid="ct-he-nha"
              value={heNha}
              onChange={(e) => setHeNha(e.target.value as "whole_sign" | "placidus")}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            >
              <option value="whole_sign">{en ? "Whole Sign (Classical)" : "Whole Sign (Trọn cung cổ điển)"}</option>
              <option value="placidus">{en ? "Placidus (Semi-arc)" : "Placidus (Bán cung ngày đêm)"}</option>
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
              {dangTai
                ? (en ? "Computing…" : "Đang tính lịch…")
                : (en ? "Calculate Chart" : "Lập Bản đồ sao")}
            </button>
          </div>
        </div>
        {loi && <p role="alert" className="text-xs text-amber-300">{loi}</p>}
      </form>

      {/* THANH CHUYỂN 3 CHẾ ĐỘ */}
      <div
        className="flex flex-wrap gap-2 border-b border-line/70 pb-3"
        role="tablist"
        aria-label={en ? "Astrology modes" : "Chế độ Chiêm tinh"}
      >
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
          <Sparkles className="size-4" aria-hidden />
          {en ? "Birth Chart & Transits" : "Bản đồ sao & Vận hạn Transit"}
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
          <Globe2 className="size-4" aria-hidden />
          {en ? "East–West Bridge (BaZi · Zi Wei)" : "Cầu nối Đông – Tây (Bát tự · Tử vi)"}
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
          <Users className="size-4" aria-hidden />
          {en ? "Synastry & Composite (2 Charts)" : "Tương tác 2 Bản đồ sao (Synastry & Composite)"}
        </button>
      </div>

      {kq?.chuyen_huong_tuoi && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong_tuoi.thong_bao}
        </div>
      )}

      {/* TAB 1: BẢN ĐỒ SAO, BI-WHEEL TRANSIT & HỆ TRỰC QUAN */}
      {tab === "ban_do" && kq?.hanh_tinh && (
        <div className="space-y-6" data-testid="ct-ket-qua-ban-do">
          {kq.ghi_chu_mat_trang && (
            <div className="rounded-xl border border-gold/35 bg-gold/5 p-3.5 text-xs text-fg-muted" data-testid="ct-ghi-chu-mat-trang">
              {kq.ghi_chu_mat_trang}
            </div>
          )}

          {/* Chuyển Vòng đơn Natal ↔ Vòng đôi Bi-Wheel Transit + Chọn ngày xem */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/35 px-4 py-3"
            data-testid="che-do-vong-sao"
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="nut-vong-natal"
                onClick={() => setCheDoVong("natal")}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  cheDoVong === "natal" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
                )}
              >
                {en ? "Single Wheel (Natal)" : "Vòng đơn (Bản đồ gốc)"}
              </button>
              <button
                type="button"
                data-testid="nut-vong-biwheel"
                onClick={() => setCheDoVong("biwheel")}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  cheDoVong === "biwheel" ? "border-jade bg-jade/15 text-jade" : "border-line text-fg-muted hover:text-fg",
                )}
              >
                {en ? "Bi-Wheel (Natal × Live Transits)" : "Vòng đôi Vận hạn (Natal × Transit)"}
              </button>
            </div>
            {cheDoVong === "biwheel" && (
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="ct-ngay-xem" className="text-fg-muted">
                  {en ? "Transit date:" : "Ngày xem vận hạn:"}
                </label>
                <input
                  id="ct-ngay-xem"
                  data-testid="ct-ngay-xem"
                  type="date"
                  min="1926-01-01"
                  max="2049-12-31"
                  value={ngayXem}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNgayXem(v);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) void goiBanDo(v);
                  }}
                  className="h-8 rounded-lg border border-line bg-bg/70 px-2.5 text-xs text-fg"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <BanDoSaoSvg
                hanhTinh={kq.hanh_tinh}
                gocChieu={kq.goc_chieu ?? []}
                ascKinhDo={kq.truc?.asc.kinh_do ?? null}
                mcKinhDo={kq.truc?.mc.kinh_do ?? null}
                nha={kq.nha}
                dangChon={htChon}
                capChon={capGocChon}
                onChonHanhTinh={(m) => {
                  setHtChon(m);
                  setCapGocChon(null);
                }}
                vongNgoai={cheDoVong === "biwheel" ? (kq.van_han?.hanh_tinh_transit ?? null) : null}
                nhanVongNgoai={
                  cheDoVong === "biwheel"
                    ? (en ? `Transits · ${kq.van_han?.ngay_xem ?? ""}` : `Lưu niên · ${kq.van_han?.ngay_xem ?? ""}`)
                    : undefined
                }
                gocChieuCheo={cheDoVong === "biwheel" ? gocCheoTransit : undefined}
              />
              {kq.phuong_phap_lich && (
                <p className="mt-2.5 text-center text-[11px] text-fg-faint">{kq.phuong_phap_lich}</p>
              )}
            </div>

            <div className="space-y-4 lg:col-span-7">
              {kq.truc && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs">
                    <p className="font-semibold text-gold">
                      {en ? "Ascendant" : "Cung Mọc (Ascendant)"} · {kq.truc.asc.cung_ten} ({kq.truc.asc.do_cung}°)
                    </p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{kq.truc.asc.dien_giai}</p>
                  </div>
                  <div className="rounded-xl border border-jade/40 bg-jade/5 p-3.5 text-xs">
                    <p className="font-semibold text-jade">
                      {en ? "Midheaven (MC)" : "Thiên Đỉnh (MC)"} · {kq.truc.mc.cung_ten} ({kq.truc.mc.do_cung}°)
                    </p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{kq.truc.mc.dien_giai}</p>
                  </div>
                </div>
              )}

              {chiTietChon && (
                <div className="rounded-2xl border border-gold/45 bg-surface/50 p-4 text-sm" data-testid="ct-chi-tiet-hanh-tinh">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gold">
                      {chiTietChon.ky_hieu} {chiTietChon.ten} {en ? "in" : "tại"} {chiTietChon.cung_ky_hieu} {chiTietChon.cung_ten} ({chiTietChon.do_cung}°)
                      {chiTietChon.nghich_hanh ? (en ? " · Retrograde (R)" : " · Nghịch hành (R)") : ""}
                      {chiTietChon.nha ? (en ? ` · House ${chiTietChon.nha}` : ` · Nhà ${chiTietChon.nha}`) : ""}
                    </p>
                    {chiTietChon.pham_gia && (
                      <span className="rounded-full border border-jade/45 bg-jade/10 px-2.5 py-0.5 text-[11px] font-medium text-jade">
                        {chiTietChon.pham_gia.ten}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg">{chiTietChon.diem_sang}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{chiTietChon.nen_de_y}</p>
                  <p className="mt-1 text-xs font-medium text-jade">{chiTietChon.viec_ung_dung}</p>
                  {chiTietChon.y_nha && (
                    <p className="mt-1.5 border-t border-line/50 pt-1.5 text-[11px] text-fg-muted">{chiTietChon.y_nha}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {kq.hanh_tinh.map((p) => (
                  <button
                    key={p.ma}
                    type="button"
                    onClick={() => {
                      setHtChon(p.ma);
                      setCapGocChon(null);
                    }}
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

          {!en && vaoBanDo && (
            <div className="flex justify-center" data-testid="ct-chia-se-sao">
              <NutChiaSeBanDoSao
                nguoi={vaoBanDo.nguoi}
                gioiTinh={vaoBanDo.gioiTinh}
                matTroi={kq.hanh_tinh.find((p) => p.ma === "mat_troi")?.cung_ten ?? null}
                matTrang={kq.ghi_chu_mat_trang ? null : kq.hanh_tinh.find((p) => p.ma === "mat_trang")?.cung_ten ?? null}
              />
            </div>
          )}

          {/* VẬN HẠN TRANSIT & SATURN / SOLAR RETURN */}
          {kq.van_han && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line/80 bg-surface/35 p-5 md:grid-cols-2" data-testid="ct-van-han">
              <div className="space-y-2 text-xs">
                <p className="font-semibold uppercase tracking-wider text-gold">
                  {en ? "Saturn Cycle & Solar Return" : "Chu kỳ Thổ tinh & Vòng tuổi Mặt Trời"}
                </p>
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
                <p className="font-semibold uppercase tracking-wider text-jade">
                  {en ? "Active Outer-Planet Transits" : "Góc chiếu Transit đang kích hoạt"}
                </p>
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

          {/* HỆ 3 BIỂU ĐỒ PHÂN TÍCH TƯƠNG TÁC: NGUYÊN TỐ × PHẨM GIÁ · MA TRẬN GÓC CHIẾU · TIMELINE CHU KỲ ĐỜI */}
          <HeTrucQuanChiemTinh
            hanhTinh={kq.hanh_tinh}
            truc={kq.truc}
            tatCaGocChieu={kq.tat_ca_goc_chieu ?? kq.goc_chieu ?? []}
            phanBoNguyenTo={kq.phan_bo_nguyen_to}
            phanBoPhamChat={kq.phan_bo_pham_chat}
            maTranNguyenTo={kq.ma_tran_nguyen_to_pham_chat}
            nguonPhamGia={kq.nguon_pham_gia}
            mocChuKyDoi={kq.van_han?.moc_chu_ky_doi}
            onChonHanhTinh={(m) => {
              setHtChon(m);
              setCapGocChon(null);
            }}
            onChonCapGoc={(cap) => setCapGocChon(cap)}
          />
        </div>
      )}

      {/* TAB 2: CẦU NỐI ĐÔNG – TÂY */}
      {tab === "cau_noi" && (
        <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6" data-testid="ct-cau-noi-dong-tay">
          {!kq?.cau_noi_dong_tay ? (
            <p className="text-sm text-fg-muted">
              {en
                ? "Click “Calculate Chart” above to open the side-by-side East–West comparison."
                : "Bấm «Lập Bản đồ sao» phía trên để mở đối chiếu song song Đông – Tây."}
            </p>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  {en ? "Hieuban Exclusive · Zero Cross-System Score Averaging" : "Độc quyền Hiểu Bản Thân · Không gộp điểm liên môn"}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-fg">{kq.cau_noi_dong_tay.nguyen_tac.tieu_de}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.cau_noi_dong_tay.nguyen_tac.giai_thich}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 text-xs">
                  <p className="font-semibold text-gold">{en ? "Your Eastern Coordinates" : "Toạ độ Phương Đông của bạn"}</p>
                  <p className="mt-1 text-fg">{kq.cau_noi_dong_tay.tom_tat_phuong_dong}</p>
                </div>
                <div className="rounded-xl border border-jade/40 bg-jade/5 p-3.5 text-xs">
                  <p className="font-semibold text-jade">{en ? "Your Western Coordinates" : "Toạ độ Phương Tây của bạn"}</p>
                  <p className="mt-1 text-fg">{kq.cau_noi_dong_tay.tom_tat_phuong_tay}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {kq.cau_noi_dong_tay.bon_chieu.map((c) => (
                  <div key={c.ma} className="rounded-xl border border-line/70 bg-bg/50 p-4 text-xs">
                    <p className="text-sm font-semibold text-fg">{c.ten}</p>
                    <p className="mt-2 leading-relaxed text-fg-muted">
                      <b className="text-gold">{en ? "Eastern lens:" : "Phương Đông:"}</b> {c.phuong_dong}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-fg-muted">
                      <b className="text-jade">{en ? "Western lens:" : "Phương Tây:"}</b> {c.phuong_tay}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <Link href={en ? "/en/zi-wei-dou-shu" : "/tu-vi"} className="inline-flex items-center gap-1 text-gold hover:underline">
                  {en ? "Open Zi Wei Dou Shu chart" : "Mở Lá số Tử vi 12 cung"} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
                <Link href={en ? "/en/bazi" : "/bat-tu"} className="inline-flex items-center gap-1 text-gold hover:underline">
                  {en ? "Open BaZi Four Pillars" : "Mở Bát tự Tứ trụ"} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
                {!en && (
                  <Link href="/co-van" className="inline-flex items-center gap-1 text-jade hover:underline">
                    Hỏi Cố vấn Tam Tài <Compass className="size-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SYNASTRY BI-WHEEL & BẢN ĐỒ ĐIỂM GIỮA COMPOSITE */}
      {tab === "hop_doi" && (
        <div className="space-y-5 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6" data-testid="ct-hop-doi-synastry">
          <form onSubmit={soiSynastry} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-fg">
                {en ? "Two-Chart Synastry & Composite Midpoint Chart" : "Đối chiếu Tương tác (Synastry) & Bản đồ Điểm giữa (Composite)"}
              </h2>
              <p className="mt-1 text-xs text-fg-muted">
                {en
                  ? "No compatibility percentages — explore both cross-chart aspects (Synastry) and your shared midpoint wheel (Composite) for consenting adults aged 16+."
                  : "Không chấm điểm phần trăm hợp – khắc; xem trọn cả vòng góc chiếu chéo (Synastry) lẫn Bản đồ điểm giữa (Composite) giữa hai người trưởng thành (từ đủ 16 tuổi)."}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="syn-ns-b" className="block text-xs text-fg-muted">
                  {en ? "Counterpart's birth date" : "Ngày sinh người liên quan"}
                </label>
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
                <label htmlFor="syn-gio-b" className="block text-xs text-fg-muted">
                  {en ? "Birth time (optional)" : "Giờ sinh (tuỳ chọn)"}
                </label>
                <input
                  id="syn-gio-b"
                  type="time"
                  value={gioDoiTac}
                  onChange={(e) => setGioDoiTac(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
                />
              </div>
              <ONoiSinhCT
                id="syn-b"
                nhan={en ? "Counterpart's birthplace" : "Nơi sinh người liên quan"}
                giaTri={noiDoiTac}
                doi={setNoiDoiTac}
                en={en}
              />
              <div className="flex items-end sm:col-span-3">
                <button
                  type="submit"
                  disabled={dangTaiSyn || !nsDoiTac}
                  data-testid="syn-nut-soi"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-semibold text-bg hover:opacity-90 disabled:opacity-50"
                >
                  {dangTaiSyn
                    ? (en ? "Comparing charts…" : "Đang đối chiếu…")
                    : (en ? "Compare Synastry & Composite" : "Đối chiếu Synastry & Bản đồ Composite")}
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
              {en
                ? "I confirm the other person has voluntarily consented to sharing their birth date for this comparison (never stored on our servers)."
                : "Tôi xác nhận người liên quan đã tự nguyện đồng ý chia sẻ ngày sinh để cùng xem đối chiếu (không lưu máy chủ)."}
            </label>
            {loiSyn && <p role="alert" className="text-xs text-amber-300">{loiSyn}</p>}
          </form>

          {kqSyn && (
            <div className="space-y-5 pt-2" data-testid="syn-ket-qua">
              <p className="text-xs text-fg-faint">{kqSyn.ranh_gioi.khong_cham_diem}</p>

              {/* Công tắc chuyển Vòng đôi Synastry ↔ Bản đồ điểm giữa Composite */}
              <div className="flex flex-wrap gap-2" data-testid="che-do-hop-doi">
                <button
                  type="button"
                  data-testid="nut-hop-doi-synastry"
                  onClick={() => setCheDoHopDoi("synastry")}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    cheDoHopDoi === "synastry" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
                  )}
                >
                  {en ? "Synastry Bi-Wheel (A × B)" : "Vòng đôi Góc chiếu chéo (Synastry)"}
                </button>
                {kqSyn.ban_do_composite && (
                  <button
                    type="button"
                    data-testid="nut-hop-doi-composite"
                    onClick={() => setCheDoHopDoi("composite")}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      cheDoHopDoi === "composite" ? "border-jade bg-jade/15 text-jade" : "border-line text-fg-muted hover:text-fg",
                    )}
                  >
                    {en ? "Composite Midpoint Wheel" : "Bản đồ Điểm giữa (Composite)"}
                  </button>
                )}
              </div>

              {cheDoHopDoi === "synastry" ? (
                <div className="space-y-5">
                  {kqSyn.vong_synastry && (
                    <BanDoSaoSvg
                      hanhTinh={kqSyn.vong_synastry.hanh_tinh_a}
                      gocChieu={[]}
                      vongNgoai={kqSyn.vong_synastry.hanh_tinh_b}
                      nhanVongNgoai={en ? "Person B (Outer Ring)" : "Người B (Vòng ngoài)"}
                      gocChieuCheo={kqSyn.vong_synastry.goc_cheo.map((g) => ({
                        diem_ngoai: g.ma_b,
                        diem_trong: g.ma_a,
                        tinh_chat: g.tinh_chat,
                      }))}
                    />
                  )}
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
              ) : (
                kqSyn.ban_do_composite && (
                  <div className="space-y-4" data-testid="khung-ban-do-composite">
                    <div className="rounded-xl border border-jade/40 bg-jade/5 p-4 text-xs">
                      <p className="font-semibold text-jade">
                        {en ? "Shared Partnership Atmosphere (Composite)" : "Không gian đồng hành chung (Bản đồ Composite)"}
                      </p>
                      <p className="mt-1 leading-relaxed text-fg-muted">{kqSyn.ban_do_composite.gioi_thieu}</p>
                      <p className="mt-1.5 font-medium text-fg">{kqSyn.ban_do_composite.sac_thai_mat_troi_chung}</p>
                      {kqSyn.ban_do_composite.luu_y_khuyet_gio && (
                        <p className="mt-1.5 text-[11px] text-amber-300">{kqSyn.ban_do_composite.luu_y_khuyet_gio}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
                      <div className="lg:col-span-5">
                        <BanDoSaoSvg
                          hanhTinh={kqSyn.ban_do_composite.hanh_tinh}
                          gocChieu={kqSyn.ban_do_composite.goc_chieu}
                          ascKinhDo={kqSyn.ban_do_composite.truc?.asc.kinh_do ?? null}
                          mcKinhDo={kqSyn.ban_do_composite.truc?.mc.kinh_do ?? null}
                          nha={kqSyn.ban_do_composite.nha}
                        />
                      </div>
                      <div className="space-y-3 lg:col-span-7">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {kqSyn.ban_do_composite.hanh_tinh.map((p) => (
                            <div key={p.ma} className="rounded-xl border border-line/70 bg-bg/50 p-2.5 text-xs">
                              <p className="font-semibold text-fg">{p.ky_hieu} {p.ten}</p>
                              <p className="mt-0.5 text-[11px] text-gold">
                                {p.cung_ky_hieu} {p.cung_ten} {p.do_cung}°
                                {p.nha ? (en ? ` · H${p.nha}` : ` · Nhà ${p.nha}`) : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                        {kqSyn.ban_do_composite.goc_chieu.length > 0 && (
                          <div className="rounded-xl border border-line/70 bg-bg/50 p-3.5 text-xs">
                            <p className="font-semibold text-gold">
                              {en ? "Internal Composite Aspects" : "Góc chiếu nội tại của mối quan hệ"}
                            </p>
                            <ul className="mt-2 space-y-1.5 text-fg-muted">
                              {kqSyn.ban_do_composite.goc_chieu.slice(0, 6).map((g, idx) => (
                                <li key={idx}>
                                  <b className="text-fg">{g.ten_diem_1} {g.ten_loai} {g.ten_diem_2}</b>{" "}
                                  <span className="text-gold">(orb {g.sai_so}°)</span> — {g.cach_doc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
              {!en && vaoSyn && (
                <div className="flex justify-center pt-2" data-testid="syn-chia-se">
                  <NutChiaSeHopDoiSao
                    nguoiA={vaoSyn.a}
                    nguoiB={vaoSyn.b}
                    chuDe={kqSyn.cac_chieu_tuong_tac.find((c) => c.goc_chieu.length > 0)?.ten ?? null}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
