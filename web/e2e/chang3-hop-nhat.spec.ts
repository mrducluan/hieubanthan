// CHANG-3 — bốn khối mới: Việc sắp làm trong vài ngày (/co-van, /co-van-kinh-doanh), Năm nay lá số × gương mặt × bàn tay
// (/nhan-tuong, /chi-tay), Các trường phái thần số khác (/than-so — gập, SAU bài đọc chính), Lá ngược nói thêm gì (/tarot).
// Bản Anh (/en/numerology, /en/tarot, /en/face-reading) không lộ chữ Việt; điện thoại 390px không cuộn ngang.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { napHoSo, napDongY } from "./_hoso";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const ngang = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const dongViet = async (l: Locator) => (await l.innerText()).split("\n").filter((x) => VIET.test(x));
const HO_SO_EN = { v: 1, ho_ten: "Mary Ann Lee", ngay: 24, thang: 10, nam: 1988, gioi_tinh: "nu", tao_luc: "2026-09-30T00:00:00Z" };

/** Trải bài đã lưu trên máy (có hai lá ngược) → "Xem lại" đọc đúng trải bài này, không phụ thuộc lần xáo ngẫu nhiên. */
async function napTraiBaiNguoc(page: Page) {
  await page.addInitScript(() => localStorage.setItem("hbt.tarot.v1", JSON.stringify([{
    id: "e2echang3", luc: "2026-11-27T00:00:00Z", trai_bai: "ba_la_loi_khuyen",
    la: [{ id: "gay_1", nguoc: true }, { id: "kiem_3", nguoc: false }, { id: "coc_2", nguoc: true }], cau: "", chu_de: null, tom_tat: "",
  }])));
}

test.describe("CHANG-3 — Việc sắp làm trong vài ngày", () => {
  test("/co-van: chip có aria-pressed, ô 6 lần gieo có nhãn, gửi giờ máy + múi giờ, thuật ngữ chỉ trong Vì sao nói vậy", async ({ page }) => {
    await page.goto("/co-van");
    await page.getByTestId("tab-co-van-su-vu").click();
    const khoi = page.getByTestId("su-vu-tuc-thoi");
    await expect(khoi).toBeVisible();
    const chip = page.getByTestId("su-vu-chip-ky_ket_hop_dong");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("su-vu-chip-dam_phan_thuong_vu")).toHaveAttribute("aria-pressed", "false");
    expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByText("Tôi đã tự gieo 3 đồng xu").click();
    await expect(page.getByLabel("Lần gieo 1")).toBeVisible();
    await page.getByLabel("Lần gieo 6").selectOption("9");
    // Không còn thuật ngữ ở phần chữ chính của form
    expect(await khoi.innerText()).not.toMatch(/Lục Hào Nạp Giáp|Thiếu dương|Lão âm|Dụng thần/);

    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes("/api/co-van/su-vu") && r.method() === "POST"),
      page.getByTestId("su-vu-nut-xem").click(),
    ]);
    const body = req.postDataJSON();
    expect(body.utc).toBe(7);
    expect(body.gio_xem).toMatch(/^\d{2}:\d{2}$/);
    expect(body.ngay_xem).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.gia_tri_hao[5]).toBe(9);
    await expect(page.getByTestId("su-vu-ket-qua")).toBeVisible({ timeout: 15_000 });
    const lh = page.getByTestId("su-vu-goc-luc-hao");
    await expect(lh).toContainText("Phụ Mẫu");
    // căn cứ nằm trong mục gập "Vì sao nói vậy" (ẩn cho tới khi bấm)
    const canCu = lh.getByTestId("can-cu");
    await expect(canCu).toBeHidden();
    await lh.getByTestId("vi-sao").getByRole("button").click();
    await expect(canCu).toBeVisible();
    const ev = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; kind?: string; tinh_huong?: string }[] }).__hbt_su_kien ?? []);
    expect(ev.some((e) => e.kind === "su_vu_xem" && e.tinh_huong === "ky_ket_hop_dong")).toBe(true);

    await page.goto("/co-van-kinh-doanh");
    await page.getByTestId("tab-cvkd-su-vu").click();
    await expect(page.getByTestId("su-vu-tuc-thoi")).toBeVisible();
  });

  test("390px: /co-van không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/co-van");
    await page.getByTestId("tab-co-van-su-vu").click();
    await page.getByText("Tôi đã tự gieo 3 đồng xu").click();
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("CHANG-3 — Thần số: các trường phái khác", () => {
  test("/than-so: khối gập, nằm SAU bài đọc chính; mở mới tải; khung Cách xem vẫn Pitago + Phillips", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/than-so");
    const khoi = page.getByTestId("doi-chieu-da-phai-thanso");
    await expect(khoi).toBeVisible({ timeout: 30_000 });
    await expect(khoi).toContainText("Các trường phái khác đọc ngày sinh của bạn thế nào?");
    await expect(khoi).not.toHaveAttribute("open", "");
    await expect(page.getByTestId("ket-qua-5-phai-thanso")).toHaveCount(0);
    // vị trí: sau phần chiều sâu (#dong-doi), trước "Bạn đang vướng ở đâu?" (#noi-dau)
    const thuTu = await page.evaluate(() => {
      const k = document.querySelector("[data-testid=doi-chieu-da-phai-thanso]")!;
      const truoc = document.querySelector("#dong-doi")!;
      const sau = document.querySelector("#noi-dau")!;
      return [!!(truoc.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING), !!(k.compareDocumentPosition(sau) & Node.DOCUMENT_POSITION_FOLLOWING)];
    });
    expect(thuTu).toEqual([true, true]);
    // khung Cách xem: chỉ Pitago + Phillips
    await page.getByTestId("truong-phai-than-so-mo").click();
    const phai = page.getByTestId("truong-phai-than-so");
    await expect(phai.getByRole("tab", { name: "Pitago" })).toBeVisible();
    await expect(phai.getByRole("tab", { name: /Phillips/ })).toBeVisible();
    await expect(phai.getByRole("tab", { name: "Chaldea" })).toHaveCount(0);

    await page.getByTestId("nut-mo-5-phai-thanso").click();
    const kq = page.getByTestId("ket-qua-5-phai-thanso");
    await expect(kq).toBeVisible({ timeout: 15_000 });
    await expect(kq).toContainText("Pitago");
  });

  test("/en/numerology: khối tiếng Anh, không chữ Việt khi mở", async ({ page }) => {
    await napDongY(page);
    await page.addInitScript((h) => localStorage.setItem("hbt.hoso.v1", h), JSON.stringify(HO_SO_EN));
    await page.goto("/en/numerology");
    const khoi = page.getByTestId("doi-chieu-da-phai-thanso");
    await expect(khoi).toContainText("How do other schools read your birth date?", { timeout: 30_000 });
    await page.getByTestId("nut-mo-5-phai-thanso").click();
    await expect(page.getByTestId("ket-qua-5-phai-thanso").or(khoi.getByRole("alert"))).toBeVisible({ timeout: 15_000 });
    expect(await dongViet(khoi)).toEqual([]);
  });

  test("390px: /than-so mở khối không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await napHoSo(page);
    await page.goto("/than-so");
    await page.getByTestId("nut-mo-5-phai-thanso").click();
    await expect(page.getByTestId("ket-qua-5-phai-thanso")).toBeVisible({ timeout: 15_000 });
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("CHANG-3 — Tarot: lá ngược nói thêm gì", () => {
  test("/tarot: khối gập sau bài đọc, chỉ nghĩa ngược mới; tên sách chỉ trong Vì sao nói vậy", async ({ page }) => {
    await napTraiBaiNguoc(page);
    await page.goto("/tarot");
    await page.getByTestId("nut-xem-lai").click();
    await expect(page.getByTestId("bao-cao-tarot")).toBeVisible({ timeout: 30_000 });
    const khoi = page.getByTestId("chieu-sau-trai-bai");
    await expect(khoi).toBeVisible({ timeout: 15_000 });
    await expect(khoi).toContainText("Lá ngược nói thêm gì?");
    await expect(khoi).not.toHaveAttribute("open", "");
    await khoi.locator("summary").click();
    // không còn phần phẩm giá giữa các lá (đã có trên bàn bài), tên sách không ở chữ chính
    await expect(khoi).not.toContainText("Liber LXXVIII");
    const chu = (await khoi.innerText());
    expect(chu).not.toMatch(/Waite|Mathers/);
    await khoi.getByTestId("vi-sao").first().getByRole("button").click();
    await expect(khoi.getByTestId("can-cu").first()).toContainText(/Waite|Mathers/);
    const truoc = await page.evaluate(() => {
      const bc = document.querySelector("[data-testid=bao-cao-tarot]")!;
      const k = document.querySelector("[data-testid=chieu-sau-trai-bai]")!;
      return !!(bc.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(truoc).toBe(true);
  });

  test("/en/tarot: khối tiếng Anh, link theo bản Anh, không chữ Việt; 390px không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await napTraiBaiNguoc(page);
    await page.goto("/en/tarot");
    await page.getByTestId("nut-xem-lai").click();
    const khoi = page.getByTestId("chieu-sau-trai-bai");
    await expect(khoi).toContainText("What do the reversed cards add?", { timeout: 30_000 });
    await khoi.locator("summary").click();
    expect(await dongViet(khoi)).toEqual([]);
    for (const href of await khoi.locator("a").evaluateAll((a) => a.map((x) => x.getAttribute("href") ?? ""))) {
      expect(href.startsWith("/en/en")).toBe(false);
    }
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("CHANG-3 — Nhân tướng: năm nay lá số × gương mặt × bàn tay", () => {
  test("/nhan-tuong có hồ sơ: không hỏi lại ngày sinh / giới tính", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/nhan-tuong");
    const khoi = page.getByTestId("doi-chieu-tuong-menh");
    await expect(khoi.getByTestId("dctm-theo-ho-so")).toContainText("17/05/1990");
    await expect(khoi.getByTestId("dctm-ngay-sinh")).toHaveCount(0);
    await expect(khoi.getByTestId("dctm-gioi-tinh")).toHaveCount(0);
    await khoi.getByTestId("dctm-nut-xem").click();
    await expect(khoi.getByTestId("dctm-ket-qua")).toBeVisible({ timeout: 15_000 });
    expect(await khoi.getByTestId("dctm-ket-qua").innerText()).not.toMatch(/Nhật chủ/);
    // câu trích tiếng Anh của sách chỉ hiện khi mở "Vì sao nói vậy"
    const canCu = khoi.getByTestId("can-cu").last();
    await expect(canCu).toBeHidden();
    await khoi.getByTestId("vi-sao").last().getByRole("button").click();
    await expect(canCu).toBeVisible();
  });

  test("/chi-tay chưa có hồ sơ: phải tự chọn giới tính (không mặc định Nam)", async ({ page }) => {
    await page.goto("/chi-tay");
    const khoi = page.getByTestId("doi-chieu-tuong-menh");
    await expect(khoi).toBeVisible();
    await expect(khoi.getByTestId("dctm-gioi-tinh")).toHaveValue("");
    await expect(khoi.getByTestId("dctm-nut-xem")).toBeDisabled();
    // đợi trang chạy xong phía trình duyệt (ô nhập trước lúc đó không đổi state)
    await expect(async () => {
      await khoi.getByTestId("dctm-ngay-sinh").fill("1990-05-15");
      await khoi.getByTestId("dctm-gioi-tinh").selectOption("nu");
      await expect(khoi.getByTestId("dctm-nut-xem")).toBeEnabled({ timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await khoi.getByTestId("dctm-nut-xem").click();
    await expect(khoi.getByTestId("dctm-ket-qua")).toBeVisible({ timeout: 15_000 });
  });

  test("/en/face-reading: khối tiếng Anh, không chữ Việt; 390px không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await napDongY(page);
    await page.addInitScript((h) => localStorage.setItem("hbt.hoso.v1", h), JSON.stringify(HO_SO_EN));
    await page.goto("/en/face-reading");
    const khoi = page.getByTestId("doi-chieu-tuong-menh");
    await expect(khoi).toContainText("What do your chart, face and hands say about this year?", { timeout: 30_000 });
    await khoi.getByTestId("dctm-nut-xem").click();
    await expect(khoi.getByTestId("dctm-ket-qua").or(khoi.getByRole("alert"))).toBeVisible({ timeout: 15_000 });
    expect(await dongViet(khoi)).toEqual([]);
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });
});

test.describe("CHANG-3 — API bản Anh không trả chữ Việt", () => {
  test("x-ngon-ngu: en ở ba route", async ({ request }) => {
    const h = { "x-ngon-ngu": "en" };
    const ts = await request.post("/api/thanso/doi-chieu-phai", { headers: h, data: { ngay_sinh: "1988-11-22", ho_ten: "Mary Lee" } });
    expect(ts.status()).toBe(200);
    expect(JSON.stringify(await ts.json())).not.toMatch(VIET);
    const tr = await request.post("/api/tarot/chieu-sau", { headers: h, data: { la: [{ id: "gay_1", nguoc: true }, { id: "coc_2", nguoc: true }] } });
    expect(tr.status()).toBe(200);
    expect(JSON.stringify(await tr.json())).not.toMatch(VIET);
    const nt = await request.post("/api/nhan-tuong/doi-chieu-menh", { headers: h, data: { ngay_sinh: "1990-05-15", gioi_tinh: "nu" } });
    expect(nt.status()).toBe(200);
    expect(JSON.stringify(await nt.json())).not.toMatch(VIET);
    // thiếu giới tính → 422 (không mặc định)
    const thieu = await request.post("/api/nhan-tuong/doi-chieu-menh", { headers: h, data: { ngay_sinh: "1990-05-15" } });
    expect(thieu.status()).toBe(422);
  });
});

