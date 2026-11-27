// Cố vấn Tam Tài (/co-van) + Không gian kinh doanh (/co-van-kinh-doanh) — sau review 2026-11-26: ba cách xem đọc riêng,
// không mức gộp, chuyển hướng câu về người khác / chưa rõ, an toàn trước; sổ nháp khoá mật khẩu trên máy (không phải E2EE),
// đưa sang "Khi góp vốn" thì ô đồng ý vẫn để trống.
import { test, expect } from "@playwright/test";

test("/co-van: trả lời đúng việc + đúng khung thời gian, không mức gộp; câu về người khác chuyển hướng; câu khủng hoảng chặn trước", async ({ page }) => {
  await page.goto("/co-van");
  await expect(page.locator("h1")).toContainText("ba cách nhìn");

  // việc không đụng tới không gian (nghỉ việc ra làm riêng): có câu trả lời đứng đầu, không đòi hướng nhà, không trụ Địa
  await page.getByTestId("co-van-o-cau-hoi").fill("Năm tới tôi có nên nghỉ việc ra khởi nghiệp riêng không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1990-05-15");
  await page.getByTestId("co-van-nut-gui").click();

  await expect(page.getByTestId("co-van-ket-qua")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("co-van-hieu-cau")).toContainText("tự kinh doanh");
  await expect(page.getByTestId("co-van-tra-loi-cau")).toContainText(/năm 20\d\d/);
  await expect(page.getByTestId("co-van-dieu-kien").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("co-van-truoc-het")).not.toBeEmpty();
  for (const ma of ["nhan", "thien"]) await expect(page.getByTestId(`co-van-tru-${ma}`)).toBeVisible();
  // chưa có giờ sinh → Nhân không chấm mức; việc này không cần hướng → không có trụ Địa, không có khung "thêm hướng"
  await expect(page.getByTestId("co-van-tru-nhan")).toContainText("Không chấm mức");
  await expect(page.getByTestId("co-van-tru-dia")).toHaveCount(0);
  await expect(page.getByTestId("co-van-nang-huong")).toHaveCount(0);
  await expect(page.getByTestId("co-van-nhip-12")).toBeVisible();
  await expect(page.getByTestId("co-van-tong-quan")).toHaveCount(0);

  await page.getByTestId("co-van-o-cau-hoi").fill("Chồng tôi có ngoại tình không");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-chuyen-huong")).toHaveAttribute("data-ly-do", "nguoi_khac", { timeout: 15_000 });
  await expect(page.getByTestId("co-van-ket-qua")).toHaveCount(0);

  await page.getByTestId("co-van-o-cau-hoi").fill("Tôi tuyệt vọng muốn tự tử kết thúc mọi thứ");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-an-toan")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("co-van-ket-qua")).toHaveCount(0);
});

test("/co-van: hỏi mở cửa hàng → engine đòi hướng MẶT TIỀN; chọn một hướng thì trụ Địa hiện ngay, tháng đầu câu không lặp", async ({ page }) => {
  await page.goto("/co-van");
  await page.getByTestId("co-van-o-cau-hoi").fill("Tháng 3 năm sau tôi có nên mở quán cà phê không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1988-12-02");
  await page.getByTestId("co-van-nut-gui").click();

  await expect(page.getByTestId("co-van-ket-qua")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("co-van-hieu-cau")).toContainText("quán");
  await expect(page.getByTestId("co-van-thang-hoi")).toContainText("T3/");
  const khung = page.getByTestId("co-van-nang-huong");
  await expect(khung).toBeVisible();
  await expect(khung).toHaveAttribute("data-loai", "mat_bang");
  await expect(khung).toContainText("mặt tiền");
  await expect(page.getByTestId("co-van-tru-dia")).toHaveCount(0);

  await page.getByTestId("co-van-huong-180").click();
  await expect(page.getByTestId("co-van-tru-dia")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("co-van-tru-dia")).toContainText("Mặt tiền hướng Nam");
  await expect(page.getByTestId("co-van-tru-dia")).toContainText("quầy thu ngân");
  await expect(page.getByTestId("co-van-nguon-huong")).toContainText("bạn nhập");
  await expect(page.getByTestId("co-van-nang-huong")).toHaveCount(0);

  // mỗi câu dài chỉ xuất hiện một lần trong kết quả (không còn 10 ô tháng y hệt)
  const cau = await page.getByTestId("co-van-ket-qua").locator("p, li").allInnerTexts();
  const dai = cau.map((x) => x.trim()).filter((x) => x.length >= 60);
  const trung = dai.filter((x, i) => dai.indexOf(x) !== i);
  expect(trung, `câu lặp: ${trung.join(" | ")}`).toEqual([]);
});

test("/co-van: hồ sơ cửa hàng đã lưu ở /quan-ly-nhan-su tự được dùng — không hỏi lại hướng", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hbt.mat_bang.v1", JSON.stringify({ v: 1, loai_hinh: "cua_hang", do_huong: 178.8, cach_nam: "chinh_xac", nam_xay: 2007 }));
  });
  await page.goto("/co-van");
  await page.getByTestId("co-van-o-cau-hoi").fill("Năm sau tôi muốn mở shop kinh doanh có được không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1988-12-02");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-tru-dia")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("co-van-tru-dia")).toContainText("178.8");
  await expect(page.getByTestId("co-van-nguon-huong")).toContainText("hồ sơ cửa hàng");
  await expect(page.getByTestId("co-van-nang-huong")).toHaveCount(0);
});

test("/co-van-kinh-doanh: cẩm nang không xếp hạng; sổ nháp khoá mật khẩu không gửi gì khi lưu; sang Khi góp vốn phải tự tích đồng ý", async ({ page }) => {
  const cacYeuCauMang: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") cacYeuCauMang.push(`${req.url()}::${req.postData() ?? ""}`);
  });

  await page.goto("/co-van-kinh-doanh");
  await expect(page.locator("h1")).toContainText("góp vốn");

  await expect(page.getByTestId("cam-nang-kinh-doanh")).toBeVisible();
  await page.getByTestId("cam-nang-nap-2-mat-bang").click();
  await page.getByTestId("cam-nang-nut-lap").click();
  await expect(page.getByTestId("cn-tru-1-thi-truong")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("cn-mat-bang-1")).toBeVisible();
  await expect(page.getByTestId("cn-mat-bang-1")).not.toContainText("Ưu tiên khảo sát số 1");
  await expect(page.getByTestId("cn-mat-bang-1")).not.toContainText("#1 ·");

  await page.getByTestId("tab-cvkd-ban-co-e2ee").click();
  await expect(page.getByTestId("ban-co-e2ee")).not.toContainText("Đầu-Cuối");
  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-khung-da-mo")).toBeVisible();

  const rawLs = await page.evaluate(() => localStorage.getItem("hbt.ban_co_kinh_doanh.e2ee.v1") ?? "");
  expect(rawLs).toContain("hbt_e2ee_v1");
  expect(rawLs).not.toContain("Đối tác A");
  expect(cacYeuCauMang.some((u) => u.includes("Đối tác A"))).toBe(false);

  await page.getByTestId("e2ee-nut-khoa-lai").click();
  await page.getByTestId("e2ee-mat-khau").fill("SaiMatKhau1234");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await expect(page.getByTestId("e2ee-loi")).toContainText("Sai mật khẩu");

  await page.getByTestId("e2ee-mat-khau").fill("KhoaBiMat#2027");
  await page.getByTestId("e2ee-nut-mo-khoa").click();
  await page.getByTestId("e2ee-dua-sang-gop-von").click();

  await expect(page.getByTestId("gop-von")).toBeVisible();
  for (const o of await page.getByTestId("gop-von-dong-y").all()) await expect(o).not.toBeChecked();
  await expect(page.getByTestId("gop-von-cam-ket")).not.toBeChecked();
  await page.getByTestId("gop-von-xem").click();
  await expect(page.getByTestId("gop-von").getByRole("alert")).toContainText("đồng ý");
  for (const o of await page.getByTestId("gop-von-dong-y").all()) await o.check();
  await page.getByTestId("gop-von-cam-ket").check();
  await page.getByTestId("gop-von-xem").click();
  await expect(page.getByTestId("gop-von-ket-qua")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("gop-von-ranh-gioi")).toContainText("luật sư");
});

test("lối vào Cố vấn + Chiêm tinh: menu, hub Huyền học, điền sẵn câu hỏi từ ?cau=", async ({ page }) => {
  await page.goto("/huyen-hoc");
  await expect(page.getByTestId("the-co-van")).toHaveAttribute("href", "/co-van");
  await expect(page.getByTestId("the-chiem-tinh")).toHaveAttribute("href", "/chiem-tinh");

  // menu thả xuống: Bản thân → "Hỏi một quyết định", Huyền học → "Chiêm tinh phương Tây"
  const menu = page.getByRole("navigation").first();
  await menu.getByText("Bản thân", { exact: true }).first().hover();
  await expect(page.getByRole("link", { name: /Hỏi một quyết định/ }).first()).toBeVisible();
  await menu.getByText("Huyền học", { exact: true }).first().hover();
  await expect(page.getByRole("link", { name: /Chiêm tinh phương Tây/ }).first()).toBeVisible();

  // ?cau= chỉ điền câu gợi ý CỐ ĐỊNH của danh mục (không tự gửi); câu lạ trên URL bị bỏ qua
  const chip = "Có nên mở quán cà phê vào đầu năm sau không?";
  await page.goto("/co-van?cau=" + encodeURIComponent(chip));
  await expect(page.getByTestId("co-van-o-cau-hoi")).toHaveValue(chip);
  await expect(page.getByTestId("co-van-ket-qua")).toHaveCount(0);
  await page.goto("/co-van?cau=" + encodeURIComponent("Câu lạ do người khác dựng link"));
  await expect(page.getByTestId("co-van-o-cau-hoi")).toHaveValue("");
});

test("CV-4: ô hỏi ở trang chủ → /co-van điền sẵn; chữ người dùng gõ KHÔNG lên URL", async ({ page }) => {
  await page.goto("/");
  const o = page.getByTestId("hoi-quyet-dinh-o");
  await o.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("hoi-quyet-dinh-gui")).toBeDisabled();
  const cau = "Tôi muốn mở tiệm bánh ở quê, năm sau có nên không?";
  await o.fill(cau);
  await page.getByTestId("hoi-quyet-dinh-gui").click();
  await expect(page).toHaveURL(/\/co-van$/);
  expect(page.url()).not.toContain("cau=");
  await expect(page.getByTestId("co-van-o-cau-hoi")).toHaveValue(cau);
  // chip cố định đi bằng ?cau=
  await page.goto("/");
  await page.getByTestId("hoi-quyet-dinh").getByRole("link", { name: /mở shop kinh doanh/ }).click();
  await expect(page.getByTestId("co-van-o-cau-hoi")).toHaveValue("Năm sau tôi có nên mở shop kinh doanh không?");
});

test("CV-4: kết quả có 'thử khung khác' — bấm là hỏi lại ngay đúng tháng thuận / năm kế", async ({ page }) => {
  await page.goto("/co-van");
  await page.getByTestId("co-van-o-cau-hoi").fill("Năm nay tôi có nên mở shop không?");
  await page.getByTestId("co-van-ngay-sinh").fill("1988-12-02");
  await page.getByTestId("co-van-nut-gui").click();
  await expect(page.getByTestId("co-van-ket-qua")).toBeVisible({ timeout: 20_000 });
  const tiep = page.getByTestId("co-van-tiep-theo");
  await expect(tiep).toBeVisible();
  await tiep.getByRole("button").last().click();           // "Xem cả năm {năm sau}"
  await expect(page.getByTestId("co-van-hieu-cau")).toContainText("năm 20", { timeout: 20_000 });
  await expect(page.getByTestId("co-van-o-cau-hoi")).toHaveValue(/năm 20\d\d không\?$/);
});

test("CV-4: /co-van mở cho tìm kiếm (không noindex), có hỏi đáp + schema, nằm trong sitemap; API nhận diện quyết định", async ({ page, request }) => {
  const res = await page.goto("/co-van");
  expect(res?.status()).toBe(200);
  for (const r of await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((e) => e.getAttribute("content") ?? ""))) expect(r).not.toContain("noindex");
  await expect(page).toHaveTitle(/Có nên mở shop, mua nhà, nghỉ việc/);
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
  for (const k of ["FAQPage", "WebApplication", "BreadcrumbList"]) expect(ld).toContain(k);
  await expect(page.getByTestId("tra-loi-nhanh").or(page.locator("details").first())).toBeVisible();
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/co-van</loc>");

  const ok = await request.post("/api/co-van/nhan-dien", { data: { cau_hoi: "Năm sau tôi có nên mở quán cà phê không?" } });
  expect(await ok.json()).toMatchObject({ nhan_ra: true, viec: { ma: "mo_quan" } });
  const khung = await request.post("/api/co-van/nhan-dien", { data: { cau_hoi: "Tôi muốn tự tử" } });
  expect(await khung.json()).toMatchObject({ nhan_ra: false, viec: null });
});

// Search Console → "Breadcrumbs" và "Image metadata": mỗi trang MỘT BreadcrumbList khớp đường hiển thị; mọi ImageObject trong
// dữ liệu có cấu trúc mang đủ creator / creditText / copyrightNotice / license / acquireLicensePage và kích thước.
for (const [duong, tenCuoi, soCap] of [["/co-van", "Hỏi một quyết định", 2], ["/chiem-tinh", "Chiêm tinh", 3]] as const) {
  test(`dữ liệu có cấu trúc ${duong}: breadcrumb khớp đường hiển thị + metadata ảnh đủ`, async ({ page }) => {
    await page.goto(duong);
    const khoi = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nut: Record<string, unknown>[] = [];
    const gom = (o: unknown) => {
      if (Array.isArray(o)) o.forEach(gom);
      else if (o && typeof o === "object") { const r = o as Record<string, unknown>; nut.push(r); Object.values(r).forEach(gom); }
    };
    khoi.forEach((k) => gom(JSON.parse(k)));

    const bc = nut.filter((n) => n["@type"] === "BreadcrumbList");
    expect(bc, "đúng một BreadcrumbList").toHaveLength(1);
    const ds = bc[0]!.itemListElement as { position: number; name: string; item: string }[];
    expect(ds).toHaveLength(soCap);
    ds.forEach((x, i) => { expect(x.position).toBe(i + 1); expect(new URL(x.item).pathname.startsWith("/")).toBe(true); });
    expect(new URL(ds[0]!.item).pathname).toBe("/");                 // cấp đầu là trang chủ
    expect(new URL(ds.at(-1)!.item).pathname).toBe(duong);           // cấp cuối là chính trang này
    expect(ds.at(-1)!.name).toContain(tenCuoi);
    // đường hiển thị trên trang = cùng thứ tự, cùng chữ
    const hien = await page.locator('nav[aria-label*="Đường dẫn"] a, nav[aria-label*="đường dẫn"] a, nav[aria-label*="readcrumb"] a').allInnerTexts();
    if (hien.length) expect(hien.map((t) => t.trim())).toEqual(ds.slice(0, hien.length).map((x) => x.name));

    const anh = nut.filter((n) => n["@type"] === "ImageObject" && typeof n.contentUrl === "string" && !String(n.contentUrl).includes("/thuong-hieu/"));
    expect(anh.length).toBeGreaterThan(0);
    for (const a of anh) {
      for (const k of ["creator", "creditText", "copyrightNotice", "license", "acquireLicensePage", "width", "height", "caption"]) expect(a[k], `${k} của ${a.contentUrl}`).toBeTruthy();
    }
  });
}
