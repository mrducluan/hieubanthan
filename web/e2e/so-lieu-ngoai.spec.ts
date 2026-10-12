// QT-4: tìm toàn kho + ký JWT tài khoản dịch vụ Google bằng node:crypto (không thư viện) + lọc "cơ hội" Search Console + cài đặt site.
import { createVerify, generateKeyPairSync } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { docKhoaDichVu, kyJwt, locCoHoi, type DongGsc } from "../lib/so-lieu-ngoai";
import { CAI_DAT, chuanHoa, giaTriHieuLuc } from "../lib/cau-hinh";
import { timToanKho } from "../lib/kb-tim";
import { COT_CHAN_TRANG } from "../lib/menu-chan-trang";
import { dangOMuc, MENU_DAU_TRANG } from "../lib/menu-dau-trang";

test("JWT RS256 ký đúng, đọc được khoá JSON thô lẫn base64", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const json = JSON.stringify({ client_email: "qt@du-an.iam.gserviceaccount.com", private_key: pem.replace(/\n/g, "\\n") });
  const k = docKhoaDichVu(json)!;
  expect(k.client_email).toContain("@");
  expect(docKhoaDichVu(Buffer.from(json).toString("base64"))?.client_email).toBe(k.client_email);
  expect(docKhoaDichVu("không phải json")).toBeNull();

  const jwt = kyJwt(k, "scope-x", 1_000);
  const [dau, than, ky] = jwt.split(".");
  expect(JSON.parse(Buffer.from(dau!, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
  expect(JSON.parse(Buffer.from(than!, "base64url").toString())).toMatchObject({
    iss: k.client_email, scope: "scope-x", aud: "https://oauth2.googleapis.com/token", iat: 1_000, exp: 4_600,
  });
  expect(createVerify("RSA-SHA256").update(`${dau}.${than}`).verify(publicKey, Buffer.from(ky!, "base64url"))).toBe(true);
});

test("cơ hội GSC: vị trí 4–20, đủ hiển thị, CTR thấp, xếp theo lượt bỏ lỡ", () => {
  const d = (q: string, impressions: number, ctr: number, position: number): DongGsc =>
    ({ keys: [q, "https://hieuban.com/x"], clicks: impressions * ctr, impressions, ctr, position });
  const ds = [d("top3", 900, 0.01, 2), d("xa", 900, 0.01, 35), d("it", 5, 0, 8), d("ctr-cao", 500, 0.2, 6),
    d("a", 100, 0.01, 7), d("b", 400, 0.02, 12)];
  expect(locCoHoi(ds).map((x) => x.keys[0])).toEqual(["b", "a"]);
});

test("cài đặt site: kẹp kiểu + mặc định + env", () => {
  const so = CAI_DAT.find((c) => c.khoa === "sao.thuong.moi_ban")!;
  expect(chuanHoa(so, 40)).toEqual({ ok: true, giaTri: 40 });
  expect(chuanHoa(so, 101).ok).toBe(false);
  expect(chuanHoa(so, 2.5).ok).toBe(false);
  expect(giaTriHieuLuc(so, {})).toBe(20);
  expect(giaTriHieuLuc(so, { "sao.thuong.moi_ban": 999 })).toBe(20);   // giá trị hỏng → mặc định
  const link = { khoa: "site.thu_link", ten: "", moTa: "", nhom: "", loai: "duong_dan", macDinh: "" } as const;   // kiểu đường dẫn (chưa có khoá nào dùng)
  expect(chuanHoa(link, "/tai-khoan").ok).toBe(true);
  for (const xau of ["https://x.vn", "//x.vn", "/\\x.vn", "javascript:alert(1)"]) expect(chuanHoa(link, xau).ok).toBe(false);
  const bat = CAI_DAT.find((c) => c.khoa === "luan_giai.thu_sao")!;
  expect(giaTriHieuLuc(bat, { "luan_giai.thu_sao": true })).toBe(true);
  expect(giaTriHieuLuc(bat, {})).toBe(process.env.LUAN_GIAI_THU_SAO === "1");
});

test("tìm toàn kho trên file KB thật: không dấu, trả đúng vị trí, trích đoạn quanh chỗ khớp", () => {
  const thu = path.join(__dirname, "..", "..", "engine", "app", "kb", "data");
  const tep = Object.fromEntries(readdirSync(thu).filter((f) => f.endsWith(".json")).map((f) => [f, readFileSync(path.join(thu, f), "utf8")]));
  const kq = timToanKho(tep, "thien phu");
  expect(kq.length).toBeGreaterThan(0);
  for (const r of kq.slice(0, 20)) {
    const goc = r.duong.reduce<unknown>((o, k) => (o as Record<string | number, unknown>)[k], JSON.parse(tep[r.tep]!));
    expect(typeof goc).toBe("string");
  }
  expect(kq.some((r) => /Thiên Phủ/i.test(r.doan))).toBe(true);
  expect(timToanKho(tep, "x")).toEqual([]);
  expect(timToanKho(tep, "an", 7)).toHaveLength(7);
});

test("menu chân trang mặc định của web trùng MENU_MAC_DINH trong CMS (CMS lỗi vẫn hiện đúng menu)", () => {
  const cms = readFileSync(path.join(__dirname, "..", "..", "cms", "src", "globals", "DieuHuong.ts"), "utf8");
  const khoi = cms.slice(cms.indexOf("MENU_MAC_DINH"), cms.indexOf("export const truongLienKet"));
  const cot = [...khoi.matchAll(/\{ ten: "([^"]+)", lien_ket: \[([\s\S]*?)\]\.map/g)].map((m) => ({
    ten: m[1], ds: [...m[2]!.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((x) => [x[1], x[2]]),
  }));
  expect(cot.length).toBe(4);
  expect(cot).toEqual(COT_CHAN_TRANG.map((c) => ({ ten: c.ten, ds: c.ds.map(([a, b]) => [a, b]) })));
});

test("menu đầu trang mặc định của web trùng MENU_DAU_MAC_DINH trong CMS; mục cha sáng theo menu con", () => {
  const cms = readFileSync(path.join(__dirname, "..", "..", "cms", "src", "globals", "MenuDauTrang.ts"), "utf8");
  const khoi = cms.slice(cms.indexOf("MENU_DAU_MAC_DINH"), cms.indexOf("export const MenuDauTrang"));
  const muc = [...khoi.matchAll(/\{ \.\.\.lk\("([^"]+)", "([^"]+)"\), bieu_tuong: "(\w+)", di_dong: (true|false), con: \[([\s\S]*?)\] \}/g)].map((m) => ({
    href: m[1], ten: m[2], bieu_tuong: m[3], di_dong: m[4] === "true",
    con: [...m[5]!.matchAll(/lk\("([^"]+)", "([^"]+)"\), mo_ta: "([^"]+)"/g)].map((x) => ({ href: x[1], ten: x[2], mo_ta: x[3] })),
  }));
  expect(muc.length).toBe(MENU_DAU_TRANG.length);
  expect(muc).toEqual(MENU_DAU_TRANG);
  const khamPha = MENU_DAU_TRANG.find((m) => m.href === "/kham-pha")!;
  expect(dangOMuc("/tu-vi", khamPha)).toBe(true);
  expect(dangOMuc("/tu-vi-xyz", khamPha)).toBe(false);
  expect(dangOMuc("/dang-nhap", MENU_DAU_TRANG.find((m) => m.href === "/tai-khoan")!)).toBe(true);
  expect(MENU_DAU_TRANG.filter((m) => m.di_dong).length).toBeLessThanOrEqual(5);
});
