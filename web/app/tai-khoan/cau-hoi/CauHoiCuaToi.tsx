"use client";
// SAO-CG — danh sách câu hỏi chuyên gia của chính mình (/api/chuyen-gia/cua-toi, kèm access token). Hạn trả lời ghi TRUNG TÍNH
// ("còn khoảng N giờ"), không đếm ngược giục. Đánh giá 1–5 sau khi có trả lời; huỷ khi còn chờ thanh toán.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KhungTai } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { dinhDangVnd, dongHan, TEN_MANG_CG, TEN_TRANG_THAI, type CauHoiCg } from "@/lib/chuyen-gia-hoi";

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

export function CauHoiCuaToi() {
  const sp = useSearchParams();
  const don = sp.get("don");
  const [ds, setDs] = useState<CauHoiCg[] | null>(null);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [loi, setLoi] = useState<string | null>(null);
  const [bao, setBao] = useState<string | null>(null);

  const tai = useCallback(async (tk: string, kemDon: boolean) => {
    const r = await fetch(`/api/chuyen-gia/cua-toi${kemDon && don ? `?don=${encodeURIComponent(don)}` : ""}`, { headers: { authorization: `Bearer ${tk}` }, cache: "no-store" });
    const j = (await r.json().catch(() => ({}))) as { ds?: CauHoiCg[]; error?: string };
    if (!r.ok) { setLoi(j.error ?? "Chưa đọc được."); return; }
    setDs(j.ds ?? []);
  }, [don]);

  useEffect(() => {
    void supabase().then(async (sb) => {
      const tk = (await sb?.auth.getSession())?.data.session?.access_token ?? null;
      setToken(tk);
      if (tk) await tai(tk, true);
    });
  }, [tai]);

  // Vừa thanh toán xong (?don=) mà đơn còn chờ cổng báo → hỏi lại vài lần, không quá 1 phút.
  useEffect(() => {
    if (!token || !don || !ds) return;
    const c = ds.find((x) => String(x.ma_don) === don);
    if (!c || c.trang_thai !== "cho_tra") return;
    const t = setTimeout(() => void tai(token, true), 4000);
    return () => clearTimeout(t);
  }, [token, don, ds, tai]);

  useEffect(() => {
    if (!don || !ds) return;
    const c = ds.find((x) => String(x.ma_don) === don);
    if (c && c.trang_thai !== "cho_tra" && c.trang_thai !== "het_han_don") {
      const k = `cg:da-ghi:${c.id}`;
      let daGhi = false;
      try { daGhi = localStorage.getItem(k) === "1"; localStorage.setItem(k, "1"); } catch { /* bỏ qua */ }
      if (!daGhi) ghi("expert_question_paid", { mang: c.mang });
    }
  }, [don, ds]);

  async function viec(body: { viec: "danh_gia"; id: number; diem: number } | { viec: "huy"; id: number }) {
    if (!token) return;
    setBao(null);
    const r = await fetch("/api/chuyen-gia/cua-toi", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) { setBao(j.error ?? "Chưa ghi được."); return; }
    if (body.viec === "danh_gia") ghi("expert_rated", { diem: String(body.diem) });
    setBao(body.viec === "danh_gia" ? "Cảm ơn bạn đã đánh giá." : "Đã huỷ câu hỏi.");
    await tai(token, false);
  }

  if (token === undefined || (token && ds === null && !loi)) return <div className="mt-8"><KhungTai dong={2} /></div>;
  if (token === null) {
    return (
      <Card className="mt-8 text-sm text-fg-muted">
        Đăng nhập để xem câu hỏi đã gửi. <Link href="/dang-nhap?tiep=%2Ftai-khoan%2Fcau-hoi" className="text-gold underline">Đăng nhập</Link>
      </Card>
    );
  }
  if (loi) return <p role="alert" className="mt-8 text-sm text-cinnabar">{loi}</p>;

  return (
    <div className="mt-8 space-y-4" data-testid="cg-danh-sach">
      {sp.get("moi") === "1" && <p className="text-sm text-jade">Đã gửi câu hỏi — chuyên gia sẽ trả lời trong hạn ghi bên dưới.</p>}
      {sp.get("huy") === "1" && <p className="text-sm text-fg-muted">Bạn đã huỷ thanh toán. Câu hỏi còn chờ, bạn có thể huỷ hẳn bên dưới.</p>}
      {bao && <p role="status" className="text-sm text-fg-muted">{bao}</p>}
      {ds!.length === 0 && (
        <Card className="text-sm text-fg-muted">Bạn chưa gửi câu hỏi nào. <Link href="/hoi-chuyen-gia" className="text-gold underline">Hỏi chuyên gia</Link></Card>
      )}
      {ds!.map((c) => (
        <Card key={c.id} data-testid="cg-cau" data-trang-thai={c.trang_thai} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-fg-muted">{TEN_MANG_CG[c.mang]} · {ngayGio(c.tao_luc)}{c.mien_phi_hoi_vien ? " · lượt hội viên" : c.gia_vnd ? ` · ${dinhDangVnd(c.gia_vnd)}` : ""}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${c.trang_thai === "da_tra_loi" ? "bg-jade/15 text-jade" : c.trang_thai === "cho_tra_loi" ? "bg-gold/15 text-gold" : "bg-surface-2 text-fg-muted"}`}>
              {TEN_TRANG_THAI[c.trang_thai] ?? c.trang_thai}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-fg">{c.cau_hoi}</p>
          {c.trang_thai === "cho_tra_loi" && (
            <p className="flex items-center gap-2 text-sm text-fg-muted" data-testid="cg-han"><Clock className="size-4 text-gold" aria-hidden />{dongHan(c.han_tra_loi)}</p>
          )}
          {c.trang_thai === "qua_han" && (
            <p className="text-sm text-fg-muted">Chuyên gia chưa kịp trả lời trong hạn. Chúng tôi sẽ liên hệ qua email tài khoản để hoàn 100% tiền — bạn không cần làm gì thêm.</p>
          )}
          {c.trang_thai === "hoan" && <p className="text-sm text-fg-muted">Đã hoàn tiền{c.hoan_luc ? ` ngày ${ngayGio(c.hoan_luc)}` : ""}.</p>}
          {c.trang_thai === "cho_tra" && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fg-muted">Chưa thanh toán{c.het_han_don ? ` (đơn còn hạn tới ${ngayGio(c.het_han_don)})` : ""}.</span>
              <Button size="sm" variant="ghost" onClick={() => void viec({ viec: "huy", id: c.id })} data-testid="cg-huy">Huỷ câu hỏi</Button>
            </div>
          )}
          {c.trang_thai === "het_han_don" && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fg-muted">Đơn thanh toán đã hết hạn. Huỷ câu này rồi <Link href="/hoi-chuyen-gia" className="text-gold underline">hỏi lại</Link> nếu bạn vẫn muốn.</span>
              <Button size="sm" variant="ghost" onClick={() => void viec({ viec: "huy", id: c.id })} data-testid="cg-huy">Huỷ câu hỏi</Button>
            </div>
          )}
          {c.tra_loi && (
            <div className="rounded-2xl border border-gold/25 bg-gold/[0.05] p-4" data-testid="cg-tra-loi">
              <p className="flex items-center gap-2 text-xs text-gold"><CheckCircle2 className="size-4" aria-hidden /> Chuyên gia Đức Luân trả lời{c.tra_loi_luc ? ` · ${ngayGio(c.tra_loi_luc)}` : ""}</p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-fg">{c.tra_loi}</p>
              <p className="mt-3 text-xs text-fg-faint">Góc nhìn tham khảo để bạn tự cân nhắc — không thay lời bác sĩ, luật sư hay chuyên gia tài chính.</p>
              <div className="mt-3 flex flex-wrap items-center gap-1 text-sm" role="group" aria-label="Đánh giá câu trả lời">
                <span className="mr-1 text-fg-muted">{c.danh_gia ? `Bạn đã đánh giá ${c.danh_gia}/5.` : "Câu trả lời có giúp bạn?"}</span>
                {[1, 2, 3, 4, 5].map((d) => (
                  <button key={d} type="button" aria-label={`${d} sao`} aria-pressed={c.danh_gia === d} data-testid={`cg-danh-gia-${d}`}
                    onClick={() => void viec({ viec: "danh_gia", id: c.id, diem: d })}
                    className={`rounded-full p-1 ${c.danh_gia && d <= c.danh_gia ? "text-gold" : "text-fg-faint hover:text-gold"}`}>
                    <Star className="size-5" fill={c.danh_gia && d <= c.danh_gia ? "currentColor" : "none"} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
      {ds!.some((c) => c.trang_thai === "cho_tra" && String(c.ma_don) === don) && (
        <p className="inline-flex items-center gap-2 text-xs text-fg-faint"><Loader2 className="size-3 animate-spin" aria-hidden /> Đang chờ cổng thanh toán báo về…</p>
      )}
      <p className="text-sm"><Link href="/hoi-chuyen-gia" className="text-gold hover:underline">Hỏi một câu khác →</Link></p>
    </div>
  );
}
