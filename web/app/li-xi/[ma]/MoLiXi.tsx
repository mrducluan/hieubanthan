"use client";
// LX-2027 — Trải nghiệm Mở Bao Lì Xì 3D (/li-xi/[ma]):
//   1. Người nhận bấm "Mở" → nắp bao lật 3D + thiệp lời chúc trượt lên;
//   2. Đăng nhập (nếu chưa) → bấm "Nhận Lì Xì & Mở Trọn Báo Cáo 2027" (POST /api/li-xi/[ma]);
//   3. Vào thẳng /thoi-gian-toi?nam=2027 tự nhập ngày giờ sinh của chính họ (chuẩn Luật 91/2025) + vòng lặp Lì Xì Đáp Lễ.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, Gift, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { BaoLiXi3D } from "@/components/li-xi/BaoLiXi3D";
import { BanDoTet2027 } from "@/components/li-xi/BanDoTet2027";
import type { BaoLiXiCongKhai } from "@/lib/li-xi-tet";

export function MoLiXi({ ma, banDau }: { ma: string; banDau: BaoLiXiCongKhai }) {
  const router = useRouter();
  const [bao, setBao] = useState<BaoLiXiCongKhai>(banDau);
  const [daMo, setDaMo] = useState(false);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [dangNhan, setDangNhan] = useState(false);
  const [daNhanXong, setDaNhanXong] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!bao.co && ma) {
      fetch(`/api/li-xi/${encodeURIComponent(ma)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: BaoLiXiCongKhai | null) => { if (d?.co) setBao(d); })
        .catch(() => { /* giữ nguyên */ });
    }
    void supabase().then(async (sb) => {
      const tk = (await sb?.auth.getSession())?.data.session?.access_token ?? null;
      setToken(tk);
    });
  }, [ma, bao.co]);

  async function nhan() {
    setLoi(null);
    if (!token) {
      router.push(`/dang-nhap?tiep=${encodeURIComponent(`/li-xi/${ma}`)}`);
      return;
    }
    setDangNhan(true);
    try {
      const r = await fetch(`/api/li-xi/${encodeURIComponent(ma)}`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const j = (await r.json().catch(() => ({}))) as { ket_qua?: string; error?: string; can?: string };
      if (!r.ok) {
        if (j.can === "dang_nhap") { router.push(`/dang-nhap?tiep=${encodeURIComponent(`/li-xi/${ma}`)}`); return; }
        setLoi(j.error ?? "Chưa nhận được Bao Lì Xì.");
        return;
      }
      ghi("gift_claimed", { mau_thiep: bao.mau_thiep ?? "do_son", nam: bao.nam ?? 2027 });
      setDaNhanXong(true);
    } catch {
      setLoi("Không kết nối được, thử lại sau ít phút.");
    } finally {
      setDangNhan(false);
    }
  }

  if (!bao.co) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8 text-center" data-testid="lx-khong-co">
        <Card className="space-y-3 border-line/70">
          <h1 className="font-serif text-2xl font-semibold text-fg">Không tìm thấy Bao Lì Xì này</h1>
          <p className="text-sm text-fg-muted">
            Đường dẫn có thể chưa đúng, đơn chưa hoàn tất thanh toán hoặc bao lì xì đã hết hạn.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild><Link href="/li-xi-tet-2027">Tìm hiểu Lì Xì Tết 2027</Link></Button>
            <Button asChild variant="outline"><Link href="/thoi-gian-toi">Xem Thời gian tới của bạn</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  const daCoNguoiMo = bao.trang_thai === "da_nhan" && !daNhanXong;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="space-y-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">LÌ XÌ TẾT 2027 · XUÂN ĐINH MÙI</p>
        <h1 className="font-serif text-3xl font-semibold text-fg sm:text-4xl">
          {bao.ten_nguoi_tang ? `${bao.ten_nguoi_tang} gửi tặng bạn LÌ XÌ TẾT 2027` : "Bạn nhận được một Bao LÌ XÌ TẾT 2027"}
        </h1>

        <BaoLiXi3D
          mauThiep={bao.mau_thiep ?? "do_son"}
          tenNguoiTang={bao.ten_nguoi_tang}
          loiChuc={bao.loi_chuc}
          daMo={daMo}
          onMo={() => setDaMo(true)}
        />

        {daMo && (
          <Card className="mx-auto max-w-xl space-y-4 border-gold/30 bg-gold/[0.04]" data-testid="lx-hop-nhan">
            {daNhanXong ? (
              <div className="space-y-4" data-testid="lx-da-nhan-xong">
                <p className="flex items-center justify-center gap-2 text-base font-medium text-jade">
                  <CheckCircle2 className="size-5" aria-hidden /> Đã nhận Lì Xì vào tài khoản của bạn!
                </p>
                <p className="text-sm text-fg-muted">
                  Tài khoản của bạn đã được mở khoá <b>trọn bộ Báo cáo Năm Đinh Mùi 2027</b>. Bấm nút dưới để tự nhập ngày giờ sinh của bạn và đọc ngay:
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/thoi-gian-toi?nam=2027">
                      Đọc trọn Báo cáo Năm 2027 <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/li-xi-tet-2027">
                      <Gift className="size-4" aria-hidden /> Gửi Lì Xì Đáp Lễ
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost">
                    <a href={`/og/li-xi?khung=doc&ma=${encodeURIComponent(ma)}&tai=1`} download={`li-xi-tet-2027-${ma}-story.png`}>
                      <Download className="size-4" aria-hidden /> Tải ảnh Story 9:16
                    </a>
                  </Button>
                </div>
              </div>
            ) : daCoNguoiMo ? (
              <div className="space-y-3">
                <p className="text-sm text-fg">Bao Lì Xì này đã được mở nhận trước đó.</p>
                <p className="text-xs text-fg-muted">Nếu chính bạn đã mở bằng tài khoản này, hãy đăng nhập và vào thẳng trang Thời gian tới để đọc.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="secondary"><Link href="/thoi-gian-toi?nam=2027">Mở Thời gian tới 2027</Link></Button>
                  <Button asChild variant="outline"><Link href="/li-xi-tet-2027">Tạo Bao Lì Xì mới</Link></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-fg">
                  Nhận bao lì xì này để mở trọn <b>Báo cáo Năm Đinh Mùi 2027</b> (không tốn Sao). Bạn sẽ tự nhập ngày giờ sinh của chính mình ở bước sau — người tặng không thấy dữ liệu của bạn.
                </p>
                {loi && <p className="text-sm text-cinnabar" role="alert">{loi}</p>}
                <Button size="lg" onClick={() => void nhan()} disabled={dangNhan} data-testid="lx-nut-nhan">
                  {dangNhan ? <Loader2 className="animate-spin" aria-hidden /> : token ? <Gift aria-hidden /> : <LogIn aria-hidden />}
                  {token ? "Nhận Lì Xì & Mở Trọn Báo Cáo 2027" : "Đăng nhập để nhận Bao Lì Xì"}
                </Button>
                <p className="text-[11px] text-fg-faint">Hạn nhận tới {bao.het_han ? bao.het_han.split("-").reverse().join("/") : "31/03/2027"} · Dùng 1 lần</p>
              </div>
            )}
          </Card>
        )}
      </section>

      <BanDoTet2027 />
    </div>
  );
}
