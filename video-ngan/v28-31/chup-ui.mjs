// Chụp giao diện THẬT của hieuban.com cho video (chạy web + engine của dự án trên máy: localhost:3000 / :8000).
//   node chup-ui.mjs   → ui/<tên>.png + ui/ui.json (kích thước ảnh và toạ độ các vùng cần khoanh sáng, đơn vị px ảnh)
// Hồ sơ nạp sẵn là NHÂN VẬT MINH HOẠ (QUY-TAC-VIDEO.md). Mọi yêu cầu ra ngoài máy bị chặn (không đo lường).
import { createRequire } from "node:module";
import fs from "node:fs";
const { chromium } = createRequire(new URL("../../web/package.json", import.meta.url))("@playwright/test");
const HS = { v: 1, ho_ten: "Thu Hà", ngay: 12, thang: 9, nam: 1992, gio: "07:30", gioi_tinh: "nu", noi_sinh: "tp-ho-chi-minh", do_tin_gio: "exact", tao_luc: "2026-11-26T00:00:00.000Z" };
const TY = 3, GOC = "http://localhost:3000";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 400, height: 900 }, deviceScaleFactor: TY, isMobile: true, hasTouch: true, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", reducedMotion: "reduce" });
await c.route("**/*", r => (/^(http:\/\/(localhost|127\.0\.0\.1)|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort()));
await c.addInitScript(h => localStorage.setItem("hbt.hoso.v1", JSON.stringify(h)), HS);
const t = await c.newPage();
const ra = {};
fs.mkdirSync("ui", { recursive: true });
async function mo(duong) {
  await t.goto(GOC + duong, { waitUntil: "networkidle", timeout: 180000 });
  for (let y = 0; y < 30000; y += 800) { await t.evaluate(yy => window.scrollTo(0, yy), y); await t.waitForTimeout(150); if (y > await t.evaluate(() => document.body.scrollHeight)) break; }
  await t.waitForTimeout(2000);
}
// ẩn thanh dính / nổi để không đè lên ảnh khối
const anNoi = () => t.evaluate(() => { for (const e of document.querySelectorAll("body *")) { const p = getComputedStyle(e).position; if (p === "fixed" || p === "sticky") e.style.visibility = "hidden"; } for (const e of document.querySelectorAll("nextjs-portal")) e.remove(); });
async function chup(ten, khoi, vung = {}) {
  await t.addStyleTag({ content: "html,body,*{scroll-behavior:auto!important}" });
  await anNoi(); await khoi.scrollIntoViewIfNeeded(); await t.waitForTimeout(900);
  await khoi.screenshot({ path: `ui/${ten}.png`, animations: "disabled" });
  await t.waitForTimeout(400);
  const g = await khoi.boundingBox();   // đo SAU khi chụp, cùng một trạng thái cuộn với các vùng con
  const o = {};
  for (const [k, loc] of Object.entries(vung)) {
    const r = await loc.first().boundingBox().catch(() => null);
    if (r) o[k] = { x: Math.round((r.x - g.x) * TY), y: Math.round((r.y - g.y) * TY), w: Math.round(r.width * TY), h: Math.round(r.height * TY) };
    else console.log("  thiếu vùng", ten, k);
  }
  ra[ten] = { w: Math.round(g.width * TY), h: Math.round(g.height * TY), vung: o, chu: await khoi.innerText().catch(() => "") };
  console.log(ten, ra[ten].w, ra[ten].h, Object.keys(o).join(","));
}
const bo = (chu) => t.getByText(chu, { exact: false }).first().locator('xpath=ancestor-or-self::*[contains(@class,"rounded")][1]');

await mo("/thoi-gian-toi");
const KH = () => t.locator("section", { has: t.getByText("bạn định làm gì", { exact: false }) }).first();
// cuộn hàng 12 tháng để tháng đầu mẫu đứng sát trái
const cuonThang = (mau, cuoi = false) => KH().getByRole("button", { name: mau }).first().evaluate((el, cuoi) => { let h = el.parentElement; while (h && h.scrollWidth <= h.clientWidth + 2) h = h.parentElement; if (h) h.scrollLeft = cuoi ? h.scrollWidth : h.scrollLeft + el.getBoundingClientRect().left - h.getBoundingClientRect().left - 4; }, cuoi);
await chup("chon-viec", KH(), { cau: KH().getByText("bạn định làm gì", { exact: false }), nut: KH().getByRole("button", { name: "Đổi việc", exact: true }).locator("xpath=..") });
for (const [ma, ten] of [["khai", "Khai trương"], ["kyhd", "Ký hợp đồng, bàn lương"], ["nha", "Mua nhà"], ["xe", "Mua xe"], ["hoc", "Học, thi"]]) {
  await KH().getByRole("button", { name: ten, exact: true }).click(); await t.waitForTimeout(3000);
  await cuonThang(/^\s*3\/2027/);
  await t.waitForTimeout(400);
  const k = KH();
  await chup("viec-" + ma, k, {
    chip: k.getByRole("button", { name: ten, exact: true }),
    cau: k.getByText("bạn định làm gì", { exact: false }),
    nut: k.getByRole("button", { name: "Đổi việc", exact: true }).locator("xpath=.."),
    tom: k.getByText("trong 12 tháng tới: tháng hợp nhất", { exact: false }),
    thang: k.getByRole("button", { name: /3\/2027/ }).locator("xpath=.."),
    tcot: k.getByRole("button", { name: /^\s*6\/2027/ }),
    t3: k.getByRole("button", { name: /^\s*3\/2027/ }),
    ct: bo("Ngày sách lịch ghi hợp việc này"),
    nen: k.getByText("Nên làm trước", { exact: false }).locator("xpath=.."),
    ranh: k.getByText("Đây là nhịp gợi ý", { exact: false }),
  });
}
await cuonThang(/^\s*3\/2027/, true); await t.waitForTimeout(300);
await chup("thang-cuoi", KH(), { t7: KH().getByRole("button", { name: /^\s*7\/2027/ }), t10: KH().getByRole("button", { name: /^\s*10\/2027/ }), tom: KH().getByText("trong 12 tháng tới: tháng hợp nhất", { exact: false }) });
await chup("nam-tuvi", bo("Năm 2027 theo Tử vi"), { tieu: t.getByText("Năm 2027 theo Tử vi", { exact: false }) });
await chup("hai-la", bo("hai lá số nhìn hai mặt"));

await mo("/tu-vi");
const idx = await t.evaluate(() => { const s = [...document.querySelectorAll("svg")]; let m = 0, k = -1; s.forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.width * r.height > m) { m = r.width * r.height; k = i; } }); return k; });
await chup("la-so", t.locator("svg").nth(idx), { ten: t.locator("svg").nth(idx).getByText("Thu Hà").first() });
await chup("dau-tuvi", t.getByRole("heading", { level: 1 }).locator("xpath=ancestor::*[3]"), { h1: t.getByRole("heading", { level: 1 }) });
const ml = t.getByText("Mục lục", { exact: false }).first().locator("xpath=ancestor::*[self::nav or self::div or self::section][2]");
await chup("muc-luc", ml);

// ---- v29–v31: chụp theo ĐOẠN trang (clip toạ độ trang) — toạ độ vùng cùng hệ nên không lệch ----
const rect = loc => loc.first().evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height }; });
async function doan(ten, dau, o_ = {}) { try { await doan1(ten, dau, o_); } catch (e) { console.log("LỖI", ten, e.message.slice(0, 90)); } }
async function doan1(ten, dau, { cuoi, cao, vung = {}, le = 10 } = {}) {
  await dau.first().scrollIntoViewIfNeeded({ timeout: 8000 }); await t.waitForTimeout(900); await anNoi();   // ẩn SAU khi cuộn: thanh chương chỉ hiện khi đã cuộn
  const a = await rect(dau); const c = cuoi ? await rect(cuoi) : a;
  const x = Math.max(0, a.x - le), y = a.y - le, w = Math.min(400 - x, a.w + 2 * le);
  const h = cao ?? (c.y + c.h - a.y + 2 * le);
  await t.screenshot({ path: `ui/${ten}.png`, fullPage: true, clip: { x, y, width: w, height: h }, animations: "disabled" });
  const o = {};
  for (const [k, loc] of Object.entries(vung)) {
    if (!(await loc.count())) { console.log("  thiếu vùng", ten, k); continue; }
    const r = await rect(loc);
    o[k] = { x: Math.round((r.x - x) * TY), y: Math.round((r.y - y) * TY), w: Math.round(r.w * TY), h: Math.round(r.h * TY) };
  }
  ra[ten] = { w: Math.round(w * TY), h: Math.round(h * TY), vung: o };
  console.log(ten, ra[ten].w, ra[ten].h, Object.keys(o).join(","));
}
const hop = chu => t.getByText(chu, { exact: false }).first().locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
const chu = c => t.getByText(c, { exact: false }).first();
const tinh = () => t.addStyleTag({ content: "html,body,*{scroll-behavior:auto!important;animation:none!important;transition:none!important} .fixed,.sticky,[class*=\":sticky\"],[class*=\":fixed\"]{visibility:hidden!important} .fixed *,.sticky *{visibility:hidden!important}" });

await mo("/bat-tu"); await tinh();
await doan("bt-banhxe", chu("Bánh xe đời").locator("xpath=ancestor::*[.//*[name()='svg' and contains(@viewBox,'0 0')] and contains(@class,'rounded')][1]"), { cao: 720 }).catch(e => console.log("bỏ bt-banhxe", e.message.slice(0, 80)));
await t.getByRole("button", { name: "Mở hết các chương" }).first().click(); await t.waitForTimeout(4000);
await doan("bt-hanh", chu("Năm phần năng lượng trong bạn"), { cuoi: chu("hệ thống không chọn thay bạn"), vung: { hoa: chu("đang thiếu"), du: chu("đang dư") }, le: 14 });
await doan("bt-hoa", hop("Thiếu Hỏa: thiếu hứng khởi"));
await doan("bt-kim", hop("Kim nhiều: dễ cứng nhắc"));
await doan("bt-bu", hop("Hai cách cùng gợi ý"), { vung: { tieu: chu("Hai cách cùng gợi ý") } });
await doan("bt-nghe", hop("Tôi hợp nghề gì?"));
await doan("bt-labannghe", chu("La bàn nghề theo ngũ hành"), { cao: 330, le: 14 });
await doan("bt-tien", hop("Tiền dễ ra vì bạn bè, anh em"));
await doan("bt-giutien", chu("Tôi có giữ được tiền không?"), { cuoi: chu("Nên chuyển dần tiền nhàn rỗi"), le: 14 });
await doan("bt-hoc", hop("Học sâu, cần hiểu gốc"), { });
await doan("bt-hoc2", hop("Học nhanh, ghét học thuộc"));
await doan("bt-tinh", hop("Quen tự lo nên người khác ngại đến gần"));
await doan("bt-tinh2", hop("Nhịp sống hai người dễ lệch nhau"));
await doan("bt-con", hop("Con cái dễ khác tính bạn"));
await doan("bt-nam", hop("Năm 2028: giấy tờ, nhà cửa nên chậm"));
await doan("bt-hoi", hop("Lúc nào bạn thấy mình đầy sức"));

await mo("/phong-thuy"); await tinh();
await doan("pt-hoi", chu("Bạn đang băn khoăn điều gì về ngôi nhà?"), { cuoi: chu("Mở quán, cửa hàng thì xem gì?"), le: 16 });
await doan("pt-laban", chu("Mệnh quái của bạn"), { cuoi: chu("Hướng hung"), vung: { menh: chu("Mệnh quái của bạn"), tb: t.locator("svg text", { hasText: "Sinh Khí" }), tn: t.locator("svg text", { hasText: "Thiên Y" }), db: t.locator("svg text", { hasText: "Diên Niên" }), tay: t.locator("svg text", { hasText: "Phục Vị" }) }, le: 14 });
for (const [ten, slug, h] of [["pt-guong", "guong-chieu-thang-cua-chinh", "guong"], ["pt-lung", "ngoi-quay-lung-ra-cua", "lung"], ["pt-bep", "bep-doi-dien-cua-chinh", "bep"]]) {
  await mo("/phong-thuy/dau-hieu/" + slug); await tinh();
  await t.addStyleTag({ content: "table,tr,td,th{white-space:normal!important;min-width:0!important;width:auto}table{width:100%!important;table-layout:fixed}" });  // bảng cuộn ngang trên điện thoại: cho xuống dòng để đọc đủ
  const h2 = c => t.locator("h2", { hasText: c }).first();
  await doan(ten + "-dau", t.locator("h1").first(), { cuoi: t.locator("figure").first(), le: 14 });
  await doan(ten + "-noi", h2(/nói gì|đời sống hiện đại/), { cuoi: t.locator("table").first(), vung: { bang: t.locator("table"), khong: t.locator("table tr").nth(1) }, le: 14 });
}
await mo("/nhan-tuong"); await tinh();
await doan("nt-guong", chu("BẢN ĐỒ GƯƠNG MẶT"), { cao: 900, le: 14 });
await doan("nt-tai", chu("Tải ảnh chân dung — hệ thống tự đo"), { cao: 520, le: 14 });
await mo("/nhan-tuong/bo-vi/mat"); await tinh();
await doan("nt-mat", t.locator("h1").first(), { cuoi: t.locator("figure").first(), le: 14 });
await doan("nt-noi", t.locator("h2", { hasText: "nói về gì" }), { cao: 380, le: 14 });
for (const [ten, c] of [["nt-than", "Ánh mắt yên, sáng"], ["nt-len", "Đuôi mắt chếch lên"], ["nt-cup", "Đuôi mắt cụp xuống"], ["nt-mo", "Ánh mắt mờ, uể"], ["nt-dai", "Mắt dài, đuôi kéo dài"]]) {
  const k = chu(c + ":").locator('xpath=ancestor-or-self::*[self::li or self::p or self::div][1]');
  await doan(ten, k, { le: 2 });
}
await mo("/nhan-tuong/do-hinh/luu-nien-van-khi"); await tinh();
await doan("nt-dohinh", t.locator("h1").first(), { cao: 900, le: 14 });
await doan("nt-khac", t.getByRole("button", { name: "Xem bản khắc gốc" }).locator("xpath=.."), { cao: 780, le: 4 });
if (ra["nt-khac"]) ra["nt-khac"].vung.mat = { x: 215, y: 1085, w: 700, h: 190 };   // hàng mắt trên bản khắc (đo trên ảnh)
for (const k of ["tb","tn","db","tay"]) { const b = ra["pt-laban"]?.vung[k]; if (b) Object.assign(b, { x: b.x - 55, y: b.y - 75, w: b.w + 110, h: b.h + 95 }); }   // gồm cả tên hướng phía trên tên du niên
fs.writeFileSync("ui/ui.json", JSON.stringify(ra, null, 1));
await b.close();
