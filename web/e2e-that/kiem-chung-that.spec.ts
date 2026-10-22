// Rà vòng HỌC (2026-10-22) — chuỗi THẬT, không page.route: trình duyệt / request → route web thật (/api/kiem-chung,
// /api/kiem-chung/ty-le, /api/tuvi/hop-tham) → Supabase thu nhỏ chạy migration thật (0017 + 0021) → engine thật.
// Kiểm: ghi phiếu → đọc tỉ lệ (≥ 30 phiếu) → đổi ý KHÔNG cộng dồn → mã ngoài danh mục SQL bị từ chối có báo
// (`ly_do: "tu_choi"`) → loại `hai_nguoi` mới: nút trên /tu-vi ghi đúng loại/phái, tỉ lệ thấp hạ hộp (trong_so), phiếu
// "chưa đúng" của chính người đăng nhập đẩy hộp xuống cuối (ca_nhan) — điểm số không đổi.
// THỨ TỰ QUAN TRỌNG: bảng tỉ lệ ở web cache 1 giờ (unstable_cache) → mọi phiếu số đông phải ghi TRƯỚC lời đọc tỉ lệ đầu
// tiên của tiến trình web (test 1). Tệp này chạy trước sao-chuoi-that (thứ tự chữ cái, workers 1). Dựng: stack/len.sh.
import fs from "node:fs";
import { createHmac, randomBytes } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { HO_SO_MAU } from "../e2e/_hoso";

test.describe.configure({ mode: "serial" });

const SB = "http://localhost:54321";
const ENGINE = "http://127.0.0.1:8100";
const MAIL = `${process.env.SB_THU ?? "/tmp/sb-thu"}/mail`;
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const SERVICE = (() => {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role: "service_role", iss: "supabase", iat: 1700000000, exp: 2000000000 });
  return `${h}.${p}.${createHmac("sha256", "e2e-that-jwt-chi-dung-cho-kiem-thu-0123456789").update(`${h}.${p}`).digest("base64url")}`;
})();
const H = { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" };

// Mã thử: hai người theo hồ sơ mẫu (17/5/1990) + người ấy 3/4/1995 — Mệnh tương sinh, can ngũ hợp (golden e2e/fixtures).
const MA_DS = "ds.tong_quan.e2e_that.manh";
const MA_HN_DONG = "hn.chi.tam_hop.dong_nghiep";       // 30 người bấm qua route
const MA_HN_HA = "hn.menh.tuong_sinh.nguoi_yeu";      // 120 phiếu, 25% đúng → engine hạ hộp

async function rpc<T>(ham: string, than: object): Promise<T> {
  const r = await fetch(`${SB}/rest/v1/rpc/${ham}`, { method: "POST", headers: H, body: JSON.stringify(than) });
  expect(r.status, `${ham}: ${await r.clone().text()}`).toBeLessThan(300);
  return (await r.json()) as T;
}
const tyLeDb = async (mau: string) =>
  (await rpc<{ mau: string; dung: number; chua_dung: number }[]>("ty_le_kiem_chung", { p_mau: [mau], p_toi_thieu: 1 }))[0] ?? null;
const khoaNgauNhien = () => randomBytes(32).toString("hex");

async function dangNhap(page: Page, email: string) {
  await page.goto("/dang-nhap?tiep=/tu-vi");
  await page.locator("#email").fill(email);
  const tep = `${MAIL}/${email}.eml`;
  fs.rmSync(tep, { force: true });
  await page.getByRole("button", { name: "Gửi mã đăng nhập" }).click();
  await expect.poll(() => fs.existsSync(tep), { timeout: 20_000 }).toBe(true);
  const ma = fs.readFileSync(tep, "utf8").replace(/=\r?\n/g, "").match(/\b(\d{6})\b/)![1]!;
  await page.getByLabel("Mã xác nhận").fill(ma);
  await page.getByRole("button", { name: "Xác nhận" }).click();
  await expect(page).toHaveURL(/\/tu-vi/);
}

async function xemHaiNguoi(page: Page, quanHe: string) {
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: /Xem lá số 2 người/ }).click();
  const form = page.getByTestId("hop-tham-form");
  await form.getByTestId(`hop-tham-quan-he-${quanHe}`).click();
  await form.getByLabel("Ngày sinh người ấy").fill("3");
  await form.getByLabel("Tháng sinh người ấy").fill("4");
  await form.getByLabel("Năm sinh người ấy").fill("1995");
  const tra = page.waitForResponse((r) => r.url().endsWith("/api/tuvi/hop-tham") && r.request().method() === "POST");
  const di = page.waitForRequest((r) => r.url().endsWith("/api/tuvi/hop-tham"));
  await form.getByRole("button", { name: "Xem độ hợp" }).click();
  const [res, req] = await Promise.all([tra, di]);
  expect(res.status()).toBe(200);
  type HopT = { ma_mau: string; tieu_de: string };
  const kq = (await res.json()) as { diem: { tong: number; diem_manh: HopT[]; can_dung_hoa: HopT[];
    tieu_chi: { ma: string; can_cu: string[] }[] } };
  await expect(page.getByTestId("diem-hai-nguoi")).toBeVisible();
  return { kq, than: req.postDataJSON() as object };
}

/** Engine thật, KHÔNG kèm tầng HỌC → điểm + hộp gốc để so. */
async function goc(than: object) {
  const r = await fetch(`${ENGINE}/v1/tuvi/hop-tham`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(than) });
  expect(r.status).toBe(200);
  return (await r.json()) as { diem: { tong: number; diem_manh: { ma_mau: string; tieu_de: string }[]; can_dung_hoa: { ma_mau: string }[] } };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((h) => { if (!localStorage.getItem("hbt.hoso.v1")) localStorage.setItem("hbt.hoso.v1", h); }, JSON.stringify(HO_SO_MAU));
});

test("ghi phiếu → tỉ lệ ≥ 30 phiếu → đổi ý không cộng dồn → mã ngoài danh mục SQL bị từ chối (có báo)", async ({ request }) => {
  await fetch(`${SB}/rest/v1/kiem_chung_phieu?mau=in.(${[MA_DS, MA_HN_DONG, MA_HN_HA].join(",")})`, { method: "DELETE", headers: H });
  const gui = (d: object, ip: string) => request.post("/api/kiem-chung", { data: d, headers: { "x-real-ip": ip } });
  const hn = { loai: "hai_nguoi", mau: MA_HN_DONG, phai: "hai_nguoi_1" };
  const ds = { loai: "doi_song", mau: MA_DS, phai: "nam_phai_viet" };

  // 30 người khác nhau (IP khác → khoá HMAC khác) bấm "Đúng" cho mã hai_nguoi + 30 cho mã đời sống.
  for (let i = 1; i <= 30; i++) {
    for (const d of [hn, ds]) {
      const r = await gui({ ...d, ket_qua: "dung" }, `10.9.0.${i}`);
      expect(await r.json(), `${d.loai} ${i}`).toEqual({ ok: true, da_luu: true });
    }
  }
  // Người số 1 bấm lại "Chưa đúng" hai lần: đổi ý = cập nhật phiếu cũ, KHÔNG thêm phiếu.
  for (let k = 0; k < 2; k++) for (const d of [hn, ds]) expect((await (await gui({ ...d, ket_qua: "chua_dung" }, "10.9.0.1")).json()).da_luu).toBe(true);
  expect(await tyLeDb(MA_HN_DONG)).toEqual({ mau: MA_HN_DONG, dung: 29, chua_dung: 1 });
  expect(await tyLeDb(MA_DS)).toEqual({ mau: MA_DS, dung: 29, chua_dung: 1 });

  // Phiếu số đông cho mã sẽ bị hạ (ghi thẳng bằng hàm SQL — cùng đường ghi của route): 30 đúng / 90 chưa đúng.
  for (let i = 0; i < 120; i++) {
    expect(await rpc<boolean>("ghi_kiem_chung", { p_khoa: khoaNgauNhien(), p_user_id: null, p_loai: "hai_nguoi", p_mau: MA_HN_HA,
      p_phai: "hai_nguoi_1", p_ket_qua: i < 30 ? "dung" : "chua_dung" })).toBe(true);
  }

  // Mã đúng dạng web nhưng ngoài danh mục SQL ("bình hoà" không bao giờ thành hộp) → không lưu, có lý do.
  const tu = await gui({ loai: "hai_nguoi", mau: "hn.menh.binh_hoa.nguoi_yeu", phai: "hai_nguoi_1", ket_qua: "dung" }, "10.9.1.1");
  expect(await tu.json()).toEqual({ ok: true, da_luu: false, ly_do: "tu_choi" });
  expect((await gui({ ...hn, phai: "nam_phai_viet", ket_qua: "dung" }, "10.9.1.1")).status()).toBe(422);

  // Đọc tỉ lệ qua route công khai (lần đọc đầu của tiến trình web → bảng mới).
  const r = await request.get(`/api/kiem-chung/ty-le?mau=${MA_HN_DONG},${MA_DS},${MA_HN_HA},hn.can.ngu_hop.sep`);
  expect(r.status()).toBe(200);
  expect((await r.json()).ty_le).toEqual({
    [MA_HN_DONG]: { dung: 29, chua_dung: 1 }, [MA_DS]: { dung: 29, chua_dung: 1 }, [MA_HN_HA]: { dung: 30, chua_dung: 90 },
  });
});

test("Xem lá số 2 người: nút ghi phiếu loại hai_nguoi; hộp < 40% đúng (≥ 100 phiếu) bị hạ xuống 'Vì sao nói vậy', điểm giữ nguyên", async ({ page }) => {
  const { kq, than } = await xemHaiNguoi(page, "nguoi_yeu");
  const g = await goc({ ...than, trong_so: undefined, ca_nhan: undefined });
  expect(g.diem.diem_manh.map((h) => h.ma_mau)).toContain(MA_HN_HA);           // engine KHÔNG học thì có hộp này
  expect(kq.diem.tong).toBe(g.diem.tong);
  expect([...kq.diem.diem_manh, ...kq.diem.can_dung_hoa].map((h) => h.ma_mau)).not.toContain(MA_HN_HA);
  const tieuDe = g.diem.diem_manh.find((h) => h.ma_mau === MA_HN_HA)!.tieu_de;
  expect(kq.diem.tieu_chi.find((t) => t.ma === "menh")!.can_cu).toContain(`Đang xem lại: ${tieuDe}`);

  // Bấm "Chưa đúng" trên hộp đầu → một dòng phiếu loại hai_nguoi, phái hai_nguoi_1.
  const ma0 = kq.diem.diem_manh[0]?.ma_mau ?? kq.diem.can_dung_hoa[0]!.ma_mau;
  const truoc = (await tyLeDb(ma0))?.chua_dung ?? 0;
  const khoi = page.getByTestId("hai-nguoi-hop");
  const ghi = page.waitForResponse((r) => r.url().endsWith("/api/kiem-chung") && r.request().method() === "POST");
  await khoi.getByTestId("hop-noi-bat").first().getByRole("button", { name: "Chưa đúng" }).click();
  expect(await (await ghi).json()).toEqual({ ok: true, da_luu: true });
  expect((await tyLeDb(ma0))!.chua_dung).toBe(truoc + 1);
  const dong = (await (await fetch(`${SB}/rest/v1/kiem_chung_phieu?mau=eq.${ma0}&ket_qua=eq.chua_dung&select=loai,phai,user_id&order=cap_nhat.desc&limit=1`,
    { headers: H })).json()) as { loai: string; phai: string; user_id: string | null }[];
  expect(dong[0]).toEqual({ loai: "hai_nguoi", phai: "hai_nguoi_1", user_id: null });
});

test("đăng nhập: hộp chính mình bấm 'Chưa đúng' xếp cuối ở lần xem sau (ca_nhan), điểm không đổi", async ({ page }) => {
  await dangNhap(page, `kc${Date.now()}@thu.local`);
  const lan1 = await xemHaiNguoi(page, "ban_be");
  const ds1 = lan1.kq.diem.diem_manh.map((h) => h.ma_mau);
  expect(ds1.length).toBeGreaterThan(1);
  const ghi = page.waitForResponse((r) => r.url().endsWith("/api/kiem-chung") && r.request().method() === "POST");
  await page.getByTestId("hai-nguoi-hop").getByTestId("hop-noi-bat").first().getByRole("button", { name: "Chưa đúng" }).click();
  expect(await (await ghi).json()).toEqual({ ok: true, da_luu: true });
  const cua = (await (await fetch(`${SB}/rest/v1/kiem_chung_phieu?mau=eq.${ds1[0]}&user_id=not.is.null&select=loai,user_id`, { headers: H })).json()) as unknown[];
  expect(cua.length).toBe(1);

  const lan2 = await xemHaiNguoi(page, "ban_be");
  expect(lan2.kq.diem.tong).toBe(lan1.kq.diem.tong);
  expect(lan2.kq.diem.diem_manh.map((h) => h.ma_mau)).toEqual([...ds1.slice(1), ds1[0]]);
});
