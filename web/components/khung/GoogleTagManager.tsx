import Script from "next/script";

// Google Tag Manager — CHỈ khi có NEXT_PUBLIC_GTM_ID (đặt riêng cho Production trên Vercel).
// Dùng next/script, không thêm gói npm. Mã container không phải bí mật nhưng vẫn qua env
// để bản thử (Preview) và máy dev không bắn số liệu vào GTM thật.
// LƯU Ý khi thêm thẻ trong GTM: không bật ghi giá trị ô nhập (ngày/giờ sinh, họ tên).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
const HOP_LE = /^GTM-[A-Z0-9]+$/.test(GTM_ID);

/** Đặt trong <head>: nạp gtm.js. */
export function GtmScript() {
  if (!HOP_LE) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/** Đặt ngay sau thẻ mở <body>: dự phòng khi trình duyệt tắt JavaScript. */
export function GtmNoScript() {
  if (!HOP_LE) return null;
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
