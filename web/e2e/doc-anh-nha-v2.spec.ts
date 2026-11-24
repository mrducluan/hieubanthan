import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

// PT-V2 v3 — "Để máy đọc ảnh": tối đa 6 ảnh, phòng của từng ảnh, ảnh bằng chứng lấy theo danh sách ĐÃ GỬI (bỏ ảnh khác sau đó
// không làm lệch), bấm ảnh bằng chứng mở ảnh cỡ lớn, ô đồng ý tự bỏ tích sau mỗi lần gửi, không có ở bản tiếng Anh.
// Route web giả bằng page.route (E2E không có khoá dịch vụ đọc ảnh); danh mục dấu hiệu / tên phòng lấy từ engine thật.
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const tep = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `a${i + 1}.png`, mimeType: "image/png", buffer: PNG_1X1 }));

const KQ = {
  da_bat: true, ly_do_tat: null, can_xac_nhan: true,
  dau_hieu: [
    { ma: "xa_ngang", co: true, do_tin: 0.91, ly_do: "Thấy dầm ngang chạy trên đầu giường.", anh_so: 2, phong: "phong_ngu_chinh" },
    { ma: "be_ca", co: true, do_tin: 0.5, ly_do: "Có khối trong suốt giống bể cá cạnh tường." },
  ],
  phong_doan: [{ phong: "phong_ngu_chinh", do_tin: 0.88 }],
  anh: [{ so: 1, phong: "cua_chinh", do_tin: 0.8 }, { so: 2, phong: "phong_ngu_chinh", do_tin: 0.88 }, { so: 9, phong: "bep", do_tin: 0.9 }],
  goc_thieu: ["bep"],
  luu_y: [],
};

/** Ảnh `blob:` còn sống (chưa bị thu hồi) thì tạo <img> mới vẫn tải được. */
const conSong = (page: import("@playwright/test").Page, src: string) => page.evaluate((u) => new Promise<boolean>((ok) => {
  const i = new Image(); i.onload = () => ok(true); i.onerror = () => ok(false); i.src = u;
}), src);

test("PT-V2 v3: 6 ảnh, phòng từng ảnh, ảnh bằng chứng theo danh sách đã gửi, xem ảnh lớn, đồng ý tự bỏ tích, thân gửi không có ngon_ngu", async ({ page }) => {
  await napHoSo(page);
  const goi: Record<string, unknown>[] = [];
  await page.route("**/api/phongthuy/doc-anh", async (r) => { goi.push(r.request().postDataJSON()); await r.fulfill({ json: KQ }); });
  await page.goto("/phong-thuy");
  const ks = page.getByTestId("khao-sat-nha");
  const da = ks.getByTestId("doc-anh-nha");
  await expect(da).toBeVisible();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("0/6");

  // Chọn 7 ảnh → chỉ nhận 6; ô chọn ảnh khoá lại; nhiều ảnh thì không còn ô "Góc chụp"
  const chon = da.getByLabel("Chọn 1–6 ảnh để máy đọc (không lưu)");
  await chon.setInputFiles(tep(7));
  await expect(da.getByTestId("doc-anh-dem")).toContainText("6/6");
  await expect(chon).toBeDisabled();
  await expect(da.getByLabel("Góc chụp")).toHaveCount(0);
  await da.getByRole("button", { name: "Bỏ ảnh 6" }).click();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("5/6");

  // Đồng ý không tích sẵn; tích rồi gửi → thân gửi 5 ảnh, không `ngon_ngu`, nhiều ảnh thì `goc` = null
  const dongY = da.getByTestId("doc-anh-dong-y");
  const nut = da.getByTestId("doc-anh-nut");
  await expect(dongY).not.toBeChecked();
  await expect(nut).toBeDisabled();
  await dongY.check();
  await nut.click();
  await expect(da.getByTestId("doc-anh-ket-qua")).toBeVisible();
  expect(goi).toHaveLength(1);
  const than = goi[0] as { anh: unknown[]; goc: unknown };
  expect(than.anh).toHaveLength(5);
  expect(than.goc).toBeNull();
  expect(Object.keys(than)).not.toContain("ngon_ngu");
  // mỗi lần gửi là một lần tự tích
  await expect(dongY).not.toBeChecked();
  await expect(nut).toBeDisabled();

  // Phòng của từng ảnh (ảnh số 9 không có → bỏ qua), gợi ý xếp theo phòng, chỗ chính còn thiếu ảnh
  const chip = da.getByTestId("doc-anh-chip-phong");
  await expect(chip).toHaveCount(2);
  await expect(chip.nth(0)).toHaveText("Cửa chính");
  await expect(chip.nth(1)).toHaveText("Phòng ngủ chính");
  await expect(da.getByTestId("doc-anh-nhom-phong_ngu_chinh")).toContainText("Phòng ngủ chính");
  await expect(da.getByTestId("doc-anh-nhom-phong_ngu_chinh").getByTestId("doc-anh-dong-xa_ngang")).toBeVisible();
  await expect(da.getByTestId("doc-anh-nhom-khac").getByTestId("doc-anh-dong-be_ca")).toBeVisible();
  await expect(da.getByTestId("doc-anh-ket-qua").getByRole("listitem")).toHaveCount(2);
  await expect(da.getByTestId("doc-anh-goc-thieu")).toContainText("Chưa có ảnh: Bếp");

  // Ảnh bằng chứng = ảnh thứ 2 ĐÃ GỬI; dòng không có anh_so thì không có ảnh
  const dsAnh = da.getByTestId("doc-anh-ds").locator("li");
  const bangChung = da.getByTestId("doc-anh-bang-chung-xa_ngang");
  await expect(bangChung).toContainText("Ảnh #2");
  await expect(da.getByTestId("doc-anh-bang-chung-be_ca")).toHaveCount(0);
  const srcThu2 = (await dsAnh.nth(1).locator("img").getAttribute("src"))!;
  expect(srcThu2).toMatch(/^blob:/);
  await expect(bangChung.locator("img")).toHaveAttribute("src", srcThu2);

  // Bỏ ảnh 1 SAU khi có kết quả: ảnh bằng chứng vẫn là đúng ảnh đã gửi (nay đứng đầu danh sách), kết quả ghi rõ là của lần gửi trước
  await da.getByRole("button", { name: "Bỏ ảnh 1" }).click();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("4/6");
  await expect(bangChung.locator("img")).toHaveAttribute("src", srcThu2);
  await expect(dsAnh.nth(0).locator("img")).toHaveAttribute("src", srcThu2);
  await expect(da.getByTestId("doc-anh-kq-cu")).toBeVisible();
  // Bỏ luôn chính ảnh ấy khỏi danh sách: kết quả còn trỏ tới nó nên ảnh chưa bị thu hồi
  await da.getByRole("button", { name: "Bỏ ảnh 1" }).click();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("3/6");
  await expect(bangChung.locator("img")).toHaveAttribute("src", srcThu2);
  expect(await conSong(page, srcThu2)).toBe(true);

  // Bấm ảnh bằng chứng → ảnh cỡ lớn + câu hỏi + lý do + Đúng / Không ngay trong khung
  await bangChung.click();
  const to = page.getByTestId("doc-anh-xem-to");
  await expect(to).toBeVisible();
  await expect(to.locator("img")).toHaveAttribute("src", srcThu2);
  await expect(to).toContainText("Thấy dầm ngang chạy trên đầu giường.");
  const oXa = ks.getByRole("checkbox", { name: /Giường hoặc bàn làm việc nằm ngay dưới xà ngang/ });
  await to.getByTestId("doc-anh-dung-to-xa_ngang").click();
  await expect(to.getByTestId("doc-anh-dung-to-xa_ngang")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(to).toHaveCount(0);
  await expect(oXa).toBeChecked();
  await expect(da.getByTestId("doc-anh-dung-xa_ngang")).toHaveAttribute("aria-pressed", "true");

  // đo lường: chỉ mã
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "chart_interacted" && e.kind === "doc_anh_phong_to" && e.ma === "xa_ngang")).toBe(true);
  expect(sk.some((e) => e.su_kien === "chart_interacted" && e.kind === "doc_anh" && e.so_anh === 5 && e.so_dau_hieu === 2)).toBe(true);
  // không ảnh nào vào bộ nhớ máy
  const luu = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(luu).not.toContain("blob:");
});

test("PT-V2 v3: một ảnh — còn ô góc chụp (gợi ý), máy đoán phòng thì dùng làm góc chụp được; gửi lại phải tích lại", async ({ page }) => {
  await napHoSo(page);
  const goi: { goc: unknown; anh: unknown[] }[] = [];
  await page.route("**/api/phongthuy/doc-anh", async (r) => {
    goi.push(r.request().postDataJSON());
    await r.fulfill({ json: { ...KQ, anh: [{ so: 1, phong: "phong_ngu_chinh", do_tin: 0.9 }], goc_thieu: ["cua_chinh", "bep"], dau_hieu: [{ ...KQ.dau_hieu[0], anh_so: 1 }] } });
  });
  await page.goto("/phong-thuy");
  const da = page.getByTestId("khao-sat-nha").getByTestId("doc-anh-nha");
  await da.getByLabel("Chọn 1–6 ảnh để máy đọc (không lưu)").setInputFiles(tep(1));
  await da.getByLabel("Góc chụp").selectOption("bếp");
  await da.getByTestId("doc-anh-dong-y").check();
  await da.getByTestId("doc-anh-nut").click();
  await expect(da.getByTestId("doc-anh-ket-qua")).toContainText("Có vẻ đây là Phòng ngủ chính");
  expect(goi[0]!.goc).toBe("bếp");
  await da.getByTestId("doc-anh-dung-goc").click();
  await expect(da.getByLabel("Góc chụp")).toHaveValue("Phòng ngủ chính");
  await expect(da.getByTestId("doc-anh-goc-thieu")).toContainText("Cửa chính, Bếp");
  // gửi lần hai: phải tự tích lại
  await expect(da.getByTestId("doc-anh-nut")).toBeDisabled();
  await da.getByTestId("doc-anh-dong-y").check();
  await da.getByTestId("doc-anh-nut").click();
  await expect.poll(() => goi.length).toBe(2);
  expect(goi[1]!.goc).toBe("Phòng ngủ chính");
});

test("PT-V2 v3: bản tiếng Anh không có khối máy đọc ảnh", async ({ page }) => {
  await napHoSo(page);
  let goi = 0;
  await page.route("**/api/phongthuy/doc-anh", async (r) => { goi += 1; await r.abort(); });
  await page.goto("/en/feng-shui");
  await expect(page.getByTestId("khao-sat-nha")).toBeVisible();
  await expect(page.getByTestId("doc-anh-nha")).toHaveCount(0);
  expect(goi).toBe(0);
});
