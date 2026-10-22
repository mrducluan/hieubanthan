-- Rollback 0021_kiem_chung_hai_nguoi.sql: xoá phiếu loại `hai_nguoi` (mất hẳn — đúng ý rollback; bắt buộc trước khi
-- trả ràng buộc cũ), trả ràng buộc `loai` và hàm kiem_chung_ma_hop_le về NGUYÊN VĂN 0017.
delete from kiem_chung_phieu where loai = 'hai_nguoi';
alter table kiem_chung_phieu drop constraint if exists kiem_chung_phieu_loai_check;
alter table kiem_chung_phieu add constraint kiem_chung_phieu_loai_check
    check (loai in ('phi_hoa', 'nhip_3_thang', 'doi_song'));

create or replace function kiem_chung_ma_hop_le(p_loai text, p_mau text, p_phai text) returns boolean
    language plpgsql immutable set search_path = '' as $$
declare
    c_cung constant text[] := array['menh','phu_mau','phuc_duc','dien_trach','quan_loc','no_boc',
                                    'thien_di','tat_ach','tai_bach','tu_nu','phu_the','huynh_de'];
    c_phai_nhip constant text[] := array['dau_quan_thai_tue','dau_quan_tieu_han','tieu_han','luu_nien','dia_chi_thang'];
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
           and (v[2] = '-' or string_to_array(v[2], '+') <@ array['ck','kg','kx','ln','sl']);
    elsif p_loai = 'doi_song' then
        return p_mau ~ '^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$';
    end if;
    return false;
end
$$;

revoke all on function kiem_chung_ma_hop_le(text, text, text) from public, anon, authenticated;
