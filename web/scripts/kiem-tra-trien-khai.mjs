#!/usr/bin/env node
// Kiểm tra SAU KHI DEPLOY: gọi thật mọi tính năng của web (đi qua engine) trên một địa chỉ đã deploy.
// Bắt lỗi mà E2E không bắt được: web và engine deploy LỆCH NHÁNH (vd web bản mới, engine Render còn ở `main`
// cũ → hợp đôi báo "Not Found").
//
//   node scripts/kiem-tra-trien-khai.mjs https://hieubanthan-nine.vercel.app
//   STAGING_USER=… STAGING_PASS=… node scripts/kiem-tra-trien-khai.mjs <url>   # nếu bật Basic Auth
//
// Thoát mã 1 nếu có bất kỳ mục nào hỏng.
const goc = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const auth = process.env.STAGING_USER && process.env.STAGING_PASS
  ? { authorization: "Basic " + Buffer.from(`${process.env.STAGING_USER}:${process.env.STAGING_PASS}`).toString("base64") }
  : {};

const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: "ha-noi" };
const MUC = [
  ["Thần số — bài đọc", "POST", "/api/thanso/luan-giai", { ho_ten: ["Nguyễn Văn An"], ngay: 24, thang: 10, nam: 1988 }],
  ["Thần số — hỏi đáp", "POST", "/api/thanso/hoi", { ho_ten: ["Nguyễn Văn An"], ngay: 24, thang: 10, nam: 1988, cau_hoi: "Số đường đời của tôi nói gì?" }],
  ["Hợp đôi", "POST", "/api/thanso/hop-doi", { a: { ho_ten: ["Nguyễn Văn An"], ngay: 24, thang: 10, nam: 1988 }, b: { ho_ten: ["Trần Thị Mai"], ngay: 25, thang: 6, nam: 1984 } }],
  ["Đổi lịch âm ↔ dương", "POST", "/api/lich/doi", { chieu: "am_sang_duong", ngay: 1, thang: 1, nam: 1968, noi_sinh: "tp-ho-chi-minh" }],
  ["Danh sách nơi sinh", "GET", "/api/dia-ly/tinh"],
  ["Tử vi — lá số", "POST", "/api/tuvi/la-so", LA_SO],
  ["Tử vi — hỏi đáp", "POST", "/api/tuvi/hoi", { cau_hoi: "Tham Lang ở cung Quan Lộc có ý nghĩa gì?" }],
  ["Bát tự — lá số", "POST", "/api/battu/la-so", LA_SO],
  ["Phong thuỷ — mệnh quái", "POST", "/api/phongthuy/menh-quai", { birth_date: "1990-05-17", gender: "nam" }],
  ["Kinh Dịch — hỏi", "POST", "/api/kinhdich/hoi", { cau_hoi: "Có nên đổi việc không?" }],
  ["Link chia sẻ (cần LOI_MOI_SECRET)", "POST", "/api/chia-se/tao", { ten_hien_thi: "An", ho_ten: ["Nguyễn Văn An"], ngay: 24, thang: 10, nam: 1988 }],
  ["Thư viện kiến thức", "GET", "/kien-thuc/than-so/so-7"],
  ["sitemap.xml", "GET", "/sitemap.xml"],
  ["llms.txt", "GET", "/llms.txt"],
];

let hong = 0;
for (const [ten, method, duong, body] of MUC) {
  const t0 = Date.now();
  try {
    const r = await fetch(goc + duong, {
      method, headers: { ...auth, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(90_000),
    });
    const txt = await r.text();
    const ok = r.ok && !(duong === "/kien-thuc/than-so/so-7" && !txt.includes("Số 7"));
    if (!ok) hong++;
    let loi = "";
    try { loi = JSON.parse(txt).error ?? ""; } catch { /* không phải JSON */ }
    console.log(`${ok ? "✓" : "✗"} ${ten.padEnd(34)} ${r.status} ${String(Date.now() - t0).padStart(6)}ms ${ok ? "" : loi || txt.slice(0, 120)}`);
  } catch (e) {
    hong++;
    console.log(`✗ ${ten.padEnd(34)} lỗi mạng: ${e.message}`);
  }
}
console.log(hong ? `\n${hong} mục hỏng — xem hướng dẫn trong docs/TRIEN-KHAI.md` : "\nTất cả tính năng chạy được.");
process.exit(hong ? 1 : 0);
