// QBG-1 — "Quét 3 góc như Face ID" (camera trong trang, máy người dùng tự nhận góc mặt và tự chụp).
// (1) Hàm thuần lib/quet-mat.ts trên lưới dựng tay: góc quay, đánh giá khung, tiến độ, độ sáng / độ nét.
// (2) Trình duyệt thật với camera GIẢ (canvas.captureStream thay getUserMedia — không cần quyền, không cần thiết bị):
//     không mặt → bấm nút chụp ba lần → ảnh thẳng vào khung chấm điểm, hai ảnh nghiêng nạp sẵn; từ chối camera → lời báo;
//     camera chiếu ảnh chân dung mẫu công khai (khi tải được) → máy TỰ CHỤP ảnh thẳng. Không yêu cầu nào ra máy chủ ngoài.
import { test, expect, type Page } from "@playwright/test";
import { NGUONG, chonMat, danhGia, gocMat, matDauDoQuayHan, sangVaNet, theoKhungHien, tienDo } from "../lib/quet-mat";
import { napHoSo } from "./_hoso";

/** Lưới giả: đầu hình trụ tâm (0,5; 0,5), bán kính 0,2 (khung vuông), quay `yaw` độ (> 0 = người quay sang trái). */
function luoi(yaw = 0, { roll = 0, cui = 0.7, r = 0.2, cx = 0.5, cy = 0.5 } = {}) {
  const L = Array.from({ length: 478 }, () => ({ x: cx, y: cy, z: 0 }));
  const s = Math.sin((yaw * Math.PI) / 180), dy = Math.tan((roll * Math.PI) / 180) * r * 0.6;
  L[234] = { x: cx - r, y: cy, z: 0 }; L[454] = { x: cx + r, y: cy, z: 0 };
  L[33] = { x: cx - r * 0.6, y: cy - 0.05 - dy, z: 0 }; L[263] = { x: cx + r * 0.6, y: cy - 0.05 + dy, z: 0 };
  L[13] = { x: cx + s * r * 0.8, y: cy + 0.1, z: 0 };
  L[1] = { x: cx + s * r, y: cy - 0.05 + 0.15 * cui, z: 0 };
  L[10] = { x: cx, y: cy - 0.25, z: 0 }; L[152] = { x: cx, y: cy + 0.25, z: 0 };
  return L;
}

test.describe("lib/quet-mat (hàm thuần)", () => {
  test("góc quay đọc đúng chiều và độ lớn; đầu nghiêng, cúi / ngửa, xa / gần, lệch khung", () => {
    for (const y of [0, 20, -20, 45, -60]) expect(gocMat(luoi(y), 1000, 1000)!.yaw).toBeCloseTo(y, 1);
    expect(gocMat(luoi(0, { roll: 15 }), 1000, 1000)!.roll).toBeGreaterThan(NGUONG.thang_roll);
    expect(gocMat([], 100, 100)).toBeNull();

    const g = (y: number, o = {}) => gocMat(luoi(y, o), 1000, 1000);
    expect(danhGia(g(0), "thang")).toEqual({ ok: true, loi: null });
    expect(danhGia(g(20), "thang").loi).toBe("quay_lai_thang");
    expect(danhGia(g(0, { roll: 15 }), "thang").loi).toBe("nghieng_dau");
    expect(danhGia(g(0, { cui: 0.2 }), "thang").loi).toBe("ngua");
    expect(danhGia(g(0, { cui: 1.2 }), "thang").loi).toBe("cui");
    expect(danhGia(g(0, { r: 0.08 }), "thang").loi).toBe("xa");
    expect(danhGia(g(0, { r: 0.48 }), "thang").loi).toBe("gan");
    expect(danhGia(g(0, { cx: 0.8 }), "thang").loi).toBe("lech");
    expect(danhGia(g(0), "thang", 2).loi).toBe("nhieu_mat");
    expect(danhGia(null, "thang", 0).loi).toBe("khong_thay");
    expect(danhGia(g(0), "thang", 1, 30).loi).toBe("toi");
    expect(danhGia(g(0), "thang", 1, 250).loi).toBe("choi");
  });

  test("quy về phần khung đang hiện trên màn hình (video phủ kín, cắt hai bên)", () => {
    const g = gocMat(luoi(0, { r: 0.15, cx: 0.6 }), 720, 960)!;
    // khung 720×960 phủ kín màn 390×844 → chỉ thấy (390/844)/(720/960) ≈ 61,6 % bề ngang, ở giữa
    const h = theoKhungHien(g, 720, 960, 390, 844);
    expect(h.rong).toBeCloseTo(0.3 / 0.6161, 3);
    expect(h.tam.x).toBeCloseTo(0.5 + 0.1 / 0.6161, 3);
    expect(h.tam.y).toBeCloseTo(0.5, 6);
    expect(theoKhungHien(g, 720, 960, 0, 0)).toEqual(g);
  });

  test("ảnh nghiêng: đúng chiều đủ góc mới chụp; sai chiều nhắc quay bên kia; mất dấu sau khi đã quay đủ → vẫn chụp", () => {
    const g = (y: number) => gocMat(luoi(y), 1000, 1000);
    expect(danhGia(g(60), "trai").ok).toBe(true);
    expect(danhGia(g(-60), "phai").ok).toBe(true);
    expect(danhGia(g(30), "trai").loi).toBe("quay_them");
    expect(danhGia(g(-40), "trai").loi).toBe("sai_ben");
    expect(danhGia(g(40), "phai").loi).toBe("sai_ben");
    expect(tienDo(g(0), "trai")).toBe(0);
    expect(tienDo(g(NGUONG.nghieng_chup / 2), "trai")).toBeCloseTo(0.5, 2);
    expect(tienDo(g(80), "trai")).toBe(1);
    expect(tienDo(g(0), "thang")).toBe(1);
    expect(matDauDoQuayHan(45, "trai")).toBe(true);
    expect(matDauDoQuayHan(20, "trai")).toBe(false);
    expect(matDauDoQuayHan(45, "thang")).toBe(false);
  });

  test("chọn mặt: bản trùng của cùng một mặt (chế độ VIDEO) và mặt nhỏ phía sau không tính là hai mặt", () => {
    const a = luoi(0), trung = luoi(0, { cx: 0.52 }), nho = luoi(0, { r: 0.08, cx: 0.85, cy: 0.2 });
    expect(chonMat([]).soMat).toBe(0);
    expect(chonMat([a, trung])).toEqual({ luoi: a, soMat: 1 });
    expect(chonMat([nho, a]).soMat).toBe(1);
    expect(chonMat([nho, a]).luoi).toBe(a);
    const xa = luoi(0, { r: 0.18, cx: 0.25 }), xa2 = luoi(0, { r: 0.18, cx: 0.75 });
    expect(chonMat([xa, xa2]).soMat).toBe(2);
  });

  test("độ sáng + độ nét: ảnh phẳng không nét, ảnh caro nét", () => {
    const w = 32, phang = new Uint8ClampedArray(w * w).fill(120), caro = new Uint8ClampedArray(w * w);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) caro[y * w + x] = (x + y) % 2 ? 200 : 40;
    expect(sangVaNet(phang, w, w)).toEqual({ sang: 120, net: 0 });
    const r = sangVaNet(caro, w, w);
    expect(r.sang).toBeCloseTo(120, 0);
    expect(r.net).toBeGreaterThan(1000);
  });
});

/** Thay getUserMedia bằng luồng canvas: vẽ ảnh `window.__anhCamera` nếu có, không thì nền xám có hoa văn (không mặt). */
async function cameraGia(page: Page, tuChoi = false) {
  await page.addInitScript(({ tuChoi }) => {
    const md = navigator.mediaDevices ?? ({} as MediaDevices);
    Object.defineProperty(navigator, "mediaDevices", { value: md, configurable: true });
    md.getUserMedia = async () => {
      if (tuChoi) throw new DOMException("bị từ chối", "NotAllowedError");
      const c = document.createElement("canvas");
      c.width = 720; c.height = 960;
      const g = c.getContext("2d")!;
      let t = 0;
      const ve = () => {
        const anh = (window as unknown as { __anhCamera?: HTMLImageElement }).__anhCamera;
        if (anh?.complete && anh.naturalWidth) {
          // Ảnh mẫu là ảnh bán thân, mặt ở phía trên: đặt TÂM MẶT (≈ 48 %, 19,5 % của ảnh; rộng ≈ 28 %) vào giữa khung như
          // người dùng thật đưa mặt vào oval, mặt rộng ≈ 30 % khung.
          g.fillStyle = "#6a5a50"; g.fillRect(0, 0, c.width, c.height);
          const k = (0.3 * c.width) / (0.28 * anh.naturalWidth);
          g.drawImage(anh, c.width / 2 - 0.484 * anh.naturalWidth * k, c.height / 2 - 0.195 * anh.naturalHeight * k, anh.naturalWidth * k, anh.naturalHeight * k);
        } else {
          g.fillStyle = "#7a8a99"; g.fillRect(0, 0, c.width, c.height);
          g.fillStyle = "#dde"; for (let i = 0; i < 40; i++) g.fillRect((i * 53 + t) % c.width, (i * 97) % c.height, 18, 18);
        }
        t += 3;
        requestAnimationFrame(ve);
      };
      ve();
      return c.captureStream(30);
    };
  }, { tuChoi });
}

test.describe("trình duyệt thật + camera giả", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("không thấy mặt → bấm chụp 3 lần → ảnh thẳng vào khung chấm, 2 ảnh nghiêng nạp sẵn; camera tắt; không gọi ra ngoài", async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const goc = new URL(baseURL!).origin, ngoai: string[] = [];
    page.on("request", (q) => { const u = new URL(q.url()); if (u.origin !== goc && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) ngoai.push(u.origin); });
    await cameraGia(page);
    await napHoSo(page);
    await page.goto("/nhan-tuong");
    await page.getByTestId("quet-mo").click();
    const hop = page.getByTestId("quet-ba-goc");
    await expect(hop).toBeVisible();
    await expect(page.getByTestId("quet-chup")).toBeEnabled({ timeout: 30_000 });
    // không có mặt trong khung → không tự chụp, nhắc đưa mặt vào khung
    await expect(page.getByTestId("quet-huong-dan")).toContainText("Đưa khuôn mặt vào khung");
    for (const b of ["thang", "trai", "phai"]) {
      await expect(page.getByTestId(`quet-buoc-${b}`)).toHaveAttribute("aria-current", "step");
      await page.getByTestId("quet-chup").click();
      if (b !== "phai") await expect(page.getByTestId(`quet-buoc-${b}`)).toHaveAttribute("data-xong", "1", { timeout: 10_000 });
    }
    await expect(hop).toBeHidden();
    await expect(page.getByTestId("do-khung").locator("img")).toHaveAttribute("src", /^blob:/);
    await expect(page.getByTestId("do-nghieng")).toHaveAttribute("open", "");
    await expect(page.getByTestId("ng-khung-nghieng_trai").locator("img")).toHaveAttribute("src", /^blob:/);
    await expect(page.getByTestId("ng-khung-nghieng_phai").locator("img")).toHaveAttribute("src", /^blob:/);
    expect(ngoai.filter((o) => !o.includes("posthog") && !o.includes("google-analytics") && !o.includes("googletagmanager"))).toEqual([]);
  });

  test("bỏ qua hai góc nghiêng → chỉ ảnh thẳng; Esc đóng; từ chối camera → lời báo + quay lại chọn ảnh", async ({ page, browser }) => {
    test.setTimeout(90_000);
    await cameraGia(page);
    await napHoSo(page);
    await page.goto("/nhan-tuong");
    await page.getByTestId("quet-mo").click();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("quet-ba-goc")).toBeHidden();
    await page.getByTestId("quet-mo").click();
    await expect(page.getByTestId("quet-chup")).toBeEnabled({ timeout: 30_000 });
    await page.getByTestId("quet-chup").click();
    await page.getByTestId("quet-bo-qua").click();
    await page.getByTestId("quet-bo-qua").click();
    await expect(page.getByTestId("quet-ba-goc")).toBeHidden();
    await expect(page.getByTestId("do-khung").locator("img")).toHaveAttribute("src", /^blob:/);
    await expect(page.getByTestId("do-nghieng")).not.toHaveAttribute("open", "");

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p2 = await ctx.newPage();
    await cameraGia(p2, true);
    await napHoSo(p2);
    await p2.goto("/nhan-tuong");
    await p2.getByTestId("quet-mo").click();
    await expect(p2.getByTestId("quet-loi")).toContainText("chưa cho phép dùng camera");
    await p2.getByRole("button", { name: "Quay lại chọn ảnh" }).click();
    await expect(p2.getByTestId("quet-ba-goc")).toBeHidden();
    await ctx.close();
  });

  test("camera chiếu chân dung thẳng → máy tự chụp ảnh nhìn thẳng (không bấm nút)", async ({ page }) => {
    let anh: Buffer | null = null;
    try {
      const r = await fetch("https://storage.googleapis.com/mediapipe-assets/portrait.jpg", { signal: AbortSignal.timeout(15_000) });
      if (r.ok) anh = Buffer.from(await r.arrayBuffer());
    } catch { anh = null; }
    test.skip(!anh, "không tải được ảnh mẫu công khai (mạng CI)");
    test.setTimeout(120_000);
    await page.route("**/__e2e/chan-dung.jpg", (r) => r.fulfill({ body: anh!, contentType: "image/jpeg" }));
    await cameraGia(page);
    await page.addInitScript(() => { const i = new Image(); i.src = "/__e2e/chan-dung.jpg"; (window as unknown as { __anhCamera: HTMLImageElement }).__anhCamera = i; });
    await napHoSo(page);
    await page.goto("/nhan-tuong");
    await page.getByTestId("quet-mo").click();
    await expect(page.getByTestId("quet-buoc-thang")).toHaveAttribute("data-xong", "1", { timeout: 90_000 });
    await expect(page.getByTestId("quet-buoc-trai")).toHaveAttribute("aria-current", "step");
  });
});
