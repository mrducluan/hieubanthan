// NT-1 "Lá số người thân" — tối đa 5 hồ sơ người thân CHỈ trên máy (localStorage `hbt.nguoi_than.v1`): lưu phải tự tích ô
// đồng ý (không tích sẵn) → xem lá số người đó trên /tu-vi (chỉ xem: không luận giải toàn bộ, không kiểm chứng, không định giờ,
// không 2 người) → điền sẵn "Xem lá số 2 người" → mời lưu người vừa xem → xoá từng người / tất cả → xoá hồ sơ (Dữ liệu của tôi)
// xoá luôn. Dữ liệu người thân chỉ đi tới route tính /api/tuvi/*, không tới Supabase, không vào sự kiện đo lường.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const KHOA = "hbt.nguoi_than.v1";
const docKho = (page: Page) => page.evaluate((k) => localStorage.getItem(k), KHOA);
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);

const ME = {
  id: "nt_me0001", ten_goi: "Mẹ", quan_he: "gia_dinh", lich_nhap: "duong", ngay: 12, thang: 8, nam: 1965,
  gio: "08:15", do_tin_gio: "exact", gioi_tinh: "nu", noi_sinh: "ha-noi", tao_luc: "2026-11-01T00:00:00Z",
};
async function moPhiHoa(page: Page) {
  const nut = page.getByTestId("phi-hoa").getByRole("button").first();
  if ((await nut.getAttribute("aria-expanded")) !== "true") await nut.click();
  await expect(page.getByTestId("phi-hoa")).toContainText("Xem cung trên lá số");
}
async function napKho(page: Page, ds: object[]) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KHOA, JSON.stringify({ v: 1, ds })] as const);
  await page.reload();
}

test("lưu cần tích đồng ý → xem lá số người thân (chỉ xem) → về lá số mình; dữ liệu không ra ngoài route tính", async ({ page }) => {
  const guiDi: { url: string; body: string }[] = [];
  page.on("request", (r) => guiDi.push({ url: r.url(), body: r.postData() ?? "" }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("Thổ Ngũ Cục");
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Bạn");
  await expect(page.getByRole("region", { name: "Luận giải toàn bộ" })).toBeAttached();
  // Lá số của chính mình: đường bay tứ hoá có nút "Đúng với mình".
  await moPhiHoa(page);
  await expect(page.getByTestId("phi-hoa").getByTestId("kiem-chung").first()).toBeVisible();

  await page.getByTestId("nguoi-than-mo").click();
  await page.getByTestId("nguoi-than-them").click();
  const form = page.getByTestId("nguoi-than-form");
  await form.getByLabel("Tên gọi / biệt danh (tuỳ chọn)").fill("Mẹ");
  await form.getByLabel("Quan hệ").selectOption("gia_dinh");
  await form.getByLabel("Ngày sinh người thân").fill("12");
  await form.getByLabel("Tháng sinh người thân").fill("8");
  await form.getByLabel("Năm sinh người thân").fill("1965");
  await form.getByLabel("Giờ sinh").fill("08:15");
  await form.getByLabel("Giới tính").selectOption("nu");
  await expect(form.getByLabel("Nơi sinh").locator("option", { hasText: "Hà Nội" })).toHaveCount(1);
  await form.getByLabel("Nơi sinh").selectOption("ha-noi");
  // Ô đồng ý không tích sẵn; bấm lưu khi chưa tích → chặn, không ghi gì xuống máy.
  await expect(form.getByTestId("nguoi-than-dong-y")).not.toBeChecked();
  await expect(form).toContainText("Chỉ lưu trên máy này, không gửi lên tài khoản. Xoá bất cứ lúc nào.");
  await form.getByTestId("nguoi-than-luu").click();
  await expect(form.getByRole("alert")).toContainText("tích ô đồng ý");
  expect(await docKho(page)).toBeNull();

  await form.getByTestId("nguoi-than-dong-y").check();
  await form.getByTestId("nguoi-than-luu").click();
  // Lưu xong → chuyển sang xem lá số người đó.
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Mẹ");
  await expect(page.getByTestId("nguoi-than-chi-xem")).toBeVisible();
  const kho = JSON.parse((await docKho(page))!);
  expect(kho.ds).toHaveLength(1);
  expect(kho.ds[0]).toMatchObject({ ten_goi: "Mẹ", quan_he: "gia_dinh", ngay: 12, thang: 8, nam: 1965, gio: "08:15", gioi_tinh: "nu", noi_sinh: "ha-noi" });
  expect(Object.keys(kho.ds[0]).sort()).toEqual(["do_tin_gio", "gio", "gioi_tinh", "id", "lich_nhap", "nam", "ngay", "noi_sinh", "quan_he", "tao_luc", "ten_goi", "thang"]);

  // Lá số an lại theo ngày sinh người thân; chỉ xem: không luận giải toàn bộ, không định giờ, không 2 người.
  await expect.poll(() => guiDi.some((g) => g.url.endsWith("/api/tuvi/la-so") && g.body.includes("1965-08-12"))).toBe(true);
  await expect(laSo).toBeVisible();
  await expect(page.getByRole("region", { name: "Luận giải toàn bộ" })).toHaveCount(0);
  await expect(page.getByTestId("dinh-gio")).toHaveCount(0);
  await expect(page.getByTestId("hop-tham")).toHaveCount(0);
  // Đường bay tứ hoá vẫn xem được nhưng không hỏi "Đúng với mình" (phiếu nói về lá số của người bấm).
  await moPhiHoa(page);
  await expect.poll(() => guiDi.some((g) => g.url.endsWith("/api/tuvi/phi-hoa") && g.body.includes("1965-08-12"))).toBe(true);
  await expect(page.getByTestId("kiem-chung")).toHaveCount(0);

  // Về lá số của mình → các khối trở lại.
  await page.getByTestId("nguoi-than-ve-ban").click();
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Bạn");
  await expect(page.getByTestId("hop-tham")).toBeVisible();
  await expect(page.getByRole("region", { name: "Luận giải toàn bộ" })).toBeAttached();

  // Đo lường: chỉ mã, không tên, không ngày sinh.
  const sk = (await suKien(page)).filter((e) => e.su_kien === "chart_interacted" && String(e.kind).startsWith("nguoi_than"));
  expect(sk.map((e) => e.kind)).toEqual(expect.arrayContaining(["nguoi_than_luu", "nguoi_than_xem"]));
  expect(JSON.stringify(sk)).not.toMatch(/Mẹ|1965|08:15/);
  // Ngày sinh người thân chỉ đi tới route tính của web (không Supabase, không đo lường, không nơi khác).
  const lo = guiDi.filter((g) => (g.body + g.url).includes("1965-08-12") || (g.body + g.url).includes("\"nam\":1965"));
  expect(lo.length).toBeGreaterThan(0);
  for (const g of lo) expect(new URL(g.url).pathname, g.url).toMatch(/^\/api\/tuvi\//);
  expect(guiDi.filter((g) => /supabase|\/rest\/v1\/|\/auth\/v1\//.test(g.url) && g.body.includes("1965"))).toHaveLength(0);
});

test("Xem lá số 2 người: chọn từ người thân đã lưu điền sẵn form; người mới → mời lưu (cần đồng ý)", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toContainText("Thổ Ngũ Cục");
  await napKho(page, [ME]);
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const f = page.getByTestId("hop-tham-form");
  await f.getByLabel("Chọn từ người thân đã lưu").selectOption({ label: "Mẹ · Gia đình" });
  await expect(f.getByLabel("Ngày sinh người ấy")).toHaveValue("12");
  await expect(f.getByLabel("Tháng sinh người ấy")).toHaveValue("8");
  await expect(f.getByLabel("Năm sinh người ấy")).toHaveValue("1965");
  await expect(f.getByLabel("Giới tính")).toHaveValue("nu");
  await expect(f.getByLabel("Giờ sinh")).toHaveValue("08:15");
  await expect(f.getByTestId("hop-tham-quan-he-gia_dinh")).toHaveAttribute("aria-pressed", "true");
  const yc = page.waitForRequest("**/api/tuvi/hop-tham");
  await f.getByRole("button", { name: "Xem độ hợp" }).click();
  expect((await yc).postDataJSON()).toMatchObject({ quan_he: "gia_dinh", nguoi_kia: { birth_date: "1965-08-12", birth_time: "08:15", gender: "nu", noi_sinh: "ha-noi" } });
  const kq = page.getByTestId("hop-tham-ket-qua");
  await expect(kq).toBeVisible();
  await expect(kq.getByTestId("hop-tham-luu-nguoi-than")).toHaveCount(0);   // đã lưu đúng người này → không mời lại

  // Người mới (chỉ ngày sinh) → mời lưu; chưa tích đồng ý thì chặn.
  await kq.getByRole("button", { name: "Xem với người khác" }).click();
  await f.getByTestId("hop-tham-quan-he-ban_be").click();
  await f.getByLabel("Ngày sinh người ấy").fill("3");
  await f.getByLabel("Tháng sinh người ấy").fill("4");
  await f.getByLabel("Năm sinh người ấy").fill("1995");
  await f.getByLabel("Giờ sinh").fill("");
  await f.getByLabel("Giới tính").selectOption("");
  await f.getByLabel("Nơi sinh").selectOption("");
  await f.getByRole("button", { name: "Xem độ hợp" }).click();
  await kq.getByTestId("hop-tham-luu-nguoi-than").click();
  const khung = kq.getByTestId("hop-tham-luu-khung");
  await khung.getByLabel("Tên gọi / biệt danh (tuỳ chọn)").fill("Lan");
  await expect(khung.getByTestId("nguoi-than-dong-y")).not.toBeChecked();
  await khung.getByTestId("nguoi-than-luu").click();
  await expect(khung.getByRole("alert")).toContainText("tích ô đồng ý");
  expect(JSON.parse((await docKho(page))!).ds).toHaveLength(1);
  await khung.getByTestId("nguoi-than-dong-y").check();
  await khung.getByTestId("nguoi-than-luu").click();
  await expect(khung.getByRole("status")).toContainText("Đã lưu trên máy này");
  const ds = JSON.parse((await docKho(page))!).ds;
  expect(ds).toHaveLength(2);
  expect(ds[1]).toMatchObject({ ten_goi: "Lan", quan_he: "ban_be", ngay: 3, thang: 4, nam: 1995 });
  expect(ds[1].gio).toBeUndefined();

  // Người thiếu giờ / giới tính / nơi sinh: có trong danh sách nhưng không mở lá số được.
  await page.getByTestId("nguoi-than-mo").click();
  const dong = page.getByTestId("nguoi-than-dong");
  await expect(dong).toHaveCount(2);
  await expect(dong.nth(1).getByTestId("nguoi-than-xem")).toBeDisabled();
  await expect(dong.nth(1)).toContainText("chỉ dùng để điền Xem lá số 2 người");
});

test("xoá từng người, xoá tất cả; tối đa 5 người", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const nam = (i: number) => ({ ...ME, id: `nt_nam${i}0000`, ten_goi: `Người ${i}`, nam: 1960 + i });
  await napKho(page, [1, 2, 3, 4, 5].map(nam));
  await page.getByTestId("nguoi-than-mo").click();
  const bang = page.getByTestId("nguoi-than-bang");
  await expect(bang.getByTestId("nguoi-than-dong")).toHaveCount(5);
  await expect(bang.getByTestId("nguoi-than-them")).toHaveCount(0);
  await expect(bang).toContainText("Đã đủ 5 người");
  // Đang xem người 2 rồi xoá chính người đó → về lá số của bạn.
  await bang.getByTestId("nguoi-than-xem").nth(1).click();
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Người 2");
  await page.getByTestId("nguoi-than-mo").click();
  await bang.getByRole("button", { name: "Xoá Người 2" }).click();
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Bạn");
  await expect(bang.getByTestId("nguoi-than-dong")).toHaveCount(4);
  expect(JSON.parse((await docKho(page))!).ds.map((x: { ten_goi: string }) => x.ten_goi)).toEqual(["Người 1", "Người 3", "Người 4", "Người 5"]);
  await bang.getByTestId("nguoi-than-xoa-tat-ca").click();
  await expect(bang.getByTestId("nguoi-than-dong")).toHaveCount(0);
  expect(await docKho(page)).toBeNull();
  const sk = (await suKien(page)).filter((e) => e.kind === "nguoi_than_xoa");
  expect(sk.length).toBeGreaterThanOrEqual(2);
});

test("Dữ liệu của tôi: liệt kê + xoá người thân; thu hồi đồng ý (xoá hồ sơ) xoá luôn người thân", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tai-khoan");
  await napKho(page, [ME]);
  const khoi = page.getByTestId("du-lieu-cua-toi");
  await expect(khoi.getByTestId("dl-nguoi-than")).toContainText("1 người trên máy này");
  await khoi.getByTestId("dl-nguoi-than-xoa").click();
  await expect(khoi.getByTestId("dl-nguoi-than")).toContainText("Không có");
  expect(await docKho(page)).toBeNull();

  await napKho(page, [ME]);
  await expect(khoi.getByTestId("dl-nguoi-than")).toContainText("1 người");
  await khoi.getByRole("button", { name: "Thu hồi" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Thu hồi" }).click();
  await expect(khoi.getByTestId("dl-nguoi-than")).toContainText("Không có");
  expect(await docKho(page)).toBeNull();

  await page.goto("/chinh-sach-rieng-tu");
  await expect(page.locator("main")).toContainText("Lá số người thân trên máy");
});

test("hỏi đáp Tử vi: đang xem lá số người thân → gửi cờ nguoi_than (engine đáp ngôi thứ ba); lá số mình thì không gửi", async ({ page }) => {
  const gui: Record<string, unknown>[] = [];
  await page.route("**/api/tuvi/hoi", (r) => {
    gui.push(r.request().postDataJSON() as Record<string, unknown>);
    return r.fulfill({ json: { cau_tra_loi: "Cung Mệnh của lá số này có Thiên Phủ.", che_do: "template" } });
  });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toContainText("Thổ Ngũ Cục");
  const hoi = async (cau: string) => {
    await page.getByRole("textbox", { name: /[Cc]âu hỏi/ }).first().fill(cau);
    await page.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect.poll(() => gui.length).toBeGreaterThan(0);
  };
  await hoi("Cung Mệnh của tôi nói gì?");
  expect(gui[0]).not.toHaveProperty("nguoi_than");
  gui.length = 0;
  await napKho(page, [ME]);
  await page.getByTestId("nguoi-than-mo").click();
  await page.getByTestId("nguoi-than-xem").first().click();
  await expect(page.getByTestId("nguoi-than-dang-xem")).toHaveText("Mẹ");
  await hoi("Cung Mệnh nói gì về tính cách?");
  expect(gui[0]).toMatchObject({ nguoi_than: true });
  expect(JSON.stringify(gui[0])).toContain("1965-08-12");
});

test("route /api/tuvi/hoi nhận nguoi_than (boolean), từ chối kiểu khác", async ({ request }) => {
  const ok = await request.post("/api/tuvi/hoi", { data: { cau_hoi: "Cung Mệnh là gì?", nguoi_than: true } });
  expect(ok.status()).not.toBe(422);
  const sai = await request.post("/api/tuvi/hoi", { data: { cau_hoi: "Cung Mệnh là gì?", nguoi_than: "co" } });
  expect(sai.status()).toBe(422);
});
