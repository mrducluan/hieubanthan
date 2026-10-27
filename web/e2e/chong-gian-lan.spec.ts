// SAO-GL (0026) — nhận thưởng mời đi qua máy chủ để gắn mã băm thiết bị (HMAC IP + user-agent, không lưu IP).
// Ở e2e tài khoản tắt (không Supabase) → chỉ kiểm cửa route: mã sai định dạng / chưa đăng nhập; chuỗi thật ở e2e-that.
import { test, expect } from "@playwright/test";

test("route nhận thưởng mời: mã sai định dạng bị từ chối, chưa đăng nhập → 401, không bao giờ cache", async ({ request }) => {
  const sai = await request.post("/api/sao/nhan-thuong", { data: { ma: "x' or 1=1" } });
  expect(await sai.json()).toEqual({ ket_qua: "khong_hop_le" });
  const r = await request.post("/api/sao/nhan-thuong", { data: { ma: "abcd1234" } });
  expect(r.status()).toBe(401);
  expect(r.headers()["cache-control"]).toContain("no-store");
});

