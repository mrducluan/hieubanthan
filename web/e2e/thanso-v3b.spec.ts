// TS-V3b — Cây của hai người (hợp đôi + link mời), thẻ hôm nay (ngày cá nhân + số nổi bật + chữ Hebrew, chia sẻ),
// "Phái nào nói đúng về bạn?" (bình chọn → gợi ý sau 7 lần → báo cáo 3 phái). Engine thật.
// Ca: Nguyễn Đức Luân 24/10/1988 — Sephirah ngày sinh 6 (Tiferet), số nổi bật 6.
//     Trần Thị Mai 13/05/1990 — tổng chữ số 28 → Sephirah 10 (Malkuth). Tiferet → Malkuth: Nun rồi Qoph (3 lối ngắn bằng nhau).
import { test, expect } from "@playwright/test";
import { napHoSo, hoi } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("Cây của hai người: hợp đôi trực tiếp vẽ đường Nun → Qoph, không chấm điểm, có nút gửi Cây", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/hop-doi");
  await page.getByLabel(/Tên người ấy/).fill("Trần Thị Mai");
  await page.getByLabel("Ngày sinh người ấy").fill("13");
  await page.getByLabel("Tháng sinh người ấy").fill("5");
  await page.getByLabel("Năm sinh người ấy").fill("1990");
  await page.getByRole("button", { name: "Xem hai người" }).click();
  const cay = page.getByTestId("cay-hai-nguoi");
  await expect(cay).toContainText("Tiferet");
  await expect(cay).toContainText("Malkuth");
  await expect(cay.getByTestId("cay-cach-doc")).toContainText("Nun");
  await expect(cay.getByTestId("cay-cach-doc")).toContainText("Qoph");
  await expect(cay.getByTestId("cay-chu-Nun")).toContainText("con đường số 24");
  await expect(cay.locator("line[data-sang]")).toHaveCount(2);
  await expect(cay).toContainText("3 lối ngắn như nhau");
  await expect(cay).toContainText("không chấm điểm");
  await expect(cay.getByRole("button", { name: "Gửi Cây của hai người" })).toBeVisible();
});

test("Cây của hai người qua link mời: người được mời thấy Cây; link chỉ mang Sephirah, không ngày sinh", async ({ page, browser }) => {
  await napHoSo(page, LUAN);
  await page.goto("/hop-doi");
  await page.getByLabel(/Tên hiển thị trên link/).fill("Luân");
  await page.getByRole("button", { name: "Tạo link mời" }).click();
  const link = await page.getByLabel("Link chia sẻ").inputValue();
  const than = JSON.parse(Buffer.from(link.split("/hop-doi/")[1]!.split(".")[0]!, "base64url").toString("utf8")) as Record<string, unknown>;
  expect(than.sp).toBe(6);
  expect(JSON.stringify(than)).not.toMatch(/1988|24\/10|Nguyễn/);

  const b = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  await napHoSo(b, { v: 1, ho_ten: "Trần Thị Mai", ngay: 13, thang: 5, nam: 1990, tao_luc: "2026-09-30T00:00:00Z" });
  await b.goto(link);
  await expect(b.getByTestId("cay-hai-nguoi").getByTestId("cay-cach-doc")).toContainText("Nun");
  await expect(b.getByTestId("cay-hai-nguoi")).toContainText("Luân");
});

test("API Cây: link mời sai / thiếu Sephirah bị chặn", async ({ request }) => {
  const sai = await request.post("/api/thanso/cay-hai-nguoi", { data: { ma: "abcdefghijk.xyz", b: { ngay: 1, thang: 1, nam: 2000 } } });
  expect(sai.status()).toBe(410);
  const thieu = await request.post("/api/thanso/cay-hai-nguoi", { data: { a: { sephirah: 6 }, b: { ngay: 1, thang: 1, nam: 2000 } } });
  expect(thieu.status()).toBe(422);   // client không được tự khai Sephirah
});

test("thẻ hôm nay: số nổi bật + chữ của ngày khớp engine, link chia sẻ mang chữ của ngày, ảnh tải được", async ({ page, request, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page, LUAN);
  await page.addInitScript(() => { (navigator as unknown as { share?: unknown }).share = undefined; });
  const api = await (await request.post("/api/thanso/the-ngay", { data: { ho_ten: ["Nguyễn Đức Luân"], ngay: 24, thang: 10, nam: 1988 } })).json();
  expect(api.so_noi_bat.goc).toBe(6);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("so-noi-bat-ngay")).toContainText("6");
  await expect(page.getByTestId("chu-ngay")).toContainText(api.chu_ngay.ten);
  await expect(page.getByTestId("chu-ngay")).toContainText(`chữ thứ ${api.chu_ngay.chu}`);
  await page.getByTestId("the-hom-nay").getByRole("button", { name: "Chia sẻ" }).click();
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  const ma = new URL(chep.slice(chep.indexOf("http"))).searchParams.get("the")!;
  const nd = JSON.parse(Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8")) as Record<string, unknown>;
  expect(nd).toMatchObject({ s: 6, h: api.chu_ngay.chu, hn: api.chu_ngay.ten });
  expect(JSON.stringify(nd)).not.toMatch(/1988|Nguyễn/);
  expect((await request.get(`/og/ngay?ma=${encodeURIComponent(ma)}`)).headers()["content-type"]).toContain("image/png");
  const khach = await context.newPage();
  await khach.goto(`/hom-nay?the=${encodeURIComponent(ma)}`);
  await expect(khach.getByTestId("loi-moi-ngay")).toContainText(`chữ của ngày là ${api.chu_ngay.ten}`);
});

test("phái nào nói đúng: phiếu thứ 7 → gợi ý Chaldea, dùng làm phái chính, báo cáo 3 phái có chương theo phiếu", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("da_nap_phieu")) {
      localStorage.setItem("hbt.thanso_phieu", JSON.stringify({ pitago: 2, chaldea: 4, kabbalah: 0 }));
      sessionStorage.setItem("da_nap_phieu", "1");
    }
  });
  const gui: Record<string, unknown>[] = [];
  page.on("request", (r) => { if (r.url().endsWith("/api/thanso/bao-cao-ba-phai")) gui.push(r.postDataJSON() as Record<string, unknown>); });
  await page.goto("/than-so");
  const ans = await hoi(page, "Tôi hợp nghề gì?");
  const phieu = ans.getByTestId("phai-nao-dung");
  await expect(phieu.getByTestId("bau-pitago")).toContainText("Đường đời 33");
  await expect(phieu.getByTestId("bau-chaldea")).toContainText("Số tên gọi");
  await expect(phieu.getByTestId("bau-kabbalah")).toContainText("Zayin");
  await phieu.getByTestId("bau-chaldea").click();
  await expect(phieu.getByTestId("goi-y-phai")).toContainText("Chaldea (5/7");
  // PostHog chỉ nhận mã phái + số lần.
  const suKien = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const bau = suKien.filter((e) => e.su_kien === "school_voted");
  expect(bau.at(-1)).toMatchObject({ phai: "chaldea", lan: 7 });
  expect(JSON.stringify(bau)).not.toMatch(/Luân|1988|nghề/);

  await phieu.getByRole("link", { name: "Mở báo cáo 3 phái" }).click();
  await page.getByTestId("bao-cao-ba-phai").getByRole("button", { name: /Xem luận giải|Đọc miễn phí/ }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Ba phái cùng thấy gì ở bạn");
  await expect(bc).toContainText("Phái nói đúng về bạn nhất");
  await expect(bc).toContainText("Chaldea nói đúng về mình nhiều nhất (5/7)");
  expect(gui.at(-1)).toMatchObject({ phieu: { pitago: 2, chaldea: 5, kabbalah: 0 } });

  await phieu.getByRole("button", { name: "Dùng Chaldea làm phái chính" }).click();
  await expect(page.getByRole("tab", { name: "Chaldea" })).toHaveAttribute("aria-selected", "true");
});
