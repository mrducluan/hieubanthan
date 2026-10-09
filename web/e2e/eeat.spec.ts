// EEAT-1: tên chuyên gia chỉ đứng đúng vai trò — tác giả (bài tự viết), chủ biên (mọi bài), thẩm định (bài đã duyệt).
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

test("bài biên soạn có AI hỗ trợ chưa duyệt: chỉ ghi Chủ biên, không ghi tác giả hay đã thẩm định", async ({ page, request }) => {
  await page.goto("/kien-thuc/tu-vi/sao-tu-vi");
  const dong = page.locator("[data-dong-tac-gia]");
  await expect(dong).toContainText("Chủ biên: Đức Luân");
  await expect(dong).toContainText("đang chờ chuyên gia thẩm định");
  await expect(dong).not.toContainText("Tác giả");
  await expect(dong).not.toContainText("đã thẩm định");
  const ld = await ldCua(request, "/kien-thuc/tu-vi/sao-tu-vi");
  const bai = ld.find((n) => n["@type"] === "Article")!;
  expect((bai.author as { "@type": string })["@type"]).toBe("Organization");
  expect((bai.editor as { "@id": string })["@id"]).toMatch(/duc-luan#nguoi$/);
  expect(ld.find((n) => n["@type"] === "WebPage")).not.toHaveProperty("reviewedBy");
  // Bản .md cho bot AI ghi cùng trạng thái
  const md = await (await request.get("/kien-thuc/tu-vi/sao-tu-vi.md")).text();
  expect(md).toContain("Chủ biên: [Đức Luân]");
  expect(md).toContain("đang chờ chuyên gia thẩm định");
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
