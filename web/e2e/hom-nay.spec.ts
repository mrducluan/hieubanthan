// HN-1 — "Hôm nay của bạn": H1 có sẵn trong HTML máy chủ, thẻ hiện số engine tính, chuỗi ngày ghé đếm trên máy.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { capNhatChuoi } from "../app/hom-nay/HomNay";

test("chuỗi ngày ghé: cùng ngày giữ nguyên, hôm sau +1, cách quãng thì bắt đầu lại", () => {
  expect(capNhatChuoi(null, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 1 });
  expect(capNhatChuoi({ ngay: "2026-10-10", chuoi: 3 }, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 3 });
  expect(capNhatChuoi({ ngay: "2026-10-31", chuoi: 3 }, "2026-11-01")).toEqual({ ngay: "2026-11-01", chuoi: 4 });
  expect(capNhatChuoi({ ngay: "2026-10-08", chuoi: 9 }, "2026-10-10")).toEqual({ ngay: "2026-10-10", chuoi: 1 });
});

test("chưa có hồ sơ: H1 trong HTML máy chủ + mời nhập hồ sơ", async ({ page, request }) => {
  const html = await (await request.get("/hom-nay")).text();
  expect(html).toMatch(/<h1[^>]*>Hôm nay của bạn<\/h1>/);
  await page.goto("/hom-nay");
  await expect(page.getByRole("button", { name: "Xem hôm nay của tôi" })).toBeVisible();
});

test("có hồ sơ: thẻ khớp số engine, có câu tự soi, ngày mai, chuỗi ngày", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  const api = await (await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990 } })).json();
  await expect(page.getByTestId("so-ngay-ca-nhan")).toHaveText(String(api.ngay_ca_nhan.so));
  await expect(page.getByText(api.ngay_ca_nhan.tu_soi)).toBeVisible();
  await expect(page.getByText(`Ngày mai — Ngày cá nhân ${api.ngay_mai.so}:`)).toBeVisible();
  await expect(page.getByTestId("chuoi-ngay")).toContainText("Ngày đầu tiên");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; chuoi?: number }[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "daily_viewed" && e.chuoi === 1)).toBe(true);
  // Mở lại cùng ngày: chuỗi không tăng
  await page.reload();
  await expect(page.getByTestId("chuoi-ngay")).toContainText("Ngày đầu tiên");
});

test("API từ chối đầu vào lạ / ngày không tồn tại", async ({ request }) => {
  expect((await request.post("/api/thanso/hom-nay", { data: { ngay: 17, thang: 5, nam: 1990, ngay_xem: "2020-01-01" } })).status()).toBe(422);
  expect((await request.post("/api/thanso/hom-nay", { data: { ngay: 31, thang: 2, nam: 1990 } })).status()).toBe(422);
});

test("Bản thân có lối vào Hôm nay", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  await page.getByTestId("lien-ket-hom-nay").click();
  await expect(page).toHaveURL(/\/hom-nay$/);
});

test("HN-2: chọn ý định + gõ câu → engine trả nhịp, cách làm, câu tự soi; chỉ mã ý định được nhớ/đo", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const khoi = page.getByTestId("y-dinh");
  await expect(khoi.getByRole("heading", { name: "Hôm nay bạn định làm gì?" })).toBeVisible();
  await khoi.getByRole("button", { name: "Việc ở chỗ làm" }).click();
  await khoi.getByLabel("Dự định hôm nay").fill("tối nay đi tập gym với Nguyễn Văn B");
  await khoi.getByRole("button", { name: "Xem nhịp hôm nay" }).click();
  const kq = page.getByTestId("y-dinh-ket-qua");
  await expect(kq.locator("li")).toHaveCount(2);
  await expect(kq).toContainText("Tự soi:");
  await expect(page.getByText("Nguyễn Văn B")).toHaveCount(0);
  const luu = await page.evaluate(() => localStorage.getItem("hbt.hom_nay_y_dinh") ?? "");
  expect(luu).not.toContain("gym");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; y_dinh?: string; go_tay?: number }[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "daily_intent_set" && e.y_dinh === "cong_viec,van_dong" && e.go_tay === 1)).toBe(true);
  // Mở lại trong ngày: ý định đã chọn vẫn hiện kết quả
  await page.reload();
  await expect(page.getByTestId("y-dinh-ket-qua").locator("li")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Câu hỏi nổi bật hôm nay" })).toBeVisible();
  await expect(page.getByTestId("ngay-chaldea")).toContainText("Theo phái Chaldea");
});

test("HN-2: câu khủng hoảng → lời hỗ trợ, không luận ý định", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await page.getByLabel("Dự định hôm nay").fill("mình không muốn sống nữa");
  await page.getByRole("button", { name: "Xem nhịp hôm nay" }).click();
  await expect(page.getByTestId("ho-tro")).toContainText("115");
  await expect(page.getByTestId("y-dinh-ket-qua")).toHaveCount(0);
});

test("HN-4: câu gõ không nhận ra → chỉ đo mã nhóm cố định, không gửi câu", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await page.getByLabel("Dự định hôm nay").fill("sáng mai đi lễ chùa cùng chị Hoa");
  await page.getByRole("button", { name: "Xem nhịp hôm nay" }).click();
  await expect.poll(async () => page.evaluate(() =>
    ((window as unknown as { __hbt_su_kien?: { su_kien: string }[] }).__hbt_su_kien ?? []).filter((e) => e.su_kien === "daily_intent_set").length)).toBeGreaterThan(0);
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const e = sk.find((x) => x.su_kien === "daily_intent_set")!;
  expect(e.nhan_ra).toBe(0);
  expect(e.nhom_chua_ho_tro).toBe("le_bai");
  expect(JSON.stringify(sk)).not.toContain("Hoa");
});

test("Q7: hộp đã bấm 'Đúng với mình' 35 ngày trước → Hôm nay hỏi lại hai câu ba mức, gửi phiếu sau (chỉ mã), không hỏi lại lần hai", async ({ page }) => {
  await napHoSo(page);
  const ngay = new Date(Date.now() - 35 * 86_400_000).toISOString().slice(0, 10);
  await page.addInitScript((g) => localStorage.setItem("hbt.kc_sau.v1", g), JSON.stringify([
    { loai: "doi_song", mau: "ds.phongthuy.tung_phong.luu_y.xa_ngang", phai: "bat_trach_huyen_khong", nhan: "Giường, bàn dưới xà ngang", mo_dun: "phongthuy", ngay, da_hoi: false },
  ]));
  const goi: unknown[] = [];
  await page.route("**/api/kiem-chung/sau", async (route) => { goi.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true, da_luu: true } }); });
  await page.goto("/hom-nay");
  const h = page.getByTestId("hoi-sau-30");
  await expect(h).toContainText("35 ngày trước");
  await expect(h).toContainText("Giường, bàn dưới xà ngang");
  await h.getByRole("radio", { name: "Làm một phần" }).click();
  await h.getByRole("button", { name: "Dễ chịu hơn" }).click();
  await expect(h).toContainText("Cảm ơn bạn");
  expect(goi).toEqual([{ loai: "doi_song", mau: "ds.phongthuy.tung_phong.luu_y.xa_ngang", phai: "bat_trach_huyen_khong", da_lam: "mot_phan", thay_khac: "tot_hon", sau_ngay: 35 }]);
  await page.reload();
  await expect(page.getByTestId("hoi-sau-30")).toHaveCount(0);
});

test("KD-2c (P8) Quẻ ngày của riêng bạn: hai số tự chọn → quẻ Mai Hoa theo số khớp engine, nhớ trên máy theo ngày, link đọc kỹ điền sẵn hai số", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const q = page.getByTestId("que-rieng");
  await expect(q).toContainText("Quẻ ngày của riêng bạn");
  await q.getByLabel("Số thứ nhất của bạn").fill("7");
  await q.getByLabel("Số thứ hai của bạn").fill("12");
  const gioVN = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 19);
  await q.getByTestId("que-rieng-khoi").click();
  const kq = q.getByTestId("que-rieng-kq");
  await expect(kq).toBeVisible();
  const api = await (await request.post("/api/kinhdich/que-rieng", { data: { so: [7, 12], thoi_diem: gioVN } })).json();
  await expect(q.getByTestId("que-rieng-ten")).toHaveText(api.ten);
  await expect(kq).toContainText(`số 7 và 12, giờ ${api.dau_vao.chi_gio}`);
  await expect(q.getByTestId("que-rieng-doc-ky")).toHaveAttribute("href", "/kinh-dich?cach=mai_hoa_so&so=7,12");
  // nhớ trên máy: tải lại vẫn còn, không khởi lại
  await page.reload();
  await expect(page.getByTestId("que-rieng-ten")).toHaveText(api.ten);
  const luu = await page.evaluate(() => localStorage.getItem("hbt.que_rieng.v1") ?? "");
  expect(luu).toContain('"so":[7,12]');
  // API từ chối số 0 / thiếu số
  expect((await request.post("/api/kinhdich/que-rieng", { data: { so: [0, 12] } })).status()).toBe(422);
  expect((await request.post("/api/kinhdich/que-rieng", { data: { so: [7] } })).status()).toBe(422);
});
