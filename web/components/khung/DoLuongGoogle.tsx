"use client";
// Google Tag Manager / GA4 — chủ dự án chốt 2026-10-09: GTM nạp trên MỌI trang ngay khi mở (không chờ đồng ý).
// Consent Mode v2: lựa chọn cookie điều khiển analytics_storage — Đồng ý → granted; Từ chối → denied (GA4 chỉ gửi tín
// hiệu ẩn danh, không cookie _ga); chưa chọn → granted khi tắt hỏi (HOI_DONG_Y, traffic thấp), denied khi bật hỏi.
// Quảng cáo mặc định denied.
// Script mang nonce của lượt tải (CSP-2) → không bị CSP chặn; gtm.js và mọi thẻ GTM nạp sau đó chạy nhờ 'strict-dynamic'.
// Có GTM thì dùng GTM (GA4 cấu hình trong GTM); không có GTM mà có GA_ID thì gắn gtag.js trực tiếp.
import Script from "next/script";
import { useEffect } from "react";
import { coGoogle, GA_ID, GTM_ID, HOI_DONG_Y, SU_KIEN, type LuaChon } from "@/lib/dong-y";
import { KHOA_DONG_Y } from "@/lib/ma-google";

type CuaSoGoogle = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

function xoaCookieGa() {
  const goc = window.location.hostname.split(".").slice(-2).join(".");
  for (const c of document.cookie.split(";")) {
    const ten = (c.split("=")[0] ?? "").trim();
    if (ten === "_ga" || ten.startsWith("_ga_") || ten === "_gid") {
      for (const d of ["", `; domain=${goc}`, `; domain=.${goc}`]) document.cookie = `${ten}=; Max-Age=0; path=/${d}`;
    }
  }
}

// Chạy TRƯỚC gtm.js: đặt trạng thái đồng ý mặc định theo lựa chọn đã lưu trên máy.
const KHOI_DONG = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem(${JSON.stringify(KHOA_DONG_Y)})}catch(e){}
gtag('consent','default',{analytics_storage:c==='dong_y'||(c===null&&${!HOI_DONG_Y})?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`;

export function DoLuongGoogle({ nonce }: { nonce?: string }) {
  useEffect(() => {
    if (!coGoogle()) return;
    const nghe = (e: Event) => {
      const v = (e as CustomEvent<LuaChon | null>).detail;
      const cho = v === "dong_y" || (v === null && !HOI_DONG_Y);
      (window as CuaSoGoogle).gtag?.("consent", "update", { analytics_storage: cho ? "granted" : "denied" });
      if (!cho) xoaCookieGa();
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  if (GTM_ID) {
    return (
      <Script id="gtm" strategy="afterInteractive" nonce={nonce}>{`${KHOI_DONG}
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
(function(d){var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+${JSON.stringify(GTM_ID)};var n=d.currentScript&&d.currentScript.nonce;if(n)s.setAttribute('nonce',n);d.head.appendChild(s);})(document);`}</Script>
    );
  }
  if (!GA_ID) return null;
  return (
    <>
      <Script id="ga-khoi-dong" strategy="afterInteractive" nonce={nonce}>{`${KHOI_DONG}
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}</Script>
      <Script id="ga" strategy="afterInteractive" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} />
    </>
  );
}
