"use client";
// LG-ĐS / BT-ĐS — phần hiển thị báo cáo "Luận giải đời sống" Tử vi và Bát tự (phien_ban "doi_song_1",
// docs/LUAN-GIAI-DOI-SONG.md 2.3 + 6). Bát tự thêm thanh sức tự thân, biểu đồ ngũ hành, dải đại vận hai cách (BieuDoBatTu).
// Component THUẦN: nhận báo cáo `bc`, không gọi engine — dùng cho bài vừa tải (LuanGiaiToanBo) và bài đã lưu
// (/ban-than/bai-da-luu). Thứ tự: Điều quan trọng nhất → mục lục → từng chương (mức · tóm tắt · hộp · thân bài · câu
// tự soi · "Vì sao nói vậy"). Chương "cuoc_doi" có dòng thời gian 12 đại hạn. Chương khoá (SAO-2) chỉ nằm trong mục
// lục; phần mời mở do nơi gọi đưa vào (`phanKhoa`).
import { useEffect, useRef, type ReactNode } from "react";
import { LockKeyhole, MapPin } from "lucide-react";
import { doanCoThuatNgu, KhungGiaiNghia } from "@/components/hoi/ThuatNgu";
import { PHAI_DOI_SONG } from "@/lib/kiem-chung";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import { BieuDoNguHanh, DaiVanHaiCach, ThanhThan } from "./BieuDoBatTu";
import { HopNoiBat, KiemChungBai, ViSao } from "./HopNoiBat";
import { maMauBaoCao, NHAN_MUC, type BaoCaoDoiSong, type ChuongDoiSongMo, type MocDaiHan, type Muc } from "./kieu";

export function ChipMuc({ muc, nhan, className }: { muc?: Muc; nhan?: string; className?: string }) {
  if (!muc) return null;
  return (
    <span data-muc={muc} data-testid="chip-muc"
      className={cn("chip-muc inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {nhan ?? NHAN_MUC[muc] ?? muc}
    </span>
  );
}

export function BaoCaoDoiSongView({ bc, ten, goc = false, hanhDong, phanKhoa, chanTrang, kiemChung = true }: {
  bc: BaoCaoDoiSong; ten: string; /** hiện bản dữ liệu gốc thay bản diễn đạt AI */ goc?: boolean;
  hanhDong?: ReactNode; phanKhoa?: ReactNode; chanTrang?: ReactNode; /** tắt dòng kiểm chứng (vd bài đã lưu cũ) */ kiemChung?: boolean;
}) {
  const tyLe = useTyLe(kiemChung ? maMauBaoCao(bc) : []);
  const cotLoi = (bc.cot_loi ?? []).filter((h) => !h.dang_xem_lai);
  return (
    <KiemChungBai.Provider value={{ tyLe, phai: PHAI_DOI_SONG[bc.mo_dun] ?? "nam_phai_viet", tat: !kiemChung }}>
      <article className="bao-cao-ds glass rounded-2xl p-5 sm:p-8 print:bg-white print:text-black" data-testid="luan-giai-toan-bo"
        data-phien-ban={bc.phien_ban}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Luận giải toàn bộ</p>
            {bc.dien_dat && bc.dien_dat !== "mau" && (
              <p className="mt-1 text-xs text-fg-faint" data-testid="dien-dat-ai">
                Diễn đạt tự động từ dữ liệu đã tính · mỗi chương đã kiểm: không thêm sao, cung, con số hay lời phán ngoài dữ liệu
                {bc.dien_dat === "tron" && " (chương nào không đạt kiểm tra giữ bản gốc)"}.
              </p>
            )}
            <h2 className="mt-1 text-3xl">Luận giải {ten}</h2>
          </div>
          {hanhDong && <div className="flex flex-wrap gap-2 print:hidden">{hanhDong}</div>}
        </header>

        {cotLoi.length > 0 && (
          <section aria-labelledby="lg-cot-loi" className="mt-6" data-testid="lg-cot-loi">
            <h3 id="lg-cot-loi" className="font-serif text-2xl">Điều quan trọng nhất</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {cotLoi.map((h, i) => <HopNoiBat key={`${h.ma_mau ?? h.tieu_de}-${i}`} hop={h} className={cotLoi.length % 2 && i === 0 ? "md:col-span-2" : undefined} />)}
            </div>
          </section>
        )}

        <nav aria-label="Mục lục" className="mt-6 print:hidden" data-testid="lg-muc-luc">
          <p className="text-sm text-fg-faint">Mục lục</p>
          <ol className="mt-2 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {bc.chuong.map((c, i) => (
              <li key={c.ma} className="min-w-0">
                <a href={c.khoa ? "#lg-khoa" : `#lg-${c.ma}`}
                  className="flex items-center gap-2 rounded-xl border border-line/70 px-3 py-1.5 text-fg-muted hover:border-gold/60 hover:text-fg">
                  {c.khoa && <LockKeyhole className="size-3 shrink-0 text-gold" aria-label="đang khoá" />}
                  <span className="min-w-0 flex-1">{i + 1}. {c.tieu_de}</span>
                  {!c.khoa && c.muc && <span data-muc={c.muc} className="cham-muc size-2 shrink-0 rounded-full" aria-hidden />}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-12">
          {bc.chuong.map((c, i) => c.khoa ? null : (
            <Chuong key={c.ma} c={c} so={i + 1} goc={goc} thoiGian={c.ma === "cuoc_doi" ? bc.thoi_gian_bieu : undefined} />
          ))}
        </div>
        {phanKhoa}
        <p className="mt-8 border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
        {chanTrang}
      </article>
    </KiemChungBai.Provider>
  );
}

function Chuong({ c, so, goc, thoiGian }: { c: ChuongDoiSongMo; so: number; goc: boolean; thoiGian?: MocDaiHan[] }) {
  const hop = (c.hop ?? []).filter((h) => !h.dang_xem_lai);
  return (
    <section id={`lg-${c.ma}`} aria-labelledby={`lg-tieu-de-${c.ma}`} className="scroll-mt-24" data-testid={`lg-chuong-${c.ma}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 id={`lg-tieu-de-${c.ma}`} className="font-serif text-2xl"><span className="text-gold">{so}.</span> {c.tieu_de}</h3>
        <ChipMuc muc={c.muc} nhan={c.nhan_muc} />
      </div>
      {c.tom_tat && <p className="mt-3 text-lg leading-relaxed text-fg sm:text-xl" data-testid="tom-tat">{c.tom_tat}</p>}
      {c.than_do && <ThanhThan than={c.than_do} />}
      {c.bieu_do && <BieuDoNguHanh bd={c.bieu_do} haiCach={c.hai_cach} />}
      {thoiGian && thoiGian.length > 0 && <DaiVanHaiCach ds={thoiGian} />}
      {thoiGian && thoiGian.length > 0 && <DongThoiGian ds={thoiGian} />}
      {hop.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {hop.map((h, k) => <HopNoiBat key={`${h.ma_mau ?? h.tieu_de}-${k}`} hop={h} thuatNgu={c.thuat_ngu} />)}
        </div>
      )}
      {(c.doan.length > 0 || c.van_ai) && (
        <div className="prose-vn mt-4 space-y-3 text-[0.97rem] leading-relaxed text-fg-muted">
          {c.van_ai && !goc
            ? doanCoThuatNgu(c.van_ai.replace(/\n\s*\n/g, "\n\n"), c.thuat_ngu)
            : doanCoThuatNgu(c.doan.join("\n\n"), c.thuat_ngu,
              (d) => (d.startsWith("Câu hỏi để tự soi") ? "rounded-xl bg-moon/10 px-4 py-2 text-moon" : ""))}
        </div>
      )}
      {c.mien_tru && !c.doan.some((d) => d.includes(c.mien_tru!)) && (
        <p className="mt-4 rounded-xl border border-line/70 px-4 py-2.5 text-sm text-fg-muted" data-testid="mien-tru">{c.mien_tru}</p>
      )}
      {c.cau_tu_soi && (
        <p className="mt-4 rounded-xl bg-moon/10 px-4 py-2.5 text-moon" data-testid="cau-tu-soi">
          <span className="text-xs font-semibold uppercase tracking-wider">Tự hỏi mình</span>
          <span className="mt-0.5 block italic">{c.cau_tu_soi}</span>
        </p>
      )}
      <ViSao canCu={c.can_cu} thuatNgu={c.thuat_ngu} />
      <div className="mt-3 print:hidden"><KhungGiaiNghia ds={c.thuat_ngu} /></div>
    </section>
  );
}

/** 12 đại hạn: dọc trên điện thoại, ngang (cuộn trong khung) trên máy tính; giai đoạn đang đi nổi bật. */
function DongThoiGian({ ds }: { ds: MocDaiHan[] }) {
  const khung = useRef<HTMLOListElement>(null);
  const hienTai = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const k = khung.current, h = hienTai.current;
    if (k && h && k.scrollWidth > k.clientWidth + 4) k.scrollLeft = Math.max(0, h.offsetLeft - k.offsetLeft - 16);
  }, []);
  return (
    <ol ref={khung} aria-label="Các giai đoạn mười năm" data-testid="dong-thoi-gian"
      className="mt-5 flex flex-col md:flex-row md:gap-3 md:overflow-x-auto md:pb-3 md:snap-x print:flex-col print:overflow-visible">
      {ds.map((m) => (
        <li key={`${m.tu_tuoi}-${m.cung}`} ref={m.hien_tai ? hienTai : undefined} aria-current={m.hien_tai ? "step" : undefined}
          data-testid="moc-dai-han" data-hien-tai={m.hien_tai ? "1" : undefined}
          className="relative pb-4 pl-7 last:pb-0 md:w-52 md:shrink-0 md:snap-start md:pb-0 md:pl-0 print:pl-7">
          {/* trục dọc (điện thoại) */}
          <span className="absolute bottom-0 left-[7px] top-0 w-px bg-line md:hidden print:block" aria-hidden />
          <span data-muc={m.muc} aria-hidden
            className={cn("cham-muc absolute left-0 top-1.5 size-[15px] rounded-full md:hidden print:block", m.hien_tai && "ring-2 ring-gold ring-offset-2 ring-offset-bg")} />
          <div className={cn("rounded-xl md:h-full md:border md:p-3",
            m.hien_tai ? "border-gold/70 md:bg-gold/[0.07] md:shadow-glow" : "md:border-line/70")}>
            {m.hien_tai && (
              <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[0.7rem] font-semibold text-[#1a1406]"
                data-testid="ban-dang-o-day">
                <MapPin className="size-3" aria-hidden /> Bạn đang ở đây
              </p>
            )}
            <p className="text-sm font-semibold text-fg">{m.tu_tuoi}–{m.den_tuoi} tuổi
              <span className="ml-1.5 font-normal text-fg-faint">{m.nam_tu}–{m.nam_den}</span></p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ChipMuc muc={m.muc} className="px-2 py-0 text-[0.7rem]" />
              <span className="text-xs text-fg-faint">{m.nhan ?? `cung ${m.cung}`}</span>
              {m.hai_cach_khac && <span className="text-[0.7rem] text-moon" data-testid="hai-cach-khac">hai cách khác nhau</span>}
            </div>
            <p className="mt-1.5 text-sm font-medium text-fg-muted first-letter:uppercase">{m.chu_de}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{m.mot_cau}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
