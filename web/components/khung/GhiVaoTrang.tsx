"use client";
// Gate 1/2 — "Vào trang": landing_viewed MỘT lần mỗi phiên, ở bất kỳ trang đầu tiên nào (không chỉ trang chủ), kèm
// nhóm trang (nguon = đoạn đường dẫn đầu, vd tu-vi, kien-thuc, blog; loai = kien_thuc | khac — sau QH-URL trang kiến
// thức nằm dưới đoạn đầu của mảng nên phải tách bằng loai). Link chia sẻ có ?tu=<mã> (thẻ "Hôm nay"…) →
// nhớ mã để hồ sơ đầu tiên tính referral_signup (K-factor), ghi share_clicked phía người nhận.
import { useEffect } from "react";
import { ghi, lanDauTrongPhien, nhoMaMoi } from "@/lib/do-luong";
import { laTrangKienThuc } from "@/lib/duong-silo";

export function GhiVaoTrang() {
  useEffect(() => {
    const u = new URL(window.location.href);
    const tu = u.searchParams.get("tu");
    if (tu === "push" && lanDauTrongPhien("tu.push")) ghi("chart_interacted", { kind: "push_mo" });   // bấm thông báo nhắc (sw.js)
    if (tu && /^[a-z]{2}\.[a-f0-9]{10}$/.test(tu)) {
      nhoMaMoi(tu);
      if (lanDauTrongPhien(`tu.${tu}`)) ghi("share_clicked", { kind: tu.split(".")[0], ma_moi: tu });
    }
    const nguon = u.pathname.split("/")[1] || "trang_chu";
    if (nguon === "quan-tri") return;   // người vận hành, không phải người dùng
    if (lanDauTrongPhien("vao-trang")) ghi("landing_viewed", { nguon, loai: laTrangKienThuc(u.pathname) ? "kien_thuc" : "khac" });
  }, []);
  return null;
}
