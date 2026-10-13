"use client";
// Gate 1/2 — "Vào trang": landing_viewed MỘT lần mỗi phiên, ở bất kỳ trang đầu tiên nào (không chỉ trang chủ), kèm
// nhóm trang (nguon = đoạn đường dẫn đầu, vd tu-vi, kien-thuc, blog). Link chia sẻ có ?tu=<mã> (thẻ "Hôm nay"…) →
// nhớ mã để hồ sơ đầu tiên tính referral_signup (K-factor), ghi share_clicked phía người nhận.
import { useEffect } from "react";
import { ghi, lanDauTrongPhien, nhoMaMoi } from "@/lib/do-luong";

export function GhiVaoTrang() {
  useEffect(() => {
    const u = new URL(window.location.href);
    const tu = u.searchParams.get("tu");
    if (tu && /^[a-z]{2}\.[A-Za-z0-9_-]{6,16}$/.test(tu)) {
      nhoMaMoi(tu);
      if (lanDauTrongPhien(`tu.${tu}`)) ghi("share_clicked", { kind: tu.split(".")[0], ma_moi: tu });
    }
    if (lanDauTrongPhien("vao-trang")) ghi("landing_viewed", { nguon: u.pathname.split("/")[1] || "trang_chu" });
  }, []);
  return null;
}
