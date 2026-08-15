# Chiến lược sao lưu HieuBanThan

> Đọc cái này nếu sắp cài lại máy, đổi máy, hoặc muốn chắc chắn không mất dữ liệu.

Có **2 loại dữ liệu**, mỗi loại backup một đường khác nhau. Đừng gộp — chúng
khác bản chất.

---

## Đường 1 — Code + tài liệu → GitHub (tự động, versioned)

**Gồm gì:** toàn bộ thư mục `hieubanthan/` — engine, web, tài liệu (`docs/`),
và bản lưu 3 skill gốc (`source-skills/`).

**Cách làm (một lần):**
1. Tạo kho GitHub **Private** tên `hieubanthan`.
2. Nối và đẩy:
   ```bash
   cd C:/Users/mrduc/hieubanthan
   git remote add origin https://github.com/<tên-bạn>/hieubanthan.git
   git push -u origin main
   ```
3. Từ đó về sau, mỗi lần có thay đổi: `git push`. GitHub giữ mọi phiên bản.

**Khôi phục sau khi cài lại máy:**
```bash
git clone https://github.com/<tên-bạn>/hieubanthan.git
```
→ Có lại toàn bộ code + tài liệu + skill gốc.

> ⚠️ Kho phải **Private**. Code chứa cấu trúc nghiệp vụ.

---

## Đường 2 — Transcript hội thoại + bộ nhớ AI → ổ đám mây (thủ công)

**Gồm gì:** lịch sử trò chuyện với Claude (24 file `.jsonl`, ~24MB) + bộ nhớ dự
án (memory). Đây KHÔNG phải code, không nên để trong kho GitHub (còn lẫn cả
việc của client khác — Tâm Đức, FPT).

**Vị trí gốc trên máy:**
```
C:\Users\mrduc\.claude\projects\C--Users-mrduc-agency-agents\
    *.jsonl          ← lịch sử hội thoại
    memory\*.md      ← bộ nhớ AI nhớ về bạn và dự án
```

**Cách làm:** đã tạo sẵn một file nén tại
`C:\Users\mrduc\claude-data-backup-2026-08-15.zip`.
Kéo file đó lên **Google Drive / OneDrive**. Xong.

**Khôi phục:** tải file zip về, giải nén, đặt lại vào
`C:\Users\mrduc\.claude\projects\...` sau khi cài lại Claude Code.

> Bản chất hội thoại (quyết định, lý do) đã được ghi lại người-đọc-được trong
> `docs/NHAT-KY-DU-AN.md` — nên kể cả khi mất file `.jsonl` thô, phần "vì sao"
> vẫn còn trong Đường 1.

---

## Đường 3 — Artifact → đã an toàn sẵn

2 artifact (kế hoạch 90 ngày, hướng dẫn deploy) nằm trên claude.ai, theo tài
khoản của bạn — sống sót khi cài lại máy. Link trong `docs/NHAT-KY-DU-AN.md`.

---

## Bảng nhắc nhanh

| Dữ liệu | Ở đâu | Backup bằng |
|---|---|---|
| Code + tài liệu + skill gốc | `hieubanthan/` | GitHub (Đường 1) |
| Lịch sử hội thoại + memory | `.claude\projects\...` | Zip → Google Drive (Đường 2) |
| Artifact | claude.ai | Đã an toàn |

**Nhịp đề xuất:** `git push` mỗi khi làm xong một mốc. Zip `.claude` lại mỗi
tháng hoặc trước khi cài lại máy.
