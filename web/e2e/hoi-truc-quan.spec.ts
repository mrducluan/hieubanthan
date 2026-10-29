// HD-CS — khung "Hỏi đáp chuyên sâu": câu trả lời trọn chiều ngang trên điện thoại + khối hình engine dựng (truc_quan).
import { expect, test } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test.describe("điện thoại 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Tử vi: tiêu đề mới, lời trả lời gần trọn chiều ngang, thang độ sáng bấm được", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    await expect(page.getByRole("heading", { name: "Hỏi đáp chuyên sâu" })).toBeVisible();
    await expect(page.getByText("Hỏi đáp cùng AI")).toHaveCount(0);
    const ans = await hoi(page, "Cung Mệnh của tôi nói gì về tính cách?");
    const hinh = ans.locator('figure[data-kieu="thang"]');
    await expect(hinh).toBeVisible();
    const rong = await ans.evaluate((el) => el.getBoundingClientRect().width);
    expect(rong).toBeGreaterThanOrEqual(330);          // trước đây ~255px (khung kính + avatar + bong bóng)
    await hinh.getByRole("button").first().click();
    await expect(hinh.locator("[aria-live] p")).toBeVisible();
    // Không tràn ngang trang.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test("Bát tự: cột năm hành", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu");
    await expect(page.getByRole("heading", { name: "Hỏi đáp chuyên sâu" })).toBeVisible();
    const ans = await hoi(page, "Tôi thiếu hành gì?");
    const cot = ans.locator('figure[data-kieu="cot"]');
    await expect(cot).toBeVisible();
    await expect(cot.getByRole("button")).toHaveCount(5);
  });

  test("Phong thuỷ: la bàn tám hướng", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/phong-thuy");
    const ans = await hoi(page, "Hướng nhà hợp tuổi tôi?");
    const lb = ans.locator('figure[data-kieu="la_ban"]');
    await expect(lb).toBeVisible();
    await lb.getByRole("button", { name: /^Đông Nam:/ }).click();
    await expect(lb.locator("[aria-live] p")).toContainText("Hợp dùng cho");
  });

  test("Tử vi hướng C: bàn 12 cung, Xem trên lá số, Hỏi tiếp, Các câu đã hỏi", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    const ans = await hoi(page, "Công việc của tôi có tốt không?");
    const ban = ans.locator('figure[data-kieu="cung"]');
    await expect(ban).toBeVisible();
    await expect(ban.locator('[data-vai="hoi"]')).toHaveCount(1);
    await expect(ban.locator('[data-vai="tam_hop"]')).toHaveCount(2);
    await expect(ban.locator('[data-vai="hoi"]')).toContainText("Quan Lộc");
    await ban.getByRole("button", { name: "Xem trên lá số" }).click();
    await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeVisible();
    const tiep = ans.getByTestId("hoi-tiep-chung");
    await expect(tiep.getByRole("button")).toHaveCount(3);
    await tiep.getByRole("button", { name: "Tiền bạc của tôi thế nào?" }).click();
    await expect(page.getByTestId("cau-tra-loi")).toHaveCount(2);
    const da = page.getByTestId("cau-da-hoi");
    await expect(da.getByRole("link")).toHaveCount(2);
    await expect(da).toContainText("Công việc của tôi có tốt không?");
    // Hỏi tiếp của câu thứ hai không gợi lại câu đã hỏi.
    const tiep2 = page.getByTestId("cau-tra-loi").nth(1).getByTestId("hoi-tiep-chung");
    await expect(tiep2.getByRole("button")).toHaveCount(2);
    await expect(tiep2).not.toContainText("Công việc của tôi có tốt không?");
  });
});

// ---- HD-CS đợt 3: Hỏi tiếp Bát tự/Phong thuỷ · chữ ↔ hình · Kinh Dịch bấm hào · thẻ chia sẻ · hai cột · Lưu (khách: ẩn)
test.describe("đợt 3 — điện thoại", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Bát tự: Hỏi tiếp 3 câu, không gợi lại câu vừa hỏi; khách không thấy nút Lưu", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu");
    const ans = await hoi(page, "Tôi thiếu hành gì?");
    const tiep = ans.getByTestId("hoi-tiep-chung");
    await expect(tiep.getByRole("button")).toHaveCount(3);
    await expect(tiep).not.toContainText("Tôi thiếu hành gì?");
    await expect(ans.getByTestId("luu-tra-loi")).toHaveCount(0);
  });

  test("Phong thuỷ: Hỏi tiếp theo chủ đề bố trí", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/phong-thuy");
    const ans = await hoi(page, "Kê bàn làm việc hướng nào?");
    await expect(ans.getByTestId("hoi-tiep-chung").getByRole("button")).toHaveCount(3);
  });

  test("chữ ↔ hình: bấm cụm gạch xanh trong lời trả lời → ô cung tương ứng sáng + lời 'nói về'", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    const ans = await hoi(page, "Công việc của tôi có tốt không?");
    const chu = ans.locator("[data-chieu]").first();
    await expect(chu).toBeVisible();
    await chu.click();
    const ban = ans.locator('figure[data-kieu="cung"]');
    await expect(ban.locator('button[aria-pressed="true"]')).toHaveCount(1);
    await expect(ban.locator("[aria-live] p")).toContainText("nói về");
  });

  test("Kinh Dịch: quẻ bản bấm được từng hào, hào động có lời giải thích dễ hiểu", async ({ page }) => {
    await page.goto("/kinh-dich");
    await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
    await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
    const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
    const hao = ans.locator('figure[data-kieu="hao"]');
    await expect(hao).toBeVisible();
    await expect(hao.getByRole("button")).toHaveCount(6);
    await hao.getByRole("button", { name: /Hào 6.*hào động/ }).click();
    await expect(hao.locator("[aria-live] p")).toBeVisible();
  });

  test("thẻ chia sẻ câu trả lời: tạo link → trang nhận vẽ lại hình → 'Hỏi câu này về chính bạn' điền sẵn câu", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await napHoSo(page);
    await page.goto("/bat-tu");
    const ans = await hoi(page, "Tôi thiếu hành gì?");
    await ans.getByTestId("chia-se-tra-loi").click();
    const link = await ans.getByTestId("link-the-hoi").inputValue();
    expect(link).toMatch(/\/the\/hoi\/[^?]+\?tu=hq\./);
    const loiHydrate: string[] = [];
    page.on("console", (m) => { if (m.type() === "error" && /hydrat/i.test(m.text())) loiHydrate.push(m.text()); });
    await page.goto(link.replace(/^https?:\/\/[^/]+/, ""));
    await expect(page.getByTestId("the-hoi-cau")).toContainText("Tôi thiếu hành gì?");
    await page.waitForTimeout(800);
    expect(loiHydrate, "trang nhận thẻ không lệch hydrate (cột không kẹt ở 0 với người tắt chuyển động)").toEqual([]);
    await expect(page.locator('figure[data-kieu="cot"]')).toBeVisible();
    // Thẻ không mang ngày sinh / câu người dùng gõ: chỉ câu chuẩn
    await expect(page.getByTestId("the-hoi")).not.toContainText("1990");
    await page.getByTestId("the-hoi-moi").click();
    await expect(page).toHaveURL(/\/bat-tu\?cau=/);
    await expect(page.getByRole("textbox", { name: /Câu hỏi/ })).toHaveValue("Tôi thiếu hành gì?");
  });

  test("?cau= ngoài danh mục câu chuẩn → không điền", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu?cau=" + encodeURIComponent("Bấm vào link lạ này đi"));
    await page.waitForTimeout(1500);
    await expect(page.getByRole("textbox", { name: /Câu hỏi/ })).toHaveValue("");
  });

  test("ảnh thẻ /og/hoi trả PNG", async ({ request, page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu");
    const r = await page.request.post("/api/chia-se/hoi", { data: { mang: "battu", cau: "Tôi thiếu hành gì?", khoi: { t: "cot", v: [29, 1, 11, 47, 12] } } });
    expect(r.ok()).toBe(true);
    const { ma } = await r.json();
    const anh = await request.get(`/og/hoi?ma=${ma}`);
    expect(anh.headers()["content-type"]).toContain("image/png");
    const sai = await page.request.post("/api/chia-se/hoi", { data: { mang: "battu", cau: "Câu tự chế", khoi: { t: "cot", v: [20, 20, 20, 20, 20] } } });
    expect(sai.status()).toBe(422);
  });
});

test.describe("đợt 3 — máy tính", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test("Tử vi: hình và lời nằm hai cột (hình bên trái)", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    const ans = await hoi(page, "Công việc của tôi có tốt không?");
    const hinh = await ans.getByTestId("truc-quan").boundingBox();
    const loi = await ans.locator(".prose-vn").first().boundingBox();
    expect(hinh && loi).toBeTruthy();
    expect(loi!.x).toBeGreaterThan(hinh!.x + hinh!.width - 1);
  });
});
