// Google Tag Manager — phần <noscript> (trình duyệt tắt JavaScript), đặt ngay sau thẻ mở <body>.
// Đoạn nạp gtm.js nằm ở DoLuongGoogle (mang nonce CSP + Consent Mode v2) — không nạp lần thứ hai ở đây.
// LƯU Ý khi thêm thẻ trong GTM: không bật ghi giá trị ô nhập (ngày/giờ sinh, họ tên).
import { GTM_ID } from "@/lib/ma-google";

export function GtmNoScript() {
  if (!/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
