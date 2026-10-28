// TS-V3 — tổng hợp 2 phái, hai cách tính con số Đường đời, góp ý đúng/chưa đúng (tầng HỌC). Engine thật. Qabalah đã bỏ.
// Ca Nguyễn Đức Luân 24/10/1988: Pitago DD 6 (rút gọn con số — mặc định) / 33 (cộng hết chữ số); số 6 gặp ở 5 nguồn
// tính độc lập (đường đời hai phái gộp làm một nguồn).
import { test, expect } from "@playwright/test";
import { napHoSo, hoi } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("hai cách tính con số Đường đời: mặc định rút gọn con số, báo lệch, đổi cách → số và luận giải đổi theo, nhớ lựa chọn", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await expect(page.getByTestId("the-duong_doi").getByTestId("gia-tri")).toHaveText("6");
  // Khung cách xem thu gọn mặc định: một dòng "đang xem" + báo cách còn lại ra số khác; bấm cả hàng "Cách xem" (nút "Đổi") mới mở.
  await expect(page.getByTestId("dang-xem")).toContainText("Đang xem theo Pitago · số đường đời rút gọn con số · cách còn lại ra số 33");
  await expect(page.getByRole("tab", { name: "Rút gọn con số" })).toHaveCount(0);
  await page.getByTestId("truong-phai-than-so-mo").click();
  await expect(page.getByRole("tab", { name: "Rút gọn con số" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("goi-y-duong-doi")).toContainText("6 (rút gọn con số) và 33 (cộng hết chữ số). Bài đọc đang dùng số 6.");
  await page.getByRole("tab", { name: "Cộng hết chữ số" }).click();
  await expect(page.getByTestId("the-duong_doi").getByTestId("gia-tri")).toHaveText("33");
  // Hỏi đáp đi theo cách đã chọn.
  const ans = await hoi(page, "Số chủ đạo của tôi nói gì?");
  await expect(ans).toContainText("số chủ đạo (đường đời) 33");
  await page.reload();
  await expect(page.getByTestId("the-duong_doi").getByTestId("gia-tri")).toHaveText("33");
  await page.getByTestId("truong-phai-than-so-mo").click();
  await page.getByRole("tab", { name: "Rút gọn con số" }).click();
  await expect(page.getByTestId("the-duong_doi").getByTestId("gia-tri")).toHaveText("6");
  await expect(page.getByRole("tab", { name: "Qabalah" })).toHaveCount(0);
});

test("tổng hợp 2 phái: số lặp lại + đồ thị liên phái", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await page.getByTestId("truong-phai-than-so-mo").click();
  await page.getByRole("tab", { name: "Tổng hợp 2 phái" }).click();
  const bai = page.getByTestId("bai-tong-hop");
  await expect(bai.getByTestId("noi-bat-6")).toContainText("5 nguồn tính độc lập");
  await expect(bai.getByTestId("tuong-tac-linh_hon")).toContainText("Cộng hưởng");
  await expect(bai.getByTestId("tuong-tac-ten_day_du")).toContainText("Các góc nhìn");
  await expect(bai.getByTestId("tuong-tac-duong_doi")).toHaveCount(0);
  await expect(bai).toContainText("cùng là một phép cộng chữ số ngày sinh");
  const ans = await hoi(page, "Điểm mạnh cốt lõi của tôi là gì?");
  await expect(ans).toContainText("Điểm chung giữa các phái");
});

test("góp ý chưa đúng: ghi chú chỉ gửi khi tự tích đồng ý; câu khủng hoảng không hỏi góp ý", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  const gui: Record<string, unknown>[] = [];
  page.on("request", (r) => { if (r.url().endsWith("/api/thanso/phan-hoi")) gui.push(r.postDataJSON() as Record<string, unknown>); });
  const ans = await hoi(page, "Tôi hợp nghề gì?");
  await ans.getByRole("button", { name: "Chưa đúng" }).click();
  await ans.getByLabel("Chưa đúng ở đâu?").fill("Tôi thích làm một mình hơn");
  await ans.getByRole("button", { name: "Gửi góp ý" }).click();          // chưa tích đồng ý
  await expect(ans.getByTestId("gop-y-xong")).toBeVisible();
  await expect.poll(() => gui.length).toBe(1);
  expect(gui[0]).toMatchObject({ dung: false, phai: "pitago", nguon: "hoi_dap", linh_vuc: "su_nghiep" });
  expect(gui[0]).not.toHaveProperty("ghi_chu");

  const ans2 = await hoi(page, "Điểm mạnh cốt lõi của tôi là gì?");
  await ans2.getByRole("button", { name: "Chưa đúng" }).click();
  await ans2.getByLabel("Chưa đúng ở đâu?").fill("Chưa giống tôi lắm");
  await ans2.getByLabel(/Đồng ý dùng ghi chú/).check();
  await ans2.getByRole("button", { name: "Gửi góp ý" }).click();
  await expect.poll(() => gui.length).toBe(2);
  expect(gui[1]).toMatchObject({ ghi_chu: "Chưa giống tôi lắm", dong_y: true });

  const khung = await hoi(page, "Tôi không muốn sống nữa");
  await expect(khung.getByTestId("gop-y-cau")).toHaveCount(0);
  // PostHog chỉ nhận mã — không câu chữ, tên, ngày sinh.
  const suKien = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string }[] }).__hbt_su_kien ?? []);
  for (const e of suKien.filter((x) => x.su_kien === "feedback_submitted")) expect(JSON.stringify(e)).not.toMatch(/Luân|1988|giống/);
});

test("API góp ý: chưa bật Supabase → ok, không lưu; đầu vào lạ bị chặn", async ({ request }) => {
  const r = await request.post("/api/thanso/phan-hoi", { data: { ho_ten: ["Nguyễn Đức Luân"], ngay: 24, thang: 10, nam: 1988,
    phai: "pitago", nguon: "hoi_dap", dung: true } });
  expect(r.ok()).toBeTruthy();
  expect(await r.json()).toMatchObject({ ok: true, luu: false });
  const sai = await request.post("/api/thanso/phan-hoi", { data: { ho_ten: ["A"], ngay: 1, thang: 1, nam: 2000, phai: "vedic", nguon: "hoi_dap", dung: true } });
  expect(sai.status()).toBe(422);
});

test("route ngữ cảnh không mở công khai (tránh lách hạn mức hỏi đáp)", async ({ request }) => {
  const r = await request.post("/api/thanso/ngu-canh", { data: { ho_ten: ["A"], ngay: 1, thang: 1, nam: 2000, cau_hoi: "Tôi hợp nghề gì?" } });
  expect(r.status()).toBe(404);
});
