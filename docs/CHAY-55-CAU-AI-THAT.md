# Chạy bộ 55 câu chuyên gia với AI thật — đề xuất và cách làm (LLM-55)

## Vì sao cần

Bộ hồi quy `test_hoi_dap_chuyen_gia.py` chỉ chạy **bản template**: bản này tất định, không tốn tiền. Khi bật
`OPENROUTER_API_KEY`, câu trả lời do AI viết lại từ cùng "gói bằng chứng", và có ba rủi ro:

1. **AI bịa thêm**: con số, năm, sự kiện, lời phán.
2. **AI làm rơi dữ kiện**: hỏi Hoá Kỵ ở đâu, AI viết hay nhưng quên nói cung nào.
3. **Bộ kiểm tra chặn oan**: AI viết đúng nhưng bị chặn, nên người dùng luôn nhận bản template. Bật AI chỉ tốn tiền
   mà không được gì.

Ví dụ rủi ro 3 đã gặp khi dựng công cụ: câu Huyền Không có chữ "3 sơn" ghi cứng trong mẫu, không nằm trong gói
→ mọi bản AI nhắc "3 sơn" đều bị chặn. **Đã sửa** trong PR này.

## Cách làm em đề xuất (tốt nhất cho dự án)

**Chạy trên GitHub Actions bằng một nút, không cài gì trên máy anh**:

1. Lấy khoá OpenRouter: openrouter.ai, nạp vài USD. Một lượt 55 câu, mỗi câu 1 lần diễn đạt (cộng 1 lần chấm nếu
   bật giám khảo), thường tốn dưới 1 USD.
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**: tên
   `OPENROUTER_API_KEY`, giá trị là khoá. Khoá nằm trong secret, không bao giờ vào code.
3. GitHub → **Actions → llm-55 → Run workflow**, điền:
   - `model`: model diễn đạt. Chép đúng id trên openrouter.ai/models. Nên chạy **2 lượt**, một model lớp lớn (chất
     lượng) và một model lớp nhỏ (rẻ, nhanh), để so.
   - `giam_khao`: một model **khác** model diễn đạt, để nó chấm trung thành/đầy đủ/giọng 1–5. Có thể để trống.
   - `gioi_han`: 0 = cả 55 câu. Lần đầu có thể để 5 cho chắc.
4. Chạy xong, trang kết quả hiện **bảng tóm tắt theo mảng**. Tải `bao-cao-llm-55` ở mục Artifacts: có `BAO-CAO.md`
   (từng câu cần xem lại, bản chuẩn đặt cạnh bản AI) và `ketqua.jsonl`.
5. Gửi em đường link lượt chạy. Em đọc báo cáo, sửa phần cần sửa, rồi đề xuất **bật AI theo từng mảng**.

Chạy trên máy (tuỳ chọn):

```bash
cd engine
OPENROUTER_API_KEY=… python scripts/chay_llm_chuyen_gia.py --model <id> --giam-khao <id> --ra bao-cao-llm-55
python scripts/chay_llm_chuyen_gia.py --gia-lap --ra /tmp/bc    # thử đường ống, không tốn tiền
```

## Chấm thế nào

| Lớp | Đo | Tự động? |
|---|---|---|
| 1. Bị chặn | Bộ kiểm tra số lạ và cụm cấm có sẵn trong engine; bị chặn thì người dùng nhận bản template | Có |
| 2. Giữ dữ kiện | Tỷ lệ thực thể của bản chuẩn còn trong bản AI: tên cung/sao/quẻ/hướng hai chữ trở lên và con số; không phân biệt dấu "hoá/hóa", hoa thường | Có |
| 3. Giọng | Không có "bạn sẽ", "chắc chắn", "định mệnh"…; có câu kết "tham khảo / tự soi" | Có |
| 4. Giám khảo AI | Một model khác chấm trung thành, đầy đủ, giọng (1–5) theo gói bằng chứng | Tuỳ chọn |

**Ngưỡng bật AI cho một mảng**:
- ≥ 90% câu không bị chặn;
- giữ dữ kiện trung bình ≥ 85%;
- 0 câu phán quyết;
- trung thành ≥ 4/5 (nếu có giám khảo).

Mảng chưa đạt thì giữ template. Đây vẫn là bản đầy đủ, chỉ kém mượt hơn.

## Bộ câu

- 37 câu QA-RV đã có đáp án chuỗi (đối chiếu tay).
- 18 câu đời thường bổ sung, chấm dữ kiện theo bản template. Trong đó có 1 câu khủng hoảng: câu này **không được
  gọi AI**, phải ra lời hỗ trợ.
- Trải đều 5 mảng. Danh sách nằm trong `engine/scripts/chay_llm_chuyen_gia.py` (`bo_cau()`).

## Ghi chú

- Model mặc định trong `app/narrative/llm.py` đã cũ. Sau lượt chạy, anh đặt env `OPENROUTER_MODEL` trên Render bằng
  model thắng.
- Mỗi lần đổi model hoặc đổi prompt, chạy lại workflow này trước khi bật cho người dùng.
