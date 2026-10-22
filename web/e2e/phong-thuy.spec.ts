// Phong thuỷ (HH-4): hồ sơ → mệnh quái + la bàn → hỏi.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test("mệnh quái + la bàn + hướng hợp tuổi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  await expect(page.getByTestId("menh-quai")).toContainText("Khảm");
  await expect(page.getByRole("img", { name: /La bàn 8 hướng/ })).toBeVisible();
  // UI-PT 3: thẻ "Hành trình nhà bạn" — mệnh đã có, hướng nhà sẵn sàng (chưa đo), khảo sát sẵn sàng
  const ht = page.getByTestId("hanh-trinh-nha");
  await expect(ht).toContainText("mệnh Khảm");
  await expect(ht.getByTestId("hanh-trinh-menh")).toHaveAttribute("data-trang-thai", "xong");
  await expect(ht.getByTestId("hanh-trinh-huong")).toHaveAttribute("data-trang-thai", "san_sang");
  await expect(ht.getByTestId("hanh-trinh-ten-nha")).toHaveCount(0);                // chưa có nhà lưu → không có tên/xoá
  const ans = await hoi(page, "Nhà hướng Tây Nam có hợp với tôi không?");
  await expect(ans).toContainText("Mệnh quái (cung phi) của bạn: Khảm");
  await expect(ans).toContainText("Tuyệt Mệnh");
});

test("PT-ĐS: Nhà của bạn — đọc bằng lời thường, 5 chương, người cùng ở khác nhóm, phần sách vở gập", async ({ page }) => {
  await napHoSo(page);                                   // nam 17/05/1990 → mệnh Khảm (Đông tứ)
  await page.goto("/phong-thuy");
  const nha = page.getByTestId("nha-cua-ban");
  await nha.getByLabel("Độ hướng nhà cho bài đọc").fill("180");
  await nha.getByLabel("Năm xây hoặc năm dọn vào").fill("2008");
  await nha.getByRole("button", { name: "Thêm người cùng ở" }).click();
  await nha.getByLabel("Năm sinh người cùng ở 1").fill("1992");
  await nha.getByRole("button", { name: "Đọc nhà của tôi" }).click();
  const bc = nha.getByTestId("bao-cao-nha");
  await expect(bc).toBeVisible();
  await expect(bc.getByTestId("nha-chuong-ban_hop_huong")).toContainText("Bạn mệnh Khảm");
  const c2 = bc.getByTestId("nha-chuong-ngoi_nha_voi_ban");
  await expect(c2).toContainText("Nhà hướng Nam, Khảm trạch");
  await expect(c2.getByTestId("chip-muc").first()).toContainText("Thuận lợi");
  await expect(c2).toContainText("khác nhóm");                              // vợ 1992 → Đoài, Tây tứ
  await expect(bc.getByTestId("nha-goi-y-phong")).toContainText("Cửa chính / lối vào");
  await expect(bc.getByTestId("nha-ba-thang").locator("[data-muc]")).toHaveCount(3);
  await expect(bc.getByTestId("nha-han-nam")).toContainText("Thái Tuế");
  await expect(bc.getByTestId("nha-hanh-dong")).toContainText("Làm ngay");
  // thuật ngữ chỉ nằm trong "Vì sao nói vậy" (gập)
  await expect(c2.getByTestId("can-cu")).toBeHidden();
  await c2.getByRole("button", { name: "Vì sao nói vậy" }).first().click();
  await expect(c2.getByTestId("can-cu").first()).toContainText("Diên Niên");
  await expect(bc).toContainText("Không cần mua gì thêm");
  // HỌC-ĐS: hộp có nút kiểm chứng; chỉ MÃ ds.phongthuy.* + phái đi lên, không chữ
  const kc = bc.getByTestId("kiem-chung");
  expect(await kc.count()).toBeGreaterThan(2);
  await kc.first().getByRole("button", { name: "Đúng với mình" }).click();
  const sk = await page.evaluate(() => ((window as unknown as { __hbt_su_kien?: ({ su_kien: string } & Record<string, unknown>)[] }).__hbt_su_kien ?? [])
    .filter((e) => e.su_kien === "tuvi_kiem_chung"));
  expect(sk).toHaveLength(1);
  expect(sk[0]!.mau).toMatch(/^ds\.phongthuy\.[a-z0-9_]+\.[a-z0-9_.+-]+$/);
  expect(sk[0]!.phai).toBe("bat_trach_huyen_khong");
  expect(sk[0]!.loai).toBe("doi_song");
  // 81 tổ hợp có thứ tự: chương 2 nêu lĩnh vực theo vai sơn/hướng + năm theo sao lưu niên (nhịp gợi ý)
  await expect(c2).toContainText(/hướng tinh \d .*tiền bạc/i);
  await expect(c2).toContainText("không phải lời đoán");
});

test("bố trí dân gian ghi rõ nguồn", async ({ page }) => {
  await page.goto("/phong-thuy");
  const ans = await hoi(page, "Gương đối diện giường có sao không?");
  await expect(ans).toContainText("quan niệm dân gian");
});

test("Huyền Không: năm 2008, toạ Tý → Song tinh đáo hướng, Thất tinh chân đả kiếp", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("2008");
  await page.getByLabel("Toạ sơn (lưng nhà)").selectOption("Tý");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  const ban = page.getByTestId("ban-huyen-khong");
  await expect(ban).toContainText("Song tinh đáo hướng");
  await expect(ban).toContainText("Thất tinh chân đả kiếp");
  await expect(ban.getByRole("cell", { name: /^Ly Nam: sơn tinh 8, hướng tinh 8, vận tinh 3/ })).toBeVisible();
});

test("Huyền Không: nhập độ la bàn sát ranh giới → cảnh báo kiêm hướng; năm sai → báo rõ, không gửi", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("1800");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "1864–2150" })).toBeVisible();
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("2008");
  await page.getByLabel("Nhập độ la bàn").check();
  await page.getByLabel("Độ la bàn của toạ").fill("350");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  const ban = page.getByTestId("ban-huyen-khong");
  await expect(ban).toContainText("kiêm hướng");
  await expect(ban).toContainText("tính từ Lập xuân");
  await expect(ban.getByRole("row")).toHaveCount(3);
  await expect(ban.getByTestId("the-quai")).toContainText("chưa có nguồn đối chiếu độc lập");
});

test("Huyền Không: đánh dấu kiêm hướng → thế quái (Vận 8 toạ Tý: sơn tinh 4 → 6, hướng tinh 3 → 2)", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("2008");
  await page.getByLabel("Toạ sơn (lưng nhà)").selectOption("Tý");
  await page.getByLabel(/kiêm hướng/).check();
  await page.getByRole("button", { name: "Lập bàn" }).click();
  const tq = page.getByTestId("the-quai");
  await expect(tq).toContainText("4 → 6 (thuận)");
  await expect(tq).toContainText("3 → 2 (nghịch)");
  await expect(tq).toContainText("Nếu lập hạ quái: Song tinh đáo hướng");
  await expect(page.getByTestId("ban-huyen-khong").getByRole("cell", { name: /^Ly Nam: sơn tinh 1, hướng tinh 7/ })).toBeVisible();
});

test("PT-V1: đo hướng nhà — nhập tay và la bàn điện thoại (giả lập cảm biến) → hướng, sơn, trạch, du niên", async ({ page }) => {
  await napHoSo(page);   // hồ sơ mẫu: nam 17/05/1990 → mệnh Khảm
  await page.goto("/phong-thuy");
  const o = page.getByTestId("do-huong");
  // UI-PT 1 "la bàn sống": có mệnh quái → mặt la bàn tô 8 cung (4 cát của Khảm: Bắc, Đông, Đông Nam, Nam)
  await expect(o.getByTestId("la-ban-cung")).toHaveCount(8);
  await expect(o.locator('[data-testid="la-ban-cung"][data-cat="true"]')).toHaveCount(4);
  // chế độ "Tìm hướng kê bàn, đầu giường": nhập độ chỉ đọc sống (không gọi engine, không lưu nhà), nhãn du niên + "hợp đặt"
  await o.getByTestId("la-ban-che-do-ke_do").click();
  await o.getByLabel("Độ đo được").fill("135");
  await o.getByRole("button", { name: "Xem" }).click();
  const song = o.getByTestId("la-ban-song");
  await expect(song).toContainText("Đông Nam");
  await expect(song).toContainText("Sinh Khí");
  await expect(song).toContainText("bàn làm việc");
  await expect(o.getByTestId("ket-qua-do-huong")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.nha.v1"))).toBeNull();
  await o.getByTestId("la-ban-che-do-nha").click();
  await o.getByLabel("Độ hướng nhà").fill("135");
  await o.getByRole("button", { name: "Xem" }).click();
  const kq = page.getByTestId("ket-qua-do-huong");
  await expect(kq).toContainText("Đông Nam");
  await expect(kq).toContainText("sơn Tốn");
  await expect(kq).toContainText("Càn");
  await expect(kq).toContainText("Sinh Khí");

  // Giả lập la bàn Android: alpha tuyệt đối 180 → hướng 180° (Nam)
  await o.getByRole("button", { name: "Đo bằng la bàn điện thoại" }).click();
  await page.evaluate(() => {
    const ten = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.dispatchEvent(new DeviceOrientationEvent(ten, { alpha: 180, beta: 0, gamma: 0, absolute: true }));
  });
  await expect(o.getByText("180°")).toBeVisible();
  await expect(o.getByTestId("la-ban-song")).toContainText("Diên Niên");       // Nam với Khảm, đọc theo thời gian thực
  await o.getByRole("button", { name: "Chốt hướng này" }).click();
  await expect(kq).toContainText("Nam");
  await expect(kq).toContainText("sơn Ngọ");
  await kq.getByRole("button", { name: /lập bàn Huyền Không/ }).click();
  await expect(page.getByLabel("Độ la bàn của toạ")).toHaveValue("0");
});

test("PT-V0: khảo sát nhà — đặt phòng trên sơ đồ 9 phương, đánh dấu dấu hiệu → luận Bát trạch + kho tình huống", async ({ page }) => {
  await napHoSo(page);                                   // nam 1990 → mệnh Khảm
  await page.goto("/phong-thuy");
  const ks = page.getByTestId("khao-sat-nha");
  await ks.getByRole("textbox", { name: "Độ hướng nhà khảo sát" }).fill("180");
  await ks.getByRole("radio", { name: /^Bếp/ }).click();
  await ks.getByRole("button", { name: "Đặt Bếp ở phía Tây", exact: true }).click();
  await ks.getByRole("radio", { name: /^Bàn thờ/ }).click();
  await ks.getByRole("button", { name: "Đặt Bàn thờ ở phía Tây Bắc", exact: true }).click();
  await ks.getByRole("radio", { name: /^Nhà vệ sinh/ }).click();
  await ks.getByRole("button", { name: "Đặt Nhà vệ sinh ở phía Trung cung", exact: true }).click();
  await ks.getByLabel("Có gương đối diện giường ngủ không?").check();
  await ks.getByRole("button", { name: "Xem luận bố cục" }).click();
  const kq = page.getByTestId("ket-qua-bo-cuc");
  await expect(kq).toContainText("Khảm trạch");
  await expect(kq).toContainText("Gia chủ mệnh Khảm");
  await expect(kq.getByRole("row", { name: /Bếp Tây Hoạ Hại/ })).toContainText("hợp");
  await expect(kq.getByRole("row", { name: /Bàn thờ Tây Bắc Lục Sát/ })).toContainText("chưa hợp");
  await expect(kq).toContainText("Gương đối diện giường");
  await expect(kq).toContainText("Nhà vệ sinh ở giữa nhà");            // suy từ vị trí trung cung
  await expect(kq).toContainText("không giới thiệu vật phẩm");
});

test("KC-2: hồ sơ nhà lưu trên máy sau khi đọc → Hôm nay có thẻ Tháng này nhà bạn; mốc nhắc tháng thuận hiện ở Hôm nay", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const nha = page.getByTestId("nha-cua-ban");
  await nha.getByLabel("Độ hướng nhà cho bài đọc").fill("180");
  await nha.getByLabel("Năm xây hoặc năm dọn vào").fill("2008");
  await nha.getByRole("button", { name: "Đọc nhà của tôi" }).click();
  await expect(nha.getByTestId("bao-cao-nha")).toBeVisible();
  const hs = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null"));
  expect(hs).toMatchObject({ v: 1, huong_do: 180, nam_xay: 2008, theo: "cua" });
  await expect(nha.getByTestId("goi-mo-cheo")).toHaveAttribute("data-ma", "nha_cua");
  const thuan = nha.getByTestId("nha-ba-thang").getByTestId("nhac-toi").first();
  if (await thuan.count()) {
    await thuan.getByRole("button", { name: "Nhắc tôi hôm đó" }).click();
  }
  await page.goto("/hom-nay");
  const the = page.getByTestId("thang-nay-nha");
  await expect(the).toBeVisible();
  await expect(the).toContainText("phía cửa Nam");
  await expect(the.getByTestId("chip-muc")).toBeVisible();
  // Huyền Không điền sẵn năm xây từ hồ sơ nhà
  await page.goto("/phong-thuy");
  await expect(page.getByLabel("Năm xây hoặc nhập trạch")).toHaveValue("2008");
});

test("Q2/Q1/Q4/Q5/Q6: vẽ mặt bằng → suy WC giữa nhà + cửa thông ban công (xử lý trước), căn hộ áp luật, việc theo chi phí, đổi góc nhìn", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const ks = page.getByTestId("khao-sat-nha");
  await ks.getByRole("textbox", { name: "Độ hướng nhà khảo sát" }).fill("180");
  await ks.getByLabel("Loại nhà").selectOption("can_ho");
  await ks.getByLabel(/Vẽ mặt bằng/).check();
  const ve = ks.getByTestId("ve-mat-bang");
  // tô cả 6×6 bằng cách bấm từng ô (chế độ "Tô ô")
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) await ve.getByRole("button", { name: `Ô hàng ${r + 1} cột ${c + 1}` }).click();
  await ve.getByRole("radio", { name: "Cửa" }).click();
  await ve.getByRole("button", { name: /^Ô hàng 1 cột 3/ }).click();
  await ve.getByRole("radio", { name: "WC" }).click();
  await ve.getByRole("button", { name: /^Ô hàng 3 cột 3/ }).click();
  await ve.getByRole("radio", { name: "Ban công" }).click();
  await ve.getByRole("button", { name: /^Ô hàng 6 cột 3/ }).click();
  await ks.getByLabel(/Giường hoặc bàn làm việc nằm ngay dưới xà ngang/).check();
  await ks.getByRole("button", { name: "Xem luận bố cục" }).click();
  const kq = page.getByTestId("ket-qua-bo-cuc");
  await expect(kq.getByTestId("kq-mat-bang")).toContainText("Nhà vệ sinh ở vùng giữa nhà");
  await expect(kq.getByTestId("kq-mat-bang")).toContainText("Cửa chính nhìn thẳng ra ban công");
  await expect(kq.getByTestId("dau-hieu-wc_giua_nha")).toContainText("suy từ mặt bằng");
  await expect(kq.getByTestId("so-do-nha")).toContainText("Nhà vệ sinh");                         // UI-PT 2: sơ đồ 3×3 tô màu
  await expect(kq.getByTestId("dau-hieu-veto").first()).toBeVisible();
  await expect(kq.getByTestId("dau-hieu-xa_ngang").getByTestId("dau-hieu-viec")).toContainText("0 đồng");
  await expect(kq.getByTestId("quy-tac-khong_dap_ket_cau")).toBeVisible();          // Q6: căn hộ không đập dầm
  await expect(kq.getByTestId("quy-tac-hanh_lang_chung_cu")).toBeVisible();         // Q6: cửa thông ban công ở căn hộ → xử lý trong cửa
  // Q4: đổi góc nhìn → câu đời sống lên trước (nói về dầm / giấc ngủ)
  await ks.getByTestId("ks-goc-nhin-doi_song").click();
  await ks.getByRole("button", { name: "Xem luận bố cục" }).click();
  await expect(kq.getByTestId("dau-hieu-xa_ngang")).toContainText("Sách xưa:");
  // Hồ sơ nhà trên máy có mặt bằng + loại nhà → "Nhà của bạn" đọc kèm: trần mức, việc theo chi phí, ý định
  const hs = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null"));
  expect(hs.loai_nha).toBe("can_ho");
  expect(hs.bo_cuc.mat_bang.luoi).toHaveLength(6);
  const nha = page.getByTestId("nha-cua-ban");
  await nha.getByLabel("Năm xây hoặc năm dọn vào").fill("2008");
  await nha.getByTestId("nha-y-dinh").getByRole("radio", { name: "Sức khoẻ, giấc ngủ" }).click();
  await nha.getByRole("button", { name: "Đọc nhà của tôi" }).click();
  await expect(nha.getByTestId("bao-cao-nha")).toBeVisible();
  await expect(nha.getByTestId("nha-tran-muc").first()).toBeVisible();              // Q1: trần Cân bằng
  await expect(nha.getByTestId("hop-veto").first()).toBeVisible();
  await expect(nha.getByTestId("nha-theo-y-dinh")).toContainText("sức khoẻ");
  await expect(nha.getByTestId("nha-nguyen-tac")).toContainText("Hình thế là nền");
  const c5 = nha.getByTestId("nha-chuong-viec_nen_lam");
  await c5.getByTestId("nha-theo-chi-phi").click();
  await expect(c5.getByTestId("nha-hanh-dong")).toContainText("0 đồng");
  await expect(nha.getByTestId("nha-chuong-tung_phong").getByTestId("so-do-nha")).toBeVisible();   // UI-PT 2
  await expect(nha.getByTestId("nha-tran-muc").first()).toContainText("tối đa Cân bằng");
  // UI-PT 4 (Y7): "Đã xử lý: xà ngang" → đọc lại, khối so trước–sau; nút của xà ngang biến mất, hồ sơ nhà ghi da_xu_ly
  const dx = nha.getByTestId("nha-da-xu-ly");
  await expect(dx.getByRole("button", { name: /^Đã xử lý:/ })).toHaveCount(3);                    // xà ngang · WC giữa nhà · cửa thông ban công
  await dx.getByRole("button", { name: /Đã xử lý: Giường, bàn dưới xà ngang/ }).click();
  await expect(nha.getByTestId("nha-so-sanh")).toContainText("xà ngang");
  await expect(dx.getByRole("button", { name: /^Đã xử lý:/ })).toHaveCount(2);
  const hs2 = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null"));
  expect(hs2.bo_cuc.da_xu_ly).toEqual(["xa_ngang"]);
  expect(hs2.bo_cuc.dau_hieu).not.toContain("xa_ngang");
  // hai dấu hiệu lớn còn lại suy từ mặt bằng → xử lý nốt → không còn trần mức, khối so sánh báo chương đổi
  await dx.getByRole("button", { name: /Đã xử lý: Nhà vệ sinh ở giữa nhà/ }).click();
  await expect(dx.getByRole("button", { name: /^Đã xử lý:/ })).toHaveCount(1);
  await dx.getByRole("button", { name: /^Đã xử lý:/ }).click();
  await expect(nha.getByTestId("nha-tran-muc")).toHaveCount(0);
  await expect(nha.getByTestId("nha-so-sanh")).toContainText("không còn trần mức");
  // hoàn tác → trần quay lại
  await nha.getByRole("button", { name: /hoàn tác/ }).click();
  await expect(nha.getByTestId("nha-tran-muc").first()).toBeVisible();
  // UI-PT 3: hành trình đã có hướng + khảo sát; "Xem nhà khác" hỏi lại rồi xoá hồ sơ nhà trên máy
  const ht = page.getByTestId("hanh-trinh-nha");
  await expect(ht.getByTestId("hanh-trinh-huong")).toHaveAttribute("data-trang-thai", "xong");
  await expect(ht.getByTestId("hanh-trinh-khao_sat")).toHaveAttribute("data-trang-thai", "xong");
  await ht.getByRole("button", { name: "Đặt tên cho nhà này" }).click();
  await ht.getByLabel("Tên gọi cho nhà này").fill("Căn định mua");
  await ht.getByRole("button", { name: "Lưu" }).click();
  await expect(ht.getByTestId("hanh-trinh-ten-nha")).toContainText("Căn định mua");
  await ht.getByRole("button", { name: "Xoá nhà đã lưu trên máy" }).click();
  await ht.getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(ht.getByTestId("hanh-trinh-ten-nha")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.nha.v1"))).toBeNull();
});

test("Q3: hướng nhà từ hai điểm bản đồ (dán toạ độ) → đổi ra hướng, sơn, trạch như đo la bàn", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const o = page.getByTestId("do-huong");
  await o.getByRole("button", { name: /Lấy hướng từ bản đồ/ }).click();
  await o.getByLabel("Toạ độ tâm nhà").fill("https://www.google.com/maps/@10.7769,106.7009,19z");
  await o.getByLabel("Toạ độ điểm trước mặt nhà").fill("10.7769, 106.7019");
  await o.getByRole("button", { name: "Tính hướng từ hai điểm" }).click();
  const kq = page.getByTestId("ket-qua-do-huong");
  await expect(kq).toContainText("Đông");
  await expect(kq).toContainText("bắc thật");
  await expect(o.getByTestId("huong-ban-do")).toContainText("cách nhau");
});
