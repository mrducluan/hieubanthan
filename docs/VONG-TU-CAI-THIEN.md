# Vòng tự cải thiện (self-improvement loop) của HieuBanThan — mọi mảng, và quy tắc riêng tư đi kèm

**Ngày:** 2026-10-22 · Trả lời yêu cầu chủ dự án: "RLHF patch rules, user_feedback có ngày sinh → cập nhật lại quy tắc riêng
tư, để self-improvement loop". Tài liệu này nói **vòng học của mình là gì, dữ liệu nào được giữ, máy được tự làm gì, việc gì
phải qua người duyệt**, và vì sao không chép bản RLHF của bộ tài liệu Drive (`docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md` mục 4).

## 1. Vòng học hiện có (sau PR PT-81 / HỌC-ĐS)

```
người dùng bấm "Đúng với mình / Chưa đúng" (1 chạm, không ô chữ)
        │  chỉ MÃ hộp + phái + kết quả  (PostHog ẩn danh + POST /api/kiem-chung)
        ▼
kiem_chung_phieu (migration 0017): một phiếu / người / mã, khoá HMAC, hết hạn 24 tháng
        │
        ├─► công khai "x% trong N người thấy đúng" khi mã ≥ 30 phiếu  (ty_le_kiem_chung, cache 1 giờ)
        │
        ├─► engine nhận `trong_so` (+ `ca_nhan` của chính người xem): hộp ≥ 100 phiếu & < 40 % đúng → rời lớp đời thường,
        │   xuống "Vì sao nói vậy"; hộp người đó bấm "chưa đúng" xếp cuối  (doi_song_khuon.ap_hoc — dùng chung mọi mảng)
        │
        └─► /quan-tri/hoc: bảng mã theo mảng, tỉ lệ thấp lên đầu → người duyệt sửa KB qua PR (Kho tri thức)
```

Cùng một vòng cho **Tử vi** (LG-ĐS), **Bát tự** (BT-ĐS), **Thần số** (TS-V3: góp ý chữ ký số + cụm bất thường),
**Phong thuỷ** và **Kinh Dịch** (HỌC-ĐS, PR này — trước đó hộp của hai mảng này chưa có mã nên không vào vòng).

Các tín hiệu khác đã có, cũng chỉ là **mã**: tín hiệu ngầm phái đọc (KC-5, đếm trên máy), ý định hôm nay (HN-4), câu hỏi
không nhận ra (mã nhóm), xác nhận "Đúng ý tôi hỏi" cho kho vectơ (LG-ĐS: câu đã lọc, không user_id, ≥ 3 người mới bật).

## 2. Mã kiểm chứng của từng mảng — dựng từ **dữ kiện đã tính**, không từ chữ người dùng

| Mảng | Dạng mã | Dựng từ | Không bao giờ chứa |
|---|---|---|---|
| Tử vi | `ds.<chương>.<sao>.<sáng/hãm>.<loại>` · `mau.<cung>.<hoá>.<cung>` · `<mức>.<lý do>` | sao, cung, hoá, độ sáng, mức | ngày giờ sinh, tên, lá số đầy đủ |
| Bát tự | `ds.bt.<chương>.<thập thần/nhật chủ/…>` | thập thần, nhật chủ, cách cục | tứ trụ đầy đủ, ngày sinh |
| Thần số (góp ý) | chữ ký = **các con số rút gọn** của đúng phái + mã câu + lĩnh vực | số đường đời, linh hồn… | họ tên, ngày sinh, user_id, chữ người dùng (ghi chú chỉ khi tự tích đồng ý, đã lọc email/điện thoại/ngày) |
| Phong thuỷ (mới) | `ds.phongthuy.<chương>.<loại hộp>.<tiêu đề rút gọn từ dữ kiện>` — ví dụ `ds.phongthuy.ngoi_nha_voi_ban.cot_loi.huong_nam_voi_ban_dien_nien` | hướng (8 hướng), du niên, mệnh quái, cặp sao, tháng tiết | **độ la bàn chính xác, toạ độ, địa chỉ, năm sinh, sơ đồ/ảnh nhà**, tên người cùng ở |
| Kinh Dịch (mới) | `ds.kinhdich.<chủ đề>.<loại hộp>.q<số quẻ>.<mức>` — ví dụ `ds.kinhdich.cong_viec.luu_y.q10.can_bang` | chủ đề (20 mã), quẻ King Wen, mức | **câu hỏi**, giờ gieo, sáu hào, tên |

Quy tắc chung (bổ sung CLAUDE.md, mục quy tắc riêng tư (d)): phiếu kiểm chứng của **mọi mảng** chỉ gồm mã hộp + phái +
kết quả; mã Phong thuỷ **không** mang độ la bàn, toạ độ, địa chỉ, năm sinh; mã Kinh Dịch **không** mang câu hỏi hay giờ gieo.
Phiếu không dùng huấn luyện mô hình; chỉ để xếp lại hộp và cho người duyệt xem lại KB.

## 3. Ranh giới — máy được làm gì, người làm gì, không ai được làm gì

| Máy **tự** làm (không hỏi) | Người duyệt làm (qua `/quan-tri` + PR) | **Không bao giờ** |
|---|---|---|
| Gắn số "x% thấy đúng" khi ≥ 30 phiếu | Đọc bảng mã có tỉ lệ thấp, mở KB sửa câu, mở PR | Máy sinh câu luận mới |
| Hạ hộp ≥ 100 phiếu & < 40 % xuống "Vì sao nói vậy" | Quyết định cụm thần số "chờ duyệt" (đã sửa / bỏ qua) | Máy tự sửa KB / tự bật luật mới |
| Xếp cuối hộp chính người đó bấm "chưa đúng" | Bật/tắt câu trong kho vectơ ý định | Đưa chữ người dùng vào lời nhắc AI |
| Thêm câu hỏi ĐÃ LỌC vào kho vectơ khi ≥ 3 người xác nhận (≥ 1 đăng nhập) | Viết "luật" mới (RULES) từ gợi ý thống kê, có test, qua PR | Lưu tên / ngày sinh / câu hỏi / ảnh nhà cùng phiếu |
| Gom mã theo mảng, đánh dấu "đang xem lại" ở `/quan-tri/hoc` | Chốt đổi mặc định (vd đổi phái đọc mặc định) | Dùng phiếu để huấn luyện / tinh chỉnh mô hình |

## 4. Bản RLHF của Drive được chuyển thành gì

| Drive | Hieuban |
|---|---|
| `user_consultation_sessions` (user_id, birth_date, full_name, mặt bằng, toggles, rating 1–5, outcome 30 ngày) | **Không có bảng phiên tư vấn.** Phiếu = mã + khoá HMAC. Hồ sơ nhà lưu trên máy; tài khoản chỉ khi bấm "Lưu nhà" (0018). |
| `knowledge_golden_samples` (lời LLM 4 lớp tự thăng làm chuẩn) | **Không.** Chuẩn là KB trong git (người viết/duyệt) + golden *phép tính* trong `fixtures/`. |
| `rlhf_patch_rules` (`patch_instruction` ghi thẳng vào prompt/engine, `AUTO_PATCHED`) | Luật chỉ sống trong RULES (Python, có test) hoặc KB (JSON), **qua PR**. Bảy luật mẫu có giá trị → việc Q6 trong tài liệu đánh giá. |
| `feedback_quarantine_log` + "Critic Agent" | `/quan-tri/hoc`: hộp tỉ lệ thấp + cụm thần số "chờ duyệt". Không có agent tự chẩn đoán/tự vá. |
| rating 1–5 + outcome 30 ngày | 1 chạm "Đúng / Chưa đúng" (đã có) + **phiếu sau 30 ngày** (Q7, **đã làm 2026-10-22**, migration 0022): máy người dùng nhớ hộp Nên để ý / Lời khuyên vừa bấm "Đúng với mình" (chỉ mã + nhãn, localStorage `hbt.kc_sau.v1`); ≥ 30 ngày sau, Hôm nay hỏi hai câu ba mức "đã làm theo chưa" · "thấy khác gì" → `kiem_chung_sau` (mã + phái + hai mức + số ngày, khoá HMAC). Không chữ, không nhà, không ngày sinh. |
| `rlhf_patch_rules` tự bật | **`de_xuat_luat`** (0022): cron ngày gọi `gom_de_xuat_luat` — máy chỉ GOM dòng (mã, số phiếu, tỉ lệ, số phiếu sau) khi ≥ 100 phiếu & < 40 % đúng hoặc ≥ 30 phiếu sau & ≥ 60 % "như cũ"; người duyệt ở `/quan-tri/hoc` sửa KB / viết luật qua PR rồi đánh dấu "Đã sửa" / "Bỏ qua" (ghi nhật ký quản trị). Bảy luật mẫu của Drive đã vào KB `quy_tac_thuc_hanh` qua PR (Q6). |

## 5. Việc còn mở (chờ chủ dự án)

1. Chạy migration **0017** (kiểm chứng, bài đã lưu, kho vectơ) và **0018** (hồ sơ nhà, nhắc việc) — chưa chạy thì nút vẫn hiện,
   phiếu chỉ lên PostHog, số "x%" chưa có.
2. ~~Duyệt Q7~~ → **đã làm**: chạy migration **0022** (sau 0017, 0021). Chưa chạy thì Hôm nay vẫn hỏi lại, phiếu chỉ lên PostHog
   (`feedback_submitted{kind=sau_30}`), hàng đợi đề xuất luật trống.
3. ~~Duyệt Q6~~ → **đã làm** (KB `quy_tac_thuc_hanh`, luật căn hộ + nước vận 9 trong RULES).
