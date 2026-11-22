"use client";
// Meta Pixel (Facebook) — chủ dự án yêu cầu 2026-11-16, để đo chuyển đổi cho Meta Ads.
// Cùng cơ chế với GTM (PERF-2): đặt hàng đợi fbq ngay (rất nhẹ), còn fbevents.js chỉ nạp sau tương tác đầu tiên hoặc 8 giây
// sau `load` → không đẩy TBT. Script mang nonce CSP-2.
// Tôn trọng "Tuỳ chọn cookie": lựa chọn đã lưu áp TRƯỚC init — đã tắt → revoke và KHÔNG tải fbevents.js (không yêu cầu nào
// tới Meta); đổi ý → grant (tải lúc đó) / revoke.
// Riêng tư: tắt autoConfig (Meta tự thu chữ trên nút + metadata trang) và pushState tự động; trang mang mã thẻ / lời mời / quà
// (tên hiển thị trong URL) không gửi sự kiện nào — Meta không lọc URL được như PostHog (lib/lam-sach-url.ts).
// Pixel ID: lib/meta-id.ts (env NEXT_PUBLIC_META_PIXEL_ID ghi đè, "off" để tắt).
// META-QC: vào từ quảng cáo (?fbclid=) → ghi cookie _fbc NGAY (không chờ fbevents.js nạp sau tương tác — lúc đó người dùng
// có thể đã chuyển trang, mất fbclid). API chuyển đổi máy chủ đọc _fbc khi người dùng bấm nạp (lib/meta-capi.ts).
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { HOI_DONG_Y, SU_KIEN, type LuaChon } from "@/lib/dong-y";
import { KHOA_DONG_Y } from "@/lib/ma-google";
import { MA_QUA_URL, MA_TRONG_URL } from "@/lib/lam-sach-url";
import { metaPageView } from "@/lib/meta-pixel";
import { META_BAT, META_PIXEL_ID } from "@/lib/meta-id";

const PIXEL_ID = META_PIXEL_ID;
const BAT = META_BAT;

type CuaSoFb = Window & { fbq?: (...a: unknown[]) => void; __hbt_fb_tat?: boolean; __hbt_fb_nap?: () => void };

// CRO-1: chỉ TẢI fbevents.js trên hieuban.com — localhost, bản preview *.vercel.app không gửi gì về Meta (trước đây ~30 %
// sự kiện của dataset đến từ http://localhost/, kể cả 4 Purchase thử). Hàng đợi fbq vẫn dựng ở mọi nơi để test đọc được;
// e2e (NEXT_PUBLIC_E2E=1, mọi yêu cầu tới Meta đều bị chặn) mới cho tải ở localhost.
const MOI_TEN_MIEN = process.env.NEXT_PUBLIC_E2E === "1";

// Chạy một lần mỗi lượt tải trang. Cùng luật với lamSachUrl (regex lấy thẳng từ lib, không chép tay).
const KHOI_DONG = `!function(w,d){if(w.fbq)return;var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!w._fbq)w._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];n.disablePushState=!0;
var c=null;try{c=localStorage.getItem(${JSON.stringify(KHOA_DONG_Y)})}catch(e){}
var cho=c==='dong_y'||(c===null&&${!HOI_DONG_Y});w.__hbt_fb_tat=!cho;if(!cho)n('consent','revoke');
var fc=new URLSearchParams(location.search).get('fbclid');
if(cho&&fc&&/^[A-Za-z0-9_-]{1,400}$/.test(fc)&&d.cookie.indexOf('.'+fc)<0)d.cookie='_fbc=fb.1.'+Date.now()+'.'+fc+';max-age=7776000;path=/;samesite=lax'+(/(^|\\.)hieuban\\.com$/.test(location.hostname)?';domain=.hieuban.com':'')+(location.protocol==='https:'?';secure':'');
n('set','autoConfig',false,${JSON.stringify(PIXEL_ID)});n('init',${JSON.stringify(PIXEL_ID)});
var p=location.pathname.split('/'),ma=/${MA_TRONG_URL.source}/,qua=/${MA_QUA_URL.source}/,co=false;
for(var i=0;i<p.length;i++)if(ma.test(p[i])||(p[i-1]==='qua'&&qua.test(p[i])))co=true;
var q=new URLSearchParams(location.search);if(q.has('the')||q.has('ma'))co=true;
if(!co)n('track','PageView');
var ev=['pointerdown','keydown','touchstart','scroll','wheel'],go=false,t,nc=d.currentScript&&d.currentScript.nonce;
function nap(){if(go||w.__hbt_fb_tat||!(${MOI_TEN_MIEN}||/^(www\\.)?hieuban\\.com$/.test(location.hostname)))return;go=true;clearTimeout(t);ev.forEach(function(e){removeEventListener(e,nap)});
var s=d.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';if(nc)s.setAttribute('nonce',nc);d.head.appendChild(s);}
w.__hbt_fb_nap=nap;ev.forEach(function(e){addEventListener(e,nap,{passive:true})});
function hen(){t=setTimeout(nap,8000);}
if(d.readyState==='complete')hen();else addEventListener('load',hen,{once:true});}(window,document);`;

export function MetaPixel({ nonce }: { nonce?: string }) {
  const duong = usePathname();
  const truoc = useRef<string | null>(null);

  useEffect(() => {
    if (!BAT) return;
    const nghe = (e: Event) => {
      const v = (e as CustomEvent<LuaChon | null>).detail;
      const cho = v === "dong_y" || (v === null && !HOI_DONG_Y);
      const w = window as CuaSoFb;
      w.__hbt_fb_tat = !cho;
      w.fbq?.("consent", cho ? "grant" : "revoke");
      if (cho) w.__hbt_fb_nap?.();   // đồng ý sau khi đã tắt: giờ mới nạp fbevents.js
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  // PageView khi chuyển trang trong app (lượt tải đầu do script khởi động gửi).
  useEffect(() => {
    if (!BAT) return;
    // So với đường dẫn trước (không dùng cờ "lần đầu": StrictMode chạy effect hai lần → gửi PageView trùng).
    if (truoc.current === null || truoc.current === duong) { truoc.current = duong; return; }
    truoc.current = duong;
    metaPageView();
  }, [duong]);

  if (!BAT) return null;
  return <Script id="meta-pixel" strategy="afterInteractive" nonce={nonce}>{KHOI_DONG}</Script>;
}

/** <noscript> ảnh 1×1 của Pixel — đặt trong <body>. Không JS thì không đọc được lựa chọn cookie: chỉ gửi khi site không hỏi đồng ý. */
export function MetaPixelNoScript() {
  if (!BAT || HOI_DONG_Y) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
    </noscript>
  );
}
