// SEC-2 (docs/BAO-MAT.md): kiểm thuần, không mở trình duyệt.
// - Mã thẻ / lời mời mang TÊN hiển thị → không lọt vào URL gửi PostHog ($current_url, $pathname).
// - ?tiep= sau đăng nhập: chỉ đường dẫn nội bộ; "/\t/evil.com" (trình duyệt bỏ tab → "//evil.com") bị chặn.
import { test, expect } from "@playwright/test";
import { lamSachUrl } from "../lib/do-luong";

const MA = "eyJ0IjoiTGFuIiwibiI6NX0.Abc123xyz_-Q9";

test("URL đo lường không mang mã thẻ", () => {
  expect(lamSachUrl(`https://hieuban.com/the/hai/${MA}`)).toBe("https://hieuban.com/the/hai/:ma");
  expect(lamSachUrl(`/hop-doi/${MA}`)).toBe("/hop-doi/:ma");
  expect(lamSachUrl(`https://hieuban.com/hom-nay?the=${MA}&tu=hn.ab12`)).toBe("https://hieuban.com/hom-nay?the=%3Ama&tu=hn.ab12");
  expect(lamSachUrl("https://hieuban.com/hop-doi/cap-so")).toBe("https://hieuban.com/hop-doi/cap-so");
  expect(lamSachUrl("/tu-vi/sao-o-cung/tu-vi-cung-menh")).toBe("/tu-vi/sao-o-cung/tu-vi-cung-menh");
  expect(lamSachUrl("$direct")).toBe("$direct");
  // LX-2027: mã bao lì xì chưa nhận + đường quay về sau đăng nhập không lọt lên đo lường.
  expect(lamSachUrl("https://hieuban.com/li-xi/abcdef1234567890")).toBe("https://hieuban.com/li-xi/:ma");
  expect(lamSachUrl("/dang-nhap?tiep=%2Fli-xi%2Fabcdef1234567890")).toBe("/dang-nhap?tiep=%2Fli-xi%2F%3Ama");
  expect(lamSachUrl("/li-xi-tet-2027")).toBe("/li-xi-tet-2027");
});

test("đích ?tiep= chỉ trong site", () => {
  const hopLe = (s: string) => /^\/(?![/\\])[^\s\\]*$/.test(s);   // như app/dang-nhap/DangNhap.tsx
  for (const x of ["/tai-khoan", "/quan-tri?tab=sao#a"]) expect(hopLe(x)).toBe(true);
  for (const x of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com"]) expect(hopLe(x)).toBe(false);
});
