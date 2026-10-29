// Kinh Dịch (HH-1 + KD-ĐS): gieo tay để kết quả tất định; không cần hồ sơ. Lời đọc hai tầng: đời thường hiện ngay,
// lời kinh / ba cách đọc / bản theo sách gập lại.
import { test, expect } from "@playwright/test";
import { hoi } from "./_hoso";

test("gieo tay: quẻ Lý biến Đoài — lời đời thường trước, bản theo sách gập", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq).toBeVisible();
  await expect(ans).toContainText("Về việc thăng tiến, phỏng vấn, đề bạt");         // chủ đề nhận từ câu hỏi
  await expect(dq.getByTestId("chip-muc").first()).toBeVisible();
  await expect(dq.getByTestId("hop-noi-bat").first()).toBeVisible();
  await expect(dq.getByTestId("hanh-dong")).toBeVisible();
  await expect(dq.getByTestId("cau-tu-soi")).toBeVisible();
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Nghĩa Lý");
  // lớp đời thường (trước khi mở phần học thuật) không có giọng AI / từ doạ
  const van = (await dq.innerText()).toLowerCase();
  for (const cam of ["hành trình", "vũ trụ", "chắc chắn", "định mệnh", "đại hung", "tai hoạ"]) expect(van).not.toContain(cam);
  // tầng học thuật gập: chưa mở thì không thấy lời kinh
  await expect(ans).not.toContainText("Quẻ bản: Lý");
  await dq.getByRole("button", { name: /Lời kinh nguyên văn/ }).click();
  await expect(dq.getByTestId("loi-kinh")).toContainText("Thượng Cửu");
  await dq.getByRole("button", { name: /Ba cách đọc cùng một quẻ/ }).click();
  await expect(dq.getByTestId("goc-nhin")).toContainText("Lục Hào (dụng thần)");
  await dq.getByRole("button", { name: /Bản đọc đầy đủ theo sách/ }).click();
  await expect(dq.getByTestId("ban-day-du")).toContainText("Quẻ bản: Lý");
  await expect(dq.getByTestId("ban-day-du")).toContainText("Quẻ biến (xu hướng chuyển tới): Đoài");
  await expect(dq.getByTestId("ban-day-du")).toContainText("Hiểu đơn giản: như làm việc với sếp khó tính");
});

test("HỌC-ĐS: hộp đọc quẻ có nút kiểm chứng — chỉ mã ds.kinhdich.* + cách đọc chính đi lên", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Tôi có nên chuyển việc sang công ty mới không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq).toBeVisible();
  const kc = dq.getByTestId("kiem-chung");
  expect(await kc.count()).toBeGreaterThan(0);
  await kc.first().getByRole("button", { name: "Chưa đúng" }).click();
  const sk = await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: ({ su_kien: string } & Record<string, unknown>)[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "tuvi_kiem_chung"));
  expect(sk).toHaveLength(1);
  expect(sk[0]!.mau).toMatch(/^ds\.kinhdich\.[a-z_]+\.[a-z_]+\.q\d{1,2}\.[a-z_]+$/);
  expect(["nghia_ly", "mai_hoa", "luc_hao"]).toContain(sk[0]!.phai);
});

test("máy gieo: nghi thức lật xu hiện trước (chưa lộ quẻ); bỏ qua → quẻ, lời đời thường và câu hỏi tiếp", async ({ page }) => {
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Hợp đồng này có ký được không?");
  await expect(ans.getByTestId("gieo-dong-xu")).toBeVisible();
  await expect(ans.getByTestId("que")).toHaveCount(0);                      // chưa lật xong thì chưa thấy quẻ / lời
  await ans.getByTestId("bo-qua-gieo").click();
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Lục Hào");
  await expect(ans).toContainText("Về việc giấy tờ, hợp đồng, visa, chờ tin");
  await expect(ans.getByTestId("cau-lien-quan").getByRole("button").first()).toBeVisible();
  const dq = ans.getByTestId("doc-que");
  await dq.getByRole("button", { name: /Bản đọc đầy đủ theo sách/ }).click();
  await expect(dq.getByTestId("ban-day-du")).toContainText("dụng thần Phụ Mẫu");
});

test("không hào động: lời chủ là quái từ, kèm Thoán truyện dịch nghĩa", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 7 7 7 7");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const dq = ans.getByTestId("doc-que");
  await dq.getByRole("button", { name: /Lời kinh nguyên văn/ }).click();
  await expect(dq.getByTestId("loi-kinh")).toContainText("Thoán truyện: Lớn thay đức đầu mối của Càn!");
});

test("câu mơ hồ (mua hay bán) → hỏi lại trước khi gieo; chọn xong mới ra quẻ", async ({ page }) => {
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Tôi nên mua hay bán căn nhà này?");
  await expect(ans).toContainText("Bạn đang mua hay đang bán?");
  await expect(ans.getByTestId("que")).toHaveCount(0);
  await ans.getByTestId("lam-ro").getByRole("button", { name: "Tôi đang bán" }).click();
  const ans2 = page.getByTestId("cau-tra-loi").last();
  await ans2.getByTestId("bo-qua-gieo").click();                            // máy gieo → nghi thức lật xu → xem luôn
  await expect(ans2.getByTestId("que")).toBeVisible();
  await expect(ans2).toContainText("Về việc bán nhà, bán đất");
});

test("Mai Hoa theo hai số tự chọn và theo phương vị — cùng đầu vào ra cùng quẻ", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("mai_hoa_so");
  await page.getByLabel("Số thứ nhất").fill("3");
  await page.getByLabel("Số thứ hai").fill("5");
  const ans = await hoi(page, "Chiều nay đi gặp đối tác có thuận không?");
  await expect(ans.getByTestId("mai-hoa-so")).toContainText("3 và 5");
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Mai Hoa");
  await page.getByLabel("Cách ra quẻ").selectOption("mai_hoa_phuong");
  await page.getByLabel("Phương vị").selectOption("Tây Nam");
  const ans2 = await hoi(page, "Người khách đến từ phía đó có hợp làm ăn không?");
  await expect(ans2.getByTestId("mai-hoa-phuong")).toContainText("phương Tây Nam");
});

test("chip chủ đề: chọn trước khi hỏi → bài đọc theo đúng chủ đề", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByTestId("chip-chu-de").getByRole("button", { name: "Mở quán, kinh doanh, đầu tư" }).click();
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Việc này có thành không?");
  await expect(ans).toContainText("Về việc mở quán, kinh doanh, đầu tư");
});

test("KC-3/4/5: ứng kỳ có nút nhắc (lưu máy, hiện ở Hôm nay), gợi mở chéo, CTA cuối bài, ?chu_de= chọn sẵn chip", async ({ page }) => {
  await page.goto("/kinh-dich?chu_de=kinh_doanh");
  await expect(page.getByTestId("chip-chu-de").getByRole("button", { name: "Mở quán, kinh doanh, đầu tư" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Việc này có thành không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq.getByTestId("goi-mo-cheo")).toHaveAttribute("data-ma", "kinh_doanh_tien");
  const nhac = dq.getByTestId("ung-ky").getByTestId("nhac-toi").first();
  await nhac.getByRole("button", { name: "Nhắc tôi hôm đó" }).click();
  await expect(nhac.getByRole("button", { name: "Sẽ nhắc ở Hôm nay" })).toBeVisible();
  const luu = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nhac.v1") ?? "[]"));
  expect(luu).toHaveLength(1);
  expect(luu[0].ma).toMatch(/^kd\.ungky\./);
  expect(JSON.stringify(luu)).not.toContain("Việc này có thành");          // không lưu câu hỏi
  // Cuối bài hợp nhất (KC-5 + CTA-1): gợi mở theo ý định ở trên + khối "Đọc tiếp về bạn" (gợi chéo, Sao, mời, ủng hộ).
  await expect(page.getByTestId("cuoi-phan-xem")).toBeVisible();
  await expect(page.getByTestId("cuoi-phan-xem").getByTestId("the-goi-y").first()).toBeVisible();
  // tín hiệu ngầm: mở một cách đọc KHÁC phái chính (câu dự đoán → chính là Lục Hào, đã mở sẵn) → đếm trên máy
  await dq.getByRole("button", { name: /Ba cách đọc cùng một quẻ/ }).click();
  await dq.getByTestId("goc-nhin").locator("[data-phai=nghia_ly]").getByRole("button").first().click();
  const tq = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.thoi_quen_kd.v1") ?? "{}"));
  expect(tq.nghia_ly).toBe(1);
});

// ---------------------------------------------------------------- UI-KD: nghi thức đồng xu · bộ chọn · lịch sử · thẻ

/** Ép engine trả quẻ cố định cho "Máy gieo" (đổi thân yêu cầu sang gieo_tay) — web vẫn tưởng là may_gieo nên hiện nghi thức. */
async function epQue(page: import("@playwright/test").Page, gia_tri_hao: number[], ghi?: (body: Record<string, unknown>) => void) {
  await page.route("**/api/kinhdich/hoi", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
    ghi?.(body);
    if (body.cach_ra_que !== "may_gieo") { await route.continue(); return; }
    const r = await route.fetch({ postData: JSON.stringify({ ...body, cach_ra_que: "gieo_tay", gia_tri_hao }) });
    await route.fulfill({ response: r });
  });
}
const suKien = (page: import("@playwright/test").Page) => page.evaluate(() =>
  ((window as unknown as { __hbt_su_kien?: ({ su_kien: string } & Record<string, unknown>)[] }).__hbt_su_kien ?? []));

test("gieo đồng xu có nghi thức: bấm 6 lần, xu lật đúng giá trị engine (9 = ba ngửa, 7 = một ngửa), hào động vàng, rồi mới hiện tên quẻ", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });                    // không chờ chuyển động lật
  await epQue(page, [7, 7, 8, 7, 7, 9]);
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const gx = ans.getByTestId("gieo-dong-xu");
  await expect(gx).toBeVisible();
  await expect(gx.getByTestId("hang-hao-1")).toHaveAttribute("data-hien", "0");
  for (let i = 1; i <= 6; i++) {
    await expect(gx.getByTestId("gieo-lan")).toHaveAccessibleName(`Gieo lần ${i}`);
    await gx.getByTestId("gieo-lan").click();
    await expect(gx.getByTestId(`hang-hao-${i}`)).toHaveAttribute("data-hien", "1");
  }
  // hào 1 = 7 (một ngửa hai sấp), hào 3 = 8 (hai ngửa một sấp), hào 6 = 9 (ba ngửa, động)
  await expect(gx.getByTestId("xu-1-1")).toHaveAttribute("data-mat", "ngua");
  await expect(gx.getByTestId("xu-1-2")).toHaveAttribute("data-mat", "sap");
  await expect(gx.getByTestId("xu-3-3")).toHaveAttribute("data-mat", "sap");
  for (const i of [1, 2, 3]) await expect(gx.getByTestId(`xu-6-${i}`)).toHaveAttribute("data-mat", "ngua");
  await expect(gx.getByTestId("hang-hao-6")).toContainText("Dương động");
  await expect(gx.getByTestId("xu-6-1")).toHaveAccessibleName("Hào 6, đồng xu 1: ngửa");
  // đủ 6 hào → quẻ + lời đọc hiện; tên quẻ chỉ có sau nghi thức
  const que = ans.getByTestId("que");
  await expect(que).toBeVisible();
  await expect(que).toContainText("Lý");
  await expect(que.getByTestId("giai-thich-dong")).toContainText("hào 6");
  await expect(que.getByTestId("gio-gieo")).toContainText("Gieo lúc");
  await expect(ans.getByTestId("doc-que")).toBeVisible();
  await expect(ans).toContainText("Về việc thăng tiến, phỏng vấn, đề bạt");
  const sk = (await suKien(page)).filter((e) => e.su_kien === "chart_interacted" && String(e.kind).startsWith("coin_toss"));
  expect(sk.map((e) => e.kind)).toEqual(["coin_toss_started", "coin_toss_completed"]);
  expect(sk[1]!.ket_qua).toBe("du_6");
  expect(JSON.stringify(sk)).not.toContain("quản lý");                      // không gửi câu hỏi
});

test("tự gieo bằng đồng xu / kiểu hào: quẻ dựng dần, thân gửi engine đúng gia_tri_hao, không nghi thức lật", async ({ page }) => {
  const than: Record<string, unknown>[] = [];
  await epQue(page, [], (b) => than.push(b));
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  const ch = page.getByTestId("chon-hao");
  await expect(ch).toBeVisible();
  // lần 1: bấm một đồng ngửa → 7 (Dương); lần 2: kiểu hào Dương; lần 3: hai đồng ngửa → 8 (Âm)
  await ch.getByTestId("xu-1-2").click();
  await expect(ch.getByTestId("chon-hao-1")).toHaveAttribute("data-gia-tri", "7");
  await ch.getByRole("button", { name: "Chọn lần gieo 2 (hào 2)" }).click();   // chip kiểu hào chỉ hiện ở hàng đang chọn
  await ch.getByTestId("hao-2-7").click();
  await expect(ch.getByTestId("chon-hao-3")).toHaveAttribute("data-dang", "1");  // chọn kiểu xong tự sang hàng kế
  await ch.getByTestId("xu-3-1").click();
  await ch.getByTestId("xu-3-3").click();
  await expect(ch.getByTestId("chon-hao-3")).toHaveAttribute("data-gia-tri", "8");
  await ch.getByRole("button", { name: "Chọn lần gieo 4 (hào 4)" }).click();
  await ch.getByTestId("hao-4-7").click();
  await ch.getByTestId("hao-5-7").click();                                      // hàng 5 đã tự được chọn
  // lần 6: ba đồng ngửa → 9 (Dương động)
  for (const i of [1, 2, 3]) await ch.getByTestId(`xu-6-${i}`).click();
  await expect(ch.getByTestId("chon-hao-6")).toHaveAttribute("data-gia-tri", "9");
  await expect(ch.getByTestId("ve-que-nho").locator("[data-hao='6']")).toHaveAttribute("data-gia-tri", "9");
  await expect(ch.getByLabel("Sáu hào tự gieo")).toHaveValue("7 7 8 7 7 9");       // gõ nhanh đồng bộ
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  await expect(ans.getByTestId("gieo-dong-xu")).toHaveCount(0);
  await expect(ans.getByTestId("que")).toContainText("Lý");
  expect(than.at(-1)!.cach_ra_que).toBe("gieo_tay");
  expect(than.at(-1)!.gia_tri_hao).toEqual([7, 7, 8, 7, 7, 9]);
  // chưa đủ 6 → báo lỗi ngay, không gọi engine
  await ch.getByTestId("xoa-hao").click();
  await expect(ch.getByTestId("chon-hao-1")).toHaveAttribute("data-dang", "1");
  await ch.getByTestId("hao-1-6").click();
  const n = than.length;
  const ans2 = await hoi(page, "Việc này có thành không?");
  await expect(ans2.getByRole("alert")).toContainText("chọn đủ 6 lần gieo");
  expect(than.length).toBe(n);
  // hướng dẫn gieo thật + hỏi cho đúng
  await page.getByTestId("cach-gieo-mo").click();
  await expect(page.getByTestId("cach-gieo")).toContainText("Gieo cả 3 đồng một lúc, 6 lần");
  await expect(page.getByTestId("hoi-dung")).toContainText("quá rộng");
  await expect(page.getByTestId("cach-gieo")).toContainText("Một quẻ cho một việc");
});

test("lịch sử quẻ trên máy: lưu sau khi gieo (≤ 200 ký tự câu hỏi), Xem lại gọi engine gieo_tay đúng 6 hào cũ, xoá được", async ({ page }) => {
  const than: Record<string, unknown>[] = [];
  await epQue(page, [8, 8, 7, 7, 8, 6], (b) => than.push(b));
  await page.goto("/kinh-dich");
  await expect(page.getByTestId("lich-su-que")).toHaveCount(0);
  const ans = await hoi(page, "Hợp đồng này có ký được không?");
  await ans.getByTestId("bo-qua-gieo").click();
  await expect(ans.getByTestId("que")).toBeVisible();
  // HD-CS đợt 3: quẻ bản là khối bấm từng hào; tên quẻ ngay dưới khối.
  const tenQue = (await ans.getByTestId("ten-que-ban").innerText()).split(" quẻ")[0]!.trim();
  const ls = page.getByTestId("lich-su-que");
  await expect(ls).toBeVisible();
  await expect(ls).toContainText("Chỉ lưu trên máy này");
  const luu = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.que.v1") ?? "[]"));
  expect(luu).toHaveLength(1);
  expect(luu[0].gia_tri_hao).toEqual([8, 8, 7, 7, 8, 6]);
  expect(luu[0].cach).toBe("may_gieo");
  expect(luu[0].ten_que).toBe(tenQue);
  await ls.getByTestId("lich-su-que-mo").click();
  const muc = ls.getByTestId("lich-su-que-muc");
  await expect(muc).toHaveCount(1);
  await expect(muc).toContainText("Hợp đồng này có ký được không?");
  // Xem lại → engine nhận gieo_tay + đúng 6 hào, không có nghi thức, không lưu thêm
  await muc.getByTestId("xem-lai").click();
  const ans2 = page.getByTestId("cau-tra-loi").last();
  await expect(ans2.getByTestId("xem-lai-ghi-chu")).toContainText("không gieo lại");
  await expect(ans2.getByTestId("gieo-dong-xu")).toHaveCount(0);
  await expect(ans2.getByTestId("que")).toContainText(tenQue);
  expect(than.at(-1)!.cach_ra_que).toBe("gieo_tay");
  expect(than.at(-1)!.gia_tri_hao).toEqual([8, 8, 7, 7, 8, 6]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.que.v1") ?? "[]").length)).toBe(1);
  expect((await suKien(page)).filter((e) => e.su_kien === "chart_interacted" && e.kind === "que_replayed")).toHaveLength(1);
  // xoá
  await muc.getByTestId("xoa-que").click();
  await expect(page.getByTestId("lich-su-que")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.que.v1") ?? "[]").length)).toBe(0);
});

test("thẻ Quẻ của tôi: mã ký chỉ có 6 hào + tên quẻ + chủ đề (không câu hỏi), trang nhận + ảnh PNG, mã sửa bị chặn", async ({ page, request }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  await expect(ans.getByTestId("que")).toBeVisible();
  await ans.getByTestId("mo-chia-se-que").click();
  await ans.getByLabel("Tên trên thẻ (không bắt buộc)").fill("Lan");
  await ans.getByTestId("tao-the-que").click();
  const link = await ans.getByTestId("link-the-que").inputValue();
  expect(link).toMatch(/\/the\/que\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{16}\?tu=qu\.[0-9a-f]{10}/);
  const ma = decodeURIComponent(link.split("/the/que/")[1]!.split("?")[0]!);
  const than = Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
  expect(than).not.toContain("quản lý");                                    // không câu hỏi
  const g = JSON.parse(than) as unknown[];
  expect(g[1]).toBe("Lan");
  expect(g[2]).toBe("778779");
  expect(g[3]).toBe("Lý");
  expect(g[4]).toBe("Đoài");
  expect((await suKien(page)).filter((e) => e.su_kien === "share_created" && e.kind === "que")).toHaveLength(1);
  const html = await (await request.get(`/the/que/${ma}`)).text();
  expect(html).toContain("Quẻ của Lan");
  expect(html).toContain("biến");
  expect(html).toContain(`/og/que?ma=${ma}`);
  expect(html).not.toContain("quản lý");
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/que?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/og/que")).status()).toBe(200);                 // ảnh mặc định khi không mã
  // trang nhận mời gieo quẻ của mình, mang ?tu=
  await page.goto(`/the/que/${ma}`);
  await expect(page.getByTestId("the-que-ten")).toContainText("Lý");
  expect(await page.getByTestId("the-que-moi").getAttribute("href")).toMatch(/^\/kinh-dich\?tu=qu\./);
  // mã sửa tên quẻ → chữ ký lệch → hết hiệu lực; API thiếu hào → 422
  g[3] = "Càn";
  const sua = `${Buffer.from(JSON.stringify(g)).toString("base64url")}.${ma.split(".")[1]}`;
  expect(await (await request.get(`/the/que/${sua}`)).text()).toContain("Thẻ không còn hiệu lực");
  expect((await request.post("/api/chia-se/que", { data: { gia_tri_hao: [7, 7, 8], ten_hien_thi: "A" } })).status()).toBe(422);
});

// ---------------------------------------------------------------- KD-2 (P7 · P8 · P9 · giờ gieo)
test("P7 lắc điện thoại: bật nghe lắc → mỗi cú lắc là một lần lật (giá trị vẫn của engine); đo coin_toss_shake", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await epQue(page, [7, 7, 8, 7, 7, 9]);
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  const gx = ans.getByTestId("gieo-dong-xu");
  await gx.getByTestId("lac-gieo").click();
  await expect(gx.getByTestId("lac-dang-bat")).toBeVisible();
  const lac = () => page.evaluate(async () => {
    const ban = (x: number) => window.dispatchEvent(new DeviceMotionEvent("devicemotion", { accelerationIncludingGravity: { x, y: 0, z: 9.8 } }));
    ban(0); ban(25);                                            // yên → giật mạnh = một cú lắc
  });
  await lac();
  await expect(gx.getByTestId("hang-hao-1")).toHaveAttribute("data-hien", "1");
  await lac();                                                   // < 900 ms: bỏ qua (chống rung đôi)
  await expect(gx.getByTestId("hang-hao-2")).toHaveAttribute("data-hien", "0");
  await page.waitForTimeout(950);
  await lac();
  await expect(gx.getByTestId("hang-hao-2")).toHaveAttribute("data-hien", "1");
  await expect(gx.getByTestId("xu-1-1")).toHaveAttribute("data-mat", "ngua");  // vẫn là 7 của engine
  const sk = (await suKien(page)).filter((e) => e.su_kien === "chart_interacted" && e.kind === "coin_toss_shake");
  expect(sk).toHaveLength(1);
});

test("P9 hỏi lại sau 30 ngày: gieo xong máy nhớ MÃ hộp (không câu hỏi); 35 ngày sau trang Kinh Dịch hỏi 'việc đó ra sao?' và gửi phiếu chỉ mã", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  await hoi(page, "Tôi có nên nhận lời làm quản lý ở công ty ABC không?");
  await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem("hbt.kc_sau.v1") ?? "[]") as unknown[]).length)).toBe(1);
  const ghiNho = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.kc_sau.v1") ?? "[]") as Record<string, unknown>[]);
  expect(ghiNho[0]!.mo_dun).toBe("kinhdich");
  expect(ghiNho[0]!.loai_hoi).toBe("que");
  expect(String(ghiNho[0]!.mau)).toMatch(/^ds\.kinhdich\./);
  expect(JSON.stringify(ghiNho)).not.toContain("ABC");                      // không lưu câu hỏi
  // Lùi ngày ghi nhận 35 ngày → trang Kinh Dịch hỏi lại với lời riêng cho quẻ
  const ngay = new Date(Date.now() - 35 * 86_400_000).toISOString().slice(0, 10);
  await page.evaluate((n) => {
    const ds = JSON.parse(localStorage.getItem("hbt.kc_sau.v1") ?? "[]") as { ngay: string }[];
    localStorage.setItem("hbt.kc_sau.v1", JSON.stringify(ds.map((x) => ({ ...x, ngay: n }))));
  }, ngay);
  const goi: unknown[] = [];
  await page.route("**/api/kiem-chung/sau", async (route) => { goi.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true, da_luu: true } }); });
  await page.goto("/kinh-dich");
  const h = page.getByTestId("hoi-sau-30");
  await expect(h).toContainText("35 ngày trước bạn gieo quẻ này");
  await expect(h).toContainText("Quẻ Lý");
  await expect(h).toContainText("Bạn có làm theo hướng quẻ gợi không?");
  await h.getByRole("radio", { name: "Theo một phần" }).click();
  await expect(h).toContainText("Việc đó giờ ra sao?");
  await h.getByRole("button", { name: "Thuận hơn" }).click();
  await expect(h).toContainText("Cảm ơn bạn");
  expect(goi).toHaveLength(1);
  const g = goi[0] as Record<string, unknown>;
  expect(g.loai).toBe("doi_song"); expect(g.da_lam).toBe("mot_phan"); expect(g.thay_khac).toBe("tot_hon"); expect(g.sau_ngay).toBe(35);
  expect(String(g.mau)).toMatch(/^ds\.kinhdich\./);
  expect(Object.keys(g).sort()).toEqual(["da_lam", "loai", "mau", "phai", "sau_ngay", "thay_khac"]);
});

test("giờ gieo đồng nhất + P8 điền sẵn: ?cach=mai_hoa_so&so=7,12 mở sẵn Mai Hoa theo số; dòng giờ gieo có can chi ngày", async ({ page }) => {
  await page.goto("/kinh-dich?cach=mai_hoa_so&so=7,12");
  await expect(page.getByLabel("Cách ra quẻ")).toHaveValue("mai_hoa_so");
  await expect(page.getByLabel("Số thứ nhất")).toHaveValue("7");
  await expect(page.getByLabel("Số thứ hai")).toHaveValue("12");
  const ans = await hoi(page, "Việc hợp tác này có thuận không?");
  await expect(ans.getByTestId("mai-hoa-so")).toContainText("Mai Hoa theo số bạn chọn: 7 và 12");
  await expect(ans.getByTestId("mai-hoa-so")).toContainText(/lúc \d{2}:\d{2} ngày \d{2}\/\d{2} \(giờ Việt Nam\), ngày \S+ \S+\./);
});
