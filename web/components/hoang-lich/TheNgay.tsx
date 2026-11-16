"use client";
// HL-1 — thẻ hoàng lịch một ngày. Engine tính, web chỉ hiển thị. Lời lẽ theo kiểu "sách lịch cổ ghi…", không doạ.
// Giờ hoàng đạo "sắp tới" tính theo đồng hồ giờ Việt Nam của máy người xem (chỉ khi thẻ là hôm nay).
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { CalendarHeart, Clock, Compass, MoonStar, Sparkles, Sunrise, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import type { GioNgay, MucNghiKy, NgayTot } from "@/lib/hoang-lich";
import { duongNgay, duongViecThang, homNayVN } from "@/lib/hoang-lich";
import { dinhNgay } from "@/lib/dinh-dang";
import { VongGio, canhGioHienTai } from "./VongGio";
import { useChuLich } from "./chu-lich";
import { tenTheo, type TenHien } from "@/lib/ten-hien";

/** Giờ hiện tại (phút trong ngày, giờ VN) + canh giờ của NGÀY ĐANG XEM (dùng chung với vòng giờ; 23:xx = 12, đã qua). */
function canhGioVN(d: Date): { i: number; phut: number } {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d);
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0), m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return { i: canhGioHienTai(d) ?? 12, phut: h * 60 + m };
}

function GioSapToi({ gio, ten }: { gio: GioNgay[]; ten: (ma: string) => string }) {
  const { c, en } = useChuLich();
  const [bay, setBay] = useState<{ i: number; phut: number } | null>(null);
  useEffect(() => {
    const capNhat = () => setBay(canhGioVN(new Date()));
    capNhat();
    const t = setInterval(capNhat, 60_000);
    return () => clearInterval(t);
  }, []);
  if (!bay) return null;
  const hien = gio[bay.i];
  if (hien?.hoang_dao) {
    return <p className="text-sm text-jade" data-testid="gio-dang">{en ? c("gio.dang", { chi: ten(hien.chi), khung: hien.khung }) : <>Bây giờ đang là giờ {hien.chi} hoàng đạo ({hien.khung}).</>}</p>;
  }
  // Giờ hoàng đạo kế tiếp trong hôm nay (không vòng sang ngày mai: Tý đầu ngày đã qua).
  const ke = gio.findIndex((g, i) => i > bay.i && g.hoang_dao);
  if (ke < 0) return <p className="text-sm text-fg-muted" data-testid="gio-dang">{c("gio.da_qua")}</p>;
  const batDau = ke * 120 - 60;                       // Sửu = 01:00, Dần = 03:00…
  const con = batDau - bay.phut;
  const chu = en ? (con >= 60 ? c("gio.gio_phut", { h: String(Math.floor(con / 60)), m: String(con % 60) }) : c("gio.phut", { m: String(con) }))
    : con >= 60 ? `${Math.floor(con / 60)} giờ ${con % 60} phút` : `${con} phút`;
  if (en) return <p className="text-sm" data-testid="gio-dang">{c("gio.ke")} <b className="text-gold">{ten(gio[ke]!.chi)}</b> ({gio[ke]!.khung}){c("gio.con", { con: chu })}</p>;
  return (
    <p className="text-sm" data-testid="gio-dang">
      Giờ hoàng đạo kế tiếp: <b className="text-gold">{gio[ke]!.chi}</b> ({gio[ke]!.khung}) — còn {chu}.
    </p>
  );
}

/** Lời nhắc cho việc y tế / pháp lý (engine `luu_y`): sách lịch ghi kiêng chữa bệnh không có nghĩa là hoãn đi khám. */
function LuuYViec({ ds }: { ds: MucNghiKy[] }) {
  const ly = [...new Set(ds.map((x) => x.luu_y).filter((x): x is string => !!x))];
  if (!ly.length) return null;
  return <div className="mt-3 space-y-1 text-xs text-fg-muted" data-testid="luu-y-viec">{ly.map((x) => <p key={x}>{x}</p>)}</div>;
}

function Chip({ ten, nghia, tone }: { ten: string; nghia?: string; tone: "tot" | "ky" | "trung" }) {
  const lop = tone === "tot" ? "border-jade/40 text-jade" : tone === "ky" ? "border-cinnabar/40 text-cinnabar" : "border-line text-fg-muted";
  return <span title={nghia} className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm ${lop}`}>{ten}</span>;
}

export function TheNgay({ d, gon = false }: { d: NgayTot; gon?: boolean }) {
  const { c, en, ma, ngay: hienNgay } = useChuLich();
  const laHomNay = d.ngay === homNayVN();
  const nhanNgay = d.hoang_dao ? c("the.hoang_dao") : c("the.hac_dao");
  // SEO-O2: heading mang ngày cụ thể → mỗi mục tự đứng được khi Google / AI trích riêng (trước "Giờ hoàng đạo", "Xuất hành"…).
  const nd = hienNgay(d.ngay);
  // EN-ALL GĐ 8: mã chi (giờ) bản Anh đọc qua `ten_hien` engine trả; bản Việt giữ nguyên mã.
  const tenChi = (x: string) => tenTheo((d as NgayTot & { ten_hien?: TenHien }).ten_hien, en)("chi", x);
  return (
    <div className="space-y-4" data-testid="the-ngay">
      <div className="bau-troi p-5 sm:p-7">
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <VongGio gio={d.gio} laHomNay={laHomNay} tieuDe={d.than.ten} phuDe={d.hoang_dao ? c("the.hoang_dao_hoa") : c("the.hac_dao_hoa")} tenChi={tenChi}
            className="mx-auto w-full max-w-[15rem]" />
          <div>
            {en ? <>
              <p className="text-sm text-fg-muted">{dinhNgay(d.ngay, ma, "day_du")}</p>
              <p className="mt-1 font-serif text-4xl leading-tight sm:text-5xl">
                <span className="text-2xl text-fg-muted sm:text-3xl">{c("the.am_dau")} </span><span className="text-gradient-gold">{d.am.ngay}</span>
                <span className="text-2xl text-fg-muted sm:text-3xl">{c("the.am", { thang: String(d.am.thang), nhuan: d.am.nhuan ? c("the.nhuan") : "" })}</span>
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-fg-muted"><MoonStar className="size-4 text-moon" aria-hidden />
                {c("the.can_chi", { ngay: d.can_chi.ngay, thang: d.can_chi.thang, nam: d.can_chi.nam })}</p>
            </> : <>
            <p className="text-sm text-fg-muted">{d.thu} · {d.ngay.split("-").reverse().join("/")}</p>
            <p className="mt-1 font-serif text-4xl leading-tight sm:text-5xl">
              <span className="text-gradient-gold">{d.am.ngay}</span>
              <span className="text-2xl text-fg-muted sm:text-3xl"> tháng {d.am.thang}{d.am.nhuan ? " nhuận" : ""} âm lịch</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-fg-muted"><MoonStar className="size-4 text-moon" aria-hidden />
              Ngày <b className="font-semibold text-fg">{d.can_chi.ngay}</b> · tháng {d.can_chi.thang} · năm {d.can_chi.nam}</p>
            </>}
            <p className="mt-3">
              <span data-testid="nhan-hoang-dao"
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${d.hoang_dao ? "nhan-sang bg-gold/15 text-gold" : "border border-moon/50 bg-moon/10 text-moon"}`}>
                {nhanNgay} · {d.than.ten}
              </span>
            </p>
            {d.nghi.length > 0 && (
              <p className="mt-3 text-sm" data-testid="hop-nhat">{c("the.hop_nhat")}{" "}
                <b className="text-jade">{d.nghi.slice(0, 3).map((x) => x.ten.toLowerCase()).join(", ")}</b></p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">{c("the.truc")}</p>
            <p className="mt-1 text-lg" data-testid="truc">{d.truc.ten} <span className="text-sm text-fg-muted">— {d.truc.y}</span></p>
            <p className="mt-1 text-xs text-fg-muted">{en ? c("the.hop", { hop: d.truc.hop }) : <>Hợp: {d.truc.hop}</>}</p>
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">{c("the.sao")}</p>
            <p className="mt-1 text-lg">{d.tu.ten} <span className="text-sm text-fg-muted">— {d.tu.tot ? c("the.sao_tot") : c("the.sao_xau")}</span></p>
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">{c("the.xung")}</p>
            <p className="mt-1 text-lg">{en ? c("the.xung_tuoi", { ten: d.xung_tuoi.ten }) : <>Tuổi {d.xung_tuoi.ten}</>}</p>
            <p className="mt-1 text-xs text-fg-muted">{en ? c("the.sat", { huong: d.sat }) : <>Sát hướng {d.sat}</>}</p>
          </div>
        </div>
        {d.ky_dan_gian.length > 0 && (
          <p className="mt-3 text-sm text-moon" data-testid="ky-dan-gian">
            {d.ky_dan_gian.map((k) => `${k.ten}: ${k.nghia}`).join(" · ")}
          </p>
        )}
        {(d.nhan_tap_quan?.length ?? 0) > 0 && (
          <details className="mt-3 text-sm" data-testid="nhan-tap-quan">
            <summary className="cursor-pointer text-fg-muted">
              {`${c("the.tap_quan")} `}<b className="text-fg">{d.nhan_tap_quan!.map((k) => k.ten).join(", ")}</b>
            </summary>
            <ul className="mt-2 space-y-2 text-fg-muted">
              {d.nhan_tap_quan!.map((k) => (
                <li key={k.ma}><b className="text-fg">{k.ten}</b>: {k.nghia}. {k.nguon} {k.luu_y}</li>
              ))}
            </ul>
          </details>
        )}
        {d.tuoi && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] p-3 text-sm" data-testid="tuoi-ban">
            <UserRound className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <span>{`${c("the.tuoi_ban")} `}<b>{d.tuoi.can_chi}</b>{d.tuoi.uoc_luong ? c("the.uoc_luong") : ""}: <b>{d.tuoi.quan_he.ten}</b> — {d.tuoi.quan_he.nghia}.</span>
          </p>
        )}
      </div>

      <section aria-labelledby="gio-hd" className="glass rounded-2xl p-5">
        <h2 id="gio-hd" className="inline-flex items-center gap-2 text-lg"><Clock className="size-5 text-gold" aria-hidden />{en ? c("the.gio_hd", { ngay: nd }) : <>Giờ hoàng đạo ngày {nd}</>}</h2>
        {laHomNay && <div className="mt-2"><GioSapToi gio={d.gio} ten={tenChi} /></div>}
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="gio-hoang-dao">
          {d.gio_hoang_dao.map((g) => (
            <li key={g.chi} className="rounded-xl border border-gold/30 px-3 py-2 text-sm">
              <b className="text-gold">{tenChi(g.chi)}</b> <span className="text-fg-muted">{g.khung}</span>
              <span className="block text-xs text-fg-faint">{g.than}</span>
            </li>
          ))}
        </ul>
        {d.ghi_chu_gio_ty && <p className="mt-2 text-xs text-fg-muted">{d.ghi_chu_gio_ty}</p>}
      </section>

      <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
        <section aria-labelledby="nen" className="glass rounded-2xl p-5">
          <h2 id="nen" className="inline-flex items-center gap-2 text-lg"><ThumbsUp className="size-5 text-jade" aria-hidden />{en ? c("the.nen", { ngay: nd }) : <>Ngày {nd} nên làm gì</>}</h2>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="nghi">
            {d.nghi.length ? d.nghi.map((x) => <Chip key={x.ma} ten={x.ten} nghia={x.nghia} tone="tot" />)
              : <p className="text-sm text-fg-muted">{c("the.khong_nen")}</p>}
          </div>
          <LuuYViec ds={d.nghi} />
        </section>
        <section aria-labelledby="ky" className="glass rounded-2xl p-5">
          <h2 id="ky" className="inline-flex items-center gap-2 text-lg"><ThumbsDown className="size-5 text-cinnabar" aria-hidden />{en ? c("the.ky", { ngay: nd }) : <>Ngày {nd} kiêng làm gì</>}</h2>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="ky">
            {d.ky.length ? d.ky.map((x) => <Chip key={x.ma} ten={x.ten} nghia={x.nghia} tone="ky" />)
              : <p className="text-sm text-fg-muted">{c("the.khong_ky")}</p>}
          </div>
          <LuuYViec ds={d.ky} />
        </section>
      </div>

      {d.viec_lon && d.viec_lon.length > 0 && <ViecLon d={d} />}
      {d.con_giap && d.con_giap.length === 12 && <ConGiap d={d} />}

      {(d.nghi.length > 0 || d.ky.length > 0) && (
        <details className="glass rounded-2xl px-5 py-3 text-sm" data-testid="giai-nghia-nghi-ky">
          <summary className="cursor-pointer text-gold">{c("the.giai_nghia")}</summary>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {[...d.nghi, ...d.ky].filter((x) => x.nghia).map((x) => (
              <div key={x.ma} className="flex gap-1.5"><dt className="font-medium">{x.ten}:</dt><dd className="text-fg-muted">{x.nghia}{x.ten_goc && <span className="text-fg-faint">{en ? c("the.ten_goc", { ten: x.ten_goc }) : <> · sách xưa ghi: {x.ten_goc}</>}</span>}</dd></div>
            ))}
          </dl>
        </details>
      )}

      {!gon && (
        <>
          <section aria-labelledby="xuat-hanh" className="glass rounded-2xl p-5">
            <h2 id="xuat-hanh" className="inline-flex items-center gap-2 text-lg"><Compass className="size-5 text-gold" aria-hidden />{en ? c("the.xuat_hanh", { ngay: nd }) : <>Hướng xuất hành ngày {nd}</>}</h2>
            {en ? <p className="mt-2 text-sm">{c("the.huong", { hy: d.huong.hy_than, tai: d.huong.tai_than, phuc: d.huong.phuc_than })}</p>
              : <p className="mt-2 text-sm">Hướng Hỷ thần: <b>{d.huong.hy_than}</b> · Tài thần: <b>{d.huong.tai_than}</b> · Phúc thần: <b>{d.huong.phuc_than}</b></p>}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-gold">{c("the.gio_xuat_hanh")}</summary>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {d.gio.map((g) => (
                  <li key={g.chi}><b>{tenChi(g.chi)}</b> <span className="text-fg-muted">{g.khung}</span> —{" "}
                    <span className={g.xuat_hanh.tot ? "text-jade" : "text-fg-muted"}>{g.xuat_hanh.ten}</span>
                    <span className="block text-xs text-fg-faint">{g.xuat_hanh.nghia}</span></li>
                ))}
              </ul>
            </details>
          </section>

          <details className="glass rounded-2xl p-5 text-sm">
            <summary className="cursor-pointer text-lg">{c("the.than_sat")}</summary>
            <p className="mt-3"><span className="text-jade">{c("the.cat_than")}</span> {d.cat_than.map((x) => x.nghia ? `${x.ten} (${x.nghia})` : x.ten).join(", ") || "—"}</p>
            <p className="mt-2"><span className="text-cinnabar">{c("the.hung_sat")}</span> {d.hung_sat.map((x) => x.nghia ? `${x.ten} (${x.nghia})` : x.ten).join(", ") || "—"}</p>
            <p className="mt-2"><span className="text-fg-muted">{c("the.banh_to")}</span> {d.banh_to.join(" · ")}</p>
            <p className="mt-2"><span className="text-fg-muted">{c("the.thai_than")}</span> {d.thai_than}</p>
          </details>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={duongNgay(d.ngay_mai.ngay, en)} className="glass flex items-start gap-3 rounded-2xl p-4 hover:border-gold/50" data-testid="ngay-mai">
          <Sunrise className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          {en ? <span className="text-sm"><span className="text-fg-muted">{c("the.ngay_mai", { am: d.ngay_mai.am })}</span>{" "}
            {c("the.ngay_mai_dao", { dao: d.ngay_mai.hoang_dao ? c("the.hoang_dao_ngan") : c("the.hac_dao_ngan"), truc: d.ngay_mai.truc })}
            {d.ngay_mai.ky_dan_gian.length > 0 && ` · ${d.ngay_mai.ky_dan_gian.join(", ")}`}</span>
          : <span className="text-sm"><span className="text-fg-muted">Ngày mai ({d.ngay_mai.am} âm):</span>{" "}
            {d.ngay_mai.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} · trực {d.ngay_mai.truc}
            {d.ngay_mai.ky_dan_gian.length > 0 && ` · ${d.ngay_mai.ky_dan_gian.join(", ")}`}</span>}
        </Link>
        {d.ngay_tot_gan && (
          <Link href={duongNgay(d.ngay_tot_gan.ngay, en)} className="glass flex items-start gap-3 rounded-2xl p-4 hover:border-gold/50" data-testid="ngay-tot-gan">
            <CalendarHeart className="mt-0.5 size-5 shrink-0 text-jade" aria-hidden />
            {en ? <span className="text-sm"><span className="text-fg-muted">{c("the.ngay_tot_gan", { tuoi: d.tuoi ? c("the.ngay_tot_gan_tuoi") : "" })}</span>{" "}
              {c("the.ngay_tot_gan_con", { ngay: hienNgay(d.ngay_tot_gan.ngay), so: String(d.ngay_tot_gan.con_ngay), than: d.ngay_tot_gan.than, truc: d.ngay_tot_gan.truc })}</span>
            : <span className="text-sm"><span className="text-fg-muted">Ngày đẹp gần nhất{d.tuoi ? " (không xung tuổi bạn)" : ""}:</span>{" "}
              {d.ngay_tot_gan.ngay.split("-").reverse().join("/")} — còn {d.ngay_tot_gan.con_ngay} ngày · {d.ngay_tot_gan.than}, trực {d.ngay_tot_gan.truc}</span>}
          </Link>
        )}
      </div>

      {en ? <p className="flex gap-2 text-xs text-fg-faint"><Sparkles className="size-3.5 shrink-0" aria-hidden />{d.luu_y}{c("the.nguon", { nguon: d.nguon })}
        {d.trang_thai === "nhap_ai" ? c("the.nhap_ai") : ""}</p>
      : <p className="flex gap-2 text-xs text-fg-faint"><Sparkles className="size-3.5 shrink-0" aria-hidden />{d.luu_y} Nguồn: {d.nguon}.
        {d.trang_thai === "nhap_ai" ? " Phần giải nghĩa đời thường đang chờ chuyên gia thẩm định." : ""}</p>}
    </div>
  );
}

const NHAN_VIEC = { tot: "viec.tot", binh: "viec.binh", tranh: "viec.tranh" } as const;

/** SEO-P — "tử vi ngày … của 12 con giáp" (Search Console): mỗi con giáp một dòng quan hệ với chi ngày. Engine tính bằng
 *  đúng hàm quan hệ tuổi của hồ sơ, lời ở KB; web chỉ hiển thị. Không chấm điểm, chỉ tập quán dân gian. */
const MAU_CON_GIAP: Record<string, string> = { tam_hop: "text-jade", luc_hop: "text-jade", xung: "text-gold", hai: "text-moon", trung: "text-moon" };
function ConGiap({ d }: { d: NgayTot }) {
  const { c, ngay: hienNgay } = useChuLich();
  return (
    <section aria-labelledby="con-giap" className="glass rounded-2xl p-5" data-testid="con-giap">
      <h2 id="con-giap" className="text-lg">{c("cg.tieu_de", { ngay: hienNgay(d.ngay) })}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {d.con_giap!.map((x) => (
          <li key={x.chi} className="rounded-xl border border-line/70 px-3 py-2 text-sm" data-ma={x.ma ?? "binh"}>
            <b>{c("cg.tuoi", { chi: x.chi })}</b> <span className={MAU_CON_GIAP[x.ma ?? ""] ?? "text-fg-muted"}>· {x.ten}</span>
            <span className="mt-0.5 block text-xs text-fg-muted">{x.nghia.charAt(0).toUpperCase() + x.nghia.slice(1)}.</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-fg-faint">{c("cg.ghi_chu")}</p>
    </section>
  );
}

/** 6b-1 — 6 việc lớn chấm bằng ĐÚNG luật của trang "ngày tốt {việc} tháng": sách ghi Nên mà vướng mục Kiêng (vd nên cưới
 *  gả nhưng kiêng Dạm ngõ) thì không gọi là ngày tốt — hai trang nói cùng một kết luận. Engine chấm, web chỉ hiển thị. */
function ViecLon({ d }: { d: NgayTot }) {
  const { c, en, ngay: hienNgay } = useChuLich();
  const m = Number(d.ngay.slice(5, 7)), y = Number(d.ngay.slice(0, 4));
  return (
    <section aria-labelledby="viec-lon" className="glass rounded-2xl p-5" data-testid="viec-lon">
      <h2 id="viec-lon" className="inline-flex items-center gap-2 text-lg"><CalendarHeart className="size-5 text-gold" aria-hidden />{en ? c("viec.tieu_de", { ngay: hienNgay(d.ngay) }) : <>Ngày {hienNgay(d.ngay)} có hợp cưới hỏi, khai trương, động thổ?</>}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {d.viec_lon!.map((v) => (
          <li key={v.ma} data-danh-gia={v.danh_gia}>
            <Link href={duongViecThang(v.slug, y, m, en)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
              <b>{v.ten}</b>{" "}
              <span className={v.danh_gia === "tot" ? "text-jade" : v.danh_gia === "tranh" ? "text-moon" : "text-fg-muted"}>· {c(NHAN_VIEC[v.danh_gia])}</span>
              <span className="mt-0.5 block text-xs text-fg-muted">{v.chu.charAt(0).toUpperCase() + v.chu.slice(1)}.</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-fg-faint">{c("viec.ghi_chu")}</p>
    </section>
  );
}
