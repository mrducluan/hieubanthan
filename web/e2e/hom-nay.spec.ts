// HN-1 — "Hôm nay của bạn": H1 có sẵn trong HTML máy chủ, thẻ hiện số engine tính, chuỗi ngày ghé đếm trên máy.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { capNhatChuoi } from "../app/hom-nay/HomNay";

test("chuỗi ngày ghé: cùng ngày giữ nguyên, hôm sau +1, cách quãng thì bắt đầu lại", () => {
  expect(capNhatChuoi(null, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 1 });
  expect(capNhatChuoi({ ngay: "2026-10-10", chuoi: 3 }, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 3 });
  expect(capNhatChuoi({ ngay: "2026-10-31", chuoi: 3 }, "2026-11-01")).toEqual({ ngay: "2026-11-01", chuoi: 4 });
  expect(capNhatChuoi({ ngay: "2026-10-08", chuoi: 9 }, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 1 });
});

test("chưa có hồ sơ: H1 trong HTML máy chủ + mời nhập hồ sơ", async ({ page, request }) => {
  const html = await (await request.get("/hom-nay")).text();
  expect(html).toMatch(/<h1[^>]*>Hôm nay của bạn<\/h1>/);
  await page.goto("/hom-nay");
  await expect(page.getByRole("button", { name: "Xem hôm nay của tôi" })).toBeVisible();
});

test("có hồ sơ: thẻ khớp số engine, có câu tự soi, ngày mai, chuỗi ngày", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  const api = await (await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990 } })).json();
  await expect(page.getByTestId("so-ngay-ca-nhan")).toHaveText(String(api.ngay_ca_nhan.so));
  await expect(page.getByText(api.ngay_ca_nhan.tu_soi)).toBeVisible();
  await expect(page.getByText(`Ngày mai — Ngày cá nhân ${api.ngay_mai.so}:`)).toBeVisible();
  await expect(page.getByTestId("chuoi-ngay")).toContainText("Ngày đầu tiên");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; chuoi?: number }[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "daily_viewed" && e.chuoi === 1)).toBe(true);
  // Mở lại cùng ngày: chuỗi không tăng
  await page.reload();
  await expect(page.getByTestId("chuoi-ngay")).toContainText("Ngày đầu tiên");
});

test("API từ chối đầu vào lạ / ngày không tồn tại", async ({ request }) => {
  expect((await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: "2020-01-01" } })).status()).toBe(422);
  expect((await request.post("/api/thanso/hom-nay", { data: { ngay: 31, thang: 2, nam: 1990 } })).status()).toBe(422);
});

test("Bản thân có lối vào Hôm nay", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  await page.getByTestId("lien-ket-hom-nay").click();
  await expect(page).toHaveURL(/\/hom-nay$/);
});
