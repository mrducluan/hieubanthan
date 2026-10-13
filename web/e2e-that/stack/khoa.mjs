// Khoá JWT CHỈ cho kiểm thử (Supabase cục bộ e2e-that) — bí mật cố định, không dùng ở đâu khác.
import { createHmac } from "node:crypto";
export const JWT_THU = "e2e-that-jwt-chi-dung-cho-kiem-thu-0123456789";
const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
export function khoa(role) {
  const h = b({ alg: "HS256", typ: "JWT" }), p = b({ role, iss: "supabase", iat: 1700000000, exp: 2000000000 });
  return `${h}.${p}.${createHmac("sha256", JWT_THU).update(`${h}.${p}`).digest("base64url")}`;
}
if (process.argv[2]) console.log(process.argv[2] === "jwt" ? JWT_THU : khoa(process.argv[2]));
