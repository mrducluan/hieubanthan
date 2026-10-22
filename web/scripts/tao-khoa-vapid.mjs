// KC-4 GĐ1 — tạo cặp khoá VAPID (ECDSA P-256) cho Web Push. Chạy MỘT lần: `node scripts/tao-khoa-vapid.mjs`
// rồi dán hai dòng in ra vào env Vercel (Production + Preview). Đổi khoá = mọi thiết bị đã bật nhắc phải bật lại.
// Không lưu khoá vào git.
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" }), priv = privateKey.export({ format: "jwk" });
const congKhai = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]).toString("base64url");
console.log(`VAPID_PUBLIC_KEY=${congKhai}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log("VAPID_SUBJECT=mailto:contact@hieuban.com");
