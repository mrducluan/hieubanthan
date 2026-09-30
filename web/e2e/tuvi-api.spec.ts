// /api/tuvi/chart qua web (proxy zod hai chiều) → engine tuan-triet.
import { test, expect } from "@playwright/test";

test("POST /api/tuvi/chart trả output hợp schema", async ({ request }) => {
  const res = await request.post("/api/tuvi/chart", {
    data: { birth_date: "1988-10-24", birth_time: "08:30", gender: "nam" },
  });
  expect(res.status()).toBe(200);
  const d = await res.json();
  expect(d.pham_vi).toBe("tuan_triet_only");
  expect(d.am_lich).toEqual({ ngay: 14, thang: 9, nam: 1988, nhuan: 0 });
  expect(d.can_chi_nam).toEqual({ can: "Mậu", chi: "Thìn" });
  expect(d.tuan_triet.tuan_dong_tai).toEqual(["Tuất", "Hợi"]);
  expect(d.tuan_triet.triet_dong_tai).toEqual(["Tý", "Sửu"]);
});

test("POST /api/tuvi/chart từ chối đầu vào sai định dạng (422)", async ({ request }) => {
  const res = await request.post("/api/tuvi/chart", {
    data: { birth_date: "24/10/1988", birth_time: "8h", gender: "nam" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/tuvi/la-so: lá số an sao đầy đủ qua iztro (14 chính tinh, 12 cung)", async ({ request }) => {
  const res = await request.post("/api/tuvi/la-so", {
    data: { birth_date: "1990-05-15", birth_time: "01:30", gender: "nam" },
  });
  expect(res.status()).toBe(200);
  const d = await res.json();
  expect(d.pham_vi).toBe("an_sao_day_du");
  expect(d.iztro).toBe("2.6.0");
  expect(d.ngu_hanh_cuc).toBe("Kim Tứ Cục");
  expect(d.cung).toHaveLength(12);
  const chinhTinh = new Set(d.cung.flatMap((c: { chinh_tinh: { ten: string }[] }) =>
    c.chinh_tinh.map((s) => s.ten)));
  expect(chinhTinh.size).toBe(14);
});

test("POST /api/tuvi/la-so: sinh 23:30 gắn cờ xung đột giờ Tý", async ({ request }) => {
  const res = await request.post("/api/tuvi/la-so", {
    data: { birth_date: "1995-06-15", birth_time: "23:30", gender: "nam" },
  });
  const d = await res.json();
  expect(d.co_canh_bao.map((f: { loai: string }) => f.loai)).toContain("ty_conflict");
});
