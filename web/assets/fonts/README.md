# Font cho ảnh thẻ chia sẻ (`web/app/og/route.tsx`)

| File | Font | Nguồn | Giấy phép |
|---|---|---|---|
| `BeVietnamPro-SemiBold.ttf` | Be Vietnam Pro 600 | Google Fonts (fonts.gstatic.com) | SIL OFL 1.1 — `OFL-BeVietnamPro.txt` |
| `Newsreader.ttf` | Newsreader 500 | Google Fonts (fonts.gstatic.com) | SIL OFL 1.1 — `OFL-Newsreader.txt` |

Chỉ dùng để render ảnh phía server (satori cần TTF có đủ dấu tiếng Việt; font mặc định của `next/og` chỉ có Latin cơ bản).
Web hiển thị vẫn nạp font qua `next/font/google` như cũ.
