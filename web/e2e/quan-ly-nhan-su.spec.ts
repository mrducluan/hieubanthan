// E2E /quan-ly-nhan-su: chip "Bổ trợ ổn định" của Bản đồ đội ngũ + bộ 3 tab điều hành (Đội ngũ · Lịch 12 tháng · Mặt bằng).
import { expect, test } from "@playwright/test";
import { napHoSo } from "./_hoso";

// Rà soát 2026-11-20: engine trả muc_phoi_hop "bo_tro_tot", web từng lọc theo "bo_tro_on_dinh" → chip luôn 0 người.
test("Bản đồ đội ngũ mẫu: chip 'Bổ trợ ổn định' đếm đúng người và lọc ra danh sách", async ({ page }) => {
  await page.goto("/quan-ly-nhan-su");
  await page.getByRole("button", { name: /Xem thử đội ngũ mẫu/ }).click();
  const chip = page.getByRole("tab", { name: /^Bổ trợ ổn định \(\d+\)$/ });
  await expect(chip).toBeVisible({ timeout: 20_000 });
  const so = Number((await chip.textContent())?.match(/\((\d+)\)/)?.[1] ?? "0");
  expect(so).toBeGreaterThan(0);
  await chip.click();
  await expect(page.getByRole("button", { name: /Bổ trợ ổn định/ })).toHaveCount(so);
});

const CHU_DN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 15, thang: 8, nam: 1986, gioi_tinh: "nam" as const, tao_luc: "2026-09-30T00:00:00Z" };

test("3 tab /quan-ly-nhan-su: Lịch 12 tháng → Mặt bằng (kiêm hướng · không vong · không rõ năm xây · hồ sơ cửa hàng)", async ({ page }) => {
  await napHoSo(page, CHU_DN);
  await page.goto("/quan-ly-nhan-su");

  await expect(page.getByTestId("tab-ban-do-doi-ngu")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("tab-lich-12-thang")).toBeVisible();
  await expect(page.getByTestId("tab-mat-bang")).toBeVisible();

  // Tab 2: Lịch Quyết Định 12 Tháng
  await page.getByTestId("tab-lich-12-thang").click();
  // Hồ sơ không có giờ sinh → không gửi giờ; mặc định "12 tháng tới" → không gửi năm xem (engine tự lấy tháng hiện tại).
  const yeuCauLich = page.waitForRequest((r) => r.url().includes("/api/doanh-chu/lich-12-thang") && r.method() === "POST");
  await page.getByTestId("nut-xem-lich-12-thang").click();
  const bodyLich = (await yeuCauLich).postDataJSON() as Record<string, unknown>;
  expect(bodyLich).not.toHaveProperty("gio");
  expect(bodyLich).not.toHaveProperty("nam_xem");
  const kqLich = page.getByTestId("ket-qua-lich-12-thang");
  await expect(kqLich).toBeVisible({ timeout: 15000 });
  await expect(kqLich).toContainText("Tất cả 12 tháng");
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "numeric" })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  await expect(kqLich).toContainText(`12 tháng kể từ T${Number(p.month)}/${p.year}`);
  await expect(kqLich.getByTestId("thieu-gio-lich-12")).toContainText("Chưa có giờ sinh");
  await expect(kqLich.getByTestId("hai-cach-lich-12")).toHaveCount(0);
  await expect(kqLich.getByTestId("thang-lich-12")).toHaveCount(12);
  const thangDau = kqLich.getByTestId("thang-lich-12").first();
  await expect(thangDau).toContainText(`Tháng ${Number(p.month)}/${p.year}`);
  await expect(thangDau).toContainText("Tóm lại");
  await expect(thangDau.locator("details li").first()).toBeHidden();
  await thangDau.getByText("Vì sao nói vậy").click();
  await expect(thangDau.locator("details li").first()).toBeVisible();
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "chart_interacted", mo_dun: "doanh_chu", kind: "lich_12_xem", co_gio: false }));

  // Tab 3a: 200° + năm 2010 → kiêm hướng, bàn thế quái
  await page.getByTestId("tab-mat-bang").click();
  await expect(page.getByTestId("mat-bang-khai-truong")).toBeVisible();
  await page.locator("#mb-do").fill("200");
  await page.locator("#mb-nam-xay").fill("2010");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  const kqMb = page.getByTestId("ket-qua-mat-bang");
  await expect(kqMb).toBeVisible({ timeout: 15000 });
  await expect(kqMb.getByTestId("canh-bao-kiem-huong")).toContainText("thế quái");
  await expect(kqMb).toContainText("Quầy thu ngân");
  await expect(kqMb).toContainText("Nên chú ý:");
  await expect(kqMb).toContainText("Vận 8");
  // "Vì sao nói vậy" gập sẵn, mở ra mới thấy căn cứ
  const khu = kqMb.getByTestId("khu-thu_ngan");
  await expect(khu.locator("details p")).toBeHidden();
  await khu.getByText("Vì sao nói vậy").click();
  await expect(khu.locator("details p")).toBeVisible();

  // Hồ sơ cửa hàng đã lưu trên máy
  const luu = await page.evaluate(() => window.localStorage.getItem("hbt.mat_bang.v1"));
  expect(JSON.parse(luu ?? "null")).toMatchObject({ v: 1, do_huong: 200, cach_nam: "chinh_xac", nam_xay: 2010 });

  // Tab 3b: 22.5° → không vong (đo lại)
  await page.locator("#mb-do").fill("22.5");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  await expect(kqMb.getByTestId("canh-bao-kiem-huong")).toContainText("không vong", { timeout: 15000 });

  // Tab 3c: Không rõ năm xây → không gửi năm, không lập bàn, không hiện "Vận 9"
  await page.locator("#mb-do").fill("180");
  await page.getByTestId("checkbox-khong-ro-nam-xay").check();
  const yeuCau = page.waitForRequest((r) => r.url().includes("/api/doanh-chu/mat-bang") && r.method() === "POST");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  const body = (await yeuCau).postDataJSON() as Record<string, unknown>;
  expect(body).not.toHaveProperty("nam_xay");
  await expect(kqMb.getByTestId("khong-ro-nam-xay")).toBeVisible({ timeout: 15000 });
  await expect(kqMb).not.toContainText("Vận 9");

  // Mở lại trang: hồ sơ cửa hàng được điền lại (không rõ năm xây vẫn tích)
  await page.reload();
  await page.getByTestId("tab-mat-bang").click();
  await expect(page.locator("#mb-do")).toHaveValue("180");
  await expect(page.getByTestId("checkbox-khong-ro-nam-xay")).toBeChecked();
});

test("Lịch 12 tháng có giờ sinh: gửi giờ, đọc thêm Bát tự hai cách; 'Xem trước năm sau' bắt đầu từ tháng 1", async ({ page }) => {
  await napHoSo(page, { ...CHU_DN, gio: "09:30" });
  await page.goto("/quan-ly-nhan-su");
  await page.getByTestId("tab-lich-12-thang").click();
  const namSau = new Date().getFullYear() + 1;
  await page.getByLabel("Khoảng xem", { exact: true }).selectOption("nam_sau");
  const yc = page.waitForRequest((r) => r.url().includes("/api/doanh-chu/lich-12-thang") && r.method() === "POST");
  await page.getByTestId("nut-xem-lich-12-thang").click();
  expect((await yc).postDataJSON()).toMatchObject({ gio: "09:30", nam_xem: namSau });
  const kq = page.getByTestId("ket-qua-lich-12-thang");
  await expect(kq).toContainText(`12 tháng kể từ T1/${namSau}`, { timeout: 15000 });
  await expect(kq.getByTestId("thieu-gio-lich-12")).toHaveCount(0);
  await expect(kq.getByTestId("hai-cach-lich-12")).toContainText("Cách 1");
  await expect(kq.getByTestId("thang-lich-12").first()).toContainText("Bát tự");
});

// QLNS-1 (2026-11-25): /ban-do-doi-ngu và /doanh-chu (cả link mời ?ma=) chuyển 308 MỘT bước về /quan-ly-nhan-su.
test("QLNS-1: URL cũ 308 một bước, giữ mã mời", async ({ request }) => {
  for (const [cu, moi] of [
    ["/ban-do-doi-ngu", "/quan-ly-nhan-su"],
    ["/doanh-chu", "/quan-ly-nhan-su"],
    ["/ban-do-doi-ngu/moi?ma=abc123", "/quan-ly-nhan-su/moi?ma=abc123"],
    ["/doanh-chu/moi?ma=abc123", "/quan-ly-nhan-su/moi?ma=abc123"],
  ] as const) {
    const r = await request.get(cu, { maxRedirects: 0 });
    expect(r.status(), cu).toBe(308);
    expect(new URL(r.headers()["location"]!, "http://x").pathname + new URL(r.headers()["location"]!, "http://x").search, cu).toBe(moi);
  }
  const html = await (await request.get("/quan-ly-nhan-su")).text();
  expect(html).toContain("Quản lý nhân sự theo ngũ hành");
  // Không nêu tên bài trắc nghiệm của tổ chức khác (Luật Quảng cáo).
  expect(html).not.toMatch(/DISC|MBTI/);
  // Kho tình huống đọc từ engine (không viết cứng ở web).
  expect(html).toContain("Câu mở lời:");
});

test("QLNS-1: kết quả mẫu có kế hoạch 30 ngày, tình huống của nhóm, câu hỏi 1-1, lối bước tiếp", async ({ page }) => {
  await page.goto("/quan-ly-nhan-su");
  await page.getByRole("button", { name: /Xem thử đội ngũ mẫu/ }).click();
  const kh = page.getByTestId("ke-hoach-30-ngay");
  await expect(kh).toBeVisible({ timeout: 20_000 });
  expect(await kh.locator("li").count()).toBeGreaterThanOrEqual(3);
  await expect(kh).toContainText("Tuần 1");
  await expect(kh).toContainText("Vì sao");
  const th = page.getByTestId("tinh-huong-nhom");
  await expect(th).toContainText("Câu mở lời mẫu");
  await expect(page.getByTestId("hoi-1-1")).toBeVisible();
  // "Bước tiếp" → mở tab Lịch 12 tháng
  await page.getByTestId("buoc-tiep").getByRole("button", { name: /Lịch 12 tháng/ }).click();
  await expect(page.getByTestId("tab-lich-12-thang")).toHaveAttribute("aria-selected", "true");
});

test("QLNS-1: người được mời xác nhận xong nhận bản 'Cách làm việc của bạn' + lối sang thần số và lập bản đồ nhóm mình", async ({ page, request }) => {
  const r = await request.post("/api/doanh-chu/moi", { data: { ten_nhom: "Nhóm thử" } });
  test.skip(!r.ok(), "môi trường thiếu bí mật ký link mời");
  const { ma_moi } = (await r.json()) as { ma_moi: string };
  await page.goto(`/quan-ly-nhan-su/moi?ma=${encodeURIComponent(ma_moi)}`);
  await page.getByPlaceholder(/VD: Minh, An/).fill("An");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Xác nhận & Tạo mã/ }).click();
  const cn = page.getByTestId("ban-ca-nhan");
  await expect(cn).toBeVisible({ timeout: 20_000 });
  await expect(cn).toContainText("Cách làm việc của bạn");
  await expect(cn).toContainText("Bạn làm tốt nhất khi");
  await expect(cn.getByRole("link", { name: /4 con số/ })).toHaveAttribute("href", "/than-so");
  await expect(cn.getByRole("link", { name: /Lập bản đồ cho nhóm/ })).toHaveAttribute("href", "/quan-ly-nhan-su");
});

// QLNS-2/3 (2026-11-25): hình minh hoạ có alt thật (PNG do route /og/quan-ly vẽ) + khối CTA cuối trang có link sang trang khác.
test("hình minh hoạ: 5 hình, alt đủ nghĩa, ảnh tải được là PNG 1200×630", async ({ page, request }) => {
  await page.goto("/quan-ly-nhan-su");
  const hinh = page.locator("figure[data-testid^='anh-ql-'] img");
  await expect(hinh).toHaveCount(5);
  const ds = await hinh.evaluateAll((xs) => xs.map((x) => ({ src: (x as HTMLImageElement).getAttribute("src")!, alt: (x as HTMLImageElement).alt })));
  for (const h of ds) {
    expect(h.alt.length, h.src).toBeGreaterThan(60);
    expect(h.alt.length, h.src).toBeLessThanOrEqual(300);
    const r = await request.get(h.src);
    expect(r.status(), h.src).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
    const b = await r.body();
    expect(b.readUInt32BE(16), `${h.src} rộng`).toBe(1200);
    expect(b.readUInt32BE(20), `${h.src} cao`).toBe(630);
  }
  // alt khớp chữ trong ảnh: ảnh năm hành nêu đủ tên năm hành, ảnh kế hoạch nêu bốn tuần
  const nam = ds.find((h) => h.src.includes("ngu-hanh"))!.alt;
  for (const t of ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]) expect(nam).toContain(t);
  expect(ds.find((h) => h.src.includes("ke-hoach"))!.alt).toContain("Tuần 1");
  expect((await request.get("/og/quan-ly?hinh=khong-co")).status()).toBe(404);
});

test("CTA cuối trang: lời mời chạy bản đồ + lưới lối đi tiếp sang các trang trụ, chữ link rõ nghĩa", async ({ page }) => {
  await page.goto("/quan-ly-nhan-su");
  const khoi = page.getByTestId("cta-cuoi-quan-ly");
  await expect(khoi.getByTestId("cta-chay-ban-do").getByRole("link", { name: /Chạy bản đồ cho nhóm của tôi/ })).toHaveAttribute("href", "#cong-cu-dieu-hanh");
  const the = khoi.locator("nav li[data-the-lap]");
  expect(await the.count()).toBeGreaterThanOrEqual(8);
  const hrefs = await the.locator("a").evaluateAll((xs) => xs.map((x) => (x as HTMLAnchorElement).getAttribute("href")!));
  for (const h of ["/bat-tu", "/than-so", "/hop-doi", "/thoi-gian-toi", "/xem-ngay-tot", "/phong-thuy", "/tu-vi", "/goi-xem"]) expect(hrefs).toContain(h);
  expect(hrefs.some((h) => /^\/nam\/\d{4}$/.test(h))).toBe(true);
  expect(new Set(hrefs).size).toBe(hrefs.length);                       // không link lặp
  for (const t of await the.locator("a").allInnerTexts()) expect(t.trim().length).toBeGreaterThan(12);   // không có chữ link kiểu "xem thêm"
  // Nút "Xem lịch 12 tháng" mở đúng tab + cuộn tới công cụ
  await khoi.getByRole("link", { name: /Xem lịch 12 tháng của cả đội/ }).click();
  await expect(page.getByTestId("tab-lich-12-thang")).toHaveAttribute("aria-selected", "true");
});

test("kho công khai: câu tình huống viết hoa đầu câu, không lặp chữ", async ({ page }) => {
  await page.goto("/quan-ly-nhan-su");
  const t = await page.locator("article h3").locator("xpath=following-sibling::p[1]").allInnerTexts();
  expect(t.length).toBeGreaterThanOrEqual(7);
  for (const s of t) {
    expect(s.trim()[0], s).toBe(s.trim()[0]!.toUpperCase());
    expect(s).not.toMatch(/\b((?:\p{L}+\s+){1,3}\p{L}+)\s+\1\b/iu);
  }
});
