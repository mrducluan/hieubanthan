// LH-1 — lớp "Luận theo câu hỏi" của Luận giải Tử vi: bản đồ người quanh bạn, câu trả lời thẳng, dòng mười năm của mảng,
// la bàn nghề, hướng hoá giải. Web chỉ vẽ dữ liệu engine; người / chương khoá (SAO-2) không lộ chân dung.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";
import { catXemTruoc } from "../lib/sao-xem-truoc";

type TL = { ma: string; cau: string; tra_loi: string; ma_mau: string };
type C = { ma: string; luan_hoi?: { tra_loi: TL[]; nguoi: { ma: string }[]; dong_mang: { nam: number }[]; nghe?: unknown; hoa_giai: { dan_gian: unknown[] } } };

test("báo cáo Tử vi có bản đồ người quanh bạn + năm chương có câu trả lời thẳng", async ({ page }) => {
  await napHoSo(page, HO_SO_MAU);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai")),
    page.getByRole("button", { name: "Xem luận giải" }).click(),
  ]);
  const bc = await res.json();
  const co = (bc.chuong as C[]).filter((c) => c.luan_hoi);
  expect(co.map((c) => c.ma).sort()).toEqual(["gia_dinh", "quan_he", "su_nghiep", "tien_bac", "tinh_cam"]);
  expect((bc.nguoi_quanh as unknown[]).length).toBe(7);

  // D1: chương 1 (miễn phí) có đúng một câu trả lời mẫu "hợp nghề gì", bấm nút thì mở chương Công việc.
  const mau = page.getByTestId("lg-chuong-" + bc.chuong[0].ma).getByTestId("lh-cau-mau");
  await expect(mau.locator('[data-testid="lh-cau"][data-ma="nghe_hop"]')).toBeVisible();
  await expect(mau.getByTestId("lh-cau-mau-nut")).toBeVisible();
  // … và câu mẫu còn nguyên sau khi cắt bản xem trước (chương 1 miễn phí).
  expect((catXemTruoc(bc, 1).chuong as { cau_mau?: { ma: string } }[])[0]?.cau_mau?.ma).toBe("nghe_hop");

  // Bản đồ: 7 nút, bấm một người → khung chi tiết đổi theo, có nút tới chương.
  const bd = page.getByTestId("lg-nguoi-quanh");
  await expect(bd.getByTestId("nguoi-quanh-nut")).toHaveCount(7);
  await bd.locator('[data-testid="nguoi-quanh-nut"][data-ma="cha_me"]').click();
  await expect(bd.getByTestId("nguoi-quanh-chi-tiet")).toContainText("Cha mẹ");
  await bd.getByTestId("nguoi-quanh-doc").click();
  const gd = page.getByTestId("lg-chuong-gia_dinh");
  await expect(gd).toHaveAttribute("data-mo", "1");
  await expect(gd.getByTestId("lh-the-nguoi")).toHaveCount(3);

  // Chương công việc: câu "hợp nghề gì" đứng đầu, la bàn nghề 5 hành bấm được, dòng mười năm 10 chấm, hoá giải có mục dân gian.
  const sn = page.getByTestId("lg-chuong-su_nghiep");
  await sn.getByTestId("lg-mo-chuong").click();
  await expect(sn.getByTestId("lh-cau").first()).toContainText("Tôi hợp nghề gì?");
  await expect(sn.getByTestId("lh-hanh")).toHaveCount(5);
  await sn.locator('[data-testid="lh-hanh"][data-hanh="Kim"]').click();
  await expect(sn.getByTestId("lh-hanh-chi-tiet")).toContainText("Hành Kim");
  await expect(sn.getByTestId("lh-nam")).toHaveCount(10);
  await sn.getByTestId("lh-nam").nth(3).click();
  await expect(sn.getByTestId("lh-nam-chi-tiet")).toContainText(String(co.find((c) => c.ma === "su_nghiep")!.luan_hoi!.dong_mang[3]!.nam));
  await expect(sn.getByTestId("lh-hg-dan-gian")).toContainText("tập quán dân gian");
  await expect(sn.getByTestId("lh-hg-phat_huy")).toBeVisible();

  // Chương tình cảm: năm câu hỏi, câu "một đời vợ chồng hay dang dở" có câu trả lời.
  const tc = page.getByTestId("lg-chuong-tinh_cam");
  await tc.getByTestId("lg-mo-chuong").click();
  await expect(tc.getByTestId("lh-cau")).toHaveCount(5);
  await expect(tc.locator('[data-testid="lh-cau"][data-ma="ben"] [data-testid="lh-tra-loi-cau"]')).not.toBeEmpty();

  // Điện thoại: trang không cuộn ngang.
  await page.setViewportSize({ width: 375, height: 800 });
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(1);
});

test("chương khoá (SAO-2): người quanh bạn chỉ còn tên + mức, lớp luận không xuống trình duyệt", () => {
  const nguoi = (ma: string, ch: string) => ({ ma, ten: ma, muc: "thuan", nhan_muc: "Thuận lợi", tu_chuong: ch, chan_dung: "BÍ MẬT", ban_voi_ho: ["BÍ MẬT"], can_cu: ["BÍ MẬT"] });
  const chuong = (ma: string) => ({ ma, tieu_de: ma, doan: [], luan_hoi: { tra_loi: [{ tra_loi: "BÍ MẬT" }] } });
  const bc = { mo_dun: "tuvi", phien_ban: "doi_song_1", trang_thai: "nhap_ai", ket: "",
    chuong: [chuong("tong_quan"), chuong("tinh_cam")], nguoi_quanh: [nguoi("phoi_ngau", "tinh_cam"), nguoi("x", "tong_quan")] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ra = catXemTruoc(bc as any, 1) as any;
  expect(ra.nguoi_quanh[0]).toEqual({ ma: "phoi_ngau", ten: "phoi_ngau", muc: "thuan", nhan_muc: "Thuận lợi", tu_chuong: "tinh_cam", khoa: true });
  expect(ra.nguoi_quanh[1].chan_dung).toBe("BÍ MẬT");
  expect(JSON.stringify(ra.chuong[1])).not.toContain("BÍ MẬT");
});

test("Bát tự cùng khuôn: 6 người quanh bạn, la bàn nghề theo hai cách lấy dụng thần", async ({ page }) => {
  await napHoSo(page, HO_SO_MAU);
  // CRO-1: Bát tự tự tải chương 1 khi có lá số — chờ lượt gọi đó (không còn nút mở).
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/battu/luan-giai")),
    page.goto("/bat-tu"),
  ]);
  const bc = await res.json();
  expect((bc.nguoi_quanh as unknown[]).length).toBe(6);
  await expect(page.getByTestId("lg-nguoi-quanh").getByTestId("nguoi-quanh-nut")).toHaveCount(6);
  const sn = page.getByTestId("lg-chuong-su_nghiep");
  await sn.getByTestId("lg-mo-chuong").click();
  await expect(sn.getByTestId("lh-cau")).toHaveCount(8);
  await expect(sn.getByTestId("lh-hanh")).toHaveCount(5);
  // nhãn ba mức của la bàn do engine đưa: "Cả hai cách cùng cần / Một cách cần / Không cần thêm"
  await expect(sn.getByTestId("lh-hanh-chi-tiet")).toContainText(/Cả hai cách cùng cần|Một cách cần|Không cần thêm/);
  await expect(sn.getByTestId("lh-hoa-giai")).toBeVisible();
});

test("lời mời chương khoá mang CÂU HỎI chương trả lời, không mang câu trả lời", () => {
  const ch = (ma: string) => ({ ma, tieu_de: ma, doan: [], luan_hoi: { tra_loi: [{ cau: "Tôi hợp nghề gì?", tra_loi: "BÍ MẬT" }] },
    moi_xem: { diem_nhan: "", cau_hoi: "?", so_doan: 0, phut_doc: 1, cau_tra_loi: [{ ma: "nghe_hop", cau: "Tôi hợp nghề gì?" }], so_nguoi: 1 } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ra = catXemTruoc({ mo_dun: "tuvi", chuong: [ch("a"), ch("su_nghiep")] } as any, 1) as any;
  expect(ra.chuong[1].moi_xem.cau_tra_loi).toEqual([{ ma: "nghe_hop", cau: "Tôi hợp nghề gì?" }]);
  expect(JSON.stringify(ra.chuong[1])).not.toContain("BÍ MẬT");
});

test("thẻ chương khoá hiện câu hỏi chương trả lời; bấm một câu = mở luồng Sao", async ({ page }) => {
  const moi = { diem_nhan: "", cau_hoi: "Bạn thật sự tìm gì ở người bạn đời?", so_doan: 2, phut_doc: 3, so_nguoi: 1,
    cau_tra_loi: [{ ma: "hanh_phuc", cau: "Hôn nhân của tôi có hạnh phúc không?" }, { ma: "ben", cau: "Tôi một đời vợ chồng hay dễ dang dở, ly dị?" }] };
  const xemTruoc = { mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 1,
    chuong: [{ ma: "tong_quan", tieu_de: "Con người bạn", doan: ["Đoạn mở miễn phí."] }, { ma: "tinh_cam", tieu_de: "Tình yêu & hôn nhân", khoa: true, moi_xem: moi }],
    phi: { sao: 99, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10 } };
  let moKhoa = 0;
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 99 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => {
    if (r.request().headers()["x-mo-khoa"] === "1") { moKhoa += 1; return r.fulfill({ status: 402, json: { error: "Đăng nhập để mở.", can: "dang_nhap", gia: 99, thuong: 10 } }); }
    return r.fulfill({ json: xemTruoc });
  });
  await napHoSo(page, HO_SO_MAU);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const khoa = page.getByTestId("lg-phan-khoa");
  await expect(khoa.getByTestId("lg-khoa-dan")).toContainText("trả lời thẳng 2 câu bạn hay hỏi");
  await expect(khoa.getByTestId("lg-khoa-cau")).toContainText("Chương này trả lời");
  await expect(khoa.getByTestId("lg-khoa-cau-nut")).toHaveCount(2);
  await expect(khoa).toContainText("Kèm chân dung 1 người liên quan");
  if (process.env.CHUP) await khoa.screenshot({ path: process.env.CHUP });
  await khoa.locator('[data-testid="lg-khoa-cau-nut"][data-ma="ben"]').click();
  await page.waitForURL(/\/dang-nhap\?tiep=%2Ftu-vi&tu=bao_cao&qua=10/);   // DN-5: khách → thẳng trang đăng nhập
  expect(moKhoa).toBe(1);
});

