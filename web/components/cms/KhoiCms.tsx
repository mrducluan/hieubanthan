// ND-2/ND-3 — khối CMS đặt quanh nội dung một URL (vị trí cố định: trên / dưới / cuối), từ "Trang website" hoặc "Mẫu
// cụm trang" (lib/noi-dung-trang.ts đã gộp + lọc khung ngày). Chữ hiện dạng VĂN BẢN THUẦN (React tự thoát ký tự), link
// chỉ nhận đường dẫn trong site, video chỉ youtube-nocookie và chỉ tải khi người đọc bấm → không HTML lạ, không link
// ngoài, không làm chậm trang công cụ. Ảnh chỉ từ kho ảnh CMS (CSP img-src đã cho phép). Khối hỏi đáp KHÔNG xuất FAQPage (trang công cụ đã có FAQPage của phần giới thiệu).
import Link from "next/link";
import { ArrowRight, Info, Lightbulb, ListChecks, MessageCircleQuestionMark, Quote } from "lucide-react";
import { KhoiTrangDichView } from "@/components/trang-dich/KhoiTrangDich";
import { NutMoiCms } from "@/components/cms/NutMoiCms";
import { VideoCms } from "@/components/cms/VideoCms";
import { anhCms, duongLienKet, type AnhCms, type KhoiTrangDich } from "@/lib/cms";
import { lopKieuChu } from "@/lib/kieu-chu";
import { cn } from "@/lib/utils";
import type { KhoiCms as KhoiCmsT, KieuChu, ViTri } from "@/lib/noi-dung-trang";
import { maYoutube } from "@/lib/youtube";

const chu = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const lk = (d: unknown) => (typeof d === "string" && d ? duongLienKet({ nhan: "", loai: "duong_dan", duong_dan: d }) : null);

const GHI_CHU = {
  luu_y: { Icon: Info, nhan: "Lưu ý" }, meo: { Icon: Lightbulb, nhan: "Mẹo" },
  tu_soi: { Icon: MessageCircleQuestionMark, nhan: "Tự soi" }, tom_tat: { Icon: ListChecks, nhan: "Tóm tắt" },
} as const;

const TRANG_DICH = new Set(["cong_cu", "bai_viet", "hoi_dap", "loi_moi", "van_ban"]);

function MotKhoi({ k, duong, viTri }: { k: KhoiCmsT; duong: string; viTri: ViTri }) {
  const kc = lopKieuChu(k.kieu_chu as Partial<KieuChu> | undefined);
  switch (k.blockType) {
    case "banner": {
      const tieuDe = chu(k.tieu_de);
      if (!tieuDe) return null;
      const anh = anhCms(k.anh as AnhCms | null, "vua"), link = lk(k.nut_link), nut = chu(k.nut_chu);
      return (
        <section data-khoi="banner" className={cn("glass vach-sang grid items-center gap-6 overflow-hidden rounded-3xl p-6 sm:p-8", anh && "md:grid-cols-[1.3fr_1fr]")}>
          <div className={kc}>
            {chu(k.nhan) && <p className="eyebrow">{chu(k.nhan)}</p>}
            <h2 className="mt-2 text-2xl leading-tight sm:text-3xl">{tieuDe}</h2>
            {chu(k.mo_ta) && <p className="mt-3 max-w-xl whitespace-pre-line text-fg-muted">{chu(k.mo_ta)}</p>}
            {link && nut && (
              <Link href={link} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 font-medium text-bg transition-transform hover:-translate-y-0.5">
                {nut} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {anh && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={anh.src} alt={anh.alt} width={anh.w} height={anh.h} loading="lazy" className="aspect-video w-full rounded-2xl object-cover" />
          )}
        </section>
      );
    }
    case "anh": {
      // Ảnh chỉ từ kho ảnh CMS (anhCms đọc url Payload); alt lấy từ "Mô tả ảnh" của thư viện Media.
      const a = anhCms(k.anh as AnhCms | null, k.co === "nho" ? "nho" : "vua");
      if (!a) return null;
      const link = lk(k.link), ct = chu(k.chu_thich);
      const lop = k.co === "rong" ? "w-full" : k.co === "nho" ? "mx-auto max-w-sm" : "mx-auto max-w-3xl";
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={a.src} alt={a.alt} width={a.w} height={a.h} loading="lazy" className="h-auto w-full rounded-2xl" />;
      return (
        <figure data-khoi="anh" className={lop}>
          {link ? <Link href={link}>{img}</Link> : img}
          {ct && <figcaption className="mt-2 text-center text-sm text-fg-muted">{ct}</figcaption>}
        </figure>
      );
    }
    case "nut_moi": {
      const link = lk(k.link), c = chu(k.chu);
      if (!link || !c) return null;
      const maDo = typeof k.ma_do === "string" && /^[a-z0-9_]{1,40}$/.test(k.ma_do) ? k.ma_do : null;
      return <div data-khoi="nut_moi"><NutMoiCms href={link} chu={c} chinh={k.kieu !== "phu"} maDo={maDo} duong={duong} viTri={viTri} /></div>;
    }
    case "ghi_chu": {
      const nd = chu(k.noi_dung);
      if (!nd) return null;
      const g = GHI_CHU[k.kieu as keyof typeof GHI_CHU] ?? GHI_CHU.luu_y;
      return (
        <aside data-khoi="ghi_chu" className="glass flex gap-3 rounded-2xl p-5">
          <g.Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <div>
            <p className="font-medium">{chu(k.tieu_de) ?? g.nhan}</p>
            <p className="mt-1 whitespace-pre-line text-fg-muted">{nd}</p>
          </div>
        </aside>
      );
    }
    case "keu_goi": {
      const link = lk(k.cong_cu), loi = chu(k.loi_moi);
      if (!link || !loi) return null;
      return (
        <section data-khoi="keu_goi" className="glass flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-lg">{loi}</p>
          <Link href={link} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 font-medium text-bg">
            {chu(k.nut) ?? "Xem của tôi"} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      );
    }
    case "trich_dan": {
      const cau = chu(k.cau), nguon = chu(k.nguon);
      if (!cau || !nguon) return null;
      return (
        <figure data-khoi="trich_dan" className="glass rounded-2xl p-5">
          <Quote className="size-5 text-gold" aria-hidden />
          <blockquote className="mt-2 whitespace-pre-line font-serif text-lg">{cau}</blockquote>
          {chu(k.dich_nghia) && <p className="mt-2 whitespace-pre-line text-fg-muted">{chu(k.dich_nghia)}</p>}
          <figcaption className="mt-2 text-sm text-fg-faint">— {nguon}</figcaption>
        </figure>
      );
    }
    case "video": {
      const ma = maYoutube(k.url), tieuDe = chu(k.tieu_de);
      if (!ma || !tieuDe) return null;
      return <div data-khoi="video"><VideoCms ma={ma} tieuDe={tieuDe} chuThich={chu(k.chu_thich)} /></div>;
    }
    default:
      return TRANG_DICH.has(k.blockType) ? <KhoiTrangDichView k={k as unknown as KhoiTrangDich} h1={false} /> : null;
  }
}

/** Các khối của một vị trí; không có khối nào → không render gì (HTML trang y như khi chưa có CMS). */
export function KhoiCms({ ds, duong, viTri, className }: { ds: KhoiCmsT[]; duong: string; viTri: ViTri; className?: string }) {
  if (!ds.length) return null;
  return (
    <div data-testid={`khoi-cms-${viTri}`} className={cn("space-y-6", className)}>
      {ds.map((k, i) => <MotKhoi key={k.id ?? i} k={k} duong={duong} viTri={viTri} />)}
    </div>
  );
}
