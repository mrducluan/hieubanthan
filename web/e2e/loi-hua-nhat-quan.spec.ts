// Rà UX trục 3 — "lời hứa nhất quán, không ngõ cụt": lỗi tới người dùng là câu thường (không tên biến môi trường, không
// lời lập trình viên), bấm Chia sẻ luôn có phản hồi, lời cookie thống kê nói thật, bảng pháp lý không tràn ngang trên điện
// thoại, nút trong "Dữ liệu của tôi" đủ lớn để chạm. Trang /nap-sao, /hoi-vien, /hoi-chuyen-gia kiểm ở spec riêng của chúng.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { trangThaiCookie } from "../lib/dong-y";
import { LOI_TAO_LINK, traLoiChiaSe } from "../lib/loi-chia-se";

/** Mọi tệp route.ts dưới app/api — trừ nhóm chỉ máy gọi máy / chỉ quản trị (CMS, cron, quản trị, webhook cổng). */
function cacRoute(thuMuc = join(__dirname, "../app/api")): string[] {
  return readdirSync(thuMuc).flatMap((t) => {
    const p = join(thuMuc, t);
    if (statSync(p).isDirectory()) return /^(quan-tri|cron|cms|so-trang|webhook)$/.test(t) ? [] : cacRoute(p);
    return t === "route.ts" ? [p] : [];
  });
}

test("thuần: lỗi ký link → câu người dùng, mã 502; tên biến môi trường chỉ vào log", async () => {
  const goc = console.error;
  const log: string[] = [];
  console.error = (...a: unknown[]) => { log.push(a.join(" ")); };
  try {
    const r = traLoiChiaSe(new Error("Thiếu LOI_MOI_SECRET (≥16 ký tự) — không tạo được link chia sẻ."), "thu");
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ error: LOI_TAO_LINK });
    expect(LOI_TAO_LINK).toBe("Chưa tạo được link lúc này, bạn thử lại sau nhé.");
    expect(log.join("\n")).toContain("LOI_MOI_SECRET");
  } finally {
    console.error = goc;
  }
});

test("quét mã: không route người dùng gọi nào trả lỗi chứa tên biến môi trường hay lời lập trình viên", () => {
  const ds = cacRoute();
  expect(ds.length).toBeGreaterThan(40);
  const sai: string[] = [];
  for (const p of ds) {
    const s = readFileSync(p, "utf8");
    // Chuỗi trong { error: "…" } / { error: `…` } / { loi: "…" } trả ra trình duyệt.
    for (const m of s.matchAll(/\b(?:error|loi)\s*:\s*(["'`])((?:(?!\1).)*)\1/g)) {
      const chu = m[2] ?? "";
      if (/\b[A-Z][A-Z0-9]*_[A-Z0-9_]{2,}\b/.test(chu) || /\b(migration|schema|engine|env|RPC|stack)\b/i.test(chu)) sai.push(`${p.split("/app/api/")[1]}: ${chu}`);
    }
    // Không trả thẳng e.message của lỗi ký mã (từng lộ "Thiếu LOI_MOI_SECRET").
    if (/includes\("LOI_MOI_SECRET"\)/.test(s)) sai.push(`${p.split("/app/api/")[1]}: trả e.message lỗi ký mã`);
  }
  expect(sai, sai.join("\n")).toEqual([]);
});

test("thuần: lời cookie thống kê nói thật theo lựa chọn và chế độ hỏi đồng ý", () => {
  expect(trangThaiCookie(null, false)).toEqual({ bat: true, chu: "Đang bật (bạn chưa chọn)" });
  expect(trangThaiCookie(null, true)).toEqual({ bat: false, chu: "Đang tắt (bạn chưa chọn)" });
  expect(trangThaiCookie("tu_choi", false)).toEqual({ bat: false, chu: "Đang tắt (bạn đã tắt)" });
  expect(trangThaiCookie("dong_y", true)).toEqual({ bat: true, chu: "Đang bật (bạn đã đồng ý)" });
});

test("Hôm nay: máy không có Web Share và không cho chép → vẫn có phản hồi, hiện link để chép tay", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("NotAllowedError")) }, configurable: true });
  });
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  await page.getByRole("button", { name: "Chia sẻ", exact: true }).click();
  const chep = page.getByTestId("chep-tay");
  await expect(chep).toContainText("Máy chưa cho chép tự động");
  await expect(chep.getByRole("textbox", { name: "Link chia sẻ" })).toHaveValue(/\/hom-nay\?tu=hn\.[a-f0-9]{10}/);
});

test("Tài khoản → Dữ liệu của tôi: cookie 'Đang bật (bạn chưa chọn) · Tắt' → bấm Tắt thành 'Đang tắt'; nút có viền, cao ≥ 44px; câu 'trừ cookie thống kê'", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));   // chưa chọn (storageState mặc định đã "từ chối")
  await page.goto("/tai-khoan");
  const dong = page.getByTestId("dl-cookie");
  await expect(dong).toContainText("Đang bật (bạn chưa chọn)");
  await expect(dong).not.toContainText("Chưa chọn — đang bật theo mặc định");
  await dong.getByTestId("dl-cookie-tat").click();
  await expect(dong).toContainText("Đang tắt (bạn đã tắt)");
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong-y-cookie.v1"))).toBe("tu_choi");
  await expect(dong.getByTestId("dl-cookie-bat")).toBeVisible();

  const khoi = page.getByTestId("du-lieu-cua-toi");
  for (const ten of ["Thu hồi", "Tuỳ chọn cookie", "Bật"]) {
    const nut = khoi.getByRole("button", { name: ten, exact: true });
    const hop = await nut.boundingBox();
    expect(hop?.height ?? 0, ten).toBeGreaterThanOrEqual(44);
    expect(await nut.evaluate((e) => getComputedStyle(e).borderTopWidth), ten).not.toBe("0px");
  }
  await expect(page.locator('section[aria-labelledby="rieng-tu"]')).toContainText("Mặc định mọi thứ nằm trên máy của bạn (trừ cookie thống kê).");
});

test.describe("điện thoại 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("chính sách: mọi bảng thành thẻ dọc, không tràn ngang; ô mang nhãn cột; chữ giữ nguyên", async ({ page }) => {
    await page.goto("/chinh-sach-rieng-tu#dong-y");
    const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(tran).toBeLessThanOrEqual(0);
    const bang = page.locator("table.bang-the");
    expect(await bang.count()).toBeGreaterThanOrEqual(4);
    for (const b of await bang.all()) {
      const r = await b.evaluate((e) => ({ rong: e.scrollWidth, khung: (e.parentElement as HTMLElement).clientWidth, hien: getComputedStyle(e.querySelector("tbody tr")!).display }));
      expect(r.rong).toBeLessThanOrEqual(r.khung);
      expect(r.hien).toBe("block");
    }
    const dongY = page.locator("#dong-y table.bang-the");
    await expect(dongY.locator("td[data-nhan='Bạn đồng ý bằng cách']").first()).toContainText("Đồng ý và xem kết quả");
    // Nhãn cột hiện bằng CSS trước nội dung ô (không lặp chữ trong HTML).
    const nhan = await dongY.locator("td").nth(1).evaluate((e) => getComputedStyle(e, "::before").content);
    expect(nhan).toContain("Bạn đồng ý bằng cách");
  });
});

test("máy tính: bảng chính sách vẫn là bảng thường", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu#dong-y");
  const b = page.locator("#dong-y table.bang-the");
  expect(await b.locator("tbody tr").first().evaluate((e) => getComputedStyle(e).display)).toBe("table-row");
  await expect(b.locator("thead")).toBeVisible();
});

test("Tài khoản: dịch vụ chưa mở (e2e không Supabase) → không có lối vào Hỏi chuyên gia / Hội viên", async ({ page }) => {
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("du-lieu-cua-toi")).toBeVisible();
  await expect(page.getByTestId("tk-dich-vu")).toHaveCount(0);
  await expect(page.locator('main a[href="/hoi-chuyen-gia"], main a[href="/hoi-vien"]')).toHaveCount(0);
});
