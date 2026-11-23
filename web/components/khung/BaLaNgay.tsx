"use client";
// BT-UI — khối "Ba lá của ngày" trên Hôm nay (thay Lá bài đầu ngày; docs/DE-XUAT-BAN-THAN-HOM-NAY.md mục 3): ba lá úp —
// Lá Tarot riêng của bạn · Lá Con số · Lá Thời khắc. Chạm từng lá để lật; lật đủ ba hiện "Ba lá ghép lại" + chia sẻ ảnh ba
// lá (mã ký, không ngày sinh). Engine chọn và soạn mọi chữ (ba_la trong /v1/thanso/hom-nay); web chỉ lật, nhớ lá đã lật
// trên máy và chọn "giờ tốt sắp tới" trong danh sách engine trả theo đồng hồ máy. Bản hợp pháp thay gacha: tất định,
// miễn phí, không giải thưởng, không khoá lá sau nút chia sẻ, không đếm ngược; chữ không "trúng / thưởng / quay".
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Clock, Sparkles } from "lucide-react";
import Link from "@/components/khung/Lien";
import { MatSau, MatTruoc } from "@/components/tarot/LaBai";
import { HopGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import { cn } from "@/lib/utils";
import { boChuGiai } from "@/lib/ten-hien";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { tenGoi, type HoSo } from "@/lib/hoso";
import { useNguoiDung } from "@/lib/tai-khoan";
import { useMaCuaToi } from "@/lib/sao";
import { coTaiKhoan } from "@/lib/supabase/trinh-duyet";
import { docNhatKy, ghiLa, ghiTarot, thongKeThang } from "@/lib/nhat-ky-ngay";
import { duongMoi } from "@/lib/duong-silo";
import { useChuHomNay } from "@/components/khung/chu-hom-nay";
import { useDuong } from "@/components/khung/NgonNgu";
import { tenTheo, type TenHien } from "@/lib/ten-hien";
import { baLaDaLat, chuConPhut, gioSapToi, MA_NHAT_KY, nhoBaLa, phutCuaNgay, TEN_BA_LA, THU_TU_BA_LA, type BaLa, type MaBaLa } from "@/lib/ba-la";

const thangCua = (iso: string): [number, number] => [Number(iso.slice(0, 4)), Number(iso.slice(5, 7))];
const GIAY = "bg-[#f3ead6] text-[#2a2140]";

/** Mặt ngửa của hai lá không phải Tarot — cùng khổ, cùng nền giấy ngà với lá Tarot. */
function MatGiay({ nhan, children, chan }: { nhan: string; children: React.ReactNode; chan: string }) {
  return (
    <div className={cn("flex size-full flex-col items-center justify-between rounded-[9px] border-[3px] border-gold px-1.5 py-2.5 text-center", GIAY)}>
      <span className="text-[0.56rem] font-semibold uppercase leading-tight tracking-[0.14em] opacity-70 sm:text-[0.62rem]">{nhan}</span>
      <span className="flex flex-1 items-center justify-center">{children}</span>
      <span className="font-serif text-[0.78rem] leading-tight sm:text-sm">{chan}</span>
    </div>
  );
}

export function BaLaNgay({ baLa, ngay, hoSo, tieuDe = "Ba lá của ngày", tenHien }: { baLa: BaLa; ngay: string; hoSo: HoSo; tieuDe?: string;
  /** EN-ALL GĐ 8: tên hiển thị của trường mã (chi giờ, tên quẻ) — bản Anh. */ tenHien?: TenHien }) {
  // EN-ALL GĐ 8: chữ từ lib/chu/hom-nay.ts; bản Anh không có thẻ chia sẻ ba lá (thẻ chưa có bản Anh).
  const { c, en, conPhut } = useChuHomNay();
  const d = useDuong();
  const ten = tenTheo(tenHien, en);
  const tenLa = (ma: MaBaLa) => (en ? c(`bl.ten.${ma}`) : TEN_BA_LA[ma]);
  const giam = Boolean(useReducedMotion());
  const [lat, setLat] = useState<MaBaLa[] | null>(null);   // null = chưa đọc máy
  const [xem, setXem] = useState<MaBaLa | null>(null);      // lá đang đọc
  const [phut, setPhut] = useState<number | null>(null);    // đồng hồ máy (chỉ đọc ở trình duyệt)
  const [soNgayLat, setSoNgayLat] = useState(0);
  const [the, setThe] = useState<{ ma: string; tu: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [moHop, setMoHop] = useState(false);
  const noiDung = useRef<HTMLDivElement>(null);
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  useEffect(() => {
    const d = baLaDaLat(ngay);
    setLat(d);
    setXem(d[d.length - 1] ?? null);
    setPhut(phutCuaNgay(ngay));
    setSoNgayLat(thongKeThang(docNhatKy(hoSo), ...thangCua(ngay)).so_la);
    const h = window.setInterval(() => setPhut(phutCuaNgay(ngay)), 60_000);
    return () => window.clearInterval(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hoSo đổi thì trang dựng lại
  }, [ngay]);
  if (lat === null) return null;

  const du = lat.length === THU_TU_BA_LA.length;
  const { tarot, so, thoi_khac: tk } = baLa;
  const sap = phut === null ? null : gioSapToi(tk.gio, phut);
  const chuGio = sap ? (en ? c("bl.gio", { chi: ten("chi", sap.gio.chi), khung: sap.gio.khung }) : `Giờ ${sap.gio.chi} (${sap.gio.khung})`) : null;
  const tenQue = tk.que ? ten("que_ten", tk.que.ten) : "";

  function latLa(ma: MaBaLa) {
    if (!lat) return;
    if (lat.includes(ma)) { setXem(ma); return; }
    const moi = [...lat, ma];
    setLat(moi); setXem(ma); nhoBaLa(ngay, moi);
    ghi("daily_card_flipped", { kind: ma, thu_tu: moi.length, ...(moi.length === THU_TU_BA_LA.length ? { du_ba: 1 } : {}) });
    // KV-THANG: ngày có lật lá vào nhật ký tháng (máy; tài khoản qua diem_danh 0032 — gọi lại trong ngày không cộng chuỗi).
    setSoNgayLat(thongKeThang(ghiLa(hoSo, ngay, MA_NHAT_KY[ma]), ...thangCua(ngay)).so_la);
    if (ma === "tarot") ghiTarot(hoSo, ngay, tarot.id, tarot.ten);   // chỉ trên máy: tổng kết tháng kể lại lá đã gặp
    if (coTaiKhoan()) void fetch("/api/sao/chuoi", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ la: MA_NHAT_KY[ma] }) }).catch(() => null);
    // Điện thoại: lời đọc nằm dưới hàng lá → lật xong cuộn nhẹ tới nếu chưa nằm trong màn hình.
    window.setTimeout(() => {
      const el = noiDung.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 64 && r.top <= window.innerHeight - 160) return;
      el.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "nearest" });
    }, giam ? 0 : 700);
  }

  // Riêng tư: tên lá Tarot riêng chỉ vào lời nhắn soạn sẵn khi engine cho phép (lá băm có muối) — như trên thẻ.
  const loiNhan = `Ba lá của mình hôm nay: ${baLa.chia_se_tarot ? `${tarot.ten} · ` : ""}ngày ${so.so}${tk.que ? ` · quẻ ${tk.que.ten}` : ""}. Còn ba lá của bạn?`;
  // Link dựng lúc GỬI (không nhớ sẵn): mã mời ?gt= về muộn sau lần bấm đầu vẫn được gắn.
  const linkThe = (t: { ma: string; tu: string }) => {
    const u = new URL(`/the/ba-la/${t.ma}`, window.location.origin);
    u.searchParams.set("tu", t.tu);
    if (maCuaToi) u.searchParams.set("gt", maCuaToi);
    return u.toString();
  };
  async function chiaSe() {
    setDang(true); setLoi(null);
    try {
      let t = the;
      if (!t) {
        const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/ba-la",
          { ten_hien_thi: tenGoi(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, ngay_xem: ngay });
        t = { ma, tu };
        setThe(t);
        ghi("share_created", { kind: "ba_la", ma_moi: tu, co_ma: Boolean(maCuaToi) });
      }
      setMoHop(true);   // HCS-1: hộp chia sẻ chung
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }

  const mat: Record<MaBaLa, React.ReactNode> = {
    tarot: <MatTruoc la={tarot} />,
    so: <MatGiay nhan={c("bl.ngay_cn")} chan={so.viec?.ten ?? c("bl.viec_nho")}><span className="font-serif text-5xl leading-none sm:text-6xl">{so.so}</span></MatGiay>,
    thoi_khac: (
      <MatGiay nhan={sap?.dang ? c("bl.dang_gio") : c("bl.sap_gio")} chan={tk.que ? (en ? c("bl.que", { ten: tenQue }) : `Quẻ ${tk.que.ten}`) : tk.hoang_dao ? c("bl.hoang_dao") : c("bl.gio_hd")}>
        <span className="flex flex-col items-center gap-1">
          <Clock className="size-6 opacity-70" aria-hidden />
          <span className="font-serif text-2xl leading-none sm:text-3xl">{sap ? (en ? boChuGiai(ten("chi", sap.gio.chi)) : sap.gio.chi) : "—"}</span>
          {sap && <span className="text-[0.62rem] tabular-nums opacity-80">{sap.gio.khung}</span>}
        </span>
      </MatGiay>
    ),
  };

  return (
    <section id="ba-la" data-neo aria-labelledby="ba-la-h" className="glass scroll-mt-24 rounded-2xl p-5" data-testid="ba-la" data-lat={lat.length}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ba-la-h" className="text-xl">{tieuDe}</h2>
        <span className="text-xs text-fg-muted" data-testid="ba-la-tien-do">{du ? c("bl.du") : lat.length ? (en ? c("bl.da_lat", { so: String(lat.length) }) : `đã lật ${lat.length}/3`) : c("bl.moi_ngay")}</span>
      </div>
      {!lat.length && <p className="mt-1 text-sm text-fg-muted">{c("bl.dan")}</p>}

      <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3 sm:gap-4" role="group" aria-label={c("bl.aria")}>
        {THU_TU_BA_LA.map((ma) => {
          const daLat = lat.includes(ma);
          return (
            <div key={ma} className="space-y-1.5 text-center">
              <button type="button" onClick={() => latLa(ma)} aria-pressed={xem === ma} data-testid={`ba-la-${ma}`} data-lat={daLat ? 1 : 0}
                aria-label={daLat ? c("bl.doc", { ten: en ? tenLa(ma).toLowerCase() : TEN_BA_LA[ma] }) : c("bl.lat", { ten: en ? tenLa(ma).toLowerCase() : TEN_BA_LA[ma] })}
                className={cn("relative block w-full rounded-[9px] shadow-card outline-none transition-transform focus-visible:ring-2 focus-visible:ring-gold",
                  !daLat && "hover:-translate-y-1", xem === ma && daLat && "ring-2 ring-gold/70")}
                style={{ aspectRatio: "120 / 200", perspective: 900 }}>
                <div className="la-lat relative size-full" style={{ transformStyle: "preserve-3d", transform: daLat ? "rotateY(180deg)" : "rotateY(0deg)", transition: giam ? "none" : "transform 600ms cubic-bezier(.45,0,.25,1)" }}>
                  <div className="absolute inset-0 overflow-hidden rounded-[9px]" style={{ backfaceVisibility: "hidden" }}><MatSau /></div>
                  <div className="absolute inset-0 overflow-hidden rounded-[9px]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} aria-hidden={!daLat}>
                    {daLat && mat[ma]}
                  </div>
                </div>
              </button>
              <p className={cn("text-xs", xem === ma && daLat ? "font-medium text-gold" : "text-fg-muted")}>{tenLa(ma)}</p>
            </div>
          );
        })}
      </div>

      <div ref={noiDung} className="mt-4 scroll-mt-28 text-sm" aria-live="polite">
        {xem === "tarot" && (
          <div className="space-y-2" data-testid="ba-la-doc-tarot">
            <p className="text-xs font-medium text-moon">{c("bl.tarot_nhan")}</p>
            <h3 className="text-xl">{tarot.ten} {tarot.en && !en && <span className="text-base text-fg-faint">({tarot.en})</span>}</h3>
            <ul className="flex flex-wrap gap-1.5">{tarot.tu_khoa.map((k) => <li key={k} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg-muted">{k}</li>)}</ul>
            <p className="text-[0.95rem] leading-relaxed text-fg">{tarot.y}</p>
            <p><b className="text-jade">{c("bl.viec_lam")}</b> {tarot.viec}</p>
            <p className="italic text-fg-muted">{tarot.cau_tu_soi}</p>
            <p className="text-xs">
              {tarot.duong && <><Link href={d(duongMoi(tarot.duong))} className="text-gold hover:underline">{en ? c("bl.doc_ky", { ten: tarot.ten }) : <>Đọc kỹ lá {tarot.ten}</>}</Link> · </>}
              <Link href={d("/tarot")} className="text-gold hover:underline" onClick={() => ghi("cross_cta_clicked", { tu: "la_bai", den: "tarot" })}>{c("bl.rut")}</Link>
            </p>
          </div>
        )}
        {xem === "so" && (
          <div className="space-y-2" data-testid="ba-la-doc-so">
            <p className="text-xs font-medium text-moon">{en ? c("bl.so_nhan", { so: String(so.so) }) : <>Con số của ngày · việc nhỏ hợp ngày {so.so}</>}</p>
            {so.viec ? (
              <>
                <h3 className="text-xl">{so.viec.nhan ?? so.viec.ten}</h3>
                <p className="text-[0.95rem] leading-relaxed text-fg">{so.viec.cach_lam}</p>
                {so.viec.tu_soi && <p className="italic text-fg-muted">{so.viec.tu_soi}</p>}
              </>
            ) : <h3 className="text-xl">{en ? c("bl.ngay_cn_so", { so: String(so.so) }) : <>Ngày cá nhân {so.so}</>}</h3>}
            {so.cau_hoi && <p className="rounded-xl border border-moon/30 bg-moon/5 px-3 py-2"><span className="text-xs uppercase tracking-wider text-moon">{c("bl.cau_hoi")}</span><span className="mt-0.5 block text-fg">{so.cau_hoi}</span></p>}
          </div>
        )}
        {xem === "thoi_khac" && (
          <div className="space-y-2" data-testid="ba-la-doc-thoi_khac">
            <p className="text-xs font-medium text-moon">{c("bl.tk_nhan")}</p>
            <h3 className="text-xl" data-testid="ba-la-gio">
              {sap ? <>{sap.dang ? c("bl.trong_gio") : c("bl.sap")}{chuGio}</> : c("bl.da_qua")}
            </h3>
            {sap && (en ? <p className="text-fg-muted">{c(sap.dang ? "bl.con" : "bl.nua", { than: sap.gio.than, con: conPhut(sap.conPhut) })}</p>
              : <p className="text-fg-muted">{sap.gio.than} · {sap.dang ? `còn ${chuConPhut(sap.conPhut)}` : `${chuConPhut(sap.conPhut)} nữa`}. Hợp để bắt đầu việc bạn đã chuẩn bị.</p>)}
            {!sap && <p className="text-fg-muted">{c("bl.toi")}</p>}
            {tk.nen.length > 0 && <p><span className="text-jade">{c("bl.nen")}</span> {tk.nen.join(", ")}</p>}
            {tk.kieng.length > 0 && <p><span className="text-[#f0b35c]">{c("bl.kieng")}</span> {tk.kieng.join(", ")}</p>}
            {tk.que && (en ? (
              <p><b>{c("bl.que_dau", { ten: tenQue })}</b> {tk.que.y}{" "}
                {tk.que.duong && <Link href={d(duongMoi(tk.que.duong))} className="text-gold hover:underline">{c("bl.doc_que")}</Link>}</p>
            ) : (
              <p><b>Quẻ đầu ngày — {tk.que.ten}:</b> {tk.que.y}{" "}
                {tk.que.duong && <Link href={duongMoi(tk.que.duong)} className="text-gold hover:underline">Đọc quẻ</Link>}</p>
            ))}
          </div>
        )}
      </div>

      {du && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/[0.06] p-4" data-testid="ba-la-ghep">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold"><Sparkles className="size-3.5" aria-hidden />{` ${c("bl.ghep")}`}</p>
          <dl className="mt-2 grid gap-1.5 text-sm sm:grid-cols-[6.5rem_1fr]">
            <dt className="text-fg-muted">{c("bl.mang")}</dt><dd>{tarot.ten} — {tarot.tu_khoa.join(", ")}</dd>
            {so.viec && <><dt className="text-fg-muted">{c("bl.viec")}</dt><dd>{so.viec.nhan ?? so.viec.cach_lam}</dd></>}
            <dt className="text-fg-muted">{c("bl.thoi_diem")}</dt><dd>{sap ? (en ? c(sap.dang ? "bl.td_trong" : "bl.td_sap", { gio: chuGio ?? "" }) : `${sap.dang ? "Đang trong" : "Sắp tới"} ${chuGio?.replace(/^Giờ/, "giờ")}`) : c("bl.td_qua")}</dd>
          </dl>
          {!en && <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <NutRuBan nhan={dang ? "Đang tạo…" : CTA_CHIA_SE.ba_la.nhan} nho dang={dang} onClick={() => void chiaSe()} testId="ba-la-chia-se" />
          </div>
          {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
          <HopGui mo={moHop} onMoChange={setMoHop} tieuDeHop="Gửi ba lá của bạn"
            gui={the && {
              kind: "ba_la", url: linkThe(the), tu: the.tu, tieuDe: "Ba lá của ngày",
              anh: `/og/ba-la?ma=${encodeURIComponent(the.ma)}`, anhDoc: `/og/ba-la?ma=${encodeURIComponent(the.ma)}&khung=doc`,
              tenTep: "ba-la-hom-nay.png", testIdAnh: "ba-la-tai-anh",
              onLuuAnh: () => ghi("share_created", { kind: "ba_la_anh", ma_moi: the.tu }),
              loiNhan: [{ ma: "bl.cu", chu: loiNhan }, ...loiNhanThe("ba_la", { so: so.so, ten: tk.que?.ten ?? null })],
            }} />
          <p className="mt-2 text-xs text-fg-faint">{baLa.chia_se_tarot
            ? "Thẻ chia sẻ chỉ có tên hiển thị, ba lá và ngày xem — không có ngày sinh."
            : "Thẻ chia sẻ có tên hiển thị, con số và quẻ của ngày; lá Tarot riêng của bạn nằm úp trên thẻ. Không có ngày sinh."}</p>
          </>}
        </div>
      )}
      <p className="mt-3 text-xs text-fg-faint">
        {soNgayLat > 0 && <span data-testid="ba-la-thang">{soNgayLat === 1 ? c("bl.thang_1") : en ? c("bl.thang_n", { so: String(soNgayLat) }) : `Ngày thứ ${soNgayLat} bạn lật lá trong tháng này. `}</span>}
        {baLa.cach_chon}
      </p>
    </section>
  );
}
