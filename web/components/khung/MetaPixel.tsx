"use client";
// Meta Pixel (Facebook) — chủ dự án yêu cầu 2026-11-16, để đo chuyển đổi cho Meta Ads.
// Cùng cơ chế với GTM (PERF-2): đặt hàng đợi fbq ngay (rất nhẹ), còn fbevents.js chỉ nạp sau tương tác đầu tiên hoặc 8 giây
// sau `load` → không đẩy TBT. Script mang nonce CSP-2. Tôn trọng "Tuỳ chọn cookie": người dùng từ chối → fbq('consent','revoke').
// Pixel ID là mã công khai (nằm trong HTML mọi trang dùng Pixel); env NEXT_PUBLIC_META_PIXEL_ID ghi đè, đặt "off" để tắt.
import Script from "next/script";
import { useEffect } from "react";
import { HOI_DONG_Y, SU_KIEN, type LuaChon } from "@/lib/dong-y";

const MAC_DINH = "2153819128819535";
const PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? MAC_DINH).trim();
const BAT = /^\d{8,20}$/.test(PIXEL_ID);

type CuaSoFb = Window & { fbq?: (...a: unknown[]) => void };

export function MetaPixel({ nonce }: { nonce?: string }) {
  useEffect(() => {
    if (!BAT) return;
    const nghe = (e: Event) => {
      const v = (e as CustomEvent<LuaChon | null>).detail;
      const cho = v === "dong_y" || (v === null && !HOI_DONG_Y);
      (window as CuaSoFb).fbq?.("consent", cho ? "grant" : "revoke");
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  if (!BAT) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" nonce={nonce}>{`!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);
fbq('init',${JSON.stringify(PIXEL_ID)});fbq('track','PageView');
(function(d){var n=d.currentScript&&d.currentScript.nonce;
var ev=['pointerdown','keydown','touchstart','scroll','wheel'],go=false,t;
function nap(){if(go)return;go=true;clearTimeout(t);ev.forEach(function(e){removeEventListener(e,nap)});
var s=d.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';if(n)s.setAttribute('nonce',n);d.head.appendChild(s);}
ev.forEach(function(e){addEventListener(e,nap,{passive:true})});
function hen(){t=setTimeout(nap,8000);}
if(d.readyState==='complete')hen();else addEventListener('load',hen,{once:true});})(document);`}</Script>
    </>
  );
}

/** <noscript> ảnh 1×1 của Pixel — đặt trong <body>. */
export function MetaPixelNoScript() {
  if (!BAT) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
    </noscript>
  );
}
