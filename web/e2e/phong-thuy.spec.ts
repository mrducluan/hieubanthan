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
  await ht.getByRole("button", { name: "Lưu", exact: true }).click();
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


test("DH-PC: máy tính — kéo / phím mũi tên trên mặt la bàn rồi Chốt; Dán toạ độ; định vị wifi sai số lớn thì không chốt", async ({ page, context }) => {
  await context.grantPermissions(["geolocation", "clipboard-read", "clipboard-write"]);
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const o = page.getByTestId("do-huong");
  const mat = o.getByTestId("la-ban-keo");
  await expect(mat).toHaveAttribute("role", "slider");
  // bấm vào chữ "Đ" (bên phải mặt la bàn) → Đông lên dưới kim = 90°
  await mat.scrollIntoViewIfNeeded();
  const hop = (await mat.boundingBox())!;
  await expect(async () => {   // bấm lại tới khi trang đã hydrate
    await page.mouse.click(hop.x + hop.width * 0.82, hop.y + hop.height / 2);
    await expect(mat).toHaveAttribute("aria-valuenow", "90", { timeout: 1_000 });
  }).toPass();
  // phím: Shift+→ thêm 15°, → thêm 1°
  await mat.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(mat).toHaveAttribute("aria-valuenow", "106");
  // kéo: tay đi từ đỉnh sang phải 90° → mặt la bàn quay theo, hướng dưới kim lùi 90°
  const cx = hop.x + hop.width / 2, cy = hop.y + hop.height / 2;
  await page.mouse.move(cx, hop.y + 10);
  await page.mouse.down();
  await page.mouse.move(cx + 40, hop.y + 30, { steps: 4 });
  await page.mouse.move(hop.x + hop.width - 10, cy, { steps: 4 });
  await page.mouse.up();
  await expect(mat).toHaveAttribute("aria-valuenow", /^(1[5-9]|2[0-9])$/);   // ≈ 16°
  const d = Number(await mat.getAttribute("aria-valuenow"));
  await o.getByTestId("chot-la-ban-keo").click();
  await expect(page.getByTestId("ket-qua-do-huong")).toContainText(`${d}°`);

  // bản đồ trên máy tính: hướng dẫn chuột phải + nút mở Google Maps vệ tinh + Dán
  await o.getByRole("button", { name: /Lấy hướng từ bản đồ/ }).click();
  await expect(o.getByTestId("huong-ban-do")).toContainText("chuột phải");
  await expect(o.getByTestId("mo-ban-do-ve-tinh")).toBeVisible();
  await page.evaluate(() => navigator.clipboard.writeText("10.7769, 106.7009"));
  await o.getByRole("button", { name: "Dán vào ô tâm nhà" }).click();
  await expect(o.getByLabel("Toạ độ tâm nhà")).toHaveValue("10.7769, 106.7009");
  // định vị wifi ±40 m, hai điểm cách ~4 m → không chốt, báo lỗi
  await context.setGeolocation({ latitude: 10.77693, longitude: 106.70092, accuracy: 40 });
  await o.getByRole("button", { name: "Lấy vị trí hiện tại làm điểm trước mặt nhà" }).click();
  await expect(o.getByLabel("Toạ độ điểm trước mặt nhà")).toHaveValue("10.776930, 106.700920");
  await o.getByRole("button", { name: "Tính hướng từ hai điểm" }).click();
  await expect(o.getByRole("alert")).toContainText("chưa tin được");
});

// PNG 1×1 (nền ảnh mặt bằng / ảnh góc nhà) — chỉ để thử chọn tệp; ảnh không rời máy.
const PNG_1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test("UI-PT2 A/B: chọn Chung cư → hướng dẫn căn hộ + Cách làm; GPS điền hai điểm → hướng; lưu theo ban công; Huyền Không ghi chú", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009, accuracy: 8 });
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const ht = page.getByTestId("hanh-trinh-nha");
  await ht.getByTestId("loai-nha-can_ho").click();
  await expect(ht.getByTestId("hanh-trinh-huong")).toContainText("ban công");
  const o = page.getByTestId("do-huong");
  await expect(o).toContainText("ban công hoặc cửa sổ lớn nhất");
  await o.getByTestId("cach-lam-do_huong_can_ho").getByTestId("cach-lam-mo").click();
  await expect(o.getByTestId("cach-lam-do_huong_can_ho")).toContainText("Căn hộ chung cư: đo ở đâu?");
  await o.getByRole("button", { name: /Lấy hướng từ bản đồ/ }).click();
  await o.getByRole("button", { name: "Lấy vị trí hiện tại làm tâm nhà" }).click();
  await expect(o.getByLabel("Toạ độ tâm nhà")).toHaveValue("10.776900, 106.700900");
  await expect(o.getByTestId("gps-chinh-xac")).toContainText("±8 m");
  await context.setGeolocation({ latitude: 10.7769, longitude: 106.7019, accuracy: 30 });
  await o.getByRole("button", { name: "Lấy vị trí hiện tại làm điểm trước mặt nhà" }).click();
  await expect(o.getByLabel("Toạ độ điểm trước mặt nhà")).toHaveValue("10.776900, 106.701900");
  await expect(o.getByTestId("gps-chinh-xac")).toContainText("khá lệch");
  await o.getByRole("button", { name: "Tính hướng từ hai điểm" }).click();
  await expect(page.getByTestId("ket-qua-do-huong")).toContainText("Đông");
  const hs = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null"));
  expect(hs.loai_nha).toBe("can_ho");
  expect(hs.theo).toBe("ban_cong");                                   // căn hộ → hướng lưu là hướng ban công
  await expect(page.getByTestId("hk-can-ho")).toBeVisible();
  await expect(page.getByTestId("khao-sat-nha").getByLabel("Loại nhà")).toHaveValue("can_ho");   // Khảo sát đọc cùng hồ sơ nhà
});

test("UI-PT2 B/C: ảnh mặt bằng làm nền lưới (chỉ trên máy) + Chụp một góc, trả lời 3 câu → tích đúng ô dấu hiệu", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const ks = page.getByTestId("khao-sat-nha");
  await ks.getByLabel(/Vẽ mặt bằng/).check();
  const ve = ks.getByTestId("ve-mat-bang");
  await ve.getByTestId("cach-lam-ve_mat_bang").getByTestId("cach-lam-mo").click();
  await expect(ve).toContainText("Hàng trên cùng là mặt trước nhà");
  await ve.getByLabel("Ảnh mặt bằng làm nền (chỉ hiện trên máy)").setInputFiles({ name: "mat-bang.png", mimeType: "image/png", buffer: PNG_1 });
  await expect(ve.getByTestId("anh-mat-bang")).toContainText("Đổi ảnh mặt bằng");
  await expect(ve.locator("img[src^='blob:']")).toHaveCount(1);        // ảnh là blob trên máy, không có URL máy chủ
  await ve.getByRole("button", { name: "Xoay ảnh 90 độ" }).click();
  await expect(ve.locator("img[src^='blob:']")).toHaveAttribute("style", /rotate\(90deg\)/);
  await ve.getByRole("button", { name: "Bỏ ảnh" }).click();
  await expect(ve.locator("img")).toHaveCount(0);
  // P6: hỏi nhanh theo ý định — sức khoẻ → câu đầu là xà ngang; "Có" tích ô dấu hiệu, "Không" bỏ tích
  const hn = ks.getByTestId("hoi-nhanh-anh");
  await hn.getByTestId("hoi-nhanh-suc_khoe").click();
  const cau = hn.getByTestId("hoi-nhanh-cau").getByRole("listitem");
  await expect(cau).toHaveCount(5);
  await expect(cau.first()).toContainText("xà ngang");
  await cau.first().getByRole("radio", { name: "Có" }).click();
  await expect(ks.getByRole("checkbox", { name: /Giường hoặc bàn làm việc nằm ngay dưới xà ngang/ })).toBeChecked();
  await cau.first().getByRole("radio", { name: "Không", exact: true }).click();
  await expect(ks.getByRole("checkbox", { name: /Giường hoặc bàn làm việc nằm ngay dưới xà ngang/ })).not.toBeChecked();
  await hn.getByLabel("Chụp hoặc chọn ảnh góc nhà (chỉ hiện trên máy)").setInputFiles({ name: "goc.png", mimeType: "image/png", buffer: PNG_1 });
  await expect(hn.getByRole("img", { name: /Góc nhà bạn vừa chụp/ })).toBeVisible();
  // không có yêu cầu mạng nào mang ảnh: tổng số request tới /api không đổi khi chọn ảnh (chỉ kiểm nhanh qua localStorage không chứa blob)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("blob:");
});

test("UI-PT2 D/E: lưu hai căn → So hai căn hai cột không điểm số; Chia sẻ thẻ nhà → mã chỉ hướng/mức, trang nhận, ảnh PNG", async ({ page, request }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  const o = page.getByTestId("do-huong");
  await o.getByLabel("Độ hướng nhà").fill("180");
  await o.getByRole("button", { name: "Xem" }).click();
  await expect(page.getByTestId("ket-qua-do-huong")).toContainText("Nam");
  const ht = page.getByTestId("hanh-trinh-nha");
  await ht.getByTestId("luu-can-so").click();
  await expect(ht.getByTestId("can-0")).toBeVisible();
  await expect(ht.getByTestId("luu-can-so")).toContainText("Cập nhật căn này");
  // căn thứ hai: xem nhà khác (xoá hồ sơ đang xem), đo 45° rồi lưu
  await ht.getByRole("button", { name: "Xoá nhà đã lưu trên máy" }).click();
  await ht.getByRole("button", { name: "Xoá", exact: true }).click();
  await o.getByLabel("Độ hướng nhà").fill("45");
  await o.getByRole("button", { name: "Xem" }).click();
  await expect(page.getByTestId("ket-qua-do-huong")).toContainText("Đông Bắc");
  await ht.getByTestId("luu-can-so").click();
  await expect(ht.getByTestId("can-1")).toBeVisible();
  await ht.getByTestId("mo-so-hai-can").click();
  const so = page.getByTestId("so-hai-can");
  await expect(so.getByTestId("so-can-0").getByTestId("so-can-chuong")).toBeVisible();
  await expect(so.getByTestId("so-can-1").getByTestId("so-can-chuong")).toBeVisible();
  await expect(so.getByTestId("so-can-0")).toContainText("hướng Nam");
  await expect(so.getByTestId("so-can-1")).toContainText("hướng Đông Bắc");
  await expect(so).not.toContainText(/\d+\s*\/\s*100/);               // không điểm số
  // đổi căn đang xem từ chip → hồ sơ nhà hiện tại đổi hướng, ô hướng của bài đọc điền lại theo căn vừa chọn
  await ht.getByTestId("can-0").click();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.nha.v1") ?? "null"))).huong_do).toBe(180);
  const nha = page.getByTestId("nha-cua-ban");
  await expect(nha.getByLabel("Độ hướng nhà cho bài đọc")).toHaveValue("180");

  // P7: thẻ chia sẻ nhà từ bài đọc
  await nha.getByRole("button", { name: "Đọc nhà của tôi" }).click();
  await expect(nha.getByTestId("bao-cao-nha")).toBeVisible();
  await nha.getByTestId("mo-chia-se-nha").click();
  await nha.getByLabel("Tên trên thẻ (không bắt buộc)").fill("Lan");
  await nha.getByTestId("tao-the-nha").click();
  const link = await nha.getByTestId("link-the-nha").inputValue();
  expect(link).toMatch(/\/the\/nha\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{16}\?tu=nh\.[0-9a-f]{10}/);
  const ma = decodeURIComponent(link.split("/the/nha/")[1]!.split("?")[0]!);
  const than = Buffer.from(ma.split(".")[0]!, "base64url").toString("utf8");
  for (const s of ["1990", "180", "05-17", "Khảm"]) expect(than).not.toContain(s);   // không năm sinh, không độ la bàn, không mệnh
  const g = JSON.parse(than) as unknown[];
  expect(g[1]).toBe("Lan");
  expect(g[2]).toBe(4);                                                   // hướng Nam = chỉ số 4 trong 8 hướng
  const html = await (await request.get(`/the/nha/${ma}`)).text();
  expect(html).toContain("Nhà của Lan");
  expect(html).toContain("hướng Nam");
  expect(html).toContain(`/og/nha?ma=${ma}`);
  for (const s of ["1990", "17/05", "Khảm"]) expect(html).not.toContain(s);
  for (const k of ["", "&khung=doc"]) {
    const anh = await request.get(`/og/nha?ma=${encodeURIComponent(ma)}${k}`);
    expect(anh.status()).toBe(200);
    expect(anh.headers()["content-type"]).toContain("image/png");
  }
  // mã sửa hướng → chữ ký lệch → hết hiệu lực
  g[2] = ((g[2] as number) + 1) % 8;
  const sua = `${Buffer.from(JSON.stringify(g)).toString("base64url")}.${ma.split(".")[1]}`;
  expect(await (await request.get(`/the/nha/${sua}`)).text()).toContain("Thẻ không còn hiệu lực");
  // API trực tiếp: thiếu hướng nhà → 422 rõ ràng
  const r = await request.post("/api/chia-se/nha", { data: { sinh: { birth_date: "1990-05-17", gender: "nam" }, nha: {}, ten_hien_thi: "A" } });
  expect(r.status()).toBe(422);
});

// PT-V2 "Để máy đọc ảnh": route web giả bằng page.route (engine thật không có khoá OpenRouter trong E2E). Kiểm: đồng ý KHÔNG
// tích sẵn → nút tắt; ảnh thu nhỏ trên máy thành JPEG base64 (không blob:, không data:); Đúng → ô tích + chip "từ ảnh";
// Không → bỏ tích; bố cục gửi engine mang nguon anh / co:false; không ảnh nào vào localStorage.
const KQ_DOC_ANH = {
  da_bat: true, ly_do_tat: null, can_xac_nhan: true,
  dau_hieu: [
    { ma: "xa_ngang", co: true, do_tin: 0.8, ly_do: "Thấy dầm ngang chạy trên đầu giường." },
    { ma: "be_ca", co: true, do_tin: 0.5, ly_do: "Có khối trong suốt giống bể cá cạnh tường." },
  ],
  phong_doan: [{ phong: "phong_ngu_chinh", do_tin: 0.7 }],
  luu_y: ["Ảnh hơi tối, máy có thể bỏ sót chi tiết."],
};

test("PT-V2: Để máy đọc ảnh — đồng ý không tích sẵn, ảnh thu nhỏ trên máy, Đúng / Không đồng bộ ô tích, bố cục gửi nguon anh", async ({ page }) => {
  await napHoSo(page);
  const goiDoc: Record<string, unknown>[] = [];
  const goiBoCuc: Record<string, unknown>[] = [];
  await page.route("**/api/phongthuy/doc-anh", async (r) => { goiDoc.push(r.request().postDataJSON()); await r.fulfill({ json: KQ_DOC_ANH }); });
  await page.route("**/api/phongthuy/bo-cuc", async (r) => { goiBoCuc.push(r.request().postDataJSON()); await r.continue(); });
  await page.goto("/phong-thuy");
  const ks = page.getByTestId("khao-sat-nha");
  const da = ks.getByTestId("doc-anh-nha");
  const nut = da.getByTestId("doc-anh-nut");
  const dongY = da.getByTestId("doc-anh-dong-y");
  await expect(nut).toBeDisabled();                                        // chưa ảnh, chưa đồng ý
  await expect(dongY).not.toBeChecked();                                   // KHÔNG tích sẵn
  await da.getByLabel("Chọn 1–3 ảnh để máy đọc (không lưu)").setInputFiles({ name: "goc.png", mimeType: "image/png", buffer: PNG_1 });
  await expect(da.getByRole("img", { name: "Ảnh 1 bạn chọn (chỉ hiện trên máy)" })).toHaveAttribute("src", /^blob:/);
  await expect(nut).toBeDisabled();                                        // có ảnh nhưng chưa đồng ý → vẫn tắt
  await dongY.check();
  await expect(nut).toBeEnabled();
  await nut.click();
  await expect(da).toContainText("Máy thấy có thể có");
  const dong = da.getByTestId("doc-anh-ket-qua").getByRole("listitem");
  await expect(dong).toHaveCount(2);
  await expect(da.getByTestId("doc-anh-dong-xa_ngang")).toContainText("Độ tin: cao");
  await expect(da.getByTestId("doc-anh-dong-be_ca")).toContainText("Độ tin: vừa");
  await expect(da).toContainText("Có vẻ đây là Phòng ngủ chính");
  await expect(da).toContainText("Ảnh hơi tối");
  // thân gửi lên: ảnh đã thành JPEG base64 trần, không blob:, không data:
  expect(goiDoc).toHaveLength(1);
  const than = goiDoc[0] as { anh: { du_lieu: string; loai: string }[]; goc: string | null };
  expect(than.anh).toHaveLength(1);
  expect(than.anh[0]!.loai).toBe("image/jpeg");
  expect(than.anh[0]!.du_lieu.length).toBeGreaterThan(50);
  expect(than.anh[0]!.du_lieu).toMatch(/^[A-Za-z0-9+/]+=*$/);
  expect(JSON.stringify(than)).not.toContain("blob:");
  expect(JSON.stringify(than)).not.toContain("data:");
  // Dùng làm góc chụp → ô góc chụp đổi
  await da.getByTestId("doc-anh-dung-goc").click();
  await expect(da.getByLabel("Góc chụp")).toHaveValue("Phòng ngủ chính");
  // Đúng ở xà ngang → ô tích sáng + chip "từ ảnh"; Không ở bể cá → không tích
  const oXa = ks.getByRole("checkbox", { name: /Giường hoặc bàn làm việc nằm ngay dưới xà ngang/ });
  const oBe = ks.getByRole("checkbox", { name: /bể cá/ });
  await expect(oXa).not.toBeChecked();
  await da.getByTestId("doc-anh-dung-xa_ngang").click();
  await expect(oXa).toBeChecked();
  await expect(ks.getByTestId("chip-tu-anh-xa_ngang")).toBeVisible();
  await da.getByTestId("doc-anh-khong-be_ca").click();
  await expect(oBe).not.toBeChecked();
  await expect(ks.getByTestId("chip-tu-anh-be_ca")).toHaveCount(0);
  // bỏ tích tay rồi tích lại = nguồn người dùng, chip biến mất
  await oXa.uncheck();
  await expect(ks.getByTestId("chip-tu-anh-xa_ngang")).toHaveCount(0);
  await da.getByTestId("doc-anh-dung-xa_ngang").click();
  await expect(ks.getByTestId("chip-tu-anh-xa_ngang")).toBeVisible();
  // Xem luận bố cục → engine nhận xa_ngang nguon anh đã xác nhận, be_ca khai rõ không có; không có ảnh trong thân
  await ks.getByRole("textbox", { name: "Độ hướng nhà khảo sát" }).fill("180");
  await ks.getByRole("button", { name: "Xem luận bố cục" }).click();
  await expect.poll(() => goiBoCuc.length).toBe(1);
  const bc = goiBoCuc[0] as { bo_cuc: { dau_hieu: Record<string, { co: boolean; nguon: string; xac_nhan?: boolean }> } };
  expect(bc.bo_cuc.dau_hieu.xa_ngang).toEqual({ co: true, nguon: "anh", xac_nhan: true });
  expect(bc.bo_cuc.dau_hieu.be_ca).toEqual({ co: false, nguon: "nguoi_dung" });
  expect(JSON.stringify(bc)).not.toContain("anh\":[");
  await expect(page.getByTestId("ket-qua-bo-cuc")).toContainText("Khảm trạch");
  // hồ sơ nhà trên máy: chỉ mã, không ảnh / base64
  const luu = await page.evaluate(() => localStorage.getItem("hbt.nha.v1") ?? "");
  expect(luu).toContain("\"tu_anh\":[\"xa_ngang\"]");
  expect(luu).not.toContain("blob:");
  expect(luu).not.toContain(than.anh[0]!.du_lieu.slice(0, 40));
  // đo lường: chỉ mã, không ảnh
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "chart_interacted" && e.kind === "doc_anh" && e.so_anh === 1 && e.so_dau_hieu === 2 && e.da_bat === 1)).toBe(true);
  expect(sk.some((e) => e.su_kien === "chart_interacted" && e.kind === "doc_anh_xac_nhan" && e.ma === "be_ca" && e.dung === 0)).toBe(true);
  expect(JSON.stringify(sk)).not.toContain(than.anh[0]!.du_lieu.slice(0, 40));
});

test("PT-V2: máy đọc ảnh chưa bật (chưa đặt khoá) → câu thường, không lỗi kỹ thuật, vẫn tích tay được", async ({ page }) => {
  await napHoSo(page);
  await page.route("**/api/phongthuy/doc-anh", (r) => r.fulfill({ json: { da_bat: false, ly_do_tat: "chua_dat_khoa", dau_hieu: [], phong_doan: [], luu_y: [], can_xac_nhan: true } }));
  await page.goto("/phong-thuy");
  const da = page.getByTestId("khao-sat-nha").getByTestId("doc-anh-nha");
  await da.getByLabel("Chọn 1–3 ảnh để máy đọc (không lưu)").setInputFiles({ name: "goc.png", mimeType: "image/png", buffer: PNG_1 });
  await da.getByTestId("doc-anh-dong-y").check();
  await da.getByTestId("doc-anh-nut").click();
  await expect(da.getByTestId("doc-anh-thong-bao")).toHaveText("Máy đọc ảnh chưa bật trên bản này — bạn tích tay các ô bên dưới nhé.");
  await expect(da.getByTestId("doc-anh-ket-qua")).toHaveCount(0);
  await expect(da.getByRole("alert")).toHaveCount(0);
  await expect(da).not.toContainText(/50\d|lỗi|error/i);
  await page.getByTestId("khao-sat-nha").getByLabel("Có gương đối diện giường ngủ không?").check();
});
