"use client";
// Chân bài blog — CTA ĐỔI THEO MẢNG của bài (lib/blog-mang.ts): bài phong thuỷ mời xem nhà, bài thần số mời xem số…
// Khâu vòng tăng trưởng: THU HÚT → công cụ (người đọc blog từ Google thành người dùng công cụ), đo `cross_cta_viewed` /
// `cross_cta_clicked` với tu="blog" (den = mảng, ca_nhan = có luận giải nhỏ cá nhân hoá).
// Có hồ sơ trên máy → gọi /api/goi-y-cheo (engine ghép "luận giải nhỏ" từ con số đã tính + KB) và hiện câu riêng của mảng
// đó; chưa có → câu chung + 3 điều sẽ nhận. Dưới cùng dùng lại CtaCuoiBai (gợi mở chéo · luận giải/Sao · rủ bạn · ủng hộ).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BieuTuongManh } from "@/components/chia-se/TheBanDo";
import { CtaCuoiBai } from "@/components/khung/CtaCuoiBai";
import { lienKetKienThuc, THONG_TIN_MANG, type MangBlog } from "@/lib/blog-mang";
import { ghi } from "@/lib/do-luong";
import { GoiYCheo, yeuCauGoiY, type TheGoiY } from "@/lib/goi-y-cheo";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { cn } from "@/lib/utils";

function BieuTuong({ mang, className }: { mang: MangBlog; className?: string }) {
  const ma = mang === "tu_vi" ? "sao" : mang === "bat_tu" ? "nhat_chu" : mang === "phong_thuy" ? "phi" : mang === "kinh_dich" ? "que" : "so";
  if (mang === "hop_doi" || mang === "xem_ngay") return <BookOpenText className={className} aria-hidden />;
  return <BieuTuongManh ma={ma} className={className} />;
}

/** Chòm sao mờ góc thẻ — trang trí theo tông "Đêm sao phương Đông". */
function ChomSao() {
  const ds = [[12, 40], [34, 18], [58, 30], [80, 8], [104, 26], [126, 12]];
  return (
    <svg viewBox="0 0 140 50" className="pointer-events-none absolute -right-2 -top-1 h-16 w-44 text-gold/40" aria-hidden>
      <polyline points={ds.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 4" />
      {ds.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 2 ? 1.1 : 1.7} fill="currentColor" />)}
    </svg>
  );
}

/** Luận giải nhỏ cá nhân hoá cho mảng đích (engine), khi có hồ sơ trên máy. */
function useTheRieng(mang: MangBlog): { the: TheGoiY | null; coHoSo: boolean; ten: string | null } {
  const hs = useHoSo();
  const quyUoc = useQuyUocDD();
  const [the, setThe] = useState<TheGoiY | null>(null);
  const dich = THONG_TIN_MANG[mang].mangGoiY;
  useEffect(() => {
    if (!hs) { setThe(null); return; }
    let huy = false;
    // Engine trả thẻ cho MỌI mảng khác "mảng hiện tại" → khai mảng hiện tại là một mảng khác đích để chắc chắn có thẻ đích.
    const hienTai = dich === "hom_nay" ? "than_so" : "hom_nay";
    fetch("/api/goi-y-cheo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(yeuCauGoiY(hienTai, hs, quyUoc)) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        const kq = GoiYCheo.safeParse(d);
        setThe(kq.success ? kq.data.the.find((t) => t.mang === dich) ?? null : null);
      })
      .catch(() => { if (!huy) setThe(null); });
    return () => { huy = true; };
  }, [hs, quyUoc, dich]);
  return { the, coHoSo: Boolean(hs), ten: hs ? tenGoi(hs) : null };
}

export function CtaBlog({ mang, className }: { mang: MangBlog; className?: string }) {
  const tt = THONG_TIN_MANG[mang];
  const { the, coHoSo, ten } = useTheRieng(mang);
  const caNhan = Boolean(the?.ca_nhan);
  const khung = useRef<HTMLElement>(null);
  const daDo = useRef(false);
  useEffect(() => {
    const el = khung.current;
    if (!el || daDo.current) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting) && !daDo.current) { daDo.current = true; ghi("cross_cta_viewed", { tu: "blog", den: mang, ca_nhan: caNhan ? 1 : 0 }); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [mang, caNhan]);
  const duong = the?.duong ?? tt.duong;
  const bam = (tu: string) => ghi("cross_cta_clicked", { tu, den: mang, ca_nhan: caNhan ? 1 : 0 });
  const kienThuc = lienKetKienThuc(mang);

  return (
    <div className={cn("space-y-6", className)} data-nosnippet="">
      <section ref={khung} data-testid="cta-blog" data-mang={mang} data-ca-nhan={caNhan ? "1" : "0"} aria-labelledby="cta-blog-tieu-de"
        className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-moon/[0.07] p-6 shadow-card sm:p-8">
        <ChomSao />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold/50 bg-[#1a1530] text-gold shadow-glow">
            <BieuTuong mang={mang} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-gold">{caNhan && ten ? `Dành riêng cho ${ten}` : `Dành cho bạn · ${tt.ten}`}</p>
            <h2 id="cta-blog-tieu-de" className="mt-2 font-serif text-2xl leading-tight text-fg sm:text-3xl">{tt.tieuDe}</h2>
            {the && caNhan ? (
              <div className="mt-3 space-y-2" data-testid="cta-blog-rieng">
                <p className="leading-relaxed text-fg">{the.nhan ? <b className="text-gold">{the.nhan} · </b> : null}{the.cau}</p>
                {the.cau_hoi && <p className="italic leading-relaxed text-fg-muted">{the.cau_hoi}</p>}
              </div>
            ) : (
              <p className="mt-3 leading-relaxed text-fg-muted">{tt.loi}</p>
            )}
            {the?.can_them && <p className="mt-2 text-sm text-fg-faint">{the.can_them}</p>}
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {tt.diem.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm leading-snug text-fg-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden />{d}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button asChild size="lg"><Link href={duong} onClick={() => bam("blog")} data-testid="cta-blog-nut">{caNhan && the ? the.cta : tt.nut} <ArrowRight aria-hidden /></Link></Button>
              <span className="text-xs text-fg-faint">{coHoSo ? "Dùng hồ sơ đã lưu trên máy bạn — không gửi đi đâu khác." : "Miễn phí · 30 giây · không cần tài khoản."}</span>
            </div>
          </div>
        </div>
      </section>

      {kienThuc.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="cta-blog-kien-thuc">
          <span className="text-fg-faint">Kiến thức {tt.ten.toLowerCase()}:</span>
          {kienThuc.map((l) => (
            <Link key={l.duong} href={l.duong} onClick={() => bam("blog_kien_thuc")}
              className="rounded-full border border-line px-3 py-1 text-fg-muted transition-colors hover:border-gold/60 hover:text-fg">{l.ten}</Link>
          ))}
        </div>
      )}

      <CtaCuoiBai moDun={tt.moDun} />
    </div>
  );
}

/** Thẻ nhỏ ở cột phải (dưới mục lục): một dòng mời dùng công cụ của mảng — luôn trong tầm mắt khi đọc, như thẻ sản phẩm
 *  bên lề của blog kỹ thuật. */
export function CtaBen({ mang }: { mang: MangBlog }) {
  const tt = THONG_TIN_MANG[mang];
  return (
    <Link href={tt.duong} onClick={() => ghi("cross_cta_clicked", { tu: "blog_ben", den: mang, ca_nhan: 0 })} data-testid="cta-ben" data-mang={mang}
      className="glass group flex items-center gap-3 rounded-2xl p-3.5 text-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-[#1a1530] text-gold">
        <BieuTuong mang={mang} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-fg">{mang === "chung" ? "Bạn là số mấy?" : `Xem ${tt.ten} của bạn`}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-fg-faint">{tt.ngan}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
