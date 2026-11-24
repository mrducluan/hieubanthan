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
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveCount(0);          // số đo đổi → kết quả cũ hết đúng
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  expect(than).toHaveLength(2);
  expect(vatGui(1, "bep").huong_cua).toMatch(/^(truoc|phai|sau|trai)$/);
  expect(vatGui(1, "bep").kich_thuoc).toBeUndefined();
  expect(vatGui(1, "ve_sinh").huong_cua).toBeUndefined();

  // 4. Bấm + chiều rộng bếp → từ giờ kích thước bếp mới được gửi
  await vt.getByTestId("vi-tri-phong-rong-tang").click();
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  expect(than).toHaveLength(3);
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
  await expect(vt.getByTestId("vi-tri-ket-qua")).toHaveCount(0);
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
  // đổi lưới → tâm cũ hết dùng được
  await cham(0.1, 0.05);
  await expect(vt.getByTestId("vi-tri-tam")).toHaveCount(0);
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
