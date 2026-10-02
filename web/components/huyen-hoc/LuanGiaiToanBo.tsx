"use client";
// LG — "Luận giải toàn bộ": báo cáo theo chương do engine ghép từ kho tri thức (cùng bộ lọc an toàn
// như hỏi đáp). Miễn phí trong 2 tháng thử nghiệm (chủ dự án chốt 2026-10-01). Không lưu ở máy chủ.
import { useState } from "react";
import { BookOpenText, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";

interface BaoCao {
  mo_dun: string;
  chuong: { ma: string; tieu_de: string; doan: string[]; van_ai?: string; che_do?: string }[];
  ket: string;
  dien_dat?: "ai" | "tron" | "mau";
  trang_thai: string;
  phi: { sao: number; ly_do: string };
}

export function LuanGiaiToanBo({ duongDan, laSo, ten }: { duongDan: string; laSo: unknown; ten: string }) {
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [goc, setGoc] = useState(false);
  const tai = async () => {
    setDang(true); setLoi(null);
    try {
      const d = await postJson<BaoCao>(duongDan, { la_so: laSo });
      setBc(d);
      ghi("reading_completed", { mo_dun: d.mo_dun, kind: "luan_giai_toan_bo" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tải được luận giải."); }
    finally { setDang(false); }
  };

  if (!bc) {
    return (
      <div className="glass flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <BookOpenText className="size-7 shrink-0 text-gold" aria-hidden />
        <div className="flex-1">
          <p className="font-serif text-xl">Luận giải toàn bộ {ten}</p>
          <p className="text-sm text-fg-muted">Báo cáo theo chương, ghép từ kho tri thức có nguồn. Miễn phí trong giai đoạn thử nghiệm · không lưu trên máy chủ.</p>
        </div>
        <Button onClick={tai} disabled={dang}><Sparkles aria-hidden /> {dang ? "Đang soạn…" : "Xem luận giải"}</Button>
        {dang && <div className="w-full"><KhungTai dong={3} /></div>}
        {loi && <div className="w-full"><BaoLoi loi={loi} thuLai={tai} /></div>}
      </div>
    );
  }
  return (
    <article className="glass rounded-2xl p-5 sm:p-8 print:bg-white print:text-black" data-testid="luan-giai-toan-bo">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Luận giải toàn bộ · bản nháp đang được chuyên gia duyệt dần</p>
          {bc.dien_dat && bc.dien_dat !== "mau" && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="dien-dat-ai">
              AI diễn đạt lại từ dữ liệu đã tính · mỗi chương đã kiểm: không thêm sao, cung, con số hay lời phán ngoài dữ liệu
              {bc.dien_dat === "tron" && " (chương nào không đạt kiểm tra giữ bản gốc)"}.
            </p>
          )}
          <h2 className="mt-1 text-3xl">Luận giải {ten}</h2>
        </div>
        <div className="flex gap-2 print:hidden">
          {bc.chuong.some((c) => c.van_ai) && (
            <Button variant="ghost" size="sm" aria-pressed={goc} onClick={() => setGoc((v) => !v)}>
              {goc ? "Xem bản AI diễn đạt" : "Xem bản dữ liệu gốc"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>
        </div>
      </header>
      <nav aria-label="Mục lục" className="mt-4 print:hidden">
        <ol className="flex flex-wrap gap-2 text-sm">
          {bc.chuong.map((c, i) => (
            <li key={c.ma}><a href={`#lg-${c.ma}`} className="rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">{i + 1}. {c.tieu_de}</a></li>
          ))}
        </ol>
      </nav>
      <div className="mt-6 space-y-8">
        {bc.chuong.map((c, i) => (
          <section key={c.ma} id={`lg-${c.ma}`} className="scroll-mt-24">
            <h3 className="font-serif text-2xl"><span className="text-gold">{i + 1}.</span> {c.tieu_de}</h3>
            <div className="prose-vn mt-3 space-y-3 text-[0.97rem] leading-relaxed text-fg-muted">
              {c.van_ai && !goc
                ? c.van_ai.split(/\n\s*\n/).map((d, k) => <p key={k}>{d}</p>)
                : c.doan.map((d, k) => <p key={k} className={d.startsWith("Câu hỏi để tự soi") ? "rounded-xl bg-moon/10 px-4 py-2 text-moon" : ""}>{d}</p>)}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
    </article>
  );
}
