// BT-UI — đầu trang /ban-than: hai cột cao bằng nhau (không còn khoảng trống), chia sẻ + QR ngay trên thẻ "Hồ sơ bản thân".
import { expect, test } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { duongQr, maHoaQr } from "../lib/qr";

test("Bản thân (máy tính): thẻ danh tính và cột lối đi cao bằng nhau, cùng mép trên", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await napHoSo(page);
  await page.goto("/ban-than");
  const the = page.getByTestId("the-danh-tinh");
  const cot = page.getByTestId("ban-than-loi-di");
  await expect(the).toBeVisible();
  await expect(page.getByTestId("huy-hieu-tom-tat")).toBeVisible();
  const [a, b] = [await the.boundingBox(), await cot.boundingBox()];
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
  expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
  // Bốn ô lối đi kín lưới 2 × 2, ô Sửa hồ sơ mở bảng sửa.
  await expect(cot.getByRole("link", { name: /Xem hợp đôi/ })).toHaveAttribute("href", "/hop-doi");
  await expect(cot.getByRole("link", { name: /Thời gian tới/ })).toHaveAttribute("href", "/thoi-gian-toi");
  await page.getByTestId("sua-ho-so").click();
  await expect(page.getByRole("dialog")).toContainText("Sửa hồ sơ");
});

test("Bản thân: Chia sẻ thẻ ngay trên thẻ → QR đúng link thẻ, tải ảnh, link không mang ngày sinh", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  const khoi = page.getByTestId("chia-se-the-ho-so");
  await expect(khoi).toContainText("không có ngày sinh");
  await page.getByTestId("nut-chia-se-the").click();
  await expect(page.getByTestId("qr-the-ho-so")).toBeVisible();
  const href = await page.getByTestId("tai-anh-the-ho-so").getAttribute("href");
  expect(href).toMatch(/^\/og\?ma=.+&khung=doc$/);
  const ma = decodeURIComponent(href!.slice("/og?ma=".length, -"&khung=doc".length));
  expect(ma).not.toMatch(/1990|1988|2000/);
  // QR vẽ đúng ma trận của link thẻ (cùng bộ mã hoá → cùng đường vẽ).
  const link = `${new URL(page.url()).origin}/the/${ma}`;
  expect(await page.getByTestId("qr-the-ho-so").locator("path").getAttribute("d")).toBe(duongQr(maHoaQr(link), 4));
  const anh = await page.request.get(href!);
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
  // Trang nhận thẻ mở được.
  const r = await page.request.get(`/the/${ma}`);
  expect(r.status()).toBe(200);
});

test("Bản thân (điện thoại): không tràn ngang, thẻ trước rồi tới lối đi", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await napHoSo(page);
  await page.goto("/ban-than");
  await expect(page.getByTestId("the-danh-tinh")).toBeVisible();
  await page.getByTestId("nut-chia-se-the").click();
  await expect(page.getByTestId("qr-the-ho-so")).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
  const [a, b] = [await page.getByTestId("the-danh-tinh").boundingBox(), await page.getByTestId("ban-than-loi-di").boundingBox()];
  expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1);
});

test("Bản thân: 'Bảy cách nhìn về bạn' — mỗi môn một câu engine viết, đủ hồ sơ thì sẵn sàng; ô Tarot không lộ lá khi chưa lật", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  const khoi = page.getByTestId("bay-cach-nhin");
  await expect(khoi).toBeVisible();
  const o = khoi.getByTestId("cach-nhin");
  await expect(o).toHaveCount(8);
  expect(await o.evaluateAll((ds) => ds.map((d) => d.getAttribute("data-mang")))).toEqual(["than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich", "nhan_tuong", "tarot", "chan_dung"]);
  const api = (await (await request.post("/api/goi-y-cheo", { data: { mang_hien_tai: "ban_than", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", ho_ten: ["Nguyễn Đức Luân"] } })).json()) as { the: { mang: string; cau: string; can_them: string | null }[] };
  expect(api.the).toHaveLength(8);
  const tv = api.the.find((t) => t.mang === "tu_vi")!;
  expect(tv.can_them).toBeNull();
  await expect(khoi.locator('[data-mang="tu_vi"]').getByTestId("cach-nhin-cau")).toHaveText(tv.cau);
  await expect(khoi.locator('[data-mang="tu_vi"]')).toHaveAttribute("href", "/tu-vi");
  // Hồ sơ mẫu đủ giờ + giới tính + nơi sinh, chưa soi gương, chưa lật lá → 5/7.
  await expect(khoi).toHaveAttribute("data-san-sang", "5");
  await expect(khoi.locator('[data-mang="tarot"]')).toContainText("Lá hôm nay đang úp");
  await expect(khoi.locator('[data-mang="tarot"]')).toHaveAttribute("href", "/hom-nay#ba-la");
  // Ba ô lối tắt chung chung cuối trang đã bỏ; còn hàng lối phụ.
  await expect(page.getByTestId("ban-than-loi-phu").getByRole("link")).toHaveCount(3);
  await expect(page.getByTestId("dang-dang-do")).toHaveCount(0);   // máy mới: chưa có gì dang dở
  await expect(page.getByTestId("dieu-da-xac-nhan")).toHaveCount(0);
});

test("Bản thân: hồ sơ chỉ có tên + ngày sinh → ô Tử vi ghi 'Cần giờ sinh', bấm mở bảng Sửa hồ sơ tại trang", async ({ page }) => {
  await napHoSo(page, { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 17, thang: 5, nam: 1990, tao_luc: "2026-09-30T00:00:00Z" });
  await page.goto("/ban-than");
  const tv = page.getByTestId("bay-cach-nhin").locator('[data-mang="tu_vi"]');
  await expect(tv.getByTestId("cach-nhin-trang-thai")).toHaveText("Cần giờ sinh");
  await expect(tv).toHaveAttribute("data-thieu", "gio");
  await tv.click();
  await expect(page.getByRole("dialog")).toContainText("Sửa hồ sơ");
  await expect(page).toHaveURL(/\/ban-than$/);
});

test("Bản thân: 'Đang dang dở' đọc từ máy (quẻ đã gieo, nhà đã lưu) — không hiện câu hỏi đã gõ; lật lá Tarot rồi thì ô Tarot hiện tên lá", async ({ page, request }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.que.v1", JSON.stringify([{ id: "q1", luc: "2026-11-09T08:00:00.000Z", cau: "Tôi có nên đổi việc không?", gia_tri_hao: [7, 8, 7, 8, 9, 7], cach: "may_gieo", che_do: "tu_dong", ten_que: "Phệ Hạp", ten_bien: null }]));
    const ngay = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    localStorage.setItem("hbt.ba_la.v1", JSON.stringify({ ngay, lat: ["tarot"] }));
  });
  await page.goto("/ban-than");
  const dd = page.getByTestId("dang-dang-do");
  await expect(dd.getByTestId("dang-do-que")).toContainText("Quẻ Phệ Hạp");
  await expect(dd).not.toContainText("đổi việc");
  await expect(dd.getByTestId("dang-do-que")).toHaveAttribute("href", "/kinh-dich");
  const ngay = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const la = (await (await request.post("/api/tarot/la-ngay", { data: { ngay, ngay_sinh: "1990-05-17" } })).json()) as { la: { ten: string } };
  const hn = (await (await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: ngay } })).json()) as { ba_la: { tarot: { ten: string } } };
  expect(la.la.ten).toBe(hn.ba_la.tarot.ten);   // ô Tarot ở Bản thân và lá ở Hôm nay là MỘT lá
  await expect(page.getByTestId("bay-cach-nhin").locator('[data-mang="tarot"]')).toContainText(`Lá hôm nay: ${la.la.ten}`);
});
