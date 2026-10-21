# Bàn giao phiên làm việc — HieuBanThan (hieuban.com)

> Viết 2026-10-21 để chuyển dự án sang một tài khoản Claude khác làm tiếp.
> **Claude mới: đọc file này đầu tiên, rồi `CLAUDE.md`, rồi `docs/VIEC-CUA-ANH.md`.**

## 1. "Bộ nhớ" của dự án nằm ở đâu

Claude không giữ ký ức riêng ngoài repo. Toàn bộ những gì Claude cũ biết đều đã ghi trong git:

| Tệp | Nội dung |
|---|---|
| `CLAUDE.md` | Luật dự án: stack, kiến trúc 5 tầng, quy tắc riêng tư, **bảng mọi quyết định đã chốt** (2026-08-15 → 2026-10-20). Claude Code tự nạp tệp này mỗi phiên. |
| `docs/VIEC-CUA-ANH.md` | Việc chỉ chủ dự án làm được (env, migration, Search Console, pháp lý…). Đầu mỗi phiên nhắc các mục chưa `[x]`. |
| `docs/MUC-TIEU-TANG-TRUONG.md` | Vòng tăng trưởng thu hút → quay lại → mời → nạp Sao + hàng đợi ý tưởng (★ = nên làm sớm). Mỗi plan/PR ghi "Đẩy khâu: …, đo bằng: …". |
| `docs/NHAT-KY-DU-AN.md` | Nhật ký giai đoạn đầu + link artifact kế hoạch 90 ngày. |
| `docs/KIEN-TRUC-*.md`, `docs/KE-HOACH-*.md` | Thiết kế từng phần (thần số v2, huyền học, CMS, quản trị, nội dung trang, vận hành, thanh toán, miễn phí ↔ Sao, chuyên gia). |
| `docs/REVIEW-ENGINE-V3.md`, `docs/NANG-CAP-TUVI-V2.md`, `docs/PHAN-TICH-MIGRATION-V2-2.md` | Đánh giá các bộ tài liệu chủ dự án gửi gần nhất (thần số V3, Tử vi v2.2) — phần nào đã làm, phần nào cố ý không làm. |
| `.claude/skills/` | 5 skill riêng: `thanso-kb`, `thanso-tu-cai-thien`, `huyenhoc-kb`, `huyenhoc-tu-cai-thien`, `do-y-dinh`. |

## 2. Trạng thái code (2026-10-21)

- `main` mới nhất: **#103 TS-V3c** (bỏ Qabalah, mặc định "Rút gọn con số", thẻ kiểm chứng, gói Sao "Bản đồ con số").
  Trước đó: #102 TV-V2b, #101 TS-V3, #100 TV-V2.
- Không có thay đổi chưa commit nào đang dở.
- **PR còn mở duy nhất:** [mrducluan/hieubanthan#98](https://github.com/mrducluan/hieubanthan/pull/98) (draft,
  nhánh `claude/determined-curie-v9grwi`) — sửa nút "Đồng bộ ngay" của CMS báo 401: bí mật webhook CMS ↔ web bỏ
  khoảng trắng thừa + báo rõ bên nào cần sửa; route web trả 503 `web_chua_dat` khi web chưa đặt bí mật. 10 tệp,
  +56/−23. **Việc tiếp:** cập nhật nhánh với `main` (merge, không rebase), chạy `cd web && npm run typecheck` +
  e2e `cms-web.spec.ts`, `noi-dung-trang.spec.ts`, chuyển khỏi draft khi CI xanh.

## 3. Việc chủ dự án còn mở (rút từ `VIEC-CUA-ANH.md` — xem tệp đó để có hướng dẫn đầy đủ)

Ưu tiên cao:
1. **Chạy migration Supabase còn chờ:** `0011_quan_tri_2`, `0012_thanh_toan` (sau khi bật tài khoản), `0013_sao_2`,
   `0014_nhiem_vu`, `0015_do_tin_gio_unknown`, `0016_thanso_hoc` (kiểm bằng `supabase/kiem_thu/da_chay_chua.sql`).
2. **SEC-1:** mở `https://hieubanthan-engine-sg.onrender.com/health` → phải `"khoa_engine": true`.
3. **Render engine:** vùng Singapore + gói Starter; sửa lỗi "Dockerfile: not a directory" theo `docs/TRIEN-KHAI.md` mục 1b.
4. **GitHub ruleset** của `main`: bỏ "Require approvals" hoặc thêm bypass để Claude tự merge khi CI xanh.
5. **NotFair:** đặt `NOTFAIR_SEO_API_KEY` (khoá MỚI — khoá cũ đã lộ trong chat) ở cả dự án web và CMS trên Vercel.

Còn lại: pháp lý (MST, địa chỉ, luật sư rà 3 trang, chuyển dữ liệu ra nước ngoài, hộp thư contact@hieuban.com),
payOS (TT-b), Q5 token GitHub cho Kho tri thức, các mục CMS1–CMS14, ND23/ND45, QHURL, HL1, TDG1, hồ sơ chuyên gia
M1–M7, OpenRouter + workflow llm-55 (mục L), UptimeRobot.

## 4. Việc kỹ thuật có thể làm tiếp (theo hàng đợi trong `MUC-TIEU-TANG-TRUONG.md`)

- Khâu 3: thưởng Sao cho chuỗi ngày ghé (cần migration + trần/tháng); Tử vi lưu nhật (chờ chủ dự án chốt phái);
  nhắc email/Web Push.
- Khâu 4: thẻ chia sẻ "tuổi xông đất nhà mình"; thẻ theo dịp (Tết, sinh nhật); thưởng mời gắn lần nạp đầu.
- Khâu 5: gói "Năm cá nhân" PDF; lộ trình chuyên gia CG-2…CG-9 (CG-1 còn là ĐỀ XUẤT chờ chốt).
- Tầng HỌC Tử vi GĐ1 (bảng đếm 0017) và pgvector GĐ2: **chờ chủ dự án duyệt theo ngưỡng** — không tự làm.

Mọi việc mới: hỏi trước nếu thêm dependency, đổi schema DB, đổi stack, hay refactor ngoài phạm vi (xem "Cấm tuyệt đối"
trong `CLAUDE.md`). Đổi kết quả tính toán = tăng `ENGINE_VERSION` (hiện 0.1.4) + golden mới.

## 5. Cách chủ dự án làm việc với Claude

- Xưng hô: Claude là "em", chủ dự án là "anh". Viết tiếng Việt có dấu, câu ngắn, giải thích bước bấm cụ thể cho việc
  cần quyền tài khoản.
- Quy trình: làm trên nhánh `claude/…`, commit rõ ràng, push, mở **PR draft**, theo dõi CI tới xanh; ghi quyết định mới
  vào bảng "Quyết định đã chốt" trong `CLAUDE.md`, việc cho anh vào `VIEC-CUA-ANH.md`.
- Ranh giới cố định: Sao không đổi ra tiền, thưởng mời một tầng, không đa cấp, không doạ / phán hung / đếm ngược giả,
  không ghi chuyên gia là người thẩm định bài họ chưa đọc, không lộ tên thư viện/nhà cung cấp trên trang công khai (BM-1),
  không chép mã/dữ liệu từ nguồn AGPL/GPL/không giấy phép.

## 6. Để tài khoản Claude mới làm được

1. Tài khoản mới vào claude.ai → Settings → Connectors → kết nối **GitHub** (cùng tài khoản GitHub `mrducluan`, hoặc
   thêm tài khoản kia làm collaborator của repo) và cài GitHub App Claude cho repo `mrducluan/hieubanthan`.
2. Mở Claude Code (web hoặc máy) với repo này, gõ câu mở đầu, ví dụ:
   > Đọc `docs/BAN-GIAO-PHIEN.md`, `CLAUDE.md`, `docs/VIEC-CUA-ANH.md`. Nhắc anh các việc chưa xong, rồi làm tiếp PR #98.
3. Các artifact trên claude.ai của tài khoản cũ (kế hoạch 90 ngày, Phòng duyệt
   `https://claude.ai/artifact/5ok13DRcbdxDGF7iMQ1TP4`…) thuộc tài khoản cũ; tài khoản mới chỉ xem được nếu anh chia
   sẻ link. Riêng **Phòng duyệt** ghi dữ liệu duyệt vào artifact đó — nếu chuyển hẳn, cần xuất dữ liệu duyệt ra
   `tham_dinh.json` bằng `engine/scripts/ap_duyet.py` trước.
4. Biến môi trường/khoá bí mật nằm trên Vercel/Render/Supabase/GitHub Secrets, **không** trong repo — không cần
   chuyển, Claude mới không đọc được chúng (đúng như thiết kế).
