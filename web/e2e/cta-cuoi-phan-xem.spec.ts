// CTA-1 — khối "Đọc tiếp về bạn" cuối phần xem + thẻ "Bản đồ 5 mảng" + trò "Đoán số".
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
const SINH = ["1990", "05-17", "17/05", "17/5", "12:30", "Canh Ngọ", "ha-noi"];
const HO_SO_BAN_DO = { ten_hien_thi: "Luân", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", quy_uoc_duong_doi: "tung_phan" };

async function khoiCta(page: Page) {
  const k = page.getByTestId("cuoi-phan-xem");
  await k.scrollIntoViewIfNeeded();
  await expect(k).toBeVisible();
  return k;
}

for (const [duong, tu] of [["/than-so", "than_so"], ["/tu-vi", "tu_vi"], ["/bat-tu", "bat_tu"], ["/phong-thuy", "phong_thuy"],
  ["/hom-nay", "hom_nay"], ["/xem-ngay-tot", "xem_ngay"]] as const) {
  test(`${duong}: khối Đọc tiếp hiện sau kết quả, 3 thẻ mảng khác, luận giải nhỏ cá nhân`, async ({ page }) => {
    await napHoSo(page);
    await page.goto(duong);
    const k = await khoiCta(page);
    await expect(k).toHaveAttribute("data-tu", tu);
    const the = k.getByTestId("the-goi-y");
    await expect(the).toHaveCount(3);
    const mang = await the.evaluateAll((ds) => ds.map((d) => d.getAttribute("data-mang")));
    expect(mang).not.toContain(tu);
    expect(new Set(mang).size).toBe(3);
    // Có ít nhất một thẻ cá nhân hoá — câu khớp đúng câu engine trả cho hồ sơ này.
    const ca = await the.evaluateAll((ds) => ds.map((d) => d.getAttribute("data-ca-nhan")));
    expect(ca).toContain("1");
    for (const cau of await k.getByTestId("cau-goi-y").allInnerTexts()) {
      for (const s of SINH) expect(cau).not.toContain(s);
      expect(cau.length).toBeGreaterThan(20);
    }
    await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "cross_cta_viewed" && e.tu === tu)).toBe(true);
  });
}

test("câu luận giải nhỏ khớp engine (Thần số trên trang Tử vi) + bấm thẻ đo cross_cta_clicked", async ({ page, request }) => {
  await napHoSo(page);
  const r = await request.post("/api/goi-y-cheo", { data: {
    mang_hien_tai: "phong_thuy", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi",
    ho_ten: ["Nguyễn Đức Luân"], quy_uoc_duong_doi: "tung_phan" } });
  expect(r.status()).toBe(200);
  const j = await r.json();
  expect(j.the.length).toBe(7);
  expect(j.the.find((t: { mang: string }) => t.mang === "tu_vi").nhan).toContain("Cự Môn");
  expect(typeof j.thu_sao).toBe("boolean");

  await page.goto("/phong-thuy");
  const k = await khoiCta(page);
  const dau = j.the.slice(0, 3) as { mang: string; cau: string }[];
  for (const t of dau) await expect(k.locator(`[data-mang="${t.mang}"]`).getByTestId("cau-goi-y")).toHaveText(t.cau);
  await k.locator(`[data-mang="${dau[0]!.mang}"]`).click();
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "cross_cta_clicked" && e.tu === "phong_thuy" && e.den === dau[0]!.mang)).toBe(true);
});

test("chưa có hồ sơ: câu chung mời nhập, không có nút tạo thẻ", async ({ page }) => {
  await page.goto("/xem-ngay-tot");
  const k = await khoiCta(page);
  await expect(k.getByTestId("the-goi-y")).toHaveCount(3);
  await expect(k.getByTestId("cta-chia-se")).toHaveCount(0);
  const ca = await k.getByTestId("the-goi-y").evaluateAll((ds) => ds.map((d) => d.getAttribute("data-ca-nhan")));
  expect(ca.every((x) => x === "0")).toBe(true);
});

test("thiếu giờ sinh: thẻ Tử vi mời thêm giờ", async ({ request }) => {
  const j = await (await request.post("/api/goi-y-cheo", { data: { mang_hien_tai: "than_so", ngay: 24, thang: 10, nam: 1988, ho_ten: ["A"] } })).json();
  const tv = j.the.find((t: { mang: string }) => t.mang === "tu_vi");
  expect(tv.can_them).toBe("gio");
  expect(tv.cta).toContain("giờ sinh");
});

test("CTA Sao — công tắc TẮT (miễn phí): mời đọc luận giải, bấm thì tải báo cáo rồi tự ẩn", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const k = await khoiCta(page);
  const nut = k.getByTestId("cta-sao");
  await expect(nut).toContainText("Đọc luận giải toàn bộ");
  await expect(nut).toContainText("đang miễn phí");
  await nut.click();
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "sao_cta_clicked" && e.tu === "tu_vi")).toBe(true);
  await expect(k.getByTestId("cta-sao")).toHaveCount(0, { timeout: 30_000 });   // đã đọc trọn → không mời nữa
});

test("CTA Sao — công tắc BẬT: còn chương khoá → 'Mở N chương còn lại', bấm đi đúng luồng SAO-2 (hộp đăng nhập)", async ({ page }) => {
  await napHoSo(page);
  await page.route("**/api/goi-y-cheo", async (route) => {
    const r = await route.fetch();
    await route.fulfill({ response: r, json: { ...(await r.json()), thu_sao: true, gia_sao: 10 } });
  });
  await page.route("**/api/luan-giai/phi", (route) => route.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", async (route) => {
    if (route.request().headers()["x-mo-khoa"] === "1") {
      await route.fulfill({ status: 402, json: { can: "dang_nhap", error: "Đăng nhập để mở toàn bộ báo cáo." } });
      return;
    }
    await route.fulfill({ json: {
      mo_dun: "tuvi", chuong: [
        { ma: "a", tieu_de: "Chương một", doan: ["Đoạn mở đầu."] },
        { ma: "b", tieu_de: "Chương hai", khoa: true, moi_xem: { diem_nhan: "Điểm nhấn", cau_hoi: "Câu hỏi mở?", phut_doc: 2 } },
        { ma: "c", tieu_de: "Chương ba", khoa: true, moi_xem: { diem_nhan: "Điểm nhấn", cau_hoi: "Câu hỏi mở?", phut_doc: 3 } },
      ], ket: "Hết.", trang_thai: "nhap_ai", so_khoa: 2,
      phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10 } } });
  });
  await page.goto("/tu-vi");
  const k = await khoiCta(page);
  const nut = k.getByTestId("cta-sao");
  await expect(nut).toContainText("Đọc thử chương đầu");   // khác nhãn nút chính của Luận giải (không trùng tên trên một trang)
  await expect(nut).toContainText("trọn bộ 10 Sao");
  await nut.click();                                                  // tải bản xem trước
  await expect(k.getByTestId("cta-sao")).toContainText("Mở 2 chương còn lại");
  await expect(k.getByTestId("cta-sao")).toHaveAttribute("data-khoa", "2");
  await k.getByTestId("cta-sao").click();
  await expect(page.getByTestId("hop-thoai-sao")).toHaveAttribute("data-can", "dang_nhap");
  const ds = await suKien(page);
  expect(ds.some((e) => e.su_kien === "sao_cta_clicked" && e.so_chuong === 2)).toBe(true);
  expect(ds.some((e) => e.su_kien === "unlock_clicked")).toBe(true);
});

test("thẻ Bản đồ 5 mảng: API ký không lộ ngày sinh, ảnh OG 200 PNG, mã giả bị chặn", async ({ request }) => {
  const r = await request.post("/api/chia-se/ban-do", { data: HO_SO_BAN_DO });
  expect(r.status()).toBe(200);
  const { ma, tu, bien_the, the } = await r.json();
  expect(tu).toMatch(/^bd\.[0-9a-f]{10}$/);
  expect(bien_the).toMatch(/^b[0-2]$/);
  expect(the.m).toBe("Cự Môn");
  expect(the.o).toContain(the.s);
  const than = Buffer.from(ma.split(".")[0], "base64url").toString("utf8");
  for (const s of SINH) expect(than).not.toContain(s);

  const html = await (await request.get(`/the/ban-do/${ma}`)).text();
  expect(html).toContain(`/og/ban-do?ma=${ma}`);
  for (const s of SINH) expect(html).not.toContain(s);
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/ban-do?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  // Sửa đường đời trong mã → chữ ký sai.
  const g = JSON.parse(than) as unknown[];
  g[2] = 9;
  const sua = `${Buffer.from(JSON.stringify(g)).toString("base64url")}.${ma.split(".")[1]}`;
  expect(await (await request.get(`/the/ban-do/${sua}`)).text()).toContain("Thẻ không còn hiệu lực");
  expect((await request.get(`/og/ban-do?ma=${sua}`)).status()).toBe(200);
  // Mã thẻ hai người không đọc được bằng khoá "bd|".
  const hai = await request.post("/api/chia-se/ngay", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990 } });
  expect(await (await request.get(`/the/ban-do/${(await hai.json()).ma}`)).text()).toContain("Thẻ không còn hiệu lực");
});

test("tạo thẻ từ khối CTA → trang nhận → Đoán số (lật thẻ, đúng thì lấp lánh) → mời tự xem có ?tu", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const k = await khoiCta(page);
  await k.getByTestId("mo-the-ban-do").click();
  await k.getByTestId("tao-the-ban-do").click();
  await expect(k.getByTestId("xem-truoc-ban-do")).toBeVisible();
  await expect(k.getByTestId("xem-truoc-ban-do").getByTestId("manh-sao")).toContainText("Cự Môn");
  const link = await k.getByTestId("link-the-ban-do").inputValue();
  const u = new URL(link);
  expect(u.pathname).toMatch(/^\/the\/ban-do\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{16}$/);
  const tu = u.searchParams.get("tu")!;
  expect(await k.getByTestId("tai-anh-ban-do").getAttribute("href")).toContain("&khung=doc");
  expect((await suKien(page)).some((e) => e.su_kien === "share_created" && e.kind === "ban_do" && e.ma_moi === tu)).toBe(true);

  const b = await context.newPage();
  await b.goto(`${u.pathname}?tu=${tu}`);
  await expect(b.getByTestId("doan-so")).toBeVisible();
  await expect(b.getByTestId("ban-do-so")).toHaveText("?");
  const dung = "5";   // 17/5/1990, cách "Rút gọn con số" (mặc định web)
  await b.getByTestId(`doan-${dung}`).click();
  await expect(b.getByTestId("ket-qua-doan")).toContainText("Trúng rồi");
  await expect(b.getByTestId("lap-lanh")).toHaveCount(1);
  await expect(b.getByTestId("ban-do-so")).toHaveText(dung);
  const ev = await suKien(b);
  expect(ev.some((e) => e.su_kien === "guess_played" && e.dung === 1 && /^b[0-2]$/.test(String(e.bien_the)))).toBe(true);
  expect(ev.some((e) => e.su_kien === "share_clicked" && e.ma_moi === tu)).toBe(true);
  const moi = b.getByTestId("xem-ban-do-cua-ban");
  expect(await moi.getAttribute("href")).toBe(`/?tu=${tu}`);
});

test("đoán sai vẫn được mời, không lộ đáp án trước khi đoán", async ({ page, request }) => {
  const { ma, the } = await (await request.post("/api/chia-se/ban-do", { data: HO_SO_BAN_DO })).json();
  await page.goto(`/the/ban-do/${ma}`);
  await expect(page.getByTestId("dap-an")).not.toContainText(String(the.s));
  const sai = (the.o as number[]).find((x) => x !== the.s)!;
  await page.getByTestId(`doan-${sai}`).click();
  await expect(page.getByTestId("ket-qua-doan")).toContainText(`là ${the.s}`);
  await expect(page.getByTestId("lap-lanh")).toHaveCount(0);
  await expect(page.getByTestId("xem-ban-do-cua-ban")).toBeVisible();
  expect((await suKien(page)).some((e) => e.su_kien === "guess_played" && e.dung === 0)).toBe(true);
});

test("360px: khối CTA và trang đoán số không tràn ngang", async ({ page, request }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await napHoSo(page);
  await page.goto("/than-so");
  await khoiCta(page);
  const tran = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await tran()).toBeLessThanOrEqual(0);
  const { ma } = await (await request.post("/api/chia-se/ban-do", { data: HO_SO_BAN_DO })).json();
  await page.goto(`/the/ban-do/${ma}`);
  await expect(page.getByTestId("doan-so")).toBeVisible();
  expect(await tran()).toBeLessThanOrEqual(0);
});
