"use client";
// SAO-HV (0028) — thẻ hội viên ở /tai-khoan: còn N ngày, Sao tháng này (tự nhận khi mở trang — hàm SQL idempotent theo
// tháng), câu hỏi chuyên gia còn; nhắc gia hạn trung tính khi còn ≤ 30 ngày. Không là hội viên + công tắc bật → một dòng
// mời sang /hoi-vien. Chưa chạy 0028 / công tắc tắt và không là hội viên → ẩn hẳn.
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CalendarClock, MessageCircleQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { ghi } from "@/lib/do-luong";
import { docHoiVien, loiGiaHan, ngayVn, vnd, type HoiVien } from "@/lib/thanh-toan/hoi-vien";

export function TheHoiVien({ onSaoThayDoi }: { onSaoThayDoi?: () => void }) {
  const [hv, setHv] = useState<HoiVien | null | undefined>(undefined);
  const [saoMoi, setSaoMoi] = useState(0);

  useEffect(() => {
    let huy = false;
    void (async () => {
      const sb = await supabase();
      if (!sb) { setHv(null); return; }
      const { data, error } = await sb.rpc("hoi_vien_cua_toi");
      if (huy) return;
      const d = error ? null : docHoiVien(data);
      setHv(d);
      // Hội viên: cấp Sao tháng (một lần / tháng, SQL khoá theo tháng → gọi lặp không cộng hai lần).
      if (d?.dang_la && !d.sao_thang_da_cap) {
        const { data: so } = await sb.rpc("hoi_vien_cap_sao_thang");
        if (huy) return;
        if (typeof so === "number" && so > 0) {
          setSaoMoi(so); setHv({ ...d, sao_thang_da_cap: true });
          ghi("credit_earned", { kind: "hoi_vien_thang", so_sao: so });
          onSaoThayDoi?.();
        }
      }
    })();
    return () => { huy = true; };
  }, [onSaoThayDoi]);

  if (hv === undefined) return null;
  if (!hv || (!hv.dang_la && !hv.bat)) return null;
  if (!hv.dang_la) {
    return (
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center" data-testid="hoi-vien-moi">
        <BadgeCheck className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-sm text-fg-muted">
          Hội viên năm {vnd(hv.gia_vnd)}: mở mọi chương Luận giải toàn bộ, {hv.sao_thang} Sao tặng mỗi tháng, {hv.cau_hoi_nam} câu hỏi chuyên gia. Mua một lần, không tự gia hạn.
        </p>
        <Button asChild size="sm" variant="secondary"><Link href="/hoi-vien">Xem hội viên năm</Link></Button>
      </Card>
    );
  }
  const nhac = loiGiaHan(hv);
  return (
    <Card className="space-y-4" data-testid="the-hoi-vien">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold"><BadgeCheck className="size-6" aria-hidden /></span>
        <div className="flex-1">
          <p className="font-medium text-fg">Hội viên năm</p>
          <p className="text-sm text-fg-muted">{ngayVn(hv.tu_ngay)} → {ngayVn(hv.den_ngay)} · còn <b className="text-fg" data-testid="hoi-vien-con-ngay">{hv.con_ngay}</b> ngày</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-line/60 p-3">
          <p className="flex items-center gap-1.5 font-serif text-2xl text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> {hv.sao_thang}</p>
          <p className="text-fg-muted">Sao tặng tháng này</p>
          <p className="text-xs text-fg-faint" data-testid="hoi-vien-sao-thang">{saoMoi ? `Vừa cộng ${saoMoi} Sao.` : hv.sao_thang_da_cap ? "Đã cộng vào ví." : "Chưa cấp."} Hết hạn cuối tháng, không cộng dồn.</p>
        </div>
        <div className="rounded-xl border border-line/60 p-3">
          <p className="flex items-center gap-1.5 font-serif text-2xl text-fg"><MessageCircleQuestion className="size-4 text-gold" aria-hidden /> <span data-testid="hoi-vien-cau-hoi">{hv.cau_hoi_con}</span></p>
          <p className="text-fg-muted">Câu hỏi chuyên gia còn</p>
          <p className="text-xs text-fg-faint">Trên {hv.cau_hoi_nam} câu mỗi năm hội viên.</p>
        </div>
      </div>
      <p className="text-xs text-fg-faint">Mọi chương Luận giải toàn bộ (Tử vi · Bát tự · Bản đồ con số) đang mở cho bạn, không trừ Sao. Mua một lần, không tự gia hạn.</p>
      {nhac && (
        <div className="flex flex-col gap-3 rounded-xl border border-line/60 p-3 sm:flex-row sm:items-center" data-testid="hoi-vien-nhac-gia-han">
          <CalendarClock className="size-5 shrink-0 text-gold" aria-hidden />
          <p className="flex-1 text-sm text-fg-muted">{nhac}</p>
          <Button asChild size="sm" variant="secondary"><Link href="/hoi-vien">Gia hạn</Link></Button>
        </div>
      )}
    </Card>
  );
}
