// EN-4 — iztro CHẠY SẴN: nhận việc theo từng dòng JSON trên stdin, trả từng dòng {"ok":true,"kq":…} / {"ok":false,
// "loi":…} trên stdout. Engine Python (app/calc/tuvi_an_sao.py) giữ 1–2 tiến trình, thay tiến trình sau N lượt.
// Không gọi mạng, không ghi đĩa. Lỗi của một lượt không làm chết tiến trình.
import { createInterface } from 'node:readline';
import { anSao } from './an_sao_lib.mjs';

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (dong) => {
  if (!dong.trim()) return;
  let ra;
  try {
    ra = { ok: true, kq: anSao(JSON.parse(dong)) };
  } catch (e) {
    ra = { ok: false, loi: String((e && e.message) || e).slice(0, 300) };
  }
  process.stdout.write(JSON.stringify(ra) + '\n');
});
rl.on('close', () => process.exit(0));
