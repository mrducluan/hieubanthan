// NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}": năm con gì, mệnh gì, Tết, Tam tai, 12 con giáp,
// mốc lễ, hạn năm + lối sang mọi trang tra theo tuổi của năm đó và "Năm {năm} của riêng bạn" (/thoi-gian-toi).
// Engine dựng toàn bộ dữ kiện (`/v1/nam/{nam}`); web chỉ hiển thị. Index năm âm hiện tại + năm sau.
// EN-ALL GĐ 8: /en/year/{năm} là rewrite của trang này (chữ lib/chu/nam-tuoi.ts, tên riêng qua `ten_hien`).
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { MoiXemRieng } from "@/components/nam/MoiXemRieng";
import { HeroTet2027 } from "@/components/nam/HeroTet2027";
import { DuongSongThienHa, IconDuKienTet } from "@/components/nam/HoaTietNam2027";
import { KhuLiXiTet2027 } from "@/components/nam/KhuLiXiTet2027";
import { TimNhanhNamSinh } from "@/components/nam/TimNhanhNamSinh";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, duongHanNam, duongLamNhaNam, duongSaoHanNam, duongXongDatNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { duongCuoiHoi, duongNam, duongNamTuoi, duongSinhCon, namCongKhai, namIndex } from "@/lib/nam";
import { duongLichAm, lichNgayChoNgay, lichNgayCongKhai } from "@/lib/lich-am";
import { LichAmTheoTab } from "@/components/lich-am/LichAmTheoTab";
import { homNayVN } from "@/lib/hoang-lich";
import { duongThang } from "@/lib/hoang-lich";
import { duongTrang, slugEnCua } from "@/lib/kien-thuc";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { CON_GIAP_EN, chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { boChuGiai, tenTheo } from "@/lib/ten-hien";
import { CHU_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const MENH_TOI = 2027;   // cụm "Sinh năm X mệnh gì" có tới năm này (engine kb/trang_menh.NAM_CUOI)

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const index = namIndex(n, await namAmHienTai());
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("nam.seo_tieu_de", b), moTa: c("nam.seo_mo_ta", b), duongVi: duongNam(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("nam.seo_tieu_de", b), moTa: c("nam.seo_mo_ta", b),
    duong: duongNam(n), anh: anhBai({ tieuDe: `Năm ${n}`, mang: "lich" }) }), duongNam(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const homNayIso = homNayVN();
  const [d, lich, lichNay] = await Promise.all([namCongKhai(n), lichNgayCongKhai(n), lichNgayChoNgay(homNayIso)]);
  if (!d) throw new Error("engine không phản hồi");
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu), ten = tenTheo(d.ten_hien, en);
  const duong = duongNam(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_NAM, nd.chu, ngonNgu);
  const L = (x: string) => lienNN(en, x), dHien = L(duong)!;
  const slugMenhEn = en && n <= MENH_TOI ? await slugEnCua("menh_nam", `sinh-nam-${n}-menh-gi`) : null;
  const tieuDe = c("dau.tieu_de", bien);
  const [tetY, tetM] = [Number(d.tet.slice(0, 4)), Number(d.tet.slice(5, 7))];
  const nb = { nam: n };
  const o: [string, string][] = [
    [t("nam.o_can_chi"), d.can_chi], [t("nam.o_menh"), t("nam.o_menh_gia_tri", { menh: ten("nap_am", d.nap_am.ten), hanh: ten("hanh", d.nap_am.hanh) })],
    [t("nam.o_tet"), ngayNN(en, d.tet)], [t("nam.o_giao_thua"), ngayNN(en, d.het_nam)],
    [t("nam.o_lap_xuan"), ngayNN(en, d.lap_xuan)], [t("nam.o_nhuan"), d.thang_nhuan ? t("nam.o_nhuan_thang", { n: d.thang_nhuan }) : t("nam.o_nhuan_khong")],
    [t("nam.o_nam_tuoi"), t("nam.o_tuoi", { x: d.nam_tuoi })], [t("nam.o_xung"), t("nam.o_tuoi", { x: d.xung })], [t("nam.o_hop"), t("nam.o_tuoi", { x: d.tuoi_hop.join(", ") })],
    [t("nam.o_ram"), ngayNN(en, d.moc.find((m) => m.ma === "ram_gieng")?.duong ?? d.tet)],
    [t("nam.o_tam_tai"), t("nam.o_tam_tai_gia_tri", { tuoi: d.tam_tai.tuoi.join(", "), n: String(d.tam_tai.nam_thu) })],
    [t("nam.o_so"), d.so_nam_the_gioi.so === d.so_nam_the_gioi.rut_gon ? String(d.so_nam_the_gioi.so) : `${d.so_nam_the_gioi.so} / ${d.so_nam_the_gioi.rut_gon}`],
  ];   // 12 ô: kín hàng ở lưới 2 và 3 cột
  // EN-ALL: bản Anh chỉ giữ lối sang trang đã mở bản Anh (lienNN → null thì bỏ); "Sinh năm X mệnh gì" dùng slug Anh của engine.
  const tra = ([
    { href: "#theo-tuoi", ten: t("nam.tra_theo_tuoi", nb), mo_ta: t("nam.tra_theo_tuoi_mo") },
    { href: L(duongSaoHanNam(n)), ten: t("nam.tra_sao_han", nb), mo_ta: t("nam.tra_sao_han_mo") },
    { href: L(duongLamNhaNam(n)), ten: t("nam.tra_lam_nha", nb), mo_ta: t("nam.tra_lam_nha_mo") },
    { href: L(duongCuoiHoi(n)), ten: t("nam.tra_cuoi", nb), mo_ta: t("nam.tra_cuoi_mo") },
    { href: L(duongSinhCon(n)), ten: t("nam.tra_sinh_con", nb), mo_ta: t("nam.tra_sinh_con_mo") },
    { href: L(duongXongDatNam(n)), ten: t("nam.tra_xong_dat", nb), mo_ta: t("nam.tra_xong_dat_mo") },
    { href: L(duongHanNam(n)), ten: t("nam.tra_han", nb), mo_ta: t("nam.tra_han_mo") },
    { href: L(duongLichAm(n)), ten: t("nam.tra_lich_am", nb), mo_ta: t("nam.tra_lich_am_mo") },
    { href: L(duongThang(tetY, tetM)), ten: t("nam.tra_thang", { thang: tetM, y: tetY }), mo_ta: t("nam.tra_thang_mo") },
    ...(n <= MENH_TOI ? [{ href: en ? (slugMenhEn ? lienNN(en, duongTrang("menh_nam", `sinh-nam-${n}-menh-gi`).replace(/\/[^/]+$/, `/${slugMenhEn}`)) : null) : duongTrang("menh_nam", `sinh-nam-${n}-menh-gi`), ten: t("nam.tra_menh", nb), mo_ta: t("nam.tra_menh_mo") }] : []),
  ] as { href: string | null; ten: string; mo_ta: string }[]).filter((x): x is { href: string; ten: string; mo_ta: string } => Boolean(x.href));
  const laTet2027 = n === 2027 && !en;
  const soNgayToiTet = (() => {
    if (!laTet2027) return null;
    const ms = Date.parse(`${d.tet}T00:00:00Z`) - Date.parse(`${homNayIso}T00:00:00Z`);
    const ngay = Math.round(ms / 86_400_000);
    return Number.isFinite(ngay) && ngay > 0 ? ngay : null;
  })();
  const iconTieuDiem: ("can_chi" | "menh" | "tet")[] = ["can_chi", "menh", "tet"];
  return (
    <div className={`mx-auto ${laTet2027 ? "max-w-4xl" : "max-w-3xl"}`}>
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`${d.can_chi} year`, "Vietnamese lunar calendar", "Lunar New Year"] })
          : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.can_chi}`, "Âm lịch Việt Nam", "Tết Nguyên đán"] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("muc.ten"), duong: L("/nam")! }, { ten: String(n), duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      {laTet2027 ? (
        <>
          <HeroTet2027
            hrefVeMuc={L("/nam")!}
            nhanVeMuc={t("nam.ve_muc")}
            nhanDuongDan={t("c.duong_dan")}
            nhanTren={c("dau.nhan_tren", bien)}
            tieuDe={tieuDe}
            nhanTraLoiNhanh={t("c.tra_loi_nhanh")}
            traLoiNhanh={d.tra_loi_nhanh}
            ngayTetHien={ngayNN(en, d.tet)}
            soNgayToiTet={soNgayToiTet}
            hrefCaNhan={L(`/thoi-gian-toi?nam=${n}`)}
            nhanCaNhan={c("ca_nhan.nut", bien)}
          />
          <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-6" />
        </>
      ) : (
        <>
          <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L("/nam")!} className="hover:underline">{t("nam.ve_muc")}</Link></nav>
          <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
          <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
          <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
            <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
          </section>
        </>
      )}

      <section className="mt-6" aria-labelledby="thong-tin">
        <h2 id="thong-tin" className="sr-only">{tp("nam.sr_thong_tin", nb)}</h2>
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" data-testid="o-nam">
          {o.map(([k, v], idx) => {
            const tieuDiem = laTet2027 && idx < 3;
            const laMenh = idx === 1;
            return (
              <div
                key={k}
                className={
                  tieuDiem
                    ? `rounded-2xl border p-3.5 shadow-sm ${
                        laMenh
                          ? "border-jade/35 bg-gradient-to-br from-[#0e433b]/30 to-surface/80"
                          : "border-gold/35 bg-gradient-to-br from-[#9e1b22]/20 to-surface/80"
                      } ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`
                    : `rounded-xl border border-line/70 p-3 ${laTet2027 ? "bg-surface/45 transition-colors hover:border-gold/40" : ""}`
                }
              >
                <dt className="flex items-center justify-between gap-2 text-xs text-fg-faint">
                  <span>{k}</span>
                  {tieuDiem && <IconDuKienTet loai={iconTieuDiem[idx]!} />}
                </dt>
                <dd className={tieuDiem ? `mt-1 font-serif text-lg font-medium leading-snug ${laMenh ? "text-jade" : "text-[#fff7e6]"}` : "mt-0.5 text-sm text-fg"}>
                  {v}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-2 text-xs text-fg-faint">{tp("nam.truoc_tet", { nam: n, can_chi: d.nam_truoc_tet.can_chi, nam_truoc: d.nam_truoc_tet.nam })}</p>
      </section>

      {/* LA-UI: lịch cả năm âm (chỉ bản Việt) — sau câu trả lời nhanh + 12 ô dữ kiện của năm. */}
      {!en && lich && <LichAmTheoTab hienTai={lichNay} namXem={lich} nam={n} homNay={homNayIso} className="mt-6" />}

      {laTet2027 && (
        <>
          <DuongSongThienHa />
          <KhuLiXiTet2027 />
        </>
      )}

      {L("/thoi-gian-toi") && <section className={`mt-8 rounded-2xl border p-5 ${laTet2027 ? "border-gold/30 bg-surface/55" : "border-line bg-surface/40"}`} aria-labelledby="ca-nhan" data-nosnippet="">
        <h2 id="ca-nhan" className="text-xl">{c("ca_nhan.tieu_de", bien)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c("ca_nhan.mo_ta", bien)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href={L(`/thoi-gian-toi?nam=${n}`)!} className="inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg" data-testid="nut-ca-nhan">{c("ca_nhan.nut", bien)}</Link>
          {!en && n === 2027 && (
            <Link href="/li-xi-tet-2027" className="inline-flex rounded-full border border-gold/50 px-5 py-2.5 text-sm font-medium text-gold hover:bg-gold/10" data-testid="nut-li-xi-2027">
              Tặng LÌ XÌ TẾT 2027 →
            </Link>
          )}
        </div>
      </section>}

      <section className="mt-8" aria-labelledby="tra">
        <h2 id="tra" className="text-2xl">{c("tra.tieu_de", bien)}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tra.map((x) => (
            <li key={x.href}><Link href={x.href} className={`block rounded-xl border border-line/70 p-3 transition-colors hover:border-gold/50 ${laTet2027 ? "bg-surface/40" : ""}`}>
              <span className="text-fg">{x.ten}</span><span className="mt-0.5 block text-xs text-fg-muted">{x.mo_ta}</span>
            </Link></li>
          ))}
        </ul>
      </section>

      {d.bang_con_giap.some((r) => r.nam_sinh_trang?.length) && (
        <section className="mt-8" aria-labelledby="theo-tuoi">
          {laTet2027 && <DuongSongThienHa className="mb-6 mt-2" />}
          <h2 id="theo-tuoi" className="text-2xl">{tp("nam.theo_tuoi_tieu_de", nb)}</h2>
          <p className="mt-1 text-sm text-fg-muted">{t("nam.theo_tuoi_mo_ta")}</p>
          {laTet2027 && <TimNhanhNamSinh nam={n} bang={d.bang_con_giap} />}
          <div className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="luoi-theo-tuoi">
            {d.bang_con_giap.filter((r) => r.nam_sinh_trang?.length).map((r) => (
              <div key={r.chi} className="flex items-center gap-3 rounded-xl border border-line/70 px-3 py-2.5">
                <span className={`w-12 shrink-0 font-serif text-lg ${r.quan_he === "tam_hop" || r.quan_he === "luc_hop" ? "text-jade" : r.quan_he === "binh" ? "text-fg" : "text-gold"}`} title={r.nhan}>{en ? CON_GIAP_EN[r.chi] ?? ten("chi", r.chi) : r.chi}</span>
                <span className="flex flex-wrap gap-1.5">
                  {r.nam_sinh_trang!.map((ns) => (
                    <Link key={ns} href={L(duongNamTuoi(n, ns))!} className="inline-flex min-h-9 items-center rounded-full border border-line px-3 text-sm tabular-nums text-fg-muted hover:border-gold/50 hover:text-fg">{ns}</Link>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-faint">{t("nam.theo_tuoi_chu_thich")}</p>
        </section>
      )}

      <section className="mt-8" aria-labelledby="con-giap">
        <h2 id="con-giap" className="text-2xl">{c("con_giap.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("con_giap.mo_ta", bien)}</p>
        <p className="mt-1 text-xs text-fg-faint">{t("nam.binh_thuong")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm" data-testid="bang-con-giap">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{t("nam.cot_tuoi")}</th><th className="pr-3">{tp("nam.cot_voi_nam", { con_giap: d.con_giap })}</th><th className="pr-3">{t("nam.cot_tam_tai")}</th><th>{t("nam.cot_nam_sinh")}</th></tr></thead>
            <tbody>
              {d.bang_con_giap.map((r) => (
                <tr key={r.chi} className="border-t border-line/50 align-top">
                  <td className="py-2 pr-3 font-medium text-fg">{en ? `${CON_GIAP_EN[r.chi] ?? ""} (${boChuGiai(ten("chi", r.chi))})` : r.chi}</td>
                  <td className="py-2 pr-3"><span className={r.quan_he === "tam_hop" || r.quan_he === "luc_hop" ? "font-medium text-jade" : r.quan_he === "binh" ? "text-fg-muted" : "font-medium text-gold"}>{r.nhan}</span>
                    {r.quan_he !== "binh" && <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{r.loi}</span>}</td>
                  <td className="py-2 pr-3">{r.tam_tai ? <span className="inline-flex rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-xs text-gold">{tp("c.Nam_thu", { n: r.tam_tai })}</span> : <span className="text-fg-faint">—</span>}</td>
                  <td className="py-2 text-xs text-fg-muted tabular-nums">{r.nam_sinh.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="moc">
        <h2 id="moc" className="text-2xl">{c("moc.tieu_de", bien)}</h2>
        <ul className="mt-3 divide-y divide-line/50 rounded-xl border border-line/70">
          {d.moc.map((m) => (
            <li key={m.ma} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-fg">{m.ten}</span><span className="tabular-nums text-fg-muted">{ngayNN(en, m.duong)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="han-nam">
        <h2 id="han-nam" className="text-2xl">{tp("nam.han_tieu_de", nb)}</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {d.han_nam.huong_tranh.map((h) => <li key={h.ma}><b className="text-fg">{h.ten}</b> <span className="text-fg-muted">{tp("nam.han_o_phuong", { phuong: ten("huong", h.phuong) })}</span></li>)}
        </ul>
        <p className="mt-2 text-sm text-fg-muted">{d.han_nam.moc} <Link href={L(duongHanNam(n))!} className="text-gold underline">{tp("nam.han_doc_ky", nb)}</Link>.</p>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{t("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="nam" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      {/* AUD-Q5 (chủ dự án 2026-11-03): câu "tập quán, không phải tiên đoán" ĐƯỢC trích — AI trích lời tục lệ phải kèm câu rào này. */}
      <p className="mt-8 text-sm text-fg-muted" data-testid="luu-y-tap-quan">{d.luu_y}</p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > 2006 && <Link href={L(duongNam(n - 1))!} className="text-gold underline">{tp("c.nam_n", { nam: n - 1 })}</Link>}
        {n < 2099 && <Link href={L(duongNam(n + 1))!} className="text-gold underline">{tp("c.nam_n", { nam: n + 1 })}</Link>}
      </p>
      <MoiXemRieng trang="nam" nam={n} className="mt-10" />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
