// QH-URL (phương án B, chủ dự án duyệt 2026-10-19): kiến thức nằm dưới trang công cụ của mảng — /{mảng}/{cụm}/{trang}.
// Kiểm: mọi URL cũ 308 thẳng tới URL mới (một bước, cả bản .md), URL mới 200 + canonical + breadcrumb theo silo,
// trang công cụ trỏ xuống các cụm, sitemap + liên kết nội bộ không còn URL cũ (không bắt Google đi chuyển hướng).
import { test, expect, type APIRequestContext } from "@playwright/test";
import CHUYEN from "../lib/chuyen-huong.json";

const tim308 = async (request: APIRequestContext, cu: string) => {
  const r = await request.get(cu, { maxRedirects: 0 });
  return { st: r.status(), den: r.headers().location ?? "" };
};

test("mọi cụm cũ /kien-thuc/{khoá} (trang cụm, .md, trang con) → 308 một bước tới silo; URL mới 200", async ({ request }) => {
  for (const [khoa, moi] of Object.entries(CHUYEN.chu_de)) {
    expect(await tim308(request, `/kien-thuc/${khoa}`), khoa).toEqual({ st: 308, den: moi });
    expect(await tim308(request, `/kien-thuc/${khoa}.md`), khoa).toEqual({ st: 308, den: `${moi}.md` });
    expect(await tim308(request, `/kien-thuc/${khoa}/x-y`), khoa).toEqual({ st: 308, den: `${moi}/x-y` });
    const r = await request.get(moi, { maxRedirects: 0 });
    expect(r.status(), moi).toBe(200);
  }
});

test("trang kiến thức cũ + .md → đúng trang mới; trang mới có canonical, breadcrumb Trang chủ › mảng › cụm › trang", async ({ request }) => {
  expect(await tim308(request, "/kien-thuc/sao-cung/tu-vi-cung-menh")).toEqual({ st: 308, den: "/tu-vi/sao-o-cung/tu-vi-cung-menh" });
  expect(await tim308(request, "/kien-thuc/sao-cung/tu-vi-cung-menh.md")).toEqual({ st: 308, den: "/tu-vi/sao-o-cung/tu-vi-cung-menh.md" });
  const md = await request.get("/tu-vi/sao-o-cung/tu-vi-cung-menh.md");
  expect(md.status()).toBe(200);
  expect(md.headers()["content-type"]).toContain("text/markdown");
  const html = await (await request.get("/tu-vi/sao-o-cung/tu-vi-cung-menh")).text();
  expect(html).toMatch(/<link rel="canonical" href="[^"]*\/tu-vi\/sao-o-cung\/tu-vi-cung-menh"/);
  const bc = [...html.matchAll(/"@type":"ListItem","position":(\d),"name":"([^"]+)","item":"([^"]*)"/g)].map((m) => [m[2], new URL(m[3]!).pathname]);
  expect(bc.slice(0, 3)).toEqual([["Trang chủ", "/"], ["Tử vi", "/tu-vi"], ["Chính tinh ở từng cung Tử vi", "/tu-vi/sao-o-cung"]]);
  expect(html).not.toMatch(/href="\/kien-thuc\/(?!")/);       // liên kết trong trang không trỏ URL cũ
});

test("phong thuỷ tuổi, hướng xấu năm, lá số mẫu: URL cũ → 308 silo; hướng xấu năm thuộc Phong thuỷ", async ({ request }) => {
  // SEO-K: trang tuổi gộp nam + nữ — URL trước QH-URL và URL một giới tính đều 308 MỘT bước về bản gộp.
  expect(await tim308(request, "/phong-thuy/tuoi-1990-nam")).toEqual({ st: 308, den: "/phong-thuy/huong-hop-tuoi/tuoi-1990" });
  expect(await tim308(request, "/phong-thuy/tuoi-1990-nu.md")).toEqual({ st: 308, den: "/phong-thuy/huong-hop-tuoi/tuoi-1990.md" });
  expect(await tim308(request, "/phong-thuy/huong-hop-tuoi/tuoi-1990-nu")).toEqual({ st: 308, den: "/phong-thuy/huong-hop-tuoi/tuoi-1990" });
  expect(await tim308(request, "/phong-thuy/huong-hop-tuoi/tuoi-1990-nam.md")).toEqual({ st: 308, den: "/phong-thuy/huong-hop-tuoi/tuoi-1990.md" });
  expect(await tim308(request, "/huong-xau-nam")).toEqual({ st: 308, den: "/phong-thuy/huong-xau-nam" });
  expect(await tim308(request, "/huong-xau-nam/2027")).toEqual({ st: 308, den: "/phong-thuy/huong-xau-nam/2027" });
  expect(await tim308(request, "/la-so-mau")).toEqual({ st: 308, den: "/tu-vi/la-so-mau" });
  expect(await tim308(request, "/la-so-mau/tu-phu-dong-cung")).toEqual({ st: 308, den: "/tu-vi/la-so-mau/tu-phu-dong-cung" });
  for (const u of ["/phong-thuy/huong-hop-tuoi/tuoi-1990", "/phong-thuy/huong-hop-tuoi/tuoi-1990.md", "/phong-thuy/huong-xau-nam",
    "/phong-thuy/huong-xau-nam/2027", "/tu-vi/la-so-mau", "/tu-vi/la-so-mau/tu-phu-dong-cung", "/phong-thuy/huong-hop-tuoi"]) {
    expect((await request.get(u, { maxRedirects: 0 })).status(), u).toBe(200);
  }
  const hx = await (await request.get("/phong-thuy/huong-xau-nam")).text();
  expect(hx).toContain('"name":"Phong thuỷ"');                // breadcrumb: Trang chủ › Phong thuỷ › Hướng xấu theo năm
  // trang khác không bị chuyển hướng nhầm (mẫu tuổi chỉ khớp tuoi-{năm}-{nam|nu})
  expect((await request.get("/phong-thuy", { maxRedirects: 0 })).status()).toBe(200);
  expect((await request.get("/hop-doi/cap-so", { maxRedirects: 0 })).status()).toBe(200);   // không đụng link mời /hop-doi/{mã}
});

test("trang công cụ là trang trụ: khối 'Kiến thức {mảng}' trỏ xuống mọi cụm của silo", async ({ page }) => {
  await page.goto("/tu-vi");
  const k = page.getByTestId("cum-kien-thuc-tru");
  await expect(k).toContainText("Kiến thức Tử vi");
  for (const d of ["/tu-vi/chinh-tinh", "/tu-vi/cung", "/tu-vi/sao-o-cung", "/tu-vi/tu-hoa", "/tu-vi/la-so-mau"]) {
    await expect(k.locator(`a[href="${d}"]`)).toHaveCount(1);
  }
  await page.goto("/phong-thuy");
  await expect(page.getByTestId("cum-kien-thuc-tru").locator('a[href="/phong-thuy/huong-xau-nam"]')).toHaveCount(1);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("cum-kien-thuc-tru")).toHaveCount(0);    // công cụ không có silo con → không hiện khối
});

test("sitemap + trang hub + llms.txt không còn URL cũ; thư viện /kien-thuc nhóm theo mảng", async ({ request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  const cu = sm.match(/<loc>[^<]*(\/kien-thuc\/[^<]+|\/la-so-mau[^<]*|\/huong-xau-nam[^<]*|\/phong-thuy\/tuoi-[^<]+)<\/loc>/g) ?? [];
  expect(cu.filter((l) => !/\/phong-thuy\/huong-xau-nam|\/tu-vi\/la-so-mau/.test(l))).toEqual([]);
  for (const moi of ["/tu-vi/sao-o-cung", "/bat-tu/menh-theo-nam", "/phong-thuy/huong-xau-nam", "/tu-vi/la-so-mau"]) expect(sm).toContain(moi);
  for (const u of ["/", "/kien-thuc", "/huyen-hoc", "/tu-vi", "/llms.txt"]) {
    const t = await (await request.get(u)).text();
    expect(t, u).not.toMatch(/\/kien-thuc\/[a-z]|["( ]\/la-so-mau|["( ]\/huong-xau-nam|\/phong-thuy\/tuoi-\d/);
  }
  const kt = await (await request.get("/kien-thuc")).text();
  for (const m of ["Thần số học", "Hợp đôi", "Tử vi", "Bát tự", "Kinh Dịch", "Phong thuỷ"]) expect(kt).toContain(`>${m}<`);
});
