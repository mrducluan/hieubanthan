# Bộ đánh giá "ảnh nhà → bố cục" (PT-V0)

Đây là bộ đánh giá để chấm model thị giác ở bước PT-V2 (`docs/LO-TRINH-PHONG-THUY-HINH-ANH.md`).
**Ảnh không vào git.** Ảnh để ở thư mục Google Drive riêng của chủ dự án. Repo chỉ giữ nhãn JSON.

## Mỗi bộ = một căn nhà

```
fixtures/phongthuy_anh/<ma_bo>/      ma_bo: nha_001, nha_002… (không dùng tên/địa chỉ chủ nhà)
  meta.json     {"ma_bo", "so_anh", "dong_y", "loai_phong", "nguoi_gan_nhan"}
  nhan.json     bố cục gán tay, đúng schema engine/app/schemas/bo_cuc.schema.json
  anh/          (KHÔNG commit) 5–15 ảnh: mặt tiền, cửa chính nhìn vào, phòng khách, bếp, phòng ngủ, WC, cầu thang
```

- `dong_y`: ghi mã phiếu đồng ý (theo `docs/MAU-DONG-Y-ANH-NHA.md`). Không có phiếu thì không dùng bộ đó.
- `loai_phong`: các phòng có trong ảnh, chọn trong `cua_chinh, phong_khach, bep, phong_ngu, ve_sinh, cau_thang,
  ban_tho, phong_lam_viec, ngoai_canh, so_do`.

## Cách gán nhãn

Gán theo đúng **sự thật của căn nhà**, không theo những gì ảnh "trông giống". Khi không chắc, bỏ trống mục đó.

- `huong_nha_do`: đo bằng la bàn tại cửa chính (đứng quay lưng vào nhà). Cách nhanh: dùng mục "Đo hướng nhà" trên web.
- `vi_tri`: phòng nằm ở phương nào **nhìn từ tâm nhà** (8 phương hoặc `Trung cung`).
- `dau_hieu`: đủ 18 mã (chạy `--kiem` để xem danh sách). Ghi `{"co": true}` hoặc `{"co": false}`. **Ghi cả "không có"**,
  vì model báo nhầm cũng bị trừ điểm.

## Lệnh

```bash
cd engine
python scripts/danh_gia_bo_cuc.py --kiem   # kiểm mọi nhãn đúng schema, meta đủ trường
python scripts/danh_gia_bo_cuc.py          # (PT-V2) chấm du_doan.json so với nhan.json
```

Cần **50–100 bộ**, đủ các kiểu nhà (nhà phố, căn hộ, nhà cấp 4, biệt thự) và đủ 10 loại phòng.
`vi_du_001` là bộ mẫu không có ảnh, chỉ để thử công cụ.
