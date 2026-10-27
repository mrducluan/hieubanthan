"use client";
// "Sao vừa về" — khép vòng MỜI: người mời quay lại site sau khi bạn bè nhận lời mời (moi_ban) hoặc nạp Sao (hoa_hong)
// thì thấy một dòng báo + "Mời thêm". Đồng thời là nơi ghi credit_earned{kind=moi_ban|hoa_hong} cho phễu thẻ
// (lib/pheu-the.ts) — thưởng cộng ở máy chủ khi NGƯỜI ĐƯỢC MỜI lưu hồ sơ, nên máy người mời chỉ biết khi đọc sổ Sao.
// Đọc sổ của chính mình (RLS), tối đa 5 phút/lần mỗi phiên; mốc "đã báo" = id dòng sổ lớn nhất, lưu trên máy theo tài khoản.
// Không nói bạn nào (SAO-V: người mời chỉ thấy ngày + số Sao).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, UserPlus, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { loiThuongVe } from "@/lib/loi-sao";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";

const CACH = 5 * 60_000;
const KHOA_LUC = "hbt.thuong_ve.luc";

export function ThuongVe() {
  const [cau, setCau] = useState<string | null>(null);

  useEffect(() => {
    if (!coTaiKhoan()) return;
    let huy = false;
    void (async () => {
      const sb = await supabase();
      const uid = (await sb?.auth.getSession())?.data.session?.user.id;
      if (!sb || !uid) return;
      // Giãn cách chỉ tính khi ĐÃ đăng nhập (trang đăng nhập không được "tiêu" lượt đọc của 5 phút sau đó).
      try {
        const luc = Number(sessionStorage.getItem(KHOA_LUC) ?? 0);
        if (Date.now() - luc < CACH) return;
        sessionStorage.setItem(KHOA_LUC, String(Date.now()));
      } catch { /* riêng tư: vẫn đọc */ }
      const { data, error } = await sb.from("so_cai_sao").select("id,so_luong,loai,tao_luc").in("loai", ["moi_ban", "hoa_hong"])
        .gt("so_luong", 0).order("id", { ascending: false }).limit(20);
      if (huy || error || !data) return;
      const khoa = `hbt.thuong_ve.${uid}`;
      const ds = data as { id: number; so_luong: number; loai: string; tao_luc: string }[];
      const lonNhat = ds.reduce((m, x) => Math.max(m, x.id), 0);
      let moc: number | null = null;
      try { const v = localStorage.getItem(khoa); moc = v === null ? null : Number(v); } catch { return; }
      try { localStorage.setItem(khoa, String(Math.max(lonNhat, moc ?? 0))); } catch { /* bỏ qua */ }
      // Lần đầu trên máy này: chỉ báo dòng trong 3 ngày qua (bạn bè vừa nhận lời mời trước khi máy này có mốc), dòng cũ hơn bỏ qua.
      const tu = Date.now() - 3 * 86_400_000;
      const moi = ds.filter((x) => (moc === null ? Date.parse(x.tao_luc) >= tu : x.id > moc)).reverse();
      if (!moi.length) return;
      for (const x of moi) ghi("credit_earned", { kind: x.loai, so_sao: x.so_luong });
      setCau(loiThuongVe(moi.map((x) => ({ loai: x.loai, so: x.so_luong }))));
    })().catch(() => { /* im lặng */ });
    return () => { huy = true; };
  }, []);

  if (!cau) return null;
  return (
    <div role="status" data-testid="thuong-ve"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-gold/50 bg-surface/95 p-4 shadow-card backdrop-blur-md md:bottom-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold"><Sparkles className="size-5" aria-hidden /></span>
        <p className="flex-1 text-sm text-fg">{cau}</p>
        <button type="button" aria-label="Đóng" onClick={() => setCau(null)} className="-m-1 p-1 text-fg-muted hover:text-fg"><X className="size-4" aria-hidden /></button>
      </div>
      <div className="mt-3 flex gap-2 pl-12 text-sm">
        <Link href="/hop-doi" onClick={() => { ghi("sao_cta_clicked", { tu: "thuong_ve" }); setCau(null); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 font-medium text-bg" data-testid="thuong-ve-moi">
          <UserPlus className="size-4" aria-hidden /> Mời thêm</Link>
        <Link href="/tai-khoan" onClick={() => setCau(null)} className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-fg-muted hover:text-fg">Xem ví</Link>
      </div>
    </div>
  );
}
