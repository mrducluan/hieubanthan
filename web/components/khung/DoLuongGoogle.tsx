"use client";
// Google Tag Manager / GA4 — chủ dự án chốt 2026-10-09: GTM nạp trên MỌI trang ngay khi mở (không chờ đồng ý).
// Consent Mode v2: lựa chọn cookie điều khiển analytics_storage — Đồng ý → granted; Từ chối → denied (GA4 chỉ gửi tín
// hiệu ẩn danh, không cookie _ga); chưa chọn → granted khi tắt hỏi (HOI_DONG_Y, traffic thấp), denied khi bật hỏi.
// QC-G (chủ dự án quyết 2026-11-23): ad_storage + ad_user_data theo CÙNG lựa chọn đó (đo chuyển đổi Google Ads, tối ưu giá
// thầu); ad_personalization (tiếp thị lại) chỉ khi bật QC_CA_NHAN_HOA. Đồng ý → lưu mã lượt bấm quảng cáo (gclid…) 90 ngày
// trên máy để gửi kèm đơn nạp (chuyển đổi offline); Từ chối → xoá mã đó.
// Script mang nonce của lượt tải (CSP-2) → không bị CSP chặn; gtm.js và mọi thẻ GTM nạp sau đó chạy nhờ 'strict-dynamic'.
// Có GTM thì dùng GTM (GA4 cấu hình trong GTM); không có GTM mà có GA_ID thì gắn gtag.js trực tiếp.
import Script from "next/script";
import { useEffect } from "react";
import { coGoogle, GA_ID, GTM_ID, HOI_DONG_Y, SU_KIEN, type LuaChon } from "@/lib/dong-y";
import { KHOA_DONG_Y, KHOA_GCLID, QC_CA_NHAN_HOA } from "@/lib/ma-google";

type CuaSoGoogle = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

function xoaCookieGa() {
  const goc = window.location.hostname.split(".").slice(-2).join(".");
  for (const c of document.cookie.split(";")) {
    const ten = (c.split("=")[0] ?? "").trim();
    if (ten === "_ga" || ten.startsWith("_ga_") || ten === "_gid" || ten.startsWith("_gcl_")) {
      for (const d of ["", `; domain=${goc}`, `; domain=.${goc}`]) document.cookie = `${ten}=; Max-Age=0; path=/${d}`;
    }
  }
}

// Chạy TRƯỚC gtm.js: đặt trạng thái đồng ý mặc định theo lựa chọn đã lưu trên máy.
const KHOI_DONG = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem(${JSON.stringify(KHOA_DONG_Y)})}catch(e){}
var g=c==='dong_y'||(c===null&&${!HOI_DONG_Y})?'granted':'denied';
gtag('consent','default',{analytics_storage:g,ad_storage:g,ad_user_data:g,ad_personalization:${QC_CA_NHAN_HOA}?g:'denied',wait_for_update:500});
if(g==='granted'){try{var q=new URLSearchParams(location.search),ks=['gclid','gbraid','wbraid'];for(var i=0;i<3;i++){var v=q.get(ks[i]);if(v&&/^[A-Za-z0-9_-]{10,200}$/.test(v)){localStorage.setItem(${JSON.stringify(KHOA_GCLID)},JSON.stringify({k:ks[i],v:v,t:Date.now()}));break;}}}catch(e){}}`;

export function DoLuongGoogle({ nonce }: { nonce?: string }) {
  useEffect(() => {
    if (!coGoogle()) return;
    const nghe = (e: Event) => {
      const v = (e as CustomEvent<LuaChon | null>).detail;
      const cho = v === "dong_y" || (v === null && !HOI_DONG_Y);
      const t = cho ? "granted" : "denied";
      (window as CuaSoGoogle).gtag?.("consent", "update", { analytics_storage: t, ad_storage: t, ad_user_data: t,
        ad_personalization: QC_CA_NHAN_HOA ? t : "denied" });
      if (!cho) { xoaCookieGa(); try { localStorage.removeItem(KHOA_GCLID); } catch { /* bỏ qua */ } }
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  if (GTM_ID) {
    // PERF-2: đồng ý mặc định + dataLayer đặt NGAY (rất nhẹ); gtm.js (kéo theo GA4 + thẻ) chờ người dùng tương tác / hạn chờ.
    return (
      <Script id="gtm" strategy="afterInteractive" nonce={nonce}>{`${KHOI_DONG}
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
(function(d){var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+${JSON.stringify(GTM_ID)};var n=d.currentScript&&d.currentScript.nonce;if(n)s.setAttribute('nonce',n);
var ev=['pointerdown','keydown','touchstart','scroll','wheel'],go=false,t;
function nap(){if(go)return;go=true;clearTimeout(t);ev.forEach(function(e){removeEventListener(e,nap)});d.head.appendChild(s);}
ev.forEach(function(e){addEventListener(e,nap,{passive:true})});
function hen(){t=setTimeout(nap,8000);}
if(d.readyState==='complete')hen();else addEventListener('load',hen,{once:true});})(document);`}</Script>
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
