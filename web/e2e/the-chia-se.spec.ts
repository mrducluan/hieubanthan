// TCS-1 — thẻ chia sẻ "Điểm hai người" (ký/giải mã, trang nhận, ảnh OG, không lộ ngày sinh) + mọi ảnh thẻ trả PNG.
import { createHmac } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: "ha-noi" };
const KIA = { birth_date: "1995-08-02", gender: "nu" };
const SINH = ["1990", "1995", "05-17", "08-02", "17/05", "02/08", "Canh Ngọ", "Ất Hợi"];

const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
const giaiThan = (ma: string) => Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
// Khoá ký giống máy chủ e2e (playwright.config.ts: bản build dùng khoá giả, bản dev dùng khoá phát triển của lib/ma-moi.ts)
// — chỉ để dựng lại "mã cũ" còn tên người kia, như đã phát hành trước khi bỏ tên.
const KHOA_E2E = process.env.CI || process.env.E2E_PROD === "1" ? "e2e-chi-dung-cho-thu-nghiem-0000" : "chi-dung-khi-phat-trien-local";
const kyLai = (g: unknown[]) => {
  const than = Buffer.from(JSON.stringify(g), "utf8").toString("base64url");
  return `${than}.${createHmac("sha256", KHOA_E2E).update(`hai|${than}`).digest("base64url").slice(0, 16)}`;
};

test("API ký thẻ: chỉ tên người gửi, quan hệ, điểm, mức, ≤ 3 tiêu chí — khớp điểm engine, không ngày sinh / can chi / tên người kia", async ({ request }) => {
  const kq = await (await request.post("/api/tuvi/hop-tham", { data: { la_so: LA_SO, nguoi_kia: KIA, quan_he: "nguoi_yeu" } })).json();
  const r = await request.post("/api/chia-se/hai", { data: { la_so: LA_SO, nguoi_kia: KIA, quan_he: "nguoi_yeu", ten_ban: "Minh", ten_kia: "Hương Giang" } });
  expect(r.status()).toBe(200);
  const { ma, tu } = await r.json();
  expect(tu).toMatch(/^hp\.[0-9a-f]{10}$/);
  const than = giaiThan(ma);
  for (const s of SINH) expect(than).not.toContain(s);
  const g = JSON.parse(than) as unknown[];
  expect(g[1]).toBe("Minh");
  expect(g[2]).toBe("");
  expect(g[4]).toBe(kq.diem.tong);
  expect((g[6] as number[]).length).toBeLessThanOrEqual(6);
  // Link ngắn → mã QR thưa (≤ phiên bản 8).
  expect(`https://hieuban.com/the/hai/${ma}?tu=${tu}`.length).toBeLessThanOrEqual(152);

  const html = await (await request.get(`/the/hai/${ma}`)).text();
  expect(html).toContain(kq.diem.nhan_muc);
  expect(html).toContain(`/og/hai?ma=${ma}`);
  expect(html).toContain("Người yêu");
  expect(html).not.toContain("Hương Giang");
  for (const s of SINH) expect(html).not.toContain(s);

  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/hai?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
});

test("mã giả / sửa điểm: trang báo hết hiệu lực, ảnh mặc định, không lộ tên", async ({ request }) => {
  const r = await request.post("/api/chia-se/hai", { data: { la_so: LA_SO, nguoi_kia: KIA, quan_he: "ban_be", ten_ban: "Kẻ giả", ten_kia: "B" } });
  const { ma } = await r.json();
  const g = JSON.parse(giaiThan(ma)) as unknown[];
  g[4] = 100;
  const sua = `${Buffer.from(JSON.stringify(g)).toString("base64url")}.${ma.split(".")[1]}`;
  const html = await (await request.get(`/the/hai/${sua}`)).text();
  expect(html).toContain("Thẻ không còn hiệu lực");
  expect(html).not.toContain("Kẻ giả");
  expect((await request.get(`/og/hai?ma=${sua}`)).status()).toBe(200);
  // Mã thẻ khác miền (thẻ ngày / hồ sơ) không đọc được bằng khoá "hai|".
  const ngay = await (await request.post("/api/chia-se/ngay", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990 } })).json();
  expect(await (await request.get(`/the/hai/${ngay.ma}`)).text()).toContain("Thẻ không còn hiệu lực");
});

test("Xem lá số 2 người → Chia sẻ thẻ điểm → trang nhận → lời mời về /tu-vi#hop-tham (tự mở khối) có ?tu", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await form.getByLabel("Ngày sinh người ấy").fill("2");
  await form.getByLabel("Tháng sinh người ấy").fill("8");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  await form.getByRole("button", { name: "Xem độ hợp" }).click();
  await expect(page.getByTestId("diem-hai-nguoi")).toBeVisible();
  const diem = await page.getByTestId("diem-tong").getAttribute("data-diem");

  await page.getByTestId("mo-chia-se-hai").click();
  await expect(page.getByTestId("hai-khong-ten-kia")).toHaveText("Thẻ không ghi tên người kia.");
  await expect(page.getByLabel(/Tên người ấy/)).toHaveCount(0);
  await page.getByLabel("Tên bạn trên thẻ (không bắt buộc)").fill("Luân");
  await page.getByTestId("tao-the-hai").click();
  const link = await page.getByTestId("link-the-hai").inputValue();
  const u = new URL(link);
  expect(u.pathname).toMatch(/^\/the\/hai\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{16}$/);
  const tu = u.searchParams.get("tu")!;
  expect(tu).toMatch(/^hp\.[0-9a-f]{10}$/);
  expect(await page.getByTestId("tai-anh-the-hai").getAttribute("href")).toContain("&khung=doc");
  expect((await suKien(page)).some((e) => e.su_kien === "share_created" && e.kind === "hai_nguoi" && e.ma_moi === tu)).toBe(true);

  // Người nhận (máy khác, chưa có hồ sơ)
  const khach = await context.browser()!.newPage();
  await khach.goto(`${u.pathname}${u.search}`);
  await expect(khach.getByTestId("the-hai-diem")).toHaveAttribute("data-diem", diem!);
  await expect(khach.getByTestId("the-hai")).toContainText("Luân");
  await expect(khach.getByTestId("the-hai")).toContainText("Người yêu");
  expect((await suKien(khach)).filter((e) => e.su_kien === "share_clicked" && e.ma_moi === tu)).toHaveLength(1);
  expect(await khach.evaluate(() => localStorage.getItem("hbt.ma_moi"))).toContain(tu);
  expect(await khach.getByTestId("the-hai-moi").getAttribute("href")).toBe(`/tu-vi?tu=${tu}#hop-tham`);
  await khach.close();

  // Có hồ sơ → link #hop-tham tự mở khối Xem lá số 2 người.
  await page.goto(`/tu-vi?tu=${tu}#hop-tham`);
  await expect(page.getByTestId("hop-tham-form")).toBeVisible();
});

test("mã cũ còn tên người kia: trang nhận + tiêu đề không hiện tên đó, ảnh vẫn trả PNG", async ({ request }) => {
  const { ma } = await (await request.post("/api/chia-se/hai", { data: { la_so: LA_SO, nguoi_kia: KIA, quan_he: "ban_be", ten_ban: "Minh" } })).json();
  const g = JSON.parse(giaiThan(ma)) as unknown[];
  g[2] = "Bảo Ngọc"; // mã phát hành trước khi bỏ tên người kia
  const cu = kyLai(g);
  const html = await (await request.get(`/the/hai/${cu}`)).text();
  expect(html).not.toContain("Thẻ không còn hiệu lực");
  expect(html).toContain("Minh");
  expect(html).toContain("Người bạn");
  expect(html).not.toContain("Bảo Ngọc");
  const anh = await request.get(`/og/hai?ma=${encodeURIComponent(cu)}&khung=doc`);
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
});

test("mọi ảnh thẻ trả PNG (ngang + dọc), kể cả không mã", async ({ request }) => {
  const the = await (await request.post("/api/chia-se/tao", { data: { ten_hien_thi: "Ánh", ho_ten: ["Nguyễn Ngọc Ánh"], ngay: 17, thang: 5, nam: 1990 } })).json();
  const ngay = await (await request.post("/api/chia-se/ngay", { data: { ten_hien_thi: "Ánh", ngay: 17, thang: 5, nam: 1990 } })).json();
  const ma = encodeURIComponent(the.ma), mn = encodeURIComponent(ngay.ma);
  for (const d of [`/og?ma=${ma}`, `/og?ma=${ma}&khung=doc`, `/og?ma=${ma}&kieu=moi`, "/og?tieu_de=Th%E1%BB%AD", "/og",
    `/og/ngay?ma=${mn}`, `/og/ngay?ma=${mn}&khung=doc&tu=hn.0123456789`, "/og/ngay", "/og/hai", "/og/nha", "/og/nha?khung=doc"]) {
    const r = await request.get(d);
    expect(r.status(), d).toBe(200);
    expect(r.headers()["content-type"], d).toContain("image/png");
  }
});
