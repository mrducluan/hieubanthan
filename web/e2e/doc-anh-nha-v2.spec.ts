import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("PT-V2 v2: Đọc tối đa 6 ảnh + thumbnail bằng chứng anh_so + xoá ảnh trước khi gửi + mở trên /en/feng-shui", async ({ page }) => {
  let bodyGui: Record<string, unknown> | null = null;
  await page.route("**/api/phongthuy/doc-anh", async (route) => {
    bodyGui = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        da_bat: true,
        ly_do_tat: null,
        dau_hieu: [
          { ma: "guong_giuong", co: true, do_tin: 0.91, ly_do: "Gương lớn đối diện giường ở ảnh 2.", anh_so: 2 },
          { ma: "xa_ngang", co: true, do_tin: 0.65, ly_do: "Dầm ngang trên trần." },
        ],
        phong_doan: [{ phong: "phong_ngu_chinh", do_tin: 0.88 }],
        luu_y: [],
        can_xac_nhan: true,
      }),
    });
  });

  await page.goto("/phong-thuy");
  const da = page.getByTestId("doc-anh-nha");
  await expect(da).toBeVisible();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("0/6");

  // Chọn 4 ảnh -> xoá 1 ảnh còn 3/6 ảnh
  const chon = da.locator("input[type=file]");
  await chon.setInputFiles([
    { name: "a1.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a2.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a3.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a4.png", mimeType: "image/png", buffer: PNG_1X1 },
  ]);
  await expect(da.getByTestId("doc-anh-dem")).toContainText("4/6");
  await da.getByRole("button", { name: "Bỏ ảnh 4" }).click();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("3/6");

  // Tự tích đồng ý rồi bấm Đọc ảnh -> hiện thumbnail bằng chứng "Ảnh #2" ở dòng guong_giuong, không hiện ở dòng xa_ngang
  await da.getByTestId("doc-anh-dong-y").check();
  await da.getByTestId("doc-anh-nut").click();
  await expect(da.getByTestId("doc-anh-ket-qua")).toBeVisible();
  expect((bodyGui as { anh?: unknown[] } | null)?.anh?.length).toBe(3);
  await expect(da.getByTestId("doc-anh-bang-chung-guong_giuong")).toContainText("Ảnh #2");
  await expect(da.getByTestId("doc-anh-bang-chung-xa_ngang")).toHaveCount(0);
});

