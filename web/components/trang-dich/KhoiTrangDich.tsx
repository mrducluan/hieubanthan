// CMS-3 — dựng từng khối của trang đích (/su-kien/{slug}). Chữ từ CMS hiện dạng VĂN BẢN THUẦN (React tự thoát ký tự),
// link chỉ nhận đường dẫn trong site (duongLienKet) → không có HTML lạ, không link ngoài.
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { TheLap } from "@/components/khung/TheLap";
import { lopCot, soCanLap, theLap } from "@/lib/the-lap";
import { boLap } from "@/lib/the-lap-cms";
import { DoKhoiCuoi } from "@/components/khung/DoKhoiCuoi";
import { duongBlog } from "@/lib/blog-gop";
import { anhCms, baiMoiCms, duongLienKet, type BaiCmsTomTat, type KhoiTrangDich } from "@/lib/cms";

const CONG_CU: Record<string, { href: string; ten: string; mo: string; kieu: KieuMang }> = {
  than_so: { href: "/than-so", ten: "Thần số học", mo: "4 con số cốt lõi từ tên và ngày sinh", kieu: "than-so" },
  hom_nay: { href: "/hom-nay", ten: "Hôm nay của bạn", mo: "Ngày cá nhân, âm lịch, câu tự soi", kieu: "than-so" },
  hop_doi: { href: "/hop-doi", ten: "Hợp đôi", mo: "Hai người, năm mối quan hệ, không chấm điểm", kieu: "than-so" },
  tu_vi: { href: "/tu-vi", ten: "Tử vi", mo: "Lá số 12 cung, đại hạn, lưu niên", kieu: "tu-vi" },
  bat_tu: { href: "/bat-tu", ten: "Bát tự", mo: "Tứ trụ, ngũ hành, đại vận", kieu: "bat-tu" },
  kinh_dich: { href: "/kinh-dich", ten: "Kinh Dịch", mo: "Gieo một quẻ cho việc đang cân nhắc", kieu: "kinh-dich" },
  phong_thuy: { href: "/phong-thuy", ten: "Phong thuỷ", mo: "Mệnh quái, hướng nhà hợp tuổi", kieu: "phong-thuy" },
};
const lk = (d?: string | null) => (d ? duongLienKet({ nhan: "", loai: "duong_dan", duong_dan: d }) : null);

export async function KhoiTrangDichView({ k, h1 }: { k: KhoiTrangDich; h1: boolean }) {
  switch (k.blockType) {
    case "dau_trang": {
      const anh = anhCms(k.anh, "vua"), link = lk(k.nut_link);
      const T = h1 ? "h1" : "h2";
      return (
        <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]" data-khoi="dau_trang">
          <div>
            {k.nhan && <p className="eyebrow">{k.nhan}</p>}
            <T className="mt-3 text-4xl leading-tight sm:text-5xl">{k.tieu_de}</T>
            {k.mo_ta && <p className="mt-4 max-w-xl text-lg text-fg-muted">{k.mo_ta}</p>}
            {link && k.nut_chu && (
              <Link href={link} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 font-medium text-bg transition-transform hover:-translate-y-0.5">
                {k.nut_chu} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {anh && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={anh.src} alt={anh.alt} width={anh.w} height={anh.h} className="aspect-video w-full rounded-3xl object-cover" />
          )}
        </section>
      );
    }
    case "cong_cu":
      return (
        <section data-khoi="cong_cu">
          {k.tieu_de && <h2 className="text-2xl">{k.tieu_de}</h2>}
          <div className={`mt-5 grid gap-3 ${lopCot(k.ds.filter((ma) => CONG_CU[ma]).length, 4)}`}>
            {k.ds.map((ma) => CONG_CU[ma]).filter(Boolean).map((c) => (
              <Link key={c!.href} href={c!.href} className="glass group flex flex-col rounded-2xl p-4 hover:border-gold/50 sm:p-5">
                <HinhMang kieu={c!.kieu} className="h-12 self-start" />
                <p className="mt-3 font-serif text-lg">{c!.ten}</p>
                <p className="mt-1 text-sm text-fg-muted">{c!.mo}</p>
              </Link>
            ))}
          </div>
        </section>
      );
    case "bai_viet": {
      const chon = (k.bai ?? []).filter((b): b is BaiCmsTomTat => typeof b === "object" && !!b?.slug);
      const ds = chon.length ? chon : await baiMoiCms(k.mang && k.mang !== "tat_ca" ? k.mang : null, Math.max(1, Math.min(6, k.so_bai ?? 3)));
      if (!ds.length) return null;
      return (
        <section data-khoi="bai_viet">
          <h2 className="text-2xl">{k.tieu_de || "Bài viết"}</h2>
          <DoKhoiCuoi khoi="trang_dich" />
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {ds.map((b) => {
              const a = anhCms(b.anh_bia, "nho") ?? anhCms(b.anh_bia, "vua");
              return (
                <li key={b.slug}>
                  <Link href={duongBlog(b.slug)} className="glass flex h-full flex-col overflow-hidden rounded-2xl hover:border-gold/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a && <img src={a.src} alt={a.alt} width={a.w} height={a.h} loading="lazy" className="aspect-video w-full object-cover" />}
                    <span className="p-4 font-serif text-lg leading-snug">{b.tieu_de}</span>
                  </Link>
                </li>
              );
            })}
            {/* CTA-2: biên tập chọn 1–2 bài / mảng ít bài → bù lối đi tiếp cho kín hàng 3 cột. */}
            {theLap(soCanLap(ds.length), await boLap()).map((t) => <TheLap key={t.duong} t={t} kieu="anh" />)}
          </ul>
        </section>
      );
    }
    case "hoi_dap":
      return (
        <section data-khoi="hoi_dap">
          <h2 className="text-2xl">{k.tieu_de || "Câu hỏi thường gặp"}</h2>
          <div className="mt-4 space-y-3">
            {k.ds.map((h) => (
              <details key={h.cau_hoi} className="glass rounded-2xl p-4 open:border-gold/40">
                <summary className="cursor-pointer font-medium">{h.cau_hoi}</summary>
                <p className="mt-2 whitespace-pre-line text-fg-muted">{h.tra_loi}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "loi_moi":
      return (
        <section data-khoi="loi_moi" className="glass vach-sang flex flex-col items-start gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
          <Gift className="size-10 shrink-0 text-gold" aria-hidden />
          <div className="flex-1">
            <h2 className="text-2xl">{k.tieu_de}</h2>
            {k.mo_ta && <p className="mt-1 text-fg-muted">{k.mo_ta}</p>}
          </div>
          <Link href="/tai-khoan#moi" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 font-medium text-bg">
            {k.nut_chu || "Lấy link mời của tôi"}
          </Link>
        </section>
      );
    case "van_ban":
      return (
        <section data-khoi="van_ban" className="max-w-3xl">
          {k.tieu_de && <h2 className="text-2xl">{k.tieu_de}</h2>}
          <div className="mt-3 space-y-3 leading-relaxed text-fg-muted">
            {k.noi_dung.split(/\n\s*\n/).map((d, i) => <p key={i} className="whitespace-pre-line">{d.trim()}</p>)}
          </div>
        </section>
      );
    default:
      return null;
  }
}
