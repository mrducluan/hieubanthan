// Kinh Dịch (HH-1 + KD-ĐS): gieo tay để kết quả tất định; không cần hồ sơ. Lời đọc hai tầng: đời thường hiện ngay,
// lời kinh / ba cách đọc / bản theo sách gập lại.
import { test, expect } from "@playwright/test";
import { hoi } from "./_hoso";

test("gieo tay: quẻ Lý biến Đoài — lời đời thường trước, bản theo sách gập", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq).toBeVisible();
  await expect(ans).toContainText("Về việc thăng tiến, phỏng vấn, đề bạt");         // chủ đề nhận từ câu hỏi
  await expect(dq.getByTestId("chip-muc").first()).toBeVisible();
  await expect(dq.getByTestId("hop-noi-bat").first()).toBeVisible();
  await expect(dq.getByTestId("hanh-dong")).toBeVisible();
  await expect(dq.getByTestId("cau-tu-soi")).toBeVisible();
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Nghĩa Lý");
  // lớp đời thường (trước khi mở phần học thuật) không có giọng AI / từ doạ
  const van = (await dq.innerText()).toLowerCase();
  for (const cam of ["hành trình", "vũ trụ", "chắc chắn", "định mệnh", "đại hung", "tai hoạ"]) expect(van).not.toContain(cam);
  // tầng học thuật gập: chưa mở thì không thấy lời kinh
  await expect(ans).not.toContainText("Quẻ bản: Lý");
  await dq.getByRole("button", { name: /Lời kinh nguyên văn/ }).click();
  await expect(dq.getByTestId("loi-kinh")).toContainText("Thượng Cửu");
  await dq.getByRole("button", { name: /Ba cách đọc cùng một quẻ/ }).click();
  await expect(dq.getByTestId("goc-nhin")).toContainText("Lục Hào (dụng thần)");
  await dq.getByRole("button", { name: /Bản đọc đầy đủ theo sách/ }).click();
  await expect(dq.getByTestId("ban-day-du")).toContainText("Quẻ bản: Lý");
  await expect(dq.getByTestId("ban-day-du")).toContainText("Quẻ biến (xu hướng chuyển tới): Đoài");
  await expect(dq.getByTestId("ban-day-du")).toContainText("Nói nôm na: như làm việc với sếp khó tính");
});

test("máy gieo: luôn có quẻ, lời đời thường và câu hỏi tiếp", async ({ page }) => {
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Hợp đồng này có ký được không?");
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Lục Hào");
  await expect(ans).toContainText("Về việc giấy tờ, hợp đồng, visa, chờ tin");
  await expect(ans.getByTestId("cau-lien-quan").getByRole("button").first()).toBeVisible();
  const dq = ans.getByTestId("doc-que");
  await dq.getByRole("button", { name: /Bản đọc đầy đủ theo sách/ }).click();
  await expect(dq.getByTestId("ban-day-du")).toContainText("dụng thần Phụ Mẫu");
});

test("không hào động: lời chủ là quái từ, kèm Thoán truyện dịch nghĩa", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 7 7 7 7");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const dq = ans.getByTestId("doc-que");
  await dq.getByRole("button", { name: /Lời kinh nguyên văn/ }).click();
  await expect(dq.getByTestId("loi-kinh")).toContainText("Thoán truyện: Lớn thay đức đầu mối của Càn!");
});

test("câu mơ hồ (mua hay bán) → hỏi lại trước khi gieo; chọn xong mới ra quẻ", async ({ page }) => {
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Tôi nên mua hay bán căn nhà này?");
  await expect(ans).toContainText("Bạn đang mua hay đang bán?");
  await expect(ans.getByTestId("que")).toHaveCount(0);
  await ans.getByTestId("lam-ro").getByRole("button", { name: "Tôi đang bán" }).click();
  const ans2 = page.getByTestId("cau-tra-loi").last();
  await expect(ans2.getByTestId("que")).toBeVisible();
  await expect(ans2).toContainText("Về việc bán nhà, bán đất");
});

test("Mai Hoa theo hai số tự chọn và theo phương vị — cùng đầu vào ra cùng quẻ", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("mai_hoa_so");
  await page.getByLabel("Số thứ nhất").fill("3");
  await page.getByLabel("Số thứ hai").fill("5");
  const ans = await hoi(page, "Chiều nay đi gặp đối tác có thuận không?");
  await expect(ans.getByTestId("mai-hoa-so")).toContainText("3 và 5");
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Mai Hoa");
  await page.getByLabel("Cách ra quẻ").selectOption("mai_hoa_phuong");
  await page.getByLabel("Phương vị").selectOption("Tây Nam");
  const ans2 = await hoi(page, "Người khách đến từ phía đó có hợp làm ăn không?");
  await expect(ans2.getByTestId("mai-hoa-phuong")).toContainText("phương Tây Nam");
});

test("chip chủ đề: chọn trước khi hỏi → bài đọc theo đúng chủ đề", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByTestId("chip-chu-de").getByRole("button", { name: "Mở quán, kinh doanh, đầu tư" }).click();
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Việc này có thành không?");
  await expect(ans).toContainText("Về việc mở quán, kinh doanh, đầu tư");
});

test("KC-3/4/5: ứng kỳ có nút nhắc (lưu máy, hiện ở Hôm nay), gợi mở chéo, CTA cuối bài, ?chu_de= chọn sẵn chip", async ({ page }) => {
  await page.goto("/kinh-dich?chu_de=kinh_doanh");
  await expect(page.getByTestId("chip-chu-de").getByRole("button", { name: "Mở quán, kinh doanh, đầu tư" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Việc này có thành không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq.getByTestId("goi-mo-cheo")).toHaveAttribute("data-ma", "kinh_doanh_tien");
  const nhac = dq.getByTestId("ung-ky").getByTestId("nhac-toi").first();
  await nhac.getByRole("button", { name: "Nhắc tôi hôm đó" }).click();
  await expect(nhac.getByRole("button", { name: "Sẽ nhắc ở Hôm nay" })).toBeVisible();
  const luu = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nhac.v1") ?? "[]"));
  expect(luu).toHaveLength(1);
  expect(luu[0].ma).toMatch(/^kd\.ungky\./);
  expect(JSON.stringify(luu)).not.toContain("Việc này có thành");          // không lưu câu hỏi
  // Cuối bài hợp nhất (KC-5 + CTA-1): gợi mở theo ý định ở trên + khối "Đọc tiếp về bạn" (gợi chéo, Sao, mời, ủng hộ).
  await expect(page.getByTestId("cuoi-phan-xem")).toBeVisible();
  await expect(page.getByTestId("cuoi-phan-xem").getByTestId("the-goi-y").first()).toBeVisible();
  // tín hiệu ngầm: mở một cách đọc KHÁC phái chính (câu dự đoán → chính là Lục Hào, đã mở sẵn) → đếm trên máy
  await dq.getByRole("button", { name: /Ba cách đọc cùng một quẻ/ }).click();
  await dq.getByTestId("goc-nhin").locator("[data-phai=nghia_ly]").getByRole("button").first().click();
  const tq = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.thoi_quen_kd.v1") ?? "{}"));
  expect(tq.nghia_ly).toBe(1);
});
