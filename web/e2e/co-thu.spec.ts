// TV-CTP — cụm cổ thư Tử vi /tu-vi/co-thu: trang trụ "Đẩu Số Cốt Tuỷ Phú" (engine kb/trang_co_thu.py).
// HTML máy chủ đủ 84 câu (nguyên văn phồn thể, phiên âm, nghĩa, "Câu này nói về lá số khi…", neo #cau-n), mỗi phần một H2,
// schema Article + citation + FAQPage + breadcrumb, bản .md, sitemap, cụm, thanh mảng; trang "sao ở cung" trích ≤ 2 câu và
// trỏ về trang trụ. Nguồn nội bộ (bản chép, đối chiếu) không lộ ra HTML (BM-1).
import { test, expect } from "@playwright/test";

const DUONG = "/tu-vi/co-thu/cot-tuy-phu";

test("trang trụ Cốt Tuỷ Phú: 84 câu có neo, phần là H2, schema, breadcrumb", async ({ request }) => {
  const r = await request.get(DUONG);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Đẩu Số Cốt Tuỷ Phú: nguyên văn, phiên âm và nghĩa đời thường/);
  for (const n of [1, 6, 19, 52, 84]) expect(html).toContain(`id="cau-${n}"`);
  expect((html.match(/id="cau-\d+"/g) ?? []).length).toBe(84);
  expect(html).toContain("命無正曜，夭折孤貧。吉有凶星，美玉瑕玷。");
  expect(html).toContain("Mệnh vô chính diệu, yểu chiết cô bần.");
  expect(html).toContain("Câu này nói về lá số khi");
  expect((html.match(/<h2[^>]*>Phần \d+\./g) ?? []).length).toBe(12);
  expect(html).toContain("Các cách cục bài phú nhắc tới");
  expect(html).toContain('"@type":"Article"');
  expect(html).toContain('"citation"');
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('href="/tu-vi/co-thu"');
  for (const x of ["iztro", "wikisource", "Wikisource", "oldid", "github.com", "nháp AI", "sha256"]) expect(html).not.toContain(x);
  // liên kết sang trang sao ở cung
  expect(html).toContain('href="/tu-vi/sao-o-cung/that-sat-cung-menh"');
});

test("bản .md, trang cụm, sitemap, slug lạ 404", async ({ request }) => {
  const md = await request.get(`${DUONG}.md`);
  expect(md.status()).toBe(200);
  const van = await md.text();
  expect(van).toContain("> 七殺朝斗爵祿榮昌，紫府同宮終身福厚。");
  expect(van).toContain("> Câu này nói về lá số khi ");
  const cum = await (await request.get("/tu-vi/co-thu")).text();
  expect(cum).toContain(`href="${DUONG}"`);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain(`${DUONG}</loc>`);
  expect((await request.get("/tu-vi/co-thu/khong-co-trang")).status()).toBe(404);
});

test("trang sao ở cung trích Cốt Tuỷ Phú (≤ 2 câu) và trỏ về trang trụ", async ({ request }) => {
  const html = await (await request.get("/tu-vi/sao-o-cung/that-sat-cung-menh")).text();
  expect(html).toContain("Đẩu Số Cốt Tuỷ Phú nói gì");
  expect(html).toContain("七殺朝斗爵祿榮昌");
  expect(html).toContain(`href="${DUONG}"`);
});

test("thanh mảng Tử vi có mục Cổ thư, sáng khi đang ở trang trụ", async ({ page }) => {
  await page.goto(DUONG);
  const tm = page.locator("[data-thanh-mang=tuvi]:visible");
  await expect(tm.getByRole("link", { name: /Cổ thư/ })).toHaveAttribute("href", "/tu-vi/co-thu");
  await expect(tm.locator("[aria-current]")).toHaveCount(1);
});
