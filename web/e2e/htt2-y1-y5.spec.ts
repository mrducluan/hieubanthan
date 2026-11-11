// HTT-2 mục 8 — Ý5: hộp giao thoa bấm "Đúng với mình" → máy nhớ (hbt.kc_sau.v1, loai_hoi giao_thoa) → Hôm nay hỏi lại sau
// 30 ngày bằng lời riêng của điểm giao thoa; Ý1: tuỳ chọn push có mốc "Đầu tháng: Tử vi và Bát tự" (chỉ kiểm chữ/kiểu —
// bật nhắc cần Supabase + VAPID, chuỗi thật ở e2e-that). Không LLM, không Supabase.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Ý5: bấm Đúng ở hộp giao thoa → ghi hàng Q7 với loai_hoi giao_thoa (mọi mức, kể cả thuận)", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toHaveAttribute("data-phien-ban", "doi_song_1");
  await page.route("**/api/kiem-chung", (route) => route.fulfill({ json: { ok: true } }));
  const goi = page.waitForResponse((r) => r.url().endsWith("/api/giao-thoa") && r.status() === 200);
  await page.evaluate(() => {
    for (const mau of ["ds.su_nghiep.e2e.thuan", "ds.bt.su_nghiep.e2e.thuan"]) {
      window.dispatchEvent(new CustomEvent("hbt-phieu", { detail: { loai: "doi_song", mau, phai: "nam_phai_viet", ket_qua: "dung" } }));
    }
  });
  const kq = await (await goi).json();
  const ma = (kq.hop as { ma_mau: string; loai: string }[]).find((h) => h.ma_mau === "ds.giao_thoa.cong_viec.mon.thuan.2");
  expect(ma?.loai).toBe("diem_manh");                       // hộp THUẬN — HopNoiBat không tự theo dõi, GiaoThoa phải tự ghi
  const gt = page.getByTestId("giao-thoa");
  await expect(gt).toBeVisible();
  const hop = gt.locator('[data-testid="hop-noi-bat"]', { hasText: "Tử vi và Bát tự" }).first();
  await hop.getByRole("button", { name: "Đúng với mình" }).click();
  await expect(hop.getByTestId("kiem-chung")).toHaveAttribute("data-da", "1");
  const ghi = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.kc_sau.v1") ?? "[]") as Record<string, unknown>[]);
  const g = ghi.find((x) => String(x.mau).startsWith("ds.giao_thoa."));
  expect(g).toMatchObject({ loai: "doi_song", mau: "ds.giao_thoa.cong_viec.mon.thuan.2", loai_hoi: "giao_thoa", mo_dun: "giao_thoa", da_hoi: false });
  expect(String(g?.nhan)).toContain("Tử vi và Bát tự");
  expect(JSON.stringify(ghi)).not.toMatch(/1990|Nguyễn|Hà Nội/);   // chỉ mã + nhãn hộp, không dữ liệu hồ sơ
});

test("Ý5: 31 ngày sau, Hôm nay hỏi lại bằng lời riêng của điểm giao thoa, phiếu đi qua /api/kiem-chung/sau chỉ mã", async ({ page }) => {
  await napHoSo(page);
  const ngay = new Date(Date.now() + 7 * 3_600_000 - 31 * 86_400_000).toISOString().slice(0, 10);
  await page.addInitScript((g) => localStorage.setItem("hbt.kc_sau.v1", g), JSON.stringify([
    { loai: "doi_song", mau: "ds.giao_thoa.cong_viec.mon.thuan.2", phai: "giao_thoa_1", nhan: "Tử vi và Bát tự cùng nói trúng về công việc", mo_dun: "giao_thoa", ngay, da_hoi: false, loai_hoi: "giao_thoa" },
  ]));
  const goi: unknown[] = [];
  await page.route("**/api/kiem-chung/sau", async (route) => { goi.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true, da_luu: true } }); });
  await page.goto("/hom-nay");
  const h = page.getByTestId("hoi-sau-30");
  await expect(h).toContainText("31 ngày trước hai cách xem cùng thấy điều này");
  await expect(h).toContainText("điểm chung ấy còn đúng với bạn không");
  await h.getByRole("radio", { name: "Vẫn đúng" }).click();
  await h.getByRole("button", { name: "Có ích" }).click();
  await expect(h).toContainText("Cảm ơn bạn");
  expect(goi).toEqual([{ loai: "doi_song", mau: "ds.giao_thoa.cong_viec.mon.thuan.2", phai: "giao_thoa_1", da_lam: "da_lam", thay_khac: "tot_hon", sau_ngay: 31 }]);
  await page.reload();
  await expect(page.getByTestId("hoi-sau-30")).toHaveCount(0);
});
