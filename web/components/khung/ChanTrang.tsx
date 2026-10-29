// PL-1 — chân trang: thương hiệu + cam kết dữ liệu, 4 cột liên kết (Huyền học · Kiến thức · Về chúng tôi · Pháp lý) — sửa ở CMS
// "Điều hướng chân trang" (CMS chưa nối / lỗi → dùng COT dưới đây),
// thông tin đơn vị vận hành (env, thiếu thì ẩn), mạng xã hội, dấu Bộ Công Thương (khi có), lời miễn trừ.
// Server component: đọc env ở máy chủ (lib/van-hanh.ts), không gửi gì thêm xuống trình duyệt.
// ND-1: lời giới thiệu, 3 cam kết, lời miễn trừ, nhãn nút ủng hộ sửa ở CMS; ô trống → chữ trong code (lib/menu-chan-trang.ts).
// Dòng ©, thông tin đơn vị vận hành (env) luôn giữ trong code. (Đường dây khẩn cấp đã bỏ khỏi chân trang — TC-HOOK; lời
// hỗ trợ khủng hoảng nằm trong hỏi đáp + trang Miễn trừ.)
import Link from "next/link";
import { BadgeCheck, BookOpen, Compass, HeartHandshake, Lock, Mail, MapPin, Phone, Scale, Server, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { coUngHo } from "@/lib/ung-ho";
import { vanHanh } from "@/lib/van-hanh";
import { chanTrangCms, type BieuTuongCamKet, type ChuChanTrangCms } from "@/lib/cms";
import {
  CAM_KET_CHAN_TRANG, COT_CHAN_TRANG, GIOI_THIEU_CHAN_TRANG, MIEN_TRU_CHAN_TRANG, NHAN_UNG_HO_CHAN_TRANG, type CotChanTrang,
} from "@/lib/menu-chan-trang";
import { NutTuyChonCookie } from "@/components/khung/HoiDongYCookie";
import { Logo } from "./Logo";

const BIEU_TUONG: Record<BieuTuongCamKet, LucideIcon> = {
  khien: ShieldCheck, may_chu: Server, lap_lanh: Sparkles, khoa: Lock, bat_tay: HeartHandshake, sach: BookOpen, can: Scale, la_ban: Compass,
};

/** Menu + chữ từ CMS; CMS chậm/lỗi → layout hiện ngay bản mặc định (Suspense fallback = KhungChanTrang với COT_CHAN_TRANG). */
export async function ChanTrang() {
  const cms = await chanTrangCms();
  return <KhungChanTrang cot={cms?.cot ?? COT_CHAN_TRANG} chu={cms?.chu} />;
}

export function KhungChanTrang({ cot, chu }: { cot: readonly CotChanTrang[]; chu?: ChuChanTrangCms | null }) {
  const vh = vanHanh();
  const camKet = chu?.camKet ?? CAM_KET_CHAN_TRANG;
  const nam = new Date().getFullYear();
  return (
    <footer className="vach-sang mt-8 border-t border-line/60 bg-surface/30 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10" data-testid="chan-trang">
      <div className="container grid gap-10 pt-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Hiểu Bản Thân — trang chủ">
            <Logo /><span className="font-serif text-xl tracking-tight">Hiểu Bản Thân</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg-muted" data-testid="chan-trang-gioi-thieu">
            {chu?.gioiThieu ?? GIOI_THIEU_CHAN_TRANG}
          </p>
          <ul className="mt-4 space-y-2 text-xs text-fg-muted" data-testid="chan-trang-cam-ket">
            {camKet.map(({ chu: dong, bieu_tuong }) => {
              const Icon = BIEU_TUONG[bieu_tuong];
              return <li key={dong} className="flex items-start gap-2"><Icon className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />{dong}</li>;
            })}
          </ul>
          {vh.mangXaHoi.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Mạng xã hội">
              {vh.mangXaHoi.map((m) => (
                <li key={m.ten}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer me" aria-label={`Hiểu Bản Thân trên ${m.ten}`}
                    className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-fg-muted hover:border-gold hover:text-fg">
                    {m.ten}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Liên kết cuối trang" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cot.map((c, i) => (
            <div key={i}>
              <p className="eyebrow">{c.ten}</p>
              <ul className="mt-2 space-y-0.5 text-sm">
                {c.ds.map(([href, ten]) => (
                  <li key={`${href} ${ten}`}><Link href={href} className="inline-block py-1 text-fg-muted transition-colors hover:text-gold">{ten}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container mt-10">
      <div className="grid gap-6 border-t border-line/50 pt-6 text-xs leading-relaxed text-fg-faint md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p data-testid="chan-trang-mien-tru">{chu?.mienTru ?? MIEN_TRU_CHAN_TRANG}</p>
          {(vh.chuSoHuu || vh.diaChi || vh.email || vh.dienThoai) && (
            <div className="space-y-1 pt-1" data-testid="thong-tin-van-hanh">
              {vh.chuSoHuu && <p className="text-fg-muted">{vh.chuSoHuu}{vh.maSo ? ` · Mã số: ${vh.maSo}` : ""}{vh.noiCap ? ` · ${vh.noiCap}` : ""}</p>}
              {vh.diaChi && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />{vh.diaChi}</p>}
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {vh.email && <a href={`mailto:${vh.email}`} className="inline-flex items-center gap-1.5 py-1 hover:text-fg"><Mail className="size-3" aria-hidden />{vh.email}</a>}
                {vh.dienThoai && <a href={`tel:${vh.dienThoai.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 py-1 hover:text-fg"><Phone className="size-3" aria-hidden />{vh.dienThoai}</a>}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          {vh.boCongThuong && (
            <a href={vh.boCongThuong} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[rgb(41_110_188)]/60 bg-[rgb(41_110_188)]/15 px-3 py-2 text-[11px] font-semibold text-fg">
              <BadgeCheck className="size-4 text-[rgb(96_165_250)]" aria-hidden /> ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG
            </a>
          )}
          {coUngHo() && (
            <Link href="/ung-ho" data-testid="chan-trang-ung-ho"
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-3 py-1.5 text-[12px] font-medium text-gold hover:bg-gold/10">
              <HeartHandshake className="size-3.5" aria-hidden /> {chu?.nhanUngHo ?? NHAN_UNG_HO_CHAN_TRANG}
            </Link>
          )}
          <p>© {nam} Hiểu Bản Thân. Bảo lưu mọi quyền. <NutTuyChonCookie /></p>
        </div>
      </div>
      </div>
    </footer>
  );
}
