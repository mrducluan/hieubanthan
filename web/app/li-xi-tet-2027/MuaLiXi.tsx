"use client";
// LX-2027 — Giao diện LÌ XÌ TẾT 2027:
//   - Công tắc "Phối ngẫu nhiên may mắn 🎲" hoặc "Tự chọn theo ý bạn (Custom)"
//   - 4 chất liệu giấy Tết × 6 hoạ tiết nghệ thuật (3 mẫu Linh Vật Đinh Mùi 2027 + Hoa Mai Vàng + Hoa Đào Bích + Pháo Hoa Xuân)
//   - Bật/tắt Nền Gấm Ép Kim 24K & Hoa xuân rơi
//   - Chọn gói 1 / 3 / 5 bao, thanh toán Pay2S, quản lý bao đã mua và tải ảnh chia sẻ Social 3 khổ (Story 9:16 · Post 1:1 · Link 16:9).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Dices, Download, Flower2, Gift, Layers, Loader2, PartyPopper, QrCode, Share2, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { metaDongY } from "@/lib/meta-pixel";
import { layMaGoogle } from "@/lib/google-qc";
import { QUAY_VE } from "@/lib/sao-client";
import { BaoLiXi3D } from "@/components/li-xi/BaoLiXi3D";
import { NutVideoLiXi } from "@/components/li-xi/NutVideoLiXi";
import {
  DANH_SACH_HOA_TIET,
  DANH_SACH_KHUNG_SOCIAL,
  DANH_SACH_MAU_THIEP,
  dinhDangVnd,
  HOA_TIET_TET,
  kiemLoiChuc,
  kiemTen,
  GIONG_CHUC,
  LOI_CHUC_CHUNG_DS,
  LOI_CHUC_MAU,
  MAU_THIEP,
  mauThiepTheoMa,
  QUAN_HE_CHUC,
  taiAnhSocialLiXi,
  thongTinHoaTiet,
  tietKiemPhanTram,
  type BaoLiXiCuaToi,
  type HoaTietTet,
  type KhungSocial,
  type MaGiongChuc,
  type MaQuanHeChuc,
  type MauThiep,
  type ThongTinLiXi,
} from "@/lib/li-xi-tet";

const KHOA_NHAP = "lx2027:nhap";

const TRANG_THAI_NHAN: Record<string, { chu: string; lop: string }> = {
  cho_tra: { chu: "Chờ thanh toán", lop: "text-fg-muted" },
  san_sang: { chu: "Sẵn sàng gửi", lop: "text-gold" },
  da_nhan: { chu: "Đã có người mở", lop: "text-jade" },
  hoan: { chu: "Đã hoàn", lop: "text-fg-faint" },
};

/** Các tổ hợp phối sẵn đẹp nhất để nút "Đổi mẫu ngẫu nhiên 🎲" xoay vòng hoặc lấy ngẫu nhiên. */
const TO_HOP_GOI_Y: { mau: MauThiep; hoa: HoaTietTet; nenGam: boolean; nhan: string }[] = [
  { mau: "do_son", hoa: "linh_vat", nenGam: true, nhan: "Gấm Đỏ Son × Linh Vật Ép Kim 24K" },
  { mau: "do_son", hoa: "linh_vat_son_mai", nenGam: true, nhan: "Gấm Đỏ Son × Linh Vật Sơn Mài Hoàng Kim" },
  { mau: "do_son", hoa: "linh_vat_thanh_lich", nenGam: false, nhan: "Đỏ Son Tối Giản × Linh Vật Thanh Lịch" },
  { mau: "mai_vang", hoa: "hoa_mai", nenGam: true, nhan: "Lụa Mai Vàng × Cành Mai Phương Nam" },
  { mau: "ngoc_bich", hoa: "hoa_dao", nenGam: true, nhan: "Men Ngọc Bích × Đào Bích Miền Bắc" },
  { mau: "dem_giao_thua", hoa: "phao_hoa", nenGam: false, nhan: "Đêm Giao Thừa × Pháo Hoa Xuân" },
];

export function MuaLiXi({ banDau }: { banDau: ThongTinLiXi }) {
  const router = useRouter();
  const [tt, setTt] = useState<ThongTinLiXi>(banDau);
  const [token, setToken] = useState<string | null>(null);
  const [soBao, setSoBao] = useState<1 | 3 | 5>(3);
  const [tuChon, setTuChon] = useState(true);
  const [mau, setMau] = useState<MauThiep>("do_son");
  const [hoa, setHoa] = useState<HoaTietTet>("linh_vat");
  const [nenGam, setNenGam] = useState(true);
  const [hoaRoi, setHoaRoi] = useState(true);
  const [ten, setTen] = useState("");
  const [chuc, setChuc] = useState<string>(LOI_CHUC_MAU[0]!);
  const [quanHe, setQuanHe] = useState<MaQuanHeChuc | null>(null);
  const [giong, setGiong] = useState<MaGiongChuc>("am");
  const [phatLai, setPhatLai] = useState(0);
  const [moThu, setMoThu] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daTang, setDaTang] = useState<BaoLiXiCuaToi[]>([]);
  const [daChep, setDaChep] = useState<string | null>(null);

  useEffect(() => {
    try {
      const nhap = JSON.parse(sessionStorage.getItem(KHOA_NHAP) ?? "null") as {
        soBao?: 1 | 3 | 5; mau?: MauThiep; hoa?: HoaTietTet; nenGam?: boolean; ten?: string; chuc?: string;
      } | null;
      if (nhap) {
        if (nhap.soBao === 1 || nhap.soBao === 3 || nhap.soBao === 5) setSoBao(nhap.soBao);
        if (nhap.mau && (MAU_THIEP as readonly string[]).includes(nhap.mau)) setMau(nhap.mau);
        if (nhap.hoa && (HOA_TIET_TET as readonly string[]).includes(nhap.hoa)) setHoa(nhap.hoa);
        if (typeof nhap.nenGam === "boolean") setNenGam(nhap.nenGam);
        if (typeof nhap.ten === "string") setTen(nhap.ten);
        if (typeof nhap.chuc === "string") setChuc(nhap.chuc);
      }
    } catch { /* bỏ qua */ }

    fetch("/api/li-xi/thong-tin", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ThongTinLiXi | null) => { if (d && typeof d.bat === "boolean") setTt(d); })
      .catch(() => { /* giữ banDau */ });

    void supabase().then(async (sb) => {
      const tk = (await sb?.auth.getSession())?.data.session?.access_token ?? null;
      setToken(tk);
      if (!tk) return;
      fetch("/api/li-xi/cua-toi", { headers: { authorization: `Bearer ${tk}` }, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { da_tang?: BaoLiXiCuaToi[] } | null) => { if (Array.isArray(d?.da_tang)) setDaTang(d.da_tang); })
        .catch(() => { /* bỏ qua */ });
    });
  }, []);

  function chonMau(m: MauThiep) {
    setMau(m);
    if (m === "mai_vang" || m === "ngoc_bich" || m === "dem_giao_thua") {
      setHoa(mauThiepTheoMa(m).hoaMacDinh);
    } else if (!hoa.startsWith("linh_vat")) {
      setHoa("linh_vat");
    }
  }

  function doiNgauNhien() {
    const khac = TO_HOP_GOI_Y.filter((x) => !(x.mau === mau && x.hoa === hoa));
    const pick = khac[Math.floor(Math.random() * khac.length)] ?? TO_HOP_GOI_Y[0]!;
    setMau(pick.mau);
    setHoa(pick.hoa);
    setNenGam(pick.nenGam);
  }

  /** Chọn người nhận (+ giọng) → điền lời chúc hợp và mở thiệp xem ngay. Gõ tay vào ô lời chúc thì bỏ chọn, không ghi đè lời của bạn. */
  function chonLoi(q: MaQuanHeChuc, g: MaGiongChuc) {
    const x = QUAN_HE_CHUC.find((i) => i.ma === q);
    if (!x) return;
    setQuanHe(q); setGiong(g); setChuc(x.loi[g]);
    if (!moThu) { duaBaoVaoTam(); setMoThu(true); }
    ghi("chart_interacted", { mo_dun: "li_xi", kind: "goi_y_quan_he", quan_he: q, giong: g });
  }
  /** Bao nằm ngoài khung nhìn (đang chỉnh form bên phải) → cuộn vào giữa để thấy pháo hoa & lời chúc. */
  function duaBaoVaoTam() {
    const el = document.querySelector<HTMLElement>('[data-testid="bao-li-xi-3d"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Đặt đỉnh bao cách mép trên ~320px: phía trên còn chỗ cho pháo hoa & chữ "2027" nổ rõ, không đè lên thiệp.
    if (r.top < 280 || r.top > window.innerHeight * 0.55) window.scrollBy({ top: r.top - 320, behavior: "smooth" });
  }
  function xemThuPhao() {
    duaBaoVaoTam();
    setMoThu(true); setPhatLai((n) => n + 1);
    ghi("chart_interacted", { mo_dun: "li_xi", kind: "xem_thu_phao_hoa", mau_thiep: mau });
  }

  // GIA-99: "rẻ hơn" tính từ chính bảng giá (đổi giá ở /quan-tri là số tự đổi), một nhãn duy nhất.
  const re = (gia: number, so: number) => { const pt = tietKiemPhanTram(tt.gia_1, gia, so); return pt ? ` · rẻ hơn ${pt}% so với mua lẻ` : ""; };
  const goiDs = [
    { so: 1 as const, ten: "1 bao", gia: tt.gia_1, phu: "Báo cáo năm 2027 cho 1 người", nhan: null },
    { so: 3 as const, ten: "3 bao · gia đình", gia: tt.gia_3, phu: `≈ ${dinhDangVnd(tt.gia_3 / 3)} mỗi bao${re(tt.gia_3, 3)}`, nhan: "Phổ biến" },
    { so: 5 as const, ten: "5 bao · nhóm, đối tác", gia: tt.gia_5, phu: `≈ ${dinhDangVnd(tt.gia_5 / 5)} mỗi bao${re(tt.gia_5, 5)}`, nhan: null },
  ];
  const goiChon = goiDs.find((g) => g.so === soBao) ?? goiDs[1]!;

  async function mua() {
    setLoi(null);
    const loiChu = kiemTen(ten) ?? kiemLoiChuc(chuc);
    if (loiChu) { setLoi(loiChu); return; }
    if (!token) {
      try { sessionStorage.setItem(KHOA_NHAP, JSON.stringify({ soBao, mau, hoa, nenGam, ten, chuc })); } catch { /* bỏ qua */ }
      router.push("/dang-nhap?tiep=%2Fli-xi-tet-2027");
      return;
    }
    setDang(true);
    try {
      const r = await fetch("/api/li-xi/tao", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          so_bao: soBao,
          mau_thiep: mau,
          ten_nguoi_tang: ten.trim() || undefined,
          loi_chuc: chuc.trim() || undefined,
          meta: metaDongY(),
          google: layMaGoogle() ?? undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; can?: string; checkoutUrl?: string };
      if (!r.ok) {
        if (j.can === "dang_nhap") { router.push("/dang-nhap?tiep=%2Fli-xi-tet-2027"); return; }
        setLoi(j.error ?? "Chưa tạo được đơn LÌ XÌ TẾT 2027.");
        return;
      }
      // Đơn đã tạo (chưa trả) — CRO-1: PostHog không nhận số tiền. Trả xong trang kết quả đưa về danh sách bao.
      ghi("checkout_started", { kind: "li_xi", so_bao: soBao, mau_thiep: mau, tu_viet: !LOI_CHUC_MAU.includes(chuc.trim()) });
      try { sessionStorage.removeItem(KHOA_NHAP); sessionStorage.setItem(QUAY_VE, "/li-xi-tet-2027#bao-da-tao"); } catch { /* bỏ qua */ }
      if (j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      setLoi("Chưa nhận được liên kết thanh toán.");
    } catch {
      setLoi("Không kết nối được, thử lại sau ít phút.");
    } finally {
      setDang(false);
    }
  }

  function linkBao(ma: string, hoaBao?: HoaTietTet) {
    const base = `${typeof window !== "undefined" ? window.location.origin : "https://hieuban.com"}/li-xi/${ma}`;
    const qs = new URLSearchParams();
    if (hoaBao ?? hoa) qs.set("hoa", hoaBao ?? hoa);
    if (!nenGam) qs.set("gam", "0");
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  }

  function linkAnhSocial(khung: KhungSocial, maBao?: string) {
    const qs = new URLSearchParams({ khung, mau, hoa, gam: nenGam ? "1" : "0", tai: "1" });
    if (maBao) qs.set("ma", maBao);
    return `/og/li-xi?${qs.toString()}`;
  }

  async function chepLink(ma: string) {
    const url = linkBao(ma);
    try {
      await navigator.clipboard.writeText(url);
      setDaChep(ma);
      ghi("share_created", { kind: "li_xi", kenh: "copy" });
      setTimeout(() => setDaChep((c) => (c === ma ? null : c)), 2500);
    } catch { /* bỏ qua */ }
  }

  async function chiaSe(b: BaoLiXiCuaToi) {
    const url = linkBao(b.ma);
    const text = b.loi_chuc
      ? `${b.ten_nguoi_tang ? `${b.ten_nguoi_tang} gửi bạn LÌ XÌ TẾT 2027: ` : "Gửi bạn LÌ XÌ TẾT 2027: "}“${b.loi_chuc}”`
      : "Gửi bạn Bao LÌ XÌ TẾT 2027 mở trọn Báo cáo Năm Đinh Mùi 2027 trên Hiểu Bản Thân!";
    ghi("share_created", { kind: "li_xi", kenh: "share" });
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "LÌ XÌ TẾT 2027", text, url }); return; } catch { /* người dùng đóng */ }
    }
    await chepLink(b.ma);
  }

  const ttHoaDangChon = thongTinHoaTiet(hoa, mau);

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Cột trái: Bao Lì Xì 3D + điều khiển nền gấm / hoa rơi / đổi ngẫu nhiên + tải ảnh Social */}
        <div className="space-y-4 lg:col-span-5">
          <BaoLiXi3D
            mauThiep={mau}
            hoaTiet={hoa}
            hoaRoi={hoaRoi}
            nenGam={nenGam}
            tenNguoiTang={ten}
            loiChuc={chuc}
            daMo={moThu}
            onMo={() => setMoThu(true)}
            nhanNut="Bấm thử để xem hiệu ứng mở bao & pháo hoa"
            phatLai={phatLai}
          />
          <Button type="button" className="w-full" onClick={xemThuPhao} data-testid="nut-xem-thu-phao">
            <PartyPopper aria-hidden /> Xem thử pháo hoa &amp; lời chúc
          </Button>
          <div className="flex flex-wrap justify-center gap-1.5">
            <Button type="button" size="sm" variant="secondary" onClick={doiNgauNhien} data-testid="nut-ngau-nhien">
              <Dices className="size-3.5 text-gold" aria-hidden /> Đổi mẫu ngẫu nhiên
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMoThu((v) => !v)} data-testid="nut-thu-dong-mo">
              <Sparkles className="size-3.5" aria-hidden /> {moThu ? "Đóng lại" : "Mở thử"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setNenGam((v) => !v)} data-testid="nut-nen-gam">
              <Layers className="size-3.5" aria-hidden /> Nền gấm: {nenGam ? "Bật" : "Tắt"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setHoaRoi((v) => !v)} data-testid="nut-hoa-roi">
              <Flower2 className="size-3.5" aria-hidden /> Hoa rơi: {hoaRoi ? "Bật" : "Tắt"}
            </Button>
          </div>

          {/* Tạo & Tải hình chia sẻ lên Social (3 khổ chuẩn Story / Post / Link) */}
          <Card className="space-y-2.5 border-gold/25 bg-gold/[0.03] p-4" data-testid="lx-social-studio">
            <p className="text-xs font-semibold text-gold">Tải ảnh LÌ XÌ TẾT 2027 đăng Social (miễn phí)</p>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              Xuất ngay ảnh PNG sắc nét theo mẫu <b>{mauThiepTheoMa(mau).ten} × {ttHoaDangChon.ten}</b> để đăng Story, Facebook hoặc gửi Zalo.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {DANH_SACH_KHUNG_SOCIAL.map((k) => (
                <a
                  key={k.ma}
                  href={linkAnhSocial(k.ma)}
                  download={`li-xi-tet-2027-${k.ma}.png`}
                  onClick={(e) => {
                    ghi("share_created", { kind: "li_xi_anh", khung: k.ma, mau, hoa });
                    if (/Zalo|FBAN|FBAV/i.test(navigator.userAgent)) {
                      e.preventDefault();
                      void taiAnhSocialLiXi(linkAnhSocial(k.ma), `li-xi-tet-2027-${k.ma}.png`);
                    }
                  }}
                  data-testid={`tai-social-${k.ma}`}
                  className="flex flex-col items-center gap-0.5 rounded-xl border border-line/70 px-2 py-2 text-center text-[11px] transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <span className="inline-flex items-center gap-1 font-medium text-fg">
                    <Download className="size-3 text-gold" aria-hidden /> {k.ten}
                  </span>
                  <span className="text-[10px] text-fg-faint">{k.kichThuoc}</span>
                </a>
              ))}
            </div>
            <div className="border-t border-gold/20 pt-3">
              <NutVideoLiXi mau={mau} hoa={hoa} nenGam={nenGam} tenNguoiTang={ten} loiChuc={chuc} nguon="mua" />
            </div>
          </Card>
        </div>

        {/* Cột phải: Công tắc Ngẫu nhiên / Tự chọn Custom + Chất liệu × 6 Hoạ tiết + Chọn gói + Thanh toán */}
        <Card className="space-y-6 border-gold/25 lg:col-span-7" data-testid="lx-form">
          {/* Thanh công tắc chế độ thiết kế: Tự chọn (Custom) vs Phối ngẫu nhiên may mắn */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line/70 bg-bg-2/40 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-fg">Chế độ thiết kế phong bao</p>
              <p className="text-[11px] text-fg-muted">
                {tuChon
                  ? "Tự chọn chất liệu gấm, mẫu Linh Vật Đinh Mùi & hoa xuân theo gu của bạn"
                  : `Đang phối ngẫu nhiên may mắn: ${mauThiepTheoMa(mau).ten} × ${ttHoaDangChon.ten}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setTuChon(false); doiNgauNhien(); }}
                aria-pressed={!tuChon}
                data-testid="che-do-ngau-nhien"
                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${!tuChon ? "border-gold bg-gold/15 text-gold" : "border-line/70 text-fg-muted hover:text-fg"}`}
              >
                <Dices className="size-3.5" aria-hidden /> Ngẫu nhiên
              </button>
              <button
                type="button"
                onClick={() => setTuChon(true)}
                aria-pressed={tuChon}
                data-testid="che-do-tu-chon"
                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${tuChon ? "border-gold bg-gold/15 text-gold" : "border-line/70 text-fg-muted hover:text-fg"}`}
              >
                <SlidersHorizontal className="size-3.5" aria-hidden /> Tự chọn (Custom)
              </button>
            </div>
          </div>

          {tuChon ? (
            <>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-fg">1. Chọn chất liệu giấy Tết</p>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-fg-muted">
                    <input
                      type="checkbox"
                      checked={nenGam}
                      onChange={(e) => setNenGam(e.target.checked)}
                      className="accent-gold"
                    />
                    Phủ hoạ tiết vân gấm
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {DANH_SACH_MAU_THIEP.map((m) => (
                    <button
                      key={m.ma}
                      type="button"
                      onClick={() => chonMau(m.ma)}
                      aria-pressed={mau === m.ma}
                      data-testid={`mau-${m.ma}`}
                      className={`flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-colors ${mau === m.ma ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/40"}`}
                    >
                      <span className="h-5 w-full rounded-md border" style={{ background: `linear-gradient(135deg, ${m.nenChinh}, ${m.nenPhu})`, borderColor: m.vien }} />
                      <span className="text-xs font-medium text-fg">{m.ten}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-sm font-medium text-fg">2. Chọn tranh Linh Vật Đinh Mùi 2027 &amp; Hoa Xuân</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {DANH_SACH_HOA_TIET.map((h) => (
                    <button
                      key={h.ma}
                      type="button"
                      onClick={() => setHoa(h.ma)}
                      aria-pressed={hoa === h.ma}
                      data-testid={`hoa-${h.ma}`}
                      className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-colors ${hoa === h.ma ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/40"}`}
                    >
                      {h.anh ? (
                        <img src={h.anh} alt={h.ten} className="size-11 shrink-0 rounded-lg border border-gold/40 object-cover" />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-bg-2 text-gold">
                          <Sparkles className="size-5" aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-fg">{h.ten}</p>
                        <p className="line-clamp-2 text-[10px] leading-tight text-fg-muted">{h.moTa}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/[0.04] p-4" data-testid="hop-ngau-nhien">
              <div className="flex items-center gap-3">
                {ttHoaDangChon.anh && (
                  <img src={ttHoaDangChon.anh} alt={ttHoaDangChon.ten} className="size-14 rounded-xl border border-gold/50 object-cover" />
                )}
                <div>
                  <p className="text-xs font-semibold text-gold">{mauThiepTheoMa(mau).ten} · {ttHoaDangChon.ten}</p>
                  <p className="text-xs text-fg-muted">{ttHoaDangChon.moTa} · {nenGam ? "Có hoạ tiết vân gấm" : "Nền trơn"}</p>
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={doiNgauNhien}>
                <Dices className="size-4 text-gold" aria-hidden /> Bốc mẫu khác
              </Button>
            </div>
          )}

          {/* UX-NM: chưa mở bán thì không bày giá. */}
          {tt.bat && <div className="space-y-2.5">
            <p className="text-sm font-medium text-fg">3. Chọn số lượng bao</p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {goiDs.map((g) => (
                <button
                  key={g.so}
                  type="button"
                  onClick={() => setSoBao(g.so)}
                  aria-pressed={soBao === g.so}
                  data-testid={`goi-lx-${g.so}`}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-colors ${soBao === g.so ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/40"}`}
                >
                  {g.nhan && (
                    <span className="mb-1 inline-block w-fit rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">{g.nhan}</span>
                  )}
                  <p className="text-sm font-medium text-fg">{g.ten}</p>
                  <p className="mt-1 font-serif text-xl font-semibold text-gold">{dinhDangVnd(g.gia)}</p>
                  <p className="mt-1 text-[11px] text-fg-muted">{g.phu}</p>
                </button>
              ))}
            </div>
          </div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="lx-ten" className="text-xs font-medium text-fg-muted">Tên người tặng (tuỳ chọn, hiện trên thiệp)</label>
              <Input id="lx-ten" maxLength={40} value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Ví dụ: Anh Minh, Gia đình Lan…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-fg-muted">Chọn nhanh lời chúc hay</label>
              <div className="flex flex-wrap gap-1.5">
                {LOI_CHUC_CHUNG_DS.slice(0, 3).map((m, i) => (
                  <button key={i} type="button" onClick={() => { setChuc(m); setQuanHe(null); }}
                    className="rounded-full border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-gold/50 hover:text-fg">
                    Mẫu {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-line/70 bg-bg-2/30 p-3.5" data-testid="lx-quan-he">
            <p className="text-xs font-medium text-fg">Bạn tặng ai? <span className="font-normal text-fg-faint">Chọn để có sẵn lời chúc hợp, rồi sửa tuỳ ý</span></p>
            <div className="flex flex-wrap gap-1.5">
              {QUAN_HE_CHUC.map((q) => (
                <button
                  key={q.ma}
                  type="button"
                  onClick={() => chonLoi(q.ma, giong)}
                  aria-pressed={quanHe === q.ma}
                  data-testid={`quan-he-${q.ma}`}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${quanHe === q.ma ? "border-gold bg-gold/15 text-gold" : "border-line/70 text-fg-muted hover:border-gold/50 hover:text-fg"}`}
                >
                  {q.ten}
                </button>
              ))}
            </div>
            {quanHe && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-line/50 pt-2.5" role="group" aria-label="Giọng lời chúc" data-testid="lx-giong">
                <span className="mr-1 text-[11px] text-fg-muted">Giọng:</span>
                {GIONG_CHUC.map((g) => (
                  <button
                    key={g.ma}
                    type="button"
                    onClick={() => chonLoi(quanHe, g.ma)}
                    aria-pressed={giong === g.ma}
                    data-testid={`giong-${g.ma}`}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${giong === g.ma ? "border-gold bg-gold/15 text-gold" : "border-line/70 text-fg-muted hover:border-gold/50 hover:text-fg"}`}
                  >
                    {g.ten}
                  </button>
                ))}
                {giong === "y" && <span className="basis-full text-[11px] text-fg-faint">Mượn hình ảnh của năm Đinh Mùi: ngọn đèn soi đường, nước sông Ngân rộng lượng.</span>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <label htmlFor="lx-chuc" className="font-medium">Lời chúc (chọn mẫu hoặc tự viết)</label>
              <span>{chuc.trim().length}/160</span>
            </div>
            <Textarea id="lx-chuc" rows={3} maxLength={160} value={chuc} onChange={(e) => { setChuc(e.target.value); setQuanHe(null); }} placeholder="Viết lời chúc đầu xuân (không kèm link hay số điện thoại)" />
            <p className="text-[11px] text-fg-faint">
              {LOI_CHUC_MAU.includes(chuc.trim()) ? "Lời chúc mẫu hiện cả trên ảnh xem trước khi gửi link." : "Lời chúc tự viết chỉ hiện khi người nhận mở bao (ảnh xem trước link dùng câu chung)."}
            </p>
          </div>

          {loi && <p className="text-sm text-cinnabar" role="alert" data-testid="lx-loi">{loi}</p>}

          {tt.bat ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
              <div>
                <p className="text-xs text-fg-muted">Thanh toán chuyển khoản VietQR (Pay2S)</p>
                <p className="font-serif text-2xl font-semibold text-gold">{dinhDangVnd(goiChon.gia)}</p>
              </div>
              <Button size="lg" onClick={() => void mua()} disabled={dang} data-testid="lx-nut-mua">
                {dang ? <Loader2 className="animate-spin" aria-hidden /> : <QrCode aria-hidden />}
                Tạo {soBao} Bao LÌ XÌ TẾT 2027
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-4 text-sm text-fg-muted" data-testid="lx-chua-mo">
              <p className="font-medium text-fg">Lì xì Tết 2027 chưa mở bán</p>
              <p className="mt-1 text-xs">
                {tt.ly_do === "cong_tac_tat" ? "Lì xì Tết 2027 sắp mở bán, bạn quay lại sau nhé."
                  : tt.ly_do === "chua_co_cong" ? "Cổng thanh toán đang được thiết lập nên chưa bán được."
                  : tt.ly_do === "khong_doc_duoc" ? "Chưa tải được thông tin bán hàng, bạn thử lại sau ít phút."
                  : "Báo cáo Thời gian tới đang miễn phí cho mọi người, nên chưa bán bao lì xì."}
                {" "}Bạn vẫn xem thử mẫu thiệp và tải ảnh chúc Tết ở bên trái.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Danh sách Bao Lì Xì đã mua của người dùng */}
      {daTang.length > 0 && (
        <section id="bao-da-tao" className="scroll-mt-24 space-y-3" data-testid="lx-da-tang">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
            <Gift className="size-5 text-gold" aria-hidden /> Bao lì xì bạn đã tạo ({daTang.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daTang.map((b, i) => {
              const st = TRANG_THAI_NHAN[b.trang_thai ?? "cho_tra"] ?? TRANG_THAI_NHAN.cho_tra!;
              const guiDuoc = b.trang_thai === "san_sang";
              return (
                <Card key={b.ma} className="space-y-2.5 border-line/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-fg">Bao #{i + 1} · {b.nam}</span>
                    <span className={st.lop}>{st.chu}</span>
                  </div>
                  {b.loi_chuc && <p className="line-clamp-2 text-xs text-fg-muted">“{b.loi_chuc}”</p>}
                  {b.trang_thai === "da_nhan" && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-jade/10 px-2.5 py-1.5 text-[11px] text-jade" data-testid="lx-da-mo-luc">
                      <PartyPopper className="size-3.5 shrink-0" aria-hidden />
                      Đã có người mở bao{b.nhan_luc ? ` lúc ${new Date(b.nhan_luc).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}` : ""}
                    </p>
                  )}
                  {guiDuoc && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => void chiaSe(b)}>
                        <Share2 className="size-3.5" aria-hidden /> Gửi Zalo / FB
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void chepLink(b.ma)} aria-label="Sao chép link">
                        {daChep === b.ma ? <Check className="size-3.5 text-jade" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                      </Button>
                      <Button asChild size="sm" variant="outline" aria-label="Tải ảnh Story 9:16">
                        <a href={linkAnhSocial("doc", b.ma)} download={`li-xi-tet-2027-${b.ma}-story.png`}>
                          <Download className="size-3.5" aria-hidden />
                        </a>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
