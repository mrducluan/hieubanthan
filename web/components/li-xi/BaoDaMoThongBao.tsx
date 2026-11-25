"use client";
// LX-2027 — "Bao của bạn đã được mở": người TẶNG quay lại site (bất kỳ trang nào, đã đăng nhập) thì thấy một thẻ báo + pháo hoa nhỏ
// khi có người vừa mở bao lì xì họ tặng, kèm "Gửi thêm bao". Khép vòng MỜI của lì xì (người tặng được kéo quay lại và tặng tiếp).
// Chỉ biết "đã có người mở + lúc nào" (ds_li_xi_cua_toi) — KHÔNG biết người nhận là ai. Mốc "đã báo" lưu trên máy theo tài khoản.
// Giãn cách 20 phút/lần đọc, chỉ tới hết hạn nhận bao (31/03/2027); migration 0042 chưa chạy → im lặng.
import { useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { useReducedMotion } from "motion/react";
import { Gift, PartyPopper, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { choRanh } from "@/lib/cho-ranh";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";
import dynamic from "next/dynamic";

// Pháo hoa chỉ tải khi thật sự có bao vừa được mở (thẻ này nằm ở layout gốc, không được làm nặng mọi trang).
const PhaoHoaCanvas = dynamic(() => import("./PhaoHoaCanvas").then((m) => m.PhaoHoaCanvas), { ssr: false });

const CACH = 20 * 60_000;
const KHOA_LUC = "hbt.lx_da_mo.luc";
const HET_HAN = Date.parse("2027-04-01T00:00:00+07:00");
const BANG_MAU = ["#f7cf68", "#fda4af", "#fde047", "#fff7d6", "#f97316"];

interface MoMoi { so: number; luc: string | null }

export function BaoDaMoThongBao() {
  const giam = useReducedMotion();
  const [moi, setMoi] = useState<MoMoi | null>(null);
  const neo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coTaiKhoan() || Date.now() > HET_HAN) return;
    try {
      const coPhien = /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)
        || Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
      if (!coPhien) return;
    } catch { /* storage bị chặn: cứ kiểm tra */ }
    let huy = false;
    void (async () => {
      await choRanh();
      if (huy) return;
      try {
        if (Date.now() - Number(sessionStorage.getItem(KHOA_LUC) ?? 0) < CACH) return;
        sessionStorage.setItem(KHOA_LUC, String(Date.now()));
      } catch { /* riêng tư: vẫn đọc */ }
      const sb = await supabase();
      const uid = (await sb?.auth.getSession())?.data.session?.user.id;
      if (!sb || !uid) return;
      const { data, error } = await sb.rpc("ds_li_xi_cua_toi");
      if (huy || error || !data) return;
      const ds = ((data as { da_tang?: { ma: string; trang_thai?: string; nhan_luc?: string | null }[] }).da_tang ?? [])
        .filter((b) => b.trang_thai === "da_nhan");
      if (!ds.length) return;
      const khoa = `hbt.lx_da_mo.${uid}`;
      let da: string[] | null = null;
      try { const v = localStorage.getItem(khoa); da = v ? (JSON.parse(v) as string[]) : null; } catch { return; }
      try { localStorage.setItem(khoa, JSON.stringify(ds.map((b) => b.ma))); } catch { /* bỏ qua */ }
      // Lần đầu trên máy này: chỉ báo bao được mở trong 7 ngày qua (cũ hơn thì người tặng đã biết rồi).
      const tu = Date.now() - 7 * 86_400_000;
      const chuaBao = ds.filter((b) => (da ? !da.includes(b.ma) : Date.parse(b.nhan_luc ?? "") >= tu));
      if (!chuaBao.length) return;
      const muoiMoi = chuaBao.map((b) => b.nhan_luc ?? "").sort().pop() ?? null;
      ghi("gift_opened", { so_bao: chuaBao.length, nguon: "nguoi_tang_quay_lai" });
      setMoi({ so: chuaBao.length, luc: muoiMoi });
    })().catch(() => { /* im lặng */ });
    return () => { huy = true; };
  }, []);

  if (!moi) return null;
  const luc = moi.luc ? new Date(moi.luc).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : null;
  return (
    <>
    {/* Canvas đứng ngoài thẻ: thẻ có backdrop-filter nên nếu lồng vào, "fixed" sẽ bị nhốt trong khung thẻ. */}
    {!giam && <PhaoHoaCanvas kich={1} neo={neo} bangMau={BANG_MAU} chamDeBan={false} />}
    <div ref={neo} role="status" data-testid="lx-bao-da-mo"
      className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md rounded-2xl border border-gold/60 bg-surface/95 p-4 shadow-card backdrop-blur-md">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold"><PartyPopper className="size-5" aria-hidden /></span>
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-medium text-fg">
            {moi.so === 1 ? "Bao lì xì bạn tặng vừa được mở!" : `${moi.so} bao lì xì bạn tặng vừa được mở!`}
          </p>
          <p className="text-xs text-fg-muted">
            Có người đã mở và đọc báo cáo năm 2027 của họ{luc ? ` (lúc ${luc})` : ""}. Chúng tôi không cho biết đó là ai, đúng như bạn mong muốn.
          </p>
        </div>
        <button type="button" aria-label="Đóng" onClick={() => setMoi(null)} className="-m-1 p-1 text-fg-muted hover:text-fg"><X className="size-4" aria-hidden /></button>
      </div>
      <div className="mt-3 flex gap-2 pl-12 text-sm">
        <Link href="/li-xi-tet-2027" onClick={() => { ghi("cross_cta_clicked", { tu: "bao_da_mo", den: "li_xi_tet_2027" }); setMoi(null); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 font-medium text-bg" data-testid="lx-bao-da-mo-tang-them">
          <Gift className="size-4" aria-hidden /> Gửi thêm một bao</Link>
        <Link href="/li-xi-tet-2027#bao-da-tao" onClick={() => setMoi(null)} className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-fg-muted hover:text-fg">Xem các bao</Link>
      </div>
    </div>
    </>
  );
}
