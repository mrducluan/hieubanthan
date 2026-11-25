// HG-1 — "Hỏi gì xem nấy" trên /phong-thuy: sáu câu hỏi và câu trả lời đều do engine dựng (engine thật trong e2e);
// thẻ chỉ vẽ. Kiểm: không lộ tên nội bộ, thiếu gì mời đúng thứ đó, trả lời có / không ghi vào hồ sơ nhà trên máy mà
// KHÔNG tự viết năm xây, sơ đồ chín ô của năm, bảng tám hướng hai người, 360px không tràn, đo lường không mang số độ.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const MA = ["cua_chinh", "bo_cuc", "gia_dinh", "han_nam", "so_sanh", "mo_quan"] as const;
const NOI_BO = /_giu_can_ho|hbt\.nha|\.py|\/api\/|veto/i;

type SuKien = Record<string, unknown>;
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: SuKien[] }).__hbt_su_kien ?? []);
const hoSoNha = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null") as Record<string, unknown> & {
  bo_cuc?: { dau_hieu?: string[]; khai_khong?: string[] };
} | null);
const napNha = (page: Page, nha: object) =>
  page.addInitScript((n) => localStorage.setItem("hbt.nha.v1", n), JSON.stringify({ v: 1, cap_nhat_luc: "2026-11-22T00:00:00Z", ...nha }));

async function chon(page: Page, ma: (typeof MA)[number]) {
  await page.getByTestId(`hoi-gi-cau-${ma}`).click();
  const kq = page.getByTestId("hoi-gi-ket-qua");
  await expect(kq).toHaveAttribute("data-ma", ma);
  await expect(kq.getByTestId("hoi-gi-tra-loi")).toBeVisible();
  return kq;
}

test("Sáu câu hỏi lấy từ engine; cả thẻ không lộ tên nội bộ ở câu nào", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const the = page.getByTestId("hoi-gi-xem-nay");
  await expect(the).toBeVisible();
  await expect(the).toHaveAttribute("id", "hoi-gi");
  for (const ma of MA) {
    const nut = page.getByTestId(`hoi-gi-cau-${ma}`);
    await expect(nut).toBeVisible();
    await expect(nut).toHaveAttribute("aria-pressed", "false");
  }
  await expect(page.getByTestId("hoi-gi-cau-cua_chinh")).toContainText("Cửa chính");
  // Chưa chọn câu nào: chưa có khung kết quả (thẻ gọn, không đẩy form hồ sơ xuống).
  await expect(page.getByTestId("hoi-gi-ket-qua")).toHaveCount(0);

  for (const ma of MA) {
    const kq = await chon(page, ma);
    await expect(page.getByTestId(`hoi-gi-cau-${ma}`)).toHaveAttribute("aria-pressed", "true");
    await kq.getByTestId("hoi-gi-vi-sao").locator("summary").click();
    expect(await the.innerText()).not.toMatch(NOI_BO);
  }
  // Chỉ câu kết quả nằm trong vùng đọc tự động.
  expect(await the.locator("[aria-live]").count()).toBe(1);
  await expect(the.locator("[aria-live]")).toContainText(await the.getByTestId("hoi-gi-tra-loi").innerText());
  expect(await the.locator('[role="radio"]').count()).toBe(0);
});

test("Cửa chính: chưa có gì → hai lời mời đúng thứ thiếu; chỉ một #do-huong trên trang", async ({ page }) => {
  await page.goto("/phong-thuy");
  const kq = await chon(page, "cua_chinh");
  await expect(kq).toHaveAttribute("data-rieng", "0");
  await expect(kq.getByTestId("hoi-gi-thieu-huong")).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-thieu-sinh")).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-muc")).toHaveCount(0);
  expect(await page.locator("#do-huong").count()).toBe(1);

  await kq.getByTestId("hoi-gi-thieu-huong").click();
  await expect(page.locator("#do-huong")).toBeInViewport();
});

test("Cửa chính: có hướng 183,2° + hồ sơ → câu trả lời riêng (Nam), có mức; Hỏi tiếp điền sẵn khung hỏi đáp", async ({ page }) => {
  await napHoSo(page);
  await napNha(page, { huong_do: 183.2 });
  await page.goto("/phong-thuy");
  const kq = await chon(page, "cua_chinh");
  await expect(kq).toHaveAttribute("data-rieng", "1");
  await expect(kq.getByTestId("hoi-gi-tra-loi")).toContainText("Nam");
  await expect(kq.getByTestId("hoi-gi-muc")).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-thieu")).toHaveCount(0);

  const seo = await page.evaluate(() => {
    const html = document.body.innerHTML.toLowerCase();
    const nhanh = html.indexOf("trả lời nhanh"), hoi = html.indexOf("hoi-gi-xem-nay");
    return { h1: document.querySelectorAll("h1").length, nhanhTruoc: nhanh !== -1 && hoi !== -1 && nhanh < hoi };
  });
  expect(seo.h1).toBe(1);
  expect(seo.nhanhTruoc).toBe(true);

  await kq.getByTestId("hoi-gi-hoi-tiep").click();
  await expect(page.locator("#hoi-phong-thuy textarea")).toHaveValue(/Cửa chính nhà tôi/);

  // Không viết thêm gì vào hồ sơ nhà (đặc biệt: không năm xây), đo lường chỉ mã — không số độ.
  const nha = await hoSoNha(page);
  expect(nha?.nam_xay).toBeUndefined();
  expect(nha?.huong_do).toBe(183.2);
  const sk = (await suKien(page)).filter((e) => String(e.kind ?? "").startsWith("hoi_gi"));
  expect(sk.some((e) => e.kind === "hoi_gi_chon" && e.ma === "cua_chinh" && e.rieng === 1)).toBe(true);
  expect(JSON.stringify(sk)).not.toMatch(/183|do_huong/);
});

test("Bố cục: trả lời bốn câu có / không → kết quả đổi, hồ sơ nhà có mã, KHÔNG có năm xây", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const kq = await chon(page, "bo_cuc");
  const hang = kq.getByTestId("hoi-gi-hoi-nhanh").locator("li");
  await expect(hang).toHaveCount(4);
  await expect(kq).toHaveAttribute("data-rieng", "0");

  await kq.getByTestId("hoi-gi-hn-duong_dam").getByRole("button", { name: "Có", exact: true }).click();
  for (const ma of ["wc_giua_nha", "cua_thong_ban_cong", "xa_ngang"]) {
    await kq.getByTestId(`hoi-gi-hn-${ma}`).getByRole("button", { name: "Không", exact: true }).click();
  }
  await expect(kq).toHaveAttribute("data-rieng", "1");
  await expect(kq.getByTestId("hoi-gi-tra-loi")).toContainText("Đường đâm thẳng");
  await expect(kq.getByTestId("hoi-gi-diem")).toContainText("Nên xử lý trước");
  await expect(kq.getByTestId("hoi-gi-diem").getByRole("link", { name: /Đọc kỹ/ })).toHaveAttribute("href", /\/phong-thuy\/dau-hieu\//);
  await expect(kq.getByTestId("hoi-gi-hn-duong_dam").getByRole("button", { name: "Có", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(kq.getByTestId("hoi-gi-hn-xa_ngang").getByRole("button", { name: "Không", exact: true })).toHaveAttribute("aria-pressed", "true");

  const nha = await hoSoNha(page);
  expect(nha?.bo_cuc?.dau_hieu).toEqual(["duong_dam"]);
  expect([...(nha?.bo_cuc?.khai_khong ?? [])].sort()).toEqual(["cua_thong_ban_cong", "wc_giua_nha", "xa_ngang"]);
  expect(nha?.nam_xay).toBeUndefined();
  expect(nha?.huong_do).toBeUndefined();

  // Đổi ý: "Không" cho đường đâm → không còn điểm nào nên xử lý trước.
  await kq.getByTestId("hoi-gi-hn-duong_dam").getByRole("button", { name: "Không", exact: true }).click();
  await expect(kq.getByTestId("hoi-gi-diem")).toHaveCount(0);
  expect((await hoSoNha(page))?.bo_cuc?.dau_hieu).toEqual([]);

  const sk = (await suKien(page)).filter((e) => e.kind === "hoi_gi_tra_loi_nhanh");
  expect(sk.length).toBe(5);
  expect(sk[0]).toMatchObject({ ma: "duong_dam", co: 1 });
});

test("Năm nay: sơ đồ chín ô, có phía được đánh dấu; lối đi là link trong site", async ({ page }) => {
  await page.goto("/phong-thuy");
  const kq = await chon(page, "han_nam");
  const luoi = kq.getByTestId("hoi-gi-luoi-nam");
  await expect(luoi.getByTestId("hoi-gi-o-nam")).toHaveCount(9);
  expect(await luoi.locator('[data-testid="hoi-gi-o-nam"][data-nhan="1"]').count()).toBeGreaterThan(0);
  await expect(luoi.getByRole("img")).toHaveAttribute("aria-label", /Bắc ở trên/);
  // Ô đầu hàng trên là Tây Bắc, giữa hàng trên là Bắc (Bắc ở trên, Đông bên phải).
  await expect(luoi.getByTestId("hoi-gi-o-nam").nth(1)).toContainText(/Bắc/);
  await expect(kq.getByTestId("hoi-gi-lien-ket").getByRole("link").first()).toHaveAttribute("href", /^\/phong-thuy\/huong-xau-nam\/\d{4}$/);
});

test("Gia đình: nhập năm sinh + giới tính người ở cùng → bảng tám hướng; không lưu người đó", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const kq = await chon(page, "gia_dinh");
  const form = kq.getByTestId("hoi-gi-nguoi-2");
  await expect(form).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-hai-nguoi")).toHaveCount(0);

  // Thiếu giới tính → báo ngay cạnh ô, chưa gọi.
  await form.getByTestId("hoi-gi-n2-nam-sinh").fill("1992");
  await form.getByTestId("hoi-gi-n2-xem").click();
  await expect(form.getByRole("alert")).toBeVisible();

  await form.getByTestId("hoi-gi-n2-nu").click();
  await form.getByTestId("hoi-gi-n2-xem").click();
  const bang = kq.getByTestId("hoi-gi-hai-nguoi");
  await expect(bang.locator("tbody tr")).toHaveCount(8);
  await expect(bang.locator("tbody tr").first()).toContainText(/hợp|kém hơn/);
  await expect(kq).toHaveAttribute("data-rieng", "1");
  expect(await hoSoNha(page)).toBeNull();
});

test("Điện thoại 360px + giảm chuyển động: không tràn ngang, sáu nút vẫn bấm được", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 780 });
  await napHoSo(page);
  await napNha(page, { huong_do: 183.2 });
  await page.goto("/phong-thuy");
  await expect(page.getByTestId("hoi-gi-xem-nay")).toBeVisible();
  for (const ma of ["cua_chinh", "bo_cuc", "gia_dinh", "han_nam"] as const) {
    await chon(page, ma);
    const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(tran, `tràn ngang ở câu ${ma}`).toBeLessThanOrEqual(0);
  }
  const hop = await page.getByTestId("hoi-gi-cau-mo_quan").boundingBox();
  expect(hop?.height ?? 0).toBeGreaterThanOrEqual(36);
});

test("Bản tiếng Anh /en/feng-shui: tiêu đề câu hỏi tiếng Anh, không có lối tới khối máy đọc ảnh", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/en/feng-shui");
  const the = page.getByTestId("hoi-gi-xem-nay");
  await expect(the).toContainText("What do you want to check about this home?");
  await expect(page.getByTestId("hoi-gi-cau-cua_chinh")).toContainText("Does my main door direction suit me?");
  const kq = await chon(page, "bo_cuc");
  await expect(kq.getByTestId("hoi-gi-hn-duong_dam").getByRole("button", { name: "Yes", exact: true })).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-neo-khao-sat-nha")).toBeVisible();
  await expect(kq.getByTestId("hoi-gi-neo-doc-anh-nha")).toHaveCount(0);
  expect(await the.innerText()).not.toMatch(NOI_BO);
  expect(await the.innerText()).not.toMatch(/[ăâđêôơưĂÂĐÊÔƠƯ]/);
});

test("Huyền Không: bật / tắt lớp số và 'Xem từng lớp' chỉ đổi cách hiện số engine đã trả", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await napHoSo(page);
  await napNha(page, { nam_xay: 2024, toa: "Tý" });                       // PT-NHA: đủ năm + toạ → tự lập, không bấm
  await page.goto("/phong-thuy");
  const hk = page.locator("#huyen-khong");
  const ban = hk.getByTestId("ban-huyen-khong");
  await expect(ban.getByRole("cell").first()).toHaveAttribute("aria-label", /lưu niên \d/);

  // Giảm chuyển động: bấm vẫn có phản hồi (hiện đủ ngay) và vẫn ghi đo lường.
  await hk.getByTestId("hk-khoi-ban").click();
  await expect(hk.getByTestId("hk-lop-trang-thai")).toHaveText(/đủ bốn lớp/);
  expect((await suKien(page)).some((e) => e.kind === "huyen_khong_khoi_ban")).toBe(true);

  // Tắt lớp sao năm → nhãn đọc màn hình của ô không còn nêu lớp đang ẩn.
  await hk.getByTestId("hk-lop-ln").uncheck();
  await expect(ban.getByRole("cell").first()).not.toHaveAttribute("aria-label", /lưu niên/);
  await expect(ban.getByRole("cell").first()).toHaveAttribute("aria-label", /sơn tinh \d, hướng tinh \d, vận tinh \d$/);
  await hk.getByTestId("hk-lop-ln").check();
  await expect(ban.getByRole("cell").first()).toHaveAttribute("aria-label", /lưu niên \d/);
});
