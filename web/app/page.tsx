import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ListChecks, Sparkles, Sun, Zap } from "lucide-react";
import { HinhBauTroi, HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { CuaVao } from "@/components/hoso/CuaVao";
import { DiemMuLuot } from "@/components/trang-chu/DiemMuLuot";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { AnhCmsHoac } from "@/components/cms/AnhCmsHoac";
import { taoChu } from "@/lib/chu-trang";
import { CO_TRANG_CHU, layCo } from "@/lib/kieu-chu";
import { CHU_TRANG_CHU, SO_DIEM_MU } from "@/lib/chu/trang-chu";
import { SoSanhChatbot } from "@/components/trang-chu/SoSanhChatbot";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { TEN_SITE } from "@/lib/seo";
import { BannerTrangChu } from "@/components/khung/BannerTrangChu";
import { BaiMoiTrangChu } from "@/components/blog/BaiLienQuanMang";
import { NgayTotTrangChu } from "@/components/hoang-lich/NgayTotTrangChu";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

// Mô tả trang chủ ≤ 160 ký tự (mô tả site dài hơn vẫn dùng cho schema/llms.txt).
// SEO-K (chủ dự án duyệt 2026-10-21): tiêu đề có từ khoá người ta tìm; CMS "Trang website" vẫn ghi đè được.
const TIEU_DE_CHU = "Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân";
const MO_TA_CHU = "Thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ): tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Miễn phí.";
const META: Metadata = {
  title: { absolute: TIEU_DE_CHU },
  description: MO_TA_CHU,
  alternates: { canonical: "/", types: { "text/markdown": "/index.md" } },
  // openGraph/twitter của trang thay hẳn bản ở layout (không gộp) → khai đủ trường.
  openGraph: { type: "website", locale: "vi_VN", siteName: TEN_SITE, url: "/", title: TIEU_DE_CHU, description: MO_TA_CHU, images: [{ url: "/og", width: 1200, height: 630, alt: TIEU_DE_CHU }] },
  twitter: { card: "summary_large_image", title: TIEU_DE_CHU, description: MO_TA_CHU, images: ["/og"] },
};

const DUONG = "/";
const H1_MAC_DINH = "Bạn là số mấy?";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG), { tuyetDoi: true });
}

// Chữ thẻ: bảng chữ trang chủ (mang.<khoa>_ten / _mo).
const MANG: { href: string; khoa: string; kieu: KieuMang }[] = [
  { href: "/tu-vi", khoa: "tu_vi", kieu: "tu-vi" },
  { href: "/kinh-dich", khoa: "kinh_dich", kieu: "kinh-dich" },
  { href: "/bat-tu", khoa: "bat_tu", kieu: "bat-tu" },
  { href: "/phong-thuy", khoa: "phong_thuy", kieu: "phong-thuy" },
];

export default async function TrangChu() {
  const nd = await layNoiDungTrang(DUONG);
  const c = taoChu(CHU_TRANG_CHU, nd.chu);
  return (
    <div className="space-y-14 md:space-y-20">
      {/* UI-HERO: cột trái = lời giới thiệu + ô vào (form/chào lại), cột phải = vòng số lớn có chuyển động. Dưới lg
          (điện thoại, máy tính bảng dọc): một cột chữ → ô vào → hình.
          TC-HOOK2 (2026-10-29): cột trái rộng cố định (form không bị kéo giãn), lời dẫn ngắn, hai chip dời xuống dưới
          hình → hai cột cao gần bằng nhau, hết khoảng trống trên/dưới vòng số; nút "Đồng ý và xem kết quả" vẫn lọt màn
          đầu 1440×900 và 390×844. */}
      <section className="relative grid items-center gap-8 md:pt-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-10 lg:pt-0 xl:gap-14 xl:grid-cols-[minmax(0,33rem)_minmax(0,1fr)]" data-testid="hero">
        <div>
          <p className="eyebrow flex items-center gap-2 !text-xs !tracking-[0.1em] !text-fg-muted sm:!tracking-[0.18em]"><Sparkles className="size-3.5 shrink-0 text-gold" aria-hidden /> {c("dau.nhan_tren")}</p>
          <h1 className={`mt-3 leading-[1.08] sm:mt-4 lg:mt-3 ${layCo(CO_TRANG_CHU.h1, c("co.h1"))}`}>
            {nd.dau.h1 && nd.dau.h1 !== H1_MAC_DINH
              ? <ChuNhan chu={nd.dau.h1} lopNhan="text-gradient-gold italic" />
              : <>Bạn là <span className="text-gradient-gold italic">số mấy?</span></>}
          </h1>
          {/* TC-HOOK: 3 giây đầu — một điểm mù rất đời thường của từng con số → người xem nhận ra mình/người quen
              → muốn biết số của mình. Lời dẫn nói rõ nhận được gì, mất bao lâu. */}
          <DiemMuLuot className="mt-4 sm:mt-5 lg:mt-4" co={layCo(CO_TRANG_CHU.diemMu, c("co.diem_mu"))} nhan={c("diem_mu.nhan")}
            cau={Array.from({ length: SO_DIEM_MU }, (_, i) => c(`diem_mu.cau_${i + 1}`))} />
          <LoiDanCms nd={nd} className="mt-3 text-base leading-snug text-fg-muted sm:mt-4 sm:text-lg sm:leading-normal lg:mt-3" lopNhan="text-gold" />
          <div className="mt-5 sm:mt-6 lg:mt-5"><CuaVao /></div>
        </div>
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute inset-[8%] rounded-full bg-gold/10 blur-3xl" aria-hidden />
          <AnhCmsHoac anh={nd.hinh["hero.hinh"]} uuTien className="relative aspect-square h-auto w-full max-w-[19rem] object-contain sm:max-w-[24rem] lg:max-w-[34rem]">
            {/* SVG: vòng sao ngoài chỉ chiếm ~87% khung → phóng nhẹ bằng transform ở xl (không xô bố cục). */}
            <HinhBauTroi className="relative mx-auto max-w-[19rem] sm:max-w-[24rem] lg:max-w-[34rem] lg:scale-[1.04] xl:scale-[1.15]" />
          </AnhCmsHoac>
          <ul className={`relative mt-3 flex flex-wrap justify-center gap-2 text-fg-muted lg:mt-2 xl:mt-6 ${layCo(CO_TRANG_CHU.chip, c("co.chip"))}`} aria-label="Điểm khác biệt" data-testid="hero-diem">
            {([[Zap, "text-jade", c("dau.chip_1")], [ListChecks, "text-gold", c("dau.chip_2")]] as const).map(([Icon, mau, chu]) => (
              <li key={chu} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/50 px-3 py-1 backdrop-blur">
                <Icon className={`size-3.5 ${mau}`} aria-hidden />{chu}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HL-1: điểm nhấn thứ hai sau hồ sơ thần số — hoàng lịch hôm nay (người Việt mở xem mỗi ngày). */}
      <Suspense fallback={null}><NgayTotTrangChu className="hien-dan" /></Suspense>

      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" />

      <Suspense fallback={null}><BannerTrangChu /></Suspense>

      {/* TC-HOOK: thay "Ba lớp" — so với nhóm chatbot AI đa năng (không nêu tên hãng, xem SoSanhChatbot). */}
      <section aria-labelledby="vi-sao-chon">
        <TieuDeMuc id="vi-sao-chon" nho={c("so_sanh.nho")} lon={c("so_sanh.lon")} mo_ta={c("so_sanh.mo_ta")} />
        <SoSanhChatbot c={c} />
      </section>

      <section aria-labelledby="kham-pha" className="hien-dan">
        <TieuDeMuc id="kham-pha" nho={c("mang.nho")} lon={c("mang.lon")} mo_ta={c("mang.mo_ta")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MANG.map(({ href, khoa, kieu }) => (
            <Link key={href} href={href} className="glass group flex flex-col rounded-2xl p-4 hover:border-gold/50 sm:p-5">
              <AnhCmsHoac anh={nd.hinh[`mang.${khoa}`]} co="nho" className="h-14 w-auto self-start object-contain sm:h-16">
                <HinhMang kieu={kieu} className="h-14 self-start origin-left transition-transform duration-300 group-hover:scale-105 sm:h-16" />
              </AnhCmsHoac>
              <p className="mt-3 font-serif text-lg sm:mt-4 sm:text-xl">{c(`mang.${khoa}_ten`)}</p>
              <p className="mt-1 text-sm text-fg-muted">{c(`mang.${khoa}_mo`)}</p>
              <span className="mt-auto block pt-4"><ArrowRight className="size-4 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden /></span>
            </Link>
          ))}
        </div>
        <Link href="/huyen-hoc" className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold underline-offset-4 hover:underline">
          {c("mang.xem_tat_ca")} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" />

      <Suspense fallback={null}><BaiMoiTrangChu className="hien-dan" /></Suspense>

      <section className="glass flex items-start gap-4 rounded-2xl p-5 sm:items-center sm:p-6">
        <Sun className="size-7 shrink-0 text-gold sm:size-8" aria-hidden />
        <p className="text-sm text-fg-muted">
          <b className="text-fg">{c("rieng_tu.dam")}</b> {c("rieng_tu.chu")}
        </p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" />
    </div>
  );
}
