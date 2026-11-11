// HTT-2 (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 5, H1 · H5 · H6): công tắc "Mùa nơi sinh" cho Bát tự chỉ hiện với người sinh ngoài chí
// tuyến Nam và gửi dieu_hau cho engine; hộp giao thoa vẫn là bản tất định khi công tắc AI tắt (mặc định). Chuỗi thật web → engine.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

test("bát tự: người sinh Sydney thấy công tắc Mùa nơi sinh, chọn thì gửi dieu_hau=noi_sinh và điều hậu đổi Thuỷ → Hoả", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 17, thang: 5, nam: 1990, gio: "12:30", noi_sinh: "nuoc_ngoai", mui_gio: "au-sydney" });
  await page.goto("/bat-tu");
  await page.getByTestId("bat-tu-chi-tiet-mo").click({ timeout: 20_000 });
  const tp = page.getByTestId("truong-phai-bat-tu");
  await expect(tp).toBeVisible();
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Mùa theo lịch tiết khí");
  await tp.getByTestId("truong-phai-bat-tu-mo").click();
  await expect(tp.getByTestId("chon-dieu-hau-bat-tu")).toBeVisible();
  const req = page.waitForResponse((r) => r.url().endsWith("/api/battu/la-so") && r.request().method() === "POST"
    && (r.request().postData() ?? "").includes('"dieu_hau":"noi_sinh"'));
  await tp.getByRole("tab", { name: "Mùa thực nơi sinh (Nam bán cầu)" }).click();
  const ls = await (await req).json();
  expect(ls.dung_than.dieu_hau.hanh).toEqual(["Hỏa"]);
  expect(ls.co_canh_bao.some((c: { loai: string }) => c.loai === "dieu_hau_nam_ban_cau")).toBe(true);
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Mùa theo nơi sinh (Nam bán cầu)");
});

test("bát tự: người sinh Tokyo / Việt Nam không thấy công tắc Mùa nơi sinh", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 17, thang: 5, nam: 1990, gio: "12:30", noi_sinh: "nuoc_ngoai", mui_gio: "jp-tokyo" });
  await page.goto("/bat-tu");
  await page.getByTestId("bat-tu-chi-tiet-mo").click({ timeout: 20_000 });
  const tp = page.getByTestId("truong-phai-bat-tu");
  await tp.getByTestId("truong-phai-bat-tu-mo").click();
  await expect(tp.getByTestId("chon-gio-sinh-bat-tu")).toBeVisible();
  await expect(tp.getByTestId("chon-dieu-hau-bat-tu")).toHaveCount(0);
});

test("giao thoa: công tắc AI diễn đạt mặc định tắt → web không gửi dien_dat, không có đoạn AI", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toHaveAttribute("data-phien-ban", "doi_song_1");
  const goi = page.waitForRequest((r) => r.url().endsWith("/api/giao-thoa") && r.method() === "POST");
  await page.evaluate(() => {
    for (const mau of ["ds.su_nghiep.e2e.thuan", "ds.bt.su_nghiep.e2e.thuan"]) {
      window.dispatchEvent(new CustomEvent("hbt-phieu", { detail: { loai: "doi_song", mau, phai: "nam_phai_viet", ket_qua: "dung" } }));
    }
  });
  const r = await goi;
  expect(JSON.parse(r.postData() ?? "{}")).not.toHaveProperty("dien_dat");
  const gt = page.getByTestId("giao-thoa");
  await expect(gt).toBeVisible();
  await expect(gt.getByTestId("giao-thoa-van-ai")).toHaveCount(0);
  await expect(gt.getByTestId("hop-noi-bat").first()).toBeVisible();
});
