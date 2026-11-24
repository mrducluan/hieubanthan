// GĐ 3 — Kiểm thử E2E & kiểm tuân thủ ngôn từ cho Thư viện Hỏi–Đáp Tình huống Đa Hệ Thống (/hoi-dap & /hoi-dap/[slug]).
import { test, expect } from "@playwright/test";
import { TINH_HUONG_HOI_DAP } from "../lib/hoi-dap-mau";
import { kiemTraLoi } from "../lib/chuyen-gia-hoi";

test("thuần: cả 12 tình huống minh hoạ đều vượt qua bộ lọc an toàn kiemTraLoi (0 tên bệnh, 0 phán hung, 0 link/SĐT)", () => {
  expect(TINH_HUONG_HOI_DAP.length).toBeGreaterThanOrEqual(12);
  const slugs = new Set(TINH_HUONG_HOI_DAP.map((t) => t.slug));
  expect(slugs.size).toBe(TINH_HUONG_HOI_DAP.length);

  for (const t of TINH_HUONG_HOI_DAP) {
    const toanVan = [
      t.cauHoi,
      t.tomTat,
      t.boiCanhAnDanh,
      ...t.doiChieuDaHeThong.map((d) => d.nhanDinh),
      t.diemTrungVaKhac,
      ...t.hanhDongThucTe,
      ...t.hoiDapNgan.flatMap((q) => [q.hoi, q.dap]),
    ].join(" ");
    const kq = kiemTraLoi(toanVan);
    expect(kq.chan, `Slug ${t.slug} bị chặn: ${kq.chan.join(", ")}`).toEqual([]);
    expect(kq.canh_bao, `Slug ${t.slug} bị cảnh báo: ${kq.canh_bao.join(", ")}`).toEqual([]);
  }
});

test("/hoi-dap: 0 vi phạm CSP, hiển thị 12 tình huống, lọc theo mảng & không tràn ngang trên 390px", async ({ page }) => {
  const vp: string[] = [];
  page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) vp.push(m.text()); });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hoi-dap");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hỏi – Đáp tình huống đời sống");
  await expect(page.getByTestId("hd-danh-sach").locator("a")).toHaveCount(TINH_HUONG_HOI_DAP.length);

  // Lọc theo mảng Tử vi → chỉ còn các tình huống Tử vi
  await page.getByTestId("loc-mang-tuvi").click();
  const soTuVi = TINH_HUONG_HOI_DAP.filter((t) => t.mang === "tuvi").length;
  await expect(page.getByTestId("hd-danh-sach").locator("a")).toHaveCount(soTuVi);

  // Không tràn ngang trên điện thoại 390px
  const tran = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(tran).toBe(false);
  expect(vp).toEqual([]);
});

test("/hoi-dap/[slug]: đủ 3 phần, JSON-LD Article + FAQPage + BreadcrumbList (không dùng QAPage), slug lạ trả 404", async ({ page, request }) => {
  const dau = TINH_HUONG_HOI_DAP[0]!;
  await page.goto(`/hoi-dap/${dau.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(dau.cauHoi);
  await expect(page.locator("body")).toContainText("Tình huống minh hoạ tổng hợp");
  await expect(page.locator("body")).toContainText("Phần 1");
  await expect(page.locator("body")).toContainText("Phần 2");
  await expect(page.locator("body")).toContainText("Phần 3");

  const ldText = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ldText).toContain('"Article"');
  expect(ldText).toContain('"FAQPage"');
  expect(ldText).toContain('"BreadcrumbList"');
  expect(ldText).not.toContain('"QAPage"');

  const bon04 = await request.get("/hoi-dap/slug-khong-ton-tai");
  expect(bon04.status()).toBe(404);
});

test("/sitemap.xml có /hoi-dap và các slug tình huống", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/hoi-dap</loc>");
  expect(xml).toContain(`/hoi-dap/${TINH_HUONG_HOI_DAP[0]!.slug}</loc>`);
});
