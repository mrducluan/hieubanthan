// LK-1 — "La bàn đo chắc tay": ngắm → giữ yên 1,5 giây (web gửi MẪU THÔ) → engine trả số độ, hướng, sơn, độ rung, mức
// ổn định → mới được Chốt. Cảm biến giả lập bằng sự kiện `deviceorientationabsolute`; engine thật.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const KHOA_NHA = "hbt.nha.v1";

/** Bắn liên tục các hướng `ds` (độ la bàn, xoay vòng) như một la bàn Android nằm phẳng; `them` ghi đè trường sự kiện. */
async function ban(page: Page, ds: number[], them: Record<string, number> = {}) {
  await page.evaluate(([huong, t]) => {
    const w = window as unknown as { __ban?: number };
    if (w.__ban) window.clearInterval(w.__ban);
    const ten = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    let i = 0;
    w.__ban = window.setInterval(() => {
      const h = huong[i++ % huong.length]!;
      window.dispatchEvent(new DeviceOrientationEvent(ten, { alpha: (360 - h) % 360, beta: 0, gamma: 0, absolute: true, ...t }));
    }, 25);
  }, [ds, them] as const);
}
/** Như `ban` nhưng kiểu iPhone: có `webkitCompassHeading` / `webkitCompassAccuracy`. */
async function banIos(page: Page, huong: number, saiSo: number) {
  await page.evaluate(([h, ss]) => {
    const w = window as unknown as { __ban?: number };
    if (w.__ban) window.clearInterval(w.__ban);
    const ten = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    w.__ban = window.setInterval(() => {
      const e = new Event(ten);
      Object.assign(e, { webkitCompassHeading: h, webkitCompassAccuracy: ss, alpha: 0, beta: 2, gamma: 1 });
      window.dispatchEvent(e);
    }, 25);
  }, [huong, saiSo] as const);
}
const nha = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), KHOA_NHA);

async function moTrang(page: Page, duong = "/phong-thuy") {
  await napHoSo(page);
  await page.goto(duong);
  const o = page.getByTestId("do-huong");
  await expect(o).toBeVisible();
  await o.scrollIntoViewIfNeeded();
  return o;
}
/** Bấm "Đo bằng la bàn điện thoại" (bấm lại tới khi trang đã hydrate) rồi cho la bàn giả chạy. */
async function ngam(page: Page, ds: number[]) {
  const o = page.getByTestId("do-huong");
  await expect(async () => {
    if ((await o.getAttribute("data-pha")) !== "ngam") await o.getByTestId("la-ban-bat-dau").click({ timeout: 2_000 });
    await expect(o).toHaveAttribute("data-pha", "ngam", { timeout: 1_500 });
  }).toPass();
  await ban(page, ds);
  await expect(o.getByTestId("la-ban-giu-yen")).toBeEnabled();
}
/** Bấm "Giữ yên và đo" và chờ phiếu đo (kết quả engine). */
async function giuYen(page: Page) {
  const o = page.getByTestId("do-huong");
  await o.getByTestId("la-ban-giu-yen").click();
  await expect(o.getByTestId("la-ban-vong-do")).toBeVisible();
  const phieu = o.getByTestId("phieu-do");
  await expect(phieu).toBeVisible({ timeout: 20_000 });
  return phieu;
}

test("giữ yên 1,5 giây → gửi mẫu thô → kết quả engine → Chốt lưu hướng nhà; cảm biến đã dừng nên gõ tay không bị đè", async ({ page }) => {
  const o = await moTrang(page);
  expect(await nha(page)).toBeNull();
  await ngam(page, [134.8, 135, 135.2, 135.1, 134.9]);
  const guiDi = page.waitForRequest((r) => r.url().includes("/api/phongthuy/do-huong") && r.method() === "POST");
  const phieu = await giuYen(page);
  const than = (await guiDi).postDataJSON() as { mau?: number[]; do_huong?: number };
  expect(than.do_huong).toBeUndefined();                               // web không tự tính số độ
  expect(than.mau!.length).toBeGreaterThanOrEqual(3);
  expect(than.mau!.every((x) => x >= 0 && x < 360)).toBe(true);

  await expect(phieu.getByTestId("phieu-do-so")).toContainText("135");
  await expect(phieu.getByTestId("phieu-do-so")).toContainText("Đông Nam");
  await expect(phieu.getByTestId("phieu-do-so")).toContainText("Tốn");
  await expect(phieu).toContainText("Tây Bắc");                         // toạ do engine trả
  await expect(phieu.getByTestId("phieu-loi")).toContainText("±");      // độ rung: lời của engine
  await expect(phieu).not.toContainText("%");                           // không còn "ổn định %"
  expect(await nha(page)).toBeNull();                                  // chưa Chốt thì chưa lưu

  // cảm biến đã gỡ: la bàn giả vẫn bắn nhưng trang không nghe nữa
  await expect(o).toHaveAttribute("data-pha", "nghi");
  await ban(page, [270]);
  const oNhap = o.getByLabel("Độ hướng nhà");
  await oNhap.fill("200");
  await page.waitForTimeout(500);
  await expect(oNhap).toHaveValue("200");
  await expect(o.getByTestId("la-ban-do-so")).toContainText("135°");
  await expect(o.getByTestId("la-ban-keo")).toHaveAttribute("role", "slider");   // kéo mặt la bàn dùng lại được

  await phieu.getByTestId("phieu-chot").click();
  const kq = page.getByTestId("ket-qua-do-huong");
  await expect(kq).toContainText("Đông Nam");
  await expect(kq).toContainText("sơn Tốn");
  await expect.poll(async () => (await nha(page))?.huong_do).toBeCloseTo(135, 0);
  await expect(o.getByTestId("phieu-do")).toHaveCount(0);
});

test("mẫu quanh chính Bắc (359° / 1°) chốt ra 0°, không bao giờ 360°", async ({ page }) => {
  const o = await moTrang(page);
  await ngam(page, [359, 1, 359.5, 0.5, 359.98, 0.02]);
  await expect(o.getByTestId("la-ban-do-so")).not.toContainText("360");
  const phieu = await giuYen(page);
  await expect(phieu.getByTestId("phieu-do-so")).toContainText(/^0° /);
  await expect(phieu.getByTestId("phieu-do-so")).toContainText("Bắc");
  await expect(o.getByTestId("la-ban-do-so")).toContainText(/^0°/);
  await phieu.getByTestId("phieu-chot").click();
  await expect(page.getByTestId("ket-qua-do-huong")).toContainText("Bắc");
  await expect.poll(async () => (await nha(page))?.huong_do).toBe(0);
});

test("kim rung ±15° → engine bảo đo lại, không có nút Chốt, không lưu", async ({ page }) => {
  const o = await moTrang(page);
  await ngam(page, [165, 195, 170, 190, 150, 210]);
  const phieu = await giuYen(page);
  await expect(phieu).toHaveAttribute("data-chot", "false");
  await expect(phieu.getByTestId("phieu-chot")).toHaveCount(0);
  await expect(phieu.getByTestId("phieu-do-lan-2")).toHaveCount(0);
  await expect(phieu.getByTestId("phieu-loi")).toContainText("đo lại");
  await expect(phieu.getByTestId("phieu-do-lai")).toBeVisible();
  expect(await nha(page)).toBeNull();
  // "Đo lại" quay về ngắm
  await phieu.getByTestId("phieu-do-lai").click();
  await expect(o).toHaveAttribute("data-pha", "ngam");
  await o.getByTestId("la-ban-dung").click();
  await expect(o).toHaveAttribute("data-pha", "nghi");
});

test("đo hai điểm: lần hai lệch 20° → báo nhiễu, chặn Chốt, dẫn sang bản đồ; lệch 1° → chốt được", async ({ page }) => {
  const o = await moTrang(page);
  await ngam(page, [180, 180.2, 179.8]);
  let phieu = await giuYen(page);
  await expect(phieu.getByTestId("phieu-chot")).toBeVisible();
  await phieu.getByTestId("phieu-do-lan-2").click();
  await expect(o).toHaveAttribute("data-pha", "ngam");
  await ban(page, [200, 200.2, 199.8]);
  await expect(o.getByTestId("la-ban-do-so")).toContainText("200°");
  const guiDi = page.waitForRequest((r) => r.url().includes("/api/phongthuy/do-huong") && r.method() === "POST");
  phieu = await giuYen(page);
  const than = (await guiDi).postDataJSON() as { mau: number[]; mau_2?: number[] };
  expect(than.mau.every((x) => Math.abs(x - 180) < 1)).toBe(true);
  expect(than.mau_2!.every((x) => Math.abs(x - 200) < 1)).toBe(true);
  const hai = phieu.getByTestId("phieu-hai-lan");
  await expect(hai).toContainText("180");
  await expect(hai).toContainText("200");
  await expect(hai).toContainText("lệch nhau");                         // lời engine
  await expect(phieu.getByTestId("phieu-chot")).toHaveCount(0);
  expect(await nha(page)).toBeNull();
  await phieu.getByTestId("phieu-mo-ban-do").click();
  await expect(o.getByLabel("Toạ độ tâm nhà")).toBeVisible();

  // đo lại từ đầu, lần hai gần trùng → engine gộp, chốt được
  await phieu.getByTestId("phieu-do-lai").click();
  await ban(page, [180, 180.2, 179.8]);
  await expect(o.getByTestId("la-ban-do-so")).toContainText("180°");
  phieu = await giuYen(page);
  await phieu.getByTestId("phieu-do-lan-2").click();
  await expect(o).toHaveAttribute("data-pha", "ngam");
  await ban(page, [181, 181.2, 180.8]);
  await expect(o.getByTestId("la-ban-do-so")).toContainText("181°");
  phieu = await giuYen(page);
  await expect(phieu.getByTestId("phieu-hai-lan")).toContainText("khớp");
  await expect(phieu.getByTestId("phieu-do-lan-2")).toHaveCount(0);     // đã đo hai lần rồi
  await phieu.getByTestId("phieu-chot").click();
  await expect.poll(async () => (await nha(page))?.huong_do).toBeCloseTo(180.5, 0);
});

test("iPhone báo la bàn chưa hiệu chỉnh (sai số âm) → hướng dẫn vẽ số 8, không cho Chốt", async ({ page }) => {
  const o = await moTrang(page);
  await expect(async () => {
    if ((await o.getAttribute("data-pha")) !== "ngam") await o.getByTestId("la-ban-bat-dau").click({ timeout: 2_000 });
    await expect(o).toHaveAttribute("data-pha", "ngam", { timeout: 1_500 });
  }).toPass();
  await banIos(page, 90, -1);
  await expect(o.getByTestId("la-ban-do-so")).toContainText("90°");
  const guiDi = page.waitForRequest((r) => r.url().includes("/api/phongthuy/do-huong") && r.method() === "POST");
  const phieu = await giuYen(page);
  expect(((await guiDi).postDataJSON() as { sai_so?: number }).sai_so).toBe(-1);
  await expect(phieu.getByTestId("phieu-loi")).toContainText("số 8");
  await expect(phieu.getByTestId("hinh-so-8")).toBeVisible();
  await expect(phieu.getByTestId("phieu-chot")).toHaveCount(0);
});

test("máy dựng đứng: nhắc đặt phẳng, chưa cho đo; không có số nào sau 2,5 giây thì tự dừng và báo", async ({ page }) => {
  const o = await moTrang(page);
  await ngam(page, [90]);
  await ban(page, [90], { beta: 80 });
  await expect(o.getByTestId("la-ban-dang-ngam")).toContainText("dựng quá");
  await expect(o.getByTestId("la-ban-giu-yen")).toBeDisabled();
  await o.getByTestId("la-ban-dung").click();
  await expect(o).toHaveAttribute("data-pha", "nghi");
  // máy không có la bàn (không bắn sự kiện nào)
  await page.evaluate(() => { const w = window as unknown as { __ban?: number }; if (w.__ban) window.clearInterval(w.__ban); });
  await o.getByTestId("la-ban-bat-dau").click();
  await expect(o).toHaveAttribute("data-pha", "ngam");
  await expect(o.getByTestId("do-huong-loi")).toContainText("nhập độ tay", { timeout: 6_000 });
  await expect(o).toHaveAttribute("data-pha", "nghi");
  await expect(o.getByTestId("la-ban-bat-dau")).toBeVisible();
});

test("màn hình 360px: lúc ngắm và lúc có phiếu đo đều không tràn ngang; mặt la bàn có nhãn đọc được", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const o = await moTrang(page);
  const khongTran = async () => {
    const [rong, khung] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(rong).toBeLessThanOrEqual(khung);
    const hop = (await o.boundingBox())!;
    expect(hop.x).toBeGreaterThanOrEqual(0);
    expect(hop.x + hop.width).toBeLessThanOrEqual(360);
    expect(await o.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  };
  await khongTran();
  await ngam(page, [44.8, 45, 45.2]);
  await expect(o.getByTestId("la-ban-mat")).toHaveAttribute("aria-label", /45 độ/);
  await khongTran();
  await giuYen(page);
  await khongTran();
});

test("bản tiếng Anh /en/feng-shui: nút, phiếu đo và lời engine đều tiếng Anh", async ({ page }) => {
  const o = await moTrang(page, "/en/feng-shui");
  await expect(o.getByTestId("la-ban-bat-dau")).toContainText("Use the phone's compass");
  await ngam(page, [134.9, 135, 135.1]);
  await expect(o.getByTestId("la-ban-giu-yen")).toContainText("Hold still and measure");
  await expect(o.getByTestId("la-ban-dung")).toContainText("Stop");
  const phieu = await giuYen(page);
  await expect(phieu).toContainText("This reading");
  await expect(phieu).toContainText("South-East");
  await expect(phieu.getByTestId("phieu-chot")).toContainText("Set this direction");
  await expect(phieu.getByTestId("phieu-do-lai")).toContainText("Measure again");
  await expect(phieu.getByTestId("phieu-do-lan-2")).toContainText("Measure once more");
  const chu = await phieu.innerText();
  expect(chu).not.toMatch(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i);
});

test("Chrome có requestPermission + bắn cả sự kiện TƯƠNG ĐỐI lệch 24°: chỉ đọc sự kiện tuyệt đối (lỗi 160° ↔ 184°)", async ({ page }) => {
  // Lỗi thật trên hieuban.com: thấy `DeviceOrientationEvent.requestPermission` thì mã cũ coi là iOS, chỉ nghe
  // `deviceorientation` (alpha tương đối) → web báo 160° khi la bàn của máy báo 184°.
  await page.addInitScript(() => {
    const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (D && typeof D.requestPermission !== "function") D.requestPermission = () => Promise.resolve("granted");
  });
  const o = await moTrang(page);
  await expect(async () => {
    if ((await o.getAttribute("data-pha")) !== "ngam") await o.getByTestId("la-ban-bat-dau").click({ timeout: 2_000 });
    await expect(o).toHaveAttribute("data-pha", "ngam", { timeout: 1_500 });
  }).toPass();
  await page.evaluate(() => {
    const w = window as unknown as { __ban?: number };
    if (w.__ban) window.clearInterval(w.__ban);
    w.__ban = window.setInterval(() => {
      window.dispatchEvent(new DeviceOrientationEvent("deviceorientationabsolute", { alpha: 176, beta: 1, gamma: 0, absolute: true }));
      window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: 200, beta: 1, gamma: 0, absolute: false }));
    }, 25);
  });
  await expect(o.getByTestId("la-ban-giu-yen")).toBeEnabled();
  const guiDi = page.waitForRequest((r) => r.url().includes("/api/phongthuy/do-huong") && r.method() === "POST");
  const phieu = await giuYen(page);
  const than = (await guiDi).postDataJSON() as { mau: number[] };
  expect(than.mau.every((x) => Math.abs(x - 184) < 0.5)).toBe(true);   // không mẫu nào 160°
  await expect(phieu.getByTestId("phieu-do-so")).toContainText("184");
});
