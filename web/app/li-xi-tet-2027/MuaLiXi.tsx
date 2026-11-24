"use client";
// LX-2027 — Giao diện LÌ XÌ TẾT 2027: 4 chất liệu giấy × 4 hoạ tiết Tết (16 tổ hợp), hiệu ứng hoa rơi & pháo hoa khi mở,
// chọn gói 1 / 3 / 5 bao, thanh toán Pay2S, quản lý bao đã mua và tải ảnh chia sẻ Social 3 khổ (Story 9:16 · Post 1:1 · Link 16:9).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Flower2, Gift, Loader2, QrCode, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { BaoLiXi3D } from "@/components/li-xi/BaoLiXi3D";
import {
  DANH_SACH_HOA_TIET,
  DANH_SACH_KHUNG_SOCIAL,
  DANH_SACH_MAU_THIEP,
  dinhDangVnd,
  kiemLoiChuc,
  LOI_CHUC_MAU,
  mauThiepTheoMa,
  type BaoLiXiCuaToi,
  type HoaTietTet,
  type KhungSocial,
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

export function MuaLiXi({ banDau }: { banDau: ThongTinLiXi }) {
  const router = useRouter();
  const [tt, setTt] = useState<ThongTinLiXi>(banDau);
  const [token, setToken] = useState<string | null>(null);
  const [soBao, setSoBao] = useState<1 | 3 | 5>(3);
  const [mau, setMau] = useState<MauThiep>("do_son");
  const [hoa, setHoa] = useState<HoaTietTet>("linh_vat");
  const [hoaRoi, setHoaRoi] = useState(true);
  const [ten, setTen] = useState("");
  const [chuc, setChuc] = useState(LOI_CHUC_MAU[0]!);
  const [moThu, setMoThu] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daTang, setDaTang] = useState<BaoLiXiCuaToi[]>([]);
  const [daChep, setDaChep] = useState<string | null>(null);

  useEffect(() => {
    try {
      const nhap = JSON.parse(sessionStorage.getItem(KHOA_NHAP) ?? "null") as {
        soBao?: 1 | 3 | 5; mau?: MauThiep; hoa?: HoaTietTet; ten?: string; chuc?: string;
      } | null;
      if (nhap) {
        if (nhap.soBao === 1 || nhap.soBao === 3 || nhap.soBao === 5) setSoBao(nhap.soBao);
        if (nhap.mau) setMau(nhap.mau);
        if (nhap.hoa) setHoa(nhap.hoa);
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
    setHoa(mauThiepTheoMa(m).hoaMacDinh);
  }

  const goiDs = [
    { so: 1 as const, ten: "1 Bao Lì Xì", gia: tt.gia_1, phu: "Mở trọn Báo cáo Năm 2027 cho 1 người", nhan: null },
    { so: 3 as const, ten: "Combo 3 Bao Gia Đình", gia: tt.gia_3, phu: `≈ ${dinhDangVnd(tt.gia_3 / 3)} mỗi bao · tiết kiệm 17%`, nhan: "Phổ biến" },
    { so: 5 as const, ten: "Combo 5 Bao Doanh Nghiệp", gia: tt.gia_5, phu: `≈ ${dinhDangVnd(tt.gia_5 / 5)} mỗi bao · tặng nhóm / đối tác`, nhan: "Tiết kiệm nhất" },
  ];
  const goiChon = goiDs.find((g) => g.so === soBao) ?? goiDs[1]!;

  async function mua() {
    setLoi(null);
    const loiChuc = kiemLoiChuc(chuc);
    if (loiChuc) { setLoi(loiChuc); return; }
    if (!token) {
      try { sessionStorage.setItem(KHOA_NHAP, JSON.stringify({ soBao, mau, hoa, ten, chuc })); } catch { /* bỏ qua */ }
      router.push("/dang-nhap?tiep=%2Fli-xi-tet-2027");
      return;
    }
    setDang(true);
    try {
      ghi("gift_purchased", { goi: `li_xi_${soBao}`, so_bao: soBao, mau_thiep: mau, hoa_tiet: hoa, gia_vnd: goiChon.gia });
      const r = await fetch("/api/li-xi/tao", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          so_bao: soBao,
          mau_thiep: mau,
          ten_nguoi_tang: ten.trim() || undefined,
          loi_chuc: chuc.trim() || undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; can?: string; checkoutUrl?: string };
      if (!r.ok) {
        if (j.can === "dang_nhap") { router.push("/dang-nhap?tiep=%2Fli-xi-tet-2027"); return; }
        setLoi(j.error ?? "Chưa tạo được đơn LÌ XÌ TẾT 2027.");
        return;
      }
      try { sessionStorage.removeItem(KHOA_NHAP); } catch { /* bỏ qua */ }
      if (j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      setLoi("Chưa nhận được liên kết thanh toán.");
    } catch {
      setLoi("Không kết nối được, thử lại sau ít phút.");
    } finally {
      setDang(false);
    }
  }

  function linkBao(ma: string) {
    return `${typeof window !== "undefined" ? window.location.origin : "https://hieuban.com"}/li-xi/${ma}`;
  }

  function linkAnhSocial(khung: KhungSocial, maBao?: string) {
    const qs = new URLSearchParams({ khung, mau, hoa, tai: "1" });
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

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Cột trái: Bao Lì Xì 3D + điều khiển hoa rơi + tải ảnh Social */}
        <div className="space-y-4 lg:col-span-5">
          <BaoLiXi3D
            mauThiep={mau}
            hoaTiet={hoa}
            hoaRoi={hoaRoi}
            tenNguoiTang={ten}
            loiChuc={chuc}
            daMo={moThu}
            onMo={() => setMoThu(true)}
            nhanNut="Bấm thử để xem hiệu ứng mở bao & pháo hoa"
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setMoThu((v) => !v)} data-testid="nut-thu-dong-mo">
              <Sparkles className="size-3.5" aria-hidden /> {moThu ? "Đóng lại xem mặt ngoài" : "Mở thử & bắn pháo hoa"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setHoaRoi((v) => !v)} data-testid="nut-hoa-roi">
              <Flower2 className="size-3.5" aria-hidden /> Hoa rơi: {hoaRoi ? "Bật" : "Tắt"}
            </Button>
          </div>

          {/* Tạo & Tải hình chia sẻ lên Social (3 khổ chuẩn Story / Post / Link) */}
          <Card className="space-y-2.5 border-gold/25 bg-gold/[0.03] p-4" data-testid="lx-social-studio">
            <p className="text-xs font-semibold text-gold">Tải ảnh LÌ XÌ TẾT 2027 đăng Social (miễn phí)</p>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              Xuất ngay ảnh PNG sắc nét theo chất liệu &amp; hoạ tiết bạn đang chọn để đăng Story, Facebook hoặc gửi Zalo.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {DANH_SACH_KHUNG_SOCIAL.map((k) => (
                <a
                  key={k.ma}
                  href={linkAnhSocial(k.ma)}
                  download={`li-xi-tet-2027-${k.ma}.png`}
                  onClick={() => ghi("share_created", { kind: "li_xi_anh", khung: k.ma, mau, hoa })}
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
          </Card>
        </div>

        {/* Cột phải: Tuỳ biến Chất liệu × Hoạ tiết + Chọn gói + Thanh toán */}
        <Card className="space-y-6 border-gold/25 lg:col-span-7" data-testid="lx-form">
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-fg">1. Chọn chất liệu giấy Tết</p>
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
            <p className="text-sm font-medium text-fg">2. Chọn hoạ tiết mặt bao (Linh vật · Hoa xuân · Pháo hoa)</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {DANH_SACH_HOA_TIET.map((h) => (
                <button
                  key={h.ma}
                  type="button"
                  onClick={() => setHoa(h.ma)}
                  aria-pressed={hoa === h.ma}
                  data-testid={`hoa-${h.ma}`}
                  className={`flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-colors ${hoa === h.ma ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/40"}`}
                >
                  <span className="text-xs font-medium text-fg">{h.ten}</span>
                  <span className="text-[10px] text-fg-muted">{h.moTa}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-medium text-fg">3. Chọn số lượng Bao Lì Xì</p>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="lx-ten" className="text-xs font-medium text-fg-muted">Tên người tặng (tuỳ chọn, hiện trên thiệp)</label>
              <Input id="lx-ten" maxLength={40} value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Ví dụ: Anh Minh, Gia đình Lan…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-fg-muted">Chọn nhanh lời chúc hay</label>
              <div className="flex flex-wrap gap-1.5">
                {LOI_CHUC_MAU.slice(0, 3).map((m, i) => (
                  <button key={i} type="button" onClick={() => setChuc(m)}
                    className="rounded-full border border-line px-2.5 py-1 text-[11px] text-fg-muted hover:border-gold/50 hover:text-fg">
                    Mẫu {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <label htmlFor="lx-chuc" className="font-medium">Lời chúc in trong bao lì xì</label>
              <span>{chuc.trim().length}/160</span>
            </div>
            <Textarea id="lx-chuc" rows={2} maxLength={160} value={chuc} onChange={(e) => setChuc(e.target.value)} placeholder="Viết lời chúc đầu xuân (không kèm link hay số điện thoại)" />
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
              <p className="font-medium text-fg">Chương trình LÌ XÌ TẾT 2027 đang chuẩn bị mở bán</p>
              <p className="mt-1 text-xs">Bạn có thể thử 16 tổ hợp Bao Lì Xì 3D và tải ảnh chia sẻ Social ở bên trái. Khi mở bán, mỗi đơn thanh toán qua VietQR sẽ sinh ngay link lì xì để gửi qua Zalo/Facebook.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Danh sách Bao Lì Xì đã mua của người dùng */}
      {daTang.length > 0 && (
        <section className="space-y-3" data-testid="lx-da-tang">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
            <Gift className="size-5 text-gold" aria-hidden /> Bao LÌ XÌ TẾT 2027 bạn đã tạo ({daTang.length})
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
