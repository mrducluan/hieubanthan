// HTT-1 (docs/DANH-GIA-HYBRID-TWO-TIER.md): lớp 2 "Điểm giao thoa" từ hộp đã bấm Đúng (vi + en), nút kiểm chứng tiếng Anh,
// công tắc "Giờ sinh: đồng hồ / mặt trời thực" ở Trường phái, dải gợi ý bản tiếng Anh theo Accept-Language (không chuyển hướng),
// phiếu kiểm chứng mang ngon_ngu. Chuỗi thật web → engine (không LLM, không Supabase).
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const VI = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;

test("giao thoa (vi): bấm Đúng với mình ≥ 2 hộp → engine ghép điểm chung, hộp giao thoa có nút kiểm chứng", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toHaveAttribute("data-phien-ban", "doi_song_1");
  await expect(page.getByTestId("giao-thoa")).toHaveCount(0);
  // Bấm thật hai hộp đầu (phiếu đi lên /api/kiem-chung với ngon_ngu=vi) — hai hộp cùng môn có thể chưa đủ luật → chưa có hộp.
  const phieu = page.waitForRequest((r) => r.url().endsWith("/api/kiem-chung") && r.method() === "POST");
  const nut = bc.getByRole("button", { name: "Đúng với mình" });
  await nut.nth(0).click();
  expect(JSON.parse((await phieu).postData() ?? "{}")).toMatchObject({ loai: "doi_song", ngon_ngu: "vi" });
  await nut.nth(0).click();   // nút thứ nhất đã thành "Đã ghi" → nth(0) là hộp kế tiếp
  // Thêm hai mã của hai môn cùng mảng Công việc (như KiemChung phát khi bấm) → luật A: "Tử vi và Bát tự cùng nói trúng".
  const goi = page.waitForResponse((r) => r.url().endsWith("/api/giao-thoa") && r.status() === 200);
  await page.evaluate(() => {
    for (const mau of ["ds.su_nghiep.e2e.thuan", "ds.bt.su_nghiep.e2e.thuan"]) {
      window.dispatchEvent(new CustomEvent("hbt-phieu", { detail: { loai: "doi_song", mau, phai: "nam_phai_viet", ket_qua: "dung" } }));
    }
  });
  const kq = await (await goi).json();
  expect(kq.hop.some((h: { ma_mau: string }) => h.ma_mau === "ds.giao_thoa.cong_viec.mon.thuan.2")).toBe(true);
  const gt = page.getByTestId("giao-thoa");
  await expect(gt).toBeVisible();
  await expect(gt).toContainText("Điểm giao thoa từ điều bạn đã xác nhận");
  await expect(gt).toContainText("Tử vi và Bát tự");
  await expect(gt.getByTestId("hop-noi-bat").first()).toBeVisible();
  await expect(gt.getByTestId("kiem-chung").first()).toBeVisible();    // hộp giao thoa cũng hỏi "Đúng với mình"
  await expect(gt).toContainText("Tự hỏi");
});

test("giao thoa + kiểm chứng tiếng Anh trên bài đọc Tarot /en", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/tarot");
  await expect(page.getByTestId("la-ngay-en")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("o-cau-hoi-en").fill("Should I take the new job offer?");
  await page.getByTestId("trai-bai-en-ba_la_loi_khuyen").click();
  await page.getByTestId("nut-bat-dau-en").click();
  await page.getByTestId("nut-may-xao").click();
  const quat = page.getByTestId("quat-bai");
  await expect(quat).toBeVisible({ timeout: 15_000 });
  for (const k of [5, 40, 70]) await quat.locator(`[data-chi-so="${k}"]`).dispatchEvent("click");
  await page.getByTestId("nut-lat-het-en").click();
  await page.getByTestId("nut-doc-bai-en").click();
  const bc = page.getByTestId("bao-cao-en");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  // Nút kiểm chứng tiếng Anh + phiếu mang ngon_ngu = en
  const nut = bc.getByRole("button", { name: "Resonates with me" });
  await expect(nut.first()).toBeVisible();
  const phieu = page.waitForRequest((r) => r.url().endsWith("/api/kiem-chung") && r.method() === "POST");
  await nut.nth(0).click();
  const than = JSON.parse((await phieu).postData() ?? "{}");
  expect(than).toMatchObject({ loai: "doi_song", ngon_ngu: "en" });
  expect(String(than.mau)).toMatch(/^ds\.tarot\./);
  await expect(bc.getByText("Saved").first()).toBeVisible();
  // Lớp 2 tiếng Anh: thêm hai mã hai môn → hộp "Where the readings meet", không chữ Việt.
  const goi = page.waitForResponse((r) => r.url().endsWith("/api/giao-thoa") && r.status() === 200);
  await page.evaluate(() => {
    for (const mau of ["ds.tarot.tra_loi.e2e.x", "ds.thanso.su_nghiep.e2e.thuan", "ds.su_nghiep.e2e.thuan"]) {
      window.dispatchEvent(new CustomEvent("hbt-phieu", { detail: { loai: "doi_song", mau, phai: "tarot_tong_hop", ket_qua: "dung" } }));
    }
  });
  await goi;
  const gt = page.getByTestId("giao-thoa");
  await expect(gt).toBeVisible();
  await expect(gt).toContainText("Where the readings meet");
  expect(await gt.innerText()).not.toMatch(VI);
  await expect(gt.getByTestId("hop-giao-thoa-en").first()).toBeVisible();
  await expect(gt.getByRole("button", { name: "Resonates with me" }).first()).toBeVisible();
});

test("trường phái: Giờ sinh theo đồng hồ ↔ mặt trời thực — lá số an lại, chip đổi", async ({ page }) => {
  // Điện Biên 11:05 ngày 13/06: giờ Ngọ theo đồng hồ, giờ Tỵ theo mặt trời thực (như test engine).
  await napHoSo(page, { ...HO_SO_MAU, ngay: 13, thang: 6, nam: 1990, gio: "11:05", noi_sinh: "dien-bien" });
  await page.goto("/tu-vi");
  await page.getByTestId("tv-hien-thi-mo").click();
  const tp = page.getByTestId("truong-phai");
  await expect(tp.getByTestId("chon-gio-sinh")).toBeVisible();
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Giờ đồng hồ");
  const req = page.waitForRequest((r) => r.url().endsWith("/api/tuvi/la-so") && (r.postData() ?? "").includes('"gio_sinh":"mat_troi"'));
  await tp.getByRole("tab", { name: "Theo mặt trời thực" }).click();
  await req;
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Giờ mặt trời thực");
  await expect(tp.getByTestId("phai-ve-mac-dinh")).toBeVisible();
  await tp.getByTestId("phai-ve-mac-dinh").click();
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Giờ đồng hồ");
});

test("bát tự: công tắc Giờ sinh gửi gio_sinh cho engine", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 10, thang: 1, nam: 2000, gio: "13:05", noi_sinh: "nuoc_ngoai", mui_gio: "es-madrid" });
  await page.goto("/bat-tu");
  const tp = page.getByTestId("truong-phai-bat-tu");
  await expect(tp).toBeVisible({ timeout: 15_000 });
  await tp.getByTestId("truong-phai-bat-tu-mo").click();
  const req = page.waitForRequest((r) => r.url().endsWith("/api/battu/la-so") && (r.postData() ?? "").includes('"gio_sinh":"mat_troi"'));
  await tp.getByRole("tab", { name: "Theo mặt trời thực" }).click();
  await req;
  await expect(tp.getByTestId("phai-dang-dung")).toContainText("Giờ mặt trời thực");
});

test("dải gợi ý tiếng Anh: chỉ khi trình duyệt ưu tiên tiếng Anh, tắt được, không chuyển hướng", async ({ request, browser }) => {
  const vi = await request.get("/than-so");
  expect(vi.status()).toBe(200);
  expect(await vi.text()).not.toContain("goi-y-tieng-anh");
  const en = await request.get("/than-so", { headers: { "accept-language": "en-US,en;q=0.9" } });
  expect(en.status()).toBe(200);                                  // không 30x
  expect(await en.text()).toContain("goi-y-tieng-anh");
  const tat = await request.get("/than-so", { headers: { "accept-language": "en-US,en;q=0.9", cookie: "hbt-goi-y-en=1" } });
  expect(await tat.text()).not.toContain("goi-y-tieng-anh");
  // Trình duyệt: link trỏ đúng bản Anh của trang, bấm X thì đặt cookie và dải biến mất.
  const ctx = await browser.newContext({ locale: "en-US", extraHTTPHeaders: { "accept-language": "en-US,en;q=0.9" } });
  const page = await ctx.newPage();
  await page.goto("/than-so");
  const dai = page.getByTestId("goi-y-tieng-anh");
  await expect(dai).toBeVisible();
  await expect(dai.getByRole("link", { name: /Read it in English/ })).toHaveAttribute("href", "/en/numerology");
  await dai.getByRole("button", { name: "Dismiss" }).click();
  await expect(dai).toHaveCount(0);
  expect((await ctx.cookies()).some((c) => c.name === "hbt-goi-y-en")).toBe(true);
  await ctx.close();
});
