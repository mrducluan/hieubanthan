"use client";
// LG — "Luận giải toàn bộ": báo cáo theo chương do engine ghép từ kho tri thức (cùng bộ lọc an toàn
// như hỏi đáp). Miễn phí thử nghiệm; khi bật công tắc thu Sao (SAO-LG/SAO-2): đọc miễn phí chương đầu, các chương sau
// hiện tiêu đề + điểm nhấn đã tính + câu hỏi mở, mở toàn bộ bằng Sao (trừ ở máy chủ, xem lại trong ngày không mất thêm).
// Không lưu ở máy chủ — trừ khi người dùng đã đăng nhập tự bấm "Lưu vào tài khoản" (LG-ĐS, báo cáo đời sống).
// Báo cáo `phien_ban: "doi_song_1"` (Tử vi LG-ĐS + Bát tự BT-ĐS, docs/LUAN-GIAI-DOI-SONG.md) hiện bằng
// components/luan-giai/BaoCaoDoiSong; báo cáo khác (Bản đồ con số thần số) giữ cách hiện cũ bên dưới.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenText, Clock, Gift, LockKeyhole, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { dangChoMo, ghiChoMo, xoaChoMo } from "@/lib/sao-client";
import { dangKyCuaLuanGiai } from "@/lib/cta-sao";
import { useHoSo } from "@/lib/hoso";
import type { MoiXem } from "@/lib/sao-xem-truoc";
import { doanCoThuatNgu, KhungGiaiNghia, type ThuatNgu } from "@/components/hoi/ThuatNgu";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { LuuBaiLuan } from "@/components/luan-giai/LuuBaiLuan";
import { laBaoCaoDoiSong } from "@/components/luan-giai/kieu";
import { ChuQua } from "@/components/luan-giai/ChuQua";
import { TangChuong } from "@/components/luan-giai/TangChuong";
import { mangLuanGiai } from "@/lib/luan-giai-mang";


type ChuongMo = { ma: string; tieu_de: string; doan: string[]; van_ai?: string; che_do?: string; thuat_ngu?: ThuatNgu[]; khoa?: false };
type ChuongKhoa = { ma: string; tieu_de: string; khoa: true; moi_xem: MoiXem };
interface BaoCao {
  mo_dun: string;
  phien_ban?: string;
  chuong: (ChuongMo | ChuongKhoa)[];
  ket: string;
  dien_dat?: "ai" | "tron" | "mau";
  trang_thai: string;
  so_khoa?: number;
  phi: { sao: number; ly_do: string; so_du?: number | null; khoa?: boolean; dang_nhap?: boolean; thuong_chao_mung?: number | null;
    /** SAO-V: chương bạn bè tặng (đọc thêm một chương sau các chương miễn phí). */ chuong_tang?: number; chuong_tang_ma?: string };
}

/** Đã mở toàn bộ bằng Sao (hôm nay) → được tặng bạn bè một chương. */
const DA_MO_BANG_SAO = new Set(["da_tru_sao", "da_mo_hom_nay"]);

/** `than`: thân lời gọi khác `{ la_so }` (vd bản đồ con số gửi họ tên + ngày sinh); `moDun` cho đo lường; `tuMo`: tự tải
 *  bản xem trước (chương miễn phí + lời mời) ngay khi hiện, không chờ bấm. */
export function LuanGiaiToanBo({ duongDan, laSo, ten, than, moDun, tuMo = false }: { duongDan: string; laSo: unknown; ten: string; than?: unknown; moDun?: string; tuMo?: boolean }) {
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [goc, setGoc] = useState(false);
  const [phi, setPhi] = useState<{ thu: boolean; gia: number } | null>(null);
  // Báo cáo chờ mở gắn với NGƯỜI (dữ liệu sinh), không với lựa chọn trường phái — các công tắc phái không lưu qua lượt
  // đăng nhập / nạp nên lá số quay về có thể khác phái mà vẫn là cùng người.
  const hs = useHoSo();
  const nguoi = hs ? { t: hs.ho_ten, d: hs.ngay, m: hs.thang, y: hs.nam, g: hs.gio ?? null, s: hs.gioi_tinh ?? null, n: hs.noi_sinh ?? null } : null;
  const maCua = moDun ?? (duongDan.includes("battu") ? "battu" : duongDan.includes("thanso") ? "thanso" : "tuvi");
  useEffect(() => {
    let huy = false;
    // SAO-V: công tắc thu Sao có thể bật riêng từng mảng → hỏi đúng mảng đang xem.
    fetch(`/api/luan-giai/phi?mo_dun=${encodeURIComponent(maCua)}`).then((r) => r.json()).then((d) => { if (!huy) setPhi(d); }).catch(() => { /* coi như miễn phí */ });
    return () => { huy = true; };
  }, [maCua]);
  // Chỉ nhận phản hồi của lượt gọi mới nhất — đổi đầu vào (vd cách tính Đường đời) khi một lượt cũ còn bay thì lượt cũ
  // về muộn không được ghi đè báo cáo mới.
  const luot = useRef(0);
  const tai = async (moKhoa = false, tuDong = false, xemTruocTuDong = false) => {
    const so = ++luot.current;
    setDang(true); setLoi(null);
    if (moKhoa) {
      ghi("unlock_clicked", { mo_dun: moDun ?? (duongDan.includes("battu") ? "battu" : "tuvi"), kind: tuDong ? "tu_dong" : "bam" });
      ghiChoMo(duongDan, nguoi);   // đi đăng nhập / nạp rồi quay lại → tự mở đúng báo cáo này
    }
    try {
      const d = await postJson<BaoCao>(duongDan, than ?? { la_so: laSo }, moKhoa ? { "x-mo-khoa": "1" } : {});
      if (so !== luot.current) return;
      setBc(d);
      if (moKhoa || !d.so_khoa) xoaChoMo();
      if (moKhoa && d.phi.ly_do === "da_tru_sao") ghi("unlock_succeeded", { mo_dun: d.mo_dun, so_sao: d.phi.sao });
      // Bản xem trước tự tải (bản đồ con số) đo riêng, không làm phồng tỉ lệ paywall của các mảng bấm mới mở.
      else if (d.so_khoa) ghi("paywall_viewed", { mo_dun: d.mo_dun, kind: xemTruocTuDong ? "luan_giai_tu_dong" : "luan_giai_toan_bo" });
    } catch (e) { if (so === luot.current) setLoi(e instanceof Error ? e.message : "Chưa tải được luận giải."); }
    finally { if (so === luot.current) setDang(false); }
  };
  // CTA-1: báo trạng thái báo cáo cho nút Sao ở khối "Đọc tiếp" cuối trang — nút đó gọi đúng hàm mở của báo cáo này.
  const taiRef = useRef(tai);
  taiRef.current = tai;
  useEffect(() => dangKyCuaLuanGiai({
    moDun: maCua, daTai: Boolean(bc), soKhoa: bc?.so_khoa ?? 0, tongChuong: bc?.chuong.length ?? 0,
    mo: () => void taiRef.current(true), doc: () => void taiRef.current(),
  }), [maCua, bc]);

  // Quay lại sau khi đăng nhập / nạp Sao → tự mở đúng báo cáo đang xem dở (cùng lá số, trong 30 phút). Một lần.
  const daTuMo = useRef(false);
  useEffect(() => {
    if (laSo && nguoi && !daTuMo.current && dangChoMo(duongDan, nguoi)) { daTuMo.current = true; void tai(true, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi lá số sẵn sàng
  }, [Boolean(laSo && nguoi)]);

  // Bản đồ con số: chương Tổng quan hiện ngay (điểm chuyển từ tổng quan sang chiều sâu). Đổi người / cách tính → tải lại.
  // Chạy SAU hiệu ứng tự mở ở trên: lượt đầu đang tự mở khoá (quay về từ đăng nhập / nạp Sao) thì không tải bản xem trước.
  const khoaTuMo = tuMo ? JSON.stringify(than ?? laSo) : "";
  const lanDauTuMo = useRef(true);
  useEffect(() => {
    if (!khoaTuMo) return;
    const boQua = lanDauTuMo.current && daTuMo.current;
    lanDauTuMo.current = false;
    if (!boQua) void tai(false, false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ theo khoá đầu vào
  }, [khoaTuMo]);

  // Bản lưu: bỏ khối phí/ví (không thuộc nội dung bài). Cùng đối tượng cho mỗi báo cáo → tự lưu đúng một lần.
  const banLuu = useMemo(() => (bc ? { ...bc, phi: undefined } : null), [bc]);

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
          {/* Trục 1 (báo cáo UX mục 9): đang miễn phí thì nói trước, trung tính, Sao là gì + giá dự kiến (lấy từ API phí,
              không ghi cứng). Không đếm ngược, không doạ. */}
          {phi && !phi.thu && phi.gia > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-fg-faint" data-testid="gia-du-kien">
              Sao là điểm dùng trong ứng dụng để mở các bài đọc sâu, không đổi ra tiền. Sau giai đoạn ra mắt, chương đầu vẫn
              miễn phí, mở cả bài dự kiến {phi.gia} Sao.{" "}
              <Link href="/dieu-khoan#sao" className="whitespace-nowrap text-fg-muted underline underline-offset-4 hover:text-fg">Sao là gì?</Link>
            </p>
          )}
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
  const mangQua = mangLuanGiai(bc.mo_dun) ?? mangLuanGiai(maCua);
  const tang = DA_MO_BANG_SAO.has(bc.phi?.ly_do) && mangQua ? <TangChuong moDun={mangQua} /> : null;
  const chuongQua = bc.phi?.chuong_tang ? bc.phi.chuong_tang_ma : undefined;
  if (laBaoCaoDoiSong(bc)) {
    const coAi = bc.chuong.some((c) => !c.khoa && c.van_ai);
    // KC-1: một khuôn cho mọi mảng — Tử vi, Bát tự, Bản đồ con số cùng component; chỉ Tử vi lưu bài (LG-ĐS).
    const tenLuu = { tuvi: "Luận giải Tử vi", battu: "Luận giải Bát tự", thanso: "Bản đồ con số" }[bc.mo_dun] ?? "Luận giải";
    return (
      <BaoCaoDoiSongView bc={bc} ten={ten} goc={goc} nhan={bc.mo_dun === "thanso" ? "Bản đồ con số" : "Luận giải toàn bộ"} chuongQua={chuongQua}
        hanhDong={<>
          {coAi && (
            <Button variant="ghost" size="sm" aria-pressed={goc} onClick={() => setGoc((v) => !v)}>
              {goc ? "Xem bản diễn đạt" : "Xem bản dữ liệu gốc"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>
        </>}
        phanKhoa={bc.so_khoa ? <PhanKhoa bc={bc as unknown as BaoCao} dang={dang} loi={loi} moKhoa={() => void tai(true)} /> : null}
        chanTrang={!bc.so_khoa && banLuu ? (
          <div className="mt-6">
            <LuuBaiLuan moDun={bc.mo_dun} tieuDe={`${tenLuu} — ${hs?.ho_ten ?? "hồ sơ của bạn"}`} noiDung={banLuu}
              dangNhap={bc.phi?.dang_nhap} />
            {tang}
          </div>
        ) : tang}
      />
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
            {c.ma === chuongQua && <ChuQua />}
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
      {tang}
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
