"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";

type Don = { ma_don: number; sao: number; so_tien: number; trang_thai: string };
const HOI_TOI_DA = 100; // ~5 phút, 3 giây/lần

export function KetQua() {
  const p = useSearchParams();
  const ma = p.get("ma") ?? "";
  const [don, setDon] = useState<Don | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [het, setHet] = useState(false);

  useEffect(() => {
    if (!/^\d{1,15}$/.test(ma)) { setLoi("Thiếu mã đơn."); return; }
    let lan = 0, dung = false;
    const hoi = async () => {
      const sb = await supabase();
      const token = (await sb?.auth.getSession())?.data.session?.access_token;
      if (!token) { setLoi("Hãy đăng nhập lại để xem đơn."); return; }
      const r = await fetch(`/api/thanh-toan/don/${ma}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!r.ok) { setLoi("Không thấy đơn này."); return; }
      const d = (await r.json()) as Don;
      setDon(d);
      if (d.trang_thai === "da_tra") { ghi("payment_succeeded", { so_sao: d.sao }); return; }
      if (d.trang_thai !== "cho" || dung) return;
      if (++lan >= HOI_TOI_DA) { setHet(true); return; }
      setTimeout(() => void hoi(), 3000);
    };
    void hoi();
    return () => { dung = true; };
  }, [ma]);

  if (loi) return <p className="mt-6 text-fg-muted">{loi}</p>;
  if (!don) return <p className="mt-8 inline-flex items-center gap-2 text-fg-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Đang kiểm tra đơn…</p>;
  const huy = p.get("huy") === "1";
  return (
    <div className="glass mt-8 space-y-4 rounded-2xl p-6" data-testid="ket-qua-nap" data-trang-thai={don.trang_thai}>
      {don.trang_thai === "da_tra" ? (
        <><CheckCircle2 className="mx-auto size-10 text-jade" aria-hidden />
          <p className="text-lg text-fg">Đã nhận {don.sao} Sao. Cảm ơn bạn!</p></>
      ) : don.trang_thai === "cho" && !huy ? (
        <><Clock className="mx-auto size-10 text-gold" aria-hidden />
          <p className="text-fg">{het ? "Chưa thấy tiền về. Nếu bạn đã chuyển khoản, Sao sẽ được cộng khi ngân hàng báo (thường vài phút)." : "Đang chờ ngân hàng báo tiền về…"}</p></>
      ) : (
        <><XCircle className="mx-auto size-10 text-fg-faint" aria-hidden />
          <p className="text-fg">{don.trang_thai === "hoan" ? "Đơn đã được hoàn tiền." : don.trang_thai === "sai_tien" ? "Số tiền chuyển không khớp gói — ban quản trị sẽ liên hệ đối soát." : "Đơn đã huỷ. Bạn chưa bị trừ tiền."}</p></>
      )}
      <p className="text-xs text-fg-faint">Mã đơn: <b className="text-fg-muted">{don.ma_don}</b> — dùng mã này khi cần hỗ trợ.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/tai-khoan#sao">Xem ví Sao</Link></Button>
        <Button asChild variant="secondary"><Link href="/nap-sao">Nạp thêm</Link></Button>
      </div>
    </div>
  );
}
