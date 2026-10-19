"use client";
// TS-NOIDAU — "Bạn đang vướng ở đâu?": 5 trụ đời × câu hỏi nỗi đau (KB engine `thanso_noi_dau.json`). Mỗi câu kèm những
// con số CỦA BẠN trả lời nó (lớp ĐÃ TÍNH, engine tính — web chỉ hiển thị); bấm "Hỏi câu này" gửi nguyên văn câu
// chuẩn sang khung hỏi đáp bên dưới. Đo lường chỉ mã câu + mã trụ.
import { useEffect, useState } from "react";
import { Briefcase, CalendarClock, Heart, MessageCircleQuestion, Sparkles, User, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

interface SoTraLoi { ma: string; ten: string; gia_tri: number | number[] | null }
interface CauNoiDau { ma: string; noi_dau: string; cau: string; so: SoTraLoi[] }
interface Tru { ma: string; ten: string; mo_ta: string; bieu_tuong: string; cau_hoi: CauNoiDau[] }
interface BanDo { tru: Tru[]; luu_y: string; trang_thai: string }

const BIEU_TUONG: Record<string, LucideIcon> = { Briefcase, Heart, User, CalendarClock, Sparkles };
const boNho = new Map<string, BanDo>();

/** Giá trị chỉ số để hiển thị: danh sách rỗng = "không có", null = cần họ tên đầy đủ. */
export function hienGiaTri(v: SoTraLoi["gia_tri"]): string {
  if (v === null) return "cần họ tên";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "không có";
  return String(v);
}

export function NoiDau({ hoSo, onHoi }: { hoSo: HoSo; onHoi: (cau: string) => void }) {
  const khoa = JSON.stringify([hoTenList(hoSo), hoSo.ngay, hoSo.thang, hoSo.nam]);
  const [bd, setBd] = useState<BanDo | null>(boNho.get(khoa) ?? null);
  const [chon, setChon] = useState(0);
  useEffect(() => {
    if (boNho.has(khoa)) { setBd(boNho.get(khoa)!); return; }
    let huy = false;
    fetch("/api/thanso/noi-dau", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam }),
    }).then((r) => (r.ok ? (r.json() as Promise<BanDo>) : null))
      .then((d) => { if (d) { boNho.set(khoa, d); if (!huy) setBd(d); } })
      .catch(() => { /* bảng gợi ý là phần phụ: lỗi thì ẩn, khung hỏi đáp vẫn dùng được */ });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho hoSo
  }, [khoa]);
  const tru = bd?.tru[chon] ?? bd?.tru[0];
  if (!bd || !tru) return null;

  return (
    <section aria-labelledby="noi-dau" data-testid="noi-dau">
      <TieuDeMuc id="noi-dau" nho="Bạn đang vướng ở đâu?" lon="Chọn điều đang làm bạn băn khoăn"
        mo_ta="Mỗi câu hỏi đi kèm những con số của chính bạn dùng để trả lời. Bấm “Hỏi câu này” để xem lời giải ngay bên dưới." />
      <div role="tablist" aria-label="Năm trụ đời" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {bd.tru.map((t, i) => {
          const Icon = BIEU_TUONG[t.bieu_tuong] ?? Sparkles;
          return (
            <button key={t.ma} type="button" role="tab" aria-selected={i === chon} onClick={() => setChon(i)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                i === chon ? "border-gold bg-gold/15 text-gold" : "border-line/70 text-fg-muted hover:text-fg")}>
              <Icon className="size-4" aria-hidden /> {t.ten}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-fg-muted">{tru.mo_ta}</p>
      <div role="tabpanel" aria-label={tru.ten} className="mt-4 grid gap-3 md:grid-cols-2">
        {tru.cau_hoi.map((q) => (
          <article key={q.ma} data-testid={`noi-dau-${q.ma}`} className="flex flex-col rounded-xl border border-line/70 bg-bg/40 p-4">
            <h3 className="text-base">“{q.noi_dau}”</h3>
            <p className="mt-1 text-sm text-fg-muted">{q.cau}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Con số của bạn trả lời câu này">
              {q.so.map((s) => (
                <li key={s.ma} className="rounded-full bg-gold/10 px-2 py-0.5 text-xs">
                  {s.ten} <b className="text-gold">{hienGiaTri(s.gia_tri)}</b>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" className="mt-3 self-start"
              onClick={() => { ghi("pain_point_clicked", { mo_dun: "thanso", tru: tru.ma, ma_cau: q.ma, nguon: "bang" }); onHoi(q.cau); }}>
              <MessageCircleQuestion aria-hidden /> Hỏi câu này
            </Button>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-fg-faint">{bd.luu_y}</p>
    </section>
  );
}
