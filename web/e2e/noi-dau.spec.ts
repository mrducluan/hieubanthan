// TS-NOIDAU — "Bạn đang vướng ở đâu?": bảng 5 trụ đời × câu hỏi nỗi đau, bấm câu → hỏi đáp trả lời → "hỏi tiếp";
// giao điểm hai phái ở bài Chaldea. Engine thật (webServer), không giả lập.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("bảng nỗi đau: con số của mình + bấm câu → câu trả lời + hỏi tiếp", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  const bang = page.getByTestId("noi-dau");
  await expect(bang.getByRole("tab")).toHaveCount(5);
  // Trụ đầu (Sự nghiệp): câu chọn nghề kèm số Sứ mệnh 9 + Đường đời 33 của chính người này.
  const the = bang.getByTestId("noi-dau-sn_sai_nghe");
  await expect(the).toContainText("Sứ mệnh 9");
  await expect(the).toContainText("Đường đời 33");

  await the.getByRole("button", { name: "Hỏi câu này" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Ghép trực tiếp từ kho tri thức có nguồn.");
  const tiep = ans.getByTestId("hoi-tiep");
  await expect(tiep.getByRole("button")).not.toHaveCount(0);

  // Bấm một câu hỏi tiếp → thêm một lượt trả lời.
  const truoc = await page.getByTestId("cau-tra-loi").count();
  await tiep.getByRole("button").first().click();
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(truoc + 1);

  // Đổi trụ: Thời điểm & nhịp có năm cá nhân của người này.
  await bang.getByRole("tab", { name: /Thời điểm/ }).click();
  await expect(bang.getByTestId("noi-dau-td_nam_nay")).toContainText("Năm cá nhân");

  const suKien = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; ma_cau?: string }[] }).__hbt_su_kien ?? []);
  const bam = suKien.filter((e) => e.su_kien === "pain_point_clicked");
  expect(bam.map((e) => e.ma_cau)).toContain("sn_sai_nghe");
  // Chỉ gửi mã — không có câu chữ, tên hay ngày sinh.
  for (const e of bam) expect(JSON.stringify(e)).not.toMatch(/Luân|1988|nghề/);
});

test("câu hợp đôi từ bảng → mời sang mục Hợp đôi, không gợi hỏi tiếp", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  const bang = page.getByTestId("noi-dau");
  await bang.getByRole("tab", { name: /Tình cảm/ }).click();
  await bang.getByTestId("noi-dau-tc_hop_nhau").getByRole("button", { name: "Hỏi câu này" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans.getByRole("link", { name: /Hợp đôi/ })).toBeVisible();
  await expect(ans.getByTestId("hoi-tiep")).toHaveCount(0);
});

test("Chaldea: giao điểm hai phái khi ngày sinh 19", async ({ page }) => {
  await napHoSo(page, { ...LUAN, ho_ten: "Nguyễn Văn An", ngay: 19, thang: 5, nam: 1990 });
  await page.addInitScript(() => localStorage.setItem("hbt.thanso_phai", "chaldea"));
  await page.goto("/than-so");
  const gd = page.getByTestId("giao-diem");
  await expect(gd).toContainText("Pitago: nợ nghiệp 19");
  await expect(gd).toContainText("Chaldea: kép 19");
  // Bảng nỗi đau vẫn có ở phái Chaldea.
  await expect(page.getByTestId("noi-dau")).toBeVisible();
});
