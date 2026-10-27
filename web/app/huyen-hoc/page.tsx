// HH-1 — hub "Huyền học" (trước 2026-10-27 là /kham-pha "Khám phá", 308 về đây — lib/chuyen-huong.json). Trang trụ của mọi
// công cụ ở gốc site (breadcrumb Trang chủ › Huyền học › {công cụ}, GioiThieuCongCu): trả lời "huyền học là gì", cho chọn
// theo câu hỏi đang băn khoăn, năm thẻ mảng kèm cụm tra cứu, công cụ lịch & tuổi, bảng so sánh, hỏi đáp.
// Khâu THU HÚT (từ khoá "huyền học" + liên kết xuống ~30 trang con) → công cụ. Đo: landing_viewed /huyen-hoc → reading_started.
// Mọi chữ cố định ở bảng chữ lib/chu/trang-tinh.ts (CHU_HUYEN_HOC) — sửa được ở CMS. Trang không tính gì.
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BookOpen, CalendarCheck, CalendarDays, Check, Compass, DoorOpen, HeartHandshake, Home, ListOrdered,
  MessageCircleQuestion, MoonStar, Navigation, Repeat, Sparkles, Sun, UserRound, type LucideIcon,
} from "lucide-react";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { HinhNguMang } from "@/components/trang-huyen-hoc/HinhNguMang";
import { ChipCan, DongHoSo } from "@/components/trang-huyen-hoc/HoSoHub";
import { HOI_HH, MANG_HH, lichHH, namNayVn } from "@/lib/huyen-hoc";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { anhBai, goiLd, ldAnh, ldDuongDan, ldHoiDap, ldThucThe, metaTrang, urlDayDu, siteUrl } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { apDungSeo, layDauNhieuTrang, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { taoChu } from "@/lib/chu-trang";
import { CHU_HUYEN_HOC, SO_HOI_DAP_HUYEN_HOC } from "@/lib/chu/trang-tinh";
import { mucSoTrang } from "@/lib/so-trang";
import { CHU_DE, dsCumTru, mucLuc } from "@/lib/kien-thuc";
import { AnhCmsHoac } from "@/components/cms/AnhCmsHoac";

const DUONG = "/huyen-hoc";
// Chữ SEO / H1 / lời dẫn mặc định một nguồn ở sổ trang (lib/so-trang.ts) — đọc lúc chạy, không lúc nạp module.
const macDinh = () => mucSoTrang(DUONG)!.mac_dinh;

export async function generateMetadata(): Promise<Metadata> {
  const md = macDinh();
  return apDungSeo(metaTrang({ tieuDe: md.tieu_de_seo!, moTa: md.mo_ta_seo!, duong: DUONG, md: `${DUONG}.md` }), await layNoiDungTrang(DUONG));
}

// Biểu tượng theo vị trí: câu băn khoăn (HOI_HH) và công cụ lịch & tuổi (lichHH) — đích + chữ ở lib/huyen-hoc.ts / bảng chữ.
const ICON_HOI: LucideIcon[] = [UserRound, HeartHandshake, Sparkles, MessageCircleQuestion, Home, CalendarCheck];
const ICON_LICH: LucideIcon[] = [Sun, CalendarCheck, Home, DoorOpen, Compass, Navigation, CalendarDays, Repeat];
const CACH: LucideIcon[] = [ListOrdered, BookOpen, MoonStar];   // SO_CACH_HH lớp

export default async function HuyenHoc() {
  const [nd, ds] = await Promise.all([layNoiDungTrang(DUONG), mucLuc()]);
  const c = taoChu(CHU_HUYEN_HOC, nd.chu);
  const MD = macDinh();
  const nam = namNayVn();
  const cum = Object.fromEntries(MANG_HH.map((m) => [m.khoa, dsCumTru(m.href).slice(0, 4)]));
  const dau = await layDauNhieuTrang(Object.values(cum).flat().map((x) => x.duong));
  const soBai = (khoa: string | null) => (khoa ? ds.filter((t) => t.loai === CHU_DE[khoa]!.loai).length : 0);
  const hoiDap = Array.from({ length: SO_HOI_DAP_HUYEN_HOC }, (_, i) => ({ hoi: c(`hoi_dap.hoi_${i + 1}`), dap: c(`hoi_dap.dap_${i + 1}`) }));
  const h1 = nd.dau.h1 ?? MD.h1!;
  const lich = lichHH(nam);

  return (
    <div className="space-y-16 md:space-y-24">
      <JsonLd data={goiLd(
        // AIO/GEO: CollectionPage nối tổ chức (publisher), ảnh đại diện, bản Markdown; ItemList = mọi công cụ con của hub.
        { "@type": "CollectionPage", "@id": `${urlDayDu(DUONG)}#trang`, url: urlDayDu(DUONG), name: h1, headline: h1,
          description: MD.mo_ta_seo, inLanguage: "vi-VN", isPartOf: { "@id": `${siteUrl()}/#website` },
          publisher: { "@id": `${siteUrl()}/#to-chuc` }, isAccessibleForFree: true,
          primaryImageOfPage: ldAnh(anhBai({ tieuDe: MD.tieu_de_seo! }), h1),
          encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: urlDayDu(`${DUONG}.md`) },
          about: [{ "@type": "Thing", name: "Huyền học", description: c("hoi_dap.dap_1") }, ...MANG_HH.map((m) => ldThucThe(m.mang))],
          mainEntity: { "@type": "ItemList", name: c("mang.lon"), numberOfItems: MANG_HH.length + lich.length,
            itemListElement: [...MANG_HH.map((m) => ({ href: m.href, ten: c(`the.${m.khoa}_ten`) })),
              ...lich.map((href, i) => ({ href, ten: c(`lich.ten_${i + 1}`, { nam: String(nam) }) }))]
              .map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.ten, url: urlDayDu(x.href) })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Huyền học", duong: DUONG }]),
        ldHoiDap(hoiDap),
      )} />

      {/* Đầu trang: chữ + hai nút bên trái, hình năm mảng bên phải (≥ lg). Điện thoại: chữ → nút → hình nhỏ. */}
      <section className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10" data-testid="hero-huyen-hoc">
        <div>
          <p className="eyebrow flex items-center gap-2"><Sparkles className="size-3.5 shrink-0 text-gold" aria-hidden /> {c("dau.nhan_tren")}</p>
          <h1 className="mt-3 text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            {nd.dau.h1 && nd.dau.h1 !== MD.h1
              ? <ChuNhan chu={nd.dau.h1} lopNhan="text-gradient-gold italic" />
              : <><span className="text-gradient-gold italic">Huyền học</span> — năm cách nhìn lại mình</>}
          </h1>
          <LoiDanCms nd={nd} className="mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">{MD.loi_dan}</LoiDanCms>
          <ul className="mt-5 hidden flex-wrap gap-2 text-sm text-fg-muted sm:flex" aria-label="Điểm khác biệt">
            {([[Check, "text-jade", 1], [Check, "text-gold", 2], [Check, "text-moon", 3]] as const).map(([Icon, mau, i]) => (
              <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/50 px-3 py-1 backdrop-blur">
                <Icon className={`size-3.5 ${mau}`} aria-hidden />{c(`dau.chip_${i}`)}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/than-so">{c("dau.nut_chinh")} <ArrowRight aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="#ban-can-gi">{c("dau.nut_phu")}</Link></Button>
          </div>
          <DongHoSo chao={c("ho_so.chao")} thieu={c("ho_so.thieu")} />
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-[10%] rounded-full bg-gold/10 blur-3xl" aria-hidden />
          <HinhNguMang className="relative mx-auto max-w-[19rem] sm:max-w-[24rem] lg:max-w-[27rem]" />
        </div>
      </section>

      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" />

      {/* Chọn theo câu hỏi: người mới không cần biết tên môn, chỉ cần biết mình đang băn khoăn gì. */}
      <section aria-labelledby="ban-can-gi" className="scroll-mt-24">
        <TieuDeMuc id="ban-can-gi" nho={c("hoi.nho")} lon={c("hoi.lon")} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="chon-theo-cau-hoi">
          {HOI_HH.map((href, i) => { const Icon = ICON_HOI[i]!; return (
            <li key={i}>
              <Link href={href} className="glass group flex h-full items-center gap-4 rounded-2xl p-4 hover:border-gold/50 sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold"><Icon className="size-5" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg leading-snug text-fg">{c(`hoi.cau_${i + 1}`)}</span>
                  <span className="mt-0.5 block text-sm text-gold">{c(`hoi.den_${i + 1}`)}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
              </Link>
            </li>
          ); })}
        </ul>
      </section>

      {/* Năm thẻ mảng: câu hỏi gốc, lời đời thường, ba điều nhận được, cần gì (đổi theo hồ sơ trên máy), nút, cụm tra cứu.
          Cả thẻ bấm được nhờ link nút phủ kín thẻ (after:inset-0); link tra cứu nằm trên lớp đó (z-10). */}
      <section aria-labelledby="nam-mang">
        <TieuDeMuc id="nam-mang" nho={c("mang.nho")} lon={c("mang.lon")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {MANG_HH.map(({ khoa, href, kieu, han, lop }) => (
            <article key={khoa} data-testid={`the-mang-${khoa}`}
              className={`glass group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-colors hover:border-gold/50 sm:p-6 ${lop}`}>
              <span aria-hidden className="pointer-events-none absolute -bottom-4 right-3 select-none text-[6.5rem] leading-none text-gold/[0.07] sm:text-[7.5rem]"
                style={{ fontFamily: "var(--font-han), serif" }}>{han}</span>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-20 w-28 shrink-0 place-items-center rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/15 via-surface/40 to-transparent">
                  <AnhCmsHoac anh={nd.hinh[`the.${khoa}`]} co="nho" className="h-14 w-auto object-contain">
                    <HinhMang kieu={kieu} className="h-14 transition-transform duration-300 group-hover:scale-110" />
                  </AnhCmsHoac>
                </span>
                <ChipCan khoa={khoa} can={c(`the.${khoa}_can`)} sanSang={c("ho_so.san_sang")} canThem={c("ho_so.can_them")} />
              </div>
              <p className="mt-5 font-serif text-base italic text-gold">“{c(`the.${khoa}_hoi`)}”</p>
              <h3 className="mt-1 text-2xl sm:text-[1.7rem]">{c(`the.${khoa}_ten`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted sm:text-[0.95rem]">{c(`the.${khoa}_mo`)}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden />{c(`the.${khoa}_nhan_${i}`)}</li>
                ))}
              </ul>
              <Link href={href} className="mt-5 inline-flex w-fit items-center gap-1.5 font-medium text-gold after:absolute after:inset-0 after:rounded-2xl after:content-['']
                focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-gold">
                {c(`the.${khoa}_nut`)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              {/* Chân thẻ: cụm tra cứu dính đáy (mt-auto) — các thẻ cùng hàng có chân thẳng hàng. */}
              <div className="mt-auto pt-5">
                {cum[khoa]!.length > 0 && (
                  <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-line/50 pt-4 text-xs">
                    <span className="text-fg-faint">{c("the.kien_thuc")}</span>
                    {cum[khoa]!.map((x) => {
                      const n = soBai(x.khoa);
                      return (
                        <Link key={x.duong} href={x.duong}
                          className="vung-cham rounded-full border border-line/70 bg-bg/40 px-2.5 py-1 text-fg-muted transition-colors hover:border-gold/50 hover:text-gold">
                          {dau[x.duong]?.ten ?? x.ten}{n ? <span className="text-fg-faint"> · {n}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" />

      {/* Công cụ theo lịch & tuổi dân gian — đều là con của hub này ở breadcrumb. */}
      <section aria-labelledby="lich-tuoi">
        <TieuDeMuc id="lich-tuoi" nho={c("lich.nho")} lon={c("lich.lon")} />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="cong-cu-lich">
          {lich.map((href, i) => { const Icon = ICON_LICH[i]!; return (
            <li key={href}>
              <Link href={href} className="glass group flex h-full flex-col rounded-2xl p-4 hover:border-gold/50">
                <span className="flex items-center justify-between">
                  <Icon className="size-5 text-gold" aria-hidden />
                  <ArrowUpRight className="size-4 text-fg-faint transition-colors group-hover:text-gold" aria-hidden />
                </span>
                <span className="mt-3 font-serif text-base leading-snug text-fg sm:text-lg">{c(`lich.ten_${i + 1}`, { nam: String(nam) })}</span>
                <span className="mt-1 text-xs leading-snug text-fg-muted sm:text-sm">{c(`lich.mo_${i + 1}`)}</span>
              </Link>
            </li>
          ); })}
        </ul>
      </section>

      {/* Bảng so sánh: máy tính là bảng 4 cột; điện thoại mỗi hàng thành một thẻ (nhãn cột hiện bằng data-nhan). */}
      <section aria-labelledby="so-sanh">
        <TieuDeMuc id="so-sanh" nho={c("so_sanh.nho")} lon={c("so_sanh.lon")} />
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm" data-testid="bang-so-sanh">
            <thead className="hidden border-b border-line/60 bg-surface/60 text-xs uppercase tracking-wider text-fg-muted md:table-header-group">
              <tr>{[1, 2, 3, 4].map((i) => <th key={i} scope="col" className="px-5 py-3 font-semibold">{c(`so_sanh.cot_${i}`)}</th>)}</tr>
            </thead>
            <tbody>
              {MANG_HH.map(({ khoa, href, kieu }) => (
                <tr key={khoa} className="block border-b border-line/40 px-5 py-4 last:border-0 md:table-row md:p-0">
                  <th scope="row" className="block pb-2 font-normal md:table-cell md:whitespace-nowrap md:px-5 md:py-4 md:align-top">
                    <Link href={href} className="inline-flex items-center gap-2 font-serif text-lg text-fg hover:text-gold">
                      <HinhMang kieu={kieu} className="h-7" />{c(`the.${khoa}_ten`)}
                    </Link>
                  </th>
                  {(["dua", "tra", "goc"] as const).map((k, j) => (
                    <td key={k} data-nhan={`${c(`so_sanh.cot_${j + 2}`)}:`}
                      className="block py-1 text-fg-muted before:mr-1 before:font-medium before:text-fg before:content-[attr(data-nhan)] md:table-cell md:px-5 md:py-4 md:align-top md:before:content-none">
                      {c(`so_sanh.${k}_${khoa}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-fg-muted">{c("so_sanh.ket")}</p>
      </section>

      {/* Ba lớp tách bạch (Cách tính / Diễn giải / Tự soi — docs/THIET-KE-UI.md). */}
      <section aria-labelledby="cach-lam">
        <TieuDeMuc id="cach-lam" nho={c("cach.nho")} lon={c("cach.lon")} />
        <ol className="grid gap-4 md:grid-cols-3">
          {CACH.map((Icon, i) => (
            <li key={i} className="glass relative rounded-2xl p-5 sm:p-6">
              <span aria-hidden className="absolute right-5 top-4 font-serif text-4xl text-gold/20">{i + 1}</span>
              <Icon className="size-7 text-gold" aria-hidden />
              <h3 className="mt-4 text-xl">{c(`cach.ten_${i + 1}`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c(`cach.mo_${i + 1}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Hỏi đáp: <details> thuần (không JS) — chữ nằm sẵn trong HTML cho máy tìm kiếm; FAQPage ở JSON-LD trên. */}
      <section aria-labelledby="hoi-dap" className="mx-auto max-w-3xl">
        <h2 id="hoi-dap" className="text-2xl sm:text-3xl">{c("hoi_dap.lon")}</h2>
        <div className="mt-5 divide-y divide-line/50 rounded-2xl border border-line/60">
          {hoiDap.map((h, i) => (
            <details key={i} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg">
                <h3 className="text-base sm:text-lg">{h.hoi}</h3>
                <ArrowRight className="size-4 shrink-0 rotate-90 text-gold transition-transform group-open:-rotate-90" aria-hidden />
              </summary>
              <p className="mt-2 leading-relaxed text-fg-muted">{h.dap}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <Link href="/kien-thuc" className="group flex items-start gap-3 text-fg-muted hover:text-fg">
          <BookOpen className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden />
          <span><b className="text-fg">{c("thu_vien.dam")}</b> {c("thu_vien.chu", { n: ds.length ? String(ds.length) : "hàng trăm" })}
            <ArrowRight className="ml-1 inline size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
        </Link>
        <span className="flex shrink-0 gap-4 text-sm">
          <Link href="/tu-dien" className="text-gold underline-offset-4 hover:underline">{c("thu_vien.tu_dien")}</Link>
          <Link href="/tu-vi/la-so-mau" className="text-gold underline-offset-4 hover:underline">{c("thu_vien.la_so_mau")}</Link>
        </span>
      </section>

      <Suspense fallback={null}><BaiLienQuanMang mang={null} tieuDe="Bài viết mới" boQua={[DUONG]} duong={DUONG} /></Suspense>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" />
    </div>
  );
}
