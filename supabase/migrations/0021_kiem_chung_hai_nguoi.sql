-- HN-2N kiểm chứng (chủ dự án duyệt 2026-10-22): nút "Đúng với mình / Chưa đúng" cho hộp "Xem lá số 2 người" (/tu-vi
-- khối #hop-tham). Thêm loại `hai_nguoi` vào kiem_chung_phieu (migration 0017) — cùng bảng, cùng hàm ghi/tỉ lệ/dọn.
--   * Mã hộp do engine dựng (luangiai/tuvi_hai_nguoi.py): `hn.<tiêu chí>.<loại>.<quan hệ>` — CHỈ tiêu chí (menh · can ·
--     chi · cung_phi · tu_vi), loại quan hệ giữa hai năm sinh (tương sinh, tam hợp, Diên Niên…) và quan hệ người dùng chọn.
--     KHÔNG tên, ngày sinh, năm, can chi của ai. Chỉ những loại có thể thành HỘP (kết luận "Hợp" hoặc "Cần dung hoà");
--     loại chỉ ra "Bình hoà" không bao giờ có hộp nên không nhận. Danh mục khớp engine — test engine
--     tests/test_kiem_chung_ma.py đọc chính các mảng dưới đây và so với hằng số engine (hai chiều).
--   * `phai` = phiên bản luật chấm (`hai_nguoi_1`, `PHIEN_BAN_DIEM` của engine) → nhận `hai_nguoi_<số>`.
--   * Phần còn lại của hàm giữ nguyên 0017 (phi_hoa · nhip_3_thang · doi_song), mảng cố định tách thành hằng có tên để
--     test đọc được. Riêng nhip_3_thang nhận thêm lý do `kn` (Kỵ tháng rơi thẳng vào Mệnh / Tài / Quan — NHIP-3,
--     2026-10-22); trước khi chạy 0021, phiếu tháng có lý do này bị hàm 0017 từ chối (web báo `tu_choi`).
-- Không BEGIN/COMMIT (chạy bằng psql -1 hoặc SQL Editor). Chạy SAU 0017 (cần bảng kiem_chung_phieu).
-- Rollback: 0021_kiem_chung_hai_nguoi.down.sql (xoá phiếu loại hai_nguoi, trả ràng buộc + hàm về 0017).

alter table kiem_chung_phieu drop constraint if exists kiem_chung_phieu_loai_check;
alter table kiem_chung_phieu add constraint kiem_chung_phieu_loai_check
    check (loai in ('phi_hoa', 'nhip_3_thang', 'doi_song', 'hai_nguoi'));

-- Mã có hợp lệ không (dùng chung ghi + kiểm thử). phi_hoa / nhip_3_thang: danh mục cố định (khớp web/lib/kiem-chung.ts
-- và calc/tuvi_luu_nguyet.PHAI). doi_song: mã `ds.*` engine dựng (khuôn doi_song_1). hai_nguoi: danh mục cố định `c_hn_*`.
create or replace function kiem_chung_ma_hop_le(p_loai text, p_mau text, p_phai text) returns boolean
    language plpgsql immutable set search_path = '' as $$
declare
    c_cung constant text[] := array['menh','phu_mau','phuc_duc','dien_trach','quan_loc','no_boc',
                                    'thien_di','tat_ach','tai_bach','tu_nu','phu_the','huynh_de'];
    c_phai_nhip constant text[] := array['dau_quan_thai_tue','dau_quan_tieu_han','tieu_han','luu_nien','dia_chi_thang'];
    c_hn_quan_he constant text[] := array['nguoi_yeu','vo_chong','ban_be','dong_nghiep','doi_tac','sep','cha_me_con',
                                          'gia_dinh'];
    c_hn_menh constant text[] := array['tuong_sinh','tuong_khac'];
    c_hn_can constant text[] := array['ngu_hop','tuong_sinh','tuong_khac','tuong_xung'];
    c_hn_chi constant text[] := array['tam_hop','luc_hop','tu_hanh_xung','luc_hai','tuong_hinh','luc_xung'];
    c_hn_cung_phi constant text[] := array['sinh_khi','dien_nien','thien_y','hoa_hai','luc_sat','ngu_quy','tuyet_menh'];
    c_hn_tu_vi constant text[] := array['hop','can_dung_hoa'];
    v text[] := string_to_array(coalesce(p_mau, ''), '.');
begin
    if p_mau is null or p_mau !~ '^[a-z0-9_.+-]{3,60}$' or p_phai is null or p_phai !~ '^[a-z0-9_]{2,32}$' then
        return false;
    end if;
    if p_loai = 'phi_hoa' then
        return p_phai = 'phi_tinh' and coalesce(array_length(v, 1), 0) = 4
           and v[1] = any (array['mau','ky_xung','loc_nhap','tu_hoa'])
           and v[2] = any (c_cung)
           and v[3] = any (array['loc','quyen','khoa','ky'])
           and v[4] = any (c_cung || array['tu']);
    elsif p_loai = 'nhip_3_thang' then
        return p_phai = any (c_phai_nhip) and coalesce(array_length(v, 1), 0) = 2
           and v[1] = any (array['thuan','binh','can_than'])
           and (v[2] = '-' or string_to_array(v[2], '+') <@ array['ck','kg','kn','kx','ln','sl']);
    elsif p_loai = 'doi_song' then
        return p_mau ~ '^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$';
    elsif p_loai = 'hai_nguoi' then
        return p_phai ~ '^hai_nguoi_[0-9]{1,3}$' and coalesce(array_length(v, 1), 0) = 4 and v[1] = 'hn'
           and v[4] = any (c_hn_quan_he)
           and coalesce(case v[2]
                   when 'menh' then v[3] = any (c_hn_menh)
                   when 'can' then v[3] = any (c_hn_can)
                   when 'chi' then v[3] = any (c_hn_chi)
                   when 'cung_phi' then v[3] = any (c_hn_cung_phi)
                   when 'tu_vi' then v[3] = any (c_hn_tu_vi)
               end, false);
    end if;
    return false;
end
$$;

revoke all on function kiem_chung_ma_hop_le(text, text, text) from public, anon, authenticated;
