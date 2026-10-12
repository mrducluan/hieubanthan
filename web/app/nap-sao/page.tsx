// /nap-sao — nạp Sao (khâu 5 của vòng tăng trưởng, docs/KE-HOACH-THANH-TOAN.md). Một trang, ít bước: chọn gói →
// sang trang payOS quét QR bằng app ngân hàng / ví bất kỳ → quay về /nap-sao/ket-qua, Sao vào ngay khi tiền về.
import type { Metadata } from "next";
import Link from "next/link";
import { metaTrang } from "@/lib/seo";
import { congDangBat, dsGoiSao } from "@/lib/thanh-toan/cong";
import { NapSao } from "./NapSao";

export const metadata: Metadata = {
  ...metaTrang({ tieuDe: "Nạp Sao", moTa: "Nạp Sao để mở Luận giải toàn bộ và các tính năng chuyên sâu. Thanh toán bằng QR chuyển khoản qua app ngân hàng hoặc ví điện tử.", duong: "/nap-sao" }),
  robots: { index: false, follow: true },
};

export default async function Page() {
  const [goi, cong] = [await dsGoiSao(), congDangBat()];
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Ví Sao</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Nạp Sao</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Phần lớn công cụ vẫn miễn phí. Sao dùng cho những phần tốn chi phí thật như Luận giải toàn bộ. Giá ghi bằng đồng,
        thanh toán một lần, không tự gia hạn.
      </p>
      <NapSao goi={goi} cong={cong} />
      <section className="mt-10 space-y-2 text-sm leading-relaxed text-fg-muted" aria-label="Điều cần biết">
        <h2 className="font-serif text-xl text-fg">Điều cần biết</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Sao là điểm dùng trong Hiểu Bản Thân: <b className="text-fg">không đổi ra tiền, không chuyển cho người khác</b>. Sao mua không hết hạn.</li>
          <li>Quét mã QR bằng app ngân hàng hoặc ví điện tử (MoMo, ZaloPay…) có hỗ trợ VietQR. Đừng sửa số tiền hay nội dung chuyển khoản.</li>
          <li>Thẻ Visa/Mastercard và thanh toán quốc tế sẽ mở sau.</li>
          <li>Trả tiền rồi mà chưa thấy Sao sau 10 phút: gửi mã đơn qua <Link href="/lien-he" className="text-gold hover:underline">trang Liên hệ</Link>, ban quản trị đối soát và cộng tay hoặc hoàn tiền.</li>
          <li>Hoàn tiền: nạp nhầm và chưa dùng Sao, liên hệ trong 7 ngày. Chi tiết ở <Link href="/dieu-khoan#sao" className="text-gold hover:underline">Điều khoản</Link>.</li>
        </ul>
      </section>
    </div>
  );
}
