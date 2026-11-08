// TR-1 — Tarot: trang công cụ (năm bước hỏi → xáo → rút → lật → đọc), lá của ngày, hỏi đáp nghĩa lá, cụm 78 lá, điều hướng.
// Engine thật (e2e khởi động FastAPI); lịch sử chỉ ở localStorage; câu hỏi không lưu máy chủ.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("trang công cụ: H1 máy chủ, xáo bằng máy → rút 3 lá → lật → bài đọc 7 chương → hỏi về lá vừa rút", async ({ page, request }) => {
  const html = await (await request.get("/tarot")).text();
  expect(html).toMatch(/<h1[^>]*>[^<]*Tarot/);
  expect(html).toContain('href="/tarot/la-bai"');
  await napHoSo(page, { ho_ten: "Nguyễn Văn An", ngay: 24, thang: 10, nam: 1988, gioi_tinh: "nam" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tarot");
  await expect(page.getByTestId("buoc-hoi")).toBeVisible();
  await expect(page.getByTestId("la-ngay")).toBeVisible();
  await page.getByTestId("o-cau-hoi").fill("Tôi có nên nhận lời hợp tác với đối tác mới không?");
  // TR-2: engine nhận ra kiểu câu hỏi + gợi trải bài hợp (không trả lại câu đã gõ)
  await expect(page.getByTestId("goi-y-cau-hoi")).toContainText("câu hỏi 'có nên'", { timeout: 10_000 });
  await expect(page.getByTestId("goi-y-cau-hoi")).toContainText("hợp tác với người khác");
  await page.getByTestId("chu-de-cong_viec").click();
  await page.getByTestId("trai-bai-ba_la_loi_khuyen").click();
  await page.getByTestId("nut-bat-dau").click();
  await expect(page.getByTestId("xao-bai")).toBeVisible();
  await page.getByTestId("nut-may-xao").click();
  const quat = page.getByTestId("quat-bai");
  await expect(quat).toBeVisible({ timeout: 15_000 });
  await expect(quat.getByTestId("la-quat")).toHaveCount(78);
  // rút 3 lá: ba ô vị trí đầy, quạt còn 75. Trên quạt các lá chồng mép nhau (lá sau đè lá trước) — người dùng chạm phần
  // mép lộ ra; Playwright bấm vào TÂM lá nên lá kề đè lên → gửi thẳng sự kiện click tới lá đã chọn (cùng luật `rut(i)`).
  for (const k of [5, 40]) await quat.locator(`[data-chi-so="${k}"]`).dispatchEvent("click");
  await expect(quat.getByTestId("la-quat")).toHaveCount(76);
  await quat.locator('[data-chi-so="70"]').dispatchEvent("click");
  // đủ lá → sang bước Lật: quạt cất đi, bàn có 3 lá úp
  await expect(page.getByTestId("quat-bai")).toHaveCount(0);
  const ban = page.getByTestId("ban-trai-bai");
  await expect(ban.locator('[data-testid="la-bai"][data-lat="0"]')).toHaveCount(3);
  await page.getByTestId("nut-lat-het").click();
  await expect(ban.locator('[data-testid="la-bai"][data-lat="1"]')).toHaveCount(3);
  await page.getByTestId("nut-doc-bai").click();
  const bc = page.getByTestId("bao-cao-tarot");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  // TR-2: bài đọc mở bằng câu trả lời cho đúng câu hỏi, câu hỏi hiện lại từ máy người dùng
  await expect(bc.getByTestId("cau-hoi-da-hoi")).toContainText("hợp tác với đối tác mới");
  await expect(page.locator("#lg-tra_loi")).toContainText("Câu trả lời cho câu hỏi của bạn");
  await expect(page.locator("#lg-tra_loi")).toContainText(/Nghiêng về có|Có điều kiện|Chưa nên vội/);
  await expect(page.locator("#lg-tra_loi")).toContainText("Trước khi quyết, làm 3 việc");
  // TR-3: câu "có nên" → máy nhớ MÃ hộp trả lời để hỏi lại sau 30 ngày (không câu hỏi, không lá)
  const kc = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.kc_sau.v1") ?? "[]") as { mo_dun: string; loai_hoi?: string; mau: string; nhan: string }[]);
  const tk = kc.find((x) => x.mo_dun === "tarot");
  expect(tk?.loai_hoi).toBe("tarot");
  expect(tk?.mau).toMatch(/^ds\.tarot\.tra_loi\.quyet_dinh\./);
  expect(JSON.stringify(kc)).not.toContain("đối tác mới");
  await expect(bc).toContainText("Từng vị trí nói gì");
  await expect(bc).toContainText("Việc nên làm trong 72 giờ");
  await expect(bc.getByTestId("chip-muc").first()).toBeVisible();
  // lịch sử trên máy sau khi tải lại
  await page.reload();
  await expect(page.getByTestId("lich-su-tarot")).toContainText("3 lá");
  // hỏi đáp: nghĩa lá + từ chối đọc người khác
  const o = page.getByRole("textbox", { name: "Câu hỏi của bạn" });
  await o.fill("Lá Tháp nghĩa là gì?");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("Tháp (The Tower)", { timeout: 15_000 });
  await o.fill("Người yêu tôi có đang ngoại tình không?");
  await o.press("Enter");
  await expect(page.locator("main")).toContainText("đọc cho chính người hỏi", { timeout: 15_000 });
});

test("nhấn giữ xáo bài (hạt giống từ cử chỉ) → quạt hiện; lá của ngày lật được", async ({ page }) => {
  await page.goto("/tarot");
  await expect(page.getByTestId("buoc-hoi")).toBeVisible();
  await page.getByTestId("trai-bai-mot_la").click();
  await page.getByTestId("nut-bat-dau").click();
  const nut = page.getByTestId("nut-giu-xao");
  await nut.hover();                         // chờ khối Xáo bài dựng xong (hover tự chờ "stable")
  // Sau "Xáo bài" trang cuộn mượt tới bàn (50 ms sau) → trên máy CI chậm nút còn trôi khi chuột ấn xuống, pointerdown rơi cạnh nút.
  // Chờ nút đứng yên 300 ms rồi mới nhấn giữ; giữ ~1,5 s (ngưỡng tối thiểu 0,8 s).
  await expect.poll(async () => {
    const a = await nut.boundingBox(); await page.waitForTimeout(300); const b = await nut.boundingBox();
    return a && b && Math.abs(a.y - b.y) < 1 && Math.abs(a.x - b.x) < 1 ? "yen" : "dang_cuon";
  }, { timeout: 10_000 }).toBe("yen");
  await expect(nut).toBeEnabled();
  const hop = await nut.boundingBox();
  await page.mouse.move(hop!.x + 10, hop!.y + 10);
  await page.mouse.down();
  for (let i = 0; i < 16; i++) { await page.mouse.move(hop!.x + 10 + i * 3, hop!.y + 10 + (i % 3)); await page.waitForTimeout(90); }
  await page.mouse.up();
  await expect(page.getByTestId("quat-bai")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("quat-bai").locator('[data-chi-so="10"]').dispatchEvent("click");   // lá chồng mép (xem test trên)
  await expect(page.getByTestId("nut-doc-bai")).toBeVisible();
  // lá của ngày
  const la = page.getByTestId("la-ngay");
  await la.getByRole("button", { name: "Lật lá của ngày" }).click();
  await expect(la).toContainText("Việc 0 đồng");
});

test("cụm 78 lá, trang con, .md, sitemap, thanh mảng, hub bảy mảng", async ({ request }) => {
  const cum = await (await request.get("/tarot/la-bai")).text();
  expect((cum.match(/href="\/tarot\/la-bai\/[a-z0-9-]+"/g) ?? []).length).toBeGreaterThanOrEqual(78);
  const r = await request.get("/tarot/la-bai/thap");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Tháp \(The Tower\)/);
  expect(html).toContain("Trả lời nhanh");
  expect(html).toContain("<table");
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/tarot/la-bai/3-gay.md")).status()).toBe(200);
  expect((await request.get("/tarot/la-bai/khong-co")).status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/tarot</loc>");
  expect(sm).toContain("/tarot/la-bai/thap</loc>");
  const hub = await (await request.get("/huyen-hoc")).text();
  expect(hub).toContain('data-testid="the-mang-tarot"');
  expect(hub).toContain("bảy cách nhìn lại mình");
  const trang = await (await request.get("/tarot")).text();
  expect(trang).toContain("Trải bài của tôi");
});

test("TR-2: câu 'A hay B' → gợi trải bài Hai lựa chọn; lá ngược có nhãn NGƯỢC, chữ trên lá không lộn ngược", async ({ page }) => {
  // lịch sử trên máy có một trải bài 3 lá với 6 Tiền + Hiệp sĩ Kiếm ngược (ca chủ dự án báo) → Xem lại
  await page.addInitScript(() => {
    localStorage.setItem("hbt.tarot.v1", JSON.stringify([{ id: "e2e1", luc: new Date().toISOString(), trai_bai: "ba_la_thoi_gian",
      la: [{ id: "tien_6", nguoc: true }, { id: "dai_1", nguoc: false }, { id: "kiem_hiep_si", nguoc: true }],
      cau: "Tôi có nên thay đổi công việc mới không?", chu_de: "cong_viec", tom_tat: "Pháp Sư" }]));
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tarot");
  await page.getByTestId("o-cau-hoi").fill("Nên ở lại công ty cũ hay chuyển sang công ty mới?");
  const gy = page.getByTestId("goi-y-cau-hoi");
  await expect(gy).toContainText("chọn giữa hai đường", { timeout: 10_000 });
  await gy.getByTestId("nut-dung-goi-y").click();
  await expect(page.getByTestId("trai-bai-hai_lua_chon")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("chu-de-cong_viec")).toHaveAttribute("aria-checked", "true");
  // Xem lại trải bài cũ
  await page.getByTestId("nut-xem-lai").first().click();
  const bc = page.getByTestId("bao-cao-tarot");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#lg-tra_loi")).toContainText("Chưa nên vội");
  await expect(page.locator("#lg-tra_loi")).toContainText("Hiệp sĩ Kiếm (ngược)");
  // TR-4: chương "Câu chuyện các lá kể" mở sẵn ngay sau câu trả lời, kể từng lá bằng nghĩa trong chuyện đổi việc
  const chuyen = page.getByTestId("lg-chuong-cau_chuyen");
  await expect(chuyen).toHaveAttribute("data-mo", "1");
  await expect(chuyen).toContainText("Câu chuyện các lá kể");
  await expect(chuyen).toContainText("với chuyện đổi sang công việc mới");
  await expect(chuyen).toContainText("Quá khứ — 6 Tiền (ngược)");
  await expect(chuyen).toContainText("Điểm tựa ở Hiện tại: Pháp Sư");
  await expect(chuyen).toContainText("Chỗ cần canh ở Sắp tới: Hiệp sĩ Kiếm (ngược)");
  // lời kể đứng TRƯỚC các hộp (đọc chuyện rồi mới tới điểm tựa / chỗ cần canh)
  const yDoan = (await chuyen.getByTestId("lg-doan").boundingBox())!.y;
  const yHop = (await chuyen.getByText("Điểm tựa ở Hiện tại").boundingBox())!.y;
  expect(yDoan).toBeLessThan(yHop);
  for (const tu of ["decan", "Golden Dawn", "Book T", "Phẩm giá"]) await expect(chuyen).not.toContainText(tu, { useInnerText: true });
  const ban = bc.getByTestId("ban-trai-bai");
  await expect(ban.getByTestId("nhan-nguoc")).toHaveCount(2);
  await expect(ban.locator('svg[data-nguoc="1"]')).toHaveCount(2);
  await expect(ban).toContainText("· ngược");
  // mặt trước không còn xoay nguyên lá 180° (chữ "6" không thành "9")
  const kieu = await ban.locator('[data-testid="la-bai"]').first().evaluate((el) => Array.from(el.querySelectorAll("div")).map((d) => d.style.transform).join("|"));
  expect(kieu).not.toContain("rotate(180deg)");
});

test("TR-3: thẻ 'Câu trả lời của lá bài' — mã ký không mang câu hỏi; ảnh có QR; trải bài Khi nào", async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hbt.tarot.v1", JSON.stringify([{ id: "e2e3", luc: new Date().toISOString(), trai_bai: "ba_la_thoi_gian",
      la: [{ id: "tien_6", nguoc: true }, { id: "dai_1", nguoc: false }, { id: "kiem_hiep_si", nguoc: true }],
      cau: "Tôi có nên thay đổi công việc mới không?", chu_de: "cong_viec", tom_tat: "Pháp Sư" }]));
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tarot");
  await expect(page.getByTestId("trai-bai-khi_nao")).toBeVisible();
  await page.getByTestId("o-cau-hoi").fill("Khi nào tôi có việc mới?");
  await expect(page.getByTestId("goi-y-cau-hoi")).toContainText("Ba lá: Khi nào", { timeout: 10_000 });
  await page.getByTestId("o-cau-hoi").fill("");
  await page.getByTestId("nut-xem-lai").first().click();
  await expect(page.getByTestId("bao-cao-tarot")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("mo-chia-se-tarot").click();
  await page.getByTestId("tao-the-tarot").click();
  const link = await page.getByTestId("link-the-tarot").inputValue({ timeout: 15_000 });
  expect(link).toMatch(/\/the\/tarot\/[^?]+\?tu=ta\./);
  const ma = decodeURIComponent(new URL(link).pathname.split("/").pop()!);
  const than = Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
  expect(than).not.toContain("thay đổi công việc mới không");          // câu người dùng gõ không có trong mã
  expect(than).toContain("đổi sang công việc mới");                    // nhãn loại việc theo danh mục
  await page.goto(new URL(link).pathname + new URL(link).search);
  await expect(page.getByTestId("the-tarot-nghieng")).toHaveText("Chưa nên vội");
  await expect(page.getByTestId("the-tarot")).toContainText("Sắp tới · ngược");
  await expect(page.getByTestId("the-tarot-moi")).toHaveAttribute("href", /\/tarot\?tu=ta\./);
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/tarot?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/og/tarot")).status()).toBe(200);
  expect((await request.get(`/the/tarot/${ma.slice(0, -2)}xx`)).status()).toBe(200);   // mã sai chữ ký → trang "không còn hiệu lực"
});
