"use client";
// Thông báo nhắc mở /hom-nay#<khối> (lib/web-push.ts, sw.js). Khối trên Hôm nay vẽ SAU khi đọc hồ sơ trên máy, nên lúc
// trang tải trình duyệt chưa thấy neo để tự cuộn → chờ khối xuất hiện (tối đa 8 giây) rồi cuộn MỘT lần. Người dùng đã tự
// cuộn trong lúc chờ → thôi, không giật trang.
import { useEffect } from "react";

export function CuonToiNeo() {
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!/^[a-z0-9-]{2,40}$/.test(id)) return;
    let xong = false, tuCuon = false;
    const thoi = () => { tuCuon = true; };
    const cuon = () => {
      if (xong || tuCuon) return;
      const el = document.getElementById(id);
      if (!el) return;
      xong = true;
      const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      (el.closest("section, [data-neo]") ?? el).scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
      dung();
    };
    const mo = new MutationObserver(cuon);
    const hen = window.setTimeout(() => dung(), 8000);
    function dung() { mo.disconnect(); window.clearTimeout(hen); removeEventListener("wheel", thoi); removeEventListener("touchmove", thoi); }
    addEventListener("wheel", thoi, { passive: true });
    addEventListener("touchmove", thoi, { passive: true });
    mo.observe(document.body, { childList: true, subtree: true });
    cuon();
    return dung;
  }, []);
  return null;
}
