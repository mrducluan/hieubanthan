// ANH-3 — máy người dùng TỰ TÌM điểm mốc gương mặt (WebAssembly chạy trong trình duyệt, tệp tự phục vụ ở /mediapipe/).
// (1) Hàm thuần lib/diem-moc.ts trên dữ liệu dựng tay: gán trái/phải theo ảnh, mép trán ngang đuôi mày, dò chân tóc theo màu.
// (2) Trình duyệt thật + bộ đo thật trên ảnh chân dung mẫu công khai của MediaPipe (tải lúc chạy, không vào git; không tải
//     được thì bỏ qua): chọn ảnh → chấm tự đặt → đồng ý → engine đo. Kiểm KHÔNG có yêu cầu nào ra máy chủ ngoài (ảnh, số liệu).
import { test, expect } from "@playwright/test";
import { timChanToc, tuLuoi } from "../lib/diem-moc";
import { napHoSo } from "./_hoso";

/** Lưới 478 điểm giả: mọi điểm ở tâm, các điểm hàm dùng tới đặt theo mặt mẫu (toạ độ 0..1, ảnh vuông). */
function luoiMau(lat = false) {
  const L = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  const dat = (i: number, x: number, y: number) => { L[i] = { x: lat ? 1 - x : x, y }; };
  // viền bên A (bên phải người = trái ảnh) từ đỉnh trán xuống cằm
  const A = [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152];
  const B = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152];
  const yv = [0.22, 0.23, 0.25, 0.27, 0.30, 0.34, 0.40, 0.44, 0.47, 0.52, 0.58, 0.62, 0.66, 0.69, 0.72, 0.74, 0.75, 0.755, 0.76];
  const xv = [0.5, 0.44, 0.39, 0.35, 0.33, 0.315, 0.305, 0.30, 0.30, 0.305, 0.315, 0.325, 0.34, 0.37, 0.40, 0.43, 0.46, 0.48, 0.5];
  A.forEach((i, k) => dat(i, xv[k]!, yv[k]!)); B.forEach((i, k) => dat(i, 1 - xv[k]!, yv[k]!));
  dat(46, 0.37, 0.37); dat(70, 0.37, 0.37); dat(276, 0.63, 0.37); dat(300, 0.63, 0.37);
  dat(55, 0.45, 0.37); dat(107, 0.45, 0.37); dat(285, 0.55, 0.37); dat(336, 0.55, 0.37);
  dat(33, 0.374, 0.42); dat(133, 0.458, 0.42); dat(362, 0.542, 0.42); dat(263, 0.626, 0.42);
  dat(2, 0.5, 0.56); dat(64, 0.454, 0.55); dat(48, 0.454, 0.55); dat(294, 0.546, 0.55); dat(278, 0.546, 0.55);
  dat(61, 0.425, 0.63); dat(291, 0.575, 0.63); dat(13, 0.5, 0.62); dat(14, 0.5, 0.63);
  for (const [i, x, y] of [[50, 0.38, 0.48], [101, 0.40, 0.46], [280, 0.62, 0.48], [330, 0.60, 0.46], [151, 0.5, 0.27], [9, 0.5, 0.33], [108, 0.44, 0.27], [337, 0.56, 0.27], [69, 0.42, 0.30], [299, 0.58, 0.30]] as const) dat(i, x, y);
  return L;
}

/** Ảnh RGBA w×w: nền xám xanh, đầu màu da, tóc đen từ đỉnh đầu xuống `toc` (0..1; null = không tóc). */
function anhMau(w: number, toc: number | null) {
  const data = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4, trongDau = Math.hypot((x / w - 0.5) / 0.25, (y / w - 0.48) / 0.40) < 1;   // đỉnh đầu ở y ≈ 0,08
    const [r, g, b] = !trongDau ? [110, 130, 150] : toc != null && y / w < toc ? [28, 22, 20] : [214, 168, 140];
    data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
  }
  return { data, width: w, height: w };
}

test.describe("lib/diem-moc (hàm thuần)", () => {
  test("lưới → điểm mốc: trái/phải theo ảnh, mép trán ngang đuôi mày, ảnh lật gương vẫn đúng", () => {
    for (const lat of [false, true]) {
      const d = tuLuoi(luoiMau(lat), 1000, 1000)!;
      expect(d).not.toBeNull();
      expect(Object.keys(d).sort()).toEqual(["cam", "canh_mui_phai", "canh_mui_trai", "chan_mui", "giua_moi", "ham_phai", "ham_trai", "ma_phai", "ma_trai",
        "mat_ngoai_phai", "mat_ngoai_trai", "mat_trong_phai", "mat_trong_trai", "may_phai", "may_trai", "mep_phai", "mep_trai", "thai_phai", "thai_trai"]);
      for (const k of ["thai", "ma", "ham", "may", "mat_ngoai", "mat_trong", "canh_mui", "mep"]) expect(d[`${k}_trai`]!.x).toBeLessThan(d[`${k}_phai`]!.x);
      expect(d.thai_trai!.y).toBeCloseTo(0.37, 3);                       // độ cao đuôi mày
      expect(d.thai_trai!.x).toBeCloseTo(0.31, 3);                       // nội suy viền giữa 21 (y 0,34; x 0,315) và 162 (y 0,40; x 0,305)
      expect(d.giua_moi!.y).toBeCloseTo(0.625, 3);
    }
    expect(tuLuoi([], 100, 100)).toBeNull();
  });

  test("dò chân tóc theo màu: thấy tóc → đúng chỗ; ảnh cắt sát trán / tóc mái che → không đoán", () => {
    const L = luoiMau();
    const ct = timChanToc(L, anhMau(400, 0.15))!;
    expect(ct).not.toBeNull();
    expect(ct.y).toBeGreaterThan(0.135);
    expect(ct.y).toBeLessThan(0.16);
    expect(ct.x).toBeCloseTo(0.5, 2);
    const da = anhMau(400, null);
    da.data.fill(0); for (let o = 0; o < da.data.length; o += 4) { da.data[o] = 214; da.data[o + 1] = 168; da.data[o + 2] = 140; da.data[o + 3] = 255; }
    expect(timChanToc(L, da)).toBeNull();                                // da kéo tới mép ảnh (ảnh cắt sát trán) → không đoán
    expect(timChanToc(L, anhMau(400, 0.30))).toBeNull();                 // tóc mái phủ xuống dưới đỉnh lưới → không đoán
  });
});

test.describe("trình duyệt thật + bộ đo thật", () => {
  test.use({ viewport: { width: 1280, height: 1400 } });
  let anh: Buffer | null = null;
  test.beforeAll(async () => {
    try {
      const r = await fetch("https://storage.googleapis.com/mediapipe-assets/portrait.jpg", { signal: AbortSignal.timeout(15_000) });
      if (r.ok) anh = Buffer.from(await r.arrayBuffer());
    } catch { anh = null; }
  });

  test("chọn ảnh → máy tự đặt đủ 20 điểm (gồm chân tóc) → đồng ý → engine đo; không yêu cầu nào ra ngoài", async ({ page, baseURL }) => {
    test.skip(!anh, "không tải được ảnh mẫu công khai (mạng CI)");
    test.setTimeout(120_000);
    const goc = new URL(baseURL!).origin, ngoai: string[] = [];
    page.on("request", (q) => { const u = new URL(q.url()); if (u.origin !== goc && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) ngoai.push(u.origin); });
    const than: Record<string, unknown>[] = [];
    page.on("request", (q) => { if (q.url().includes("/api/nhan-tuong/do-mat")) than.push(q.postDataJSON()); });
    await napHoSo(page);
    await page.goto("/nhan-tuong");
    await page.getByTestId("do-input").setInputFiles({ name: "chan-dung.jpg", mimeType: "image/jpeg", buffer: anh! });
    await expect(page.getByTestId("do-tu-tim-xong")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId("do-tu-tim-xong")).toContainText("Máy bạn đã tự đặt 20 điểm");
    await expect(page.getByTestId("do-khung").locator("span.absolute")).toHaveCount(20);
    await page.getByTestId("do-dong-y").check();
    await page.getByTestId("do-tinh").click();
    await expect(page.getByTestId("do-so-do")).toBeVisible({ timeout: 20_000 });
    const t = than[0]!;
    expect(Object.keys(t).sort()).toEqual(["diem", "dong_y", "ti_le"]);
    expect(Object.keys(t.diem as object)).toHaveLength(20);
    expect(t.ti_le).toBeCloseTo(820 / 1024, 3);
    // bộ đo tự phục vụ + số liệu hiệu năng của nó bị CSP chặn → không có yêu cầu nào tới máy chủ ngoài
    expect(ngoai.filter((o) => !o.includes("posthog") && !o.includes("google-analytics") && !o.includes("googletagmanager"))).toEqual([]);
  });
});
