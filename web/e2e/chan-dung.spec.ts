// CD-1 — "Chân dung tổng hợp": ba cách nhìn (Tử vi · Bát tự · Nhân tướng) theo mảng đời. Engine thật (e2e khởi động
// FastAPI); hồ sơ + câu trả lời khảo sát chỉ ở localStorage.
import { test, expect } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

const TL = { khuon_mat: "vuong", tam_dinh: "can_doi", sac_tong: "sang_nhuan", cot_nhuc: "san_chac", tran: "cao_rong_day", long_may: "thanh_dai",
  an_duong: "rong_sang", mat_than: "dinh_sang", le_duong: "tham_quang", son_can: "nep_ngang", chuan_dau: "tron_day", canh_mui: "day_kin" };

test("chưa có giờ sinh → mời lập lá số; đủ hồ sơ + khảo sát → ma trận ba cách + báo cáo", async ({ page, request }) => {
  const html = await (await request.get("/chan-dung")).text();
  expect(html).toMatch(/<h1[^>]*>[^<]*Chân dung tổng hợp/);
  expect(html).toContain('"@type":"FAQPage"');
  await napHoSo(page, { ...HO_SO_MAU, gio: undefined, noi_sinh: undefined });
  await page.goto("/chan-dung");
  await expect(page.getByTestId("moi-lap-la-so")).toBeVisible();
  await expect(page.getByTestId("moi-lap-la-so")).toContainText("giờ sinh");
  // đủ lá số, chưa khảo sát → hai cách, cột Nhân tướng trống + mời
  await napHoSo(page);
  await page.goto("/chan-dung");
  const mt = page.getByTestId("ma-tran-ba-cach");
  await expect(mt).toBeVisible({ timeout: 30_000 });
  await expect(mt.locator("tbody tr")).toHaveCount(6);
  await expect(mt.getByTestId("mt-thieu-nhan-tuong")).toBeVisible();
  await expect(page.getByTestId("cd-trang-thai")).toContainText("hai lá số");
  // có khảo sát trên máy → ba cách
  await page.evaluate((tl) => localStorage.setItem("hbt.nhan_tuong.v1", JSON.stringify({ v: 1, tra_loi: tl, luc: new Date().toISOString() })), TL);
  await page.goto("/chan-dung");
  await expect(page.getByTestId("ma-tran-ba-cach")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("cd-trang-thai")).toContainText("12 nét");
  await expect(page.getByTestId("mt-thieu-nhan-tuong")).toHaveCount(0);
  await expect(page.getByTestId("mt-cong_viec").getByTestId("chip-muc")).toHaveCount(3);
  await expect(page.locator("main")).toContainText("Ba cách nhìn, một con người");
  // chương 1 có hộp tổng hợp; bấm dòng ma trận cuộn tới chương
  await page.getByTestId("mt-suc_khoe").click();
  await expect(page.locator("#lg-suc_khoe, #lg-tong_quan").first()).toBeAttached();
  // không điểm số
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/\d+\s*\/\s*100|điểm số/);
});

test("hub + sổ trang + sitemap + llms có /chan-dung", async ({ request }) => {
  const hub = await (await request.get("/huyen-hoc")).text();
  expect(hub).toContain('data-testid="khoi-chan-dung"');
  expect(hub).toContain('href="/chan-dung"');
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/chan-dung</loc>");
  expect(await (await request.get("/llms.txt")).text()).toContain("/chan-dung");
});
