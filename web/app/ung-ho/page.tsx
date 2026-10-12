// /ung-ho — ủng hộ nhà phát triển (quà tặng tự nguyện). Địa chỉ ví / tài khoản đọc từ env máy chủ (lib/ung-ho.ts).
import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Landmark, Wallet } from "lucide-react";
import { NutChep } from "@/components/ung-ho/NutChep";
import { metaTrang } from "@/lib/seo";
import { dsViUngHo, nganHangUngHo } from "@/lib/ung-ho";

export const metadata: Metadata = metaTrang({
  tieuDe: "Ủng hộ đội ngũ phát triển Hiểu Bản Thân",
  moTa: "Hiểu Bản Thân miễn phí phần lớn công cụ. Nếu thấy hữu ích, bạn có thể ủng hộ đội ngũ phát triển bằng chuyển khoản hoặc ví tiền mã hoá.",
  duong: "/ung-ho",
});

export default function Page() {
  const vi = dsViUngHo(), nh = nganHangUngHo();
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Ủng hộ</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Ủng hộ đội ngũ phát triển</h1>
      <p className="mt-4 text-fg-muted">
        Hiểu Bản Thân giữ phần lớn công cụ miễn phí, không quảng cáo nhắm mục tiêu, không bán dữ liệu. Chi phí máy chủ,
        biên soạn và kiểm định nội dung do một nhóm nhỏ tự gánh. Nếu trang giúp được bạn, một khoản ủng hộ dù nhỏ cũng là
        động lực để chúng tôi làm tiếp.
      </p>

      {nh && (
        <section className="glass mt-8 space-y-3 rounded-2xl p-5" data-testid="ung-ho-ngan-hang">
          <h2 className="flex items-center gap-2 font-serif text-xl"><Landmark className="size-5 text-gold" aria-hidden /> Chuyển khoản ngân hàng</h2>
          <p className="text-sm text-fg-muted">{nh.nganHang} · Chủ tài khoản: <b className="text-fg">{nh.chuTk}</b></p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-surface px-3 py-2 text-base text-fg">{nh.soTk}</code>
            <NutChep chu={nh.soTk} nhan="số tài khoản" />
          </div>
          <p className="text-xs text-fg-faint">Nội dung gợi ý: “Ung ho Hieu Ban Than”.</p>
        </section>
      )}

      {vi.length > 0 && (
        <section className="glass mt-6 space-y-4 rounded-2xl p-5" data-testid="ung-ho-vi">
          <h2 className="flex items-center gap-2 font-serif text-xl"><Wallet className="size-5 text-gold" aria-hidden /> Ví tiền mã hoá</h2>
          <ul className="space-y-3">
            {vi.map((v) => (
              <li key={v.diaChi}>
                <p className="text-sm font-medium text-fg">{v.mang}</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-surface px-3 py-2 text-xs text-fg sm:text-sm">{v.diaChi}</code>
                  <NutChep chu={v.diaChi} nhan={`địa chỉ ví ${v.mang}`} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-faint">Kiểm tra đúng <b>mạng</b> trước khi gửi — gửi nhầm mạng sẽ mất tài sản và không lấy lại được.</p>
        </section>
      )}

      {!nh && vi.length === 0 && <p className="mt-8 text-fg-faint" data-testid="ung-ho-chua-co">Thông tin ủng hộ đang được cập nhật.</p>}

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-fg-muted">
        <h2 className="flex items-center gap-2 font-serif text-xl text-fg"><HeartHandshake className="size-5 text-gold" aria-hidden /> Điều cần biết</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Đây là <b className="text-fg">quà tặng tự nguyện</b> cho đội ngũ phát triển, không phải mua hàng: không đổi ra Sao, không kèm quyền lợi, không hoàn lại.</li>
          <li>Muốn dùng tính năng trả phí, hãy <Link href="/nap-sao" className="text-gold hover:underline">nạp Sao</Link> — đó là kênh thanh toán chính thức.</li>
          <li>Chúng tôi không bao giờ nhắn tin xin chuyển tiền. Chỉ tin địa chỉ hiển thị trên trang này (hieuban.com/ung-ho).</li>
        </ul>
      </section>
    </div>
  );
}
