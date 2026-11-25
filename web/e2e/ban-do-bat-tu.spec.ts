// BD-1 — "Bản đồ lá số" Bát tự: engine THẬT dựng nghĩa từng chữ + dòng thời gian; web chỉ vẽ. Kiểm: 8 ô, bảng nghĩa
// bốn lớp, nối sang ô khác, bốn cách xem, kể lại năm đã qua dùng chung câu trả lời với "Cách nào đúng với bạn?", nút đọc
// chương mở đúng chương báo cáo, điện thoại 360px không tràn ngang, sự kiện đo không mang năm.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import FX from "./fixtures/luan-giai-bat-tu.json";

const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: "ha-noi" };
const NHAN: Record<string, string> = { thuan: "Khá suôn sẻ", can_bang: "Bình thường", can_chu_dong: "Khá vất vả" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/battu/luan-giai", (r) => r.fulfill({ json: FX.bao_cao }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: FX.ty_le }));
  await napHoSo(page);
});

test("tám ô bấm được, bảng nghĩa bốn lớp, nối sang ô khác, Esc đóng", async ({ page, request }) => {
  const bd = await (await request.post("/api/battu/ban-do", { data: { la_so: LA_SO } })).json();
  expect(bd.phien_ban).toBe("ban_do_1");
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("ban-do-bat-tu");
  await expect(khoi.getByRole("heading", { level: 2 })).toHaveText("Bản đồ lá số của bạn");
  for (const ma of ["c0", "c1", "c2", "c3", "z0", "z1", "z2", "z3"]) await expect(khoi.getByTestId(`bd-o-${ma}`)).toBeVisible();
  await expect(khoi.getByTestId("bd-o-c2")).toContainText("chính bạn");

  const coNoi = (bd.o as { ma: string; noi_voi: { o: string }[]; la_gi: string[] }[]).find((o) => o.noi_voi.length)!;
  await khoi.getByTestId(`bd-o-${coNoi.ma}`).click();
  const bang = page.getByTestId("bd-bang-o");
  await expect(bang).toContainText(coNoi.la_gi[0]!);
  await expect(bang).toContainText("Nằm ở đâu trong đời bạn");
  await expect(bang).toContainText("Vì sao nói vậy");
  await bang.getByText("Nối với chữ khác").locator("..").getByRole("button").first().click();
  await expect(khoi.getByTestId(`bd-o-${coNoi.noi_voi[0]!.o}`)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(bang).toHaveCount(0);

  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(sk.some((x) => x.kind === "ban_do_o")).toBe(true);
});

test("bốn cách xem: người quanh bạn, năm hành có nhãn hai cách", async ({ page }) => {
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("ban-do-bat-tu");
  await khoi.getByTestId("bd-che-nguoi").click();
  await expect(khoi.getByTestId("bd-o-c2")).toContainText("chính bạn");
  await khoi.getByTestId("bd-che-hanh").click();
  await expect(khoi.getByText(/Màu ô theo hành/)).toBeVisible();
  await expect(khoi.getByText(/cách: nên|hai cách nói ngược/).first()).toBeVisible();
});

test("theo năm: kể lại một năm ở bản đồ → khối Cách nào đúng thấy ngay; sự kiện không mang năm", async ({ page, request }) => {
  const bd = await (await request.post("/api/battu/ban-do", { data: { la_so: LA_SO } })).json();
  const nam = (bd.thoi_gian.nam as { nam: number; ma?: string; dc?: string[] }[]).find((n) => n.ma && n.dc)!;
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("ban-do-bat-tu");
  await khoi.getByTestId("bd-che-nam").click();
  const truot = khoi.getByTestId("bd-nam-truot");
  await truot.fill(String(nam.nam));
  await expect(khoi.getByTestId("bd-the-nam")).toContainText(String(nam.nam));
  await khoi.getByTestId(`bd-tra-${nam.dc![0]}`).click();
  await expect(khoi.getByTestId("bd-hai-cach")).toContainText(NHAN[nam.dc![1]!]!);
  await expect(khoi.getByTestId("bd-ket-qua")).toContainText("Bạn đã kể 1/");
  // Cùng mã nam.YYYY → khối "Cách nào đúng" thấy câu đã trả lời (nếu năm ấy nằm trong danh sách của khối).
  const dc = await (await request.post("/api/battu/doi-chieu-cach", { data: { la_so: LA_SO } })).json();
  if ((dc.cau as { ma: string }[]).some((c) => c.ma === nam.ma)) {
    await expect(page.getByTestId("doi-chieu-cach").getByTestId("dc-da-tra-loi")).toHaveCount(1);
  }
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const e = sk.filter((x) => String(x.kind).startsWith("ban_do"));
  expect(e.length).toBeGreaterThan(0);
  expect(JSON.stringify(e)).not.toMatch(/19\d\d|20\d\d/);
});

test("nút đọc chương mở đúng chương trong báo cáo", async ({ page }) => {
  await page.goto("/bat-tu");
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible();
  const khoi = page.getByTestId("ban-do-bat-tu");
  await khoi.getByTestId("bd-o-c2").click();
  await page.getByTestId("bd-doc-chuong").click();
  await expect(page).toHaveURL(/#lg-tong_quan/);
});

test("điện thoại 360px: không tràn ngang, bảng nghĩa trượt từ đáy", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("ban-do-bat-tu");
  await expect(khoi).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(1);
  await khoi.getByTestId("bd-o-z2").click();
  const bang = page.getByTestId("bd-bang-o");
  await expect(bang).toBeVisible();
  const hop = await bang.boundingBox();
  expect(hop!.y + hop!.height).toBeGreaterThan(700);   // dính đáy màn hình
  await bang.getByRole("button", { name: "Đóng" }).click();
  await expect(bang).toHaveCount(0);
});
