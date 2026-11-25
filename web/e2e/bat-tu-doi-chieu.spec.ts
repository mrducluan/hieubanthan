// BT-DC — "Cách nào đúng với bạn?" (Bát tự): engine THẬT dựng câu hỏi nhìn lại năm đã qua + mức của hai cách; người
// dùng kể từng năm → lật ra mỗi cách đã nói gì → kết luận + chọn cách chính → báo cáo hiện "Theo cách bạn chọn" ở chỗ
// hai cách khác nhau. Câu trả lời chỉ ở localStorage; PostHog chỉ nhận số câu khớp + mã cách cục.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import FX from "./fixtures/luan-giai-bat-tu.json";

const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: HO_SO_MAU.noi_sinh };

test("kể lại các năm đã qua trên Bản đồ theo đúng cách 2 → kết luận cách 2, chọn làm cách chính, báo cáo nhấn theo cách đó", async ({ page, request }) => {
  // BD-1: khối "Cách nào đúng" gộp vào Bản đồ lá số — năm đã qua có câu hỏi ở chế độ kéo năm, mức hai cách do engine chấm.
  const bd = await (await request.post("/api/battu/ban-do", { data: { la_so: LA_SO } })).json();
  const nam = (bd.thoi_gian.nam as { nam: number; ma?: string; dc?: string[] }[]).filter((n) => n.ma && n.dc).slice(0, 4);
  expect(nam.length).toBeGreaterThanOrEqual(3);

  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/battu/luan-giai", (r) => r.fulfill({ json: FX.bao_cao }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: FX.ty_le }));
  await napHoSo(page);
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("ban-do-bat-tu");
  await expect(khoi.getByTestId("bd-cach_1")).toContainText(bd.thoi_gian.cach.cach_1.ten);
  await expect(page.getByTestId("doi-chieu-cach")).toHaveCount(0);   // không còn khối trùng

  for (const [i, n] of nam.entries()) {
    await khoi.getByTestId("bd-nam-truot").fill(String(n.nam));
    await expect(khoi.getByTestId("bd-the-nam")).toContainText(String(n.nam));
    await khoi.getByTestId(`bd-tra-${n.dc![1]}`).click();
    await expect(khoi.getByTestId("bd-ket-qua")).toContainText(`Bạn đã kể ${i + 1}/`);
  }
  await expect(khoi.getByTestId("bd-ket-luan")).toContainText(bd.thoi_gian.ket_luan.cach_2);
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const e = sk.filter((x) => x.kind === "ban_do_tra_loi");
  expect(e.length).toBe(nam.length);
  expect(JSON.stringify(e)).not.toMatch(/19\d\d|20\d\d/);          // không gửi năm

  await khoi.getByRole("button", { name: /làm cách chính/ }).click();
  await expect(khoi.getByTestId("bd-cach_2")).toContainText("cách chính của bạn");
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible();
  const khac = FX.bao_cao.thoi_gian_bieu.filter((m) => m.hai_cach_khac);
  expect(khac.length).toBeGreaterThan(0);
  await expect(page.getByTestId("dong-thoi-gian").getByTestId("muc-cach-chinh")).toHaveCount(khac.length);

  // Tải lại: câu trả lời + cách chính còn nguyên (lưu trên máy)
  await page.reload();
  await expect(page.getByTestId("ban-do-bat-tu").getByTestId("bd-ket-luan")).toBeVisible();
  await expect(page.getByTestId("ban-do-bat-tu").getByTestId("bd-cach_2")).toContainText("cách chính của bạn");
});

test("không nhớ rõ thì không tính; người còn ít năm đã qua thấy lời giải thích thay cho câu hỏi", async ({ request }) => {
  const r = await (await request.post("/api/battu/doi-chieu-cach", {
    data: { la_so: { birth_date: "2015-03-01", birth_time: "09:00", gender: "nu", noi_sinh: "ha-noi" } },
  })).json();
  expect(r.co_cau_hoi).toBe(false);
  expect(r.ly_do).toBe("it_nam_qua");
  expect(r.loi_ly_do).toBeTruthy();
  expect((await request.post("/api/battu/doi-chieu-cach", { data: { la_so: LA_SO, them: 1 } })).status()).toBe(422);
});
