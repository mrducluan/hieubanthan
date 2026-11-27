// HCS-1 — hộp chia sẻ chung: lời nhắn soạn theo thẻ / trang, thứ tự kênh, nút chia sẻ trang công khai, gửi tệp ảnh.
import { expect, test } from "@playwright/test";
import { CTA_CHIA_SE, loiNhanThe, loiNhanTrang, type LoaiThe } from "../lib/loi-nhan-chia-se";
import { ghepLoiNhan, thuTuKenh, urlFacebook, urlMessenger } from "../lib/kenh-chia-se";

const LOAI: LoaiThe[] = ["card", "invite", "ngay", "xong_dat", "huy_hieu", "hai", "nha", "que", "tarot", "ban_do", "ba_la", "thang", "hoi", "trang", "ban_do_sao", "hop_doi_sao"];
// Không doạ, không hứa chính xác, không vật phẩm (CLAUDE.md CY-1, SX-C; thẻ chia sẻ lan ra ngoài site).
const CAM = /xui|hạn nặng|tai hoạ|tai họa|đại kỵ|chắc chắn|100\s?%|chính xác tuyệt|giải hạn|vật phẩm|bùa|undefined|null|NaN/i;

test("lời nhắn theo thẻ: đủ ≥ 2 lời (trừ trang), có dữ kiện của thẻ, không cụm cấm, không năm sinh", () => {
  const d = { so: 7, tuKhoa: "người đi tìm sự thật", ten: "Lý", nhan: "nên chờ thêm", viec: "đổi việc", nam: 2027, canChi: "Đinh Mùi",
    diem: 72, thang: 10, soNgayGhe: 12, moi: "Bạn thử xem giữ được mấy ngày:" };
  for (const l of LOAI) {
    const ds = loiNhanThe(l, d);
    expect(ds.length, l).toBeGreaterThanOrEqual(l === "trang" ? 1 : 2);
    expect(new Set(ds.map((x) => x.ma)).size, l).toBe(ds.length);
    for (const x of ds) {
      expect(x.chu, `${l} ${x.ma}`).not.toMatch(CAM);
      expect(x.chu.length, x.ma).toBeLessThanOrEqual(240);
      expect(x.ma.length, x.ma).toBeLessThanOrEqual(40);
      if (l !== "xong_dat") expect(x.chu, x.ma).not.toMatch(/\b(19|20)\d{2}\b/);
    }
  }
  expect(loiNhanThe("card", d)[0]!.chu).toContain("số 7");
  expect(loiNhanThe("que", d)[0]!.chu).toContain("quẻ Lý");
  expect(loiNhanThe("hai", d)[0]!.chu).toContain("72/100");
  expect(loiNhanThe("xong_dat", d)[0]!.chu).toContain("Tết Đinh Mùi 2027");
  expect(loiNhanThe("ban_do_sao", d)[0]!.chu).toContain("Mặt Trời Lý");   // CHANG-4
  expect(loiNhanThe("hop_doi_sao", d)[0]!.chu).toContain("“Lý”");
  // Thiếu dữ kiện → bỏ lời cần dữ kiện, không in "undefined"
  for (const l of LOAI) for (const x of loiNhanThe(l)) expect(x.chu, `${l} trống`).not.toMatch(CAM);
});

test("'Gửi cho người ấy' chỉ ở thẻ cặp đôi", () => {
  const coNguoiAy = Object.entries(CTA_CHIA_SE).filter(([, v]) => /người ấy/i.test(v.nhan)).map(([k]) => k).sort();
  expect(coNguoiAy).toEqual(["hai", "hop_doi_sao", "invite"]);   // CHANG-4: hợp đôi chiêm tinh cũng là thẻ cặp đôi
});

test("lời nhắn theo trang: câu hỏi + trả lời ngắn của trang, nỗi lo theo cụm", () => {
  const ds = loiNhanTrang("/xem-ngay-tot/2026-11-24", "Ngày 24/11/2026 tốt hay xấu?", "Ngày Hoàng đạo, hợp cưới hỏi, khai trương. Kiêng động thổ.");
  expect(ds[0]!.chu).toMatch(/^Ngày 24\/11\/2026 tốt hay xấu\? Ngày Hoàng đạo/);
  expect(ds[0]!.chu).toMatch(/Xem đầy đủ:$/);
  expect(ds.some((x) => x.chu.startsWith("Sắp làm việc lớn"))).toBe(true);
  expect(loiNhanTrang("/tu-vi/sao-o-cung/tu-vi-cung-menh", "Sao Tử Vi ở cung Mệnh · Hiểu Bản Thân").at(-1)!.chu).not.toContain("Hiểu Bản Thân");
  // Trả lời dài được cắt ở ranh câu
  const dai = loiNhanTrang("/than-so/y-nghia-so/so-7", "Số 7", "Câu một khá dài để thử cắt ở ranh giới câu cho gọn. ".repeat(6))[0]!;
  expect(dai.chu.length).toBeLessThan(200);
});

test("thứ tự kênh theo nơi người dùng đứng", () => {
  expect(thuTuKenh({ dienThoai: false, app: null, coGuiTep: false, coAnh: true })).toEqual(["zalo", "facebook", "chep", "luu_anh"]);
  expect(thuTuKenh({ dienThoai: true, app: null, coGuiTep: true, coAnh: true }).slice(0, 3)).toEqual(["zalo", "messenger", "anh"]);
  expect(thuTuKenh({ dienThoai: true, app: "zalo", coGuiTep: true, coAnh: true })[0]).toBe("zalo");
  expect(thuTuKenh({ dienThoai: true, app: "facebook", coGuiTep: true, coAnh: true }).slice(0, 2)).toEqual(["anh", "messenger"]);
  expect(thuTuKenh({ dienThoai: true, app: null, coGuiTep: false, coAnh: false })).not.toContain("luu_anh");
  expect(urlFacebook("https://hieuban.com/a?tu=tr.1")).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fhieuban.com%2Fa%3Ftu%3Dtr.1");
  expect(urlMessenger("https://hieuban.com/")).toBe("fb-messenger://share/?link=https%3A%2F%2Fhieuban.com%2F");
  expect(ghepLoiNhan(" Chào: ", "https://x")).toBe("Chào: https://x");
});

test("trang kiến thức: nút chia sẻ → hộp có ảnh xem trước, chọn lời nhắn, chép lời + link có ?tu=tr., Facebook mở link chia sẻ", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    (navigator as unknown as { share?: unknown }).share = undefined;
    (window as unknown as { __mo: string[] }).__mo = [];
    window.open = ((u: string) => { (window as unknown as { __mo: string[] }).__mo.push(String(u)); return null; }) as typeof window.open;
  });
  await page.goto("/than-so/y-nghia-so/so-7");
  await page.getByTestId("chia-se-trang").first().click();
  const hop = page.getByTestId("hop-chia-se");
  await expect(hop.getByTestId("xem-truoc-chia-se")).toHaveAttribute("src", /^\/og/);
  await expect(hop.getByTestId("loi-nhan-0")).toBeChecked();
  await hop.getByTestId("doi-loi-nhan").click();
  await hop.getByTestId("loi-nhan-1").check();
  await expect(hop.getByTestId("loi-nhan-0")).toHaveCount(0);   // chọn xong thu gọn, chỉ còn lời đang chọn
  await hop.getByTestId("kenh-chep").click();
  await expect(hop.getByTestId("bao-chia-se")).toBeVisible();
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  expect(chep).toMatch(/\/than-so\/y-nghia-so\/so-7\?tu=tr\.[0-9a-f]{10}$/);
  await hop.getByTestId("kenh-facebook").click();
  const mo = await page.evaluate(() => (window as unknown as { __mo: string[] }).__mo);
  expect(mo[0]).toMatch(/^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=.+tu%3Dtr\./);
  const ev = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(ev).toContainEqual(expect.objectContaining({ su_kien: "share_sheet_opened", kind: "trang" }));
  expect(ev).toContainEqual(expect.objectContaining({ su_kien: "share_target", kind: "trang", kenh: "chep", bien_the: expect.stringMatching(/^trang\./) }));
  expect(ev).toContainEqual(expect.objectContaining({ su_kien: "share_target", kenh: "facebook" }));
  // không bao giờ gửi chữ lời nhắn hay link vào đo lường
  for (const e of ev) expect(JSON.stringify(e)).not.toContain("http");
});

test("điện thoại có hộp chia sẻ gửi tệp: 'Gửi ảnh' gửi tệp ảnh kèm lời nhắn + link", async ({ browser }) => {
  const ctx = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as { __gui: unknown[] };
    w.__gui = [];
    Object.defineProperty(navigator, "canShare", { value: (d: { files?: File[] }) => Boolean(d.files?.length), configurable: true });
    Object.defineProperty(navigator, "share", {
      value: (d: { files?: File[]; text?: string; url?: string }) => { w.__gui.push({ tep: d.files?.map((f) => [f.name, f.type, f.size > 0]), text: d.text, url: d.url }); return Promise.resolve(); },
      configurable: true,
    });
  });
  await page.goto("/tuoi-xong-dat/2027");
  await page.getByTestId("chia-se-xong-dat").first().click();
  const hop = page.getByTestId("hop-chia-se");
  const anh = hop.getByTestId("kenh-anh");
  await expect(anh).toBeVisible({ timeout: 20_000 });
  const kenh = await hop.getByTestId("kenh-gui").locator("> *").evaluateAll((ds) => ds.map((d) => d.getAttribute("data-testid")));
  expect(kenh.slice(0, 3)).toEqual(["kenh-zalo", "kenh-messenger", "kenh-anh"]);
  await anh.click();
  const gui = await page.evaluate(() => (window as unknown as { __gui: { tep: [string, string, boolean][]; text: string }[] }).__gui);
  expect(gui[0]!.tep[0]).toEqual(["tuoi-xong-dat-tet-2027.png", "image/png", true]);
  expect(gui[0]!.text).toMatch(/Tết Đinh Mùi 2027.+\/tuoi-xong-dat\/2027\?tu=xd\.[0-9a-f]{10}$/);
  await ctx.close();
});
