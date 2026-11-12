# Thành phần mã nguồn mở và nguồn đối chiếu — NỘI BỘ

> BM-1 (2026-10-09): danh mục này trước đây nằm trên trang `/gioi-thieu#nguon`. Chủ dự án coi cách hệ thống được dựng là
> bí mật kinh doanh, nên bảng chuyển về đây. **Không đưa nội dung file này lên web.**
>
> Giấy phép MIT yêu cầu giữ thông báo bản quyền khi **phân phối** phần mềm. Dịch vụ chỉ chạy trên máy chủ (người dùng
> không nhận bản sao mã) nên không bắt buộc công bố trên web; vẫn giữ ghi công đầy đủ ở đây và trong `package-lock` /
> thư mục vendor. Nếu sau này phát hành app di động hay gói tải về có kèm các thư viện này → phải đưa thông báo giấy phép
> vào app (màn hình "Giấy phép").

| Thành phần | Dùng vào | Giấy phép / cách dùng |
|---|---|---|
| iztro 2.6.0 (SylarLong) | An sao Tử vi, chạy trong engine qua Node | MIT — chạy runtime |
| Thuật toán âm lịch Hồ Ngọc Đức | Đổi âm–dương lịch theo múi giờ Việt Nam (gồm miền Nam 1960–1975) | Thuật toán công bố, tự cài đặt |
| lasotuvi 0.1.2 (doanguyen) | Golden độ sáng sao, Hoả Linh, vòng Thái Tuế lối Việt | MIT — chỉ sinh dữ liệu đối chiếu |
| lunar-typescript | Golden tiết khí, can chi cho Bát tự | Chỉ đối chiếu, không chạy runtime |
| lunar-python 1.4.8 (6tail) | Bảng hoàng lịch: nghi/kỵ, thần sát, 28 tú, Bành Tổ, hướng thần (`calc/hoang_lich_vendor.py`) + golden 898 ngày | MIT — bảng chép nguyên văn kèm bản quyền; thư viện chỉ làm oracle, không chạy runtime |
| shunshi-bazi-core 0.2.0 | Golden 5.000 tứ trụ cho thần sát tham khảo Bát tự (Kim Thần, Địa Võng trụ ngày, Chính Học Đường — `fixtures/_generate_than_sat_tham_khao.mjs`) | MIT — chỉ sinh dữ liệu đối chiếu, không chép mã, không chạy runtime |
| Kanseki Repository (kanripo) | Bản số hoá Tứ khố toàn thư: *Tam Mệnh Thông Hội*, *Hiệp Kỷ Biện Phương Thư* — đọc nguyên văn để đối chiếu (`docs/QUYET-DINH-EN5-EN6.md`) | Cổ thư công cộng; chỉ trích ngắn quy tắc, không chép bản số hoá vào repo |
| horosa-skill (Horace-Maxwell) | Chỉ đọc danh mục kỹ thuật để đánh giá thiếu hụt (`docs/DANH-GIA-ENGINE-HUYEN-HOC.md`) | **AGPL — KHÔNG chép mã/dữ liệu** |
| VSOP87 rút gọn | Tiết khí cho Bát tự (sai ≤ 0,63 phút) | Mô hình thiên văn công bố, tự cài đặt |
| TuViMCP (© 2026 Manh Ha Nguyen) | Danh mục cách cục Tử vi để đối chiếu | MIT |
| opencode-tianji 0.6.0 | Bản số hoá nguyên văn Chu Dịch (quái từ, hào từ) | MIT |
| anko-ki-maya (Mahesh Koria) | Khung mục chân dung thần số (không chép nội dung) | MIT |
| @mediapipe/tasks-vision 1.2.2 (Google) + mô hình Face Landmarker float16 v1 | ANH-3: tìm điểm mốc gương mặt NGAY TRÊN MÁY người dùng (WebAssembly, tự phục vụ ở `/mediapipe/`, `web/lib/diem-moc-tu-dong.ts`); chỉ ra toạ độ, phép đo vẫn ở engine | Apache-2.0 — chạy runtime trong trình duyệt. Thư viện có đoạn gửi số liệu hiệu năng về Google: CSP `connect-src` không mở tên miền đó → bị chặn, không gì rời máy |
| aov.cc | Oracle đối chiếu lá số khi phát triển | Không chạy runtime |
| Cổ thư (ctext.org) | Nguyên văn Kinh Dịch, Tử Vi Đẩu Số Toàn Thư, Tử Bình Chân Thuyên… | Phạm vi công cộng; ctext cấm cào tự động |
| Wikisource 紫微斗數全書/全覽 (oldid 850734, bản đóng băng) | Nguyên văn Đẩu Số Cốt Tuỷ Phú (`kb/data/tuvi_co_thu.json`, `docs/CO-THU-COT-TUY-PHU.md`) | Văn bản đời Minh công cộng; lớp trang Wikisource CC BY-SA — chỉ dùng chữ của cổ văn |
| iztro-docs (SylarLong) · tianzhi-classics | Bản phồn thể đối chiếu chéo Cốt Tuỷ Phú (1.522/1.522 chữ) | MIT — chỉ đối chiếu |
| tianzhi-classics (zaoxu001), commit 047b827 | KT-TT 2026-11-12: bảng điều hậu 120 ô đã soát nguyên văn Cùng Thông Bảo Giám (đối chiếu `battu_dieu_hau.json`, lệch 26 ô); Tử Vi Đẩu Số Toàn Thư q.1–3 đã cắt theo thiên — dự kiến làm kho nguồn (`docs/KIEM-TOAN-TRI-THUC-2026-11.md`) | Mã + metadata MIT; nguyên văn cổ thư công cộng. Lời dịch hiện đại của kho đó không chép. Bảng "packaged" / "modeled" chưa soát → không dùng |
| Kanseki Repository `KR1a0091` 周易傳義大全 (commit fccff29) | KT-TT 2026-11-12: kho nguồn `engine/fixtures/nguon/chu_dich_truyen_nghia.json` — kinh văn + Trình Di truyện + Chu Hy bản nghĩa, cắt theo quẻ / hào (`engine/scripts/nap_truyen_nghia.py`); dùng soát `kinhdich_hao.json` | Cổ thư công cộng (bản Tứ khố). Chủ dự án giao nạp 2026-11-12 — thay dòng "không chép bản số hoá vào repo" cho RIÊNG sách này; chữ nhỏ của các nhà Tống – Nguyên chưa chép |
| Thư mục Drive chủ dự án gửi 2026-11-12 (9 tệp) | Ngô Tất Tố *Kinh Dịch*; *Tử Bình Chân Thuyên* 3 bản; *Trích Thiên Tuỷ* (bản dịch Việt); *Tử vi đẩu số tân biên*; *Tử vi tổng hợp*; *Tam Mệnh Thông Hội*; *Uyên Hải Tử Bình* | Cổ thư: nguyên văn dùng được. Sách / bản dịch hiện đại: **chỉ tóm ý + ghi nguồn, không đưa tệp hay đoạn dài vào repo (repo công khai)** |
| ziwei-doushu (Renhuai123) | Đọc mã làm đặc tả để đối chiếu lá số (`docs/DOI-CHIEU-ZIWEI-DOUSHU.md`); KHÔNG chạy mã | MIT (mã) — bộ dữ liệu CC BY 4.0 không dùng; "cổ thư" trong repo là văn hiện đại → không dùng |
| Bài giảng Tử vi tam hợp hiện đại (CC BY-NC-SA) | Chỉ rút Ý / quy tắc, viết lại hoàn toàn (`kb/data/tuvi_y_bo_sung.json`, `docs/DE-XUAT-Y-TUVI-BO-SUNG.md`) | Không trích, không dịch sát, không nêu tên người giảng công khai; chủ dự án duyệt 2026-11-04 |

**Không dùng**: mã/dữ liệu GPL, AGPL (horosa, mingyu-core, gr8monk3ys/numerology, iching-shifa) hoặc không giấy phép
(tuvi-neo, Ultimate-SoulCodex, tuongotpho/tuvi, kabalavn/La-So-Tu-Vi). Xem bảng quyết định trong `CLAUDE.md`.

Danh sách nhà cung cấp xử lý dữ liệu (trả lời khi người dùng yêu cầu theo Chính sách quyền riêng tư): Vercel (web,
Singapore) · Render (engine, Singapore) · Supabase (DB + đăng nhập, Singapore) · OpenRouter (diễn đạt AI, Hoa Kỳ) ·
PostHog (đo lường ẩn danh) · Google Tag Manager/Analytics · Sentry (báo lỗi).

**Tranh 78 lá Tarot (TR-5, 2026-11-10)** — `web/public/tarot/rws/*.webp`: tranh bộ Rider–Waite in năm 1909 (Pamela Colman
Smith vẽ, A. E. Waite chỉ đạo; phạm vi công cộng: VN đời tác giả + 50 năm, Mỹ in trước 1929). Bản quét lấy từ archive.org
mục `rider-waite-small-jpeg` (Public Domain Mark 1.0), thu về 360 px, webp. **Không** dùng bản tô màu lại năm 1971 của
U.S. Games Systems (còn bản quyền) hay bộ "Universal / Radiant Waite". Nếu có khiếu nại: đổi sang nét đen trắng trong sách
*The Pictorial Key to the Tarot* (1910, Project Gutenberg #43548) — chỉ cần thay tệp ảnh, mã không đổi.
