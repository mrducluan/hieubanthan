// Chạy TRƯỚC `payload migrate` khi build trên Vercel: báo biến môi trường nào thiếu / gõ sai tên, rõ ràng bằng tiếng
// Việt (Payload chỉ báo "missing secret key"). CHỈ in TÊN biến + độ dài giá trị, KHÔNG BAO GIỜ in giá trị.
const BAT_BUOC = ["DATABASE_URI", "PAYLOAD_SECRET", "CMS_URL", "WEB_URL"];
const NEN_CO = ["CMS_EMAIL_QUAN_TRI", "CMS_WEBHOOK_SECRET", "CMS_PREVIEW_SECRET", "CRON_SECRET",
  "S3_BUCKET", "S3_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"];

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
if (thieu) {
  console.error(`[kiem-env] Thiếu ${thieu} biến bắt buộc. Vercel → project CMS → Settings → Environment Variables: thêm đúng tên,`
    + ` tick môi trường "${moiTruong}" → Save → Deployments → Redeploy.`);
  process.exit(1);
}
