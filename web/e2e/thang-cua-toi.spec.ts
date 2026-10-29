// KV-THANG "Tháng của tôi" (docs/DE-XUAT-CO-CHE-V2.md): nhật ký ngày ghé trên máy (khoá theo hồ sơ) · lịch ghé tháng này
// trong khối chuỗi · lá bài vào nhật ký · tổng kết tháng trước (≥ 3 ngày, đóng được, không "mục tiêu / kỷ lục / còn N ngày")
// · thẻ chia sẻ "Tháng N của tôi" (mã ký, ảnh OG có QR, trang nhận noindex, không ngày sinh) · huy hiệu "Đủ 9 nhịp" máy ·
// xoá hồ sơ xoá cả dấu mốc trên máy. Chuỗi thật (tài khoản, 0032): e2e-that/sao-chuoi-that.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import { docNhatKy, ghiGhe, ghiLa, maHoSo, thangDu9, thangTruoc, thongKeThang, type MucNhatKy } from "../lib/nhat-ky-ngay";
import { loiTheThang, loiTongKet, nenHienTongKet, NGUONG_NGAY_TONG_KET } from "../lib/tong-ket-thang";
import { cotMungMot, oLichThang, soNgayTrongThang } from "../lib/lich-thang";
import { DANH_MUC, gopHuyHieu } from "../lib/huy-hieu";

// Cụm cấm của khối chuỗi / huy hiệu + riêng cho tổng kết: không so hơn ai, không mục tiêu / kỷ lục / đếm ngược / hứa Sao.
const TU_CAM = /trúng|thưởng|quay số|vòng quay|đếm ngược|sắp mất|mất chuỗi|đừng để|kẻo|nhanh lên|hết hạn|mua huy hiệu|hơn \d+%|giỏi hơn|kỷ lục|mục tiêu|\d+ trong 9|còn \d+ ngày|thất bại|bỏ lỡ/i;
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
const homNayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Nhật ký tháng trước gieo sẵn: `soNgay` ngày đầu tháng, số ngày cá nhân xoay 1..9, 2 lá đã lật. */
function nhatKyThangTruoc(hoSo: typeof HO_SO_MAU, soNgay: number): string {
  const { nam, thang } = thangTruoc(homNayVn());
  const ds: MucNhatKy[] = Array.from({ length: soNgay }, (_, i) => ({ n: ymd(nam, thang, i + 1), s: (i % 9) + 1, k: 4, ...(i < 2 ? { l: "viec" } : {}) }));
  return JSON.stringify({ h: maHoSo(hoSo), ds });
}

test("hàm thuần: nhật ký khoá theo hồ sơ, thống kê tháng, đủ 9 nhịp, lịch tháng, lời tổng kết không cụm cấm", () => {
  // Lịch dương thuần
  expect(soNgayTrongThang(2026, 2)).toBe(28);
  expect(soNgayTrongThang(2028, 2)).toBe(29);
  expect(cotMungMot(2026, 10)).toBe(3);   // 1/10/2026 là thứ Năm → cột 3 (T2 = 0)
  const o = oLichThang(2026, 10);
  expect(o.slice(0, 4)).toEqual([null, null, null, 1]);
  expect(o.length % 7).toBe(0);
  expect(o.filter((x) => x !== null)).toHaveLength(31);

  // Thống kê + đủ 9 nhịp
  const ds: MucNhatKy[] = Array.from({ length: 12 }, (_, i) => ({ n: ymd(2026, 9, i + 1), s: (i % 9) + 1, k: 7, ...(i % 3 === 0 ? { l: "gio" } : {}) }));
  const tk = thongKeThang(ds, 2026, 9);
  expect(tk).toMatchObject({ nam: 2026, thang: 9, so_ngay: 12, so_la: 4, so_khac: 9, du_9: true, thang_ca_nhan: 7 });
  expect(tk.ngay).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  expect(thongKeThang(ds, 2026, 10).so_ngay).toBe(0);
  expect(thangDu9(ds)).toEqual({ nam: 2026, thang: 9, ngay_cuoi: "2026-09-12" });
  expect(thangDu9(ds.slice(0, 8))).toBeNull();
  expect(thangTruoc("2026-01-15")).toEqual({ nam: 2025, thang: 12 });

  // Hiện tổng kết: ≥ 3 ngày và chưa đóng tháng đó
  expect(NGUONG_NGAY_TONG_KET).toBe(3);
  expect(nenHienTongKet({ nam: 2026, thang: 9, so_ngay: 2 }, null)).toBe(false);
  expect(nenHienTongKet({ nam: 2026, thang: 9, so_ngay: 3 }, null)).toBe(true);
  expect(nenHienTongKet({ nam: 2026, thang: 9, so_ngay: 9 }, "2026-09")).toBe(false);
  expect(nenHienTongKet({ nam: 2026, thang: 9, so_ngay: 9 }, "2026-08")).toBe(true);

  // Lời kể: thì quá khứ, không nêu hội viên / lưu hồ sơ, không cụm cấm
  const ten = (ma: string) => DANH_MUC[ma as keyof typeof DANH_MUC]?.ten ?? ma;
  const cau = loiTongKet({ ...tk, huy_hieu_moi: ["hen_7", "hoi_vien", "da_luu_ho_so"] }, ten);
  expect(cau[0]).toBe("Tháng 9 bạn ghé Hôm nay 12 buổi sáng.");
  expect(cau).toContain("Bạn đã lật 4 lá bài đầu ngày.");
  expect(cau).toContain("Bạn đã đi qua đủ 9 nhịp ngày cá nhân trong tháng.");
  expect(cau).toContain("Dấu mốc mới trong tháng: Giữ lời hẹn 7 ngày.");
  expect(cau.join(" ")).not.toMatch(/Hội viên|Lưu hồ sơ/);
  expect(cau.join(" ")).not.toMatch(TU_CAM);
  expect(loiTongKet({ ...thongKeThang(ds.slice(0, 1), 2026, 9), huy_hieu_moi: [] }, ten)).toEqual(["Tháng 9 bạn ghé Hôm nay một buổi sáng.", "Bạn đã lật một lá bài đầu ngày.", "Theo thần số, tháng 9 là tháng cá nhân 7 của bạn."]);
  expect(loiTongKet({ ...thongKeThang(ds.slice(0, 6), 2026, 9), huy_hieu_moi: [] }, ten)).toContain("Bạn đã đi qua 6 nhịp ngày cá nhân khác nhau.");
  expect(loiTheThang({ thang: 9, so_ngay: 12, k: 7 })).toBe("Tháng 9 mình ghé Hôm nay 12 buổi sáng — tháng cá nhân 7 của mình. Còn tháng này của bạn là tháng mấy?");
  expect(loiTheThang({ thang: 9, so_ngay: 1, k: null })).not.toMatch(TU_CAM);

  // Huy hiệu: bản máy ẩn khi tài khoản đã đạt; tên / điều kiện không cụm cấm
  const may = [{ ma: "du_9_nhip_may" as const, dat: true, luc: "2026-09-12", nguon: "may" as const }];
  expect(gopHuyHieu([{ ma: "du_9_nhip", dat: true, luc: "2026-09-12" }], may).map((h) => h.ma)).toEqual(["du_9_nhip"]);
  expect(gopHuyHieu([{ ma: "du_9_nhip", dat: false, luc: null }], may).map((h) => h.ma)).toEqual(["du_9_nhip", "du_9_nhip_may"]);
  expect(gopHuyHieu(null, may).map((h) => h.ma)).toEqual(["du_9_nhip_may"]);
  for (const d of Object.values(DANH_MUC)) expect(`${d.ten} ${d.dieu_kien}`).not.toMatch(TU_CAM);
});

test("nhật ký trên máy: Hôm nay ghi ngày + số; lật lá ghi lá; hồ sơ khác không thừa kế; xoá hồ sơ xoá dấu mốc", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
  const so = Number(await page.getByTestId("so-ngay-ca-nhan").innerText());
  const hom = homNayVn();
  const doc = () => page.evaluate(([h]) => {
    const j = JSON.parse(localStorage.getItem("hbt.nhat_ky.v1") ?? "null") as { h: string; ds: { n: string; s: number; k?: number; l?: string }[] } | null;
    return j && { h: j.h, dong: j.ds.find((m) => m.n === h) ?? null, tong: j.ds.length };
  }, [hom]);
  await expect.poll(doc).toMatchObject({ h: maHoSo(HO_SO_MAU), dong: { n: hom, s: so }, tong: 1 });
  expect((await doc())!.dong!.k).toBeGreaterThanOrEqual(1);
  // Lịch tháng này trong khối chuỗi: hôm nay sáng
  const lich = page.getByTestId("chuoi-lich");
  await expect(lich).toHaveAttribute("data-so-ngay", "1");
  await expect(lich.locator("[data-ghe]")).toHaveText(String(Number(hom.slice(8, 10))));
  // Lật lá → nhật ký có lá + dòng "Lá đầu tiên của tháng này."
  await page.getByTestId("la-bai-up").click();
  await expect(page.getByTestId("la-bai-noi-dung")).toBeVisible();
  await expect(page.getByTestId("la-bai-thang")).toHaveText("Lá đầu tiên của tháng này.");
  await expect.poll(async () => (await doc())!.dong!.l).toMatch(/^(viec|cau_hoi|gio)$/);
  // Hồ sơ khác trên cùng máy (trang mới — không có init script ghi đè hồ sơ) → nhật ký của người trước không hiện (băm khác), tạo nhật ký mới
  const mai = { ...HO_SO_MAU, ho_ten: "Trần Thị Mai", ngay: 3, thang: 3, nam: 1988 };
  const p2 = await page.context().newPage();
  await p2.goto("/");
  await p2.evaluate((h) => { localStorage.setItem("hbt.hoso.v1", h); localStorage.setItem("hbt.dong_y_dl.v1", JSON.stringify({ phien_ban: "dl1", luc: "2026-09-30T00:00:00Z" })); }, JSON.stringify(mai));
  await p2.goto("/hom-nay");
  await expect(p2.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
  const doc2 = () => p2.evaluate(([h]) => {
    const j = JSON.parse(localStorage.getItem("hbt.nhat_ky.v1") ?? "null") as { h: string; ds: { n: string; l?: string }[] } | null;
    return j && { h: j.h, dong: j.ds.find((m) => m.n === h) ?? null, tong: j.ds.length };
  }, [hom]);
  await expect.poll(doc2).toMatchObject({ h: maHoSo(mai), tong: 1 });
  expect((await doc2())!.dong!.l).toBeUndefined();
  // Xoá hồ sơ ở Tài khoản → mọi khoá theo hồ sơ (nhật ký, chuỗi máy, lá, hẹn…) bị xoá
  await p2.goto("/tai-khoan");
  await p2.getByRole("button", { name: "Xoá khỏi máy" }).click();
  await p2.getByRole("dialog").getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(p2.getByTestId("ho-so-may")).toContainText("Tạo hồ sơ");
  await expect.poll(() => p2.evaluate(() => ["hbt.nhat_ky.v1", "hbt.hom_nay", "hbt.la_bai.v1", "hbt.hen.v1", "hbt.huy_hieu_may.v1"].filter((k) => localStorage.getItem(k) !== null))).toEqual([]);
});

test("tổng kết tháng trước: dưới 3 ngày không hiện; đủ → lịch + câu kể + lối '12 tháng tới' + đóng được; huy hiệu Đủ 9 nhịp máy", async ({ page }) => {
  // Dưới ngưỡng (2 ngày) — trang riêng, hồ sơ + nhật ký đặt qua evaluate (không init script ghi đè).
  const it = await page.context().newPage();
  await it.goto("/");
  await it.evaluate(([h, nk]) => { localStorage.setItem("hbt.hoso.v1", h!); localStorage.setItem("hbt.nhat_ky.v1", nk!); localStorage.setItem("hbt.dong_y_dl.v1", JSON.stringify({ phien_ban: "dl1", luc: "2026-09-30T00:00:00Z" })); },
    [JSON.stringify(HO_SO_MAU), nhatKyThangTruoc(HO_SO_MAU, 2)] as [string, string]);
  await it.goto("/hom-nay");
  await expect(it.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
  await it.waitForTimeout(800);
  await expect(it.getByTestId("tong-ket-thang")).toHaveCount(0);
  await it.evaluate(() => localStorage.removeItem("hbt.nhat_ky.v1"));   // cùng context → không để nhật ký 2 ngày đè lên bước sau
  await it.close();

  await napHoSo(page);
  await page.addInitScript((nk) => { if (!localStorage.getItem("hbt.nhat_ky.v1")) localStorage.setItem("hbt.nhat_ky.v1", nk); }, nhatKyThangTruoc(HO_SO_MAU, 12));
  await page.goto("/hom-nay");
  const tk = page.getByTestId("tong-ket-thang");
  await expect(tk).toBeVisible({ timeout: 45_000 });
  const { thang } = thangTruoc(homNayVn());
  await expect(tk).toHaveAttribute("data-nguon", "may");
  await expect(tk).toHaveAttribute("data-so-ngay", "12");
  await expect(tk.getByRole("heading", { level: 2 })).toHaveText(`Tháng ${thang} vừa rồi của bạn`);
  await expect(tk.getByTestId("tong-ket-lich").locator("[data-ghe]")).toHaveCount(12);
  const cau = tk.getByTestId("tong-ket-cau");
  await expect(cau).toContainText(`Tháng ${thang} bạn ghé Hôm nay 12 buổi sáng.`);
  await expect(cau).toContainText("Bạn đã lật 2 lá bài đầu ngày.");
  await expect(cau).toContainText("đủ 9 nhịp");
  await expect(cau).toContainText(`tháng ${thang} là tháng cá nhân 4 của bạn`);
  await expect(tk.getByTestId("tong-ket-thang-nay")).toContainText("tháng cá nhân");   // tháng này từ engine (/hom-nay)
  const cta = tk.getByTestId("tong-ket-12-thang");
  await expect(cta).toHaveAttribute("href", "/than-so#ban-do-con-so");
  await expect(cta).toContainText("Đang miễn phí");   // e2e thường: công tắc thu Sao tắt
  expect(await tk.innerText()).not.toMatch(TU_CAM);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "recap_viewed", so_thang: thang, so_ngay: 12, nguon: "may", tu: "hom_nay" }));
  // Đóng → không hiện lại (máy nhớ tháng đã đóng), đo recap_closed
  await tk.getByTestId("tong-ket-dong").click();
  await expect(page.getByTestId("tong-ket-thang")).toHaveCount(0);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "recap_closed", so_thang: thang }));
  await page.reload();
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("tong-ket-thang")).toHaveCount(0);
  // Bản thân: huy hiệu "Đủ 9 nhịp" (máy) đã đạt, tổng kết ở Bản thân tôn trọng "đã đóng"
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 45_000 });
  await expect(hh.getByTestId("hh-du_9_nhip_may")).toHaveAttribute("data-dat", "1");
  await expect(hh.getByTestId("hh-du_9_nhip_may")).toContainText("Đủ 9 nhịp một tháng");
  await expect(page.getByTestId("tong-ket-thang")).toHaveCount(0);
  await expect(page.getByTestId("dong-hoi-vien")).toHaveCount(0);   // chưa bật tài khoản
});

test("thẻ 'Tháng của tôi': máy chủ ký (engine tính tháng cá nhân) → link /the/thang/…?tu=tk., ảnh PNG có QR, trang nhận không ngày sinh", async ({ page, context, request }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.addInitScript((nk) => { (navigator as unknown as { share?: unknown }).share = undefined; localStorage.setItem("hbt.nhat_ky.v1", nk); }, nhatKyThangTruoc(HO_SO_MAU, 5));
  await page.goto("/ban-than");
  const tk = page.getByTestId("tong-ket-thang");
  await expect(tk).toBeVisible({ timeout: 45_000 });
  await expect(tk.getByTestId("tong-ket-thang-nay")).toHaveCount(0);   // Bản thân đã có nhịp tháng này ở khối trên
  await tk.getByTestId("tong-ket-chia-se").click();
  await expect(tk.getByTestId("tong-ket-chia-se")).toContainText("Đã chép link", { timeout: 20_000 });
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  const { thang, nam } = thangTruoc(homNayVn());
  expect(chep).toContain(`Tháng ${thang} mình ghé Hôm nay 5 buổi sáng.`);
  const url = new URL(chep.slice(chep.indexOf("http")));
  expect(url.pathname).toMatch(/^\/the\/thang\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{16}$/);
  const tu = url.searchParams.get("tu")!;
  expect(tu).toMatch(/^tk\.[0-9a-f]{10}$/);
  for (const s of ["1990", "17/5", "Luân"]) expect(chep).not.toContain(s);
  expect(decodeURIComponent(url.pathname)).not.toMatch(/1990|Luân/);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "share_created", kind: "thang", ma_moi: tu, co_ma: false }));
  const ma = url.pathname.split("/").pop()!;
  // Ảnh: ngang + dọc, mã giả → vẫn PNG (ảnh mời chung)
  for (const q of [`ma=${ma}`, `ma=${ma}&tu=${tu}&khung=doc`, "ma=gia.gia", ""]) {
    const r = await request.get(`/og/thang?${q}`);
    expect(r.status(), q).toBe(200);
    expect(r.headers()["content-type"], q).toContain("image/png");
  }
  await expect(tk.getByTestId("tong-ket-tai-anh")).toHaveAttribute("href", `/og/thang?ma=${encodeURIComponent(ma)}&tu=${tu}&khung=doc`);
  // Trang nhận: noindex, lịch 5 ngày sáng, tháng cá nhân, CTA mang ?tu, không ngày sinh / chuỗi / huy hiệu
  const html = await (await request.get(url.pathname + url.search)).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
  expect(html).toContain(`/og/thang?ma=${encodeURIComponent(ma)}`);
  await page.goto(url.pathname + url.search);
  const the = page.getByTestId("the-thang");
  await expect(the).toHaveAttribute("data-so-ngay", "5");
  await expect(the.getByRole("heading", { level: 1 })).toHaveText("5 buổi sáng được thắp");
  await expect(the.getByTestId("the-thang-k")).toContainText(`tháng ${thang} là tháng cá nhân`);
  await expect(the.getByTestId("the-thang-lich").locator("[data-ghe]")).toHaveCount(5);
  await expect(the.getByTestId("the-thang-moi")).toHaveAttribute("href", `/hom-nay?tu=${tu}`);
  const chu = await the.innerText();
  expect(chu).not.toMatch(TU_CAM);
  for (const s of ["1990", "17/5", "chuỗi", "Hội viên"]) expect(chu).not.toContain(s);
  expect(chu).toContain(String(nam));   // năm xem (không phải năm sinh)
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "share_clicked" && e.ma_moi === tu)).toBe(true);
  // Mã giả / hết hạn → trang mời chung
  await page.goto("/the/thang/abc.def");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thẻ không còn hiệu lực");
  // API từ chối tháng tương lai và thiếu ngày
  const [y, m] = homNayVn().split("-").map(Number) as [number, number];
  const tuongLai = m === 12 ? { nam_xem: y + 1, thang_xem: 1 } : { nam_xem: y, thang_xem: m + 1 };
  expect((await request.post("/api/chia-se/thang", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990, ...tuongLai, ngay_ghe: [1] } })).status()).toBe(422);
  expect((await request.post("/api/chia-se/thang", { data: { ten_hien_thi: "A", ngay: 17, thang: 5, nam: 1990, nam_xem: y, thang_xem: m, ngay_ghe: [] } })).status()).toBe(422);
});

test("chuỗi chạm mốc 7 ngày (máy): có nút chia sẻ; chưa chạm thì không", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.addInitScript((ngay) => {
    (navigator as unknown as { share?: unknown }).share = undefined;
    const homQua = new Date(Date.parse(`${ngay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    localStorage.setItem("hbt.hom_nay", JSON.stringify({ ngay: homQua, chuoi: 6 }));
  }, homNayVn());
  await page.goto("/hom-nay");
  await expect(page.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 7 ngày liên tiếp", { timeout: 45_000 });
  await page.getByTestId("chuoi-chia-se").click();
  await expect(page.getByTestId("chuoi-chia-se")).toContainText("Đã chép link", { timeout: 20_000 });
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  expect(chep).toContain("7 ngày liền");
  expect(chep).toMatch(/\/hom-nay\?tu=hn\.[0-9a-f]{10}/);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "share_created", kind: "chuoi_moc" }));
  const p2 = await page.context().newPage();   // trang mới: không init script ghi đè chuỗi
  await p2.goto("/");
  await p2.evaluate(([h, ngay]) => { localStorage.setItem("hbt.hoso.v1", h!); localStorage.setItem("hbt.hom_nay", JSON.stringify({ ngay, chuoi: 8 })); localStorage.setItem("hbt.dong_y_dl.v1", JSON.stringify({ phien_ban: "dl1", luc: "2026-09-30T00:00:00Z" })); }, [JSON.stringify(HO_SO_MAU), homNayVn()] as [string, string]);
  await p2.goto("/hom-nay");
  await expect(p2.getByTestId("chuoi-chinh")).toHaveText("Bạn ghé 8 ngày liên tiếp", { timeout: 45_000 });
  await expect(p2.getByTestId("chuoi-chia-se")).toHaveCount(0);
});
