import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Hỏi gì xem nấy: chọn intent, bật/tắt Bạch thoại, mở Vì sao & trạng thái Đang hoàn thiện", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  await expect(page.getByTestId("hoi-gi-lazy-intake")).toBeVisible();

  await page.getByTestId("hoi-gi-intent-bo_cuc").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("Veto");

  const viSao = page.getByTestId("hoi-gi-vi-sao");
  await viSao.locator("summary").click();
  await expect(viSao).toContainText("Táng Thư");

  await page.getByTestId("hoi-gi-bach-thoai").click();
  await expect(viSao).toContainText("dau_hieu_veto");

  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("đang hoàn thiện");
});

test("Hỏi gì xem nấy: mobile 375px & reduced-motion không tràn ngang", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  const rect = await box.boundingBox();
  expect(rect?.width ?? 999).toBeLessThanOrEqual(375);
});

test("Hỏi gì xem nấy: bản tiếng Anh /en/feng-shui", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/en/feng-shui");
  await expect(page.getByTestId("hoi-gi-xem-nay")).toContainText("What do you want to check about this home?");
  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-intent-mo_quan")).toContainText("In progress");
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("being finalized");
});

test("Hỏi gì xem nấy: gọi API thật khi có HoSoNha, prefill KhungChat, giữ 1 H1 & thứ tự TRẢ LỜI NHANH", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.nha.v1", JSON.stringify({ v: 1, huong_do: 180, nam_xay: 2024, loai_nha: "nha_pho", cap_nhat_luc: "2026-11-22T00:00:00Z" }));
  });
  await page.goto("/phong-thuy");

  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("180°");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Nam");

  const seoCheck = await page.evaluate(() => {
    const h1s = document.querySelectorAll("h1").length;
    const html = document.body.innerHTML.toLowerCase();
    const quickIdx = html.indexOf("trả lời nhanh");
    const hoiIdx = html.indexOf("hoi-gi-xem-nay");
    return { h1s, quickBeforeHoi: quickIdx !== -1 && hoiIdx !== -1 && quickIdx < hoiIdx };
  });
  expect(seoCheck.h1s).toBe(1);
  expect(seoCheck.quickBeforeHoi).toBe(true);

  await page.getByTestId("hoi-gi-hoi-tiep").click();
  await expect(page.locator("#hoi-phong-thuy textarea")).toHaveValue(/Cửa chính nhà tôi/);
});

test("Phase 2: Huyền Không ▶ Khởi Bàn (reduced-motion) & 4 lớp sao + La bàn trung bình góc 359°/1° → 0°", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await napHoSo(page);
  await page.goto("/phong-thuy");

  // 1. Huyền Không Khởi Bàn + 4 layer toggles
  const hk = page.locator("#huyen-khong");
  await hk.getByRole("button", { name: "Lập bàn" }).click();
  await expect(hk.getByTestId("hk-khoi-ban")).toBeVisible();
  await hk.getByTestId("hk-khoi-ban").click();
  await expect(hk.getByTestId("hk-lop-van")).toBeChecked();
  await expect(hk.getByTestId("hk-lop-ln")).toBeChecked();
  await hk.getByTestId("hk-lop-ln").uncheck();
  await expect(hk.getByTestId("hk-lop-ln")).not.toBeChecked();

  // 2. La bàn cảm biến giả lập 359° và 1° → trung bình góc tuần hoàn phải ra 0° (không phải 180°)
  await page.getByTestId("do-huong").getByRole("button", { name: /Đo bằng la bàn điện thoại/i }).click();
  await expect(async () => {
    await page.evaluate(() => {
      const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
      const fire = (heading: number) => {
        const ev = new DeviceOrientationEvent(evName, { alpha: (360 - heading) % 360, absolute: true });
        window.dispatchEvent(ev);
      };
      fire(359);
      fire(1);
    });
    await expect(page.getByTestId("la-ban-do-so")).toContainText("0°", { timeout: 500 });
  }).toPass();
  await expect(page.getByTestId("la-ban-sai-so")).toContainText("±");
  await expect(page.getByTestId("la-ban-doi-chieu-ve-tinh")).toBeVisible();
});

test("Phase 3: HoiGiXemNay Inline Quick La Kinh -> cảm biến 180° -> Chốt tại chỗ -> cập nhật Huyền Không & DoHuong", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hbt.hoso.v1", JSON.stringify({
      v: 1, ho_ten: "Test", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", tao_luc: "2026-09-30T00:00:00Z",
    }));
    localStorage.removeItem("hbt.nha.v1");
  });
  await page.goto("/phong-thuy");

  // Chưa có HoSoNha -> hiện Lazy Intake & nút mở La Kinh nhanh
  await expect(page.getByTestId("hoi-gi-lazy-intake")).toBeVisible();
  await page.getByTestId("hoi-gi-bat-la-kinh").click();
  await expect(page.getByTestId("hoi-la-kinh-panel")).toBeVisible();
  await expect(page.getByTestId("mini-la-ban-keo")).toBeVisible();

  // Bật đo điện thoại & bắn sự kiện cảm biến 90° (Đông · sơn Mão)
  await page.getByTestId("hoi-la-kinh-cam-bien").click();
  await expect(async () => {
    await page.evaluate(() => {
      const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
      window.dispatchEvent(new DeviceOrientationEvent(evName, { alpha: 270, beta: 3, gamma: -2, absolute: true }));
    });
    await expect(page.getByTestId("hoi-la-kinh-do-so")).toContainText("90°", { timeout: 500 });
  }).toPass();
  await expect(page.getByTestId("hoi-la-kinh-on-dinh")).toContainText("%");

  // Nhập năm xây 2024 và Chốt ngay trong HoiGiXemNay
  await page.getByTestId("hoi-la-kinh-nam-xay").fill("2024");
  await page.getByTestId("hoi-la-kinh-chot").click();

  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("90°");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Mão");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Vận 9");
  await expect(page.getByTestId("la-ban-do-so")).toContainText("90°");
});

test("User-Agent Audit: Chốt ở HoiGiXemNay -> mở khoá ngay DoViTriVat (không reload) + đồng bộ Chung cư/NhaCuaBan + lưu vị trí vật giữ nguyên hướng", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hbt.hoso.v1", JSON.stringify({
      v: 1, ho_ten: "Test", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", tao_luc: "2026-09-30T00:00:00Z",
    }));
    localStorage.removeItem("hbt.nha.v1");
  });
  await page.goto("/phong-thuy");

  // 1. Lúc mới vào chưa có hướng nhà: khối Đo vị trí thật trong nhà (DoViTriVat) ở chế độ khung tỉ lệ nhắc "Cần hướng nhà trước"
  const vt = page.getByTestId("vi-tri-vat");
  await expect(vt).toBeVisible();
  await vt.getByTestId("vi-tri-cach-khung").click();
  await expect(vt.getByTestId("vi-tri-can-huong")).toBeVisible();

  // 2. Người dùng chọn loại nhà "Chung cư" ở Hành trình nhà rồi mở La Kinh nhanh ở HoiGiXemNay
  await page.getByTestId("loai-nha-can_ho").click();
  await page.getByTestId("hoi-gi-bat-la-kinh").click();
  await expect(page.getByTestId("hoi-la-kinh-panel")).toContainText(/ban công/i);

  // 3. Nhập 180° (Nam · Ngọ) và năm xây 2018 -> bấm Chốt hướng ngay trong HoiGiXemNay (không reload trang)
  await page.getByTestId("hoi-la-kinh-nhap").fill("180");
  await page.getByTestId("hoi-la-kinh-nam-xay").fill("2018");
  await page.getByTestId("hoi-la-kinh-chot").click();

  // 4. Kiểm chứng đồng bộ tức thời:
  // - Kết luận thực tế hiện 180° · Ngọ · Vận 8
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("180°");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Ngọ");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Vận 8");
  // - DoViTriVat tự mất cảnh báo "Cần hướng nhà trước" và hiện "Mặt trước · 180°"
  await expect(vt.getByTestId("vi-tri-can-huong")).toHaveCount(0);
  await expect(vt).toContainText("180°");
  // - NhaCuaBan tự điền sẵn năm xây 2018 và độ hướng 180
  await expect(page.locator("#nha-cua-ban").getByLabel(/Năm xây|Build/i)).toHaveValue("2018");

  // 5. Người dùng chạm đặt Cửa chính, Phòng chính, Bếp trên khung tỉ lệ DoViTriVat rồi bấm Xem & Lưu -> huong_do vẫn giữ nguyên 180°
  const khung = vt.getByTestId("vi-tri-khung");
  await khung.click({ position: { x: 80, y: 20 } });   // cửa chính
  await khung.click({ position: { x: 80, y: 120 } });  // phòng chính
  await khung.click({ position: { x: 80, y: 200 } });  // bếp
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  await vt.getByTestId("vi-tri-luu").click();

  const hoSoNha = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") || "{}"));
  expect(hoSoNha.huong_do).toBe(180);
  expect(hoSoNha.theo).toBe("ban_cong");
  expect(hoSoNha.nam_xay).toBe(2018);
  expect(hoSoNha.bo_cuc?.vi_tri?.bep).toBeTruthy();

  // 6. Chuyển sang intent "Nhà có phạm lỗi nặng (Loan Đầu / Bếp / WC) không?" -> có nút dẫn thẳng xuống #vi-tri-vat & #doc-anh-nha
  await page.getByTestId("hoi-gi-intent-bo_cuc").click();
  await expect(page.getByTestId("hoi-gi-do-vi-tri-vat")).toHaveAttribute("href", "#vi-tri-vat");
  await expect(page.getByTestId("hoi-gi-doc-anh-nha")).toHaveAttribute("href", "#doc-anh-nha");
});

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

test("PT-V2 v2: Đọc tối đa 6 ảnh + thumbnail bằng chứng anh_so + xoá ảnh trước khi gửi + mở trên /en/feng-shui", async ({ page }) => {
  let bodyGui: Record<string, unknown> | null = null;
  await page.route("**/api/phongthuy/doc-anh", async (route) => {
    bodyGui = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        da_bat: true,
        ly_do_tat: null,
        dau_hieu: [
          { ma: "guong_giuong", co: true, do_tin: 0.91, ly_do: "Gương lớn đối diện giường ở ảnh 2.", anh_so: 2 },
          { ma: "xa_ngang", co: true, do_tin: 0.65, ly_do: "Dầm ngang trên trần." },
        ],
        phong_doan: [{ phong: "phong_ngu_chinh", do_tin: 0.88 }],
        luu_y: [],
        can_xac_nhan: true,
      }),
    });
  });

  await page.goto("/phong-thuy");
  const da = page.getByTestId("doc-anh-nha");
  await expect(da).toBeVisible();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("0/6");

  // Chọn 4 ảnh -> xoá 1 ảnh còn 3/6 ảnh
  const chon = da.locator("input[type=file]");
  await chon.setInputFiles([
    { name: "a1.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a2.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a3.png", mimeType: "image/png", buffer: PNG_1X1 },
    { name: "a4.png", mimeType: "image/png", buffer: PNG_1X1 },
  ]);
  await expect(da.getByTestId("doc-anh-dem")).toContainText("4/6");
  await da.getByRole("button", { name: "Bỏ ảnh 4" }).click();
  await expect(da.getByTestId("doc-anh-dem")).toContainText("3/6");

  // Tự tích đồng ý rồi bấm Đọc ảnh -> hiện thumbnail bằng chứng "Ảnh #2" ở dòng guong_giuong, không hiện ở dòng xa_ngang
  await da.getByTestId("doc-anh-dong-y").check();
  await da.getByTestId("doc-anh-nut").click();
  await expect(da.getByTestId("doc-anh-ket-qua")).toBeVisible();
  expect((bodyGui as { anh?: unknown[] } | null)?.anh?.length).toBe(3);
  await expect(da.getByTestId("doc-anh-bang-chung-guong_giuong")).toContainText("Ảnh #2");
  await expect(da.getByTestId("doc-anh-bang-chung-xa_ngang")).toHaveCount(0);
});

test("Sơ đồ mặt bằng Mini-CAD v2: vẽ hộp phòng, xoay hướng cửa 90°, chỉnh kích thước, xoá chip ×, hoàn tác & tự phát hiện lỗi bố cục", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "hbt.nha.v1",
      JSON.stringify({ v: 1, huong_do: 180, theo: "cua", thanh_vien: [], cap_nhat_luc: "2026-11-24T00:00:00.000Z" }),
    );
  });
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();

  const khung = vt.getByTestId("vi-tri-khung");
  const bam = async (loai: string, x: number, y: number) => {
    await vt.getByTestId(`vi-tri-dat-${loai}`).click();
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  };

  // 1. Đặt Cửa chính, Phòng chính, WC trong vùng Trung cung (0.56, 0.52)
  await bam("cua_chinh", 0.5, 0.05);
  await bam("phong_ngu_chinh", 0.25, 0.35);
  await bam("ve_sinh", 0.56, 0.52);

  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-hop-phong_ngu_chinh")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toBeVisible();

  // 2. Tự động gợi ý WC giữa nhà (KHÔNG tích sẵn — người dùng phải tự tích mới lưu)
  await expect(vt.getByTestId("vi-tri-phat-hien")).toContainText("Trung cung");
  await expect(vt.getByTestId("vi-tri-xn-wc_giua_nha")).not.toBeChecked();
  await vt.getByTestId("vi-tri-xn-wc_giua_nha").check();

  // 3. Chỉnh Phòng chính: xoay hướng cửa 90°, tăng kích thước (m) & kéo dời vị trí bằng chuột
  await vt.getByTestId("vi-tri-dat-phong_ngu_chinh").click();
  await expect(vt.getByTestId("vi-tri-chinh-phong")).toBeVisible();
  const huongTruoc = await vt.getByTestId("vi-tri-huong-cua-nhan").innerText();
  await vt.getByTestId("vi-tri-xoay-cua").click();
  await expect(vt.getByTestId("vi-tri-huong-cua-nhan")).not.toHaveText(huongTruoc);

  const rongTruoc = await vt.getByTestId("vi-tri-phong-rong").innerText();
  await vt.getByTestId("vi-tri-phong-rong-tang").click();
  await expect(vt.getByTestId("vi-tri-phong-rong")).not.toHaveText(rongTruoc);

  // Kéo dời Phòng chính xuống dưới trên canvas
  const hopBox = (await vt.getByTestId("vi-tri-hop-phong_ngu_chinh").boundingBox())!;
  await page.mouse.move(hopBox.x + hopBox.width / 2, hopBox.y + hopBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(hopBox.x + hopBox.width / 2, hopBox.y + hopBox.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  const hopSau = (await vt.getByTestId("vi-tri-hop-phong_ngu_chinh").boundingBox())!;
  expect(hopSau.y).toBeGreaterThan(hopBox.y + 15);

  // 4. Xem kết quả -> Lưu vào hồ sơ nhà -> reload vẫn giữ kích thước, hướng cửa & dấu hiệu đã xác nhận
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  await vt.getByTestId("vi-tri-luu").click();
  const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("hbt.nha.v1") || "{}"));
  expect(saved.tang_do?.[0]?.vat?.phong_ngu_chinh?.kich_thuoc).toBeTruthy();
  expect(saved.tang_do?.[0]?.vat?.phong_ngu_chinh?.huong_cua).toBeTruthy();
  expect(saved.bo_cuc?.dau_hieu).toContain("wc_giua_nha");

  // 5. Xoá Nhà vệ sinh bằng nút × ngay trên chip -> biến mất khỏi sơ đồ -> Hoàn tác -> hiện lại
  await vt.getByTestId("vi-tri-xoa-chip-ve_sinh").click();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toHaveCount(0);
  await vt.getByTestId("vi-tri-hoan-tac").click();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toBeVisible();

  // 6. Xoá tầng -> sạch toàn bộ hộp phòng
  await vt.getByTestId("vi-tri-xoa-tang").click();
  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-hop-phong_ngu_chinh")).toHaveCount(0);
});


