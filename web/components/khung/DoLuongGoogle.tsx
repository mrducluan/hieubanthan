"use client";
// Google Tag Manager / GA4 — CHỈ tải sau khi người dùng bấm "Đồng ý" (lib/dong-y.ts). Có GTM thì dùng GTM (cấu hình GA4
// bên trong GTM); không có GTM mà có GA_ID thì gắn gtag.js trực tiếp. Consent Mode v2: analytics được phép, quảng cáo
// luôn từ chối (web không chạy quảng cáo). Rút lại đồng ý → báo Google từ chối + xoá cookie _ga.
import Script from "next/script";
import { useEffect, useState } from "react";
import { coGoogle, docLuaChon, GA_ID, GTM_ID, SU_KIEN, type LuaChon } from "@/lib/dong-y";

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

const KHOI_DONG = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`;

export function DoLuongGoogle({ nonce }: { nonce?: string }) {
  const [lc, setLc] = useState<LuaChon | null>(null);
  useEffect(() => {
    if (!coGoogle()) return;
    setLc(docLuaChon());
    const nghe = (e: Event) => {
      const v = (e as CustomEvent<LuaChon | null>).detail;
      if (v !== "dong_y") {
        (window as CuaSoGoogle).gtag?.("consent", "update", { analytics_storage: "denied" });
        xoaCookieGa();
      }
      setLc(v);
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  if (lc !== "dong_y") return null;
  if (GTM_ID) {
    return (
      <Script id="gtm" strategy="afterInteractive" nonce={nonce}>{`${KHOI_DONG}
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
(function(d){var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+${JSON.stringify(GTM_ID)};var n=d.currentScript&&d.currentScript.nonce;if(n)s.setAttribute('nonce',n);d.head.appendChild(s);})(document);`}</Script>
    );
  }
  return (
    <>
      <Script id="ga-khoi-dong" strategy="afterInteractive" nonce={nonce}>{`${KHOI_DONG}
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}</Script>
      <Script id="ga" strategy="afterInteractive" nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} />
    </>
  );
}
