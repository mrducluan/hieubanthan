// Nhạc nền không lời cho từng video — ElevenLabs Music (/v1/music), dài đúng thời lượng bản dựng.
//   ELEVENLABS_API_KEY=... node tao-nhac.mjs [v01 …]     (chạy SAU node dung.mjs: đọc thời lượng từ ban-dung/<ma>)
// → nhac/<ma>.mp3 (chuẩn hoá −16 LUFS). render.mjs trộn vào MP4: nhạc nhỏ dưới giọng, tự hạ thêm khi có lời (ducking).
// Lời gợi ý / thời lượng không đổi → không gọi lại (khoá băm trong nhac/<ma>.json). Khoá API chỉ đọc từ env.
// Nhạc do ElevenLabs Music sinh trên gói trả phí — dùng thương mại được theo điều khoản ElevenLabs.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VIDEO } from "./kich-ban.mjs";

const GOC = path.dirname(fileURLToPath(import.meta.url));
const KHOA = process.env.ELEVENLABS_API_KEY;
if (!KHOA) { console.error("Thiếu ELEVENLABS_API_KEY (đặt trong env, không dán vào mã)."); process.exit(1); }

const CHUNG = "Instrumental only, no vocals, no singing. Background music for a vertical short video (TikTok / Reels) with a voice-over: "
  + "energetic and catchy but leaves room for speech in the mid frequencies, steady groove from the first second, clean modern mix, ends with a short button ending.";
// Mỗi video một màu nhạc, cùng tinh thần vui tươi, sôi động.
const NHAC = {
  v01: "Upbeat playful pop, 122 BPM, bouncy plucked synths, finger snaps and claps, punchy kick, curious and fun quiz-show energy.",
  v02: "Feel-good upbeat indie pop, 112 BPM, warm electric piano, bright guitar plucks, bouncy drums, hopeful and uplifting, cosy but lively.",
  v03: "Lively upbeat pop with a light Asian pentatonic pluck melody (zither-like), 120 BPM, punchy drums and shakers, cheerful and confident.",
  v04: "Cute romantic upbeat pop, 116 BPM, playful marimba and synth bells, groovy bass, handclaps, sweet and flirty vibe.",
  v05: "Upbeat funky house groove, 120 BPM, clean guitar chops, groovy bassline, crisp hi-hats, fresh home-makeover vibe, positive and energetic.",
};

const doDai = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

function thoiLuong(ma) {
  const f = path.join(GOC, "ban-dung", ma, "index.html");
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, "utf8").match(/data-composition-id="main"[^>]*data-duration="([\d.]+)"/);
  return m ? Number(m[1]) : null;
}

async function goi(prompt, ms) {
  const url = "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192";
  const body = { prompt, music_length_ms: ms, force_instrumental: true };
  for (let lan = 0; lan < 4; lan++) {
    const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KHOA, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const loi = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise((x) => setTimeout(x, 3000 * 2 ** lan)); continue; }
    throw new Error(`ElevenLabs Music ${r.status}: ${loi.slice(0, 300)}`);
  }
  throw new Error("ElevenLabs Music bận, thử lại sau.");
}

const chon = process.argv.slice(2);
fs.mkdirSync(path.join(GOC, "nhac"), { recursive: true });
for (const v of VIDEO) {
  if (chon.length && !chon.includes(v.ma)) continue;
  const tong = thoiLuong(v.ma);
  if (!tong) { console.error(`${v.ma}: chưa dựng — chạy node dung.mjs ${v.ma} trước`); continue; }
  const prompt = `${NHAC[v.ma]} ${CHUNG}`;
  const ms = Math.min(300000, Math.max(10000, Math.ceil(tong + 1.5) * 1000));
  const bam = crypto.createHash("sha256").update(JSON.stringify([prompt, ms])).digest("hex").slice(0, 16);
  const fj = path.join(GOC, "nhac", `${v.ma}.json`), fm = path.join(GOC, "nhac", `${v.ma}.mp3`);
  if (fs.existsSync(fj) && fs.existsSync(fm) && JSON.parse(fs.readFileSync(fj, "utf8")).bam === bam) { console.log(`${v.ma}: giữ nhạc cũ`); continue; }
  const tho = path.join(GOC, "nhac", `${v.ma}.tho.mp3`);
  fs.writeFileSync(tho, await goi(prompt, ms));
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tho, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "192k", fm]);
  fs.rmSync(tho);
  const dur = doDai(fm);
  fs.writeFileSync(fj, JSON.stringify({ bam, dur: Math.round(dur * 1000) / 1000, prompt }, null, 1));
  console.log(`${v.ma}: nhạc ${dur.toFixed(1)}s cho video ${tong}s`);
}
