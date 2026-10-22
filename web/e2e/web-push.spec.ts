// KC-4 GĐ1 — Web Push: mã hoá đúng từng byte test vector RFC 8291 phụ lục A, giải mã ngược được, JWT VAPID ký đúng,
// chỉ gửi tới máy chủ push của trình duyệt; service worker + route; nút bật nhắc không tự hiện khi chưa đủ điều kiện.
import { test, expect } from "@playwright/test";
import { createDecipheriv, createECDH, createHmac, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { MAY_CHU_PUSH, b64u, goiThongBao, homNayVn, jwtVapid, maHoa, tuB64u } from "../lib/web-push";
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
