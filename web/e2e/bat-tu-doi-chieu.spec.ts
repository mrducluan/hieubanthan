// BT-DC — "Cách nào đúng với bạn?" (Bát tự): engine THẬT dựng câu hỏi nhìn lại năm đã qua + mức của hai cách; người
// dùng kể từng năm → lật ra mỗi cách đã nói gì → kết luận + chọn cách chính → báo cáo hiện "Theo cách bạn chọn" ở chỗ
// hai cách khác nhau. Câu trả lời chỉ ở localStorage; PostHog chỉ nhận số câu khớp + mã cách cục.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import FX from "./fixtures/luan-giai-bat-tu.json";

type Cau = { ma: string; cach_1: string; cach_2: string };
const NHAN: Record<string, string> = { thuan: "Khá suôn sẻ", can_bang: "Bình thường", can_chu_dong: "Khá vất vả" };
const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: HO_SO_MAU.noi_sinh };

test("kể lại các năm đã qua theo đúng cách 2 → kết luận cách 2, chọn làm cách chính, báo cáo nhấn theo cách đó", async ({ page, request }) => {
  const dc = await (await request.post("/api/battu/doi-chieu-cach", { data: { la_so: LA_SO } })).json();
  expect(dc.co_cau_hoi).toBe(true);
  expect(dc.chon).toBeNull();
  const cau = dc.cau as Cau[];
  expect(cau.length).toBeGreaterThanOrEqual(3);

  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/battu/luan-giai", (r) => r.fulfill({ json: FX.bao_cao }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: FX.ty_le }));
  await napHoSo(page);
  await page.goto("/bat-tu");
  const khoi = page.getByTestId("doi-chieu-cach");
  await expect(khoi.getByRole("heading", { level: 2 })).toHaveText("Cách nào đúng với bạn?");
  await expect(khoi.getByTestId("dc-cach_1")).toContainText(dc.cach.cach_1.ten);

  for (const [i, c] of cau.entries()) {
    await expect(khoi.getByTestId("dc-cau")).toContainText(dc.cau[i].hoi);
    await khoi.getByTestId("dc-cau").getByRole("button", { name: NHAN[c.cach_2]! }).click();
    await expect(khoi.getByTestId("dc-da-tra-loi")).toHaveCount(i + 1);
  }
  await expect(khoi.getByTestId("dc-cau")).toHaveCount(0);
  const kl = khoi.getByTestId("dc-ket-luan");
  await expect(kl).toContainText(dc.ket_luan.cach_2);
  await expect(kl).toContainText(`${dc.cach.cach_2.ten} ${cau.length}/${cau.length}`);
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const e = sk.find((x) => x.kind === "battu_doi_chieu")!;
  expect(e).toMatchObject({ ket_qua: "cach_2", cach_cuc: dc.cach_cuc, khop_2: cau.length, so_cau: cau.length });
  expect(JSON.stringify(e)).not.toMatch(/19\d\d|20\d\d/);          // không gửi năm

  await kl.getByRole("button", { name: /làm cách chính/ }).click();
  await expect(khoi.getByTestId("dc-cach_2")).toContainText("cách chính của bạn");
  // Báo cáo: dải thời gian hiện mức theo cách bạn chọn ở những giai đoạn hai cách khác nhau
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const khac = FX.bao_cao.thoi_gian_bieu.filter((m) => m.hai_cach_khac);
  expect(khac.length).toBeGreaterThan(0);
  await expect(page.getByTestId("dong-thoi-gian").getByTestId("muc-cach-chinh")).toHaveCount(khac.length);

  // Tải lại: câu trả lời + cách chính còn nguyên (lưu trên máy)
  await page.reload();
  await expect(page.getByTestId("doi-chieu-cach").getByTestId("dc-ket-luan")).toBeVisible();
  await expect(page.getByTestId("doi-chieu-cach").getByTestId("dc-cach_2")).toContainText("cách chính của bạn");
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
