"use client";
// Nút "Mua hội viên": hỏi máy chủ trạng thái của chính mình (hoi_vien_cua_toi qua /api/thanh-toan/goi kèm access token)
// → đang là hội viên còn > 30 ngày thì chỉ hiện ngày hết hạn; còn ≤ 30 ngày thì nút "Gia hạn"; chưa đăng nhập → đăng nhập
// trước rồi quay lại đây. Tạo đơn: POST /api/thanh-toan/tao-don {loai: "hoi_vien"} → cùng luồng QR payOS / cổng giả.
// Công tắc tắt → không nút, dòng "sắp mở". Không đếm ngược, không "ưu đãi", không gạch giá.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { QUAY_VE } from "@/lib/sao-client";
import { docHoiVien, ngayVn, thuocTinhHoiVien, vnd, type HoiVien } from "@/lib/thanh-toan/hoi-vien";

export function MuaHoiVien({ bat, cong, gia }: { bat: boolean; cong: "payos" | "gia" | null; gia: number }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [hv, setHv] = useState<HoiVien | null | undefined>(undefined);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: "hoi_vien", nguon: bat && cong ? "mo" : "chua_mo" });
    if (!bat || !cong) return;
    void supabase().then(async (sb) => {
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      const tk = data.session?.access_token ?? null;
      setToken(tk);
      if (!tk) { setHv(null); return; }
      fetch("/api/thanh-toan/goi", { headers: { authorization: `Bearer ${tk}` }, cache: "no-store" })
        .then((r) => r.json()).then((d: { hoi_vien?: unknown }) => setHv(docHoiVien(d.hoi_vien)))
        .catch(() => setHv(null));
    });
  }, [bat, cong]);

  async function mua(giaHan: boolean) {
    if (!token) return;
    setDang(true); setLoi(null);
    ghi("checkout_started", thuocTinhHoiVien(giaHan));
    try {
      try { sessionStorage.setItem(QUAY_VE, "/tai-khoan#hoi-vien"); } catch { /* riêng tư */ }
      const r = await fetch("/api/thanh-toan/tao-don", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ loai: "hoi_vien" }),
      });
      const j = (await r.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!r.ok || !j.checkoutUrl) throw new Error(j.error ?? "Chưa tạo được đơn.");
      window.location.href = j.checkoutUrl;
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được đơn.");
      setDang(false);
    }
  }

  if (!bat || !cong) {
    return <p className="mt-4 text-sm text-fg-faint" data-testid="hoi-vien-chua-mo">Hội viên năm sắp mở. Trong lúc chờ, bạn vẫn nạp Sao lẻ được ở <Link href="/nap-sao" className="text-gold underline">Nạp Sao</Link>.</p>;
  }
  const dangLa = hv?.dang_la ?? false;
  const giaHan = dangLa && hv!.gia_han_duoc;
  return (
    <div className="mt-5 space-y-3" data-testid="mua-hoi-vien">
      {dangLa && (
        <p className="flex items-start gap-2 text-sm text-jade" data-testid="hoi-vien-dang-la">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          Bạn đang là hội viên tới {ngayVn(hv!.den_ngay)}{giaHan ? " — gia hạn được từ bây giờ (nối tiếp hạn hiện tại)." : ". Gia hạn mở khi còn 30 ngày trở xuống."}
        </p>
      )}
      {token === undefined || (token && hv === undefined) ? (
        <Button disabled><Loader2 className="animate-spin" aria-hidden /> Đang kiểm tra</Button>
      ) : token === null ? (
        <Button asChild data-testid="hoi-vien-dang-nhap"><Link href="/dang-nhap?tiep=/hoi-vien">Đăng nhập để mua hội viên</Link></Button>
      ) : dangLa && !giaHan ? (
        <Button asChild variant="secondary"><Link href="/tai-khoan#hoi-vien">Xem thẻ hội viên</Link></Button>
      ) : (
        <Button onClick={() => void mua(giaHan)} disabled={dang} data-testid="nut-mua-hoi-vien">
          {dang ? <Loader2 className="animate-spin" aria-hidden /> : <QrCode aria-hidden />}
          {giaHan ? `Gia hạn hội viên · ${vnd(gia)}` : `Mua hội viên · ${vnd(gia)}`}
        </Button>
      )}
      <p className="text-xs text-fg-faint">Quét QR bằng app ngân hàng hoặc ví bất kỳ có VietQR. Kích hoạt trong vài giây sau khi tiền về, rồi bạn về thẻ hội viên ở Tài khoản.</p>
      {cong === "gia" && <p className="text-xs text-fg-faint">Đang chạy cổng THỬ: không thu tiền thật.</p>}
      {loi && <p role="alert" className="text-sm text-red-300">{loi}</p>}
    </div>
  );
}
