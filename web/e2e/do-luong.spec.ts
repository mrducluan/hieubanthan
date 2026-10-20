// UI-6: funnel Phase 1/2 bắn đủ sự kiện, và KHÔNG có dữ liệu cá nhân trong thuộc tính.
// Ở dev, lib/do-luong.ts đẩy sự kiện vào window.__hbt_su_kien (PostHog tắt khi không có key).
import { test, expect, type Page } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";
import { tinhGate, MAU_TOI_THIEU } from "../lib/so-lieu-ngoai";

type SK = { su_kien: string } & Record<string, unknown>;
const suKien = (p: Page) => p.evaluate(() => ((window as unknown as { __hbt_su_kien?: SK[] }).__hbt_su_kien ?? []));
const KHOA_CHO_PHEP = new Set(["su_kien", "feature_version", "mo_dun", "kind", "ma_moi", "so_duong_doi", "huu_ich", "ket_qua", "nguon", "quan_he", "loai"]);
const dem = (ds: SK[], ten: string, mo_dun?: string) => ds.filter((e) => e.su_kien === ten && (!mo_dun || e.mo_dun === mo_dun)).length;

test("funnel Phase 1: landing → bắt đầu → hồ sơ → đọc xong → góp ý → hỏi; không lộ dữ liệu cá nhân", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  // Lần đầu mở /ban-than, máy chủ dev phải biên dịch trang (có lúc > 15 giây khi vừa khởi động) → chờ lâu hơn ở bước này.
  await expect(page.getByTestId("so-duong-doi")).toHaveText("6", { timeout: 60_000 });
  await page.getByRole("heading", { name: "Giai đoạn này của bạn" }).scrollIntoViewIfNeeded();
  await page.getByTestId("gop-y").getByRole("button", { name: "Có, khá trúng" }).click();
  await expect(page.getByText("Cảm ơn bạn")).toBeVisible();

  const ds = await suKien(page);
  const ten = ds.map((e) => e.su_kien);
  // landing_viewed ở trang trước khi điều hướng client-side vẫn nằm trong cùng window.
  for (const k of ["landing_viewed", "reading_started", "profile_created", "reading_completed", "feedback_submitted"]) {
    expect(ten).toContain(k);
  }
  expect(ds.find((e) => e.su_kien === "reading_completed")?.so_duong_doi).toBe(33);
  // Gate 1: bắt đầu/xong gắn mảng, mỗi phiên một lần; landing ghi nhóm trang đầu tiên.
  expect(dem(ds, "reading_started", "thanso")).toBe(1);
  expect(dem(ds, "reading_completed", "thanso")).toBe(1);
  expect(ds.find((e) => e.su_kien === "landing_viewed")?.nguon).toBe("trang_chu");
  expect(ds.find((e) => e.su_kien === "feedback_submitted")).toMatchObject({ huu_ich: "co", mo_dun: "thanso" });
  for (const e of ds) {
    for (const k of Object.keys(e)) expect(KHOA_CHO_PHEP.has(k), `khoá lạ: ${k}`).toBe(true);
    expect(JSON.stringify(e)).not.toMatch(/1988|Luân|Nguyễn|24\/10/);
  }

  await page.goto("/than-so");
  await hoi(page, "Điểm mạnh cốt lõi của tôi là gì?");
  await expect(page.getByTestId("cau-tra-loi").last()).toContainText("Mặt tối");
  const ds2 = await suKien(page);
  expect(ds2.map((e) => e.su_kien)).toEqual(expect.arrayContaining(["advisor_question_started", "advisor_question_completed"]));
  expect(JSON.stringify(ds2)).not.toContain("Điểm mạnh");
});

test("Gate 1 ở mảng Tử vi: bắt đầu khi lá số hiện, đọc xong khi cuộn tới cuối bài, góp ý gắn mảng; tải lại không đếm lại", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("la-so-tu-vi")).toBeVisible();
  await expect.poll(async () => dem(await suKien(page), "reading_started", "tuvi")).toBe(1);
  expect(dem(await suKien(page), "reading_completed", "tuvi")).toBe(0);
  await page.getByTestId("doc-xong-tuvi").scrollIntoViewIfNeeded();
  // Đọc xong cần: thấy mốc cuối + đã cuộn + ở lại ≥ 10 giây (không đếm khi vừa mở đã thấy cuối trang).
  await page.waitForTimeout(3_000);
  expect(dem(await suKien(page), "reading_completed", "tuvi")).toBe(0);
  await expect.poll(async () => dem(await suKien(page), "reading_completed", "tuvi"), { timeout: 20_000 }).toBe(1);
  await page.getByTestId("gop-y").getByRole("button", { name: "Một phần" }).click();
  expect((await suKien(page)).find((e) => e.su_kien === "feedback_submitted")).toMatchObject({ huu_ich: "vua", mo_dun: "tuvi" });
  await page.reload();
  await expect(page.getByTestId("la-so-tu-vi")).toBeVisible();
  await page.getByTestId("doc-xong-tuvi").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const ds = await suKien(page);
  expect(dem(ds, "reading_started")).toBe(0);      // cùng phiên → không đếm lại (tỉ lệ đọc hết không vượt 100%)
  expect(dem(ds, "reading_completed")).toBe(0);
  expect(dem(ds, "landing_viewed")).toBe(0);
});

test("Gate 2 — link Hôm nay mang mã: người gửi share_created, bạn bè mở link → share_clicked → hồ sơ đầu tiên = referral_signup", async ({ page, browser }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Chia sẻ" }).click();
  const tao = (await suKien(page)).find((e) => e.su_kien === "share_created");
  expect(tao).toMatchObject({ kind: "hom_nay" });
  const ma = String(tao?.ma_moi);
  expect(ma).toMatch(/^hn\.[a-f0-9]{10}$/);
  // NHIP-1: link được chép sau khi máy chủ ký thẻ ngày (có ảnh) → chờ clipboard.
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(`/hom-nay?tu=${ma}`);

  const ban = await (await browser.newContext({ baseURL: test.info().project.use.baseURL })).newPage();
  await ban.goto(`/hom-nay?tu=${ma}`);
  await ban.getByLabel("Họ và tên đầy đủ").fill("Trần Thị Bạn");
  await ban.getByLabel("Ngày", { exact: true }).fill("2");
  await ban.getByLabel("Tháng", { exact: true }).fill("3");
  await ban.getByLabel("Năm", { exact: true }).fill("1995");
  await ban.getByRole("button", { name: "Xem hôm nay của tôi" }).click();
  await expect(ban.getByTestId("the-hom-nay")).toBeVisible();
  const ds = await suKien(ban);
  expect(ds.find((e) => e.su_kien === "share_clicked")).toMatchObject({ kind: "hn", ma_moi: ma });
  expect(ds.find((e) => e.su_kien === "referral_signup")).toMatchObject({ ma_moi: ma });
  expect(dem(ds, "reading_started", "hom_nay")).toBe(1);
});

test("tinhGate: tỉ lệ + ngưỡng, chưa đủ mẫu thì không kết luận", () => {
  const it = tinhGate({ landing: 900, bat_dau: 200, xong: 120, gop_y: 50, co_giup: 35, ho_so: 30, chia_se: 12, dang_ky_moi: 3 });
  expect(it.map((g) => g.dat)).toEqual([null, null, null, null, null]);
  expect(it[0]).toMatchObject({ ma: "G1", tu: 120, mau: 200, ti_le: 0.6 });
  const du = tinhGate({ landing: 2000, bat_dau: MAU_TOI_THIEU, xong: 120, gop_y: 50, co_giup: 35, ho_so: 30, chia_se: 12, dang_ky_moi: 1 });
  expect(Object.fromEntries(du.map((g) => [g.ma, g.dat]))).toEqual({ G1: false, G4: true, LUU: true, G2: true, G3: false });
  // Tài khoản chưa bật → "lưu hồ sơ vào tài khoản" không đo được → chờ số, không báo "chưa đạt" sai.
  expect(tinhGate({ landing: 2000, bat_dau: 400, xong: 200, gop_y: 0, co_giup: 0, ho_so: 0, chia_se: 0, dang_ky_moi: 0 }, { taiKhoanBat: false })
    .find((g) => g.ma === "LUU")).toMatchObject({ ti_le: null, dat: null });
  expect(tinhGate({ landing: 0, bat_dau: 400, xong: 0, gop_y: 0, co_giup: 0, ho_so: 0, chia_se: 0, dang_ky_moi: 0 })[1]!.ti_le).toBeNull();
});
