# Đánh giá thần số học — trước và sau v2

> 2026-09-30. Đo bằng chạy thật, lặp lại được:
> `cd engine && python scripts/danh_gia_thanso.py [--kha-nang v2]` và
> `python scripts/vong_cai_thien.py do`.

## 1. Cách đánh giá

Thay vì đoán, em dựng **kho 2.023 câu hỏi có nhãn**: vai người dùng thật hỏi về mọi
mặt đời sống (`engine/fixtures/cau_hoi/thanso_cau_hoi.jsonl`).

| Nguồn câu | Số câu | Ghi chú |
|---|---|---|
| Soạn tay (`_cau_hoi_goc.py`) | 634 | Cách người Việt hỏi trên trang tra cứu, nhóm FB, TikTok |
| + bối cảnh người hỏi | 687 | "Em là mẹ bỉm hai con, …", "Tôi 52 tuổi, …" |
| + người hỏi tự nêu số | 233 | "Số chủ đạo 7 hợp nghề gì?", "Năm cá nhân 5 nên làm gì?" |
| + cặp số hợp đôi | 156 | 78 cặp × 2 cách hỏi |
| + gõ không dấu | 313 | "toi hop voi nghe gi" |

18 lĩnh vực: bản thân, tình yêu, hợp đôi, gia đình, con cái, sự nghiệp, tiền bạc, học tập,
sức khoẻ tinh thần, thời vận, người khác, tên gọi, tâm linh/nghiệp, kỹ thuật, bạn bè & xã hội,
đời sống, ngoài phạm vi, khủng hoảng. Mỗi câu gắn nhãn lĩnh vực, ý định, đối tượng (bản thân /
người khác / hai người / con), cách xử lý và các chỉ số cần có để trả lời có căn cứ.

## 2. Kết quả

| Chỉ số | Trước (v1) | Sau (v2) |
|---|---|---|
| Câu trả lời **có căn cứ KB + đúng lĩnh vực** — có LLM | 0% | 90,2%¹ |
| Như trên — **không LLM** | 0% (Q&A tắt) | **90,2%** |
| Câu có căn cứ nhưng nhìn từ lĩnh vực lân cận | 49,4% (LLM tự suy diễn) | 9,8% |
| Câu không có căn cứ nào | 50,6% | **0%** |
| Câu khủng hoảng được chuyển sang hỗ trợ | chỉ trông vào prompt | **100%**, 0 bắt nhầm (test chặn) |
| Câu cần từ chối (xổ số, ngày chết, chẩn đoán bệnh, tuyển dụng) | chỉ trông vào prompt | **100%** |
| Phân loại đúng đối tượng (người hỏi / người khác / hai người / con) | — | 98,0% |
| Nội dung KB thần số | ~2.200 chữ | ~17.000 chữ |

¹ Khi có LLM, nội dung vẫn đến từ cùng gói bằng chứng; LLM chỉ viết lại cho mượt và bị bộ
kiểm tra chặn nếu thêm số lạ hay giọng tiên đoán. Chưa đo với LLM thật vì không có key
trong môi trường này.

### Vì sao v1 là 0%
- KB chỉ có nghĩa **chung** của 12 số; không có một đoạn nào theo lĩnh vực.
- Q&A đưa nguyên bảng số cho LLM tự "kết nối" → LLM buộc phải tự sinh nghĩa, trái luật
  tầng 4. Không có key thì Q&A không trả lời gì.
- Không nhận dữ liệu người thứ hai; thiếu biểu đồ ngày sinh, mũi tên, tháng/ngày cá nhân,
  nợ nghiệp…; không có đường xử lý tất định cho câu khủng hoảng.

## 3. Đã làm trong v2

- **CALC** `app/calc/thanso_mo_rong.py`: biểu đồ ngày sinh + mũi tên, số ngày sinh, thái độ,
  trưởng thành, tháng/ngày cá nhân, nợ nghiệp, bài học nghiệp, cặp số hai người. Có golden
  tính tay, test viết trước. Không đụng bản port gốc.
- **KB** `app/kb/data/thanso_*.json`: 12 số × 11 lĩnh vực (mỗi mục có mặt tối + câu tự soi),
  45 cặp số, biểu đồ, chỉ số phụ, 28 mục giải thích kỹ thuật, mẫu xử lý. Migration `0003` +
  seed.
- **RULES** `app/luangiai/hoi.py`: phân loại tất định (không LLM), chịu được câu không dấu và
  câu có phần giới thiệu; dựng gói bằng chứng chỉ từ KB.
- **NARRATIVE** `app/narrative/hoi_van.py`: trả lời template không cần LLM; LLM chỉ diễn đạt
  gói; bộ kiểm tra đầu ra; lỗi → rơi về template.
- **API** `/v1/thanso/hoi` nhận `nguoi_kia`, `ngay_xem`. Web: biểu đồ ngày sinh, ô người thứ
  hai, câu trả lời hiện ngay không cần AI. E2E phủ cả luồng hợp đôi.
- **Nhật ký + vòng tự cải thiện**: `app/nhat_ky.py` (lọc ngày/SĐT/email/tên, tắt mặc định),
  migration `0004`, `scripts/vong_cai_thien.py`, skill `.claude/skills/thanso-tu-cai-thien`,
  skill chuẩn nội dung `.claude/skills/thanso-kb`.

## 4. Giới hạn — nói thẳng

1. **Kho câu hỏi do AI soạn**, chưa phải câu thật của người dùng. Nó phủ rộng nhưng người
   thật sẽ hỏi lệch. Vòng tự cải thiện có đường kéo câu thật từ nhật ký khi bật.
2. **Bộ định tuyến dựa trên từ khoá**: nhanh, tất định, test được, nhưng sẽ gặp câu lạ. Mức
   90% là trên kho mà chính nó được tinh chỉnh theo → trên câu thật có thể thấp hơn. Cần đo
   lại khi có nhật ký.
3. **Nội dung KB v2 là bản nháp AI** (hiển thị theo quyết định của anh). Chưa có người có
   nghề duyệt; cột `trang_thai` để duyệt dần. Test chặn giọng phán quyết, nhưng không thay
   được mắt người.
4. **Câu trả lời template dài và hơi lặp** (ghép 3–6 đoạn). LLM làm mượt được; template là lưới
   an toàn.
5. **Chưa chạy trên Supabase**: migration 0003/0004 và seed chưa được áp; KB v2 đọc từ file.
   Nhật ký chỉ ghi khi anh bật `NHAT_KY_HOI=1` sau khi chạy 0004.
6. **Mở câu hỏi về người khác** (quyết định của anh) có rủi ro NĐ 13/2023: engine không lưu
   ngày sinh người thứ hai, nhật ký lọc ngày tháng; web nhắc nên hỏi ý người kia. Nên để luật
   sư xem khi làm cổng pháp lý (WS-7).

## 5. Việc tiếp theo (xếp theo giá trị)

1. Anh chạy migration 0003 + seed + 0004 trên Supabase, bật `NHAT_KY_HOI=1` trên Render.
2. Người có nghề duyệt KB v2 (bắt đầu từ `tinh_yeu`, `su_nghiep`, `ban_than` — 3 mảng hỏi nhiều nhất).
3. Chạy vòng tự cải thiện hằng tuần trên câu thật; mục tiêu ≥ 95% đúng lĩnh vực trên câu thật.
4. Nút 👍/👎 dưới câu trả lời (cột `huu_ich` đã có) → nguồn tín hiệu cho vòng cải thiện.
5. Bật đọc KB v2 từ Supabase (sửa trực tiếp trong Table Editor như v1).
