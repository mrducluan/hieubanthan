// QT-0: trang quản trị. CI không có Supabase → cổng báo "chưa bật", không lộ gì, không bao giờ được index.
import { test, expect } from "@playwright/test";

test("/quan-tri khi chưa bật tài khoản: báo gọn, noindex, không cache", async ({ page }) => {
  const res = await page.goto("/quan-tri");
  expect(res?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(res?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByRole("heading", { name: "Tài khoản chưa được bật" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByTestId("qt-tong-quan")).toHaveCount(0);
});

test("/quan-tri/xac-thuc khi chưa bật tài khoản: cùng lời báo, không hiện bước MFA", async ({ page }) => {
  await page.goto("/quan-tri/xac-thuc");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByTestId("qt-xac-thuc")).toHaveCount(0);
});

test("robots.txt chặn /quan-tri; trang khác không bị gắn noindex của quản trị", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /quan-tri");
  const res = await page.goto("/gioi-thieu");
  expect(res?.headers()["x-robots-tag"]).toBeUndefined();
});

test("QT-1: /quan-tri/tri-thuc và API xuất bản khi chưa bật tài khoản — không đọc, không ghi được gì", async ({ page, request }) => {
  await page.goto("/quan-tri/tri-thuc");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByTestId("qt-tri-thuc")).toHaveCount(0);
  await page.goto("/quan-tri/tri-thuc/tuvi_kb");
  await expect(page.getByTestId("qt-bien-tap")).toHaveCount(0);

  const body = { tep: "tuvi_kb.json", sha: "0".repeat(40), sua: [{ duong: ["a"], cu: "x", moi: "y" }] };
  expect((await request.post("/api/quan-tri/tri-thuc", { data: body })).status()).toBe(403);            // thiếu Origin
  const r = await request.post("/api/quan-tri/tri-thuc", { data: body, headers: { origin: "http://localhost:3000" } });
  expect(r.status()).toBe(401);
  expect(r.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("QT-2…QT-4: trang mới + API mới khi chưa bật tài khoản — báo cổng, không đọc/ghi được gì", async ({ page, request }) => {
  for (const [duong, id] of [["/quan-tri/cai-dat", "qt-cai-dat"], ["/quan-tri/nguoi-dung", "qt-nguoi-dung"],
    ["/quan-tri/hoi-dap", "qt-hoi-dap"], ["/quan-tri/tang-truong", "qt-tang-truong"]] as const) {
    const res = await page.goto(duong);
    expect(res?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
  const goi: [string, unknown][] = [
    ["/api/quan-tri/cai-dat", { khoa: "sao.thuong.moi_ban", gia_tri: 99 }],
    ["/api/quan-tri/vai-tro", { viec: "cap", email: "a@b.vn", vai_tro: "chu_so_huu" }],
    ["/api/quan-tri/sao", { viec: "dieu_chinh", email: "a@b.vn", so: 1000, ly_do: "thử lỗ hổng", khoa: "abcdefgh" }],
    ["/api/quan-tri/ai", { viec: "kiem", muc: [{ moi: "x" }] }],
  ];
  for (const [url, data] of goi) {
    expect((await request.post(url, { data })).status(), url).toBe(403);
    expect((await request.post(url, { data, headers: { origin: "http://localhost:3000" } })).status(), url).toBe(401);
  }
});

test("QT-2: cài đặt công khai khi chưa có Supabase → mặc định, không có dải thông báo", async ({ page, request }) => {
  expect(await (await request.get("/api/sao/muc")).json()).toMatchObject({ moi_ban: 20, duoc_moi: 20, chao_mung: 10, tran: 20, hoa_hong: { bat: false, phan_tram: 20, so_don: 1 } });
  expect(await (await request.get("/api/luan-giai/phi")).json()).toEqual({ thu: false, gia: 29 });
  await page.goto("/");
  await expect(page.getByTestId("thong-bao-site")).toHaveCount(0);
});
