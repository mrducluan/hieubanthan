// Vòng thử người dùng mới thứ 2 (báo cáo UX v3) — nhóm "hỏi đáp + nhỏ lẻ": M1 thứ tự + cuộn câu trả lời, M4 lật lá bài
// thấy được, M6 lời chính sách khớp form, M10 nút đồng ý lọt màn đầu máy tính, #14 dòng huy hiệu là link, #24 nhãn chữ hoa ≥ 12px.
import { expect, test, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const DIEN_THOAI = { width: 390, height: 844 };
const MAY_TINH = { width: 1440, height: 900 };

/** Đáy thanh đầu trang + đỉnh thanh tab dưới (điện thoại) — đo thật. */
async function khungNhin(page: Page) {
  return page.evaluate(() => {
    const duoi = document.querySelector<HTMLElement>("[data-thanh-duoi]");
    return {
      dau: document.querySelector("[data-thanh-dau]")!.getBoundingClientRect().bottom,
      duoi: duoi && duoi.offsetParent !== null ? duoi.getBoundingClientRect().top : innerHeight,
    };
  });
}

test.describe("M1 hỏi đáp: câu hỏi → câu trả lời → hỏi tiếp → góp ý → phái", () => {
  test.use({ viewport: DIEN_THOAI });

  test("thần số 390×844: bấm 'Hỏi câu này' → câu hỏi ngay dưới thanh đầu, câu trả lời trong màn đầu, góp ý đi sau", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/than-so");
    const nut = page.getByRole("button", { name: "Hỏi câu này" }).first();
    await nut.scrollIntoViewIfNeeded();
    await nut.click();
    const tl = page.getByTestId("cau-tra-loi").last();
    await expect(tl.locator(".prose-vn")).toBeVisible();
    await expect(tl.getByTestId("sau-tra-loi")).toBeVisible();
    await page.waitForTimeout(300);   // config giảm chuyển động → cuộn tức thì; chờ khung ổn định
    const k = await khungNhin(page);
    const y = await tl.evaluate((a) => {
      const top = (e: Element | null | undefined) => (e ? e.getBoundingClientRect().top : null);
      const nutDung = [...a.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Đúng");
      const phai = [...a.querySelectorAll("*")].find((e) => e.children.length === 0 && /Phái nào nói đúng/.test(e.textContent ?? ""));
      const hoi = [...document.querySelectorAll("[data-testid='cau-hoi-ban']")].pop();
      return { hoi: top(hoi), van: top(a.querySelector(".prose-vn")), hoiTiep: top(a.querySelector("[data-testid='hoi-tiep']")), dung: top(nutDung), phai: top(phai) };
    });
    expect(y.hoi!).toBeGreaterThanOrEqual(k.dau);          // câu hỏi không bị thanh đầu che
    expect(y.van! + 120).toBeLessThan(k.duoi);              // đầu câu trả lời đọc được ngay, trên thanh tab dưới
    if (y.hoiTiep !== null) expect(y.hoiTiep).toBeGreaterThan(y.van!);
    expect(y.dung!).toBeGreaterThan(y.hoiTiep ?? y.van!);   // góp ý sau câu trả lời (và sau "Hỏi tiếp")
    if (y.phai !== null) expect(y.phai).toBeGreaterThan(y.dung!);
  });

  for (const [mang, duong] of [["Tử vi", "/tu-vi"], ["Bát tự", "/bat-tu"], ["Phong thuỷ", "/phong-thuy"]] as const) {
    test(`${mang}: khung hỏi đáp dùng chung vẫn chạy — câu hỏi rồi câu trả lời trong màn hình, không tràn ngang`, async ({ page }) => {
      await napHoSo(page);
      await page.goto(duong);
      const chip = page.getByLabel("Câu hỏi gợi ý").getByRole("button").first();
      await chip.scrollIntoViewIfNeeded();
      await chip.click();
      const tl = page.getByTestId("cau-tra-loi").last();
      await expect(tl).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(300);
      const k = await khungNhin(page);
      const hoi = await page.getByTestId("cau-hoi-ban").last().evaluate((e) => e.getBoundingClientRect().top);
      const tra = await tl.evaluate((e) => e.getBoundingClientRect().top);
      expect(hoi).toBeGreaterThanOrEqual(k.dau);
      expect(tra).toBeGreaterThan(hoi);
      expect(tra + 60).toBeLessThan(k.duoi);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  }
});

test("M4 lá bài: lật 3D thấy pha giữa (~550 ms), giảm chuyển động thì tức thì; mặt sau mang loại lá", async ({ page }) => {
  await napHoSo(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/hom-nay");
  const la = page.getByTestId("la-bai");
  await la.scrollIntoViewIfNeeded();
  const goc = await page.evaluate(() => new Promise<number[]>((ok) => {
    const el = document.querySelector<HTMLElement>("[data-testid='la-bai'] .relative.size-full")!;
    const doc = () => { const t = getComputedStyle(el).transform; const m = new DOMMatrix(t === "none" ? undefined : t); return Math.abs(Math.round(Math.atan2(-m.m13, m.m11) * 180 / Math.PI)); };
    const ds: number[] = []; let t0: number | undefined;
    const vong = (t: number) => { t0 ??= t; ds.push(doc()); if (t - t0 < 900) requestAnimationFrame(vong); else ok(ds); };
    document.querySelector<HTMLButtonElement>("[data-testid='la-bai-up']")!.click();
    requestAnimationFrame(vong);
  }));
  expect(goc.filter((g) => g > 20 && g < 160).length).toBeGreaterThanOrEqual(5);   // nhiều khung hình đang nghiêng
  expect(goc[goc.length - 1]).toBe(180);
  const mat = page.getByTestId("la-bai-mat");
  await expect(mat).toHaveAttribute("data-loai", /^(viec|cau_hoi|gio)$/);
  await expect(mat).toContainText(/Việc nhỏ|Câu hỏi|Giờ tốt/);
});

test("M6 chính sách: thẻ đồng ý mô tả đúng form (một dòng + Chi tiết)", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu#dong-y");
  const body = page.locator("main");
  await expect(body).toContainText("kèm một dòng nói dữ liệu đi đâu");
  await expect(body).toContainText("bấm \"Chi tiết\" để đọc đủ");
  await expect(body).not.toContainText("2–3 dòng");
});

for (const [ten, vp, tran] of [["máy tính 1440×900", MAY_TINH, 900], ["điện thoại 390×844", DIEN_THOAI, 780]] as const) {
  test(`M10 trang chủ ${ten}: nút "Đồng ý và xem kết quả" lọt trọn màn hình đầu`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/");
    const nut = page.getByRole("button", { name: /Đồng ý và xem kết quả/ });
    await expect(nut).toBeVisible();
    const b = (await nut.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(tran);
  });
}

test.describe("điện thoại", () => {
  test.use({ viewport: DIEN_THOAI });

  test("#14 Bản thân: dòng huy hiệu là link rõ ràng, bấm cuộn tới khối huy hiệu chi tiết", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/ban-than");
    const tt = page.getByTestId("huy-hieu-tom-tat");
    await expect(tt).toHaveAttribute("href", "#huy-hieu");
    await expect(tt).toContainText("Xem chi tiết");
    await tt.click();
    await expect(page).toHaveURL(/#huy-hieu$/);
    await page.waitForTimeout(300);
    const top = await page.locator("#huy-hieu").evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(200);
  });

  test("#24 nhãn chữ hoa (eyebrow) ≥ 12px, sáng hơn chữ mờ; trang chủ + kiến thức không tràn ngang", async ({ page }) => {
    for (const duong of ["/", "/kien-thuc"]) {
      await page.goto(duong);
      const co = await page.locator(".eyebrow").evaluateAll((ds) => ds.map((e) => parseFloat(getComputedStyle(e).fontSize)));
      expect(co.length).toBeGreaterThan(0);
      expect(Math.min(...co)).toBeGreaterThanOrEqual(12);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    }
  });
});
