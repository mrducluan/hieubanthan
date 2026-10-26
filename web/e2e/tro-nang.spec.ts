// A11Y-1 — chặn tái phát tương phản ở giao diện "Giấy cổ" của lá số (nền sáng): mọi chữ HTML trong vùng giấy
// và chữ SVG lá số phải đạt ≥ 4.5:1 (WCAG AA) so với nền ô. Rà đầy đủ: scripts/kiem-tra-tro-nang.mjs.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

for (const duong of ["/tu-vi", "/bat-tu"]) {
  test(`tương phản Giấy cổ đạt AA: ${duong}`, async ({ page }) => {
    await napHoSo(page);
    await page.goto(duong === "/bat-tu" ? "/bat-tu#la-so-chi-tiet" : duong);   // Bát tự: bảng kỹ thuật gập, link # mở sẵn
    await page.getByRole("tab", { name: "Giấy cổ" }).first().click();
    await expect(page.locator(".la-so-giay").first()).toBeVisible();
    const loi = await page.evaluate(() => {
      const so = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = ([r, g, b]: number[]) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!); };
      const ti = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
      const vung = document.querySelector(".la-so-giay")!;
      const cs = getComputedStyle(vung);
      const nen = ["--ls-nen", "--ls-o", "--ls-o-sang", "--ls-menh-nen"].map((v) => so(cs.getPropertyValue(v)));
      const ra: string[] = [];
      for (const el of vung.querySelectorAll<HTMLElement | SVGTextElement>("text, p, span, dt, dd, li, summary, h2, h3")) {
        const c = getComputedStyle(el);
        if (!el.textContent?.trim() || c.display === "none" || c.visibility === "hidden" || Number(c.opacity) < 0.6) continue;
        const mau = so(el instanceof SVGElement ? c.fill : c.color);
        if (mau.length < 3 || (mau.length > 3 && mau[3]! < 0.6)) continue;
        if (nen.some((n) => n.slice(0, 3).every((v, i) => Math.abs(v - mau[i]!) < 3))) continue;   // chữ đục trên nhãn đậm
        if (el.closest("[class*='bg-']") && el.closest("[class*='bg-']") !== vung) continue;        // nằm trên nhãn có nền riêng
        const thap = Math.min(...nen.map((n) => ti(mau, n)));
        if (thap < 4.5) ra.push(`${thap.toFixed(2)} "${el.textContent.trim().slice(0, 30)}"`);
      }
      return [...new Set(ra)];
    });
    expect(loi).toEqual([]);
  });
}
