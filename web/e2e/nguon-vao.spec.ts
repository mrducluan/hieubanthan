// AUD-P0 (đo GEO, 2026-11): landing_viewed mang MÃ nguồn vào (ai / tim_kiem / mxh / truc_tiep / noi_bo / khac) + tên
// trợ lý AI khi có — chỉ mã cố định, không gửi URL giới thiệu (chỉ đọc tên miền, không lưu).
import { test, expect } from "@playwright/test";
import { phanLoaiNguon } from "../lib/nguon-vao";

test("phân loại nguồn vào theo referrer / utm_source", () => {
  const h = "hieuban.com";
  expect(phanLoaiNguon("https://chatgpt.com/", null, h)).toEqual({ den_tu: "ai", ai: "chatgpt" });
  expect(phanLoaiNguon("https://www.perplexity.ai/search?q=x", null, h)).toEqual({ den_tu: "ai", ai: "perplexity" });
  expect(phanLoaiNguon("https://gemini.google.com/app", null, h)).toEqual({ den_tu: "ai", ai: "gemini" });
  expect(phanLoaiNguon("https://copilot.microsoft.com/", null, h)).toEqual({ den_tu: "ai", ai: "copilot" });
  expect(phanLoaiNguon("https://claude.ai/chat/1", null, h)).toEqual({ den_tu: "ai", ai: "claude" });
  expect(phanLoaiNguon("", "chatgpt.com", h)).toEqual({ den_tu: "ai", ai: "chatgpt" });       // ChatGPT gắn utm_source
  expect(phanLoaiNguon("https://www.google.com/", null, h)).toEqual({ den_tu: "tim_kiem" });
  expect(phanLoaiNguon("https://www.google.com.vn/", null, h)).toEqual({ den_tu: "tim_kiem" });
  expect(phanLoaiNguon("https://mail.google.com/mail/u/0", null, h)).toEqual({ den_tu: "khac" });   // không phải tìm kiếm
  expect(phanLoaiNguon("", "chatgpt", h)).toEqual({ den_tu: "ai", ai: "chatgpt" });                  // utm chỉ là tên
  expect(phanLoaiNguon("", "Perplexity", h)).toEqual({ den_tu: "ai", ai: "perplexity" });
  expect(phanLoaiNguon("https://coccoc.com/search", null, h)).toEqual({ den_tu: "tim_kiem" });
  expect(phanLoaiNguon("https://l.facebook.com/l.php", null, h)).toEqual({ den_tu: "mxh" });
  expect(phanLoaiNguon("https://zalo.me/x", null, h)).toEqual({ den_tu: "mxh" });
  expect(phanLoaiNguon("", null, h)).toEqual({ den_tu: "truc_tiep" });
  expect(phanLoaiNguon("https://hieuban.com/tu-vi", null, h)).toEqual({ den_tu: "noi_bo" });
  expect(phanLoaiNguon("https://vi.wikipedia.org/wiki/x", null, h)).toEqual({ den_tu: "khac" });
  expect(phanLoaiNguon("không phải url", null, h)).toEqual({ den_tu: "khac" });
});

test("landing_viewed gửi mã nguồn, không gửi URL", async ({ page }) => {
  await page.goto("/huyen-hoc?utm_source=perplexity.ai");
  const lay = () => page.evaluate(() => ((window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])
    .find((e) => e.su_kien === "landing_viewed") ?? null);
  await expect.poll(lay).not.toBeNull();             // sự kiện ghi sau khi trang hydrate
  const lv = (await lay())!;
  expect(lv.den_tu).toBe("ai");
  expect(lv.ai).toBe("perplexity");
  expect(JSON.stringify(lv)).not.toContain("http");
});
