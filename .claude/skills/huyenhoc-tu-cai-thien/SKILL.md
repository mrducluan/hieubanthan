---
name: huyenhoc-tu-cai-thien
description: Vòng tự cải thiện cho hỏi đáp Huyền học (Tử vi · Kinh Dịch · Bát tự · Phong thuỷ) của HieuBanThan — đo độ phủ 4 module trên kho 2.031+ câu có nhãn, soát KB, tìm lỗ hổng (định tuyến sai, KB thiếu, thiếu phép tính), bổ sung câu hỏi/KB/luật, đo lại và mở PR có số trước/sau. Kích hoạt khi nghe "cải thiện hỏi đáp tử vi/kinh dịch/bát tự/phong thuỷ", "vòng cải thiện huyền học", "đo độ phủ huyền học", "nhật ký huyền học", "self improving huyền học", hoặc theo lịch định kỳ.
---

# Vòng tự cải thiện — Huyền học

Mục tiêu: mỗi vòng đúng hơn trên **câu hỏi thật**, không bao giờ lùi. Chuẩn nội dung KB: skill
`huyenhoc-kb`. Thần số có vòng riêng (`thanso-tu-cai-thien`) — đừng trộn.

## Hợp đồng (không thương lượng)

- **Không hạ sàn** trong `engine/tests/test_huyenhoc_kho.py` (mỗi module ≥ 97% có căn cứ; khủng
  hoảng + từ chối 100%; chặn nhầm 0; KB sạch; template không vi phạm bộ kiểm tra).
- **Không sửa nhãn cho khớp máy.** Chỉ sửa khi nhãn sai rõ ràng hoặc mâu thuẫn với nhãn cùng ý định;
  ghi lý do trong PR và trong `docs/KIEN-TRUC-HUYEN-HOC.md` (đã có tiền lệ: 2 câu hợp bát tự, 1 câu vợ
  chồng phong thuỷ → `can_them_du_lieu`).
- **Kho đã bão hoà thì phải thêm câu mới trước khi sửa** — kho và router do cùng người viết nên 100% trên
  kho là con số lạc quan. Thước đo trung thực là **holdout viết SAU router** (trong `tests/test_*_hoi.py`,
  mốc lần chạy đầu: Tử vi 20/24, Bát tự 16/16, Phong thuỷ 10/12). Ghi tỉ lệ lần chạy đầu vào PR trước khi sửa.
- **Không lưu dữ liệu cá nhân.** Nhật ký (`huyenhoc_hoi_nhat_ky`, migration 0005) đã lọc năm/giờ/ngày/
  SĐT/email/họ tên và KHÔNG lưu câu trả lời khi có dữ liệu sinh. Vẫn đọc lại trước khi chép vào kho.
- Không thêm dependency; không đổi CALC khi chưa có test + golden trước; không cào ctext.org.

## Các bước

1. **Đo mốc.** `cd engine && python scripts/vong_cai_thien_huyenhoc.py do`
   (ghi `fixtures/cau_hoi/lich_su_do_huyenhoc.jsonl`; exit 1 nếu lùi > 0,5 điểm hoặc khủng hoảng < 100%).
2. **Lấy câu mới** (ưu tiên từ trên xuống):
   - Nhật ký thật: đọc bảng `huyenhoc_hoi_nhat_ky` bằng service role (chủ dự án) — lọc `do_phu = 'khong'`,
     `can_them` bất thường, `loi_kiem_tra` khác rỗng; nhóm theo `mo_dun, loai`.
   - Câu chủ dự án gửi; hoặc tự viết **holdout mới** theo mảng mỏng — viết TRƯỚC khi nhìn router.
3. **Gắn nhãn** theo taxonomy `fixtures/_cau_hoi_huyenhoc_goc.py` (mo_dun, linh_vuc, chu_de, y_dinh,
   doi_tuong, xu_ly, che_do, can), rồi `python fixtures/_generate_cau_hoi_huyenhoc.py`.
4. **Chẩn đoán.** `python scripts/vong_cai_thien_huyenhoc.py bao-cao [--mo-dun tuvi]`. Sửa rẻ → đắt:
   1. Nhãn sai rõ ràng (ghi lý do).
   2. Định tuyến: `app/hoidap/<module>.py` (`phan_loai`). Bẫy bỏ dấu: "tử vi" (môn) vs sao Tử Vi,
      "nam" (giới/hướng) vs "năm", "kỵ" vs "Kỷ", "mổ/mở", "yếu/yêu"; lời dẫn đầu câu ("Tôi sắp mua nhà, …",
      "Tôi đang ở đại hạn…") — tách/không tách cẩn thận.
   3. KB thiếu → viết theo skill `huyenhoc-kb`, chạy `kiem-kb`.
   4. Gói bằng chứng chọn sai khối → `goi_bang_chung()` của module.
   5. Thiếu phép tính → `app/calc/*` với **test + golden trước** (oracle: iztro cho tử vi,
      lunar-typescript cho bát tự/tiết khí — chỉ để sinh golden; bảng tay cho phong thuỷ).
5. **Đo lại + test.** `python -m pytest -q`, `python scripts/vong_cai_thien_huyenhoc.py do` (không lùi);
   web đổi thì `cd web && npm run typecheck && npx playwright test`.
6. **PR** (base = nhánh làm việc hiện tại): bảng trước/sau từ `lich_su_do_huyenhoc.jsonl`, tỉ lệ holdout
   lần chạy đầu, nhóm lỗi đã xử lý, nhãn đã sửa + lý do.

## Mốc (2026-09-30, engine 0.1.1, 2.031 câu)

| Module | Câu | Có căn cứ | Holdout lần đầu | Ghi chú |
|---|---|---|---|---|
| Tử vi | 687 | 100% | 20/24 | lá số iztro 2.6.0, 3 lớp hạn |
| Kinh Dịch | 730 | 100% | — | Lục Hào có vượng suy rút gọn |
| Bát tự | 254 | 100% | 16/16 | golden 42/42, tiết khí ≤ 0,63 phút |
| Phong thuỷ | 360 | 100% | 10/12 | bảng 8×8 tay 100% |

## Lịch chạy gợi ý

Mỗi tuần một vòng khi đã chạy migration 0005 và bật `NHAT_KY_HOI=1`; trước đó chạy khi có ≥ 30 câu
mới cho một module.
