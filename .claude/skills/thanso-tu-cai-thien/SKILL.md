---
name: thanso-tu-cai-thien
description: Vòng tự cải thiện cho hỏi đáp thần số của HieuBanThan — đo độ phủ trên kho 2.000+ câu hỏi có nhãn, tìm lỗ hổng (phân loại sai, KB thiếu, thiếu chỉ số), bổ sung kho câu hỏi + KB + luật định tuyến, đo lại và mở PR có số trước/sau. Kích hoạt khi nghe "cải thiện Q&A", "vòng cải thiện", "câu hỏi trả lời chưa tốt", "đo độ phủ", "nhật ký hỏi", "self improving", hoặc theo lịch định kỳ.
---

# Vòng tự cải thiện — thần số

Mục tiêu: mỗi vòng làm **đúng hơn trên câu hỏi thật**, không bao giờ lùi. Kiến trúc:
`docs/KIEN-TRUC-THANSO-V2.md`. Chuẩn nội dung KB: skill `thanso-kb`.

## Hợp đồng (không thương lượng)

- **Không hạ ngưỡng** trong `engine/tests/test_hoi_phan_loai.py` / `test_hoi_tra_loi.py` để
  qua test. Recall câu khủng hoảng luôn 100%.
- **Không sửa nhãn cho khớp máy** — chỉ sửa nhãn khi nhãn sai rõ ràng, và ghi lý do trong PR.
- **Không lưu dữ liệu cá nhân**: không tên, ngày sinh, user_id trong kho câu hỏi hay commit.
  Câu từ nhật ký đã được lọc (`app/nhat_ky.py`), vẫn phải đọc lại trước khi chép vào kho.
- Mỗi vòng = một nhánh + một PR, có bảng số trước/sau.

## Các bước

1. **Đo mốc.** `cd engine && python scripts/vong_cai_thien.py do`
   (ghi `fixtures/cau_hoi/lich_su_do.jsonl`; exit 1 nếu lùi).
2. **Lấy câu mới** (chọn nguồn có sẵn):
   - Nhật ký thật: `python scripts/vong_cai_thien.py keo-nhat-ky` (cần `SUPABASE_URL` +
     `SUPABASE_SERVICE_KEY`, chỉ chủ dự án có) → `fixtures/cau_hoi/ung_vien/*.jsonl`.
   - Câu chủ dự án gửi, hoặc tự soạn thêm theo mảng đang mỏng (xem `theo_linh_vuc` trong
     `python scripts/danh_gia_thanso.py --kha-nang v2 --json`).
3. **Gắn nhãn** theo taxonomy trong `fixtures/_cau_hoi_goc.py` (linh_vuc, chu_de, y_dinh,
   doi_tuong, xu_ly, can) và thêm vào `NHOM` đúng nhóm. Chạy
   `python fixtures/_generate_cau_hoi_thanso.py`.
4. **Chẩn đoán.** `python scripts/vong_cai_thien.py bao-cao` → nhóm lỗi hàng đầu. Sửa theo
   thứ tự rẻ → đắt:
   1. Nhãn sai rõ ràng → sửa nhãn (ghi lý do).
   2. Định tuyến sai → sửa từ khoá / luật trong `app/luangiai/hoi.py`. Cẩn thận chữ bỏ dấu
      trùng nhau ("mổ"/"mở", "thì"/"thi", "yếu"/"yêu", "nghiệp" trong "sự nghiệp").
   3. KB thiếu nội dung → viết theo skill `thanso-kb`.
   4. Thiếu phép tính → `app/calc/thanso_mo_rong.py`, **test + golden tính tay trước**.
   5. Gói bằng chứng chọn sai khối → `goi_bang_chung()` trong `hoi.py`.
5. **Đo lại + test.** `python -m pytest -q` và `python scripts/vong_cai_thien.py do` phải
   xanh, không lùi. Web đổi thì chạy thêm `cd web && npm run typecheck && npm run e2e`.
6. **PR** với base là nhánh làm việc hiện tại; thân PR có: bảng chỉ số trước/sau (từ
   `lich_su_do.jsonl`), nhóm lỗi đã xử lý, nhãn đã sửa và lý do.

## Chỉ số theo dõi (mốc 2026-09-30, engine 0.1.0, 2.023 câu)

| Chỉ số | Mốc |
|---|---|
| Câu trả lời có căn cứ + đúng lĩnh vực (không LLM) | 90,21% |
| Phân loại đúng lĩnh vực | 90,21% |
| Phân loại đúng đối tượng | 98,02% |
| Recall câu khủng hoảng | 100% (0 bắt nhầm) |
| Recall câu cần từ chối | 100% |

Vòng 2026-10-08 (engine 0.1.4): đúng lĩnh vực **95,01%**, đối tượng 98,67%, khủng hoảng/từ chối 100%, 0 bắt nhầm.
Bài học: phần giới thiệu ("Mình bán hàng online, …") chỉ là bối cảnh — lĩnh vực theo câu hỏi chính; từ khoá ngắn
phải chặn cụm trùng ("nghệ thuật"/"nghề", "thăng tiến"/"tiền", "mũi tên"/"tên", "với con số"/"với con").

## Lịch chạy gợi ý

Mỗi tuần một vòng khi đã bật nhật ký (`NHAT_KY_HOI=1` trên Render + bảng 0004). Trước khi
bật nhật ký: chạy khi có ≥ 30 câu mới từ chủ dự án / người dùng thử.
