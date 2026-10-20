"use client";
// TV-V2 — "3 tháng tới": engine ghép lưu nguyệt + tứ hoá lưu niên thành mức thuận / bình / cần thận trọng, kèm lý do,
// gợi ý và câu tự soi. Web chỉ hiển thị. Màu dịu, không biểu tượng cảnh báo — đây là nhịp để tự soi, không phải lời phán.
import { CalendarClock, MessageCircleQuestion, MousePointerClick } from "lucide-react";
import type { ChartInputVao, Nhip3ThangOutputT } from "@/app/api/tuvi/schema";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { MAU_HOA_DIU } from "@/components/huyen-hoc/PhiHoa";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { Button } from "@/components/ui/button";
import { usePost } from "@/lib/goi-api";
import { maNhip } from "@/lib/kiem-chung";
import { cn } from "@/lib/utils";

const MAU_MUC: Record<Nhip3ThangOutputT["thang"][number]["muc"], { vien: string; cham: string; chu: string }> = {
  thuan: { vien: "border-jade/40 bg-jade/5", cham: "bg-jade", chu: "text-jade" },
  binh: { vien: "border-gold/30 bg-gold/5", cham: "bg-gold", chu: "text-gold" },
  can_than: { vien: "border-moon/40 bg-moon/5", cham: "bg-moon", chu: "text-moon" },
};

const ngan = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };

export function NhipBaThang({ laSo, onChonCungTen, onHoi }: {
  laSo: ChartInputVao; onChonCungTen: (tenCung: string) => void; onHoi: (cau: string) => void;
}) {
  const { data: d, loi, thuLai } = usePost<Nhip3ThangOutputT>("/api/tuvi/nhip-3-thang", { la_so: laSo });
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!d) return <KhungTai dong={3} />;
  return <NhipBaThangXem d={d} onChonCungTen={onChonCungTen} onHoi={onHoi} />;
}

export function NhipBaThangXem({ d, onChonCungTen, onHoi }: { d: Nhip3ThangOutputT; onChonCungTen: (tenCung: string) => void; onHoi: (cau: string) => void }) {
  const luuY = Array.isArray(d.luu_y) ? d.luu_y.join(" ") : d.luu_y;
  const tuHoaNam = (n: Nhip3ThangOutputT["luu_nien"]) =>
    `Năm ${n.can_chi}: tứ hoá của năm ${n.tu_hoa.map((h) => `${h.hoa} ${h.sao}${h.cung_goc ? ` (${h.cung_goc})` : ""}`).join(" · ")}.`;
  return (
    <div className="space-y-4" data-testid="nhip-3-thang-noi-dung">
      <p className="text-sm text-fg-muted">
        {tuHoaNam(d.luu_nien)}
        {d.luu_nien_sau && <> Sang năm âm mới — {tuHoaNam(d.luu_nien_sau)}</>}
        {" "}Mỗi tháng đọc cùng tứ hoá của tháng đó và của năm âm chứa tháng đó.
      </p>
      <ol className="grid gap-3 md:grid-cols-3" aria-label="Ba tháng âm lịch tới">
        {d.thang.map((t) => {
          const mau = MAU_MUC[t.muc];
          return (
            <li key={`${t.thang}-${t.nhuan}-${t.phan}`} className={cn("flex flex-col gap-2 rounded-2xl border p-4", mau.vien)} data-testid="the-thang">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <p className="font-serif text-lg text-fg">
                  <CalendarClock className="mr-1.5 inline size-4 text-fg-muted" aria-hidden />
                  Tháng {t.thang}{t.nhuan ? " nhuận" : ""} <span className="text-sm text-fg-faint">· {t.can_chi}</span>
                </p>
                <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-sm font-medium", mau.chu)}>
                  <span className={cn("size-2 rounded-full", mau.cham)} aria-hidden />{t.nhan_muc}
                </span>
              </div>
              <p className="text-xs text-fg-faint">{ngan(t.tu)}–{ngan(t.den)}/{t.den.slice(0, 4)} · cung tháng: <b className="text-fg-muted">{t.cung_goc}</b></p>
              {t.chu_de && <p className="text-sm text-fg-muted">{t.chu_de}</p>}
              {t.ly_do.length > 0 && (
                <div>
                  <NhanLop lop="tinh" />
                  <ul className="mt-1 space-y-1 text-sm text-fg-muted">
                    {t.ly_do.map((l) => <li key={l.ma + l.noi_dung} className="leading-snug">· {l.noi_dung}</li>)}
                  </ul>
                </div>
              )}
              {t.tu_hoa_thang.length > 0 && (
                <ul className="flex flex-wrap gap-1" aria-label="Tứ hoá theo can tháng">
                  {t.tu_hoa_thang.map((h) => (
                    <li key={h.hoa} className={cn("rounded-md px-2 py-0.5 text-[11px]", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>
                      {h.hoa} {h.sao}{h.cung_goc ? ` · ${h.cung_goc}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {t.goi_y && <p className="text-sm"><NhanLop lop="giai" /> <span className="ml-1 text-fg">{t.goi_y}</span></p>}
              {t.cau_tu_soi && <p className="text-sm text-moon"><NhanLop lop="soi" /> <span className="ml-1">{t.cau_tu_soi}</span></p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => onChonCungTen(t.cung_goc)}>
                  <MousePointerClick aria-hidden /> Xem cung tháng
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onHoi(`Tháng ${t.thang}${t.nhuan ? " nhuận" : ""} âm năm ${t.nam_am} của tôi thế nào?`)}>
                  <MessageCircleQuestion aria-hidden /> Hỏi thêm
                </Button>
              </div>
              {/* Chỉ tháng đã bắt đầu (hiện tại / đã qua) mới hỏi kiểm chứng — tháng chưa tới thì chưa ai biết đúng hay không. */}
              {t.tu <= d.ngay_xem && (
                <KiemChung loai="nhip_3_thang" mau={maNhip(t)} phai={d.phai_luu_nguyet} khoa={`${t.nam_am}-${t.thang}-${t.nhuan ? 1 : 0}-${t.phan}`}
                  cauHoi="Tháng này có đúng nhịp với bạn?" />
              )}
            </li>
          );
        })}
      </ol>
      {(d.uu_tien?.ghi_chu || luuY) && (
        <p className="text-xs text-fg-faint" data-testid="nhip-3-thang-uu-tien">
          {d.uu_tien?.ghi_chu && <>Thứ tự ưu tiên: {d.uu_tien.ghi_chu} </>}{luuY}
        </p>
      )}
    </div>
  );
}
