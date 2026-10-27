// Đợt "khép vòng mời" (2026-10-27): thẻ chia sẻ huy hiệu (/og/huy-hieu, /the/huy-hieu/[mã], nút Chia sẻ trên huy hiệu đã
// đạt) · câu "Sao vừa về" + câu người nhận (hàm thuần) · trang ngoại tuyến của app đã cài (sw.js) · thông báo nhắc mở
// đúng khối trên Hôm nay (#neo, CuonToiNeo). Chuỗi thật (Supabase thu nhỏ) của "Sao vừa về" + câu người nhận:
// e2e-that/moi-ban-hoa-hong-that.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { loiNguoiNhan, loiThuongVe } from "../lib/loi-sao";
import { DANH_MUC, duongTheHuyHieu, maTuDuongHuyHieu, THE_HUY_HIEU, type MaHuyHieu } from "../lib/huy-hieu";

const TU_CAM = /trúng|thưởng|quay số|đếm ngược|sắp mất|đừng để|kẻo|nhanh lên|hơn \d+%|giỏi hơn/i;
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
const homNayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

test("hàm thuần: câu Sao vừa về (không nói bạn nào), câu người nhận theo mức đang áp dụng", () => {
  expect(loiThuongVe([{ loai: "moi_ban", so: 20 }])).toBe("+20 Sao — một người bạn vừa nhận lời mời của bạn.");
  expect(loiThuongVe([{ loai: "moi_ban", so: 20 }, { loai: "moi_ban", so: 20 }])).toBe("+40 Sao — 2 người bạn vừa nhận lời mời của bạn.");
  expect(loiThuongVe([{ loai: "moi_ban", so: 20 }, { loai: "hoa_hong", so: 5 }]))
    .toBe("+20 Sao — một người bạn vừa nhận lời mời của bạn. +5 Sao hoa hồng — bạn bè bạn mời vừa nạp Sao.");
  expect(loiThuongVe([])).toBe("");

  const m = { chaoMung: 10, duocMoi: 20, gia: 29 };
  expect(loiNguoiNhan({ ...m, coMa: true, thu: true }))
    .toBe("Bạn được mời: lưu hồ sơ vào tài khoản là nhận 30 Sao (10 chào mừng + 20 lời mời) — đủ mở một Luận giải toàn bộ.");
  expect(loiNguoiNhan({ ...m, coMa: false, thu: true })).toBe("Lưu hồ sơ vào tài khoản: nhận 10 Sao — để mở luận giải, hỏi thêm câu.");
  expect(loiNguoiNhan({ ...m, coMa: true, thu: false })).toBe("Bạn được mời: lưu hồ sơ vào tài khoản là nhận 30 Sao (10 chào mừng + 20 lời mời).");
  expect(loiNguoiNhan({ ...m, chaoMung: 0, coMa: true, thu: false })).toBe("Bạn được mời: lưu hồ sơ vào tài khoản là nhận 20 Sao.");
  expect(loiNguoiNhan({ ...m, chaoMung: 0, duocMoi: 0, coMa: true, thu: true })).toBe("");   // không thưởng → không hứa gì
});

test("danh mục thẻ huy hiệu: mọi huy hiệu có câu + lối thử trong site, đường dẫn hai chiều, lời không khoe / không thúc", () => {
  for (const ma of Object.keys(DANH_MUC) as MaHuyHieu[]) {
    const t = THE_HUY_HIEU[ma];
    expect(t.den, ma).toMatch(/^\/[a-z-]+$/);
    expect(`${t.cau} ${t.moi} ${t.nut}`, ma).not.toMatch(TU_CAM);
    expect(maTuDuongHuyHieu(duongTheHuyHieu(ma).split("/").pop()!)).toBe(ma);
  }
  expect(maTuDuongHuyHieu("khong-co")).toBeNull();
  expect(maTuDuongHuyHieu("__proto__")).toBeNull();
  expect(maTuDuongHuyHieu("constructor")).toBeNull();
});

test("ảnh /og/huy-hieu: ngang + dọc + mã lạ vẫn trả PNG", async ({ request }) => {
  for (const q of ["ma=chuoi_7", "ma=doc_5_mang&khung=doc&tu=hh.0123456789", "ma=khong_co", "ma=__proto__", ""]) {
    const r = await request.get(`/og/huy-hieu?${q}`);
    expect(r.status(), q).toBe(200);
    expect(r.headers()["content-type"], q).toContain("image/png");
  }
});

test("trang nhận thẻ huy hiệu: noindex, ảnh chia sẻ mang ?tu, lối thử mang ?tu; mã lạ → 404", async ({ page, request }) => {
  const html = await (await request.get("/the/huy-hieu/chuoi-7?tu=hh.0123456789")).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
  expect(html).toContain("/og/huy-hieu?ma=chuoi_7&amp;tu=hh.0123456789");
  // ?tu sai dạng không lọt vào ảnh / link
  const html2 = await (await request.get("/the/huy-hieu/chuoi-7?tu=%22%3E%3Cscript%3E")).text();
  expect(html2).not.toContain("<script>\"");
  expect(html2).toContain("/og/huy-hieu?ma=chuoi_7\"");
  expect((await request.get("/the/huy-hieu/khong-co")).status()).toBe(404);

  await page.goto("/the/huy-hieu/doc-5-mang?tu=hh.0123456789");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(DANH_MUC.doc_5_mang.ten);
  await expect(page.getByTestId("the-huy-hieu-moi")).toHaveAttribute("href", "/kham-pha?tu=hh.0123456789");
  await expect(page.getByTestId("the-huy-hieu")).toContainText("không mua bán");
  await expect(page.getByTestId("qua-nguoi-nhan")).toHaveCount(0);   // e2e thường: chưa bật tài khoản → không hứa Sao
  expect(await page.getByTestId("the-huy-hieu").innerText()).not.toMatch(TU_CAM);
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "share_clicked" && e.ma_moi === "hh.0123456789")).toBe(true);
});

test("Bản thân: huy hiệu đã đạt có nút Chia sẻ → link /the/huy-hieu/…?tu=hh.…, đo share_created; chưa đạt thì không có", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.addInitScript((ngay) => {
    (navigator as unknown as { share?: unknown }).share = undefined;
    localStorage.setItem("hbt.hom_nay", JSON.stringify({ ngay, chuoi: 8 }));
  }, homNayVn());
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 45_000 });
  await expect(hh.getByTestId("hh-chuoi_may_7")).toHaveAttribute("data-dat", "1");
  await expect(hh.getByTestId("chia-se-hh-doc_5_mang")).toHaveCount(0);
  await hh.getByTestId("chia-se-hh-chuoi_may_7").click();
  await expect(hh.getByTestId("chia-se-hh-chuoi_may_7")).toContainText("Đã chép link");
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  expect(chep).toContain("Ghé 7 ngày liền");
  const url = new URL(chep.slice(chep.indexOf("http")));
  expect(url.pathname).toBe("/the/huy-hieu/chuoi-may-7");
  const tu = url.searchParams.get("tu")!;
  expect(tu).toMatch(/^hh\.[0-9a-f]{10}$/);
  expect(url.searchParams.get("gt")).toBeNull();   // chưa đăng nhập → không mã mời
  for (const s of ["1990", "Luân", "17/5"]) expect(chep).not.toContain(s);   // thẻ không mang tên / ngày sinh
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "share_created", kind: "huy_hieu", ma_moi: tu, co_ma: false }));
  const tai = hh.getByTestId("tai-anh-hh-chuoi_may_7");
  await expect(tai).toHaveAttribute("href", `/og/huy-hieu?ma=chuoi_may_7&tu=${tu}&khung=doc`);
});

test("thông báo nhắc mở /hom-nay#nhac-hom-nay: khối vẽ sau khi tải vẫn được cuộn tới", async ({ page }) => {
  const homNay = homNayVn();
  await napHoSo(page);
  await page.addInitScript((n) => localStorage.setItem("hbt.nhac.v1", n), JSON.stringify([
    { id: `${homNay}|ung_ky.que_1`, ngay: homNay, ma: "ung_ky.que_1", mo_dun: "kinhdich", nhan: "Ứng kỳ quẻ Càn", duong: "/kinh-dich", tao_luc: "2026-10-21T00:00:00Z" }]));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/hom-nay?tu=push#nhac-hom-nay");
  const khoi = page.getByTestId("nhac-hom-nay");
  await expect(khoi).toBeVisible({ timeout: 45_000 });
  await expect.poll(async () => { const b = await khoi.boundingBox(); return b ? Math.round(b.y) : -1; }, { timeout: 10_000 })
    .toBeLessThan(260);   // đỉnh khối nằm trong màn đầu (dưới thanh đầu trang), không phải ở cuối trang
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "chart_interacted", kind: "push_mo" }));
});

test("app đã cài: đăng ký service worker; mất mạng → trang ngoại tuyến có thẻ hôm nay + mốc từ máy này; có mạng → Thử lại mở trang", async ({ page, context }) => {
  const homNay = homNayVn();
  await napHoSo(page);
  await page.addInitScript(() => {   // giả chế độ app (display-mode: standalone) cho DangKyApp
    const goc = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => (q.includes("display-mode: standalone") ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList) : goc(q));
  });
  await page.addInitScript((n) => localStorage.setItem("hbt.nhac.v1", n), JSON.stringify([
    { id: `${homNay}|ung_ky.que_1`, ngay: homNay, ma: "ung_ky.que_1", mo_dun: "kinhdich", nhan: "Ứng kỳ quẻ Càn", duong: "/kinh-dich", tao_luc: "2026-10-21T00:00:00Z" }]));
  await page.goto("/hom-nay?tu=app");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
  const so = (await page.getByTestId("so-ngay-ca-nhan").innerText()).trim();
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration("/"))?.active)), { timeout: 15_000 }).toBe(true);
  await page.reload();   // trang được service worker điều khiển từ lượt tải này
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15_000 }).toBe(true);
  // Tài nguyên thường vẫn đi mạng như cũ (không cache): /api trả bình thường khi có mạng.
  expect((await page.evaluate(async () => (await fetch("/api/sao/muc")).status))).toBeLessThan(500);

  await context.setOffline(true);
  await page.goto("/kham-pha").catch(() => null);
  const nt = page.getByTestId("ngoai-tuyen");
  await expect(nt).toBeVisible();
  await expect(nt).toContainText("Bạn đang ngoại tuyến");
  await expect(nt.locator("#so")).toHaveText(so);
  await expect(nt).toContainText("Ứng kỳ quẻ Càn");
  await expect(nt).toContainText("Hôm nay —");
  await context.setOffline(false);
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Bạn đang ngoại tuyến", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/kham-pha$/);
});

test("trình duyệt thường (không cài app): không đăng ký service worker", async ({ page }) => {
  await page.goto("/hom-nay");
  await page.waitForTimeout(1_500);
  expect(await page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration("/")))).toBe(false);
});
