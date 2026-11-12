# Video ngắn 9:16 — Hiểu Bản Thân

Dựng video 1–5 của `docs/KICH-BAN-VIDEO-NGAN.md` bằng **HyperFrames** (HTML + GSAP → MP4, 1080×1920, 30 fps),
giọng đọc **ElevenLabs v3** (tag cảm xúc). Khâu: **THU HÚT** (video → web), đo bằng `utm_campaign=vd01…vd05`.

Thư mục này tách riêng: không đụng web / engine / cms, dependency riêng (`hyperframes`, `gsap`).

## Tệp

| Tệp | Việc |
|---|---|
| `kich-ban.mjs` | Lời đọc (`noi`, có tag `[excited]`, `[curious]`, `[whispers]`…, số đọc bằng chữ), phụ đề (`phu_de`, `*chữ*` = tô vàng), kiểu hình từng cảnh |
| `dung.mjs` | Sinh dự án HyperFrames vào `ban-dung/<ma>/` (nền sao, phụ đề karaoke, 19 kiểu cảnh, hiệu ứng tiếng) |
| `tao-giong.mjs` | Gọi ElevenLabs `/with-timestamps` mỗi cảnh một lượt → `giong/<ma>/<canh>.mp3` + mốc từng câu |
| `render.mjs` | Xuất `xuat/<ma>.mp4` |
| `anh/` | Ảnh chụp màn hình web THẬT (engine + web chạy cục bộ, hồ sơ mẫu "Nguyễn Minh Anh", 24/10/1988) |
| `phong/` | Be Vietnam Pro + Newsreader (OFL) |
| `am-thanh/` | Hiệu ứng tiếng (Pixabay Content License, kèm skill media-use của HyperFrames) |

## Chạy

```bash
cd video-ngan && npm install
```

Lồng giọng (khoá chỉ đặt trong env, không dán vào mã):

```bash
ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node tao-giong.mjs
```

Dựng + xem trước + xuất:

```bash
node dung.mjs && cd ban-dung/v01 && npx --prefix ../.. hyperframes preview
```

```bash
node render.mjs
```

Chưa có giọng: `dung.mjs` ước thời lượng theo số âm tiết (4,2 âm tiết/giây) để duyệt nội dung + hình; có giọng thì cảnh
dài đúng theo giọng, phụ đề khớp từng câu. Sửa lời trong `kich-ban.mjs` → chạy lại `tao-giong.mjs` (chỉ gọi lại cảnh đổi lời).

## Ranh giới (giữ khi sửa lời)

Không doạ, không phán hung, không tên bệnh, không nêu tên hãng khác, không xin ngày sinh công khai, không nói
"AI xem bói"; mọi video kết bằng dòng miễn trừ. Số trên màn hình lấy từ web thật, không tự tính trong video.
