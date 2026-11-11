-- Rollback 0034: trả `ghi_kiem_chung` về NGUYÊN VĂN 6 tham số của 0017, bỏ hàm tỉ lệ theo ngôn ngữ, bỏ cột ngon_ngu.
drop function if exists ty_le_kiem_chung_ngon_ngu(integer);
drop function if exists ghi_kiem_chung(text, uuid, text, text, text, text, text);
create or replace function ghi_kiem_chung(p_khoa text, p_user_id uuid, p_loai text, p_mau text, p_phai text,
                                          p_ket_qua text) returns boolean
    language plpgsql security definer set search_path = '' as $$
begin
    if p_ket_qua is null or p_ket_qua not in ('dung', 'chua_dung') then return false; end if;
    if p_khoa is null or p_khoa !~ '^[a-f0-9]{32,64}$' then return false; end if;
    if not public.kiem_chung_ma_hop_le(p_loai, p_mau, p_phai) then return false; end if;
    -- Chặn bơm: một khoá tối đa 3000 mã còn hạn (người thật bấm vài chục).
    if not exists (select 1 from public.kiem_chung_phieu where khoa = p_khoa and loai = p_loai and mau = p_mau)
       and (select count(*) from public.kiem_chung_phieu where khoa = p_khoa) >= 3000 then
        return false;
    end if;
    insert into public.kiem_chung_phieu as k (khoa, user_id, loai, mau, phai, ket_qua)
    values (p_khoa, p_user_id, p_loai, p_mau, p_phai, p_ket_qua)
    on conflict (khoa, loai, mau) do update
        set ket_qua = excluded.ket_qua, phai = excluded.phai, user_id = coalesce(excluded.user_id, k.user_id),
            cap_nhat = now(), het_han = now() + interval '24 months';
    return true;
end
$$;
revoke all on function ghi_kiem_chung(text, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function ghi_kiem_chung(text, uuid, text, text, text, text) to service_role;
drop index if exists kiem_chung_phieu_mau_ngon_ngu;
alter table kiem_chung_phieu drop constraint if exists kiem_chung_phieu_ngon_ngu_check;
alter table kiem_chung_phieu drop column if exists ngon_ngu;
