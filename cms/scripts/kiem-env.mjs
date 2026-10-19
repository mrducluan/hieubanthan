// Chạy TRƯỚC `payload migrate` khi build trên Vercel: báo biến môi trường nào thiếu / gõ sai tên, rõ ràng bằng tiếng
// Việt (Payload chỉ báo "missing secret key"). CHỈ in TÊN biến + độ dài giá trị, KHÔNG BAO GIỜ in giá trị.
const BAT_BUOC = ["DATABASE_URI", "PAYLOAD_SECRET", "CMS_URL", "WEB_URL"];
const NEN_CO = ["CMS_EMAIL_QUAN_TRI", "CMS_WEBHOOK_SECRET", "CMS_PREVIEW_SECRET", "CRON_SECRET",
  "S3_BUCKET", "S3_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL", "NOTFAIR_SEO_API_KEY"];

const chuan = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const tenCo = Object.keys(process.env);
const moiTruong = process.env.VERCEL_ENV ?? "(không phải Vercel)";
console.log(`[kiem-env] Môi trường build: ${moiTruong}`);

let thieu = 0;
for (const ten of [...BAT_BUOC, ...NEN_CO]) {
  const v = process.env[ten];
  const batBuoc = BAT_BUOC.includes(ten);
  if (v && v.trim()) {
    console.log(`[kiem-env] ✓ ${ten} (${v.length} ký tự)`);
    continue;
  }
  // Tên gần giống (thừa dấu cách, viết thường, gạch ngang…) → chỉ ra để sửa.
  const gan = tenCo.filter((k) => k !== ten && chuan(k) === chuan(ten));
  const ly_do = v !== undefined ? "có nhưng RỖNG" : "KHÔNG CÓ";
  console.log(`[kiem-env] ${batBuoc ? "✗" : "!"} ${ten}: ${ly_do}${gan.length ? ` — thấy tên gần giống: ${gan.map((g) => JSON.stringify(g)).join(", ")} (sửa lại đúng tên)` : ""}`);
  if (batBuoc) thieu++;
}
// DATABASE_URI của Supabase: chỉ nhận chuỗi "Session/Transaction pooler". Chuỗi "Direct connection"
// (db.<mã>.supabase.co) chỉ có địa chỉ IPv6 → máy build/hàm Vercel báo ENETUNREACH. In máy chủ/cổng/tên người
// dùng (không bí mật) để đối chiếu; KHÔNG in mật khẩu.
function kiemDb(chuoi) {
  let u;
  try { u = new URL(chuoi.trim()); } catch {
    return "không đọc được — phải có dạng postgresql://postgres.<mã>:<mật khẩu>@aws-…pooler.supabase.com:5432/postgres";
  }
  console.log(`[kiem-env]   máy chủ ${u.hostname}, cổng ${u.port || "5432"}, người dùng ${decodeURIComponent(u.username)}`);
  // Mật khẩu: chỉ in ĐỘ DÀI + đặc điểm (để đối chiếu với mật khẩu vừa đặt), không bao giờ in nội dung.
  const tho = chuoi.trim().replace(/^[a-z]+:\/\//i, "");
  const mk = tho.slice(tho.indexOf(":") + 1, tho.lastIndexOf("@"));
  const dacBiet = /[^A-Za-z0-9._~-]/.test(mk.replace(/%[0-9A-Fa-f]{2}/g, ""));
  console.log(`[kiem-env]   mật khẩu ${decodeURIComponent(mk).length} ký tự · chỉ chữ/số: ${dacBiet ? "KHÔNG" : "có"}`
    + `${/%[0-9A-Fa-f]{2}/.test(mk) ? " · có ký tự đã mã hoá %xx" : ""}${chuoi !== chuoi.trim() ? " · có khoảng trắng/xuống dòng ở đầu/cuối (đã tự bỏ)" : ""}`);
  if (/\s/.test(chuoi.trim())) return "chuỗi có khoảng trắng ở giữa — dán lại, không xuống dòng";
  if (/[\[\]]/.test(mk)) return "mật khẩu còn dấu [ ] — xoá hai dấu ngoặc vuông, chỉ để mật khẩu";
  if (dacBiet) return "mật khẩu có ký tự đặc biệt (@ # / ? : & % …) làm hỏng chuỗi — đặt lại mật khẩu chỉ gồm chữ và số";
  if (!/^postgres(ql)?:$/.test(u.protocol)) return "phải bắt đầu bằng postgresql://";
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(u.hostname)) {
    return "đang là chuỗi \"Direct connection\" (chỉ IPv6, Vercel không kết nối được → ENETUNREACH). "
      + "Supabase → Connect → Connection String → mục \"Session pooler\" → lấy chuỗi có …pooler.supabase.com:5432";
  }
  if (/YOUR-PASSWORD/i.test(chuoi)) return "chưa thay [YOUR-PASSWORD] bằng mật khẩu database (bỏ cả dấu [ ])";
  if (/pooler\.supabase\.com$/i.test(u.hostname) && !/^postgres\.[a-z0-9]+$/i.test(decodeURIComponent(u.username))) {
    return "chuỗi pooler cần người dùng dạng postgres.<mã project> (lấy nguyên chuỗi Supabase đưa, đừng sửa phần trước dấu :)";
  }
  if (!u.password) return "thiếu mật khẩu";
  return null;
}
if (process.env.DATABASE_URI?.trim()) {
  const loi = kiemDb(process.env.DATABASE_URI);
  if (loi) {
    console.log(`[kiem-env] ✗ DATABASE_URI: ${loi}`);
    thieu++;
  }
}

if (thieu) {
  console.error(`[kiem-env] Có ${thieu} biến bắt buộc thiếu hoặc sai. Vercel → project CMS → Settings → Environment Variables: thêm đúng tên,`
    + ` tick môi trường "${moiTruong}" → Save → Deployments → Redeploy.`);
  process.exit(1);
}
