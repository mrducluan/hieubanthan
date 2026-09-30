# Kiến trúc thần số v2 — trả lời được "hàng nghìn câu hỏi" mà vẫn giữ 4 tầng

> Lập 2026-09-30. Nền: kho 2.023 câu hỏi có nhãn (`engine/fixtures/cau_hoi/`) và
> báo cáo `docs/DANH-GIA-THANSO.md`. Không đổi 4 tầng của CLAUDE.md — v2 là **lấp
> đầy** từng tầng, không phá.

## 1. Vì sao v1 không đáp ứng

| Tầng | v1 | Hệ quả với kho câu hỏi |
|---|---|---|
| CALC | 4 chỉ số lõi + đỉnh cao/thử thách/năm cá nhân | Thiếu biểu đồ ngày sinh, mũi tên, tháng/ngày cá nhân, số ngày sinh, thái độ, trưởng thành, nợ nghiệp, bài học nghiệp, hợp đôi → ~40% câu thiếu phép tính |
| KB | Nghĩa **chung** của 12 số (từ khoá, mặt tối, phản chứng) | Không có một đoạn nào về "số 6 trong tình yêu / công việc / nuôi con" |
| RULES | Không có cho Q&A | Không phân loại câu hỏi, không biết câu nào là khủng hoảng, câu nào ngoài phạm vi |
| NARRATIVE | Đẩy nguyên bảng số cho LLM, để LLM tự "kết nối" | LLM buộc phải tự sinh nghĩa theo lĩnh vực → **vi phạm luật tầng 4** (cấm thêm dữ kiện). Không có key → 0 câu trả lời |

## 2. Luồng v2

```
câu hỏi ──► [RULES] phân loại tất định ──► [CALC] tính đúng chỉ số cần
              │ lĩnh vực, ý định,             (của người hỏi, và người thứ hai
              │ đối tượng, cách xử lý          nếu có)
              ▼
         xử lý đặc biệt? ──có──► mẫu cố định (an toàn / ngoài phạm vi / cần thêm dữ liệu)
              │ không
              ▼
         [KB] lấy đúng khối: số × lĩnh vực, cặp số, mũi tên, chỉ số phụ…
              ▼
         GÓI BẰNG CHỨNG (JSON, mọi mục có source_id + school_id)
              ▼
   [NARRATIVE] template tất định  ──(có key)──►  LLM diễn đạt lại gói
                                                   ▼
                                     bộ kiểm tra: số lạ? cụm cấm? → rơi về template
              ▼
         nhật ký ẩn danh (câu hỏi đã lọc + phân loại + độ phủ + câu trả lời)
              ▼
         vòng tự cải thiện (skill `thanso-tu-cai-thien`)
```

Điểm then chốt: **Q&A chạy được không cần LLM.** LLM chỉ làm câu văn mượt hơn;
nội dung đến từ KB. Đo được, test được, không tốn tiền, không bịa.

## 3. Từng tầng

### 3.1 CALC — `app/calc/thanso_mo_rong.py` (mới, không sửa bản port gốc)
Test viết trước, golden `fixtures/golden/thanso_mo_rong.json`.

| Hàm | Quy ước chốt |
|---|---|
| `so_ngay_sinh(d)` | rút gọn ngày, giữ 11/22 |
| `so_thai_do(d, m)` | tổng chữ số ngày + tháng, giữ 11/22 |
| `so_truong_thanh(dd, sm)` | đường đời + sứ mệnh, rút gọn, giữ 11/22/33 |
| `thang_ca_nhan`, `ngay_ca_nhan` | năm cá nhân mốc 1/1 (như trang đọc hiện tại) + tháng (+ ngày), rút 1–9 |
| `bieu_do_ngay_sinh(d, m, y)` | đếm chữ số 1–9 (bỏ 0); lưới 3-6-9 / 2-5-8 / 1-4-7; số thiếu; 8 mũi tên đủ + các mũi tên trống |
| `no_nghiep(...)` | 13/14/16/19 xuất hiện trong chuỗi rút gọn của ngày sinh, đường đời, sứ mệnh, linh hồn, nhân cách |
| `bai_hoc_nghiep(ten)` | chữ số 1–9 vắng mặt trong giá trị chữ cái của tên |
| `hop_doi(a, b)` | cặp đường đời / linh hồn / nhân cách của hai người (rút số cái về gốc để tra bảng 45 cặp) |

### 3.2 KB v2 — file JSON trước, Supabase sau (migration `0003`)
Mọi mục có `source_id`, `school_id`, `trang_thai` (`nhap_ai` | `da_duyet`).
Quyết định 2026-09-30: bản nháp AI **được hiển thị mọi nơi**; `trang_thai` giữ để
duyệt dần.

| File | Nội dung |
|---|---|
| `thanso_linh_vuc.json` | 12 số × 10 lĩnh vực: xu hướng · mặt tối · gợi ý · câu tự soi |
| `thanso_cap_so.json` | 45 cặp số (1–9): điểm hoà · điểm va · việc hai người cùng làm |
| `thanso_bieu_do.json` | mũi tên đủ/trống, số thiếu, số lặp |
| `thanso_chi_so_phu.json` | số ngày sinh 1–31, thái độ, trưởng thành, tháng/ngày cá nhân, nợ nghiệp, bài học nghiệp |
| `thanso_giai_thich.json` | giải thích kỹ thuật: cách tính, số cái, quy ước lệch nhau, Barnum, độ tin |
| `thanso_xu_ly.json` | mẫu cố định: an toàn, ngoài phạm vi, cần thêm dữ liệu |

### 3.3 RULES — `app/luangiai/hoi.py`
- `phan_loai(cau_hoi)`: bỏ dấu, khớp từ khoá theo thứ tự ưu tiên
  **an_toan > ngoai_pham_vi > ky_thuat > hop_doi > nguoi_khac/con > lĩnh vực**.
  Không LLM (CLAUDE.md: RULES cấm gọi LLM). Nhận cả câu gõ không dấu.
- Bản đồ lĩnh vực → vị trí số được dùng (vd tình yêu → linh hồn + nhân cách +
  đường đời; công việc → sứ mệnh + đường đời + trưởng thành; thời điểm → năm/
  tháng/ngày cá nhân).
- `goi_bang_chung(...)`: chỉ những khối KB liên quan, không đổ cả bảng số.
- Golden: kho câu hỏi. Ngưỡng CI: an toàn recall 100%, cách xử lý ≥ 95%,
  lĩnh vực ≥ 85%.

### 3.4 NARRATIVE — `app/narrative/hoi_van.py`
- Template tất định ghép từ gói bằng chứng (mở · 2–3 ý · mặt tối · gợi ý · câu tự
  soi · lưu ý).
- LLM (nếu có key) nhận **chỉ gói bằng chứng**; `kiem_tra_dau_ra()` chặn con số
  không có trong gói và cụm từ tiên đoán ("chắc chắn", "bạn sẽ"…). Hỏng → template.

### 3.5 Nhật ký + vòng tự cải thiện
- Bảng `thanso_hoi_nhat_ky` (migration `0004`): câu hỏi **đã lọc** ngày tháng/số
  điện thoại, phân loại, độ phủ, khối thiếu, chế độ, câu trả lời, phiên bản
  engine, đánh giá 👍/👎. **Không** user_id, **không** tên, **không** ngày sinh.
- Skill `.claude/skills/thanso-tu-cai-thien`: đo → gom lỗ hổng → bổ sung kho câu
  hỏi + KB (theo chuẩn skill `thanso-kb`) → test + đo lại → PR có số trước/sau.

## 4. Chỉ số thành công

| Chỉ số | v1 | Mục tiêu v2 |
|---|---|---|
| Câu trả lời có căn cứ đầy đủ (có LLM) | 0% | ≥ 90% |
| Câu trả lời có căn cứ đầy đủ (không LLM) | 0% | ≥ 90% |
| Recall câu khủng hoảng | không đảm bảo | 100% (test chặn) |
| Câu trả lời chứa dữ kiện ngoài KB | không đo được | 0 (bộ kiểm tra chặn) |
