// PL-1 — chân trang: thương hiệu + cam kết dữ liệu, 4 cột liên kết (Khám phá · Kiến thức · Về chúng tôi · Pháp lý),
// thông tin đơn vị vận hành (env, thiếu thì ẩn), mạng xã hội, dấu Bộ Công Thương (khi có), lời miễn trừ, đường dây khẩn cấp.
// Server component: đọc env ở máy chủ (lib/van-hanh.ts), không gửi gì thêm xuống trình duyệt.
import Link from "next/link";
import { BadgeCheck, Mail, MapPin, Phone, Server, ShieldCheck, Sparkles } from "lucide-react";
import { vanHanh } from "@/lib/van-hanh";
import { NutTuyChonCookie } from "@/components/khung/HoiDongYCookie";
import { Logo } from "./Logo";

const COT = [
  { ten: "Khám phá", ds: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/hop-doi", "Hợp đôi"],
  ] },
  { ten: "Kiến thức", ds: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/kien-thuc/than-so", "Ý nghĩa các con số"], ["/kien-thuc/kinh-dich", "64 quẻ Kinh Dịch"],
    ["/kien-thuc/tu-vi", "14 chính tinh Tử vi"], ["/tu-dien", "Từ điển thuật ngữ"], ["/la-so-mau", "Lá số mẫu"], ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"],
  ] },
  { ten: "Về chúng tôi", ds: [
    ["/gioi-thieu", "Giới thiệu & phương pháp"], ["/gioi-thieu#nguon", "Nguồn tri thức"], ["/lien-he", "Liên hệ"],
    ["/lien-he#chu-de", "Góp ý, báo lỗi"], ["/tai-khoan", "Tài khoản"],
  ] },
  { ten: "Pháp lý", ds: [
    ["/chinh-sach-rieng-tu", "Chính sách quyền riêng tư"], ["/dieu-khoan", "Điều khoản sử dụng"],
    ["/mien-tru-trach-nhiem", "Miễn trừ trách nhiệm"], ["/chinh-sach-rieng-tu#quyen", "Yêu cầu về dữ liệu cá nhân"],
  ] },
] as const;

const CAM_KET = [
  { Icon: ShieldCheck, chu: "Hồ sơ mặc định chỉ lưu trên máy bạn" },
  { Icon: Server, chu: "Lá số tính trên hệ thống của chúng tôi; AI không nhận họ tên, ngày sinh" },
  { Icon: Sparkles, chu: "Không bán dữ liệu, không quảng cáo nhắm mục tiêu" },
];

export function ChanTrang() {
  const vh = vanHanh();
  const nam = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-line/60 bg-surface/30 pb-28 md:pb-10" data-testid="chan-trang">
      <div className="container grid gap-10 pt-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Hiểu Bản Thân — trang chủ">
            <Logo /><span className="font-serif text-xl tracking-tight">Hiểu Bản Thân</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
            Năm hệ thống văn hoá — thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch,
            nguồn rõ ràng, để tự soi chứ không để phán.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-fg-muted">
            {CAM_KET.map(({ Icon, chu }) => (
              <li key={chu} className="flex items-start gap-2"><Icon className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />{chu}</li>
            ))}
          </ul>
          {vh.mangXaHoi.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Mạng xã hội">
              {vh.mangXaHoi.map((m) => (
                <li key={m.ten}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer me"
                    className="inline-flex h-8 items-center rounded-full border border-line px-3 text-xs text-fg-muted hover:border-gold hover:text-fg">
                    {m.ten}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Liên kết cuối trang" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COT.map((c) => (
            <div key={c.ten}>
              <p className="eyebrow">{c.ten}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {c.ds.map(([href, ten]) => (
                  <li key={href}><Link href={href} className="text-fg-muted transition-colors hover:text-gold">{ten}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container mt-10 grid gap-6 border-t border-line/50 pt-6 text-xs leading-relaxed text-fg-faint md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p>
            Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay
            thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Một số diễn giải là bản nháp do AI soạn, luôn có nhãn.
          </p>
          <p>Đang khủng hoảng hoặc gặp nguy hiểm? Gọi <b className="text-fg-muted">115</b> (cấp cứu) · <b className="text-fg-muted">113</b> (công an) · <b className="text-fg-muted">111</b> (bảo vệ trẻ em).</p>
          {(vh.chuSoHuu || vh.diaChi || vh.email || vh.dienThoai) && (
            <div className="space-y-1 pt-1" data-testid="thong-tin-van-hanh">
              {vh.chuSoHuu && <p className="text-fg-muted">{vh.chuSoHuu}{vh.maSo ? ` · Mã số: ${vh.maSo}` : ""}{vh.noiCap ? ` · ${vh.noiCap}` : ""}</p>}
              {vh.diaChi && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />{vh.diaChi}</p>}
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {vh.email && <a href={`mailto:${vh.email}`} className="inline-flex items-center gap-1.5 hover:text-fg"><Mail className="size-3" aria-hidden />{vh.email}</a>}
                {vh.dienThoai && <a href={`tel:${vh.dienThoai.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-fg"><Phone className="size-3" aria-hidden />{vh.dienThoai}</a>}
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
          <p>© {nam} Hiểu Bản Thân. Bảo lưu mọi quyền. <NutTuyChonCookie /></p>
        </div>
      </div>
    </footer>
  );
}
