// LX-2027 — Kiểm thử E2E cho Lì Xì Báo Cáo Tết Đinh Mùi 2027 (/li-xi-tet-2027, /li-xi/[ma], /og/li-xi, robots.txt).
import { test, expect } from "@playwright/test";
import { kiemLoiChuc } from "../lib/li-xi-tet";

const TT_BAT = { bat: true, gia_1: 99000, gia_3: 249000, gia_5: 399000, nam: 2027, han: "2027-03-31", cong: "pay2s" };
const TT_TAT = { ...TT_BAT, bat: false };

test("thuần: kiemLoiChuc chặn SĐT, email, link và chuỗi > 160 ký tự", () => {
  expect(kiemLoiChuc("Chúc bạn năm Đinh Mùi 2027 bình an và rực rỡ.")).toBeNull();
  expect(kiemLoiChuc("Liên hệ 0912345678 nhé")).toMatch(/số điện thoại/);
  expect(kiemLoiChuc("Xem tại https://evil.test")).toMatch(/đường dẫn/);
  expect(kiemLoiChuc("a".repeat(161))).toMatch(/160/);
});

test("/li-xi-tet-2027: 0 vi phạm CSP, chọn 4 mẫu thiệp & 3 gói 99k/249k/399k, mở thử Bao Lì Xì 3D, chặn SĐT khi mua", async ({ page }) => {
  const vp: string[] = [];
  page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) vp.push(m.text()); });
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_BAT }));

  await page.goto("/li-xi-tet-2027");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lì Xì Báo Cáo Tết 2027");
  await expect(page.getByTestId("goi-lx-1")).toContainText("99.000 ₫");
  await expect(page.getByTestId("goi-lx-3")).toContainText("249.000 ₫");
  await expect(page.getByTestId("goi-lx-5")).toContainText("399.000 ₫");

  // Đổi chất liệu sang Ngọc Bích & bấm mở thử Bao Lì Xì 3D
  await page.getByTestId("mau-ngoc_bich").click();
  await page.getByTestId("nut-mo-li-xi").click();
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Đã mở bao lì xì");

  // Nhập SĐT vào lời chúc → báo lỗi trước khi chuyển đăng nhập
  await page.locator("#lx-chuc").fill("Gọi 0912345678 nhận quà");
  await page.getByTestId("lx-nut-mua").click();
  await expect(page.getByTestId("lx-loi")).toContainText("số điện thoại");

  // Sửa lời chúc sạch → chưa đăng nhập sẽ lưu nháp sessionStorage & đi /dang-nhap
  await page.locator("#lx-chuc").fill("Chúc Đinh Mùi 2027 vạn sự hanh thông");
  await page.getByTestId("lx-nut-mua").click();
  await expect(page).toHaveURL(/\/dang-nhap\?tiep=%2Fli-xi-tet-2027/);
  expect(vp).toEqual([]);
});

test("/li-xi-tet-2027 khi công tắc tắt: ẩn nút thanh toán, vẫn cho xem thử Bao Lì Xì 3D", async ({ page }) => {
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_TAT }));
  await page.goto("/li-xi-tet-2027");
  await expect(page.getByTestId("lx-chua-mo")).toBeVisible();
  await expect(page.getByTestId("lx-nut-mua")).toHaveCount(0);
});

test("/li-xi/[ma]: noindex, mở bao 3D hiện thiệp & nút nhận, mã lạ báo không tìm thấy", async ({ page }) => {
  const ma = "abcdef123456";
  await page.route(`**/api/li-xi/${ma}`, (r) => r.fulfill({
    json: { co: true, ma, ten_nguoi_tang: "Anh Minh", loi_chuc: "Chúc năm mới bình an", mau_thiep: "mai_vang", nam: 2027, trang_thai: "san_sang", het_han: "2027-03-31", con_han: true },
  }));
  await page.goto(`/li-xi/${ma}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByTestId("nut-mo-li-xi").click();
  await expect(page.getByTestId("lx-hop-nhan")).toBeVisible();
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Chúc năm mới bình an");

  await page.goto("/li-xi/ma-khong-hop-le");
  await expect(page.getByTestId("lx-khong-co")).toBeVisible();
});

test("/og/li-xi trả ảnh PNG 200 & robots.txt chặn /li-xi/", async ({ request }) => {
  const og = await request.get("/og/li-xi?mau=do_son&ten=Anh%20Minh&chuc=Chuc%20nam%20moi%202027");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");

  const rb = await (await request.get("/robots.txt")).text();
  expect(rb).toContain("/li-xi/");
});
