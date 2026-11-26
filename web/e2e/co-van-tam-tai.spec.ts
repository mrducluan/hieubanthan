// Cố vấn Tam Tài (/co-van) + Không gian kinh doanh (/co-van-kinh-doanh) — sau review 2026-11-26: ba cách xem đọc riêng,
// không mức gộp, chuyển hướng câu về người khác / chưa rõ, an toàn trước; sổ nháp khoá mật khẩu trên máy (không phải E2EE),
// đưa sang "Khi góp vốn" thì ô đồng ý vẫn để trống.
import { test, expect } from "@playwright/test";

test("/co-van: ba cách xem riêng, không mức gộp; câu về người khác chuyển hướng; câu khủng hoảng chặn trước", async ({ page }) => {
  await page.goto("/co-van");
  await expect(page.locator("h1")).toContainText("ba cách nhìn");

  await page.getByTestId("co-van-o-cau-hoi").fill("Năm tới tôi có nên nghỉ việc ra khởi nghiệp riêng không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1990-05-15");
  await page.getByTestId("co-van-nut-gui").click();

  await expect(page.getByTestId("co-van-ket-qua")).toBeVisible({ timeout: 20_000 });
  for (const ma of ["nhan", "thien", "dia"]) await expect(page.getByTestId(`co-van-tru-${ma}`)).toBeVisible();
  // chưa có giờ sinh, chưa có hướng nhà → Nhân và Địa không chấm mức
  await expect(page.getByTestId("co-van-tru-nhan")).toContainText("Không chấm mức");
  await expect(page.getByTestId("co-van-tru-dia")).toContainText("Không chấm mức");
  await expect(page.getByTestId("co-van-nhip-12")).toBeVisible();

  await page.getByTestId("co-van-o-cau-hoi").fill("Chồng tôi có ngoại tình không");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-chuyen-huong")).toHaveAttribute("data-ly-do", "nguoi_khac", { timeout: 15_000 });
  await expect(page.getByTestId("co-van-ket-qua")).toHaveCount(0);

  await page.getByTestId("co-van-o-cau-hoi").fill("Tôi tuyệt vọng muốn tự tử kết thúc mọi thứ");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-an-toan")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("co-van-ket-qua")).toHaveCount(0);
});

test("/co-van-kinh-doanh: cẩm nang không xếp hạng; sổ nháp khoá mật khẩu không gửi gì khi lưu; sang Khi góp vốn phải tự tích đồng ý", async ({ page }) => {
  const cacYeuCauMang: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") cacYeuCauMang.push(`${req.url()}::${req.postData() ?? ""}`);
  });

  await page.goto("/co-van-kinh-doanh");
  await expect(page.locator("h1")).toContainText("góp vốn");

  await expect(page.getByTestId("cam-nang-kinh-doanh")).toBeVisible();
  await page.getByTestId("cam-nang-nap-2-mat-bang").click();
  await page.getByTestId("cam-nang-nut-lap").click();
  await expect(page.getByTestId("cn-tru-1-thi-truong")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("cn-mat-bang-1")).toBeVisible();
  await expect(page.getByTestId("cn-mat-bang-1")).not.toContainText("Ưu tiên");

  await page.getByTestId("tab-cvkd-ban-co-e2ee").click();
  await expect(page.getByTestId("ban-co-e2ee")).not.toContainText("Đầu-Cuối");
  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-khung-da-mo")).toBeVisible();

  const rawLs = await page.evaluate(() => localStorage.getItem("hbt.ban_co_kinh_doanh.e2ee.v1") ?? "");
  expect(rawLs).toContain("hbt_e2ee_v1");
  expect(rawLs).not.toContain("Đối tác A");
  expect(cacYeuCauMang.some((u) => u.includes("Đối tác A"))).toBe(false);

  await page.getByTestId("e2ee-nut-khoa-lai").click();
  await page.getByTestId("e2ee-mat-khau").fill("SaiMatKhau1234");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-loi")).toContainText("Sai mật khẩu");

  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await page.getByTestId("e2ee-dua-sang-gop-von").click();

  await expect(page.getByTestId("gop-von")).toBeVisible();
  for (const o of await page.getByTestId("gop-von-dong-y").all()) await expect(o).not.toBeChecked();
  await expect(page.getByTestId("gop-von-cam-ket")).not.toBeChecked();
  await page.getByTestId("gop-von-xem").click();
  await expect(page.getByRole("alert")).toContainText("đồng ý");
  for (const o of await page.getByTestId("gop-von-dong-y").all()) await o.check();
  await page.getByTestId("gop-von-cam-ket").check();
  await page.getByTestId("gop-von-xem").click();
  await expect(page.getByTestId("gop-von-ket-qua")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("gop-von-ranh-gioi")).toContainText("luật sư");
});
