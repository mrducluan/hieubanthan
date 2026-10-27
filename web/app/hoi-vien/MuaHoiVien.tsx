"use client";
// Hai thẻ hạng hội viên (SAO-HV hai hạng, chủ dự án chốt phương án a — docs/SO-SANH-GIA-HOI-VIEN.md). Hỏi máy chủ trạng thái
// của chính mình MỘT lần (hoi_vien_cua_toi qua /api/thanh-toan/goi kèm access token) rồi mỗi thẻ tự chọn nút:
//   chưa đăng nhập → đăng nhập rồi quay lại · chưa là hội viên → Mua · cùng hạng còn ≤ 30 ngày → Gia hạn · cùng hạng còn
//   dài → "Đang dùng" · đang thường xem thẻ Chuyên gia → Nâng hạng (giá do SQL tính, đã trừ phần còn lại) · đang Chuyên gia
//   xem thẻ thường → không nút (hạ hạng khi hết hạn). Tạo đơn: POST /api/thanh-toan/tao-don {loai: "hoi_vien", hang}.
// Không đếm ngược, không "ưu đãi", không gạch giá, không nhãn "phổ biến" — nhãn thẻ Chuyên gia nói đúng điều khác biệt.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, MessageCircleQuestion, QrCode, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { QUAY_VE } from "@/lib/sao-client";
import { docHoiVien, giaMoiThang, ngayVn, TEN_HANG, thuocTinhHoiVien, vnd, type HangHoiVien, type HoiVien } from "@/lib/thanh-toan/hoi-vien";

export interface HangBan { hang: HangHoiVien; bat: boolean; gia: number; cauHoi: number; hanGio: number | null }

export function ChonHangHoiVien({ cong, hang: ds, hanChung }: { cong: "payos" | "gia"; hang: HangBan[]; hanChung: number }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [hv, setHv] = useState<HoiVien | null | undefined>(undefined);
  const [dang, setDang] = useState<HangHoiVien | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghi("checkout_viewed", { kind: "hoi_vien", nguon: "mo" });
    void supabase().then(async (sb) => {
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      const tk = data.session?.access_token ?? null;
      setToken(tk);
      if (!tk) { setHv(null); return; }
      fetch("/api/thanh-toan/goi", { headers: { authorization: `Bearer ${tk}` }, cache: "no-store" })
        .then((r) => r.json()).then((d: { hoi_vien?: unknown }) => setHv(docHoiVien(d.hoi_vien)))
        .catch(() => setHv(null));
    });
  }, []);

  async function mua(h: HangHoiVien, giaHan: boolean, nang: boolean) {
    if (!token) return;
    setDang(h); setLoi(null);
    ghi("checkout_started", thuocTinhHoiVien(giaHan, h, nang));
    try {
      try { sessionStorage.setItem(QUAY_VE, "/tai-khoan#hoi-vien"); } catch { /* riêng tư */ }
      const r = await fetch("/api/thanh-toan/tao-don", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ loai: "hoi_vien", hang: h }),
      });
      const j = (await r.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!r.ok || !j.checkoutUrl) throw new Error(j.error ?? "Chưa tạo được đơn.");
      window.location.href = j.checkoutUrl;
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được đơn.");
      setDang(null);
    }
  }

  const dangLa = hv?.dang_la ? hv : null;
  const dangKiem = token === undefined || (token !== null && hv === undefined);
  const banCg = ds.find((x) => x.hang === "chuyen_gia");

  return (
    <div className="space-y-4">
      {dangLa && (
        <p className="flex items-start gap-2 rounded-xl border border-jade/40 bg-jade/10 p-3 text-sm text-jade" data-testid="hoi-vien-dang-la">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Bạn đang là hội viên tới {ngayVn(dangLa.den_ngay)} · {TEN_HANG[dangLa.hang ?? "thuong"]}.
            {dangLa.gia_han_duoc ? " Gia hạn được từ bây giờ, nối tiếp hạn hiện tại." : " Gia hạn mở khi còn 30 ngày trở xuống."}</span>
        </p>
      )}
      <div className={`grid gap-4 ${ds.filter((x) => x.bat).length > 1 ? "md:grid-cols-2" : ""}`}>
        {ds.filter((x) => x.bat).map((g) => {
          const cg = g.hang === "chuyen_gia";
          const sfx = cg ? "-cg" : "";
          const cungHang = dangLa?.hang === g.hang;
          const giaHan = Boolean(cungHang && dangLa?.gia_han_duoc);
          const nang = Boolean(cg && dangLa?.hang === "thuong" && dangLa.nang_hang_duoc && dangLa.gia_nang_hang != null);
          const giaHienThi = nang ? dangLa!.gia_nang_hang! : g.gia;
          return (
            <section key={g.hang} aria-labelledby={`hang-${g.hang}`} data-testid={`hang-${g.hang}`}
              className={`glass flex flex-col rounded-2xl p-6 ${cg ? "border border-gold/50 shadow-[0_0_40px_-12px] shadow-gold/30" : ""}`}>
              {cg && <p className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/50 px-2.5 py-0.5 text-xs font-medium text-gold">
                <UserRound className="size-3.5" aria-hidden /> Có chuyên gia trả lời</p>}
              <h2 id={`hang-${g.hang}`} className="font-serif text-2xl">{TEN_HANG[g.hang]}</h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className="font-serif text-4xl text-gold" data-testid={`gia-hoi-vien${sfx}`}>{vnd(g.gia)}</span>
                <span className="text-sm text-fg-muted">/ 365 ngày</span>
              </p>
              <p className="mt-1 text-xs text-fg-faint">Khoảng {vnd(giaMoiThang(g.gia))} mỗi tháng — quy đổi để so sánh, không bán theo tháng.</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex gap-2"><MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  <span><b className="text-fg">{g.cauHoi} câu hỏi chuyên gia</b> mỗi năm</span></li>
                <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  <span>{g.hanGio ? <><b className="text-fg">Trả lời trong {g.hanGio} giờ</b> — cả câu bạn mua thêm</> : <>Trả lời trong {hanChung} giờ như mọi người</>}</span></li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  <span>Mọi chương Luận giải + Sao tặng mỗi tháng (như phần chung)</span></li>
              </ul>
              <div className="mt-auto space-y-2 pt-5">
                {nang && <p className="text-xs text-fg-muted" data-testid="nang-hang-giai-thich">
                  Phần còn lại của gói hiện tại đã trừ vào giá. Bạn nhận kỳ mới 365 ngày từ hôm nay; câu hỏi đã dùng được tính vào hạng mới.</p>}
                {dangKiem ? (
                  <Button disabled className="w-full"><Loader2 className="animate-spin" aria-hidden /> Đang kiểm tra</Button>
                ) : token === null ? (
                  <Button asChild className="w-full" variant={cg ? "primary" : "secondary"} data-testid={`hoi-vien-dang-nhap${sfx}`}>
                    <Link href="/dang-nhap?tiep=/hoi-vien">Đăng nhập để mua</Link></Button>
                ) : cungHang && !giaHan ? (
                  <p className="rounded-xl border border-line/60 p-3 text-center text-sm text-fg-muted">Bạn đang dùng hạng này</p>
                ) : dangLa && !cungHang && !nang ? (
                  <p className="rounded-xl border border-line/60 p-3 text-center text-sm text-fg-muted">
                    {cg ? "Hạng Chuyên gia chưa nâng được lúc này." : "Bạn đang ở hạng cao hơn — chuyển hạng khi hết hạn."}</p>
                ) : (
                  <Button className="w-full" onClick={() => void mua(g.hang, giaHan, nang)} disabled={dang !== null}
                    data-testid={nang ? "nut-nang-hang" : `nut-mua-hoi-vien${sfx}`}>
                    {dang === g.hang ? <Loader2 className="animate-spin" aria-hidden /> : <QrCode aria-hidden />}
                    {nang ? `Nâng hạng · ${vnd(giaHienThi)}` : giaHan ? `Gia hạn · ${vnd(g.gia)}` : `Mua · ${vnd(g.gia)}`}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {banCg && !banCg.bat && (
        <p className="text-sm text-fg-faint" data-testid="hang-cg-sap-mo">Hạng Chuyên gia (nhiều câu hỏi hơn, trả lời ưu tiên) sắp mở.</p>
      )}
      <p className="text-xs text-fg-faint">Quét QR bằng app ngân hàng hoặc ví bất kỳ có VietQR. Kích hoạt trong vài giây sau khi tiền về, rồi bạn về thẻ hội viên ở Tài khoản.</p>
      {cong === "gia" && <p className="text-xs text-fg-faint">Đang chạy cổng THỬ: không thu tiền thật.</p>}
      {loi && <p role="alert" className="text-sm text-red-300">{loi}</p>}
    </div>
  );
}
