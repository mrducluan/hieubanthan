// ANH-1 + ANH-2 — "Tải ảnh chân dung" đầu trang Nhân tướng học.
// ANH-2 (không AI): chấm 20 điểm trên ảnh → ENGINE THẬT đo "tam đình ngũ nhãn" → gợi ý → xác nhận → khảo sát. Ảnh không rời
// máy: thân gửi chỉ có toạ độ + tỉ lệ khung. ANH-1 (AI, tuỳ chọn): engine e2e tắt → khối AI không hiện; bật giả lập bằng
// route mock (không gửi ảnh đi đâu).
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

// PNG 1×1 (ảnh vuông) — trình duyệt hiển thị full bề rộng khung, tỉ lệ 1.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const TEP = { name: "chan-dung.png", mimeType: "image/png", buffer: PNG };
// Gương mặt mẫu "mặt dài, trán cao" (cùng mẫu với engine/tests/test_nhan_tuong_do.py) theo đúng thứ tự điểm của KB.
const r = 0.09 * 0.084;
const MAT: [number, number][] = [
  [0.5, 0.10], [0.32, 0.37], [0.68, 0.37], [0.30, 0.47], [0.70, 0.47], [0.34, 0.66], [0.66, 0.66], [0.5, 0.75],
  [0.45, 0.37], [0.55, 0.37], [0.374, 0.42 - r], [0.458, 0.42], [0.542, 0.42], [0.626, 0.42 - r],
  [0.5, 0.56], [0.454, 0.55], [0.546, 0.55], [0.425, 0.63], [0.5, 0.625], [0.575, 0.63],
];

test.use({ viewport: { width: 1280, height: 1400 } });     // khung ảnh (~576 px) lọt trọn màn hình để kéo chuột

/** Cuộn khung ảnh vào màn hình rồi trả hộp của nó (toạ độ khung nhìn). */
async function khungAnh(page: Page) {
  const khung = page.getByTestId("do-khung");
  await expect(khung.locator("img")).toBeVisible();
  await khung.scrollIntoViewIfNeeded();
  return (await khung.boundingBox())!;
}

async function cham(page: Page, ds: [number, number][]) {
  const b = await khungAnh(page);
  for (const [x, y] of ds) await page.mouse.click(b.x + x * b.width, b.y + y * b.height);
}

const chamDu = (page: Page) => cham(page, MAT);

test("đo trên ảnh (engine thật, không AI): chấm 20 điểm → gợi ý mặt dài + trán dài → xác nhận → khảo sát", async ({ page }) => {
  await napHoSo(page);
  const than: unknown[] = [];
  page.on("request", (q) => { if (q.url().includes("/api/nhan-tuong/do-mat")) than.push(q.postDataJSON()); });
  await page.goto("/nhan-tuong");
  await expect(page.getByTestId("anh-chan-dung")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("anh-ai-khoi")).toHaveCount(0);                     // engine e2e tắt AI → không có khối AI
  await page.getByTestId("do-input").setInputFiles(TEP);
  await expect(page.getByTestId("do-dang-cham")).toContainText("Chân tóc giữa trán");
  const nut = page.getByTestId("do-tinh");
  await expect(nut).toBeDisabled();
  await chamDu(page);
  await expect(page.getByTestId("do-dang-cham")).toContainText("Đỉnh tai");        // bắt buộc đã đủ → tới điểm tai tuỳ chọn
  await expect(nut).toBeDisabled();                                                   // chưa đồng ý
  await expect(page.getByTestId("do-dong-y")).not.toBeChecked();
  await page.getByTestId("do-dong-y").check();
  await nut.click();
  const gy = page.getByTestId("do-goi-y");
  await expect(gy).toBeVisible({ timeout: 20_000 });
  await expect(gy).toContainText("(2 nổi bật)");                                    // NT-2: nét "vừa" cũng có câu trả lời
  await expect(page.getByTestId("goi-y-vua")).toContainText("Rộng vừa");
  await expect(page.getByTestId("goi-y-con-lai")).toBeVisible();
  await expect(gy).toContainText("Dài, hẹp, thanh");
  await expect(gy).toContainText("Phần trán dài rõ");
  await expect(page.getByTestId("do-so-do")).toContainText("Cao / ngang gò má: 1,63");
  // thân gửi: chỉ toạ độ + tỉ lệ + đồng ý — không có ảnh
  expect(than).toHaveLength(1);
  const t = than[0] as Record<string, unknown>;
  expect(Object.keys(t).sort()).toEqual(["diem", "dong_y", "ti_le"]);
  expect(Object.keys(t.diem as object)).toHaveLength(20);
  expect(JSON.stringify(t)).not.toContain("base64");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.dong_y_do_mat.v1") ?? "null")?.phien_ban)).toBe("dm1");
  await page.getByTestId("do-dung").click();
  const soDien = (await page.getByTestId("do-da-dung").textContent())?.match(/Đã điền (\d+) nét/)?.[1];
  expect(Number(soDien)).toBeGreaterThan(5);
  await expect(page.getByTestId("so-cau-da-tra-loi")).toHaveText(soDien!);
  await expect(page.getByTestId("cau-khuon_mat").getByRole("button", { name: "Dài, hẹp, thanh" })).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("do-xem-bai-doc").click();
  await expect(page.getByTestId("bao-cao-nhan-tuong")).toBeVisible({ timeout: 20_000 });
});

test("đo trên ảnh: điểm sai thứ tự → lời báo đúng điểm của engine; kéo chỉnh điểm sửa được", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => localStorage.setItem("hbt.dong_y_do_mat.v1", JSON.stringify({ phien_ban: "dm1", luc: "2026-11-06T01:00:00Z" })));
  await page.goto("/nhan-tuong");
  await page.getByTestId("do-input").setInputFiles(TEP);
  const sai = MAT.map(([x, y], i) => (i === 0 ? [0.5, 0.9] as [number, number] : [x, y] as [number, number]));   // chân tóc dưới cằm
  await cham(page, sai);
  await expect(page.getByTestId("do-da-dong-y")).toBeVisible();
  await page.getByTestId("do-tinh").click();
  await expect(page.getByTestId("do-loi")).toContainText("Chân tóc giữa trán", { timeout: 20_000 });
  // kéo điểm 1 từ dưới cằm lên trán
  const b = await khungAnh(page);
  await page.mouse.move(b.x + 0.5 * b.width, b.y + 0.9 * b.height);
  await page.mouse.down();
  await page.mouse.move(b.x + 0.5 * b.width, b.y + 0.4 * b.height, { steps: 4 });
  await page.mouse.move(b.x + 0.5 * b.width, b.y + 0.10 * b.height, { steps: 4 });
  await page.mouse.up();
  await page.getByTestId("do-tinh").click();
  await expect(page.getByTestId("do-goi-y")).toContainText("Dài, hẹp, thanh", { timeout: 20_000 });
});

// ANH-4: ảnh nghiêng (quay sang phải) — 9 điểm trên đường viền; giữa trán nhô rõ → "trán gồ" (cùng mẫu engine test_nhan_tuong_nghieng).
const NGHIENG: [number, number][] = [[0.50, 0.15], [0.56, 0.24], [0.55, 0.33], [0.538, 0.37], [0.575, 0.43], [0.62, 0.50], [0.575, 0.53], [0.565, 0.68], [0.53, 0.72]];

test("ảnh nghiêng (tuỳ chọn): chấm 9 điểm đường viền → gửi kèm lượt đo → gợi ý trán gồ; thiếu điểm thì không gửi", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => localStorage.setItem("hbt.dong_y_do_mat.v1", JSON.stringify({ phien_ban: "dm1", luc: "2026-11-06T01:00:00Z" })));
  const than: Record<string, unknown>[] = [];
  page.on("request", (q) => { if (q.url().includes("/api/nhan-tuong/do-mat")) than.push(q.postDataJSON()); });
  await page.goto("/nhan-tuong");
  await page.getByTestId("do-input").setInputFiles(TEP);
  await chamDu(page);
  await page.getByTestId("do-nghieng").locator("summary").click();
  await page.getByTestId("ng-input-nghieng_phai").setInputFiles({ ...TEP, name: "nghieng.png" });
  const k = page.getByTestId("ng-khung-nghieng_phai");
  await expect(k.locator("img")).toBeVisible();
  await k.scrollIntoViewIfNeeded();
  const b = (await k.boundingBox())!;
  for (const [x, y] of NGHIENG.slice(0, 8)) await page.mouse.click(b.x + x * b.width, b.y + y * b.height);
  await expect(page.getByTestId("ng-con-nghieng_phai")).toHaveText("Còn 1 điểm");
  await page.getByTestId("do-tinh").click();
  await expect(page.getByTestId("do-goi-y")).toBeVisible({ timeout: 20_000 });
  expect(than[0]).not.toHaveProperty("nghieng");                                      // chưa đủ điểm → không gửi ảnh nghiêng
  await k.scrollIntoViewIfNeeded();
  const b2 = (await k.boundingBox())!;
  await page.mouse.click(b2.x + NGHIENG[8]![0] * b2.width, b2.y + NGHIENG[8]![1] * b2.height);
  await expect(page.getByTestId("ng-con-nghieng_phai")).toHaveText("Đã đủ điểm");
  await expect(page.getByTestId("do-kem-nghieng")).toContainText("Kèm 1 ảnh nghiêng");
  await page.getByTestId("do-tinh").click();
  await expect(page.getByTestId("do-goi-y")).toContainText("Gồ, hai góc nhô", { timeout: 20_000 });
  const t = than[1] as { nghieng: { goc: string; diem: object; ti_le: number }[] };
  expect(t.nghieng).toHaveLength(1);
  expect(t.nghieng[0]!.goc).toBe("nghieng_phai");
  expect(Object.keys(t.nghieng[0]!.diem)).toHaveLength(9);
  expect(JSON.stringify(t)).not.toContain("base64");
});

test("AI bật (giả lập): khối AI gập, thoả thuận riêng am1; thân gửi có dong_y + góc; xác nhận → khảo sát", async ({ page }) => {
  await napHoSo(page);
  await page.route("**/api/nhan-tuong/cau-hinh", (q) => q.fulfill({ json: { doc_anh: true } }));
  const thanGui: unknown[] = [];
  await page.route("**/api/nhan-tuong/doc-anh", async (q) => {
    thanGui.push(q.request().postDataJSON());
    await q.fulfill({ json: { da_bat: true, ly_do_tat: null, can_xac_nhan: true, kiem_tra: { thay_mat: true, so_nguoi: 1, nhin_thang: true, du_sang: true },
      luu_y: [], tra_loi: [{ cau: "sac_tong", lua_chon: "sang_nhuan", do_tin: 0.8 }, { cau: "khong_co", lua_chon: "x", do_tin: 0.9 }] } });
  });
  await page.goto("/nhan-tuong");
  const khoi = page.getByTestId("anh-ai-khoi");
  await expect(khoi).toBeVisible({ timeout: 20_000 });
  await khoi.locator("summary").click();
  await expect(page.getByTestId("anh-doc")).toBeDisabled();
  await page.getByTestId("anh-input-thang").setInputFiles(TEP);
  await page.getByTestId("anh-input-nghieng_trai").setInputFiles(TEP);
  await page.getByTestId("anh-dong-y").check();
  await page.getByTestId("anh-doc").click();
  await expect(page.getByTestId("anh-goi-y")).toContainText("Máy thấy 1 nét", { timeout: 15_000 });
  const t = thanGui[0] as { dong_y: boolean; anh: { goc: string; loai: string }[] };
  expect(t.dong_y).toBe(true);
  expect(t.anh.map((a) => a.goc)).toEqual(["thang", "nghieng_trai"]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.dong_y_anh_mat.v1") ?? "null")?.phien_ban)).toBe("am1");
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong_y_do_mat.v1"))).toBeNull();      // hai thoả thuận tách riêng
  await page.getByTestId("anh-dung").click();
  await expect(page.getByTestId("so-cau-da-tra-loi")).toHaveText("1");
});

test("Dữ liệu của tôi liệt kê hai thoả thuận và rút từng cái", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.dong_y_anh_mat.v1", JSON.stringify({ phien_ban: "am1", luc: "2026-11-06T01:00:00Z" }));
    localStorage.setItem("hbt.dong_y_do_mat.v1", JSON.stringify({ phien_ban: "dm1", luc: "2026-11-06T01:00:00Z" }));
  });
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("dl-do-mat")).toContainText("Đã đồng ý ngày");
  await page.getByTestId("dl-do-mat-rut").click();
  await expect(page.getByTestId("dl-do-mat")).toContainText("Chưa đồng ý");
  await expect(page.getByTestId("dl-anh-mat")).toContainText("Đã đồng ý ngày");
  await page.getByTestId("dl-anh-mat-rut").click();
  await expect(page.getByTestId("dl-anh-mat")).toContainText("Chưa đồng ý");
});
