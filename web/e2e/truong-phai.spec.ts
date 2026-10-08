// TP-LICH — chọn âm lịch (Việt/Trung) và trường phái ở mọi mảng: người dùng bấm, engine tính lại, trang hiện rõ.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, hoi, napHoSo } from "./_hoso";

test("Bát tự: sinh 23:30 → đổi 'Đổi ngày lúc 23:00' ra trụ ngày hôm sau (nhật chủ Nhâm → Quý)", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, gio: "23:30" });
  await page.goto("/bat-tu");
  const phai = page.getByTestId("truong-phai-bat-tu");
  await expect(phai).toContainText("hai phái ra TRỤ NGÀY khác nhau");
  await expect(phai).toContainText("không làm đổi tứ trụ");          // âm lịch: nói rõ Bát tự theo tiết khí
  const tt = page.getByTestId("tu-tru");
  await expect(tt).toContainText("Nhật chủ Nhâm");
  await phai.getByRole("tab", { name: "Đổi ngày lúc 23:00" }).click();
  await expect(tt).toContainText("Nhật chủ Quý");
  await expect(tt).toContainText("Lục hợp · năm – ngày (Ngọ–Mùi)");     // chi ngày giờ là Mùi (ngày hôm sau)
  const ans = await hoi(page, "Nhật chủ của tôi là gì?");             // hỏi đáp đi theo phái đang chọn
  await expect(ans).toContainText("Quý");
});

test("Phong thuỷ: sinh 01/02/1985 → ba mốc đầu năm cho mệnh quái khác nhau; chọn Tết lịch Việt → Càn", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 1, thang: 2, nam: 1985 });
  await page.goto("/phong-thuy");
  const phai = page.getByTestId("truong-phai-phong-thuy");
  await expect(phai).toContainText("mệnh quái KHÁC nhau");
  await expect(phai).toContainText("Tết (lịch Việt): Càn");
  const mq = page.getByTestId("menh-quai");
  await expect(mq).toContainText("Đoài");
  await expect(mq).toContainText("tính theo năm 1984 (Lập xuân)");
  await phai.getByRole("tab", { name: "Tết lịch Việt" }).click();
  await expect(mq).toContainText("Càn");
  await expect(mq).toContainText("tính theo năm 1985 (Tết (lịch Việt))");
});

test("Kinh Dịch Mai Hoa: chọn âm lịch, quẻ ghi rõ lấy theo lịch nào", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("mai_hoa");
  const lich = page.getByLabel("Âm lịch cho Mai Hoa");
  await expect(lich).toBeVisible();
  await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  await expect(page.getByTestId("mai-hoa-lich").last()).toContainText("âm lịch Việt Nam");
  await lich.selectOption("trung");
  await hoi(page, "Tôi có nên chuyển sang công ty mới không?");
  await expect(page.getByTestId("mai-hoa-lich").last()).toContainText("âm lịch Trung Quốc");
});

test("Hồ sơ: ngày âm 1/8 nhuận 1995 — lịch Việt ra 24/9, lịch Trung Quốc ra 25/9", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Âm lịch", exact: true }).click();
  await page.getByLabel("Ngày", { exact: true }).fill("1");
  await page.getByLabel("Tháng", { exact: true }).fill("8");
  await page.getByLabel("Năm", { exact: true }).fill("1995");
  await page.getByText("Tháng nhuận").click();
  const doi = page.getByTestId("doi-lich");
  await expect(doi).toContainText("24/9/1995");
  await page.getByRole("radio", { name: "Âm lịch Trung Quốc" }).click();
  await expect(doi).toContainText("25/9/1995");
  await expect(doi).toContainText("đổi theo âm lịch Trung Quốc");
});
