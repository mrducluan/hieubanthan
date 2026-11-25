// LX-2027 — Kiểm thử E2E cho LÌ XÌ TẾT 2027 (/li-xi-tet-2027, /li-xi/[ma], /og/li-xi 3 khổ Social, robots.txt).
import { test, expect } from "@playwright/test";
import { hoaTietTuMaBao, kiemLoiChuc } from "../lib/li-xi-tet";

const TT_BAT = { bat: true, gia_1: 99000, gia_3: 249000, gia_5: 399000, nam: 2027, han: "2027-03-31", cong: "pay2s" };
const TT_TAT = { ...TT_BAT, bat: false };

test("thuần: kiemLoiChuc chặn SĐT, email, link, chuỗi > 160 ký tự & hoaTietTuMaBao tất định", () => {
  expect(kiemLoiChuc("Chúc bạn năm Đinh Mùi 2027 bình an và rực rỡ.")).toBeNull();
  expect(kiemLoiChuc("Liên hệ 0912345678 nhé")).toMatch(/số điện thoại/);
  expect(kiemLoiChuc("Xem tại https://evil.test")).toMatch(/đường dẫn/);
  expect(kiemLoiChuc("a".repeat(161))).toMatch(/160/);
  expect(hoaTietTuMaBao("abcdef123456", "do_son")).toBe(hoaTietTuMaBao("abcdef123456", "do_son"));
  expect(["linh_vat", "linh_vat_son_mai", "linh_vat_thanh_lich"]).toContain(hoaTietTuMaBao("abcdef123456", "do_son"));
});

test("/li-xi-tet-2027: 0 vi phạm CSP, 3 mẫu Linh Vật Đinh Mùi + Hoa Mai/Đào + Nền Gấm, công tắc Ngẫu nhiên/Tự chọn, hoa rơi & 3 nút tải ảnh Social", async ({ page }) => {
  const vp: string[] = [];
  page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) vp.push(m.text()); });
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_BAT }));
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.goto("/li-xi-tet-2027");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lì xì Tết 2027");
  // GIA-99: "rẻ hơn" tính từ bảng giá (249.000 / 3 bao so với 99.000 lẻ = 16 %), một nhãn duy nhất.
  await expect(page.getByTestId("goi-lx-3")).toContainText("rẻ hơn 16%");
  await expect(page.getByText("Tiết kiệm nhất")).toHaveCount(0);
  await expect(page.getByTestId("goi-lx-1")).toContainText("99.000 ₫");
  await expect(page.getByTestId("goi-lx-3")).toContainText("249.000 ₫");
  await expect(page.getByTestId("goi-lx-5")).toContainText("399.000 ₫");
  await expect(page.getByTestId("lx-hoa-roi")).toBeVisible();
  await expect(page.getByTestId("lx-nen-gam")).toBeVisible();
  await expect(page.getByTestId("lx-artwork-medallion")).toBeVisible();

  // Tắt rồi bật lại nền gấm & hoa rơi
  await page.getByTestId("nut-nen-gam").click();
  await expect(page.getByTestId("lx-nen-gam")).toHaveCount(0);
  await page.getByTestId("nut-nen-gam").click();
  await expect(page.getByTestId("lx-nen-gam")).toBeVisible();

  await page.getByTestId("nut-hoa-roi").click();
  await expect(page.getByTestId("lx-hoa-roi")).toHaveCount(0);
  await page.getByTestId("nut-hoa-roi").click();
  await expect(page.getByTestId("lx-hoa-roi")).toBeVisible();

  // Chuyển giữa cả 3 mẫu Linh Vật Đinh Mùi + Hoa Đào & kiểm link tải ảnh Social cập nhật theo lựa chọn
  await page.getByTestId("hoa-linh_vat_son_mai").click();
  await expect(page.getByTestId("tai-social-doc")).toHaveAttribute("href", /hoa=linh_vat_son_mai/);
  await page.getByTestId("hoa-linh_vat_thanh_lich").click();
  await expect(page.getByTestId("tai-social-doc")).toHaveAttribute("href", /hoa=linh_vat_thanh_lich/);

  await page.getByTestId("mau-ngoc_bich").click();
  await page.getByTestId("hoa-hoa_dao").click();
  await expect(page.getByTestId("tai-social-doc")).toHaveAttribute("href", /khung=doc&mau=ngoc_bich&hoa=hoa_dao/);
  await expect(page.getByTestId("tai-social-vuong")).toHaveAttribute("href", /khung=vuong/);
  await expect(page.getByTestId("tai-social-ngang")).toHaveAttribute("href", /khung=ngang/);

  // Bật chế độ Ngẫu nhiên may mắn rồi quay về Tự chọn Custom
  await page.getByTestId("che-do-ngau-nhien").click();
  await expect(page.getByTestId("hop-ngau-nhien")).toBeVisible();
  await page.getByTestId("che-do-tu-chon").click();
  await expect(page.getByTestId("hoa-linh_vat")).toBeVisible();

  // Bấm mở thử Bao Lì Xì 3D → hiện thiệp & pháo hoa
  await page.getByTestId("nut-mo-li-xi").click();
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Đã mở bao lì xì");
  await expect(page.getByTestId("lx-phao-hoa")).toBeVisible();

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

test("/li-xi-tet-2027 khi công tắc tắt: ẩn nút thanh toán, vẫn cho xem thử Bao Lì Xì 3D & tải ảnh Social", async ({ page }) => {
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_TAT }));
  await page.goto("/li-xi-tet-2027");
  await expect(page.getByTestId("lx-chua-mo")).toBeVisible();
  await expect(page.getByTestId("lx-nut-mua")).toHaveCount(0);
  await expect(page.getByTestId("goi-lx-1")).toHaveCount(0);   // UX-NM: chưa mở bán thì không bày giá
  await expect(page.getByTestId("lx-social-studio")).toBeVisible();
});

test("/li-xi/[ma]: noindex, mở bao 3D hiện thiệp & pháo hoa (tắt pháo hoa khi reducedMotion=reduce), mã lạ báo không tìm thấy", async ({ page }) => {
  const ma = "abcdef1234567890";
  await page.route(`**/api/li-xi/${ma}`, (r) => r.fulfill({
    json: { co: true, ma, ten_nguoi_tang: "Anh Minh", loi_chuc: "Chúc năm mới bình an", mau_thiep: "mai_vang", nam: 2027, trang_thai: "san_sang", het_han: "2027-03-31", con_han: true },
  }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/li-xi/${ma}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByTestId("nut-mo-li-xi").click();
  await expect(page.getByTestId("lx-hop-nhan")).toBeVisible();
  await expect(page.getByTestId("lx-phao-hoa")).toBeVisible();
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Chúc năm mới bình an");
  await expect(page.getByTestId("lx-chuc-tu-viet")).toBeVisible();   // lời tự viết có dòng nhắc chống lừa đảo

  await page.goto("/li-xi/ma-khong-hop-le");
  await expect(page.getByTestId("lx-khong-co")).toBeVisible();
});

test("/og/li-xi trả ảnh PNG 200 đủ 3 khổ với 3 mẫu Linh Vật + Hoa Mai/Đào & robots.txt chặn /li-xi/", async ({ request }) => {
  for (const [khung, mau, hoa] of [
    ["ngang", "do_son", "linh_vat"],
    ["doc", "do_son", "linh_vat_son_mai"],
    ["vuong", "do_son", "linh_vat_thanh_lich"],
    ["vuong", "mai_vang", "hoa_mai"],
    ["doc", "ngoc_bich", "hoa_dao"],
  ] as const) {
    const og = await request.get(`/og/li-xi?khung=${khung}&mau=${mau}&hoa=${hoa}`);
    expect(og.status(), `Khổ ${khung} (${hoa}) phải trả 200`).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  }

  const rb = await (await request.get("/robots.txt")).text();
  expect(rb).toContain("/li-xi/");
  // Ảnh mẫu thiệp nằm ngoài đường bị chặn (robots chặn /li-xi/ thì Google không tải được ảnh trang mua).
  expect((await request.get("/anh/li-xi/hoa-mai-vang.jpg")).status()).toBe(200);
});

test("/li-xi-tet-2027: chọn người nhận → điền lời chúc hợp + mở thiệp xem ngay; đổi giọng; gõ tay thì bỏ chọn", async ({ page }) => {
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_TAT }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/li-xi-tet-2027");
  const o = page.locator("#lx-chuc");
  await expect(page.getByTestId("lx-giong")).toHaveCount(0);   // chưa chọn người nhận thì chưa có hàng giọng
  await page.getByTestId("quan-he-bo_me").click();
  await expect(o).toHaveValue(/bố mẹ/);
  await expect(page.getByTestId("quan-he-bo_me")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("giong-am")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Đã mở bao lì xì");
  const am = await o.inputValue();
  await page.getByTestId("giong-y").click();
  expect(await o.inputValue()).not.toBe(am);
  await expect(o).toHaveValue(/đèn|Ngân/);   // giọng "Ý nghĩa" mượn hình ảnh của năm Đinh Mùi
  await page.getByTestId("quan-he-doi_tac").click();   // đổi người nhận, giữ giọng đang chọn
  await expect(o).toHaveValue(/đối tác|Hợp tác/i);
  await expect(page.getByTestId("giong-y")).toHaveAttribute("aria-pressed", "true");
  await o.fill("Chúc tự viết của tôi");
  await expect(page.getByTestId("quan-he-doi_tac")).toHaveAttribute("aria-pressed", "false");
});

test("/li-xi-tet-2027: nút 'Xem thử pháo hoa' bắn pháo (canvas có mặt); quay video Story ra khung xem trước", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_TAT }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/li-xi-tet-2027");
  await page.getByTestId("nut-xem-thu-phao").click();
  await expect(page.getByTestId("lx-phao-canvas")).toBeAttached();
  await expect(page.getByTestId("bao-li-xi-3d")).toContainText("Đã mở bao lì xì");
  await page.getByTestId("lx-nut-quay-video").scrollIntoViewIfNeeded();
  await page.getByTestId("lx-nut-quay-video").click();
  await expect(page.getByTestId("lx-video-xem")).toBeVisible({ timeout: 45_000 });   // ~10 giây thời gian thực
});
