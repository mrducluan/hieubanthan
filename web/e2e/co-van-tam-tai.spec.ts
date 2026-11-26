// Chặng 2 E2E — Cổng Cố vấn Liên mảng Tam Tài (/co-van, 5 khối + Công tắc 2 Chế độ + Khủng hoảng) &
// Không gian Cố vấn Kinh doanh (/co-van-kinh-doanh: Soi Góp Vốn + Bàn cờ AES-GCM 256-bit E2EE không rò bản rõ).
import { test, expect } from "@playwright/test";

test("/co-van: Bậc 1 (chỉ ngày sinh) hiện đủ 5 khối trực quan, gạt Công tắc Cổ điển tự mở căn cứ và chặn câu khủng hoảng", async ({ page }) => {
  await page.goto("/co-van");
  await expect(page.locator("h1")).toContainText("Cố vấn Tam Tài");

  await page.getByTestId("co-van-o-cau-hoi").fill("Năm tới tôi có nên nghỉ việc ra khởi nghiệp riêng không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1990-05-15");
  await page.getByTestId("co-van-nut-gui").click();

  await expect(page.getByTestId("co-van-khoi-1-ket-luan")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("co-van-khoi-2-ba-tru")).toBeVisible();
  await expect(page.getByTestId("co-van-khoi-3-nhip-12-thang")).toBeVisible();
  await expect(page.getByTestId("co-van-khoi-4-ngu-hanh")).toBeVisible();
  await expect(page.getByTestId("co-van-khoi-5-nang-bac")).toBeVisible();

  // Bấm Công tắc 2 Chế độ sang Học thuật Cổ điển & Ngũ hành → hiện khung Ứng dụng Cổ điển ngay lập tức
  await page.getByTestId("co-van-khoi-1-ket-luan").getByTestId("che-do-co-dien").click();
  await expect(page.getByTestId("co-van-khoi-4-ngu-hanh").getByTestId("lg-ung-dung-co-dien")).toBeVisible();

  // Câu khủng hoảng → chặn an toàn ngay lập tức, không hiện khối luận mệnh lý
  await page.getByTestId("co-van-o-cau-hoi").fill("Tôi tuyệt vọng muốn tự tử kết thúc mọi thứ");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-an-toan")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("co-van-khoi-1-ket-luan")).toHaveCount(0);
});

test("/co-van-kinh-doanh: Bàn cờ E2EE mã hoá AES-GCM không rò bản rõ lên mạng hay localStorage, nối sang Soi Góp Vốn", async ({ page }) => {
  const cacYeuCauMang: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") cacYeuCauMang.push(`${req.url()}::${req.postData() ?? ""}`);
  });

  await page.goto("/co-van-kinh-doanh");
  await expect(page.locator("h1")).toContainText("Không gian Cố vấn Kinh doanh");

  // Tab mặc định Cẩm nang 5 Trụ: nạp mẫu 2 mặt bằng Vận 9 và lập Cẩm nang Chiến lược & Bài trí Kinh doanh
  await expect(page.getByTestId("cam-nang-kinh-doanh")).toBeVisible();
  await page.getByTestId("cam-nang-nap-2-mat-bang").click();
  await page.getByTestId("cam-nang-nut-lap").click();
  await expect(page.getByTestId("cn-tru-1-thi-truong")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("cn-tru-2-dia-diem")).toBeVisible();
  await expect(page.getByTestId("cn-mat-bang-1")).toBeVisible();
  await expect(page.getByTestId("cn-tru-3-nhan-su")).toBeVisible();
  await expect(page.getByTestId("cn-tru-4-van-phong")).toBeVisible();
  await expect(page.getByTestId("cn-tru-5-cua-hang")).toBeVisible();

  // Mở tab Bàn cờ E2EE và tạo bàn cờ với mật khẩu >= 8 ký tự
  await page.getByTestId("tab-cvkd-ban-co-e2ee").click();
  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-khung-da-mo")).toBeVisible();

  // Kiểm tra dữ liệu trong localStorage là bản mã AES-GCM, không chứa tên "Đối tác A" và không có request POST nào gửi bản rõ bàn cờ
  const rawLs = await page.evaluate(() => localStorage.getItem("hbt.ban_co_kinh_doanh.e2ee.v1") ?? "");
  expect(rawLs).toContain("hbt_e2ee_v1");
  expect(rawLs).not.toContain("Đối tác A");
  expect(cacYeuCauMang.some((u) => u.includes("Đối tác A"))).toBe(false);

  // Khoá lại rồi nhập sai mật khẩu → từ chối giải mã
  await page.getByTestId("e2ee-nut-khoa-lai").click();
  await page.getByTestId("e2ee-mat-khau").fill("SaiMatKhau1234");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-loi")).toContainText("Sai mật khẩu");

  // Mở đúng mật khẩu → chuyển danh sách sang tab Soi Bù Khuyết Góp Vốn và chạy phân tích
  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await page.getByTestId("e2ee-dua-sang-gop-von").click();

  await expect(page.getByTestId("soi-gop-von-doi-tac")).toBeVisible();
  await page.getByTestId("gop-von-nut-phan-tich").click();
  await expect(page.getByTestId("gop-von-ket-qua")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("gop-von-dieu-le")).toBeVisible();
});
