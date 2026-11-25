import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

// SD-1 — sơ đồ nhà theo tỉ lệ (engine thật): dấu hiệu là do MÁY CHỦ gợi ý sau khi bấm Xem (web không tự suy); kích thước /
// phía cửa máy vẽ mặc định KHÔNG được gửi đi — chỉ gửi sau khi người dùng tự chỉnh; trả lời Có / Không rồi Lưu mới vào hồ sơ
// nhà; dời phòng bằng bàn phím, hoàn tác; không tràn ngang ở 360px.
type Vat = { loai: string; diem?: [number, number]; kich_thuoc?: [number, number]; huong_cua?: string };
type Than = { tang: { so: number; vat: Vat[] }[]; khung?: { rong: number; sau: number } };

const napNha = (page: Page) => page.addInitScript(() => {
  if (window.localStorage.getItem("hbt.nha.v1")) return;
  window.localStorage.setItem("hbt.nha.v1", JSON.stringify({ v: 1, huong_do: 180, theo: "cua", thanh_vien: [], cap_nhat_luc: "2026-11-24T00:00:00.000Z" }));
});
const docNha = (page: Page) => page.evaluate(() => JSON.parse(window.localStorage.getItem("hbt.nha.v1") || "{}"));

test("SD-1: gợi ý dấu hiệu đến từ engine, cửa / kích thước chỉ gửi khi tự chỉnh, Có / Không → Lưu, bàn phím + hoàn tác", async ({ page }) => {
  await napHoSo(page);
  await napNha(page);
  const than: Than[] = [];
  await page.route("**/api/phongthuy/vi-tri-vat", async (r) => { than.push(r.request().postDataJSON() as Than); await r.continue(); });
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();

  const khung = vt.getByTestId("vi-tri-khung");
  const bam = async (loai: string, x: number, y: number) => {
    await vt.getByTestId(`vi-tri-dat-${loai}`).click();
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
    await expect(vt.getByTestId(`vi-tri-hop-${loai}`)).toBeVisible();
  };
  const vatGui = (i: number, loai: string) => than[i]!.tang[0]!.vat.find((v) => v.loai === loai)!;

  // 1. Cửa chính phía trước, nhà vệ sinh gần giữa nhà, bếp phía sau-trái
  await bam("cua_chinh", 0.5, 0.05);
  await bam("ve_sinh", 0.56, 0.52);
  await bam("bep", 0.25, 0.8);
  // Trước khi bấm Xem: web không tự đưa ra dấu hiệu nào; nhà chữ nhật thì tâm vẽ ở chính giữa
  await expect(vt.getByTestId("vi-tri-goi-y")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-tam")).toHaveAttribute("data-nguon", "giua");
  // Cửa phòng máy tạm vẽ: mờ, chưa có nhãn phía cửa
  await expect(vt.getByTestId("vi-tri-hop-bep").locator('[data-cua="tam"]')).toHaveCount(1);
  await expect(vt.getByTestId("vi-tri-huong-cua-nhan")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-cua-chua-dat")).toBeVisible();
  // Cửa chính không có "cửa phòng"
  await expect(vt.getByTestId("vi-tri-hop-cua_chinh").locator("[data-cua]")).toHaveCount(0);

  // 2. Xem → engine gợi ý "nhà vệ sinh ở giữa nhà"; thân gửi KHÔNG có huong_cua / kich_thuoc (người dùng chưa chỉnh gì)
  await vt.getByTestId("vi-tri-xem").click();
  const gy = vt.getByTestId("vi-tri-gy-wc_giua_nha");
  await expect(gy).toBeVisible();
  await expect(gy).toContainText(/vệ sinh/i);
  await expect(gy.getByTestId("vi-tri-gy-co-wc_giua_nha")).toHaveAttribute("aria-pressed", "false");
  await expect(gy.getByTestId("vi-tri-gy-khong-wc_giua_nha")).toHaveAttribute("aria-pressed", "false");
  expect(than).toHaveLength(1);
  expect(JSON.stringify(than[0])).not.toContain("huong_cua");
  expect(JSON.stringify(than[0])).not.toContain("kich_thuoc");
  expect(JSON.stringify(than[0])).not.toContain("tu_dat");
  expect(vatGui(0, "ve_sinh").diem).toBeTruthy();

  // 3. Xoay cửa bếp → cửa vẽ nét liền, có nhãn phía (không có số độ); Xem lại → chỉ bếp mang huong_cua
  await vt.getByTestId("vi-tri-xoay-cua").click();
  await expect(vt.getByTestId("vi-tri-hop-bep").locator('[data-cua="tu_dat"]')).toHaveCount(1);
  const nhanCua = vt.getByTestId("vi-tri-huong-cua-nhan");
  await expect(nhanCua).toContainText("Cửa mở");
  expect(await nhanCua.innerText()).not.toMatch(/\d/);
  // TY-2 gói 2 "thử dời bếp": đã có kết quả → số đo đổi thì TỰ tính lại (không cần bấm Xem); kết quả cũ hiện mờ tới khi xong.
  await expect.poll(() => than.length).toBe(2);
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveAttribute("data-cu", "0");
  expect(vatGui(1, "bep").huong_cua).toMatch(/^(truoc|phai|sau|trai)$/);
  expect(vatGui(1, "bep").kich_thuoc).toBeUndefined();
  expect(vatGui(1, "ve_sinh").huong_cua).toBeUndefined();

  // 4. Bấm + chiều rộng bếp → từ giờ kích thước bếp mới được gửi
  await vt.getByTestId("vi-tri-phong-rong-tang").click();
  await expect.poll(() => than.length).toBe(3);
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveAttribute("data-cu", "0");
  expect(vatGui(2, "bep").kich_thuoc).toHaveLength(2);
  expect(vatGui(2, "ve_sinh").kich_thuoc).toBeUndefined();

  // 5. Chưa trả lời mà Lưu → không ghi dấu hiệu nào; trả lời Có → Lưu → mã vào hồ sơ nhà (đánh dấu là đến từ sơ đồ)
  await vt.getByTestId("vi-tri-luu").click();
  let nha = await docNha(page);
  expect(nha.bo_cuc?.dau_hieu ?? []).not.toContain("wc_giua_nha");
  expect(nha.bo_cuc?.khai_khong ?? []).not.toContain("wc_giua_nha");
  expect(nha.huong_do).toBe(180);
  await vt.getByTestId("vi-tri-gy-co-wc_giua_nha").click();
  await expect(vt.getByTestId("vi-tri-gy-co-wc_giua_nha")).toHaveAttribute("aria-pressed", "true");
  await vt.getByTestId("vi-tri-luu").click();
  nha = await docNha(page);
  expect(nha.bo_cuc.dau_hieu).toContain("wc_giua_nha");
  expect(nha.bo_cuc.tu_so_do).toContain("wc_giua_nha");
  expect(nha.tang_do[0].vat.bep).toMatchObject({ tu_dat_cua: true, tu_dat_kt: true });
  expect(nha.tang_do[0].vat.ve_sinh.huong_cua).toBeUndefined();
  expect(nha.tang_do[0].vat.ve_sinh.kich_thuoc).toBeUndefined();
  // Khảo sát nhà theo ngay câu trả lời vừa lưu
  await expect(page.getByTestId("khao-sat-nha").getByRole("checkbox", { name: /Nhà vệ sinh nằm ở giữa nhà/ })).toBeChecked();
  // Đổi ý: Không → Lưu → gỡ khỏi dấu hiệu, khai rõ là không có
  await vt.getByTestId("vi-tri-gy-khong-wc_giua_nha").click();
  await vt.getByTestId("vi-tri-luu").click();
  nha = await docNha(page);
  expect(nha.bo_cuc.dau_hieu ?? []).not.toContain("wc_giua_nha");
  expect(nha.bo_cuc.khai_khong).toContain("wc_giua_nha");
  expect(nha.bo_cuc.tu_so_do ?? []).not.toContain("wc_giua_nha");
  await expect(page.getByTestId("khao-sat-nha").getByRole("checkbox", { name: /Nhà vệ sinh nằm ở giữa nhà/ })).not.toBeChecked();

  // 6. Bàn phím: tới hộp bếp, mũi tên phải dời sang phải; Hoàn tác đưa về chỗ cũ (cả tràng phím = một bước)
  const hopBep = vt.getByTestId("vi-tri-hop-bep");
  await expect(hopBep).toHaveAttribute("role", "button");
  await expect(hopBep).toHaveAttribute("aria-label", /Bếp, .*Phím mũi tên/);
  const truoc = (await hopBep.locator("rect").first().boundingBox())!;
  await hopBep.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await hopBep.locator("rect").first().boundingBox())!.x).toBeGreaterThan(truoc.x + 2);
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveAttribute("data-cu", "0");      // tự tính lại sau tràng phím
  await vt.getByTestId("vi-tri-hoan-tac").click();
  await expect.poll(async () => Math.abs((await hopBep.locator("rect").first().boundingBox())!.x - truoc.x)).toBeLessThan(1);
  // Delete bỏ phòng; Hoàn tác hiện lại
  await hopBep.focus();
  await page.keyboard.press("Delete");
  await expect(hopBep).toHaveCount(0);
  await vt.getByTestId("vi-tri-hoan-tac").click();
  await expect(hopBep).toBeVisible();

  // 7. Kéo chuột dời nhà vệ sinh: một lần kéo = một bước hoàn tác
  await vt.getByTestId("vi-tri-dat-ve_sinh").click();
  const hopWc = vt.getByTestId("vi-tri-hop-ve_sinh");
  // Đưa hộp vào GIỮA màn hình trước khi kéo (hộp sát mép dưới thì chuột kéo xuống ra ngoài khung nhìn, không dời được).
  await hopWc.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const wc0 = (await hopWc.locator("rect").first().boundingBox())!;
  const wcTrong = await hopWc.locator("rect").first().evaluate((r) =>
    r.getBoundingClientRect().y - (r as SVGElement).ownerSVGElement!.getBoundingClientRect().y);
  await page.mouse.move(wc0.x + wc0.width / 2, wc0.y + wc0.height / 2);
  await page.mouse.down();
  await page.mouse.move(wc0.x + wc0.width / 2, wc0.y + wc0.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await hopWc.locator("rect").first().boundingBox())!.y).toBeGreaterThan(wc0.y + 15);
  await vt.getByTestId("vi-tri-hoan-tac").click();
  // So vị trí TƯƠNG ĐỐI với khung sơ đồ (bấm Hoàn tác có thể cuộn trang).
  const yTrongKhung = () => hopWc.locator("rect").first().evaluate((r) => {
    const svg = (r as SVGElement).ownerSVGElement!;
    return r.getBoundingClientRect().y - svg.getBoundingClientRect().y;
  });
  await expect.poll(yTrongKhung).toBeLessThan(wcTrong + 1);
  expect(await yTrongKhung()).toBeGreaterThan(wcTrong - 1);
});

test("SD-1: nhà bỏ ô (chữ L) — tâm nhà chỉ hiện sau khi engine trả; một chỗ nằm đúng giữa nhà thì báo ngay cạnh sơ đồ", async ({ page }) => {
  await napHoSo(page);
  await napNha(page);
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();
  const khung = vt.getByTestId("vi-tri-khung");
  const cham = async (x: number, y: number) => {
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  };
  // một chỗ đúng tâm nhà chữ nhật → engine từ chối, lời báo hiện cạnh sơ đồ
  await vt.getByTestId("vi-tri-dat-bep").click();
  await cham(0.5, 0.5);
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-loi")).toContainText("đúng giữa nhà");
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveCount(0);
  // dời bếp lệch khỏi tâm, bỏ hai ô góc trước-phải → chưa có tâm; Xem → tâm do engine trả
  await vt.getByTestId("vi-tri-hop-bep").focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown");
  await vt.getByTestId("vi-tri-bo-luoi").check();
  await cham(0.9, 0.05);
  await cham(0.9, 0.3);
  await expect(vt.getByTestId("vi-tri-tam")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-tam-can-xem")).toBeVisible();
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-tam")).toHaveAttribute("data-nguon", "may_chu");
  await expect(vt.getByTestId("vi-tri-tam-can-xem")).toHaveCount(0);
  // đổi lưới → tâm cũ hết dùng được; đã có kết quả nên máy tự tính lại → tâm mới của lưới mới.
  // (Đưa sơ đồ vào giữa màn hình trước: góc trên sát mép trên thì thanh đầu trang dính che mất điểm chạm.)
  await khung.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const bk = (await khung.boundingBox())!;
  await page.mouse.click(bk.x + bk.width * 0.1, bk.y + bk.height * 0.05);
  await expect(vt.getByTestId("vi-tri-tam")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-tam")).toHaveAttribute("data-nguon", "may_chu");
});

test("TY-2 gói 2: sân / giếng trời chia lớp, đo theo từng sân (engine), dời bếp tự tính lại + trước – sau, Lưu số lớp", async ({ page }) => {
  await napHoSo(page);
  await napNha(page);
  const than: (Than & { khung?: { san?: [number, number][] } })[] = [];
  await page.route("**/api/phongthuy/vi-tri-vat", async (r) => { than.push(r.request().postDataJSON() as Than); await r.continue(); });
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();
  await vt.getByTestId("vi-tri-rong").fill("6");
  await vt.getByTestId("vi-tri-sau").fill("20");
  const khung = vt.getByTestId("vi-tri-khung");
  const cham = async (x: number, y: number) => {
    await khung.evaluate((el) => el.scrollIntoView({ block: "center" }));     // thanh đầu trang dính không che điểm chạm
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  };
  for (const [loai, x, y] of [["cua_chinh", 0.5, 0.02], ["phong_ngu_chinh", 0.5, 0.88], ["bep", 0.15, 0.55]] as const) {
    await vt.getByTestId(`vi-tri-dat-${loai}`).click();
    await cham(x, y);
    await expect(vt.getByTestId(`vi-tri-hop-${loai}`)).toBeVisible();
  }
  // Chế độ sân: chạm hai chỗ → hai dải, nhãn "Lớp 1…3" chỉ để vẽ
  await vt.getByTestId("vi-tri-che-do-san").click();
  await expect(vt.getByTestId("vi-tri-che-do-san")).toHaveAttribute("aria-pressed", "true");
  await cham(0.3, 0.35);
  await expect(vt.getByTestId("vi-tri-san-1")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-san-chon")).toContainText("1.2m");
  await cham(0.3, 0.70);
  await expect(vt.getByTestId("vi-tri-san-2")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-lop-ve-3")).toBeVisible();
  // Bàn phím: dời sân 2 xuống rồi Hoàn tác
  await vt.getByTestId("vi-tri-san-2").focus();
  await page.keyboard.press("ArrowDown");
  await vt.getByTestId("vi-tri-hoan-tac").click();

  await vt.getByTestId("vi-tri-xem").click();
  const ts = vt.getByTestId("vi-tri-theo-san");
  await expect(ts).toBeVisible();
  expect(than[0]!.khung!.san).toHaveLength(2);
  expect(than[0]!.khung!.san![0]![0]).toBeGreaterThan(0.3);
  await expect(ts.getByTestId("vi-tri-theo-san-so-lop")).toContainText("3 lớp");
  await expect(ts.getByTestId("vi-tri-theo-san-lop-chu")).toContainText("lớp 3");
  await expect(ts.getByTestId("vi-tri-theo-san-cua")).toContainText("phía Nam");
  await expect(ts.getByTestId("vi-tri-theo-san-chu")).toContainText("phía Bắc");
  await expect(ts.getByTestId("tam-yeu-lop-1")).toContainText("Diên Niên");
  await expect(ts.getByTestId("tam-yeu-lop-2")).toContainText("Lục Sát");
  await expect(ts.getByTestId("tam-yeu-lop-3")).toContainText("Sinh Khí");
  await expect(vt.getByTestId("vi-tri-san-do-cua")).toHaveCount(1);
  const sauXem = than.length;

  // Dời bếp sang phải bằng chuột (một lần kéo): không bấm Xem, kết quả tự tính lại đúng MỘT lần sau khi thả tay
  await vt.getByTestId("vi-tri-dat-bep").click();
  await expect(vt.getByTestId("vi-tri-che-do-san")).toHaveAttribute("aria-pressed", "false");
  const hopBep = vt.getByTestId("vi-tri-hop-bep");
  await hopBep.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const b0 = (await hopBep.locator("rect").first().boundingBox())!;
  const bk = (await khung.boundingBox())!;
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.move(b0.x + b0.width / 2 + bk.width * 0.7, b0.y + b0.height / 2, { steps: 8 });
  await page.waitForTimeout(700);                      // giữ tay lâu hơn thời gian chờ: chưa được gửi
  expect(than.length).toBe(sauXem);
  await page.mouse.up();
  await expect.poll(() => than.length).toBe(sauXem + 1);
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveAttribute("data-cu", "0");
  const tsMoi = than[than.length - 1]!.tang[0]!.vat.find((v) => v.loai === "bep")!;
  expect(tsMoi.diem![0]).toBeGreaterThan(0.6);
  await expect(vt.getByTestId("vi-tri-truoc-sau")).toContainText("Trước: Thuận lợi → Bây giờ: Cân bằng");
  // Hoàn tác ngay trên dòng trước – sau → bếp về chỗ cũ, tự tính lại
  await vt.getByTestId("vi-tri-truoc-sau-hoan-tac").click();
  await expect.poll(() => than.length).toBe(sauXem + 2);
  await expect(vt.getByTestId("vi-tri-truoc-sau")).toContainText("Bây giờ: Thuận lợi");

  // Lưu → hồ sơ nhà có dải sân + số lớp / dãy nhà chính do engine đếm
  await expect(vt.getByTestId("vi-tri-luu")).toBeEnabled();
  await vt.getByTestId("vi-tri-luu").click();
  const nha = await docNha(page);
  expect(nha.khung.san).toHaveLength(2);
  expect(nha.nhieu_lop).toEqual({ so_lop: 3, lop_chu: 3 });

  // 360px: không tràn ngang
  await page.setViewportSize({ width: 360, height: 740 });
  await vt.getByTestId("vi-tri-che-do-san").click();
  await vt.getByTestId("vi-tri-san-1").focus();
  await page.keyboard.press("Enter");
  await expect(vt.getByTestId("vi-tri-san-chon")).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
});

test("SD-1: 360px — sơ đồ và thanh chỉnh phòng không làm trang tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await napHoSo(page);
  await napNha(page);
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();
  const khung = vt.getByTestId("vi-tri-khung");
  for (const [loai, x, y] of [["cua_chinh", 0.5, 0.05], ["phong_ngu_chinh", 0.3, 0.3], ["bep", 0.3, 0.8]] as const) {
    await vt.getByTestId(`vi-tri-dat-${loai}`).click();
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
    await expect(vt.getByTestId(`vi-tri-hop-${loai}`)).toBeVisible();
  }
  await expect(vt.getByTestId("vi-tri-chinh-phong")).toBeVisible();
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
  // khối sơ đồ nằm gọn trong màn hình
  const hop = (await vt.boundingBox())!;
  expect(hop.x).toBeGreaterThanOrEqual(0);
  expect(hop.x + hop.width).toBeLessThanOrEqual(360 + 0.5);
});

// TY-2 đợt 4 — máy đọc bản vẽ: chỉ gửi khi tự tích đồng ý (bỏ tích sau mỗi lần gửi), chỗ gợi ý là chấm nét đứt, bấm Đúng
// mới thành điểm trên sơ đồ; gợi ý xoay ảnh khi cửa ở dưới; căn theo đường bao máy thấy.
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const moSoDoAnh = async (page: Page, kq: object) => {
  await napHoSo(page);
  await napNha(page);
  const gui: Record<string, unknown>[] = [];
  await page.route("**/api/phongthuy/doc-ban-ve", async (r) => {
    gui.push(r.request().postDataJSON() as Record<string, unknown>);
    await r.fulfill({ json: { engine_version: "x", da_bat: true, ly_do_tat: null, can_xac_nhan: true, luu_y: [], ...kq } });
  });
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();
  await vt.getByTestId("vi-tri-rong").fill("10");
  await vt.getByTestId("vi-tri-sau").fill("10");
  await vt.getByTestId("vi-tri-anh-nen").setInputFiles({ name: "ban-ve.png", mimeType: "image/png", buffer: PNG_1X1 });
  await expect(vt.getByTestId("ban-ve")).toBeVisible();
  return { vt, gui };
};

test("TY-2 đợt 4: máy đọc bản vẽ — đồng ý từng lần, chấm gợi ý, Đúng / Bỏ, căn theo đường bao", async ({ page }) => {
  const { vt, gui } = await moSoDoAnh(page, {
    la_ban_ve: true, khung: { x0: 0.1, y0: 0.1, x1: 0.9, y1: 0.9 },
    cho: [{ ma: "cua_chinh", x: 0.5, y: 0.12, do_tin: 0.9, ly_do: "cửa ở mặt tiền" },
          { ma: "bep", x: 0.3, y: 0.8, do_tin: 0.8, ly_do: "chữ BẾP" },
          { ma: "cau_thang", x: 0.7, y: 0.5, do_tin: 0.8, ly_do: "thang" }],     // tầng 1 không có chỗ cầu thang → bỏ
  });
  const doc = vt.getByTestId("ban-ve-doc");
  await expect(doc).toBeDisabled();
  await vt.getByTestId("ban-ve-dong-y").check();
  await doc.click();
  await expect(vt.getByTestId("ban-ve-cho-bep")).toBeVisible();
  expect(gui).toHaveLength(1);
  expect((gui[0]!.anh as { loai: string }).loai).toBe("image/jpeg");
  expect(gui[0]!.tang).toBe(1);
  await expect(vt.getByTestId("ban-ve-dong-y")).not.toBeChecked();
  await expect(vt.getByTestId("ban-ve-cho-cau_thang")).toHaveCount(0);
  await expect(vt.getByTestId("ban-ve-cham-bep")).toBeVisible();
  await expect(vt.getByTestId("ban-ve-goi-xoay")).toHaveCount(0);

  await vt.getByTestId("ban-ve-can").click();
  await expect(vt.getByTestId("vi-tri-anh-canvas")).toHaveAttribute("data-can", "1");
  await expect(vt.getByTestId("ban-ve-goi-can")).toHaveCount(0);

  await expect(vt.getByTestId("vi-tri-hop-bep")).toHaveCount(0);
  await vt.getByTestId("ban-ve-dung-bep").click();
  await expect(vt.getByTestId("vi-tri-hop-bep")).toBeVisible();
  await expect(vt.getByTestId("ban-ve-cho-bep")).toHaveCount(0);
  await vt.getByTestId("ban-ve-bo-cua_chinh").click();
  await expect(vt.getByTestId("ban-ve-cho-cua_chinh")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toHaveCount(0);
});

test("TY-2 đợt 4: cửa chính máy thấy ở dưới bản vẽ → gợi ý xoay ảnh, chấm xoay theo, không gửi lại", async ({ page }) => {
  const { vt, gui } = await moSoDoAnh(page, {
    la_ban_ve: true, khung: null, cho: [{ ma: "cua_chinh", x: 0.5, y: 0.95, do_tin: 0.9, ly_do: "" }],
  });
  await vt.getByTestId("ban-ve-dong-y").check();
  await vt.getByTestId("ban-ve-doc").click();
  await expect(vt.getByTestId("ban-ve-goi-xoay")).toBeVisible();
  await vt.getByTestId("ban-ve-xoay").click();
  await expect(vt.getByTestId("vi-tri-anh-canvas")).toHaveAttribute("data-xoay", "180");
  await expect(vt.getByTestId("ban-ve-goi-xoay")).toHaveCount(0);
  await vt.getByTestId("ban-ve-dung-cua_chinh").click();
  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toBeVisible();
  expect(gui).toHaveLength(1);
});

test("TY-2 đợt 4: ảnh không phải bản vẽ → không gợi ý chỗ nào", async ({ page }) => {
  const { vt } = await moSoDoAnh(page, { la_ban_ve: false, khung: null, cho: [] });
  await vt.getByTestId("ban-ve-dong-y").check();
  await vt.getByTestId("ban-ve-doc").click();
  await expect(vt.getByTestId("ban-ve-bao")).toContainText("không phải bản vẽ");
  await expect(vt.getByTestId("ban-ve-lop")).toHaveCount(0);
});
