// An sao tử vi qua iztro — MỖI LƯỢT MỘT TIẾN TRÌNH (đường cũ, dùng khi tắt NODE_CHAY_SAN hoặc tiến trình chạy sẵn hỏng).
//   stdin : một JSON vào (khoá như mô tả ở an_sao_lib.mjs) · stdout: JSON lá số thô.
import { readFileSync } from 'node:fs';
import { anSao } from './an_sao_lib.mjs';

process.stdout.write(JSON.stringify(anSao(JSON.parse(readFileSync(0, 'utf8')))));
