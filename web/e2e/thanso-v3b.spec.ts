// TS-V3b (sau quyết định 2026-10-20: bỏ Qabalah) — thẻ hôm nay có số nổi bật, "Phái nào nói đúng về bạn?" (Pitago ·
// Chaldea, bình chọn → gợi ý sau 7 lần), gói Sao "Bản đồ con số" (Tổng quan hiện ngay sau 4 số cốt lõi). Engine thật.
// Ca Nguyễn Đức Luân 24/10/1988, rút gọn con số: DD 6 · SM 9 · LH 6 · NC 3; số nổi bật 6.
import { test, expect } from "@playwright/test";
import { napHoSo, hoi } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("Qabalah đã bỏ: không còn tab, Cây của hai người, chữ của ngày; route cũ 404", async ({ page, request }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await expect(page.getByRole("tab", { name: "Tổng hợp 2 phái" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Qabalah" })).toHaveCount(0);
  for (const duong of ["/api/thanso/kabbalah", "/api/thanso/cay-hai-nguoi", "/api/thanso/bao-cao-ba-phai"]) {
    expect((await request.post(duong, { data: {} })).status()).toBe(404);
  }
});

test("thẻ hôm nay: số nổi bật khớp engine, link chia sẻ mang số nổi bật, không ngày sinh", async ({ page, request, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page, LUAN);
  await page.addInitScript(() => { (navigator as unknown as { share?: unknown }).share = undefined; });
  const api = await (await request.post("/api/thanso/the-ngay", { data: { ho_ten: ["Nguyễn Đức Luân"], ngay: 24, thang: 10, nam: 1988 } })).json();
  expect(api.so_noi_bat.goc).toBe(6);
  expect(api).not.toHaveProperty("chu_ngay");
  await page.goto("/hom-nay");
  await expect(page.getByTestId("so-noi-bat-ngay")).toContainText("6");
  await expect(page.getByTestId("so-noi-bat-ngay")).toContainText("hai phái");
  await page.getByTestId("the-hom-nay").getByRole("button", { name: "Chia sẻ" }).click();
  await expect(page.getByTestId("the-hom-nay").getByRole("button", { name: "Đã chép link" })).toBeVisible();
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  const ma = new URL(chep.slice(chep.indexOf("http"))).searchParams.get("the")!;
  const nd = JSON.parse(Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8")) as Record<string, unknown>;
  expect(nd).toMatchObject({ s: 6 });
  expect(nd).not.toHaveProperty("hn");
  expect(JSON.stringify(nd)).not.toMatch(/1988|Nguyễn/);
});

test("phái nào nói đúng: 2 phái, phiếu thứ 7 → gợi ý Chaldea, dùng làm phái chính, mời mở bản đồ con số", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("da_nap_phieu")) {
      localStorage.setItem("hbt.thanso_phieu", JSON.stringify({ pitago: 2, chaldea: 4 }));
      sessionStorage.setItem("da_nap_phieu", "1");
    }
  });
  await page.goto("/than-so");
  const ans = await hoi(page, "Tôi hợp nghề gì?");
  const phieu = ans.getByTestId("phai-nao-dung");
  await expect(phieu.getByTestId("bau-pitago")).toContainText("Đường đời 6");
  await expect(phieu.getByTestId("bau-chaldea")).toContainText("Số tên gọi");
  await expect(phieu.getByTestId("bau-kabbalah")).toHaveCount(0);
  await phieu.getByTestId("bau-chaldea").click();
  await expect(phieu.getByTestId("goi-y-phai")).toContainText("Chaldea (5/7");
  const suKien = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const bau = suKien.filter((e) => e.su_kien === "school_voted");
  expect(bau.at(-1)).toMatchObject({ phai: "chaldea", lan: 7 });
  expect(JSON.stringify(bau)).not.toMatch(/Luân|1988|nghề/);
  await expect(phieu.getByRole("link", { name: "Xem bản đồ con số đầy đủ" })).toHaveAttribute("href", "#ban-do-con-so");
  await phieu.getByRole("button", { name: "Dùng Chaldea làm phái chính" }).click();
  await expect(page.getByRole("tab", { name: "Chaldea" })).toHaveAttribute("aria-selected", "true");
});

test("bản đồ con số: Tổng quan hiện ngay sau 4 số cốt lõi; đủ 4 chương khi miễn phí; đổi cách tính → tải lại", async ({ page }) => {
  await napHoSo(page, LUAN);
  const gui: Record<string, unknown>[] = [];
  page.on("request", (r) => { if (r.url().endsWith("/api/thanso/ban-do-con-so")) gui.push(r.postDataJSON() as Record<string, unknown>); });
  await page.goto("/than-so");
  const bd = page.getByTestId("ban-do-con-so");
  const bc = bd.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Tổng quan: bộ số của bạn");
  await expect(bc).toContainText("Số 6 xuất hiện 3 lần trong bộ số của bạn");
  await expect(bc).toContainText("nhóm Kết nối");
  await expect(bc).toContainText("Bên trong & bên ngoài");
  await expect(bc).toContainText("12 tháng tới của bạn");
  await expect(bc).toContainText("Sự nghiệp & tiền bạc");
  await expect(bc).toContainText("Ấm áp và tự do");
  expect(gui.at(-1)).toMatchObject({ quy_uoc_duong_doi: "tung_phan" });
  // Nằm ngay sau "Bốn con số cốt lõi", trước "Chiều sâu".
  const thuTu = await page.evaluate(() => {
    const y = (s: string) => document.querySelector(s)?.getBoundingClientRect().top ?? -1;
    return [y("#bon-so"), y("#ban-do-con-so"), y("#chieu-sau")];
  });
  expect(thuTu[0]! < thuTu[1]! && thuTu[1]! < thuTu[2]!).toBeTruthy();
  await page.getByRole("tab", { name: "Cộng hết chữ số" }).click();
  await expect(bc).toContainText("Đường đời 33");
  expect(gui.at(-1)).toMatchObject({ quy_uoc_duong_doi: "tong_het" });
});
