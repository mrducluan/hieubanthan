// CHANG-4 — thẻ chia sẻ Chiêm tinh (khâu MỜI): "Bản đồ sao của tôi" (miền mã `sao|`) và "Hợp đôi chiêm tinh" (`sao2|`).
// Kiểm: máy chủ đọc lại cung qua engine rồi ký; mã KHÔNG mang ngày giờ / nơi sinh, không tên người kia, không điểm số;
// chưa có giờ sinh → không cung Mọc; trang nhận noindex, mời về /chiem-tinh?tu=st.|sd.; ảnh /og có cả bản dọc.
import { expect, test } from "@playwright/test";

const giai = (ma: string) => Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
const BAN_DO = { ngay_sinh: "1997-03-15", gio_sinh: "09:30", noi_sinh: "ha-noi", gioi_tinh: "nam" };

test("thẻ Bản đồ sao: ký từ engine, không ngày giờ / nơi sinh trong mã, trang nhận + ảnh", async ({ request }) => {
  const r = await request.post("/api/chia-se/sao", { data: { ...BAN_DO, ten_hien_thi: "Lan" } });
  expect(r.status()).toBe(200);
  const { ma, tu } = await r.json() as { ma: string; tu: string };
  expect(tu).toMatch(/^st\.[a-f0-9]{10}$/);
  const than = giai(ma);
  for (const lo of ["1997", "09:30", "ha-noi", "Hà Nội", "03-15"]) expect(than, lo).not.toContain(lo);
  expect(than).toContain("Song Ngư");                 // Mặt Trời 15/3 — engine trả tên cung
  const html = await (await request.get(`/the/sao/${ma}`)).text();
  expect(html).toContain("noindex");
  expect(html).toContain("Bản đồ sao của Lan");
  expect(html).toMatch(new RegExp(`href="/chiem-tinh\\?tu=${tu.replace(".", "\\.")}"`));
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/sao?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/og/sao")).status()).toBe(200);
  const sai = await (await request.get(`/the/sao/${ma.slice(0, -2)}xx`)).text();   // sai chữ ký → không còn hiệu lực
  expect(sai).toContain("Thẻ không còn hiệu lực");
  // Client không tự khai cung được: trường lạ bị từ chối.
  expect((await request.post("/api/chia-se/sao", { data: { ...BAN_DO, mat_troi: "su_tu" } })).status()).toBe(422);
});

test("thẻ Bản đồ sao: chưa có giờ sinh → không cung Mọc; dưới 16 tuổi → từ chối", async ({ request }) => {
  const r = await request.post("/api/chia-se/sao", { data: { ngay_sinh: "1990-05-15", noi_sinh: "ha-noi" } });
  expect(r.status()).toBe(200);
  const { ma } = await r.json() as { ma: string };
  const g = JSON.parse(giai(ma)) as unknown[];
  expect(g[4]).toBe(0);                                 // cung Mọc trống
  expect(await (await request.get(`/the/sao/${ma}`)).text()).toContain("cần giờ sinh");
  const tre = await request.post("/api/chia-se/sao", { data: { ngay_sinh: "2018-01-01", noi_sinh: "ha-noi" } });
  expect(tre.status()).toBe(422);
});

test("thẻ Hợp đôi chiêm tinh: chỉ 'người ấy', hai cung Mặt Trời, ≤ 3 chủ đề, không điểm số", async ({ page, request }) => {
  const data = { nguoi_a: { ngay_sinh: "1997-03-15", gio_sinh: "09:30", noi_sinh: "ha-noi" },
    nguoi_b: { ngay_sinh: "1996-09-22", noi_sinh: "tp-ho-chi-minh" }, dong_y_tu_nguyen: true, ten_hien_thi: "Minh" };
  expect((await request.post("/api/chia-se/sao2", { data: { ...data, dong_y_tu_nguyen: false } })).status()).toBe(422);
  const r = await request.post("/api/chia-se/sao2", { data });
  expect(r.status()).toBe(200);
  const { ma, tu } = await r.json() as { ma: string; tu: string };
  expect(tu).toMatch(/^sd\.[a-f0-9]{10}$/);
  const g = JSON.parse(giai(ma)) as unknown[];
  expect(g).toHaveLength(6);
  expect((g[4] as unknown[]).length).toBeGreaterThan(0);
  expect((g[4] as unknown[]).length).toBeLessThanOrEqual(3);
  for (const lo of ["1997", "1996", "ha-noi", "tp-ho-chi-minh", "09-22"]) expect(JSON.stringify(g), lo).not.toContain(lo);
  const html = await (await request.get(`/the/sao2/${ma}`)).text();
  expect(html).toContain("Minh &amp; người ấy");
  expect(html).toContain("noindex");
  expect(html).toContain(`/chiem-tinh?tu=${tu}#hop-doi`);
  await page.goto(`/the/sao2/${ma}`);
  expect(await page.getByTestId("the-sao2").innerText()).not.toMatch(/\d+\s*\/\s*100|\d+\s*%/);   // không chấm điểm
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/sao2?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
});

test("/chiem-tinh: nút chia sẻ bản đồ sao + hợp đôi, đo share_created; #hop-doi mở thẳng tab hai người", async ({ page }) => {
  await page.goto("/chiem-tinh");
  await page.getByTestId("ct-ngay-sinh").fill("1997-03-15");
  await page.getByTestId("ct-gio-sinh").fill("09:30");
  await page.getByTestId("ct-chon-noi").selectOption("ha-noi");
  await page.getByTestId("ct-nut-lap").click();
  await expect(page.getByTestId("ban-do-sao-svg")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("mo-chia-se-sao").click();
  const link = await page.getByTestId("link-the-sao").inputValue({ timeout: 15_000 });
  expect(link).toMatch(/\/the\/sao\/[^?]+\?tu=st\./);
  expect(link).not.toContain("1997");

  await page.getByTestId("tab-ct-hop-doi").click();
  await page.getByTestId("syn-ngay-sinh-b").fill("1996-09-22");
  await page.getByTestId("syn-b-chon-noi").selectOption("tp-ho-chi-minh");
  await page.getByTestId("syn-dong-y").check();
  await page.getByTestId("syn-nut-soi").click();
  await expect(page.getByTestId("syn-ket-qua")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("mo-chia-se-sao2").click();
  const link2 = await page.getByTestId("link-the-sao2").inputValue({ timeout: 15_000 });
  expect(link2).toMatch(/\/the\/sao2\/[^?]+\?tu=sd\.[a-f0-9]{10}#hop-doi$/);

  await page.goto("/chiem-tinh#hop-doi");
  await expect(page.getByTestId("tab-ct-hop-doi")).toHaveAttribute("aria-selected", "true");
});
