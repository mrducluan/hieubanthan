"use client";
// SAO-HH — "Hẹn với chính mình" (thay cược chuỗi, docs/CO-CHE-RUI-RO-VA-THAY-THE.md §2): người dùng tự đặt mục tiêu
// 7 hoặc 30 ngày ghé (một lúc một hẹn, lưu máy hbt.hen.v1); tiến độ lấy từ chuỗi (máy chủ khi đăng nhập, máy khi khách);
// đạt → huy hiệu máy hen_7 / hen_30 + câu chúc + chia sẻ (thẻ ngày sẵn có). KHÔNG có gì để mất: lỡ → "Hẹn lại từ hôm nay".
// Không Sao, không đếm ngược, không doạ.
// Trục 2 UX (2026-10-26): nút chọn cao ≥ 40px; đang hẹn thì luôn có một dòng nói hẹn để làm gì (huy hiệu) + "Đổi" / "Huỷ hẹn";
// vừa đặt xong thì dòng đó mở đầu bằng "Đã hẹn N ngày" (phản hồi tức thì, không cần cuộn).
import { useEffect, useState } from "react";
import { Check, HeartHandshake, RotateCcw, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { capHuyHieuMay, DANH_MUC, docHen, ghiHen, tienDoHen, type HenChinhMinh as Hen } from "@/lib/huy-hieu";
import { maMoiNgay, taoLinkNgay } from "@/components/chia-se/NutChiaSeNgay";

export function HenChinhMinh({ chuoi, ngay, nguon, hoSo, tieuDe }: { chuoi: number; ngay: string; nguon: "tai_khoan" | "may"; hoSo: HoSo; tieuDe: string }) {
  const [hen, setHen] = useState<Hen | null | undefined>(undefined);   // undefined = chưa đọc máy
  const [daChep, setDaChep] = useState(false);
  const [vuaDat, setVuaDat] = useState(false);
  const [vuaHen, setVuaHen] = useState(false);
  const [dangDoi, setDangDoi] = useState(false);

  useEffect(() => { setHen(docHen()); }, []);
  // Đạt mục tiêu → ghi ngày đạt + cấp huy hiệu máy (một lần), đo chỉ số ngày mục tiêu.
  useEffect(() => {
    if (!hen || hen.dat_luc) return;
    const td = tienDoHen(hen, chuoi);
    if (!td.dat) {
      // Ghi lại tiến độ vừa tính (đúng nguồn chuỗi) để trang Bản thân hiện "x/7" trên huy hiệu mà không tự tính lại.
      if (!td.lo && (hen.tien_do !== td.ngay || hen.tien_do_luc !== ngay)) ghiHen({ ...hen, tien_do: td.ngay, tien_do_luc: ngay });
      return;
    }
    const moi = { ...hen, dat_luc: ngay };
    ghiHen(moi); setHen(moi); setVuaDat(true);
    ghi("self_goal_reached", { ngay: hen.muc });
    const ma = hen.muc === 7 ? "hen_7" : "hen_30";
    if (capHuyHieuMay(ma, ngay)) ghi("badge_earned", { ma });
  }, [hen, chuoi, ngay]);
  if (hen === undefined) return null;

  const dat = (muc: 7 | 30) => {
    const h: Hen = { muc, ngay_bd: ngay, chuoi_bd: Math.max(1, chuoi) };
    ghiHen(h); setHen(h); setVuaDat(false); setVuaHen(true); setDangDoi(false);
    ghi("self_goal_set", { ngay: muc });
  };
  const huy = () => { ghiHen(null); setHen(null); setVuaHen(false); setDangDoi(false); };
  const NUT = "vung-cham inline-flex min-h-10 items-center gap-1 rounded-full border border-line px-3.5 py-2 text-[0.8125rem] transition-colors hover:border-gold/60 hover:text-fg";
  async function chiaSe(muc: number) {
    try {
      const tu = maMoiNgay();
      ghi("share_created", { kind: "hen_chinh_minh", ma_moi: tu });
      const { url } = await taoLinkNgay(hoSo, tu);
      const chu = `Mình vừa giữ lời hẹn với chính mình: ${muc} ngày ghé Hôm nay. Còn bạn?`;
      if (typeof navigator.share === "function") {
        try { await navigator.share({ title: "Hẹn với chính mình", text: chu, url }); return; } catch { /* huỷ → chép */ }
      }
      await navigator.clipboard.writeText(`${chu} ${url}`);
      setDaChep(true); setTimeout(() => setDaChep(false), 2500);
    } catch { /* bỏ qua */ }
  }

  if (!hen) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted" data-testid="hen-chinh-minh" data-trang-thai="chua_hen">
        <HeartHandshake className="size-4 text-moon" aria-hidden />
        <span>{tieuDe}:</span>
        <button type="button" onClick={() => dat(7)} className={NUT} data-testid="hen-7">7 ngày ghé</button>
        <button type="button" onClick={() => dat(30)} className={NUT} data-testid="hen-30">30 ngày ghé</button>
      </div>
    );
  }

  const td = tienDoHen(hen, chuoi);
  if (td.dat) {
    const ma = hen.muc === 7 ? "hen_7" : "hen_30";
    return (
      <div className="space-y-2 text-sm" data-testid="hen-chinh-minh" data-trang-thai="dat">
        <p className="inline-flex items-center gap-1.5 text-jade" role={vuaDat ? "status" : undefined}>
          <Check className="size-4" aria-hidden />Bạn đã giữ lời hẹn {hen.muc} ngày với chính mình — huy hiệu “{DANH_MUC[ma].ten}” đã về hồ sơ.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => void chiaSe(hen.muc)} data-testid="hen-chia-se">
            {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép link" : "Chia sẻ"}
          </Button>
          {hen.muc === 7 && <Button size="sm" variant="ghost" onClick={() => dat(30)} data-testid="hen-30">Hẹn tiếp 30 ngày</Button>}
          {hen.muc === 30 && <Button size="sm" variant="ghost" onClick={() => dat(30)} data-testid="hen-lai">Hẹn một vòng 30 ngày nữa</Button>}
        </div>
      </div>
    );
  }
  if (td.lo) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted" data-testid="hen-chinh-minh" data-trang-thai="lo">
        <HeartHandshake className="size-4 text-moon" aria-hidden />
        <span>Lời hẹn {hen.muc} ngày lỡ một nhịp — không sao cả.</span>
        <button type="button" onClick={() => dat(hen.muc)} className={NUT} data-testid="hen-lai">
          <RotateCcw className="size-3" aria-hidden />Hẹn lại từ hôm nay
        </button>
      </div>
    );
  }
  const maHuyHieu = hen.muc === 7 ? "hen_7" : "hen_30";
  return (
    <div className="space-y-2 text-sm text-fg-muted" data-testid="hen-chinh-minh" data-trang-thai="dang_di" data-nguon={nguon}>
      <p className="inline-flex items-center gap-1.5">
        <HeartHandshake className="size-4 text-moon" aria-hidden />
        <span>{tieuDe}: ngày <b className="text-fg" data-testid="hen-tien-do">{td.ngay}</b>/{hen.muc}</span>
      </p>
      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={hen.muc} aria-valuenow={td.ngay} aria-label={`Hẹn ${hen.muc} ngày`}>
        <div className="h-full rounded-full bg-moon transition-[width] duration-500" style={{ width: `${Math.round((td.ngay / hen.muc) * 100)}%` }} />
      </div>
      <p className={vuaHen ? "text-fg" : undefined} role={vuaHen ? "status" : undefined} data-testid="hen-xac-nhan">
        {vuaHen && <><Check className="mr-1 inline size-4 align-[-3px] text-jade" aria-hidden />Đã hẹn {hen.muc} ngày. </>}
        Ghé đủ {hen.muc} ngày liền để nhận huy hiệu “{DANH_MUC[maHuyHieu].ten}”. Lỡ một ngày thì hẹn lại, không mất gì.
      </p>
      {dangDoi ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="hen-doi">
          <span>Đổi sang:</span>
          {([7, 30] as const).filter((m) => m !== hen.muc).map((m) => (
            <button key={m} type="button" onClick={() => dat(m)} className={NUT} data-testid={`hen-${m}`}>{m} ngày ghé</button>
          ))}
          <button type="button" onClick={huy} className={NUT} data-testid="hen-huy"><X className="size-3.5" aria-hidden />Huỷ hẹn</button>
          <button type="button" onClick={() => setDangDoi(false)} className={NUT}>Giữ nguyên</button>
        </div>
      ) : (
        <button type="button" onClick={() => setDangDoi(true)} className={NUT} data-testid="hen-nut-doi" aria-expanded={false}>Đổi hoặc huỷ hẹn</button>
      )}
    </div>
  );
}
