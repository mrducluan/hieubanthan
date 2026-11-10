// BT-UI — "Ba lá của ngày" trên /hom-nay (thay Lá bài đầu ngày), thẻ chia sẻ "Ba lá của tôi hôm nay", bố cục ba tầng.
import { expect, test, type Page } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import { chuConPhut, gioSapToi, type BaLa, type GioTot } from "../lib/ba-la";
import { docMaBaLa, kyMaBaLa } from "../lib/ma-moi";
import { nenHoi } from "../lib/hom-qua";

type SuKien = { su_kien: string } & Record<string, unknown>;
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: SuKien[] }).__hbt_su_kien ?? []);
const ngayMay = (page: Page) => page.evaluate(() => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));

test("gioSapToi: đang trong giờ tốt / sắp tới / hết giờ tốt trong ngày", () => {
  const g = (chi: string, tu: number, den: number): GioTot => ({ chi, khung: "", than: "", tu, den });
  const ds = [g("Ngọ", 660, 780), g("Tý", 0, 60), g("Dậu", 1020, 1140)];
  expect(gioSapToi(ds, 30)).toMatchObject({ dang: true, conPhut: 30, gio: { chi: "Tý" } });
  expect(gioSapToi(ds, 60)).toMatchObject({ dang: false, conPhut: 600, gio: { chi: "Ngọ" } });
  expect(gioSapToi(ds, 779)).toMatchObject({ dang: true, conPhut: 1, gio: { chi: "Ngọ" } });
  expect(gioSapToi(ds, 1140)).toBeNull();
  expect(gioSapToi([], 10)).toBeNull();
  expect(chuConPhut(135)).toBe("2 giờ 15 phút");
  expect(chuConPhut(120)).toBe("2 giờ");
  expect(chuConPhut(40)).toBe("40 phút");
});

test("mã thẻ Ba lá: ký / đọc lại, sửa một ký tự bị chặn, hết hạn sau 90 ngày, không mang ngày sinh", () => {
  const nd = { t: "Luân", l: ["gay_1", "Át Gậy"] as [string, string], n: 8, q: "Phệ Hạp", d: "2026-11-10" };
  const ma = kyMaBaLa(nd);
  expect(docMaBaLa(ma, new Date("2026-11-11T00:00:00Z"))).toEqual({ v: 1, ...nd });
  const sua = ma.slice(0, 5) + (ma[5] === "A" ? "B" : "A") + ma.slice(6);
  expect(docMaBaLa(sua, new Date("2026-11-11T00:00:00Z"))).toBeNull();
  expect(docMaBaLa(ma, new Date("2027-03-01T00:00:00Z"))).toBeNull();
  expect(Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8")).not.toMatch(/1990|17\/5|"17"/);
  expect(() => kyMaBaLa({ ...nd, n: 10 })).toThrow();
});

test("Ba lá của ngày: lật từng lá → lời engine, đủ ba hiện 'Ba lá ghép lại'; máy nhớ; đo daily_card_flipped", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const khoi = page.getByTestId("ba-la");
  await expect(khoi).toHaveAttribute("data-lat", "0");
  await expect(page.getByTestId("ba-la-ghep")).toHaveCount(0);
  const ngay = await ngayMay(page);
  const api = (await (await request.post("/api/thanso/hom-nay", { data: { ngay: HO_SO_MAU.ngay, thang: HO_SO_MAU.thang, nam: HO_SO_MAU.nam, ngay_xem: ngay } })).json()) as { ba_la: BaLa; tom_lai: string };
  const bl = api.ba_la;
  // Chưa lật: không lộ tên lá Tarot ở đâu trong khối.
  await expect(khoi).not.toContainText(bl.tarot.ten);

  await page.getByTestId("ba-la-tarot").click();
  const tarot = page.getByTestId("ba-la-doc-tarot");
  await expect(tarot).toContainText(bl.tarot.ten);
  await expect(tarot).toContainText(bl.tarot.y);
  await expect(tarot).toContainText(bl.tarot.viec);
  await expect(tarot.getByRole("link", { name: new RegExp(`Đọc kỹ lá ${bl.tarot.ten}`) })).toHaveAttribute("href", bl.tarot.duong!);
  await expect(page.getByTestId("ba-la-tien-do")).toHaveText("đã lật 1/3");

  await page.getByTestId("ba-la-so").click();
  const so = page.getByTestId("ba-la-doc-so");
  await expect(so).toContainText(bl.so.viec!.cach_lam);
  if (bl.so.cau_hoi) await expect(so).toContainText(bl.so.cau_hoi);
  // Lá Con số không lặp điều thẻ ngày phía trên đã in.
  expect(await page.getByTestId("the-hom-nay").innerText()).not.toContain(bl.so.viec!.cach_lam);

  await page.getByTestId("ba-la-thoi_khac").click();
  const tk = page.getByTestId("ba-la-doc-thoi_khac");
  if (bl.thoi_khac.nen.length) await expect(tk).toContainText(bl.thoi_khac.nen.join(", "));
  if (bl.thoi_khac.que) await expect(tk).toContainText(bl.thoi_khac.que.ten);
  // Giờ tốt: web chỉ chọn trong danh sách engine theo đồng hồ máy.
  const phut = await page.evaluate(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  const sap = gioSapToi(bl.thoi_khac.gio, phut);
  await expect(page.getByTestId("ba-la-gio")).toContainText(sap ? `Giờ ${sap.gio.chi} (${sap.gio.khung})` : "đã qua");
  await expect(khoi).toHaveAttribute("data-lat", "3");
  await expect(page.getByTestId("ba-la-ghep")).toContainText(bl.tarot.ten);
  await expect(page.getByTestId("ba-la-thang")).toContainText("Ngày đầu tiên bạn lật lá trong tháng này.");

  // Bấm lại lá đã lật chỉ đổi lời đang đọc, không ghi thêm sự kiện.
  await page.getByTestId("ba-la-tarot").click();
  await expect(tarot).toBeVisible();
  const lat = (await suKien(page)).filter((e) => e.su_kien === "daily_card_flipped");
  expect(lat.map((e) => e.kind)).toEqual(["tarot", "so", "thoi_khac"]);
  expect(lat[2]).toMatchObject({ thu_tu: 3, du_ba: 1 });
  expect(JSON.stringify(lat)).not.toMatch(/1990|Luân/);

  // Máy nhớ: tải lại vẫn ngửa đủ ba, chữ hệt như cũ.
  await page.reload();
  await expect(page.getByTestId("ba-la")).toHaveAttribute("data-lat", "3");
  await expect(page.getByTestId("ba-la-ghep")).toBeVisible();
  // Khối cũ một lá không còn khi engine đã trả ba_la.
  await expect(page.getByTestId("la-bai-up")).toHaveCount(0);
});

test("Chia sẻ ba lá → mã ký không ngày sinh → trang nhận + ảnh PNG ngang / dọc → lời mời về /hom-nay#ba-la có ?tu=bl.", async ({ page, request, browser }) => {
  await napHoSo(page);
  await page.addInitScript(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/hom-nay");
  for (const m of ["tarot", "so", "thoi_khac"]) await page.getByTestId(`ba-la-${m}`).click();
  await page.getByTestId("ba-la-chia-se").click();
  const tai = page.getByTestId("ba-la-tai-anh");
  await expect(tai).toBeVisible();
  const href = (await tai.getAttribute("href"))!;
  const ma = decodeURIComponent(href.split("ma=")[1]!.split("&")[0]!);
  const goi = Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
  expect(goi).toContain("Luân");
  expect(goi).not.toMatch(/1990|Nguyễn/);
  const tao = (await suKien(page)).find((e) => e.su_kien === "share_created" && e.kind === "ba_la");
  expect(String(tao?.ma_moi)).toMatch(/^bl\.[a-f0-9]{10}$/);
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/ba-la?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/og/ba-la")).status()).toBe(200);   // không mã vẫn ra ảnh chung

  const khach = await (await browser.newContext()).newPage();
  await khach.goto(`/the/ba-la/${ma}?tu=${tao!.ma_moi}`);
  const the = khach.getByTestId("the-ba-la");
  await expect(the).toContainText("Ba lá của Luân hôm nay");
  await expect(khach.getByTestId("the-ba-la-moi")).toHaveAttribute("href", `/hom-nay?tu=${tao!.ma_moi}#ba-la`);
  expect(await khach.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  expect(await khach.content()).toContain(`/og/ba-la?ma=${ma}`);
  // Mã giả → trang báo hết hiệu lực, không vỡ.
  await khach.goto(`/the/ba-la/${ma.slice(0, -3)}abc`);
  await expect(khach.getByText("Thẻ không còn hiệu lực")).toBeVisible();
  await khach.close();

  // API chặn ngày xem lệch xa và đầu vào lạ.
  const xa = await request.post("/api/chia-se/ba-la", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990, ngay_xem: "2020-01-01" } });
  expect(xa.status()).toBe(422);
  expect((await request.post("/api/chia-se/ba-la", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990, la: "dai_0" } })).status()).toBe(422);
});

test("Hôm nay ba tầng: điện thoại xếp thẻ ngày → ba lá → ý định; mục 'Đọc thêm' gập sẵn, mở được, #que-ngay tự mở", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("ba-la")).toBeVisible();
  const y = async (id: string) => (await page.getByTestId(id).boundingBox())!.y;
  expect(await y("the-hom-nay")).toBeLessThan(await y("ba-la"));
  expect(await y("ba-la")).toBeLessThan(await y("y-dinh"));
  expect(await y("y-dinh")).toBeLessThan(await y("doc-them"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  // Chip giờ nói giờ tốt sắp tới (hoặc "Giờ hoàng đạo" khi đã hết giờ tốt trong ngày).
  await expect(page.getByTestId("chip-gio")).toContainText(/Giờ tốt sắp tới|Đang giờ tốt|Giờ hoàng đạo/);

  const bt = page.getByTestId("nhip-bat-tu");
  await expect(bt).not.toHaveAttribute("open", "");
  await expect(bt.getByText("Xem lá Bát tự đầy đủ")).toBeHidden();
  await bt.locator("summary").click();
  await expect(bt.getByText("Xem lá Bát tự đầy đủ")).toBeVisible();
  const mo = (await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? [])).filter((e) => e.kind === "hom_nay_mo");
  expect(mo).toHaveLength(1);
  expect(mo[0]).toMatchObject({ muc: "bat_tu" });
  // Bàn phím mở được mục gập.
  const hl = page.getByTestId("hoang-lich-hom-nay");
  await hl.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("hl-tuoi")).toBeVisible();

  await page.goto("/hom-nay#que-ngay");
  await expect(page.getByTestId("que-ngay")).toHaveAttribute("open", "");
  await expect(page.getByTestId("que-rieng")).toBeVisible();
});

test("Máy tính: thẻ ngày và Ba lá cùng hàng; lật đủ ba không để khoảng trống cột trái (ý định nằm ngay dưới thẻ ngày)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await napHoSo(page);
  await page.goto("/hom-nay");
  for (const m of ["tarot", "so", "thoi_khac"]) await page.getByTestId(`ba-la-${m}`).click();
  await expect(page.getByTestId("ba-la-ghep")).toBeVisible();
  const [the, la, yd] = await Promise.all(["the-hom-nay", "ba-la", "y-dinh"].map(async (t) => (await page.getByTestId(t).boundingBox())!));
  expect(Math.abs(the!.y - la!.y)).toBeLessThan(3);
  expect(la!.x).toBeGreaterThan(the!.x + the!.width);
  expect(yd!.y - (the!.y + the!.height)).toBeLessThan(40);
});

test("Buổi tối: ý định chọn từ sớm của hôm nay được hỏi 'Hôm nay thế nào?' — hàm nenHoi", () => {
  const y = { ngay: "2026-11-10", so_ngay: 8, ds: [{ ma: "cong_viec", ten: "Việc ở chỗ làm", nhip: "thuan" }], gio: 9 };
  expect(nenHoi(y, "2026-11-10", 17)).toBeNull();
  expect(nenHoi(y, "2026-11-10", 18)).toBe("toi_nay");
  expect(nenHoi({ ...y, gio: 17 }, "2026-11-10", 20)).toBeNull();          // vừa chọn xong thì chưa hỏi
  expect(nenHoi({ ...y, gio: undefined }, "2026-11-10", 20)).toBeNull();   // bản ghi cũ không có giờ
  expect(nenHoi(y, "2026-11-11", 8)).toBe("hom_qua");
  expect(nenHoi({ ...y, da_tra_loi: "dung" as const }, "2026-11-11", 8)).toBeNull();
  expect(nenHoi(y, "2026-11-12", 8)).toBeNull();
  expect(nenHoi(null, "2026-11-10", 20)).toBeNull();
});
