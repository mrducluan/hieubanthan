// SAO-V (migration 0025, phần 4) — chuỗi ngày ghé trên /hom-nay. e2e không có Supabase: API báo tai_khoan=false và
// trang giữ chuỗi đếm trên máy (HN-1). Khách / đã đăng nhập giả lập bằng page.route("/api/sao/chuoi"). Điều kiện SQL thật
// (mốc, trần, giờ VN) kiểm ở supabase/kiem_thu/thu_sao_viral_0025.sql.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { CAU_BAT_DAU_LAI, loiChuoiMay, loiChuoiMayChu, loiMoiKhach } from "../lib/chuoi-ngay";

const TU_DOA = /sắp mất|mất chuỗi|đừng để|kẻo|tiếc|chỉ còn|nhanh lên|hết hạn/i;
const dd = (p: Partial<Record<string, unknown>>) => ({
  tai_khoan: true, dang_nhap: true, san_sang: true, ngay: "2026-10-25", chuoi: 3, dai_nhat: 3, moi: true,
  bat: true, moc: 7, sao_moc: 2, con_ngay: 4, sao: 0, ...p,
});
type SuKien = { su_kien: string; kind?: string; chuoi?: number; moi?: number; so_sao?: number };
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: SuKien[] }).__hbt_su_kien ?? []);

async function moHomNay(page: Page) {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
}

test("lời chuỗi: hàm thuần — mốc, dài nhất, bắt đầu lại, mời khách", () => {
  expect(loiChuoiMay(1, false).chinh).toContain("Ngày đầu tiên");
  expect(loiChuoiMay(1, true).chinh).toBe(CAU_BAT_DAU_LAI);
  expect(loiChuoiMay(4, false).chinh).toBe("Bạn ghé 4 ngày liên tiếp");
  const l = loiChuoiMayChu({ ngay: "2026-10-25", chuoi: 3, dai_nhat: 9, moi: true, bat: true, moc: 7, sao_moc: 2, con_ngay: 4, sao: 0 });
  expect(l).toMatchObject({ chinh: "Bạn ghé 3 ngày liên tiếp", dai_nhat: "dài nhất 9 ngày", moc: "Còn 4 ngày nữa tới mốc 7 ngày: +2 Sao", chuc_mung: null });
  const m = loiChuoiMayChu({ ngay: "2026-10-25", chuoi: 14, dai_nhat: 14, moi: true, bat: true, moc: 7, sao_moc: 2, con_ngay: 7, sao: 2 });
  expect(m.moc).toBe("Còn 7 ngày nữa tới mốc 21 ngày: +2 Sao");
  expect(m.chuc_mung).toContain("+2 Sao vào ví");
  // Công tắc tắt: không hứa Sao
  expect(loiChuoiMayChu({ ngay: "2026-10-25", chuoi: 3, dai_nhat: 3, moi: true, bat: false, moc: 7, sao_moc: 2, con_ngay: 4, sao: 0 }).moc).toBeNull();
  expect(loiMoiKhach({ bat: false, moc: 7, sao_moc: 2 })).toBe("Đăng nhập để giữ chuỗi trên mọi máy.");
  expect(loiMoiKhach({ bat: true, moc: 7, sao_moc: 2 })).toBe("Đăng nhập để giữ chuỗi trên mọi máy và nhận 2 Sao mỗi 7 ngày.");
});

test("chưa bật tài khoản: API báo tai_khoan=false, trang giữ chuỗi máy, không mời đăng nhập", async ({ page, request }) => {
  expect(await (await request.post("/api/sao/chuoi")).json()).toEqual({ tai_khoan: false });
  await moHomNay(page);
  const c = page.getByTestId("chuoi-ngay");
  await expect(c).toContainText("Ngày đầu tiên");
  await expect(c).toHaveAttribute("data-nguon", "may");
  await expect(page.getByTestId("chuoi-moi-dang-nhap")).toHaveCount(0);
});

test("khách, site bật tài khoản: chuỗi máy + mời đăng nhập (kèm Sao khi công tắc bật)", async ({ page }) => {
  await page.addInitScript(() => {
    const homQua = new Date(Date.now() + 7 * 3600_000 - 86_400_000).toISOString().slice(0, 10);
    localStorage.setItem("hbt.hom_nay", JSON.stringify({ ngay: homQua, chuoi: 2 }));
  });
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: { tai_khoan: true, dang_nhap: false, bat: true, moc: 7, sao_moc: 2 } }));
  await moHomNay(page);
  const c = page.getByTestId("chuoi-ngay");
  await expect(c).toHaveAttribute("data-nguon", "may");
  await expect(page.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 3 ngày liên tiếp");
  const moi = page.getByTestId("chuoi-moi-dang-nhap").getByRole("link");
  await expect(moi).toHaveText("Đăng nhập để giữ chuỗi trên mọi máy và nhận 2 Sao mỗi 7 ngày.");
  await expect(moi).toHaveAttribute("href", "/dang-nhap?tiep=%2Fhom-nay");
  await expect(page.getByTestId("chuoi-moc")).toHaveCount(0);
});

test("đã đăng nhập, chạm mốc: chuỗi máy chủ + dài nhất + '+2 Sao vào ví', đo credit_earned{kind:chuoi}", async ({ page }) => {
  let goi = 0;
  await page.route("**/api/sao/chuoi", (r) => {
    goi++;
    expect(r.request().method()).toBe("POST");
    return r.fulfill({ json: dd({ chuoi: 7, dai_nhat: 12, con_ngay: 7, sao: 2 }) });
  });
  await moHomNay(page);
  const c = page.getByTestId("chuoi-ngay");
  await expect(c).toHaveAttribute("data-nguon", "tai_khoan");
  await expect(page.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 7 ngày liên tiếp");
  await expect(page.getByTestId("chuoi-dai-nhat")).toContainText("dài nhất 12 ngày");
  await expect(page.getByTestId("chuoi-sao")).toContainText("+2 Sao vào ví");
  await expect(page.getByTestId("chuoi-moc")).toHaveText("Còn 7 ngày nữa tới mốc 14 ngày: +2 Sao");
  await expect(page.getByTestId("chuoi-moi-dang-nhap")).toHaveCount(0);
  const sk = await suKien(page);
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "credit_earned", kind: "chuoi", so_sao: 2 }));
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "chart_interacted", kind: "chuoi_ngay", chuoi: 7, moi: 1 }));
  expect(goi).toBe(1);
  // Mở lại cùng ngày: chart_interacted không đo lần hai
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 7, dai_nhat: 12, con_ngay: 7, moi: false, sao: 0 }) }));
  await page.reload();
  await expect(page.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 7 ngày liên tiếp");
  await expect(page.getByTestId("chuoi-sao")).toHaveCount(0);
  const sk2 = await suKien(page);
  expect(sk2.filter((e) => e.su_kien === "chart_interacted" && e.kind === "chuoi_ngay")).toHaveLength(0);
});

test("đã đăng nhập, mất chuỗi: câu trung tính, giữ kỷ lục, không từ doạ, không màu đỏ", async ({ page }) => {
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: dd({ chuoi: 1, dai_nhat: 9, con_ngay: 6 }) }));
  await moHomNay(page);
  const c = page.getByTestId("chuoi-ngay");
  await expect(page.getByTestId("chuoi-chinh")).toHaveText(CAU_BAT_DAU_LAI);
  await expect(page.getByTestId("chuoi-dai-nhat")).toContainText("dài nhất 9 ngày");
  await expect(page.getByTestId("chuoi-moc")).toHaveText("Còn 6 ngày nữa tới mốc 7 ngày: +2 Sao");
  expect(await c.innerText()).not.toMatch(TU_DOA);
  expect(await c.innerHTML()).not.toMatch(/cinnabar|red-/);
});

test("đã đăng nhập nhưng chưa chạy 0025 (san_sang=false) / lỗi mạng: im lặng, giữ chuỗi máy", async ({ page }) => {
  await page.route("**/api/sao/chuoi", (r) => r.fulfill({ json: { tai_khoan: true, dang_nhap: true, san_sang: false } }));
  await moHomNay(page);
  await expect(page.getByTestId("chuoi-ngay")).toHaveAttribute("data-nguon", "may");
  await expect(page.getByTestId("chuoi-chinh")).toContainText("Ngày đầu tiên");
  await page.route("**/api/sao/chuoi", (r) => r.abort());
  await page.reload();
  await expect(page.getByTestId("chuoi-ngay")).toHaveAttribute("data-nguon", "may");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
