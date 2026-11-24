"use client";
// HTT-1 — dải gợi ý bản tiếng Anh (thay "tự chuyển hướng theo Accept-Language / Geo-IP" của tài liệu Drive: Google khuyên không
// tự chuyển hướng, bot Mỹ sẽ không bao giờ thấy bản Việt). Máy chủ chỉ quyết "trình duyệt ưu tiên tiếng Anh, không kê tiếng Việt
// ở bất kỳ vị trí nào trong Accept-Language, và chưa tắt dải";
// máy chủ chọn link đích theo đường dẫn đang mở (bảng trang có bản Anh, header x-duong-dan) nên dải có ngay trong HTML;
// tắt = cookie 180 ngày. Không chuyển hướng.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ghi } from "@/lib/do-luong";

const COOKIE = "hbt-goi-y-en";

/** Q-I3: trên trang SEO công khai được cache CDN, `tuDongClient = true` để tự kiểm `navigator.languages` + cookie ở
 *  trình duyệt (tránh cá nhân hoá HTML theo Accept-Language/cookie trên bản cache chung). */
export function GoiYTiengAnh({ href, tuDongClient = false }: { href: string; tuDongClient?: boolean }) {
  const [hien, setHien] = useState(!tuDongClient);

  useEffect(() => {
    if (!tuDongClient) return;
    const ds = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((x) => x.toLowerCase());
    const uuTien = ds[0] ?? "";
    const coVi = ds.some((x) => x === "vi" || x.startsWith("vi-"));
    const daTat = document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE}=`));
    if (uuTien.startsWith("en") && !coVi && !daTat) setHien(true);
  }, [tuDongClient]);

  if (!hien) return null;
  const tat = () => {
    document.cookie = `${COOKIE}=1; path=/; max-age=${180 * 86400}; samesite=lax`;
    setHien(false);
    ghi("chart_interacted", { kind: "goi_y_en_tat" });
  };
  return (
    <div role="region" aria-label="English edition" data-testid="goi-y-tieng-anh" lang="en"
      className="border-b border-gold/30 bg-gold/10 text-sm text-fg">
      <div className="container flex items-center justify-between gap-3 py-2">
        <p>
          This site is in Vietnamese. <a href={href} hrefLang="en" className="font-medium text-gold underline-offset-4 hover:underline"
            onClick={() => ghi("chart_interacted", { kind: "goi_y_en_bam" })}>Read it in English →</a>
        </p>
        <button type="button" onClick={tat} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-bg-2 hover:text-fg">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
