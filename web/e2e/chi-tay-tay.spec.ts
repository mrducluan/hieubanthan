// TK-2 — chỉ tay phương Tây (Cheiro 1894, Benham 1900) trên /chi-tay: công tắc trường phái (mặc định sách tướng xưa, nhớ trên
// máy), tự soi dáng tay / gò / đường chỉ → lời Việt + nguyên văn gập; thư viện phái Tây có trong HTML máy chủ; route proxy
// từ chối trộn phái. Engine thật (webServer của playwright.config).
import { expect, test } from "@playwright/test";

test("mặc định là sách tướng xưa; đổi sang phương Tây, nhớ khi tải lại", async ({ page }) => {
  await page.goto("/chi-tay");
  await expect(page.getByTestId("ct-phai")).toBeVisible();
  await expect(page.getByTestId("ct-phan-dong")).toBeVisible();
  await expect(page.getByTestId("ct-phan-tay")).toBeHidden();
  await page.locator("[data-testid=ct-phai-nut][data-ma=tay]").click();
  await expect(page.getByTestId("ct-phan-tay")).toBeVisible();
  await expect(page.getByTestId("ct-phan-dong")).toBeHidden();
  await page.reload();
  await expect(page.getByTestId("ct-phan-tay")).toBeVisible();
  await expect(page.locator("[data-testid=ct-phai-nut][data-ma=tay]")).toHaveAttribute("aria-checked", "true");
  await page.locator("[data-testid=ct-phai-nut][data-ma=dong]").click();
  await expect(page.getByTestId("ct-phan-dong")).toBeVisible();
});

test("tự soi phương Tây: dáng tay + gò + đường chỉ → lời sách có nguyên văn", async ({ page }) => {
  await page.goto("/chi-tay");
  await page.locator("[data-testid=ct-phai-nut][data-ma=tay]").click();
  await expect(page.getByTestId("ct-tay-luu-y")).toContainText("không");
  await page.locator("[data-testid=ct-tay-dang][data-ma=vuong]").click();
  await page.locator("[data-testid=ct-tay-go][data-go=jupiter][data-ma=day]").click();
  await page.locator("[data-testid=ct-tay-duong][data-cau=tri_huong][data-ma=thang]").click();
  await expect(page.getByTestId("ct-tay-tom-tat")).toContainText("3");
  await page.getByTestId("ct-tay-doc").click();
  const kq = page.getByTestId("ct-tay-ket-qua");
  await expect(kq.getByTestId("ct-tay-muc")).toHaveCount(3);
  await expect(kq).toContainText("Tay vuông");
  await kq.getByText("Nguyên văn").first().click();
  await expect(kq).toContainText("Cheiro, Language of the Hand (1894)");
  // RS-3: đường / gò đang chọn có khối sách kinh điển (Cheiro 1916 · Dale 1895), câu tiếng Anh gập
  const kd = kq.getByTestId("ct-tay-kinh-dien");
  await expect(kd).toHaveCount(2);
  await expect(kd.first()).toContainText("Nên chú ý");
  await kd.first().getByText("Nguyên văn").click();
  await expect(kd.first()).toContainText("Palmistry for All (1916)");
});

test("thư viện phương Tây có trong HTML máy chủ, không tên nội bộ", async ({ request }) => {
  const html = await (await request.get("/chi-tay")).text();
  expect(html).toContain("William G. Benham, The Laws of Scientific Hand Reading (1900)");
  expect(html).toContain("Gò Mộc tinh (Jupiter)");
  expect(html).toContain("không nói bạn sống bao lâu");
  expect(html).not.toMatch(/Internet Archive|chi_tay_cheiro|chi_tay_benham|OCR/);
});

test("route /api/chi-tay/doc: không trộn phái", async ({ request }) => {
  const ok = await request.post("/api/chi-tay/doc", { data: { phai: "tay", go: { venus: "day" } } });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).muc[0].ma).toBe("venus_day");
  expect((await request.post("/api/chi-tay/doc", { data: { phai: "tay", van: ["bai-tuong"] } })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/doc", { data: { dang_tay: "vuong" } })).status()).toBe(422);
});
