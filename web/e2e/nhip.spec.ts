// NHIP-1 — thẻ "Chào lại" có con số hôm nay + chia sẻ thẻ ngày có ảnh + "Xem hợp với ai"; /ban-than có "Nhịp của bạn".
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

const SINH = { ngay: 17, thang: 5, nam: 1990 };

test("trang chủ (đã có hồ sơ): con số hôm nay khớp engine, câu tự soi, mở khung xem hợp với ai", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/");
  const api = await (await request.post("/api/thanso/nhip", { data: SINH })).json();
  const nhip = page.getByTestId("nhip-hom-nay");
  await expect(nhip).toContainText(`Ngày cá nhân ${api.ngay_ca_nhan.so}`);
  await expect(nhip).toContainText(api.ngay_ca_nhan.tu_soi);
  await page.getByTestId("xem-hop-voi-ai").click();
  await expect(page.getByTestId("khung-hop-voi-ai").getByRole("button", { name: "Tạo link mời xem hợp" })).toBeVisible();
});

test("chia sẻ thẻ ngày: link /hom-nay mang tu + the, ảnh tải được, người mở link thấy lời mời + ảnh xem trước", async ({ page, request, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.addInitScript(() => { (navigator as unknown as { share?: unknown }).share = undefined; });
  await page.goto("/");
  await page.getByTestId("chia-se-the-ngay").click();
  await expect(page.getByTestId("chia-se-the-ngay")).toContainText("Đã chép link");
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  const url = new URL(chep.slice(chep.indexOf("http")));
  expect(url.pathname).toBe("/hom-nay");
  expect(url.searchParams.get("tu")).toMatch(/^hn\.[0-9a-f]{10}$/);
  const ma = url.searchParams.get("the")!;
  expect(ma).toBeTruthy();

  const anh = await request.get(`/og/ngay?ma=${encodeURIComponent(ma)}`);
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
  await expect(page.getByTestId("tai-anh-the-ngay")).toBeVisible();

  const html = await (await request.get(`/hom-nay?the=${encodeURIComponent(ma)}`)).text();
  expect(html).toContain("/og/ngay?ma=");
  expect(html).toMatch(/Ngày cá nhân \d — còn bạn\?/);
  const khach = await context.browser()!.newPage();
  await khach.goto(`/hom-nay?the=${encodeURIComponent(ma)}`);
  await expect(khach.getByTestId("loi-moi-ngay")).toContainText("Ngày cá nhân");
  await khach.close();
});

test("mã thẻ ngày giả: không lời mời, ảnh mặc định, không lộ tên", async ({ request }) => {
  const gia = Buffer.from(JSON.stringify({ v: 1, t: "Kẻ giả", n: 9, d: "2026-10-14" })).toString("base64url") + ".abc";
  const html = await (await request.get(`/hom-nay?the=${gia}`)).text();
  expect(html).not.toContain("Kẻ giả");
  expect(html).not.toContain('data-testid="loi-moi-ngay"');
  expect((await request.get(`/og/ngay?ma=${gia}`)).status()).toBe(200);
});

test("/ban-than: Nhịp của bạn — tháng tới, năm còn N ngày, năm tới khớp engine", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  const api = await (await request.post("/api/thanso/nhip", { data: SINH })).json();
  const k = page.getByTestId("nhip-ca-nhan");
  await expect(k).toBeVisible();
  await expect(k.getByTestId("con-ngay")).toHaveText(`còn ${api.nam_ca_nhan.con_ngay} ngày`);
  await expect(k).toContainText(`tháng ${api.thang_toi.thang}/${api.thang_toi.nam}`);
  await expect(k).toContainText(`năm ${api.nam_toi.nam}`);
});
