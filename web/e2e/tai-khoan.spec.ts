// UI-4: không có Supabase (CI) → tài khoản ẩn gọn, hồ sơ trên máy vẫn sửa/xoá được.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { ghiHoSo, hoSoTuHang } from "../lib/tai-khoan";

test("tài khoản chưa bật: hiện hồ sơ trên máy, xoá khỏi máy được", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("ho-so-may")).toContainText("Nguyễn Đức Luân · 17/05/1990 · 12:30");
  await expect(page.getByTestId("tk-chua-bat")).toBeVisible();
  await page.getByRole("button", { name: "Xoá khỏi máy" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(page.getByTestId("ho-so-may")).toContainText("Tạo hồ sơ");
  expect(await page.evaluate(() => localStorage.getItem("hbt.hoso.v1"))).toBeNull();
});

test("đăng nhập khi chưa bật tài khoản: báo gọn, không lỗi", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("heading", { name: "Tài khoản đang được chuẩn bị" })).toBeVisible();
});

test("mã giới thiệu ?gt= được nhớ trên máy (để thưởng Sao khi tạo tài khoản); mã rác bị bỏ", async ({ page }) => {
  await page.goto("/?gt=ab12cd34");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hbt.gt") ?? "null")?.ma)).toBe("ab12cd34");
  await page.goto("/kien-thuc?gt=<script>");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.gt") ?? "null")?.ma)).toBe("ab12cd34");
});

// TV-V2 + migration 0015: "Không biết giờ" lưu thật vào tài khoản (do_tin_gio='unknown', gio_sinh null).
// Thuần logic — giả lập upsert của Supabase, không cần máy chủ.
test.describe("lưu/đọc hồ sơ tài khoản — Không biết giờ (0015)", () => {
  const H = { v: 1 as const, ho_ten: "A", ngay: 17, thang: 5, nam: 1990, gio: "12:00", gioi_tinh: "nam" as const,
    noi_sinh: "ha-noi", do_tin_gio: "unknown" as const, tao_luc: "2026-09-30T00:00:00Z" };
  const gia = (...loi: (string | null)[]) => {
    const goi: Record<string, unknown>[] = [];
    const upsert = async (hang: Record<string, unknown>) => {
      goi.push(hang);
      const ma = loi[goi.length - 1] ?? null;
      return { error: ma ? { code: ma, message: ma } : null };
    };
    return { goi, upsert };
  };

  test("lưu 'unknown' thật, không lưu giờ đại diện", async () => {
    const g = gia();
    await ghiHoSo(g.upsert, "u1", H);
    expect(g.goi).toHaveLength(1);
    expect(g.goi[0]).toMatchObject({ user_id: "u1", do_tin_gio: "unknown", gio_sinh: null, noi_sinh: "ha-noi" });
  });

  test("chưa chạy 0015 (vi phạm check 23514) → thử lại như cũ, vẫn giữ cột 0007", async () => {
    const g = gia("23514");
    await ghiHoSo(g.upsert, "u1", H);
    expect(g.goi).toHaveLength(2);
    expect(g.goi[1]).toMatchObject({ do_tin_gio: null, gio_sinh: null, noi_sinh: "ha-noi", lich_nhap: "duong" });
  });

  test("lỗi check ở lần thử lại → báo lỗi, không rơi về bộ cột 0006", async () => {
    const g = gia("23514", "23514");
    await expect(ghiHoSo(g.upsert, "u1", H)).rejects.toThrow("Chưa lưu được");
    expect(g.goi).toHaveLength(2);
    expect(g.goi.every((x) => "noi_sinh" in x)).toBe(true);
  });

  test("thiếu cột 0007 (lỗi khác) → lùi về bộ cột 0006 như trước", async () => {
    const g = gia("PGRST204");
    await ghiHoSo(g.upsert, "u1", { ...H, do_tin_gio: "exact", gio: "12:30" });
    expect(g.goi).toHaveLength(2);
    expect(g.goi[0]).toMatchObject({ do_tin_gio: "exact", gio_sinh: "12:30" });
    expect("noi_sinh" in g.goi[1]!).toBe(false);
    expect(g.goi[1]).toMatchObject({ gio_sinh: "12:30" });
  });

  test("đọc lại 'unknown' → hồ sơ máy giờ 12:00 + unknown; bản lưu cũ (null) → không có giờ", async () => {
    const hang = { ho_ten: "A", ten_khac: null, ngay_sinh: "1990-05-17", gio_sinh: null, gioi_tinh: "nam" as const, vung: null,
      cap_nhat_luc: "2026-10-19T00:00:00Z", noi_sinh: "ha-noi", do_tin_gio: "unknown" as const };
    expect(hoSoTuHang(hang)).toMatchObject({ gio: "12:00", do_tin_gio: "unknown", noi_sinh: "ha-noi", ngay: 17 });
    const cu = hoSoTuHang({ ...hang, do_tin_gio: null });
    expect(cu.gio).toBeUndefined();
    expect(cu.do_tin_gio).toBeUndefined();
    expect(hoSoTuHang({ ...hang, gio_sinh: "08:15:00", do_tin_gio: "approx" })).toMatchObject({ gio: "08:15", do_tin_gio: "approx" });
  });
});
