// CT-2 — chụp lòng bàn tay ở /chi-tay. CI không có camera, bộ tìm điểm mốc cần WebAssembly + mô hình → test phần tất định:
// (1) cổng thoả thuận ct2 (nút chụp / tải khoá tới khi tích ô), (2) route /api/chi-tay/do-tay từ chối khi thiếu `dong_y`,
// (3) luồng đầy đủ với 21 điểm dựng sẵn qua móc `window.__ctTest` (chỉ có ở bản dev / bản build e2e `NEXT_PUBLIC_E2E=1`) và
// phản hồi engine giả theo hợp đồng `docs/CHI-TAY-ANH.md`: vòng cung hiện trên ảnh, chạm cung → lựa chọn, chọn rồi "Xem sách
// xưa nói gì" gửi kèm `cung`; trên máy chỉ nhớ MÃ, không toạ độ, không ảnh.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** 21 điểm bàn tay xoè (toạ độ 0..1, dựng tay — chỉ để vẽ; phép đo là của engine giả). */
const DIEM: [number, number][] = [
  [0.5, 0.9], [0.38, 0.84], [0.3, 0.76], [0.25, 0.68], [0.21, 0.61],
  [0.4, 0.55], [0.38, 0.43], [0.37, 0.35], [0.36, 0.28],
  [0.5, 0.53], [0.5, 0.4], [0.5, 0.31], [0.5, 0.23],
  [0.59, 0.55], [0.61, 0.43], [0.62, 0.35], [0.63, 0.29],
  [0.67, 0.6], [0.71, 0.51], [0.73, 0.45], [0.75, 0.4],
];

const KQ_DO = {
  hop_le: true, loi: null,
  so_do: { dai_long: 1, rong_long: 0.86, ngon: { cai: 0.55, tro: 0.72, giua: 0.83, ap_ut: 0.76, ut: 0.6 }, tro_ap_ut: 0.95 },
  nhan: [{ ma: "ngon_dai", ten: "Ngón tay dài so với lòng bàn tay", vua: false }],
  sach_ghi: [{ ma: "chi_tiem_truong", han: "指纖長者", nhom: "A", loi: "Sách xưa ghi «指纖長者» — ngón tay thon dài, người nhanh hiểu.", viec: "Ghi lại ý hay mỗi ngày." }],
  cung: [
    { ma: "ly", han: "離", ten: "Gò dưới ngón giữa (cung Ly)", vt: [0.5, 0.6], y: "Sách xưa gắn cung Ly với danh tiếng, công danh.",
      lua_chon: [{ ma: "day", ten: "Gò nổi đầy" }, { ma: "trung", ten: "Trũng / phẳng" }, { ma: "van_cat", ten: "Có vân cắt ngang, vết" }, { ma: "binh_thuong", ten: "Bình thường" }] },
    { ma: "can", han: "乾", ten: "Gò mép bàn tay dưới ngón út (cung Càn)", vt: [0.66, 0.78], y: "Sách xưa gắn cung Càn với cha.",
      lua_chon: [{ ma: "day", ten: "Gò nổi đầy" }, { ma: "trung", ten: "Trũng / phẳng" }] },
    { ma: "minh_duong", han: "明堂", ten: "Giữa lòng bàn tay (Minh Đường)", vt: [0.5, 0.7], y: "Lòng bàn tay.",
      lua_chon: [{ ma: "trung", ten: "Hơi trũng" }, { ma: "binh_thuong", ten: "Bình thường" }] },
  ],
  bo_nhom_c: 0, cau_ket: "Ghi chép của người xưa, không phải lời đoán riêng cho bạn.",
};

const ANH = readFileSync(join(__dirname, "..", "public", "anh", "do-hinh", "bat-quai-ban-tay.webp"));

async function moTrang(page: Page, moc: unknown) {
  await page.addInitScript((m) => { (window as unknown as { __ctTest: unknown }).__ctTest = m; }, moc);
  await page.goto("/chi-tay");
  await expect(page.getByTestId("chup-ban-tay")).toBeVisible();
}

test("chụp lòng bàn tay: nút chụp / tải khoá tới khi tích thoả thuận ct2", async ({ page }) => {
  await page.goto("/chi-tay");
  const khoi = page.getByTestId("chup-ban-tay");
  // khối chụp đứng TRƯỚC đồ hình sách
  const yKhoi = (await khoi.boundingBox())!.y;
  const yDoHinh = (await page.locator("#tam-cung").boundingBox())!.y;
  expect(yKhoi).toBeLessThan(yDoHinh);
  await expect(page.getByTestId("ct-chup")).toBeDisabled();
  await expect(page.getByTestId("ct-tai")).toBeDisabled();
  await expect(page.getByTestId("ct-dong-y")).not.toBeChecked();
  await page.getByTestId("ct-dong-y").check();
  await expect(page.getByTestId("ct-chup")).toBeEnabled();
  await expect(page.getByTestId("ct-tai")).toBeEnabled();
  await expect(page.getByTestId("ct-input-chup")).toHaveAttribute("capture", "environment");
});

test("route /api/chi-tay/do-tay: thiếu dong_y → 422; doc không vân không cung → 422", async ({ request }) => {
  const r = await request.post("/api/chi-tay/do-tay", { data: { tay: "trai", ty_le: 0.75, diem: DIEM } });
  expect(r.status()).toBe(422);
  const r2 = await request.post("/api/chi-tay/do-tay", { data: { dong_y: false, tay: "trai", ty_le: 0.75, diem: DIEM } });
  expect(r2.status()).toBe(422);
  const r3 = await request.post("/api/chi-tay/do-tay", { data: { dong_y: true, tay: "trai", ty_le: 0.75, diem: DIEM.slice(0, 20) } });
  expect(r3.status()).toBe(422);
  const r4 = await request.post("/api/chi-tay/doc", { data: {} });
  expect(r4.status()).toBe(422);
  const r5 = await request.post("/api/chi-tay/doc", { data: { cung: { "LY": "day" } } });
  expect(r5.status()).toBe(422);
});

test("chụp lòng bàn tay (móc 21 điểm + engine giả): vòng cung trên ảnh → chọn → đọc sách gửi kèm cung", async ({ page }) => {
  const doTay: unknown[] = [];
  await page.route("**/api/chi-tay/do-tay", async (route) => {
    doTay.push(route.request().postDataJSON());
    await route.fulfill({ json: KQ_DO });
  });
  const docBody: unknown[] = [];
  await page.route("**/api/chi-tay/doc", async (route) => {
    docBody.push(route.request().postDataJSON());
    // hình dạng engine thật: câu theo cung ở `muc_cung` (có `cung`, không có `ten`)
    await route.fulfill({ json: { muc: [], muc_cung: [{ ma: "ly-cao", han: "若起文官加祿位", nhom: "A", y: "Gò Ly nổi cao…", loi: "Sách xưa ghi «若起文官加祿位» — Gò Ly nổi cao.", cung: "ly", lua_chon: "day" }], bo_nhom_c: 0, cau_ket: "", khong_ro: [] } });
  });
  await moTrang(page, { diem: DIEM });

  await page.getByTestId("ct-dong-y").check();
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay.webp", mimeType: "image/webp", buffer: ANH });

  // engine giả trả 3 cung → 3 vòng trên ảnh + khung xương 21 điểm
  await expect(page.getByTestId("ct-cung")).toHaveCount(3);
  await expect(page.getByTestId("ct-xuong").locator("circle")).toHaveCount(21);
  await expect(page.getByTestId("ct-nhan")).toContainText("Ngón tay dài");
  await expect(page.getByTestId("ct-sach-ghi")).toContainText("指纖長者");

  // chỉ 21 toạ độ + tỉ lệ + tay đi lên, kèm đồng ý; không ảnh
  expect(doTay).toHaveLength(1);
  const b = doTay[0] as Record<string, unknown>;
  expect(Object.keys(b).sort()).toEqual(["diem", "dong_y", "tay", "ty_le"]);
  expect(b.dong_y).toBe(true);
  expect(b.tay).toBe("trai");
  expect((b.diem as unknown[]).length).toBe(21);

  // chạm cung Ly → thẻ nghĩa + lựa chọn
  await page.locator("[data-testid=ct-cung][data-ma=ly]").click();
  const the = page.getByTestId("ct-the-cung");
  await expect(the).toContainText("cung Ly");
  await expect(the.getByTestId("ct-lua-chon")).toHaveCount(4);
  await the.locator("[data-testid=ct-lua-chon][data-ma=day]").click();
  await expect(the.locator("[data-testid=ct-lua-chon][data-ma=day]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("ct-den-doc")).toContainText("1 cung");

  // trên máy chỉ nhớ mã — không toạ độ
  const luu = await page.evaluate(() => localStorage.getItem("hbt.chi_tay.v1"));
  expect(JSON.parse(luu!)).toMatchObject({ cung: { ly: "day" }, van: [] });
  expect(luu).not.toContain("0.");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.dong_y_chi_tay.v1") ?? "null")?.phien_ban)).toBe("ct2");

  // khối "Xem sách xưa nói gì" phía dưới gửi kèm cung (không cần chọn vân)
  await expect(page.getByTestId("chon-tom-tat")).toContainText("1 cung trên ảnh tay");
  await page.getByTestId("doc-van-tay").click();
  await expect(page.getByTestId("ket-qua-van-tay")).toContainText("若起文官加祿位");
  await expect(page.getByTestId("kq-cung")).toContainText("cung Ly");   // tên cung lấy từ đồ hình sách
  expect(docBody).toHaveLength(1);
  expect(docBody[0]).toEqual({ cung: { ly: "day" } });

  // sự kiện đo lường chỉ mã
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; kind?: string }[] }).__hbt_su_kien ?? []);
  const kinds = sk.filter((e) => e.su_kien === "chart_interacted").map((e) => e.kind);
  expect(kinds).toEqual(expect.arrayContaining(["chup_tay", "chup_tay_xong", "cung_tay"]));

  // rút thoả thuận → bỏ ảnh, khoá lại nút chụp; mã lựa chọn cung vẫn giữ (không phải dữ liệu ảnh)
  await page.getByTestId("chup-ban-tay").getByRole("button", { name: "Rút thoả thuận" }).click();
  await expect(page.getByTestId("ct-khung")).toHaveCount(0);
  await expect(page.getByTestId("ct-dong-y")).not.toBeChecked();
  await expect(page.getByTestId("ct-chup")).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong_y_chi_tay.v1"))).toBeNull();
});

test("chụp lòng bàn tay: ảnh không hợp lệ (engine) → lời nhắc + Chụp lại", async ({ page }) => {
  await page.route("**/api/chi-tay/do-tay", (route) => route.fulfill({ json: { hop_le: false, loi: "mu_ban_tay", loi_nhac: "Ảnh có vẻ là mu bàn tay — lật tay lại.", nhan: [], sach_ghi: [], cung: [], bo_nhom_c: 0, cau_ket: "" } }));
  await moTrang(page, { diem: DIEM });
  await page.getByTestId("ct-dong-y").check();
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay.webp", mimeType: "image/webp", buffer: ANH });
  const loi = page.getByTestId("ct-loi");
  await expect(loi).toContainText("mu bàn tay");
  await expect(loi.getByTestId("ct-chup-lai")).toBeVisible();
  await expect(page.getByTestId("ct-cung")).toHaveCount(0);
});

test("chụp lòng bàn tay: bộ tìm điểm mốc không chạy được → chỉ lối tự soi, không gọi máy chủ", async ({ page }) => {
  let goi = 0;
  await page.route("**/api/chi-tay/do-tay", (route) => { goi++; return route.fulfill({ json: KQ_DO }); });
  await moTrang(page, { trang_thai: "loi" });
  await page.getByTestId("ct-dong-y").check();
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay.webp", mimeType: "image/webp", buffer: ANH });
  const loi = page.getByTestId("ct-loi");
  await expect(loi).toContainText("chưa chạy được");
  await expect(loi.locator("a[href='#tu-soi']")).toBeVisible();
  expect(goi).toBe(0);
});

test("chọn vân trên điện thoại 390×844: thanh 'Xem sách xưa' nằm trên tab dưới; phóng to hình; kết quả cuộn tới + tiêu điểm", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/chi-tay/doc", (route) => route.fulfill({ json: { muc: [{ ma: "bai-tuong", ten: "Vân Bái Tướng", ten_han: "拜相紋", loi: "Sách xưa ghi «拜相紋» — thử." }], bo_nhom_c: 0, cau_ket: "" } }));
  await page.goto("/chi-tay");
  // phóng to một hình → hộp có ảnh đủ + lời; "Giống tay tôi" chọn luôn
  await page.locator("[data-testid=phong-van][data-ma=bai-tuong]").click();
  const hop = page.getByTestId("phong-van-hop");
  await expect(hop).toBeVisible();
  await hop.getByTestId("phong-van-chon").click();
  await expect(hop.getByTestId("phong-van-chon")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(hop).toHaveCount(0);
  await expect(page.locator("[data-testid=nut-van][data-ma=bai-tuong]")).toHaveAttribute("aria-pressed", "true");

  // nút trong thanh dính không bị tab dưới che
  const nut = page.getByTestId("doc-van-tay");
  await nut.scrollIntoViewIfNeeded();
  const trung = await nut.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return o === el || el.contains(o);
  });
  expect(trung).toBe(true);
  // không có ô báo lỗi rỗng
  await expect(page.getByTestId("chon-van-tay").locator("[role=alert]")).toHaveCount(0);

  await nut.click();
  const tieuDe = page.getByTestId("ket-qua-van-tay").getByRole("heading");
  await expect(tieuDe).toBeFocused();
  await expect(tieuDe).toBeInViewport();
  await expect(page.getByTestId("co-ket-qua")).toHaveAttribute("href", "#ket-qua-chi-tay");
});

test("engine thật: /api/chi-tay/do-tay đo 21 điểm → hợp lệ, có cung đặt trên ảnh; lựa chọn cung đọc được sách", async ({ request }) => {
  const r = await request.post("/api/chi-tay/do-tay", { data: { dong_y: true, tay: "trai", ty_le: 0.75, diem: DIEM } });
  expect(r.status()).toBe(200);
  const d = await r.json() as { hop_le: boolean; cung: { ma: string; vt: number[]; lua_chon: { ma: string }[] }[] };
  expect(d.hop_le).toBe(true);
  expect(d.cung.length).toBeGreaterThanOrEqual(8);
  for (const c of d.cung) { expect(c.vt[0]).toBeGreaterThanOrEqual(0); expect(c.vt[1]).toBeLessThanOrEqual(1); }
  const c0 = d.cung.find((c) => c.ma === "ly")!;
  const r2 = await request.post("/api/chi-tay/doc", { data: { cung: { ly: c0.lua_chon[0]!.ma } } });
  expect(r2.status()).toBe(200);
});

test("hai bàn tay song song (engine thật): tải cả Trái + Phải → so sánh Tiên Thiên/Hậu Thiên, 4 đường, 7 Gò đối chiếu Bát Quái và 3 chỉ số hình học", async ({ page }) => {
  const DIEM_PHAI: [number, number][] = DIEM.map(([x, y]) => [Number((1 - x).toFixed(4)), y]);
  await moTrang(page, { diem_trai: DIEM, diem_phai: DIEM_PHAI });
  await page.getByTestId("ct-dong-y").check();

  // Tải Tay Trái (đang active)
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay-trai.webp", mimeType: "image/webp", buffer: ANH });
  await expect(page.getByTestId("ct-tong-hop-dong-tay")).toBeVisible({ timeout: 15_000 });

  // Chuyển sang Tay Phải và tải ảnh Tay Phải song song (không ghi đè Tay Trái)
  await page.getByTestId("ct-tay-phai").click();
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay-phai.webp", mimeType: "image/webp", buffer: ANH });

  await expect(page.getByTestId("ct-so-sanh-hai-tay")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("ct-so-sanh-hai-tay")).toContainText("Tiên Thiên");
  await expect(page.getByTestId("ct-chi-so-mo-rong")).toBeVisible();
  await expect(page.getByTestId("ct-chi-so-mo-rong")).toContainText("ngón cái");
  await expect(page.getByTestId("ct-duong-kinh-dien")).toContainText("Đường Sự Nghiệp");

  const bayGo = page.getByTestId("ct-bay-go-dong-tay");
  await bayGo.locator("> summary").click();
  await expect(bayGo).toContainText("Gò Mộc Tinh");
  await expect(bayGo).toContainText("cung Tốn");
});

// PR #338 — đường chỉ máy dò là ước lượng: người dùng báo "Chưa khớp" → ẩn lớp phủ của tay đó + lượt đo lại KHÔNG gửi tín hiệu.
test("ba đường chỉ máy dò: thân gửi chỉ có con số (không polylines); 'Chưa khớp' → ẩn đường, đo lại không kèm tín hiệu, sự kiện chỉ mã", async ({ page, request }) => {
  const DUONG = (y: number): [number, number][] => [[0.36, y], [0.44, y - 0.01], [0.52, y - 0.015], [0.6, y - 0.01]];
  const CV = {
    do_ro_tong: 0.5,
    tam_dao: { do_ro: 0.6, chieu_dai_uoc_luong: 0.7, do_cong: 0.2 },
    tri_dao: { do_ro: 0.5, chieu_dai_uoc_luong: 0.6, do_cong: 0.3 },
    sinh_dao: { do_ro: 0.4, chieu_dai_uoc_luong: 0.8, do_cong: 0.5 },
    polylines: { tam_dao: DUONG(0.62), tri_dao: DUONG(0.68), sinh_dao: DUONG(0.76) },
    do_tin: "goi_y_tham_khao",
  };
  const doTay: Record<string, unknown>[] = [], haiTay: Record<string, unknown>[] = [];
  await page.route("**/api/chi-tay/do-tay", async (route) => { doTay.push(route.request().postDataJSON()); await route.fulfill({ json: KQ_DO }); });
  await page.route("**/api/chi-tay/luan-giai-hai-tay", async (route) => { haiTay.push(route.request().postDataJSON()); await route.fulfill({ json: {} }); });
  await moTrang(page, { diem: DIEM, duong_chi: CV });
  await page.getByTestId("ct-dong-y").check();
  await page.getByTestId("ct-input-tai").setInputFiles({ name: "tay.webp", mimeType: "image/webp", buffer: ANH });
  await expect(page.getByTestId("ct-cung")).toHaveCount(3);
  await expect(page.getByTestId("ct-xuong").locator("polyline")).toHaveCount(3);
  const hoi = page.getByTestId("ct-duong-phan-hoi-trai");
  await expect(hoi).toContainText("Đường máy vẽ có khớp tay bạn không?");

  // lượt đầu: tín hiệu ba đường là CON SỐ, không gửi nét vẽ
  expect(doTay).toHaveLength(1);
  const g = doTay[0]!.duong_chi_goi_y as Record<string, unknown>;
  expect(Object.keys(g).sort()).toEqual(["do_ro_tong", "do_tin", "sinh_dao", "tam_dao", "tri_dao"]);
  expect(JSON.stringify(doTay[0])).not.toContain("polylines");
  await expect.poll(() => haiTay.length).toBe(1);
  expect((haiTay[0]!.trai as Record<string, unknown>).duong_chi_goi_y).toBeTruthy();

  await page.getByTestId("ct-duong-chua-khop-trai").click();
  await expect(hoi).toContainText("Đã ẩn đường máy vẽ. Bạn tự soi ba đường ở phần Tự soi bên dưới.");
  await expect(hoi.locator("a")).toHaveAttribute("href", "#tu-soi");
  await expect(page.locator("#tu-soi")).toHaveCount(1);
  await expect(page.getByTestId("ct-xuong").locator("polyline")).toHaveCount(0);
  await expect(page.getByTestId("ct-xuong").locator("circle")).toHaveCount(21);     // điểm mốc vẫn còn
  await expect.poll(() => doTay.length).toBe(2);
  expect(doTay[1]).not.toHaveProperty("duong_chi_goi_y");
  await expect.poll(() => haiTay.length).toBe(2);
  expect(haiTay[1]!.trai).not.toHaveProperty("duong_chi_goi_y");
  const sk = (await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []))
    .filter((e) => e.kind === "duong_cv_phan_hoi");
  expect(sk).toHaveLength(1);
  expect(sk[0]).toMatchObject({ su_kien: "chart_interacted", mo_dun: "chitay", muc: "chua_khop", tay: "trai" });

  // route: schema chặt — nét vẽ, khoá lạ, số ngoài 0..1 đều bị từ chối trước khi tới engine
  const { polylines: _bo, ...so } = CV;
  void _bo;
  const than = (d: unknown) => ({ dong_y: true, tay: "trai", ty_le: 0.75, diem: DIEM, duong_chi_goi_y: d });
  expect((await request.post("/api/chi-tay/do-tay", { data: than(CV) })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/do-tay", { data: than({ ...so, ghi_chu: "chữ tự do" }) })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/do-tay", { data: than({ ...so, tam_dao: { ...so.tam_dao, do_ro: 7 } }) })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/do-tay", { data: than({ ...so, do_tin: "chac_chan" }) })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/luan-giai-hai-tay", { data: { dong_y: true, trai: { ty_le: 0.75, diem: DIEM, duong_chi_goi_y: CV } } })).status()).toBe(422);
  expect((await request.post("/api/chi-tay/do-tay", { data: than(so) })).status()).not.toBe(422);
});
