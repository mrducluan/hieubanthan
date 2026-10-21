"use client";
// CTA-1 — "Đọc tiếp về bạn": khối cuối phần xem của MỌI trang công cụ (đặt trong CuoiBaiDoc → chỉ hiện khi đã có kết quả).
// Khâu vòng tăng trưởng: QUAY LẠI / TRẢI NGHIỆM (gợi chéo sang mảng khác, đo cross_cta_viewed → cross_cta_clicked theo
// `tu` → `den`), MỜI (thẻ Bản đồ 5 mảng, link hợp đôi), NẠP SAO (mở chương khoá của Luận giải toàn bộ, sao_cta_clicked)
// và ỦNG HỘ (donate_cta_clicked). Mọi câu "luận giải nhỏ" do engine ghép (/v1/goi-y-cheo) từ con số đã tính + KB — web
// chỉ hiển thị. Chưa có hồ sơ → engine trả câu chung mời nhập. Không lưu gì; sự kiện chỉ mang mã.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BookOpenText, CalendarHeart, HeartHandshake, LockKeyhole, Sun, UserPlus } from "lucide-react";
import { BieuTuongManh } from "@/components/chia-se/TheBanDo";
import { KhungTheBanDo, NutTheBanDo } from "@/components/chia-se/NutTheBanDo";
import { UngHoThe } from "@/components/ung-ho/UngHoThe";
import { ghi } from "@/lib/do-luong";
import { EASE } from "@/lib/chuyen-dong";
import { cuonToiLuanGiai, useCuaLuanGiai } from "@/lib/cta-sao";
import { chiSoNgay, GoiYCheo, LUAN_GIAI_CUA_TRANG, TIEU_DE_KHOI, yeuCauGoiY, type MangTrang, type TheGoiY } from "@/lib/goi-y-cheo";
import { useHoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { cn } from "@/lib/utils";

const SO_THE = 3;

function BieuTuong({ ma, className }: { ma: string; className?: string }) {
  if (ma === "so" || ma === "than_so") return <BieuTuongManh ma="so" className={className} />;
  if (ma === "tu_vi") return <BieuTuongManh ma="sao" className={className} />;
  if (ma === "bat_tu") return <BieuTuongManh ma="nhat_chu" className={className} />;
  if (ma === "phong_thuy") return <BieuTuongManh ma="phi" className={className} />;
  if (ma === "kinh_dich") return <BieuTuongManh ma="que" className={className} />;
  if (ma === "hop_doi") return <HeartHandshake className={className} aria-hidden />;
  if (ma === "xem_ngay") return <CalendarHeart className={className} aria-hidden />;
  return <Sun className={className} aria-hidden />;
}

/** Chòm sao nhỏ trang trí góc thẻ (hình khác nhau theo vị trí thẻ). */
function ChomGoc({ i }: { i: number }) {
  const ds = [[[8, 30], [26, 12], [46, 22], [58, 6]], [[6, 10], [24, 26], [44, 14], [56, 30]], [[10, 20], [28, 6], [40, 28], [58, 16]]][i % 3]!;
  return (
    <svg viewBox="0 0 64 36" className="pointer-events-none absolute right-3 top-3 h-9 w-16 text-gold/50" aria-hidden>
      <polyline points={ds.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
      {ds.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k === 1 ? 1.8 : 1.2} fill="currentColor" />)}
    </svg>
  );
}

function TheGoi({ t, i, tu, bienThe, giam }: { t: TheGoiY; i: number; tu: MangTrang; bienThe: string; giam: boolean }) {
  return (
    <motion.li className="min-w-0"
      {...(giam ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.5, delay: i * 0.12, ease: EASE } })}>
      <Link href={t.duong} data-testid="the-goi-y" data-mang={t.mang} data-ca-nhan={t.ca_nhan ? "1" : "0"}
        onClick={() => ghi("cross_cta_clicked", { tu, den: t.mang, ca_nhan: t.ca_nhan ? 1 : 0, bien_the: bienThe })}
        className="glass relative flex h-full flex-col rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
        <ChomGoc i={i} />
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/50 bg-[#1a1530] text-gold">
            <BieuTuong ma={t.mang} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{t.ten}</p>
            <p className="truncate text-sm font-semibold text-gold" data-testid="nhan-goi-y">{t.nhan}</p>
          </div>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-fg" data-testid="cau-goi-y">{t.cau}</p>
        <p className="mt-2 font-serif text-[1.05rem] italic leading-snug text-moon">{t.cau_hoi}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gold">
          {t.cta} <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    </motion.li>
  );
}

/** Nút Sao: trang có Luận giải toàn bộ → mở đúng báo cáo đang xem (luồng SAO-2: đăng nhập / đồng ý / nạp nhanh). Trang
 *  khác → dẫn sang Luận giải toàn bộ Tử vi (12 chương). Công tắc thu Sao tắt → ghi "đang miễn phí". */
function NutSao({ tu, thu, gia }: { tu: MangTrang; thu: boolean; gia: number }) {
  const cua = useCuaLuanGiai();
  const c = LUAN_GIAI_CUA_TRANG[tu] ? cua : null;
  const coLuanGiai = c !== null;
  if (c && c.daTai && c.soKhoa === 0) return null;          // đã đọc trọn — không mời nữa
  const khoa = c?.daTai ? c.soKhoa : 0;
  const tieuDe = coLuanGiai
    ? khoa > 0 ? `Mở ${khoa} chương còn lại` : thu ? "Đọc miễn phí chương đầu" : "Đọc luận giải toàn bộ"
    : "Luận giải toàn bộ Tử vi · 12 chương";
  const phu = coLuanGiai
    ? khoa > 0 ? `${gia} Sao mở trọn · xem lại cả ngày không mất thêm` : thu ? `trọn bộ ${gia} Sao, chương đầu miễn phí` : "đang miễn phí giai đoạn ra mắt"
    : thu ? `chương đầu miễn phí · trọn bộ ${gia} Sao` : "đang miễn phí giai đoạn ra mắt";
  const bam = () => {
    ghi("sao_cta_clicked", { tu, so_chuong: khoa });
    if (!c) return;
    cuonToiLuanGiai();
    if (khoa > 0) c.mo(); else if (!c.daTai) c.doc();
  };
  const noiDung = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
        {khoa > 0 ? <LockKeyhole className="size-5" aria-hidden /> : <BookOpenText className="size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-serif text-lg leading-snug text-fg">{tieuDe}</span>
        <span className="block text-xs text-gold/90">{phu}</span>
        <span className="mt-1.5 block text-xs leading-relaxed text-fg-muted">
          {coLuanGiai ? "Mỗi chương bám đúng dữ liệu đã tính từ ngày giờ sinh của bạn, kèm câu hỏi để tự soi."
            : "Công việc, tiền bạc, tình cảm, nhà cửa… mỗi chương bám đúng lá số của bạn."}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-gold" aria-hidden />
    </>
  );
  const lop = "flex min-h-11 w-full items-center gap-3 rounded-2xl border border-gold/40 bg-gold/[0.06] p-4 transition hover:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
  return coLuanGiai
    ? <button type="button" onClick={bam} className={lop} data-testid="cta-sao" data-khoa={khoa}>{noiDung}</button>
    : <Link href="/tu-vi" onClick={bam} className={lop} data-testid="cta-sao" data-khoa={0}>{noiDung}</Link>;
}

export function CuoiPhanXem({ mang }: { mang: MangTrang }) {
  const hs = useHoSo();
  const quyUoc = useQuyUocDD();
  const giam = Boolean(useReducedMotion());
  const [d, setD] = useState<GoiYCheo | null>(null);
  const [tieu, setTieu] = useState<(typeof TIEU_DE_KHOI)[number]>(TIEU_DE_KHOI[0]);
  const [moThe, setMoThe] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const khoa = hs === undefined ? null : JSON.stringify(yeuCauGoiY(mang, hs, quyUoc));
  useEffect(() => {
    if (khoa === null) return;
    let huy = false;
    setTieu(TIEU_DE_KHOI[chiSoNgay(TIEU_DE_KHOI.length)] ?? TIEU_DE_KHOI[0]);
    fetch("/api/goi-y-cheo", { method: "POST", headers: { "content-type": "application/json" }, body: khoa })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const p = j ? GoiYCheo.safeParse(j) : null; if (!huy && p?.success) setD(p.data); })
      .catch(() => { /* khối phụ — lỗi thì không hiện, không làm vỡ trang */ });
    return () => { huy = true; };
  }, [khoa]);

  // Đo một lần mỗi phiên mỗi trang khi khối lọt vào màn hình.
  const daDo = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !d || daDo.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && !daDo.current) {
        daDo.current = true;
        ghi("cross_cta_viewed", { tu: mang, ca_nhan: d.ca_nhan ? 1 : 0, bien_the: tieu.ma });
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [d, mang, tieu.ma]);

  if (!d) return null;
  const the = d.the.slice(0, SO_THE);
  return (
    <section ref={ref} aria-labelledby={`doc-tiep-${mang}`} className="mt-12 space-y-5" data-testid="cuoi-phan-xem" data-tu={mang}>
      <header>
        <p className="eyebrow text-gold/80">{d.ca_nhan ? "Viết riêng từ ngày sinh của bạn" : "Mỗi môn nhìn bạn một góc"}</p>
        <h2 id={`doc-tiep-${mang}`} className="mt-1 font-serif text-2xl sm:text-3xl" data-bien-the={tieu.ma}>{tieu.lon}</h2>
        <p className="mt-1 text-sm text-fg-muted">{d.ca_nhan ? tieu.nho : "Nhập ngày sinh một lần — mọi mảng tự viết riêng cho bạn."}</p>
      </header>

      <ul className="grid gap-4 md:grid-cols-3">
        {the.map((t, i) => <TheGoi key={t.mang} t={t} i={i} tu={mang} bienThe={tieu.ma} giam={giam} />)}
      </ul>

      <div className={cn("grid gap-4", hs ? "md:grid-cols-2" : "")}>
        <NutSao tu={mang} thu={Boolean(d.thu_sao)} gia={d.gia_sao ?? 10} />
        {hs && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-line/70 p-4" data-testid="cta-chia-se">
            <p className="text-sm text-fg-muted">
              <b className="text-fg">5 mảnh ghép làm nên bạn</b> trong một tấm thẻ — gửi bạn bè đoán thử đường đời của bạn.
            </p>
            {moThe ? <p className="text-xs text-gold">Thẻ đang ghép ngay bên dưới ↓</p> : <NutTheBanDo onMo={() => setMoThe(true)} />}
            {mang !== "hop_doi" && (
              <Link href="/hop-doi" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
                onClick={() => ghi("cross_cta_clicked", { tu: mang, den: "hop_doi_moi", ca_nhan: 1, bien_the: tieu.ma })}>
                <UserPlus className="size-4" aria-hidden /> Mời một người xem hai bạn hợp ở đâu
              </Link>
            )}
          </div>
        )}
      </div>

      {hs && moThe && <KhungTheBanDo hoSo={hs} tu={mang} />}

      {d.ung_ho && <UngHoThe tu={mang} />}
    </section>
  );
}
