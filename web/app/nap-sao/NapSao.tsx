"use client";
// Chọn gói → POST /api/thanh-toan/tao-don (kèm access token) → chuyển sang trang thanh toán của cổng.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";

type Goi = { ma: string; ten: string; gia_vnd: number; sao: number; nhan: string | null; mo_ta: string | null };
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export function NapSao({ goi, cong }: { goi: Goi[]; cong: "payos" | "gia" | null }) {
  const [chon, setChon] = useState(goi.find((g) => g.nhan)?.ma ?? goi[0]?.ma ?? "");
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: cong ?? "chua_mo" });
    if (!cong) return;
    void supabase().then(async (sb) => {
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      setToken(data.session?.access_token ?? null);
    });
  }, [cong]);

  async function nap() {
    if (!token) return;
    setDang(true); setLoi(null);
    ghi("checkout_started", { kind: chon });
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
  return (
    <div className="mt-8 space-y-6" data-testid="nap-sao">
      <fieldset>
        <legend className="sr-only">Chọn gói Sao</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {goi.map((x) => (
            <label key={x.ma} data-testid={`goi-${x.ma}`}
              className={`glass relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-5 transition-colors ${chon === x.ma ? "border-gold" : "border-line/70 hover:border-gold/50"}`}>
              <input type="radio" name="goi" value={x.ma} checked={chon === x.ma} onChange={() => setChon(x.ma)} className="sr-only" />
              {x.nhan && <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-semibold text-bg">{x.nhan}</span>}
              <span className="text-sm text-fg-muted">{x.ten}</span>
              <span className="flex items-center gap-1.5 font-serif text-3xl text-gold"><Sparkles className="size-5" aria-hidden />{x.sao} Sao</span>
              <span className="text-lg text-fg">{vnd(x.gia_vnd)}</span>
              {x.mo_ta && <span className="text-xs text-fg-faint">{x.mo_ta}</span>}
              {chon === x.ma && <Check className="absolute bottom-4 right-4 size-4 text-gold" aria-hidden />}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <QrCode className="size-8 shrink-0 text-gold" aria-hidden />
        <div className="flex-1 text-sm">
          <p className="font-medium text-fg">Chuyển khoản QR — app ngân hàng hoặc ví bất kỳ</p>
          <p className="text-fg-muted">Quét mã, xác nhận là xong. Sao vào ví trong vài giây sau khi tiền về. Sao mua không hết hạn.</p>
        </div>
        {!cong ? (
          <p className="text-sm text-fg-faint" data-testid="nap-chua-mo">Nạp Sao đang chuẩn bị mở.</p>
        ) : token === undefined ? (
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
