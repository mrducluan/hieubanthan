// PL-1 — chân trang + trang pháp lý: đủ liên kết, trang mở được, nội dung khớp cách hệ thống xử lý dữ liệu.
import { test, expect } from "@playwright/test";

const TRANG: [string, RegExp][] = [
  ["/chinh-sach-rieng-tu", /Chính sách quyền riêng tư/],
  ["/dieu-khoan", /Điều khoản sử dụng/],
  ["/mien-tru-trach-nhiem", /Miễn trừ trách nhiệm/],
  ["/gioi-thieu", /Giới thiệu & phương pháp/],
  ["/lien-he", /Liên hệ/],
];

test("chân trang: 4 cột liên kết, cam kết dữ liệu, đường dây khẩn cấp; mọi liên kết pháp lý mở được", async ({ page }) => {
  await page.goto("/");
  const ct = page.getByTestId("chan-trang");
  for (const cot of ["Khám phá", "Kiến thức", "Về chúng tôi", "Pháp lý"]) await expect(ct).toContainText(cot);
  await expect(ct).toContainText("Hồ sơ mặc định chỉ lưu trên máy bạn");
  await expect(ct).toContainText("115");
  await expect(ct).toContainText(`© ${new Date().getFullYear()} Hiểu Bản Thân`);
  // Chưa cấu hình thông tin vận hành (E2E ép env rỗng) → ẩn dòng, không hiện chữ "đang cập nhật" ở footer.
  await expect(ct.getByTestId("thong-tin-van-hanh")).toHaveCount(0);
  await expect(ct).not.toContainText("ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG");
  for (const [duong, tieuDe] of TRANG) {
    await ct.locator(`a[href="${duong}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(duong + "$"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(tieuDe);
    await page.goto("/");
  }
});

test("chính sách quyền riêng tư: căn cứ luật mới, bảng dữ liệu, quyền, AI không nhận ngày sinh", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu");
  const main = page.locator("main");
  await expect(main).toContainText("Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15");
  await expect(main).toContainText("Nghị định 356/2025/NĐ-CP");
  await expect(main).toContainText("không nhận họ tên hay ngày giờ sinh");
  await expect(main).toContainText("hbt.hoso.v1");
  await expect(main.getByRole("navigation", { name: "Mục lục" })).toBeVisible();
  await main.getByRole("link", { name: /Quyền của bạn/ }).click();
  await expect(page).toHaveURL(/#quyen$/);
  await expect(main).toContainText("đang cập nhật");          // chưa điền env → nói rõ, không bịa thông tin
});

test("sitemap có trang pháp lý", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const [duong] of TRANG) expect(xml).toContain(duong + "</loc>");
});
