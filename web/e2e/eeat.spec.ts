// EEAT-1: tên chuyên gia chỉ đứng đúng vai trò — tác giả (bài tự viết), chủ biên (mọi bài), thẩm định (bài đã duyệt).
// BM-1: bài chưa thẩm định ghi Ban biên tập, không gắn chữ AI; trang công khai không lộ thư viện / nhà cung cấp.
import { test, expect } from "@playwright/test";

type Nut = Record<string, unknown> & { "@type": string };
async function ldCua(request: import("@playwright/test").APIRequestContext, duong: string): Promise<Nut[]> {
  const html = await (await request.get(duong)).text();
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)]
    .flatMap((m) => { const x = JSON.parse(m[1]!); return x["@graph"] ?? [x]; });
}

test("bài chuyên gia tự viết: Tác giả Đức Luân, schema author là Person", async ({ page, request }) => {
  await page.goto("/than-so/y-nghia-so/so-7");
  const dong = page.locator("[data-dong-tac-gia]");
  await expect(dong).toContainText("Tác giả: Đức Luân");
  await expect(dong).toContainText("Chuyên gia tự biên soạn");
  const ld = await ldCua(request, "/than-so/y-nghia-so/so-7");
  const bai = ld.find((n) => n["@type"] === "Article")!;
  expect((bai.author as { "@id": string })["@id"]).toMatch(/\/tac-gia\/duc-luan#nguoi$/);
  expect(ld.some((n) => n["@type"] === "Person" && n.name === "Đức Luân")).toBe(true);
});

test("bài chưa thẩm định: Ban biên tập + Chủ biên, không ghi tác giả hay đã thẩm định, không chữ AI", async ({ page, request }) => {
  await page.goto("/tu-vi/chinh-tinh/sao-tu-vi");
  const dong = page.locator("[data-dong-tac-gia]");
  await expect(dong).toContainText("Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên Đức Luân duyệt xuất bản");
  await expect(dong).not.toContainText("AI");
  await expect(dong).not.toContainText("Tác giả");
  await expect(dong).not.toContainText("đã thẩm định");
  const ld = await ldCua(request, "/tu-vi/chinh-tinh/sao-tu-vi");
  const bai = ld.find((n) => n["@type"] === "Article")!;
  expect((bai.author as { "@type": string })["@type"]).toBe("Organization");
  expect((bai.editor as { "@id": string })["@id"]).toMatch(/duc-luan#nguoi$/);
  expect(ld.find((n) => n["@type"] === "WebPage")).not.toHaveProperty("reviewedBy");
  // Bản .md cho bot AI ghi cùng trạng thái
  const md = await (await request.get("/tu-vi/chinh-tinh/sao-tu-vi.md")).text();
  expect(md).toContain("Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên [Đức Luân]");
  expect(md).toContain("duyệt xuất bản");
  expect(md).not.toMatch(/\bAI\b|thẩm định:/);
});

test("hồ sơ /tac-gia/duc-luan: h1, ProfilePage + Person, số bài, link từ byline", async ({ page, request }) => {
  await page.goto("/than-so/y-nghia-so/so-1");
  await page.locator("[data-dong-tac-gia]").getByRole("link", { name: "Đức Luân" }).click();
  await expect(page).toHaveURL(/\/tac-gia\/duc-luan$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đức Luân");
  await expect(page.getByText("Hơn 15 năm nghiên cứu").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bài anh biên soạn" })).toBeVisible();
  const ld = await ldCua(request, "/tac-gia/duc-luan");
  expect(ld.map((n) => n["@type"])).toEqual(expect.arrayContaining(["ProfilePage", "Person", "BreadcrumbList"]));
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/tac-gia/duc-luan");
  expect((await request.get("/tac-gia/khong-co")).status()).toBe(404);
});

// BM-1: chi tiết kỹ thuật nội bộ (thư viện, bộ đối chiếu, nhà cung cấp, phiên bản, nhãn nháp AI) không hiện ra trang công khai.
const LO = /iztro|lasotuvi|lunar-typescript|VSOP|TuViMCP|anko|tianji|aov\.cc|ctext|OpenRouter|Vercel|\bRender\b|Supabase|PostHog|Sentry|\bMIT\b|Balliett|Jordan|Hồ Ngọc Đức|mã nguồn mở|localStorage|hbt\.|AI hỗ trợ|nháp AI|AI nháp|chờ chuyên gia thẩm định/;
for (const duong of ["/gioi-thieu", "/chinh-sach-rieng-tu", "/mien-tru-trach-nhiem", "/dieu-khoan", "/tac-gia/duc-luan",
  "/than-so/tinh-yeu/so-1-trong-tinh-yeu", "/than-so/nghe-nghiep/so-1-hop-nghe-gi", "/hop-doi/cap-so/so-chu-dao-1-va-2", "/tu-vi/tu-hoa/hoa-loc-cung-menh", "/tu-vi/sao-o-cung/tu-vi-cung-menh", "/kinh-dich/que/que-1-can",
  "/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi", "/than-so/nam-ca-nhan/nam-ca-nhan-1", "/tu-dien", "/than-so/tinh-yeu/so-1-trong-tinh-yeu.md", "/tu-vi/tu-hoa/hoa-loc-cung-menh.md", "/llms.txt",
  "/lich-am/2025", "/doi-lich-am-duong", "/xem-tuoi-lam-nha/2026", "/tuoi-xong-dat/2027", "/xem-ngay-tot/cuoi-hoi-thang-12-2026"]) {
  test(`không lộ chi tiết nội bộ: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const chu = (await r.text()).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    expect(chu.match(LO)?.[0] ?? null).toBeNull();
  });
}
