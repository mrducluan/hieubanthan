import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";
const OUT = "/tmp/claude-0/-home-user-hieubanthan/1b71b692-df4c-53b6-9653-0c85d6bbe603/scratchpad";
const DIEM = [[0.5, 0.9], [0.38, 0.84], [0.3, 0.76], [0.25, 0.68], [0.21, 0.61], [0.4, 0.55], [0.38, 0.43], [0.37, 0.35], [0.36, 0.28],
  [0.5, 0.53], [0.5, 0.4], [0.5, 0.31], [0.5, 0.23], [0.59, 0.55], [0.61, 0.43], [0.62, 0.35], [0.63, 0.29], [0.67, 0.6], [0.71, 0.51], [0.73, 0.45], [0.75, 0.4]];
const LC = [{ ma: "day", ten: "Gò nổi đầy" }, { ma: "trung", ten: "Trũng / phẳng" }, { ma: "van_cat", ten: "Có vân cắt ngang, vết" }, { ma: "binh_thuong", ten: "Bình thường" }];
const C = [["can", "乾", "cung Càn", 0.68, 0.8], ["kham", "坎", "cung Khảm", 0.5, 0.86], ["can2", "艮", "cung Cấn", 0.36, 0.8], ["chan", "震", "cung Chấn", 0.32, 0.68],
  ["ton", "巽", "cung Tốn", 0.38, 0.58], ["ly", "離", "cung Ly", 0.5, 0.57], ["khon", "坤", "cung Khôn", 0.63, 0.58], ["doai", "兌", "cung Đoài", 0.68, 0.68], ["minh_duong", "明堂", "Minh Đường", 0.5, 0.71]];
const KQ = { hop_le: true, loi: null, nhan: [{ ma: "ngon_dai", ten: "Ngón tay dài so với lòng bàn tay", vua: false }, { ma: "tro_ap_ut", ten: "Ngón trỏ và ngón áp út dài gần bằng nhau", vua: true }],
  sach_ghi: [{ ma: "x", loi: "Sách xưa ghi «指纖長者性慈» — ngón tay thon dài, tính hiền, nhanh hiểu.", viec: "Ghi lại ý hay mỗi ngày." }],
  cung: C.map(([ma, han, t, x, y]) => ({ ma, han, ten: `Gò trên bàn tay (${t})`, vt: [x, y], y: "Sách xưa gắn cung này với một mảng đời: cha mẹ, nhà cửa, công danh.", lua_chon: LC })),
  bo_nhom_c: 0, cau_ket: "Ghi chép của người xưa, không phải lời đoán riêng cho bạn." };
const ANH = readFileSync(join(__dirname, "..", "public", "anh", "do-hinh", "bat-quai-ban-tay.webp"));
for (const w of [1280, 390]) {
  test(`chụp ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.route("**/api/chi-tay/do-tay", (r) => r.fulfill({ json: KQ }));
    await page.addInitScript((d) => { (window as any).__ctTest = { diem: d }; }, DIEM);
    await page.goto("/chi-tay");
    const k = page.getByTestId("chup-ban-tay");
    await k.screenshot({ path: `${OUT}/ct_truoc_${w}.png` });
    await page.getByTestId("ct-dong-y").check();
    await page.getByTestId("ct-input-tai").setInputFiles({ name: "t.webp", mimeType: "image/webp", buffer: ANH });
    await page.locator("[data-testid=ct-cung][data-ma=ly]").click();
    await page.locator("[data-testid=ct-lua-chon][data-ma=day]").click();
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log("scrollWidth", w, sw);
    await k.screenshot({ path: `${OUT}/ct_anh_${w}.png` });
  });
}
