"use client";
// LG — "Luận giải toàn bộ": báo cáo theo chương do engine ghép từ kho tri thức (cùng bộ lọc an toàn
// như hỏi đáp). Miễn phí thử nghiệm; khi bật công tắc thu Sao (SAO-LG/SAO-2): đọc miễn phí chương đầu, các chương sau
// hiện tiêu đề + điểm nhấn đã tính + câu hỏi mở, mở toàn bộ bằng Sao (trừ ở máy chủ, xem lại trong ngày không mất thêm).
// Không lưu ở máy chủ.
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenText, Clock, Gift, LockKeyhole, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import type { MoiXem } from "@/lib/sao-xem-truoc";
import { doanCoThuatNgu, KhungGiaiNghia, type ThuatNgu } from "@/components/hoi/ThuatNgu";

type ChuongMo = { ma: string; tieu_de: string; doan: string[]; van_ai?: string; che_do?: string; thuat_ngu?: ThuatNgu[]; khoa?: false };
type ChuongKhoa = { ma: string; tieu_de: string; khoa: true; moi_xem: MoiXem };
interface BaoCao {
  mo_dun: string;
  chuong: (ChuongMo | ChuongKhoa)[];
  ket: string;
  dien_dat?: "ai" | "tron" | "mau";
  trang_thai: string;
  so_khoa?: number;
  phi: { sao: number; ly_do: string; so_du?: number | null; khoa?: boolean; dang_nhap?: boolean; thuong_chao_mung?: number | null };
}
const CHO_MO = "lg:cho-mo";   // người dùng bấm mở khoá rồi đi đăng nhập / nạp → quay lại tự mở

export function LuanGiaiToanBo({ duongDan, laSo, ten }: { duongDan: string; laSo: unknown; ten: string }) {
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [goc, setGoc] = useState(false);
  const [phi, setPhi] = useState<{ thu: boolean; gia: number } | null>(null);
  useEffect(() => {
    let huy = false;
    fetch("/api/luan-giai/phi").then((r) => r.json()).then((d) => { if (!huy) setPhi(d); }).catch(() => { /* coi như miễn phí */ });
    return () => { huy = true; };
  }, []);
  const tai = async (moKhoa = false) => {
    setDang(true); setLoi(null);
    if (moKhoa) {
      ghi("unlock_clicked", { mo_dun: duongDan.includes("battu") ? "battu" : "tuvi" });
      try { sessionStorage.setItem(CHO_MO, duongDan); } catch { /* bỏ qua */ }
    }
    try {
      const d = await postJson<BaoCao>(duongDan, { la_so: laSo }, moKhoa ? { "x-mo-khoa": "1" } : {});
      setBc(d);
      if (moKhoa || !d.so_khoa) { try { sessionStorage.removeItem(CHO_MO); } catch { /* bỏ qua */ } }
      if (moKhoa) ghi("unlock_succeeded", { mo_dun: d.mo_dun, so_sao: d.phi.sao });
      else if (d.so_khoa) ghi("paywall_viewed", { mo_dun: d.mo_dun, kind: "luan_giai_toan_bo" });
      ghi("reading_completed", { mo_dun: d.mo_dun, kind: d.so_khoa ? "luan_giai_xem_truoc" : "luan_giai_toan_bo" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tải được luận giải."); }
    finally { setDang(false); }
  };
  // Quay lại sau khi đăng nhập / nạp Sao → tự mở đúng báo cáo đang xem dở.
  useEffect(() => {
    let cho: string | null = null;
    try { cho = sessionStorage.getItem(CHO_MO); } catch { /* bỏ qua */ }
    if (cho === duongDan && laSo) void tai(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi lá số sẵn sàng
  }, [Boolean(laSo)]);

  if (!bc) {
    return (
      <div className="glass flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <BookOpenText className="size-7 shrink-0 text-gold" aria-hidden />
        <div className="flex-1">
          <p className="font-serif text-xl">Luận giải toàn bộ {ten}</p>
          <p className="text-sm text-fg-muted" data-testid="gia-luan-giai">
            Báo cáo theo chương, ghép từ kho tri thức có nguồn ·{" "}
            {phi?.thu ? <>chương đầu miễn phí, toàn bộ <b className="text-gold">{phi.gia} Sao</b>, xem lại trong ngày không mất thêm</> : "miễn phí giai đoạn ra mắt"} · không lưu trên máy chủ.
          </p>
        </div>
        <Button onClick={() => void tai()} disabled={dang}><Sparkles aria-hidden /> {dang ? "Đang soạn…" : phi?.thu ? "Đọc miễn phí chương đầu" : "Xem luận giải"}</Button>
        {dang && <div className="w-full"><KhungTai dong={3} /></div>}
        {loi && (
          <div className="w-full space-y-2">
            <BaoLoi loi={loi} thuLai={() => void tai()} />
            {phi?.thu && (
              <p className="text-sm"><Link href="/tai-khoan" className="text-gold underline">Đăng nhập · nhận thêm Sao ở trang Tài khoản</Link></p>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <article className="glass rounded-2xl p-5 sm:p-8 print:bg-white print:text-black" data-testid="luan-giai-toan-bo">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Luận giải toàn bộ</p>
          {bc.dien_dat && bc.dien_dat !== "mau" && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="dien-dat-ai">
              Diễn đạt tự động từ dữ liệu đã tính · mỗi chương đã kiểm: không thêm sao, cung, con số hay lời phán ngoài dữ liệu
              {bc.dien_dat === "tron" && " (chương nào không đạt kiểm tra giữ bản gốc)"}.
            </p>
          )}
          <h2 className="mt-1 text-3xl">Luận giải {ten}</h2>
        </div>
        <div className="flex gap-2 print:hidden">
          {bc.chuong.some((c) => !c.khoa && c.van_ai) && (
            <Button variant="ghost" size="sm" aria-pressed={goc} onClick={() => setGoc((v) => !v)}>
              {goc ? "Xem bản diễn đạt" : "Xem bản dữ liệu gốc"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>
        </div>
      </header>
      <nav aria-label="Mục lục" className="mt-4 print:hidden">
        <ol className="flex flex-wrap gap-2 text-sm">
          {bc.chuong.map((c, i) => (
            <li key={c.ma}><a href={c.khoa ? "#lg-khoa" : `#lg-${c.ma}`} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
              {c.khoa && <LockKeyhole className="size-3 text-gold" aria-label="đang khoá" />}{i + 1}. {c.tieu_de}</a></li>
          ))}
        </ol>
      </nav>
      <div className="mt-6 space-y-8">
        {bc.chuong.map((c, i) => c.khoa ? null : (
          <section key={c.ma} id={`lg-${c.ma}`} className="scroll-mt-24">
            <h3 className="font-serif text-2xl"><span className="text-gold">{i + 1}.</span> {c.tieu_de}</h3>
            <div className="prose-vn mt-3 space-y-3 text-[0.97rem] leading-relaxed text-fg-muted">
              {c.van_ai && !goc
                ? doanCoThuatNgu(c.van_ai.replace(/\n\s*\n/g, "\n\n"), c.thuat_ngu)
                : doanCoThuatNgu(c.doan.join("\n\n"), c.thuat_ngu,
                  (d) => (d.startsWith("Câu hỏi để tự soi") ? "rounded-xl bg-moon/10 px-4 py-2 text-moon" : ""))}
            </div>
            <div className="mt-3 print:hidden"><KhungGiaiNghia ds={c.thuat_ngu} /></div>
          </section>
        ))}
      </div>
      {bc.so_khoa ? <PhanKhoa bc={bc} dang={dang} loi={loi} moKhoa={() => void tai(true)} /> : null}
      <p className="mt-8 border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
    </article>
  );
}

/** Phần chương bị khoá: tiến độ đọc, mỗi chương một thẻ (điểm nhấn đã tính + câu hỏi mở), nút mở dính đáy màn hình. */
function PhanKhoa({ bc, dang, loi, moKhoa }: { bc: BaoCao; dang: boolean; loi: string | null; moKhoa: () => void }) {
  const khoa = bc.chuong.filter((c): c is ChuongKhoa => c.khoa === true);
  const daDoc = bc.chuong.length - khoa.length;
  const phut = khoa.reduce((t, c) => t + c.moi_xem.phut_doc, 0);
  const { sao, so_du, dang_nhap, thuong_chao_mung } = bc.phi;
  const goiY = dang_nhap
    ? (so_du ?? 0) >= sao ? `Ví còn ${so_du} Sao — đủ mở ngay.` : `Ví còn ${so_du ?? 0} Sao — nạp nhanh bằng QR, quay lại đúng chỗ này.`
    : thuong_chao_mung ? `Đăng nhập và lưu hồ sơ: tặng ${thuong_chao_mung} Sao${thuong_chao_mung >= sao ? " — đủ mở báo cáo này" : ""}.` : "Đăng nhập để dùng Sao.";
  return (
    <section aria-labelledby="lg-khoa" className="mt-10 print:hidden" data-testid="lg-phan-khoa">
      <div className="flex items-center gap-3 text-sm text-fg-muted">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <span className="block h-full rounded-full bg-gold" style={{ width: `${(daDoc / bc.chuong.length) * 100}%` }} />
        </span>
        <span>Đã đọc {daDoc}/{bc.chuong.length} chương</span>
      </div>
      <h3 id="lg-khoa" className="mt-5 font-serif text-2xl">Còn {khoa.length} chương viết riêng cho lá số của bạn</h3>
      <p className="mt-1 text-sm text-fg-muted">Khoảng {phut} phút đọc · mỗi chương bám đúng dữ liệu đã tính, có câu hỏi để bạn tự soi.</p>
      <ol className="mt-5 space-y-3">
        {khoa.map((c) => (
          <li key={c.ma} className="relative overflow-hidden rounded-2xl border border-line/70 p-4 sm:p-5" data-testid="lg-chuong-khoa">
            <div className="flex items-center gap-2 text-xs text-fg-faint">
              <LockKeyhole className="size-3.5 text-gold" aria-hidden /> Chương {bc.chuong.indexOf(c) + 1}
              <span className="ml-auto inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />~{c.moi_xem.phut_doc} phút</span>
            </div>
            <p className="mt-1 font-serif text-xl">{c.tieu_de}</p>
            {c.moi_xem.diem_nhan && <p className="mt-2 text-sm text-gold/90">{c.moi_xem.diem_nhan}</p>}
            <p className="mt-2 text-[0.95rem] italic text-fg">{c.moi_xem.cau_hoi}</p>
            <div className="mt-3 space-y-2 blur-[3px] select-none" aria-hidden>
              <div className="h-2.5 w-11/12 rounded bg-fg-faint/20" /><div className="h-2.5 w-4/5 rounded bg-fg-faint/20" /><div className="h-2.5 w-2/3 rounded bg-fg-faint/15" />
            </div>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-6 md:bottom-4">
        <div className="glass flex flex-col gap-3 rounded-2xl border border-gold/40 p-4 shadow-card sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="text-fg"><b className="text-gold">{sao} Sao</b> mở {khoa.length} chương còn lại · xem lại cả ngày không mất thêm</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-fg-muted">{!dang_nhap && <Gift className="size-3.5 text-gold" aria-hidden />}{goiY}</p>
          </div>
          <Button onClick={moKhoa} disabled={dang} data-testid="lg-mo-khoa">
            <Sparkles aria-hidden /> {dang ? "Đang mở…" : `Mở toàn bộ · ${sao} Sao`}
          </Button>
        </div>
        {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      </div>
    </section>
  );
}
