"use client";
// LG-ĐS / BT-ĐS — phần hiển thị báo cáo "Luận giải đời sống" Tử vi và Bát tự (phien_ban "doi_song_1",
// docs/LUAN-GIAI-DOI-SONG.md 2.3 + 6). Bát tự thêm thanh sức tự thân, biểu đồ ngũ hành, dải đại vận hai cách (BieuDoBatTu).
// Component THUẦN: nhận báo cáo `bc`, không gọi engine — dùng cho bài vừa tải (LuanGiaiToanBo) và bài đã lưu
// (/ban-than/bai-da-luu). Thứ tự: Điều quan trọng nhất → mục lục → từng chương (mức · tóm tắt · hộp · thân bài · câu
// tự soi · "Vì sao nói vậy"). Chương "cuoc_doi" có dòng thời gian 12 đại hạn; chương "van_han" (VH-1) có dòng 10 năm
// (DongMuoiNam). Chương Con người bạn / Lời khuyên / Vận hạn không mang chip mức. Chương khoá (SAO-2) chỉ nằm trong mục
// lục; phần mời mở do nơi gọi đưa vào (`phanKhoa`).
// Trục 1 "Bài đọc dài dễ đi" (2026-10-26): chương 1 mở, chương sau GẬP sẵn (tiêu đề + chip mức + câu tóm tắt, bấm để mở);
// mục lục dính (MucLucChuong: thanh mảnh trên điện thoại, cột bên trên máy tính); hộp đã ở "Điều quan trọng nhất" thì
// trong chương chỉ còn một dòng tham chiếu; cuối chương có nút "Chương tiếp". Gập chỉ là hiển thị.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, LockKeyhole, MapPin, Star } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { datChanDocXong } from "@/lib/doc-xong-cho";
import { doanCoThuatNgu, KhungGiaiNghia } from "@/components/hoi/ThuatNgu";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import { BieuDoNguHanh, DaiVanHaiCach, ThanhThan } from "./BieuDoBatTu";
import { DongMuoiNam } from "./DongMuoiNam";
import { HopNoiBat, KiemChungBai, ViSao } from "./HopNoiBat";
import { ChuQua } from "./ChuQua";
import { useCachChinhBaoCao } from "@/lib/cach-chinh-battu";
import { ChamMuc, ChuThichMuc, CotChuong, giamChuyenDong, ThanhChuongGon, useChuongDangDoc, type MucChuong } from "./MucLucChuong";
import { maMauBaoCao, NHAN_MUC, type BaoCaoDoiSong, type ChuongDoiSongMo, type Hop, type MocDaiHan, type Muc } from "./kieu";

export function ChipMuc({ muc, nhan, className }: { muc?: Muc; nhan?: string; className?: string }) {
  if (!muc) return null;
  return (
    <span data-muc={muc} data-testid="chip-muc"
      className={cn("chip-muc inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {nhan ?? NHAN_MUC[muc] ?? muc}
    </span>
  );
}

export function BaoCaoDoiSongView({ bc, ten, goc = false, hanhDong, phanKhoa, chanTrang, kiemChung = true, nhan = "Luận giải toàn bộ", chuongQua }: {
  bc: BaoCaoDoiSong; ten: string; /** hiện bản dữ liệu gốc thay bản diễn đạt AI */ goc?: boolean;
  hanhDong?: ReactNode; phanKhoa?: ReactNode; chanTrang?: ReactNode; /** tắt dòng kiểm chứng (vd bài đã lưu cũ) */ kiemChung?: boolean;
  /** Nhãn nhỏ trên tiêu đề (KC-1: mỗi mảng một tên gói). */ nhan?: string;
  /** SAO-V: mã chương bạn bè tặng — ghi "Chương này là quà của một người bạn". */ chuongQua?: string;
}) {
  const tyLe = useTyLe(kiemChung ? maMauBaoCao(bc) : []);
  const cotLoi = (bc.cot_loi ?? []).filter((h) => !h.dang_xem_lai);
  // Số hộp lẻ → một hộp trải trọn hàng (máy tính): hộp đầu như cũ. UX v3 M7: hộp đầu chỉ còn tiêu đề (thân trùng tiêu đề
  // đã bỏ, KB không còn việc nên làm riêng) → nằm gọn trong lưới 2 cột, hộp CUỐI (nếu có thân) trải trọn hàng — không hở ô.
  const coThan = (h: Hop) => Boolean(h.noi_dung || h.huong_xu_ly);
  const hopTronHang = !(cotLoi.length % 2) ? -1 : coThan(cotLoi[0]!) ? 0 : coThan(cotLoi.at(-1)!) ? cotLoi.length - 1 : -1;
  // KC-1: phái ghi kèm phiếu kiểm chứng do engine trả (`phai`); báo cáo Tử vi cũ không có → Nam phái Việt.
  const phai = bc.phai ?? (bc.mo_dun === "thanso" ? "pitago" : bc.mo_dun === "battu" ? "tu_binh" : "nam_phai_viet");
  const doc = bc.chuong.filter((c): c is ChuongDoiSongMo => !c.khoa);
  const dau = doc[0]?.ma;
  const cuoi = doc.at(-1)?.ma;
  // Trục 1: chương 1 mở, chương sau GẬP sẵn (chỉ hiển thị — chương khoá SAO-2 vẫn không có đoạn văn nào xuống trình
  // duyệt). Chương quà (SAO-V) cũng mở sẵn. Đổi báo cáo (người khác, phái khác) → về trạng thái đầu.
  const khoaBai = bc.chuong.map((c) => c.ma).join(",") + "|" + (bc.cot_loi?.[0]?.ma_mau ?? "");
  const [mo, setMo] = useState<Set<string>>(() => new Set([dau, chuongQua].filter((x): x is string => Boolean(x))));
  const [daCuoi, setDaCuoi] = useState(false);
  useEffect(() => {
    setMo(new Set([dau, chuongQua].filter((x): x is string => Boolean(x))));
    setDaCuoi(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi đổi bài
  }, [khoaBai]);
  // Link có #lg-<chương> (chép từ thanh địa chỉ, quay lại trang) → mở đúng chương đó.
  useEffect(() => {
    const h = window.location.hash.replace(/^#lg-/, "");
    if (h && doc.some((c) => c.ma === h)) moChuong(h, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- một lần khi bài hiện
  }, [khoaBai]);
  // reading_completed (Gate 1) — xem lib/doc-xong-cho: khi có báo cáo Tử vi / Bát tự, mốc "đọc xong" dưới báo cáo chỉ tính
  // khi chương đọc được CUỐI CÙNG đã mở và cuộn hết. Bài đã lưu / Bản đồ con số không chặn (mốc của chúng khác chỗ).
  const chanMa = bc.mo_dun === "tuvi" || bc.mo_dun === "battu" ? bc.mo_dun : null;
  useEffect(() => {
    if (!chanMa) return;
    datChanDocXong(chanMa, !daCuoi);
    return () => datChanDocXong(chanMa, false);
  }, [chanMa, daCuoi]);

  const daGhiMo = useRef(new Set<string>());
  const moChuong = (ma: string, cuon: boolean) => {
    setMo((s) => (s.has(ma) ? s : new Set(s).add(ma)));
    const i = bc.chuong.findIndex((c) => c.ma === ma);
    if (!daGhiMo.current.has(ma) && ma !== dau) {
      daGhiMo.current.add(ma);
      ghi("chart_interacted", { mo_dun: bc.mo_dun, kind: "lg_mo_chuong", so_chuong: i + 1 });
    }
    if (cuon) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.getElementById(`lg-${ma}`)?.scrollIntoView({ behavior: giamChuyenDong() ? "auto" : "smooth", block: "start" });
        if (window.location.hash !== `#lg-${ma}`) history.replaceState(null, "", `#lg-${ma}`);
      }));
    }
  };
  const doiChuong = (ma: string) => {
    if (mo.has(ma)) setMo((s) => { const n = new Set(s); n.delete(ma); return n; });
    else moChuong(ma, false);
  };
  const moTatCa = () => { doc.forEach((c) => moChuong(c.ma, false)); setMo(new Set(doc.map((c) => c.ma))); };

  const dsMuc: MucChuong[] = bc.chuong.map((c) => ({ ma: c.ma, tieu_de: c.tieu_de, khoa: Boolean(c.khoa), mo: mo.has(c.ma),
    muc: c.khoa ? null : (c as ChuongDoiSongMo).muc }));
  const dang = useChuongDangDoc(dsMuc.filter((c) => !c.khoa)) ?? dau ?? null;
  // Trục 1 (engine `tham_chieu`): hộp đã có ở "Điều quan trọng nhất" (hoặc chương trước) → chương chỉ còn một dòng trỏ
  // về đó. Web tự kiểm thêm (bài đã lưu cũ chưa có cờ): đích không hiện trên trang → hiện hộp đầy đủ như cũ.
  const maCot = new Set(cotLoi.map((h) => h.ma_mau).filter((m): m is string => Boolean(m)));
  const coMo = new Set(doc.map((c) => c.ma));
  const thamChieu = (h: Hop): string | null => {
    const t = h.tham_chieu ?? (h.ma_mau && maCot.has(h.ma_mau) ? "cot_loi" : undefined);
    if (!t) return null;
    if (t === "cot_loi") return h.ma_mau && maCot.has(h.ma_mau) ? t : null;
    return coMo.has(t) ? t : null;
  };
  const soChuong = (ma: string) => bc.chuong.findIndex((c) => c.ma === ma) + 1;
  const tenChuong = (ma: string) => bc.chuong.find((c) => c.ma === ma)?.tieu_de ?? "";

  return (
    <KiemChungBai.Provider value={{ tyLe, phai, tat: !kiemChung }}>
      <article className="bao-cao-ds glass rounded-2xl p-5 sm:p-8 print:bg-white print:text-black" data-testid="luan-giai-toan-bo"
        data-phien-ban={bc.phien_ban}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{nhan}</p>
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
          <section id="lg-cot-loi" aria-labelledby="lg-cot-loi-td" className="mt-6 scroll-mt-32 lg:scroll-mt-24" data-testid="lg-cot-loi">
            <h3 id="lg-cot-loi-td" className="font-serif text-2xl">Điều quan trọng nhất</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {cotLoi.map((h, i) => <HopNoiBat key={`${h.ma_mau ?? h.tieu_de}-${i}`} hop={h} className={i === hopTronHang ? "md:col-span-2" : undefined} />)}
            </div>
          </section>
        )}

        <nav aria-label="Mục lục" className="mt-6 print:hidden" data-testid="lg-muc-luc">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-fg-faint">Mục lục · {bc.chuong.length} chương{doc.length > 1 ? " · bấm tên chương để mở" : ""}</p>
            {doc.length > 1 && mo.size < doc.length && (
              <button type="button" onClick={moTatCa} data-testid="lg-mo-het"
                className="min-h-9 shrink-0 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">Mở hết các chương</button>
            )}
          </div>
          <ChuThichMuc ds={dsMuc} className="mt-1.5" />
          <ol className="mt-2 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {bc.chuong.map((c, i) => (
              <li key={c.ma} className="min-w-0">
                <a href={c.khoa ? "#lg-khoa" : `#lg-${c.ma}`}
                  onClick={(e) => { if (!c.khoa) { e.preventDefault(); moChuong(c.ma, true); } }}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-line/70 px-3 py-1.5 text-fg-muted hover:border-gold/60 hover:text-fg">
                  {c.khoa && <LockKeyhole className="size-3 shrink-0 text-gold" aria-label="đang khoá" />}
                  <span className="min-w-0 flex-1">{i + 1}. {c.tieu_de}</span>
                  {!c.khoa && c.muc && <ChamMuc muc={c.muc} />}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
          <div className="min-w-0">
            {doc.length > 1 && <ThanhChuongGon ds={dsMuc} dang={dang} onChon={(ma) => moChuong(ma, true)} />}
            <div className="space-y-4">
              {bc.chuong.map((c, i) => {
                if (c.khoa) return null;
                const k = doc.indexOf(c);
                const tiep = doc[k + 1];
                return (
                  <Chuong key={c.ma} c={c} so={i + 1} goc={goc} thoiGian={c.ma === "cuoc_doi" ? bc.thoi_gian_bieu : undefined}
                    qua={c.ma === chuongQua} mo={mo.has(c.ma) || doc.length === 1} doiMo={() => doiChuong(c.ma)}
                    thamChieu={thamChieu} soChuong={soChuong} tenChuong={tenChuong} moDich={(ma) => moChuong(ma, true)}
                    tiep={tiep ? { ma: tiep.ma, so: soChuong(tiep.ma), tieu_de: tiep.tieu_de } : null}
                    conKhoa={!tiep && doc.length < bc.chuong.length}
                    onCuoi={c.ma === cuoi ? () => setDaCuoi(true) : undefined} />
                );
              })}
            </div>
            {phanKhoa}
          </div>
          {doc.length > 1 && <CotChuong ds={dsMuc} dang={dang} onChon={(ma) => moChuong(ma, true)} moTatCa={moTatCa} />}
        </div>
        <p className="mt-8 border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
        {chanTrang}
      </article>
    </KiemChungBai.Provider>
  );
}

/** Dòng tham chiếu thay hộp lặp (Trục 1): hộp này đã hiện đầy đủ ở "Điều quan trọng nhất" / một chương trước. */
function DongThamChieu({ hop, den, tenDen, onMo }: { hop: Hop; den: string; tenDen: string; onMo?: () => void }) {
  return (
    <a href={den === "cot_loi" ? "#lg-cot-loi" : `#lg-${den}`} data-testid="hop-tham-chieu" data-ma-mau={hop.ma_mau}
      onClick={onMo ? (e) => { e.preventDefault(); onMo(); } : undefined}
      className="flex min-h-11 items-center gap-2.5 rounded-xl border border-dashed border-line/80 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
      <Star className="size-3.5 shrink-0 text-gold" aria-hidden />
      <span className="min-w-0">
        <span className="text-fg-faint">Đã nêu ở {tenDen}: </span>
        <span className="font-medium text-fg">{hop.tieu_de}</span>
      </span>
      <ArrowUp className="ml-auto size-3.5 shrink-0 text-fg-faint" aria-hidden />
    </a>
  );
}

function Chuong({ c, so, goc, thoiGian, qua = false, mo, doiMo, thamChieu, soChuong, tenChuong, moDich, tiep, conKhoa, onCuoi }: {
  c: ChuongDoiSongMo; so: number; goc: boolean; thoiGian?: MocDaiHan[]; qua?: boolean;
  mo: boolean; doiMo: () => void; thamChieu: (h: Hop) => string | null;
  soChuong: (ma: string) => number; tenChuong: (ma: string) => string; moDich: (ma: string) => void;
  tiep: { ma: string; so: number; tieu_de: string } | null; conKhoa: boolean; onCuoi?: () => void;
}) {
  const hopHien = (c.hop ?? []).filter((h) => !h.dang_xem_lai);
  const hop = hopHien.filter((h) => !thamChieu(h));
  const thamChieuDs = hopHien.filter((h) => thamChieu(h));
  // engine đặt câu tóm tắt làm đoạn đầu (cho lời mời SAO-2 + diễn đạt AI) — đã hiện to ở đầu chương, không lặp lại.
  const doan = c.doan.filter((d) => d !== c.tom_tat);
  const idThan = useId();
  const cuoiRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cuoiRef.current;
    if (!onCuoi || !mo || !el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { onCuoi(); io.disconnect(); } });
    io.observe(el);
    return () => io.disconnect();
  }, [onCuoi, mo]);
  return (
    <section id={`lg-${c.ma}`} aria-labelledby={`lg-tieu-de-${c.ma}`} data-mo={mo ? "1" : "0"}
      className={cn("scroll-mt-32 rounded-2xl transition-colors lg:scroll-mt-24", mo ? "pb-8" : "border border-line/60 bg-surface/30 p-4 sm:p-5 print:border-0 print:p-0")}
      data-testid={`lg-chuong-${c.ma}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 id={`lg-tieu-de-${c.ma}`} className="min-w-0 font-serif text-2xl">
          <button type="button" onClick={doiMo} aria-expanded={mo} aria-controls={idThan} data-testid="lg-mo-chuong"
            className="group inline-flex items-start gap-2 text-left">
            <span><span className="text-gold">{so}.</span> {c.tieu_de}</span>
            <ChevronDown aria-hidden className={cn("mt-2 size-5 shrink-0 text-fg-faint transition-transform duration-200 group-hover:text-fg motion-reduce:transition-none print:hidden",
              mo && "rotate-180")} />
          </button>
        </h3>
        <ChipMuc muc={c.muc} nhan={c.nhan_muc} />
        <MucCachChinh hai={c.hai_cach_muc} />
      </div>
      {qua && <ChuQua />}
      {c.tom_tat && <p className={cn("mt-3 leading-relaxed text-fg", mo ? "text-lg sm:text-xl" : "text-base sm:text-lg")} data-testid="tom-tat">{c.tom_tat}</p>}
      {!mo && (
        <button type="button" onClick={doiMo} aria-controls={idThan} aria-expanded={false}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/10 print:hidden">
          Đọc chương này{hop.length ? ` · ${hop.length} điểm chính` : ""} <ChevronDown className="size-4" aria-hidden />
        </button>
      )}
      <div id={idThan} className={cn(!mo && "hidden print:block")}>
        {c.than_do && <ThanhThan than={c.than_do} />}
        {c.bieu_do && <BieuDoNguHanh bd={c.bieu_do} haiCach={c.hai_cach} />}
        {thoiGian && thoiGian.length > 0 && <DaiVanHaiCach ds={thoiGian} />}
        {thoiGian && thoiGian.length > 0 && <DongThoiGian ds={thoiGian} />}
        {c.dong_nam && c.dong_nam.length > 0 && <DongMuoiNam ds={c.dong_nam} thang={c.thang_toi} />}
        {hop.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {hop.map((h, k) => <HopNoiBat key={`${h.ma_mau ?? h.tieu_de}-${k}`} hop={h} thuatNgu={c.thuat_ngu} />)}
          </div>
        )}
        {thamChieuDs.length > 0 && (
          <div className="mt-3 space-y-2">
            {thamChieuDs.map((h) => {
              const den = thamChieu(h)!;
              return <DongThamChieu key={h.ma_mau} hop={h} den={den}
                tenDen={den === "cot_loi" ? "Điều quan trọng nhất" : `chương ${soChuong(den)} · ${tenChuong(den)}`}
                onMo={den === "cot_loi" ? undefined : () => moDich(den)} />;
            })}
          </div>
        )}
        {(doan.length > 0 || c.van_ai) && (
          <div className="prose-vn mt-4 space-y-3 text-[0.97rem] leading-relaxed text-fg-muted">
            {c.van_ai && !goc
              ? doanCoThuatNgu(c.van_ai.replace(/\n\s*\n/g, "\n\n"), c.thuat_ngu)
              : doanCoThuatNgu(doan.join("\n\n"), c.thuat_ngu,
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
        <div ref={cuoiRef} aria-hidden className="h-px" />
        {tiep && (
          <button type="button" onClick={() => moDich(tiep.ma)} data-testid="lg-chuong-tiep"
            className="mt-5 flex min-h-11 w-full items-center gap-3 rounded-xl border border-line/70 px-4 py-2.5 text-left text-sm transition-colors hover:border-gold/60 print:hidden">
            {/* UX v3 M9: tên chương không cắt — điện thoại nhãn nằm trên, tên xuống dòng khi dài. */}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="shrink-0 text-xs text-fg-faint sm:text-sm">Chương tiếp</span>
              <span className="min-w-0 text-pretty font-medium leading-snug text-fg">{tiep.so}. {tiep.tieu_de}</span>
            </span>
            <ArrowDown className="size-4 shrink-0 text-gold" aria-hidden />
          </button>
        )}
        {conKhoa && (
          <a href="#lg-khoa" className="mt-5 flex min-h-11 items-center gap-2 rounded-xl border border-gold/40 px-4 py-2.5 text-sm text-gold hover:bg-gold/10 print:hidden">
            <LockKeyhole className="size-4" aria-hidden /> Xem các chương còn lại
          </a>
        )}
      </div>
    </section>
  );
}

/** 12 đại hạn: dọc trên điện thoại, ngang (cuộn trong khung) trên máy tính; giai đoạn đang đi nổi bật. */
/** BT-DC: hai cách nói khác nhau + người dùng đã chọn cách chính ("Cách nào đúng với bạn?") → hiện mức theo cách đó
 * cạnh mức chung. Không đổi mức chung, không tính gì (mức từng cách engine đã trả). */
function MucCachChinh({ hai, ngan = false }: { hai?: { cach_1: Muc; cach_2: Muc }; ngan?: boolean }) {
  const { cach } = useCachChinhBaoCao();
  if (!cach || !hai || hai.cach_1 === hai.cach_2) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-faint" data-testid="muc-cach-chinh">
      {ngan ? "cách bạn chọn:" : "Theo cách bạn chọn:"} <ChipMuc muc={hai[cach]} className={ngan ? "px-2 py-0 text-[0.7rem]" : undefined} />
    </span>
  );
}

/** "2026-12-13" → "13/12/2026" (chỉ đổi cách viết ngày engine đã tính). */
const ngayVn = (iso: string) => iso.split("-").reverse().map((x, i) => (i < 2 ? String(Number(x)) : x)).join("/");

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
              {!m.tu_ngay && <span className="ml-1.5 font-normal text-fg-faint">{m.nam_tu}–{m.nam_den}</span>}</p>
            {m.tu_ngay && m.den_ngay && (
              <p className="text-[0.7rem] text-fg-faint" data-testid="ngay-van">từ {ngayVn(m.tu_ngay)} đến {ngayVn(m.den_ngay)}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ChipMuc muc={m.muc} className="px-2 py-0 text-[0.7rem]" />
              <span className="text-xs text-fg-faint">{m.nhan ?? `cung ${m.cung}`}</span>
              {m.hai_cach_khac && <span className="text-[0.7rem] text-moon" data-testid="hai-cach-khac">hai cách khác nhau</span>}
              {m.hai_cach_khac && m.muc_cach_1 && m.muc_cach_2 && <MucCachChinh hai={{ cach_1: m.muc_cach_1, cach_2: m.muc_cach_2 }} ngan />}
            </div>
            <p className="mt-1.5 text-sm font-medium text-fg-muted first-letter:uppercase">{m.chu_de}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{m.mot_cau}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
