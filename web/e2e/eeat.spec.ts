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
  await page.goto("/kien-thuc/than-so/so-7");
  const dong = page.locator("[data-dong-tac-gia]");
  await expect(dong).toContainText("Tác giả: Đức Luân");
  await expect(dong).toContainText("Chuyên gia tự biên soạn");
  const ld = await ldCua(request, "/kien-thuc/than-so/so-7");
  const bai = ld.find((n) => n["@type"] === "Article")!;
  expect((bai.author as { "@id": string })["@id"]).toMatch(/\/tac-gia\/duc-luan#nguoi$/);
  expect(ld.some((n) => n["@type"] === "Person" && n.name === "Đức Luân")).toBe(true);
});

test("bài chưa thẩm định: Ban biên tập + Chủ biên, không ghi tác giả hay đã thẩm định, không chữ AI", async ({ page, request }) => {
  await page.goto("/kien-thuc/tu-vi/sao-tu-vi");
  const dong = page.locator("[data-dong-tac-gia]");
  await expect(dong).toContainText("Ban biên tập Hiểu Bản Thân · Chủ biên: Đức Luân");
  await expect(dong).not.toContainText("AI");
  await expect(dong).not.toContainText("Tác giả");
  await expect(dong).not.toContainText("đã thẩm định");
  const ld = await ldCua(request, "/kien-thuc/tu-vi/sao-tu-vi");
  const bai = ld.find((n) => n["@type"] === "Article")!;
  expect((bai.author as { "@type": string })["@type"]).toBe("Organization");
  expect((bai.editor as { "@id": string })["@id"]).toMatch(/duc-luan#nguoi$/);
  expect(ld.find((n) => n["@type"] === "WebPage")).not.toHaveProperty("reviewedBy");
  // Bản .md cho bot AI ghi cùng trạng thái
  const md = await (await request.get("/kien-thuc/tu-vi/sao-tu-vi.md")).text();
  expect(md).toContain("Ban biên tập Hiểu Bản Thân · Chủ biên: [Đức Luân]");
  expect(md).not.toMatch(/\bAI\b|thẩm định:/);
});

test("hồ sơ /tac-gia/duc-luan: h1, ProfilePage + Person, số bài, link từ byline", async ({ page, request }) => {
  await page.goto("/kien-thuc/than-so/so-1");
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
  "/kien-thuc/tinh-yeu/so-1-trong-tinh-yeu", "/kien-thuc/nghe-nghiep/so-1-hop-nghe-gi", "/kien-thuc/hop-so/so-chu-dao-1-va-2", "/kien-thuc/tu-hoa/hoa-loc-cung-menh", "/kien-thuc/sao-cung/tu-vi-cung-menh", "/kien-thuc/kinh-dich/que-1-can",
  "/kien-thuc/menh-tuoi/sinh-nam-1990-menh-gi", "/kien-thuc/nam-ca-nhan/nam-ca-nhan-1", "/tu-dien", "/kien-thuc/tinh-yeu/so-1-trong-tinh-yeu.md", "/kien-thuc/tu-hoa/hoa-loc-cung-menh.md", "/llms.txt"]) {
  test(`không lộ chi tiết nội bộ: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const chu = (await r.text()).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    expect(chu.match(LO)?.[0] ?? null).toBeNull();
  });
}
