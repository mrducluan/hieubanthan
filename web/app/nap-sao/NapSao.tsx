"use client";
// Chọn gói → POST /api/thanh-toan/tao-don (kèm access token) → chuyển sang trang thanh toán của cổng.
// SAO-ND (0027): mỗi gói ghi giá VND + "≈ N báo cáo"; công tắc tặng lần nạp đầu bật và người xem chưa từng nạp → một
// dòng trung tính + số Sao tặng của từng gói (không đếm ngược, không giới hạn suất, không gạch giá).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Gift, Loader2, LockKeyhole, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import {
  dongNapDau, goiMacDinh, hienNapDau, saoTangLanDau, soBaoCao, thuocTinhNap, type GoiHienThi, type NapDau,
} from "@/lib/thanh-toan/nap-dau";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export function NapSao({ goi, cong, giaBaoCao, napDau: napDauBanDau, mienPhi = false }: {
  goi: GoiHienThi[]; cong: "payos" | "gia" | null; giaBaoCao: number; napDau: NapDau | null;
  /** Không chỗ nào đang trừ Sao (máy chủ đọc công tắc) — chỉ để đo tỉ lệ rời trang theo trạng thái này. */
  mienPhi?: boolean;
}) {
  // Rà UX mục 8: cổng chưa mở → không chọn sẵn gói nào (không có dấu ✓ dẫn tới ngõ cụt).
  const [chon, setChon] = useState(cong ? goiMacDinh(goi)?.ma ?? "" : "");
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [napDau, setNapDau] = useState<NapDau | null>(napDauBanDau);
  const [daHoi, setDaHoi] = useState(false);   // đã hỏi "lần đầu" của tài khoản đang đăng nhập (tránh hiện rồi tắt)
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: cong ?? "chua_mo", mien_phi: mienPhi ? 1 : 0 });
    if (!cong) return;
    void supabase().then(async (sb) => {
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      const tk = data.session?.access_token ?? null;
      setToken(tk);
      // Đã đăng nhập → hỏi máy chủ "tài khoản này đã từng nạp chưa" (chỉ của chính mình).
      if (tk) {
        fetch("/api/thanh-toan/goi", { headers: { authorization: `Bearer ${tk}` }, cache: "no-store" })
          .then((r) => r.json()).then((d: { nap_dau?: NapDau | null }) => { if (d.nap_dau !== undefined) setNapDau(d.nap_dau); })
          .catch(() => { /* giữ thông tin chung */ })
          .finally(() => setDaHoi(true));
      }
    });
  }, [cong, mienPhi]);

  async function nap() {
    if (!token) return;
    setDang(true); setLoi(null);
    ghi("checkout_started", thuocTinhNap(chon, napDau));
    try {
      const r = await fetch("/api/thanh-toan/tao-don", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ goi: chon }),
      });
      const j = (await r.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!r.ok || !j.checkoutUrl) throw new Error(j.error ?? "Chưa tạo được đơn.");
      window.location.href = j.checkoutUrl;
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được đơn.");
      setDang(false);
    }
  }

  const g = goi.find((x) => x.ma === chon);
  // Chỉ hiện khi cổng nạp đang mở; người đăng nhập thì đợi biết "đã từng nạp chưa" rồi mới hiện.
  const nd = cong && hienNapDau(napDau) && (token === null || (token && daHoi)) ? napDau : null;
  return (
    <div className="mt-8 space-y-6" data-testid="nap-sao">
      {nd && (
        <p className="flex items-start gap-2 text-sm text-fg-muted" data-testid="nap-dau">
          <Gift className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{dongNapDau(nd)}
        </p>
      )}
      {!cong && (
        <p id="ly-do-chua-mo" className="flex items-start gap-2 rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 text-sm text-fg-muted" data-testid="nap-chua-mo">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <span><b className="text-fg">Nạp Sao chưa mở</b> nên chưa chọn gói được. Bảng giá dưới đây để bạn xem trước.</span>
        </p>
      )}
      <fieldset disabled={!cong} aria-describedby={cong ? undefined : "ly-do-chua-mo"} className={cong ? undefined : "opacity-60"} data-testid="khoi-goi">
        <legend className="sr-only">Chọn gói Sao</legend>
        <div className={`grid gap-3 ${goi.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {goi.map((x) => {
            const bc = soBaoCao(x.sao, giaBaoCao);
            const tang = nd ? saoTangLanDau(x.sao, nd.phan_tram) : 0;
            return (
              <label key={x.ma} data-testid={`goi-${x.ma}`}
                className={`glass relative flex flex-col gap-1 rounded-2xl border p-5 transition-colors ${!cong ? "cursor-not-allowed border-line/70" : chon === x.ma ? "cursor-pointer border-gold" : "cursor-pointer border-line/70 hover:border-gold/50"}`}>
                <input type="radio" name="goi" value={x.ma} checked={chon === x.ma} onChange={() => setChon(x.ma)} className="sr-only" />
                {x.nhan && <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-semibold text-bg">{x.nhan}</span>}
                <span className="text-sm text-fg-muted">{x.ten}</span>
                <span className="flex items-center gap-1.5 font-serif text-3xl text-gold"><Sparkles className="size-5" aria-hidden />{x.sao} Sao</span>
                <span className="text-lg text-fg">{vnd(x.gia_vnd)}</span>
                {bc > 0 && <span className="text-xs text-fg-muted" data-testid="so-bao-cao">≈ {bc} báo cáo Luận giải toàn bộ</span>}
                {tang > 0 && <span className="text-xs text-gold" data-testid="sao-tang-dau">+{tang} Sao tặng nếu là lần nạp đầu</span>}
                {x.mo_ta && <span className="text-xs text-fg-faint">{x.mo_ta}</span>}
                {chon === x.ma && <Check className="absolute bottom-4 right-4 size-4 text-gold" aria-hidden />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={`glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center ${cong ? "" : "opacity-60"}`}>
        <QrCode className="size-8 shrink-0 text-gold" aria-hidden />
        <div className="flex-1 text-sm">
          <p className="font-medium text-fg">Chuyển khoản QR — app ngân hàng hoặc ví bất kỳ</p>
          <p className="text-fg-muted">Quét mã, xác nhận là xong. Sao vào ví trong vài giây sau khi tiền về. Sao mua không hết hạn.</p>
        </div>
        {!cong ? null : token === undefined ? (
          <Button disabled><Loader2 className="animate-spin" aria-hidden /> Đang kiểm tra</Button>
        ) : token === null ? (
          <Button asChild><Link href="/dang-nhap?tiep=/nap-sao">Đăng nhập để nạp</Link></Button>
        ) : (
          <Button onClick={() => void nap()} disabled={dang || !g} data-testid="nut-nap">
            {dang ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {g ? `Nạp ${g.sao} Sao · ${vnd(g.gia_vnd)}` : "Chọn gói"}
          </Button>
        )}
      </div>
      {cong === "gia" && <p className="text-xs text-fg-faint">Đang chạy cổng THỬ: không thu tiền thật.</p>}
      {loi && <p role="alert" className="text-sm text-red-300">{loi}</p>}
    </div>
  );
}
