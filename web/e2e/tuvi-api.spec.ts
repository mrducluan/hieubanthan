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
