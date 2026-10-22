// SEO-L (chủ dự án duyệt 2026-10-22) — trang trụ theo năm (làm nhà, xông đất), ngày tốt theo việc, lịch âm theo năm,
// công cụ đổi lịch, ngày đăng/sửa thật trên trang kiến thức, engine lỗi → 5xx, sitemap + llms.txt có trang mới.
import { test, expect } from "@playwright/test";
import { VIEC_SEO, docDuong } from "../lib/hoang-lich";
import { khopMauCum } from "../lib/so-trang";

test("docDuong nhận trang việc-tháng; mẫu cụm CMS khớp đúng cụm", () => {
  expect(docDuong("cuoi-hoi-thang-12-2026")).toEqual({ loai: "viec", viec: VIEC_SEO[0], nam: 2026, thang: 12 });
  expect(docDuong("cat-toc-thang-12-2026")).toBeNull();
  expect(docDuong("cuoi-hoi-thang-13-2026")).toBeNull();
  expect(docDuong("thang-12-2026")).toEqual({ loai: "thang", nam: 2026, thang: 12 });
  expect(khopMauCum("/xem-ngay-tot/cuoi-hoi-thang-12-2026")?.mau.mau_duong).toBe("/xem-ngay-tot/{viec}-thang-{thang}-{nam}");
  expect(khopMauCum("/xem-ngay-tot/thang-12-2026")?.mau.mau_duong).toBe("/xem-ngay-tot/thang-{thang}-{nam}");
  expect(khopMauCum("/xem-tuoi-lam-nha/2027")?.bien).toEqual({ nam: "2027" });
  expect(khopMauCum("/lich-am/2027")?.bien).toEqual({ nam: "2027" });
});

test("trang trụ năm: tuổi làm nhà + tuổi xông đất 2027 (bảng 46 tuổi, link xuống trang con, schema)", async ({ request }) => {
  const ln = await request.get("/xem-tuoi-lam-nha/2027");
  expect(ln.status()).toBe(200);
  const h = await ln.text();
  expect(h).toMatch(/<h1[^>]*>Tuổi nào làm nhà, cưới hỏi năm 2027\?<\/h1>/);
  expect((h.match(/href="\/xem-tuoi-lam-nha\/2027\/tuoi-\d{4}"/g) ?? []).length).toBeGreaterThanOrEqual(46);
  for (const k of ['"@type":"ItemList"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"', "Trả lời nhanh"]) expect(h).toContain(k);
  const xd = await (await request.get("/tuoi-xong-dat/2027")).text();
  expect(xd).toContain("06/02/2027");                                   // mùng 1 Tết Đinh Mùi
  expect((xd.match(/href="\/tuoi-xong-dat\/2027\/tuoi-\d{4}"/g) ?? []).length).toBeGreaterThanOrEqual(46);
  // trang con có cấp năm trong breadcrumb, trang trụ công cụ trỏ tới bảng năm
  expect(await (await request.get("/xem-tuoi-lam-nha/2027/tuoi-1990")).text()).toContain('href="/xem-tuoi-lam-nha/2027"');
  expect(await (await request.get("/tuoi-xong-dat")).text()).toMatch(/href="\/tuoi-xong-dat\/\d{4}"/);
});

test("ngày tốt theo việc: cưới hỏi tháng 12/2026 — danh sách ngày link sang trang ngày, việc khác, tháng kề", async ({ request }) => {
  const r = await request.get("/xem-ngay-tot/cuoi-hoi-thang-12-2026");
  expect(r.status()).toBe(200);
  const h = await r.text();
  expect(h).toMatch(/<h1[^>]*>Ngày tốt cưới hỏi tháng 12 năm 2026<\/h1>/);
  expect(h).toContain('href="/xem-ngay-tot/2026-12-17"');              // ngày tốt engine trả (hoàng đạo, trực Trừ)
  expect(h).toContain('href="/xem-ngay-tot/khai-truong-thang-12-2026"');
  expect(h).toContain('href="/xem-ngay-tot/cuoi-hoi-thang-1-2027"');
  expect(h).toContain('"@type":"FAQPage"');
  expect((await request.get("/xem-ngay-tot/cat-toc-thang-12-2026")).status()).toBe(404);
  // trang tháng trỏ sang 6 việc
  expect(await (await request.get("/xem-ngay-tot/thang-12-2026")).text()).toContain('href="/xem-ngay-tot/cuoi-hoi-thang-12-2026"');
});

test("lịch âm 2025 (nhuận tháng 6) + công cụ đổi lịch", async ({ request, page }) => {
  const h = await (await request.get("/lich-am/2025")).text();
  expect(h).toMatch(/<h1[^>]*>Lịch âm năm 2025/);
  expect(h).toContain("Tháng 6 (nhuận)");
  expect(h).toContain("29/01/2025");                                    // Tết Ất Tỵ
  expect((await request.get("/lich-am/1800")).status()).toBe(404);
  await page.goto("/doi-lich-am-duong");
  await expect(page.locator("h1")).toContainText("Đổi lịch âm dương");
  const f = page.getByTestId("doi-lich");
  await f.getByLabel("Ngày").fill("17"); await f.getByLabel("Tháng").fill("2"); await f.getByLabel("Năm").fill("2026");
  await f.getByRole("button", { name: "Đổi ngày" }).click();
  await expect(page.getByTestId("ket-qua-doi-lich")).toContainText("1/1/2026");   // 17/02/2026 = mùng 1 Tết Bính Ngọ
});

test("trang kiến thức: ngày đăng + sửa thật (không còn một ngày cho cả kho)", async ({ request }) => {
  const a = await (await request.get("/tu-vi/sao-o-cung/tu-vi-cung-menh")).text();
  const b = await (await request.get("/than-so/y-nghia-so/so-7")).text();
  const ngay = (h: string) => h.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/)?.[1];
  expect(a).toMatch(/"datePublished":"\d{4}-\d{2}-\d{2}"/);
  expect(ngay(a)).toBeTruthy();
  expect(ngay(a)).not.toBe(ngay(b));                                    // hai họ trang sửa vào hai ngày khác nhau
});

test("sitemap + llms.txt có trang mới", async ({ request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const d of ["/doi-lich-am-duong<", "/lich-am/", "-thang-", "/xem-tuoi-lam-nha/20"]) expect(sm, d).toContain(d);
  expect(sm).toMatch(/\/xem-tuoi-lam-nha\/\d{4}<\/loc>/);
  expect(sm).toMatch(/\/xem-ngay-tot\/cuoi-hoi-thang-\d{1,2}-\d{4}<\/loc>/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("/doi-lich-am-duong");
  expect(llms).toContain("cuoi-hoi-thang-12-2026");
});
