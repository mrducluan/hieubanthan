// KC-4 GĐ1 — Web Push: mã hoá đúng từng byte test vector RFC 8291 phụ lục A, giải mã ngược được, JWT VAPID ký đúng,
// chỉ gửi tới máy chủ push của trình duyệt; service worker + route; nút bật nhắc không tự hiện khi chưa đủ điều kiện.
import { test, expect } from "@playwright/test";
import { createDecipheriv, createECDH, createHmac, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { MAY_CHU_PUSH, b64u, goiThongBao, homNayVn, jwtVapid, khoaVapid, maHoa, tuB64u } from "../lib/web-push";
import { maKhongDau } from "../lib/nhac-viec";
import { napHoSo } from "./_hoso";

// RFC 8291 phụ lục A
const UA_PUB = "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4";
const UA_PRIV = "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94";
const AS_PRIV = "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw";
const MUOI = "DGv6ra1nlYgDCS1FRnbzlw", AUTH = "BTBZMqHH6r4Tts7J_aSIgg";
const KET_QUA_RFC = "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN";

/** Giải mã phía "trình duyệt" (độc lập với maHoa: tự dựng lại khoá từ khoá riêng UA). */
function giaiMa(goi: Buffer, uaPriv: string, auth: string): string {
  const muoi = goi.subarray(0, 16), idlen = goi[20]!, asPub = goi.subarray(21, 21 + idlen), ma = goi.subarray(21 + idlen);
  const ua = createECDH("prime256v1"); ua.setPrivateKey(tuB64u(uaPriv));
  const h = (k: Buffer, ...d: Buffer[]) => d.reduce((m, x) => m.update(x), createHmac("sha256", k)).digest();
  const ikm = h(h(tuB64u(auth), ua.computeSecret(asPub)), Buffer.from("WebPush: info\0"), ua.getPublicKey(), asPub, Buffer.from([1]));
  const prk = h(muoi, ikm);
  const d = createDecipheriv("aes-128-gcm", h(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01")).subarray(0, 16),
    h(prk, Buffer.from("Content-Encoding: nonce\0\x01")).subarray(0, 12));
  d.setAuthTag(ma.subarray(-16));
  const ro = Buffer.concat([d.update(ma.subarray(0, -16)), d.final()]);
  expect(ro.at(-1)).toBe(2);                                    // dấu kết thúc bản ghi cuối (RFC 8188)
  return ro.subarray(0, -1).toString();
}

test("mã hoá khớp từng byte test vector RFC 8291", () => {
  const goi = maHoa(Buffer.from("When I grow up, I want to be a watermelon"), tuB64u(UA_PUB), tuB64u(AUTH),
    { muoi: tuB64u(MUOI), khoaMayRiengTu: tuB64u(AS_PRIV) });
  expect(b64u(goi)).toBe(KET_QUA_RFC);
  expect(giaiMa(goi, UA_PRIV, AUTH)).toBe("When I grow up, I want to be a watermelon");
});

test("mã hoá ngẫu nhiên: mỗi lần khác nhau, giải mã ra đúng tiếng Việt", () => {
  const goi = JSON.stringify(goiThongBao([{ nhan: "Ứng kỳ quẻ Càn", duong: "/kinh-dich" }], "2026-11-02"));
  const a = maHoa(Buffer.from(goi), tuB64u(UA_PUB), tuB64u(AUTH)), b = maHoa(Buffer.from(goi), tuB64u(UA_PUB), tuB64u(AUTH));
  expect(b64u(a)).not.toBe(b64u(b));
  expect(JSON.parse(giaiMa(a, UA_PRIV, AUTH)).title).toBe("Ứng kỳ quẻ Càn");
});

test("JWT VAPID: ES256 ký đúng, aud = origin máy chủ push, hạn 12 giờ", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const p = publicKey.export({ format: "jwk" }), d = privateKey.export({ format: "jwk" }).d!;
  const congKhai = b64u(Buffer.concat([Buffer.from([4]), tuB64u(p.x!), tuB64u(p.y!)]));
  const jwt = jwtVapid("https://fcm.googleapis.com/fcm/send/abc", { congKhai, riengTu: d, chuThe: "mailto:contact@hieuban.com" }, 1_800_000_000);
  const [dau, than, ky] = jwt.split(".");
  expect(JSON.parse(tuB64u(dau!).toString())).toEqual({ typ: "JWT", alg: "ES256" });
  expect(JSON.parse(tuB64u(than!).toString())).toEqual({ aud: "https://fcm.googleapis.com", exp: 1_800_043_200, sub: "mailto:contact@hieuban.com" });
  expect(verify("sha256", Buffer.from(`${dau}.${than}`), { key: createPublicKey({ format: "jwk", key: p }), dsaEncoding: "ieee-p1363" }, tuB64u(ky!))).toBe(true);
});

test("khoá VAPID: cặp khớp → nhận; công khai không suy từ riêng tư → null (tránh 401 hàng loạt)", () => {
  const cu = { ...process.env };
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const p = publicKey.export({ format: "jwk" });
  process.env.VAPID_PUBLIC_KEY = b64u(Buffer.concat([Buffer.from([4]), tuB64u(p.x!), tuB64u(p.y!)]));
  process.env.VAPID_PRIVATE_KEY = privateKey.export({ format: "jwk" }).d!;
  expect(khoaVapid()?.chuThe).toBe("mailto:contact@hieuban.com");
  process.env.VAPID_PRIVATE_KEY = AS_PRIV;   // khoá riêng của cặp khác
  expect(khoaVapid()).toBeNull();
  process.env.VAPID_PUBLIC_KEY = cu.VAPID_PUBLIC_KEY; process.env.VAPID_PRIVATE_KEY = cu.VAPID_PRIVATE_KEY;
  expect(maKhongDau("kd.ungky.Tý")).toBe("kd.ungky.ty");
  expect(maKhongDau("pt.thang.Đinh Mão")).toBe("pt.thang.dinh_mao");
});

test("chỉ gửi tới máy chủ push của trình duyệt", () => {
  for (const u of ["https://fcm.googleapis.com/fcm/send/abc:def", "https://updates.push.services.mozilla.com/wpush/v2/gA",
    "https://web.push.apple.com/QAbc", "https://wns2-sg2p.notify.windows.com/w/?token=x"]) expect(MAY_CHU_PUSH.test(u), u).toBe(true);
  for (const u of ["http://fcm.googleapis.com/fcm/send/x", "https://evil.example.com/fcm.googleapis.com/x", "https://169.254.169.254/latest",
    "https://fcm.googleapis.com.evil.com/x", "https://localhost/x"]) expect(MAY_CHU_PUSH.test(u), u).toBe(false);
});

test("gói thông báo: một mốc mở đúng trang, nhiều mốc mở Hôm nay, đường dẫn lạ bị thay", () => {
  expect(goiThongBao([{ nhan: "Tháng hợp sửa nhà", duong: "/phong-thuy" }], "2026-11-02"))
    .toMatchObject({ title: "Tháng hợp sửa nhà", url: "/phong-thuy", tag: "nhac-2026-11-02" });
  expect(goiThongBao([{ nhan: "B", duong: "/a" }, { nhan: "A", duong: "/b" }], "2026-11-02")).toMatchObject({ title: "A · +1 mốc", url: "/hom-nay" });
  expect(goiThongBao([{ nhan: "X", duong: "//evil.com" }], "2026-11-02").url).toBe("/hom-nay");
  expect(goiThongBao([{ nhan: "X", duong: null }], "2026-11-02").body).toContain("không phải dự báo");
  expect(homNayVn(Date.parse("2026-10-20T17:30:00Z"))).toBe("2026-10-21");   // 0:30 sáng giờ VN
});

test("service worker: phục vụ ở gốc, không chặn fetch, mở đường dẫn trong site", async ({ request }) => {
  const r = await request.get("/sw.js");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("javascript");
  const js = await r.text();
  expect(js).toContain('addEventListener("push"');
  expect(js).toContain('addEventListener("notificationclick"');
  expect(js).not.toContain('addEventListener("fetch"');
  expect((await request.get("/apple-icon")).headers()["content-type"]).toContain("image/png");   // biểu tượng thông báo
});

test("route: chưa đặt khoá VAPID → 404; cron thiếu khoá bí mật → 401", async ({ request }) => {
  expect((await request.get("/api/push/khoa")).status()).toBe(404);
  expect((await request.get("/api/cron/nhac-day")).status()).toBe(401);
  expect((await request.get("/api/cron/hang-ngay")).status()).toBe(401);
  expect((await request.get("/api/cron/nhac-day", { headers: { authorization: "Bearer sai-khoa-sai-khoa-sai" } })).status()).toBe(401);
});

test("Hôm nay: chưa bật Web Push trên máy chủ → không có nút; có khoá nhưng chưa đăng nhập → mời đăng nhập, không hỏi quyền", async ({ page }) => {
  const homNay = homNayVn();
  await napHoSo(page);
  await page.addInitScript((n) => localStorage.setItem("hbt.nhac.v1", n), JSON.stringify([
    { id: `${homNay}|ung_ky.que_1`, ngay: homNay, ma: "ung_ky.que_1", mo_dun: "kinhdich", nhan: "Ứng kỳ quẻ Càn", duong: "/kinh-dich", tao_luc: "2026-10-21T00:00:00Z" }]));
  await page.goto("/hom-nay");
  const khoi = page.getByTestId("nhac-hom-nay");
  await expect(khoi).toContainText("Ứng kỳ quẻ Càn");
  await expect(khoi.getByTestId("bat-nhac-push")).toHaveCount(0);
  await expect(khoi.getByTestId("push-can-dang-nhap")).toHaveCount(0);

  await page.route("/api/push/khoa", (r) => r.fulfill({ json: { khoa: UA_PUB } }));
  await page.addInitScript(() => {
    const w = window as unknown as { __hoi_quyen: number };
    w.__hoi_quyen = 0;
    Notification.requestPermission = async () => { w.__hoi_quyen += 1; return "default"; };
  });
  await page.reload();
  await expect(khoi.getByTestId("push-can-dang-nhap")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __hoi_quyen: number }).__hoi_quyen)).toBe(0);   // không tự hỏi quyền
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
});

// ---------------------------------------------------------------- KC-4 GĐ2
import { ghepThongBao, type GoiSangNay } from "../lib/web-push";
import { nenMoi } from "../components/khung/MoiCaiApp";

const SN: GoiSangNay = {
  moc_lich: [{ ma: "tiet.345", nhom: ["giao_tiet"], tieu_de: "Hôm nay giao tiết Kinh trập", noi_dung: "Sang tháng Mão theo tiết khí", duong: "/hom-nay#thang-nay-nha" }],
  theo_ngay_sinh: {
    "12-05": { so_ngay: 6, tieu_de: "Sáng nay của bạn · Ngày cá nhân 6", noi_dung: "Câu tự soi 6?", thang_moi: null },
    "01-01": { so_ngay: 3, tieu_de: "Sáng nay của bạn · Ngày cá nhân 3", noi_dung: "Câu tự soi 3?", thang_moi: { so: 2, tieu_de: "Tháng cá nhân 2 bắt đầu", noi_dung: "Tháng hợp tác." } },
  },
  hoi_hom_qua: { cau: "Hôm qua gợi ý cho việc {ten}: {nhip}. Đúng không?", nhip: { thuan: "nhịp thuận" }, dung: "Đúng với mình", chua_dung: "Chưa đúng" },
};
const N = { nhac: [], sang_nay: false, moc_lich: [], ngay_sinh: null };

test("GĐ2: một thông báo/ngày — mốc tự đánh dấu > mốc lịch đã chọn > sáng nay; không có gì → không gửi", () => {
  expect(ghepThongBao(N, SN, "2026-03-05")).toBeNull();
  // chỉ sáng nay
  expect(ghepThongBao({ ...N, sang_nay: true, ngay_sinh: "12-05" }, SN, "2026-03-05"))
    .toMatchObject({ title: "Sáng nay của bạn · Ngày cá nhân 6", body: "Câu tự soi 6?", url: "/hom-nay", hoi: SN.hoi_hom_qua });
  // sáng nay nhưng chưa có hồ sơ (ngày sinh null) → không gửi
  expect(ghepThongBao({ ...N, sang_nay: true }, SN, "2026-03-05")).toBeNull();
  // mốc lịch người đó không chọn → không gửi; chọn → mốc lịch, kèm sáng nay nếu bật
  expect(ghepThongBao({ ...N, moc_lich: ["lap_xuan_tet"] }, SN, "2026-03-05")).toBeNull();
  expect(ghepThongBao({ ...N, moc_lich: ["giao_tiet"], sang_nay: true, ngay_sinh: "12-05" }, SN, "2026-03-05"))
    .toMatchObject({ title: "Hôm nay giao tiết Kinh trập", body: "Sang tháng Mão theo tiết khí · Ngày cá nhân 6: Câu tự soi 6?", url: "/hom-nay#thang-nay-nha" });
  // tháng cá nhân mới (ngày 1) cộng với giao tiết → "+1 mốc"
  expect(ghepThongBao({ ...N, moc_lich: ["giao_tiet", "thang_ca_nhan"], ngay_sinh: "01-01" }, SN, "2026-03-05")?.title)
    .toBe("Hôm nay giao tiết Kinh trập · +1 mốc");
  // mốc tự đánh dấu thắng tất cả
  expect(ghepThongBao({ ...N, nhac: [{ nhan: "Ứng kỳ quẻ Càn", duong: "/kinh-dich" }], moc_lich: ["giao_tiet"], sang_nay: true, ngay_sinh: "12-05" }, SN, "2026-03-05"))
    .toMatchObject({ title: "Ứng kỳ quẻ Càn", url: "/kinh-dich", body: "Mốc bạn đã đánh dấu cho hôm nay · Ngày cá nhân 6: Câu tự soi 6?" });
  // Y3: ngày giao tiết + có hướng nhà trong tài khoản → lời cụ thể phía cửa nhà mình thay lời mời chung (vẫn một thông báo)
  const NHA = { noi_dung: "Nhà hướng Nam, tháng Mão phía cửa cân bằng: Sửa nhỏ, dọn gọn được.", duong: "/hom-nay#thang-nay-nha" };
  expect(ghepThongBao({ ...N, moc_lich: ["giao_tiet"], nha_tiet: NHA }, SN, "2026-03-05"))
    .toMatchObject({ title: "Hôm nay giao tiết Kinh trập", body: NHA.noi_dung, url: "/hom-nay#thang-nay-nha" });
  // Lập xuân: giữ lời + đường dẫn Lập xuân, nối thêm dòng nhà
  const LX: GoiSangNay = { ...SN, moc_lich: [{ ma: "tiet.315", nhom: ["giao_tiet", "lap_xuan_tet"], tieu_de: "Hôm nay Lập xuân",
    noi_dung: "Năm mới theo tiết khí bắt đầu từ hôm nay.", duong: "/phong-thuy/huong-xau-nam" }] };
  expect(ghepThongBao({ ...N, moc_lich: ["giao_tiet", "lap_xuan_tet"], nha_tiet: NHA }, LX, "2027-02-04"))
    .toMatchObject({ title: "Hôm nay Lập xuân", body: `Năm mới theo tiết khí bắt đầu từ hôm nay. ${NHA.noi_dung}`, url: "/phong-thuy/huong-xau-nam" });
  // có nhà nhưng không chọn nhận mốc giao tiết → không gửi
  expect(ghepThongBao({ ...N, nha_tiet: NHA }, SN, "2026-03-05")).toBeNull();
  // engine lỗi (sn = null) → chỉ còn mốc tự đánh dấu
  expect(ghepThongBao({ ...N, sang_nay: true, ngay_sinh: "12-05", moc_lich: ["giao_tiet"] }, null, "2026-03-05")).toBeNull();
});

test("GĐ2: mời cài app đúng lúc — không mời lần đầu, mời khi ghé 2 ngày trong 7 ngày hoặc có mốc, nghỉ 30 ngày sau khi đóng", () => {
  expect(nenMoi({ ghe: ["2026-10-22"] }, "2026-10-22", false)).toBe(false);
  expect(nenMoi({ ghe: ["2026-10-20", "2026-10-22"] }, "2026-10-22", false)).toBe(true);
  expect(nenMoi({ ghe: ["2026-10-10", "2026-10-22"] }, "2026-10-22", false)).toBe(false);   // ngoài 7 ngày
  expect(nenMoi({ ghe: ["2026-10-22"] }, "2026-10-22", true)).toBe(true);
  expect(nenMoi({ ghe: ["2026-10-20", "2026-10-22"], dong: "2026-10-01" }, "2026-10-22", true)).toBe(false);
  expect(nenMoi({ ghe: ["2026-10-20", "2026-11-05"], dong: "2026-10-01" }, "2026-11-05", true)).toBe(true);
});

test("GĐ2: manifest đủ điều kiện cài (PNG 192 + 512 + maskable, lối tắt); biểu tượng PNG", async ({ request }) => {
  const mf = await (await request.get("/manifest.webmanifest")).json();
  const icons = mf.icons as { src: string; sizes: string; type: string; purpose?: string }[];
  expect(icons.some((i) => i.sizes === "192x192" && i.type === "image/png")).toBe(true);
  expect(icons.some((i) => i.sizes === "512x512" && i.type === "image/png" && i.purpose !== "maskable")).toBe(true);
  expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  expect(mf.display).toBe("standalone");
  expect(mf.start_url).toBe("/hom-nay?tu=app");
  expect((mf.shortcuts as { url: string }[]).map((s) => s.url)).toContain("/hom-nay?tu=app");
  for (const co of ["192", "512", "512-maskable"]) {
    const r = await request.get(`/bieu-tuong/${co}`);
    expect(r.status(), co).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/bieu-tuong/999")).status()).toBe(404);
});

test("GĐ2: sw.js hỏi lại hôm qua bằng hai nút, trả lời không mở trang", async ({ request }) => {
  const js = await (await request.get("/sw.js")).text();
  expect(js).toContain('action: "dung"');
  expect(js).toContain('action: "chua_dung"');
  expect(js).toContain('indexedDB.open("hbt", 1)');
  expect(js).toContain("/api/kiem-chung");
  expect(js).not.toContain('addEventListener("fetch"');
});

test("GĐ2: Hôm nay — ý định hôm qua (trên máy) được hỏi lại một chạm, gửi đúng mã phiếu ẩn danh", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  await expect(page.getByTestId("hoi-hom-qua")).toHaveCount(0);
  const homQua = new Date(Date.now() + 7 * 3_600_000 - 86_400_000).toISOString().slice(0, 10);
  await page.evaluate((ngay) => new Promise<void>((ok) => {
    const r = indexedDB.open("hbt", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("kv"); };
    r.onsuccess = () => {
      const tx = r.result.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ ngay, so_ngay: 6, ds: [{ ma: "gap_go", ten: "Gặp gỡ", nhip: "thuan" }], da_hoi: true, da_tra_loi: null }, "y_dinh");
      tx.oncomplete = () => ok();
    };
  }), homQua);
  let gui: unknown = null;
  await page.route("/api/kiem-chung", async (r) => { gui = r.request().postDataJSON(); await r.fulfill({ json: { ok: true, da_luu: true } }); });
  await page.reload();
  const k = page.getByTestId("hoi-hom-qua");
  await expect(k).toContainText("gặp gỡ: nhịp thuận");
  await k.getByRole("button", { name: "Đúng với mình" }).click();
  await expect(k).toContainText("Cảm ơn bạn");
  await expect.poll(() => gui).toEqual({ loai: "doi_song", mau: "ds.hn.gap_go.thuan.n6", phai: "pitago", ket_qua: "dung" });
  await page.reload();
  await expect(page.getByTestId("the-hom-nay")).toBeVisible();
  await expect(page.getByTestId("hoi-hom-qua")).toHaveCount(0);   // đã trả lời → không hỏi lại
});

test("GĐ2: chọn ý định hôm nay → nhớ trên máy (chỉ mã, tên, nhịp — không câu gõ)", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  const yd = page.getByTestId("y-dinh");
  await yd.getByRole("button").first().click();
  await yd.getByRole("button", { name: "Xem nhịp hôm nay" }).click();
  await expect.poll(() => page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open("hbt", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("kv"); };
    r.onsuccess = () => { const q = r.result.transaction("kv").objectStore("kv").get("y_dinh"); q.onsuccess = () => ok(q.result ?? null); };
  }))).toMatchObject({ da_tra_loi: null, ds: [expect.objectContaining({ ma: expect.stringMatching(/^[a-z_]+$/) })] });
});

test.describe("GĐ2: iPhone chưa cài — mời Thêm vào màn hình chính (lần ghé thứ hai trong tuần)", () => {
  test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  test("hiện hướng dẫn 2 bước, đóng thì ẩn", async ({ page }) => {
    await napHoSo(page);
    const homQua = new Date(Date.now() + 7 * 3_600_000 - 86_400_000).toISOString().slice(0, 10);
    await page.addInitScript((d) => { if (!localStorage.getItem("hbt.cai_app.v1")) localStorage.setItem("hbt.cai_app.v1", JSON.stringify({ ghe: [d] })); }, homQua);
    await page.goto("/hom-nay");
    const m = page.getByTestId("moi-cai-app");
    await expect(m).toHaveAttribute("data-cach", "ios");
    await expect(m).toContainText("Thêm vào màn hình chính");
    await m.getByRole("button", { name: "Để sau" }).click();
    await expect(m).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("the-hom-nay")).toBeVisible();
    await expect(page.getByTestId("moi-cai-app")).toHaveCount(0);
  });
});
