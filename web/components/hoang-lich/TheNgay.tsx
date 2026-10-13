"use client";
// HL-1 — thẻ hoàng lịch một ngày. Engine tính, web chỉ hiển thị. Lời lẽ theo kiểu "sách lịch cổ ghi…", không doạ.
// Giờ hoàng đạo "sắp tới" tính theo đồng hồ giờ Việt Nam của máy người xem (chỉ khi thẻ là hôm nay).
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarHeart, Clock, Compass, MoonStar, Sparkles, Sunrise, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import type { GioNgay, NgayTot } from "@/lib/hoang-lich";
import { duongNgay, homNayVN } from "@/lib/hoang-lich";
import { VongGio, canhGioHienTai } from "./VongGio";

/** Giờ hiện tại (phút trong ngày, giờ VN) + canh giờ của NGÀY ĐANG XEM (dùng chung với vòng giờ; 23:xx = 12, đã qua). */
function canhGioVN(d: Date): { i: number; phut: number } {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d);
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0), m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return { i: canhGioHienTai(d) ?? 12, phut: h * 60 + m };
}

function GioSapToi({ gio }: { gio: GioNgay[] }) {
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
    return <p className="text-sm text-jade" data-testid="gio-dang">Bây giờ đang là giờ {hien.chi} hoàng đạo ({hien.khung}).</p>;
  }
  // Giờ hoàng đạo kế tiếp trong hôm nay (không vòng sang ngày mai: Tý đầu ngày đã qua).
  const ke = gio.findIndex((g, i) => i > bay.i && g.hoang_dao);
  if (ke < 0) return <p className="text-sm text-fg-muted" data-testid="gio-dang">Hôm nay đã qua các giờ hoàng đạo — xem giờ của ngày mai.</p>;
  const batDau = ke * 120 - 60;                       // Sửu = 01:00, Dần = 03:00…
  const con = batDau - bay.phut;
  const chu = con >= 60 ? `${Math.floor(con / 60)} giờ ${con % 60} phút` : `${con} phút`;
  return (
    <p className="text-sm" data-testid="gio-dang">
      Giờ hoàng đạo kế tiếp: <b className="text-gold">{gio[ke]!.chi}</b> ({gio[ke]!.khung}) — còn {chu}.
    </p>
  );
}

function Chip({ ten, nghia, tone }: { ten: string; nghia?: string; tone: "tot" | "ky" | "trung" }) {
  const lop = tone === "tot" ? "border-jade/40 text-jade" : tone === "ky" ? "border-cinnabar/40 text-cinnabar" : "border-line text-fg-muted";
  return <span title={nghia} className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm ${lop}`}>{ten}</span>;
}

export function TheNgay({ d, gon = false }: { d: NgayTot; gon?: boolean }) {
  const laHomNay = d.ngay === homNayVN();
  const nhanNgay = d.hoang_dao ? "Ngày Hoàng đạo" : "Ngày Hắc đạo";
  return (
    <div className="space-y-4" data-testid="the-ngay">
      <div className="bau-troi p-5 sm:p-7">
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <VongGio gio={d.gio} laHomNay={laHomNay} tieuDe={d.than.ten} phuDe={d.hoang_dao ? "HOÀNG ĐẠO" : "HẮC ĐẠO"}
            className="mx-auto w-full max-w-[15rem]" />
          <div>
            <p className="text-sm text-fg-muted">{d.thu} · {d.ngay.split("-").reverse().join("/")}</p>
            <p className="mt-1 font-serif text-4xl leading-tight sm:text-5xl">
              <span className="text-gradient-gold">{d.am.ngay}</span>
              <span className="text-2xl text-fg-muted sm:text-3xl"> tháng {d.am.thang}{d.am.nhuan ? " nhuận" : ""} âm lịch</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-fg-muted"><MoonStar className="size-4 text-moon" aria-hidden />
              Ngày <b className="font-semibold text-fg">{d.can_chi.ngay}</b> · tháng {d.can_chi.thang} · năm {d.can_chi.nam}</p>
            <p className="mt-3">
              <span data-testid="nhan-hoang-dao"
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${d.hoang_dao ? "nhan-sang bg-gold/15 text-gold" : "border border-moon/50 bg-moon/10 text-moon"}`}>
                {nhanNgay} · {d.than.ten}
              </span>
            </p>
            {d.nghi.length > 0 && (
              <p className="mt-3 text-sm" data-testid="hop-nhat">Sách lịch ghi hôm nay hợp nhất cho:{" "}
                <b className="text-jade">{d.nghi.slice(0, 3).map((x) => x.ten.toLowerCase()).join(", ")}</b></p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">Trực</p>
            <p className="mt-1 text-lg" data-testid="truc">{d.truc.ten} <span className="text-sm text-fg-muted">— {d.truc.y}</span></p>
            <p className="mt-1 text-xs text-fg-muted">Hợp: {d.truc.hop}</p>
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">Sao (nhị thập bát tú)</p>
            <p className="mt-1 text-lg">{d.tu.ten} <span className="text-sm text-fg-muted">— {d.tu.tot ? "sao tốt" : "sao trung/xấu theo sách"}</span></p>
          </div>
          <div className="rounded-xl border border-line/70 bg-bg/40 p-3">
            <p className="text-xs uppercase tracking-wider text-fg-muted">Xung</p>
            <p className="mt-1 text-lg">Tuổi {d.xung_tuoi.ten}</p>
            <p className="mt-1 text-xs text-fg-muted">Sát hướng {d.sat}</p>
          </div>
        </div>
        {d.ky_dan_gian.length > 0 && (
          <p className="mt-3 text-sm text-moon" data-testid="ky-dan-gian">
            {d.ky_dan_gian.map((k) => `${k.ten}: ${k.nghia}`).join(" · ")}
          </p>
        )}
        {d.tuoi && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] p-3 text-sm" data-testid="tuoi-ban">
            <UserRound className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <span>Tuổi bạn <b>{d.tuoi.can_chi}</b>{d.tuoi.uoc_luong ? " (tính theo năm sinh)" : ""}: <b>{d.tuoi.quan_he.ten}</b> — {d.tuoi.quan_he.nghia}.</span>
          </p>
        )}
      </div>

      <section aria-labelledby="gio-hd" className="glass rounded-2xl p-5">
        <h2 id="gio-hd" className="inline-flex items-center gap-2 text-lg"><Clock className="size-5 text-gold" aria-hidden />Giờ hoàng đạo</h2>
        {laHomNay && <div className="mt-2"><GioSapToi gio={d.gio} /></div>}
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="gio-hoang-dao">
          {d.gio_hoang_dao.map((g) => (
            <li key={g.chi} className="rounded-xl border border-gold/30 px-3 py-2 text-sm">
              <b className="text-gold">{g.chi}</b> <span className="text-fg-muted">{g.khung}</span>
              <span className="block text-xs text-fg-faint">{g.than}</span>
            </li>
          ))}
        </ul>
        {d.ghi_chu_gio_ty && <p className="mt-2 text-xs text-fg-muted">{d.ghi_chu_gio_ty}</p>}
      </section>

      <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
        <section aria-labelledby="nen" className="glass rounded-2xl p-5">
          <h2 id="nen" className="inline-flex items-center gap-2 text-lg"><ThumbsUp className="size-5 text-jade" aria-hidden />Sách lịch ghi nên</h2>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="nghi">
            {d.nghi.length ? d.nghi.map((x) => <Chip key={x.ma} ten={x.ten} nghia={x.nghia} tone="tot" />)
              : <p className="text-sm text-fg-muted">Sách không ghi việc nên riêng cho ngày này.</p>}
          </div>
        </section>
        <section aria-labelledby="ky" className="glass rounded-2xl p-5">
          <h2 id="ky" className="inline-flex items-center gap-2 text-lg"><ThumbsDown className="size-5 text-cinnabar" aria-hidden />Sách lịch ghi kiêng</h2>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="ky">
            {d.ky.length ? d.ky.map((x) => <Chip key={x.ma} ten={x.ten} nghia={x.nghia} tone="ky" />)
              : <p className="text-sm text-fg-muted">Sách không ghi việc kiêng riêng cho ngày này.</p>}
          </div>
        </section>
      </div>

      {(d.nghi.length > 0 || d.ky.length > 0) && (
        <details className="glass rounded-2xl px-5 py-3 text-sm" data-testid="giai-nghia-nghi-ky">
          <summary className="cursor-pointer text-gold">Giải nghĩa các việc nên / kiêng</summary>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {[...d.nghi, ...d.ky].filter((x) => x.nghia).map((x) => (
              <div key={x.ma} className="flex gap-1.5"><dt className="font-medium">{x.ten}:</dt><dd className="text-fg-muted">{x.nghia}</dd></div>
            ))}
          </dl>
        </details>
      )}

      {!gon && (
        <>
          <section aria-labelledby="xuat-hanh" className="glass rounded-2xl p-5">
            <h2 id="xuat-hanh" className="inline-flex items-center gap-2 text-lg"><Compass className="size-5 text-gold" aria-hidden />Xuất hành</h2>
            <p className="mt-2 text-sm">Hướng Hỷ thần: <b>{d.huong.hy_than}</b> · Tài thần: <b>{d.huong.tai_than}</b> · Phúc thần: <b>{d.huong.phuc_than}</b></p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-gold">Giờ xuất hành theo Lý Thuần Phong</summary>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {d.gio.map((g) => (
                  <li key={g.chi}><b>{g.chi}</b> <span className="text-fg-muted">{g.khung}</span> —{" "}
                    <span className={g.xuat_hanh.tot ? "text-jade" : "text-fg-muted"}>{g.xuat_hanh.ten}</span>
                    <span className="block text-xs text-fg-faint">{g.xuat_hanh.nghia}</span></li>
                ))}
              </ul>
            </details>
          </section>

          <details className="glass rounded-2xl p-5 text-sm">
            <summary className="cursor-pointer text-lg">Thần sát, Bành Tổ, thai thần</summary>
            <p className="mt-3"><span className="text-jade">Cát thần:</span> {d.cat_than.map((x) => x.nghia ? `${x.ten} (${x.nghia})` : x.ten).join(", ") || "—"}</p>
            <p className="mt-2"><span className="text-cinnabar">Hung sát:</span> {d.hung_sat.map((x) => x.nghia ? `${x.ten} (${x.nghia})` : x.ten).join(", ") || "—"}</p>
            <p className="mt-2"><span className="text-fg-muted">Bành Tổ bách kỵ (câu dân gian):</span> {d.banh_to.join(" · ")}</p>
            <p className="mt-2"><span className="text-fg-muted">Thai thần:</span> {d.thai_than}</p>
          </details>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={duongNgay(d.ngay_mai.ngay)} className="glass flex items-start gap-3 rounded-2xl p-4 hover:border-gold/50" data-testid="ngay-mai">
          <Sunrise className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <span className="text-sm"><span className="text-fg-muted">Ngày mai ({d.ngay_mai.am} âm):</span>{" "}
            {d.ngay_mai.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} · trực {d.ngay_mai.truc}
            {d.ngay_mai.ky_dan_gian.length > 0 && ` · ${d.ngay_mai.ky_dan_gian.join(", ")}`}</span>
        </Link>
        {d.ngay_tot_gan && (
          <Link href={duongNgay(d.ngay_tot_gan.ngay)} className="glass flex items-start gap-3 rounded-2xl p-4 hover:border-gold/50" data-testid="ngay-tot-gan">
            <CalendarHeart className="mt-0.5 size-5 shrink-0 text-jade" aria-hidden />
            <span className="text-sm"><span className="text-fg-muted">Ngày đẹp gần nhất{d.tuoi ? " (không xung tuổi bạn)" : ""}:</span>{" "}
              {d.ngay_tot_gan.ngay.split("-").reverse().join("/")} — còn {d.ngay_tot_gan.con_ngay} ngày · {d.ngay_tot_gan.than}, trực {d.ngay_tot_gan.truc}</span>
          </Link>
        )}
      </div>

      <p className="flex gap-2 text-xs text-fg-faint"><Sparkles className="size-3.5 shrink-0" aria-hidden />{d.luu_y} Nguồn: {d.nguon}.
        {d.trang_thai === "nhap_ai" ? " Phần giải nghĩa đời thường đang chờ chuyên gia thẩm định." : ""}</p>
    </div>
  );
}

