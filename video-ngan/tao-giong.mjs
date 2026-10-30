// Lồng giọng ElevenLabs v3 cho từng cảnh của kich-ban.mjs.
//   ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node tao-giong.mjs [v01 v02 …]
// Tuỳ chọn env: ELEVENLABS_MODEL (mặc định eleven_v3), ELEVENLABS_STABILITY (0 sáng tạo · 0.5 tự nhiên · 1 ổn định;
// mặc định 0.5), ELEVENLABS_SPEED (0.7–1.2, mặc định 1.05 cho nhịp video ngắn).
//
// Mỗi cảnh = một lượt gọi /with-timestamps (giữ ngữ điệu liền mạch trong cảnh) → giong/<ma>/<canh>.mp3 + .json
// { dur, cau: [{bd, kt}] } — mốc đầu/cuối từng câu lấy từ thời điểm từng ký tự, dung.mjs dùng để kéo dài cảnh và
// khớp phụ đề. Lời không đổi → không gọi lại (khoá băm trong .json). Âm lượng chuẩn hoá −16 LUFS, đỉnh −1,5 dBTP.
// Khoá API chỉ đọc từ env, không ghi ra đĩa, không in ra log.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VIDEO } from "./kich-ban.mjs";

const GOC = path.dirname(fileURLToPath(import.meta.url));
const KHOA = process.env.ELEVENLABS_API_KEY;
const GIONG = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_v3";
const ON_DINH = Number(process.env.ELEVENLABS_STABILITY ?? 0.5);
const TOC_DO = Number(process.env.ELEVENLABS_SPEED ?? 1.05);

if (!KHOA || !GIONG) {
  console.error("Thiếu ELEVENLABS_API_KEY hoặc ELEVENLABS_VOICE_ID (đặt trong env, không dán vào mã).");
  process.exit(1);
}

const doDai = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

async function goi(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(GIONG)}/with-timestamps?output_format=mp3_44100_128`;
  const body = {
    text, model_id: MODEL, language_code: "vi",
    voice_settings: { stability: ON_DINH, similarity_boost: 0.8, ...(MODEL === "eleven_v3" ? {} : { style: 0.45, use_speaker_boost: true }), speed: TOC_DO },
  };
  for (let lan = 0; lan < 4; lan++) {
    const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KHOA, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const loi = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise((x) => setTimeout(x, 2000 * 2 ** lan)); continue; }
    throw new Error(`ElevenLabs ${r.status}: ${loi.slice(0, 300)}`);
  }
  throw new Error("ElevenLabs bận, thử lại sau.");
}

/** Mốc từng câu: ký tự ngoài [tag] đầu tiên / cuối cùng của câu trong bảng alignment. */
function mocCau(cau, al, dur) {
  const ky = al?.characters ?? [];
  const bd = al?.character_start_times_seconds ?? [];
  const kt = al?.character_end_times_seconds ?? [];
  const toan = cau.join(" ");
  if (ky.join("") !== toan) {
    // Bảng ký tự lệch văn bản gửi đi (hiếm) → chia theo số ký tự lời đọc.
    const dai = cau.map((s) => s.replace(/\[[^\]]*\]/g, "").length);
    const tong = dai.reduce((a, b) => a + b, 0);
    let t = 0;
    return dai.map((n) => { const m = { bd: t, kt: t + (dur * n) / tong }; t = m.kt; return m; });
  }
  let i = 0;
  return cau.map((s) => {
    const a = i, b = i + s.length;
    i = b + 1;
    let trongTag = false, dau = null, cuoi = null;
    for (let j = a; j < b; j++) {
      const c = toan[j];
      if (c === "[") trongTag = true;
      if (!trongTag && /\S/.test(c)) { if (dau === null) dau = bd[j]; cuoi = kt[j]; }
      if (c === "]") trongTag = false;
    }
    return { bd: Math.round((dau ?? 0) * 1000) / 1000, kt: Math.round((cuoi ?? dur) * 1000) / 1000 };
  });
}

const chon = process.argv.slice(2);
for (const v of VIDEO) {
  if (chon.length && !chon.includes(v.ma)) continue;
  const thu = path.join(GOC, "giong", v.ma);
  fs.mkdirSync(thu, { recursive: true });
  for (const c of v.canh) {
    const text = c.noi.join(" ");
    const bam = crypto.createHash("sha256").update(JSON.stringify([text, GIONG, MODEL, ON_DINH, TOC_DO])).digest("hex").slice(0, 16);
    const fj = path.join(thu, `${c.id}.json`), fm = path.join(thu, `${c.id}.mp3`);
    if (fs.existsSync(fj) && fs.existsSync(fm) && JSON.parse(fs.readFileSync(fj, "utf8")).bam === bam) { console.log(`${v.ma}/${c.id}: giữ bản cũ`); continue; }
    const kq = await goi(text);
    const tho = path.join(thu, `${c.id}.tho.mp3`);
    fs.writeFileSync(tho, Buffer.from(kq.audio_base64, "base64"));
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tho, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k", fm]);
    fs.rmSync(tho);
    const dur = doDai(fm);
    const cau = mocCau(c.noi, kq.alignment, dur);
    fs.writeFileSync(fj, JSON.stringify({ bam, dur: Math.round(dur * 1000) / 1000, cau }, null, 1));
    console.log(`${v.ma}/${c.id}: ${dur.toFixed(2)}s · ${cau.map((m) => `${m.bd}-${m.kt}`).join(" | ")}`);
  }
}
