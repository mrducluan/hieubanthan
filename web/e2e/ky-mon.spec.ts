// KM-2 — trang /ky-mon: bàn Kỳ Môn theo giờ. Engine lập và đọc bàn; web chỉ vẽ.
import { expect, test } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { conToi } from "../lib/ky-mon";

test.describe("Kỳ Môn Độn Giáp", () => {
  test("HTML máy chủ đã có câu trả lời, bảng tám hướng, giải nghĩa và hỏi đáp", async ({ request }) => {
    const r = await request.get("/ky-mon");
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain("Kỳ Môn Độn Giáp: giờ này nên đi hướng nào?");
    expect(html).toMatch(/là giờ (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)/);
    for (const cua of ["Cửa Khai", "Cửa Hưu", "Cửa Sinh", "Cửa Thương", "Cửa Đỗ", "Cửa Cảnh", "Cửa Tử", "Cửa Kinh"]) expect(html).toContain(cua);
    expect(html).toContain("開門宜遠行征討所向通達");                 // nguyên văn sách
    expect(html).toContain('"FAQPage"');
    expect(html).not.toMatch(/kinqimen|wikisource|đại hung|chắc chắn/i);   // BM-1 + lời không phán
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });

  test("la bàn tám hướng: bấm hướng đọc chi tiết, chọn việc ra hướng và giờ hợp", async ({ page }) => {
    await page.goto("/ky-mon");
    const ban = page.getByTestId("ban-ky-mon");
    await expect(ban.locator("[data-cung]")).toHaveCount(8);
    for (const el of await ban.locator("[data-cung]").all()) expect(["thuan", "binh", "cham"]).toContain(await el.getAttribute("data-muc"));
    await expect(page.getByTestId("km-13-gio").locator("button")).toHaveCount(13);
    await expect(page.getByTestId("km-13-gio").locator('button[aria-current="time"]')).toHaveCount(1);

    await ban.locator('[data-cung="6"]').click();
    const ct = page.getByTestId("km-chi-tiet");
    await expect(ct).toContainText("Hướng Tây Bắc");
    await ct.getByText("Vì sao nói vậy").click();
    await expect(ct).toContainText(/Cửa .+ · sao .+ · thần/);

    await ban.getByRole("button", { name: "Đi xa, xuất phát" }).click();
    const viec = page.getByTestId("km-viec");
    await expect(viec).toContainText("Đi xa, xuất phát");
    await expect(viec).toContainText(/Giờ (Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi) \(/);
    await expect(viec).toContainText("lái xe cẩn thận");                 // câu ranh giới của việc

    // bấm khung giờ khác → la bàn đổi theo giờ ấy
    const gio = page.getByTestId("km-13-gio").locator("button").nth(6);
    await gio.click();
    await expect(gio).toHaveAttribute("aria-current", "time");
    await expect(page.getByTestId("km-gio")).toContainText("Giờ Ngọ");
  });

  test("đổi phép định cục: engine ghi chú phép trí nhuận", async ({ page }) => {
    await page.goto("/ky-mon");
    const ct = page.getByTestId("km-cach-tinh");
    await ct.locator("summary").click();
    await ct.locator("select").first().selectOption("tri_nhuan");
    await expect(ct).toContainText("chưa có bộ đối chiếu ngoài");
    await expect(page.getByTestId("ban-ky-mon").locator("[data-cung]")).toHaveCount(8);
  });

  test("điện thoại 390px: không tràn ngang, ô la bàn chạm được", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ky-mon");
    await expect(page.getByTestId("ban-ky-mon").locator("[data-cung]")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    const o = await page.getByTestId("ban-ky-mon").locator('[data-cung="1"]').boundingBox();
    expect(o!.width).toBeGreaterThanOrEqual(88);
  });

  test("API từ chối đầu vào lạ", async ({ request }) => {
    expect((await request.post("/api/ky-mon/ban", { data: { viec: "xo_so" } })).status()).toBe(422);
    expect((await request.post("/api/ky-mon/ban", { data: { ten: "A" } })).status()).toBe(422);
    expect((await request.post("/api/ky-mon/ngay", { data: { ngay: "2026-11-18", viec: "gap_go" } })).status()).toBe(200);
  });

  test("KM-3: Hôm nay có mục giờ và hướng thuận, dẫn sang /ky-mon", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Nguyen An", ngay: 24, thang: 10, nam: 1988, tao_luc: new Date().toISOString() })));
    await page.goto("/hom-nay");
    const muc = page.getByTestId("ky-mon-hom-nay");
    await expect(muc).toBeVisible();
    await expect(muc).toContainText("Giờ và hướng thuận hôm nay");
    await muc.locator("summary").click();
    await expect(muc.getByRole("link", { name: "Chọn theo việc bạn định làm" })).toHaveAttribute("href", "/ky-mon");
  });

  test("KM-3: trang ngày của Xem ngày tốt có giờ và hướng theo việc", async ({ page }) => {
    const d = new Date(Date.now() + 7 * 3600e3 + 3 * 86400e3).toISOString().slice(0, 10);
    await page.goto(`/xem-ngay-tot/${d}`);
    const k = page.getByTestId("ky-mon-theo-ngay");
    await expect(k).toContainText("Giờ và hướng theo việc");
    await expect(k.locator("li").first()).toContainText(/Giờ .+: hướng .+, cửa /);
    await k.getByRole("button", { name: "Đi xa" }).click();
    await expect(k).toContainText("lái xe cẩn thận");
  });

  test("KM-3: API nhận hướng hợp mệnh", async ({ request }) => {
    const r = await request.post("/api/ky-mon/ngay", { data: { ngay: "2026-11-18", huong_hop: ["Bắc", "Tây"] } });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.hop_menh.loi).toBeTruthy();
    expect(j.gio.every((g: { hop_menh: string[] }) => Array.isArray(g.hop_menh))).toBe(true);
    expect((await request.post("/api/ky-mon/ngay", { data: { huong_hop: ["Lên"] } })).status()).toBe(422);
  });
});

// KM-3 đợt 2 — hub Huyền học, chân trang, khối Kỳ Môn cạnh la bàn Phong thuỷ.
test.describe("Kỳ Môn nối vào các trang", () => {
  test("khung giờ chưa qua: khung Tý cuối ngày (23:00–01:00) vẫn còn lúc 23:40", () => {
    expect(conToi("23:30", 23 * 60 + 40)).toBe(true);
    expect(conToi("00:30", 0)).toBe(true);
    expect(conToi("00:30", 60)).toBe(false);          // 01:00 — khung Tý đầu ngày đã qua
    expect(conToi("07:30", 9 * 60 - 1)).toBe(true);   // khung Thìn 07:00–09:00, còn một phút
    expect(conToi("07:30", 9 * 60)).toBe(false);
  });

  test("hub /huyen-hoc có thẻ Kỳ Môn; chân trang có Nhân tướng, Tarot, Kỳ Môn", async ({ page, request }) => {
    const html = await (await request.get("/huyen-hoc")).text();
    expect(html).toContain('data-testid="the-mang-ky_mon"');
    expect(html).toContain("tám cách nhìn lại mình");
    expect(html).toContain("https://en.wikipedia.org/wiki/Qimen_Dunjia");
    await page.goto("/huyen-hoc");
    const the = page.getByTestId("the-mang-ky_mon");
    await expect(the).toContainText("Giờ này nên đi hướng nào?");
    await expect(the.locator('a[href="/ky-mon"]')).toHaveCount(1);
    await expect(the.getByTestId("chip-can")).toContainText("Không cần ngày sinh");
    expect(await page.getByTestId("hinh-ngu-mang").locator("a").count()).toBe(8);
    const ct = page.getByTestId("chan-trang");
    for (const d of ["/nhan-tuong", "/tarot", "/ky-mon", "/tarot/la-bai", "/tuoi-xong-dat", "/xem-sao-han", "/doi-lich-am-duong"]) {
      await expect(ct.locator(`a[href="${d}"]`), d).toHaveCount(1);
    }
  });

  test("la bàn Phong thuỷ: khối 'hướng hợp mệnh thuận vào giờ nào' chỉ gửi tên hướng, chỉ nêu hướng hợp mệnh", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-18T06:00:00+07:00"));
    await napHoSo(page);
    let than: Record<string, unknown> | null = null;
    page.on("request", (r) => { if (r.url().includes("/api/ky-mon/ngay") && r.method() === "POST") than = r.postDataJSON(); });
    const mqP = page.waitForResponse((r) => r.url().includes("/api/phongthuy/menh-quai") && r.ok());
    await page.goto("/phong-thuy");
    const mq = (await (await mqP).json()) as { huong_cat: string[] };
    const khoi = page.getByTestId("ky-mon-huong-hop");
    await expect(khoi).toContainText("hướng hợp mệnh của bạn thuận vào giờ nào");
    await expect(khoi.locator('a[href="/ky-mon"]')).toHaveCount(1);
    // Riêng tư: chỉ tên hướng hợp mệnh + múi giờ — không năm sinh, giới tính, tên.
    expect(than).not.toBeNull();
    expect(Object.keys(than!).sort()).toEqual(["huong_hop", "utc"]);
    expect([...(than!.huong_hop as string[])].sort()).toEqual([...mq.huong_cat].sort());
    // Mỗi dòng "Giờ X (khung): hướng A, B" — chỉ nêu hướng hợp mệnh, và chỉ khung chưa qua (06:00 → không còn Tý đầu ngày, Sửu, Dần).
    const dong = await khoi.locator("li").allInnerTexts();
    for (const d of dong) {
      const huong = d.split("hướng ")[1]!.split(", ").map((x) => x.trim());
      for (const h of huong) expect(mq.huong_cat, d).toContain(h);
      expect(d).not.toMatch(/Giờ (Sửu|Dần) /);
    }
  });

  test("engine lỗi → khối Kỳ Môn ở Phong thuỷ tự ẩn, la bàn vẫn còn", async ({ page }) => {
    await napHoSo(page);
    await page.route("**/api/ky-mon/ngay", (r) => r.fulfill({ status: 500, body: "{}" }));
    await page.goto("/phong-thuy");
    await expect(page.getByTestId("menh-quai")).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.getByTestId("ky-mon-huong-hop")).toHaveCount(0);
  });
});
